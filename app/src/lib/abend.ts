import { and, eq, ne } from 'drizzle-orm';
import { db, termine, votes, besuche, wirtshaeuser, kasse, checkins, runWithTenant } from '@/lib/db';
import { alleGruppen } from '@/lib/db/directory';
import { getAktiveMitglieder, getVergabeStand, getStats } from '@/lib/queries';
import { vergabeWechsel, wechselTexte } from '@/lib/badges';
import { WACKELT_AB_UNENTSCHULDIGT, abendVorbei } from '@/lib/punkte';
import { hoibePreisCents, hoibePreisEuro, strafeFehlen } from '@/lib/preise';
import { appUrl, mailSignatur, tenantConfig } from '@/lib/tenant-config';
import { mailAn } from '@/lib/mail';
import { pushAn } from '@/lib/push';
import { anzeigeName } from '@/lib/namen';
import { newId, nowIso } from '@/lib/ids';

/**
 * Der Abend und sein Schluss (Julius, 16.10.2026): „Wer war da“ abhaken und
 * den nächsten Termin ausmachen macht oaner am Tisch (+2 WP), der Deckel
 * bleibt aber offen. Um 3 Uhr früh am Folgetag schließt sich der Abend dann
 * von allein: Runden in die Kasse, Strafen, Serien, Ämter-Wechsel.
 */

export const STRAFE_GRUND_PREFIX = 'Zugesagt & nicht erschienen';

function wirtshausNameVon(wirtshausId: string | null): string {
  return wirtshausId ? (db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wirtshausId)).get()?.name ?? 'Wirtshaus') : 'Wirtshaus';
}

/**
 * Kasse eines Abends neu aufbauen: geschmissene Runden (Teilnehmer × Hoibe,
 * zahlt sich am Tisch, also beglichen) und offene „zugesagt & ned kemma“-
 * Strafen für `strafIds`. Beglichene Strafen bleiben, wia sie san.
 */
export function abendKasseAufbauen(terminId: string, wirtshausId: string | null, strafIds: string[]) {
  const wirtshausName = wirtshausNameVon(wirtshausId);
  const alle = db.select().from(besuche).where(eq(besuche.terminId, terminId)).all();
  const dabei = alle.filter((b) => b.anwesend);

  // ⭐ Runden: zählt für Großbauer + Runden-WP, fließt ned in den Saldo
  const rundenWert = dabei.length * hoibePreisCents();
  db.delete(kasse).where(and(eq(kasse.terminId, terminId), eq(kasse.kind, 'runde'))).run();
  for (const b of dabei) {
    const anzahl = b.rundenBier + b.rundenSchnaps;
    for (let i = 0; i < anzahl; i++) {
      db.insert(kasse)
        .values({
          id: newId('k'), memberId: b.memberId, terminId,
          grund: `${anzahl > 1 ? `${i + 1}. ` : ''}Runde gschmissen im ${wirtshausName} 🍻 (${dabei.length} × ${hoibePreisEuro()} €)`,
          betragCents: rundenWert, kind: 'runde', status: 'beglichen', createdAt: nowIso(),
        })
        .run();
    }
  }

  // ❌ Zugesagt & nicht erschienen: Runde = Teilnehmer × Hoibe oder der feste Betrag vom Stammtisch
  const strafe = strafeFehlen(dabei.length);
  const alteStrafen = db.select().from(kasse).where(and(eq(kasse.terminId, terminId), eq(kasse.kind, 'strafe'))).all();
  for (const s of alteStrafen) {
    if (s.status === 'offen' && s.grund.startsWith(STRAFE_GRUND_PREFIX)) db.delete(kasse).where(eq(kasse.id, s.id)).run();
  }
  for (const memberId of strafIds) {
    if (dabei.some((b) => b.memberId === memberId)) continue; // doch no kemma
    const schonBeglichen = alteStrafen.some((s) => s.memberId === memberId && s.status === 'beglichen' && s.grund.startsWith(STRAFE_GRUND_PREFIX));
    if (schonBeglichen) continue;
    db.insert(kasse)
      .values({
        id: newId('k'), memberId, terminId,
        grund: `${STRAFE_GRUND_PREFIX}: ${strafe.text} im ${wirtshausName}`,
        betragCents: -strafe.cents, kind: 'strafe', status: 'offen', createdAt: nowIso(),
      })
      .run();
  }
}

/** Wer hat für diesen Abend scho a „zugesagt & ned kemma“-Strafe (offen oder beglichen)? */
function vermerkteStrafen(terminId: string): string[] {
  return db
    .select()
    .from(kasse)
    .where(and(eq(kasse.terminId, terminId), eq(kasse.kind, 'strafe')))
    .all()
    .filter((s) => s.memberId && s.grund.startsWith(STRAFE_GRUND_PREFIX))
    .map((s) => s.memberId!);
}

/**
 * Abend endgültig schließen (3 Uhr früh, oder später beim nächsten Lauf).
 * Hat koaner „Wer war da“ abgehakt, zählt, wer eingecheckt oder am Deckel
 * was eingetragen hat. Strafen gibt's dann nur, wenn's wer vermerkt hat.
 */
export async function abendSchliessen(terminId: string): Promise<boolean> {
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin || termin.phase === 'abgeschlossen') return false;

  // Für ALLE aktiven Mitglieder an Besuchs-Eintrag (wichtig für die Serien)
  const vorhanden = new Map(db.select().from(besuche).where(eq(besuche.terminId, terminId)).all().map((b) => [b.memberId, b]));
  const eingecheckt = new Set(db.select().from(checkins).where(eq(checkins.terminId, terminId)).all().map((c) => c.memberId));
  for (const m of getAktiveMitglieder()) {
    const alt = vorhanden.get(m.id);
    if (alt) {
      if (!alt.anwesend && eingecheckt.has(m.id)) db.update(besuche).set({ anwesend: true }).where(eq(besuche.id, alt.id)).run();
      continue;
    }
    db.insert(besuche).values({ id: newId('b'), terminId, memberId: m.id, anwesend: eingecheckt.has(m.id) }).run();
  }

  abendKasseAufbauen(terminId, termin.wirtshausId, vermerkteStrafen(terminId));

  // Schließen: wer abgehakt hat, steht als Abschließer drin (Schriftführer-Zählung, Archiv)
  const vorher = getVergabeStand(terminId);
  db.update(termine)
    .set({ phase: 'abgeschlossen', abgeschlossenVon: termin.erfasstVon, abgeschlossenAm: nowIso() })
    .where(eq(termine.id, terminId))
    .run();

  // 🥶 Beim 3. unentschuldigten Fehlen in Folge: einmalig a Strafrunde
  const dabeiIds = new Set(db.select().from(besuche).where(and(eq(besuche.terminId, terminId), eq(besuche.anwesend, true))).all().map((b) => b.memberId));
  const terminVotes = db.select().from(votes).where(eq(votes.terminId, terminId)).all();
  const strafe = strafeFehlen(dabeiIds.size);
  for (const s of getStats()) {
    if (s.unentschuldigtStreak !== WACKELT_AB_UNENTSCHULDIGT) continue;
    const heuteUnentschuldigt = !dabeiIds.has(s.member.id) && terminVotes.find((v) => v.memberId === s.member.id)?.wert !== 'ab';
    if (!heuteUnentschuldigt) continue;
    const schonVerhaengt = db
      .select()
      .from(kasse)
      .where(and(eq(kasse.terminId, terminId), eq(kasse.kind, 'strafe')))
      .all()
      .some((k) => k.memberId === s.member.id && /^Straf(runde|e):/.test(k.grund));
    if (schonVerhaengt) continue;
    db.insert(kasse)
      .values({
        id: newId('k'), memberId: s.member.id, terminId,
        grund: `${tenantConfig().strafeFehlenCents != null ? 'Strafe' : 'Strafrunde'}: 3× unentschuldigt gfehlt (${strafe.text})`,
        betragCents: -strafe.cents, kind: 'strafe', status: 'offen', createdAt: nowIso(),
      })
      .run();
  }

  // Badge-/Amt-Wechsel melden: an alle „Resi is jetza Heiwong!“, spöttisch an den Neuen, Gratulation an den Alten
  const nachher = getVergabeStand();
  const mitglieder = getAktiveMitglieder();
  const nameVon = (id: string) => {
    const m = mitglieder.find((x) => x.id === id);
    return m ? anzeigeName(m) : '—';
  };
  const mailVon = (id: string | null) => mitglieder.find((x) => x.id === id)?.email;
  const sendungen: Promise<void>[] = [];
  for (const w of vergabeWechsel(vorher, nachher)) {
    const neuName = nameVon(w.neuId);
    const texte = wechselTexte(w, neuName);
    const alleAnderen = mitglieder.filter((m) => m.id !== w.neuId && m.id !== w.altId).map((m) => m.id);
    sendungen.push(
      pushAn([w.neuId], `${w.icon} ${w.label}-Wechsel!`, texte.anNeuen, '/spezln'),
      pushAn(alleAnderen, `${w.icon} ${w.label}-Wechsel!`, texte.anAlle, '/spezln'),
    );
    if (w.altId) sendungen.push(pushAn([w.altId], `${w.icon} ${w.label}-Wechsel!`, texte.anAlten, '/spezln'));
    const neuMail = mailVon(w.neuId);
    const altMail = mailVon(w.altId);
    if (neuMail) sendungen.push(mailAn([neuMail], `${w.icon} ${w.label}-Wechsel!`, `Servus ${neuName}!\n\n${texte.anNeuen}\n\n→ ${appUrl('/spezln')}\n\n${mailSignatur()}`));
    if (altMail && w.altId) sendungen.push(mailAn([altMail], `${w.icon} ${w.label}-Wechsel!`, `Servus ${nameVon(w.altId)}!\n\n${texte.anAlten}\n\n→ ${appUrl('/spezln')}\n\n${mailSignatur()}`));
  }
  await Promise.allSettled(sendungen);
  return true;
}

/** Nur Abende der letzten Tage schließen sich von allein, ältere bleiben fürs Orga-Team. */
const AUTO_SCHLUSS_MAX_TAGE = 3;

function vorTagen(tage: number, jetztIso: string): string {
  const d = new Date(jetztIso);
  d.setUTCDate(d.getUTCDate() - tage);
  return d.toISOString().slice(0, 10);
}

/** Alle Abende des gebundenen Stammtischs schließen, deren 3-Uhr-Grenze rum is. */
export async function abgelaufeneAbendeSchliessen(): Promise<number> {
  const jetzt = nowIso();
  let n = 0;
  const offen = db.select().from(termine).where(ne(termine.phase, 'abgeschlossen')).all();
  for (const t of offen) {
    // Nur echte Abende: reserviert/heute, oder scho abgehakt. A vergessene Planung bleibt stehen.
    const warAbend = t.phase === 'heute' || t.phase === 'reserviert' || !!t.erfasstVon;
    // Uralte Hänger (vor Einführung liegengeblieben) ned still im Hintergrund zuamachen
    const frisch = t.datum >= vorTagen(AUTO_SCHLUSS_MAX_TAGE, jetzt);
    if (warAbend && frisch && abendVorbei(t, jetzt) && (await abendSchliessen(t.id))) n += 1;
  }
  return n;
}

/** Läuft im Server alle paar Minuten (instrumentation-node): jeden aktiven Stammtisch durchgehen. */
export async function abendeAllerStammtischeSchliessen(): Promise<void> {
  for (const g of alleGruppen()) {
    if (g.status !== 'aktiv') continue;
    try {
      const n = await runWithTenant(g.id, () => abgelaufeneAbendeSchliessen());
      if (n > 0) console.log(`[abend] ${g.id}: ${n} Abend(e) automatisch geschlossen`);
    } catch (e) {
      console.error(`[abend] ${g.id}:`, e);
    }
  }
}

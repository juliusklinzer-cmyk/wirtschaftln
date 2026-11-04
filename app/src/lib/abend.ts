import { and, eq, ne } from 'drizzle-orm';
import { db, termine, besuche, wirtshaeuser, kasse, checkins, runWithTenant } from '@/lib/db';
import { alleGruppen } from '@/lib/db/directory';
import { getAktiveMitglieder, getVergabeStand } from '@/lib/queries';
import { vergabeWechsel, wechselTexte } from '@/lib/badges';
import { abendVorbei } from '@/lib/punkte';
import { abendStrafenBuchen, autoStrafenPruefen } from '@/lib/strafen';
import { pushAn } from '@/lib/push';
import { anzeigeName } from '@/lib/namen';
import { newId, nowIso } from '@/lib/ids';

/**
 * Der Abend und sein Schluss (Julius, 16.10.2026): „Wer war da“ abhaken und
 * den nächsten Termin ausmachen macht oaner am Tisch (+2 WP), der Deckel
 * bleibt aber offen. Um 3 Uhr früh am Folgetag schließt sich der Abend dann
 * von allein: Runden in die Kasse, Strafen, Serien, Ämter-Wechsel.
 */

function wirtshausNameVon(wirtshausId: string | null): string {
  return wirtshausId ? (db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, wirtshausId)).get()?.name ?? 'Wirtshaus') : 'Wirtshaus';
}

/**
 * Geschmissene Runden eines Abends in die Kasse (zahlt sich am Tisch, also
 * beglichen, ohne Geldwert seit dem Strafenkatalog 04.11.2026). Zählen für
 * Großbauer und Runden-WP, fließen ned in den Saldo.
 */
export function abendRundenAufbauen(terminId: string, wirtshausId: string | null) {
  const wirtshausName = wirtshausNameVon(wirtshausId);
  const dabei = db.select().from(besuche).where(and(eq(besuche.terminId, terminId), eq(besuche.anwesend, true))).all();
  db.delete(kasse).where(and(eq(kasse.terminId, terminId), eq(kasse.kind, 'runde'))).run();
  for (const b of dabei) {
    const anzahl = b.rundenBier + b.rundenSchnaps;
    for (let i = 0; i < anzahl; i++) {
      db.insert(kasse)
        .values({
          id: newId('k'), memberId: b.memberId, terminId,
          grund: `${anzahl > 1 ? `${i + 1}. ` : ''}Runde gschmissen im ${wirtshausName} 🍻`,
          betragCents: 0, kind: 'runde', status: 'beglichen', createdAt: nowIso(),
        })
        .run();
    }
  }
}

/**
 * Abend endgültig schließen (3 Uhr früh, oder später beim nächsten Lauf).
 * Hat koaner „Wer war da“ abgehakt, zählt, wer eingecheckt oder am Deckel
 * was eingetragen hat. Die Strafen bucht der Katalog (lib/strafen.ts).
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

  abendRundenAufbauen(terminId, termin.wirtshausId);

  // Schließen: wer abgehakt hat, steht als Abschließer drin (Schriftführer-Zählung, Archiv)
  const vorher = getVergabeStand(terminId);
  db.update(termine)
    .set({ phase: 'abgeschlossen', abgeschlossenVon: termin.erfasstVon, abgeschlossenAm: nowIso() })
    .where(eq(termine.id, terminId))
    .run();

  // Strafen aus dem Katalog: unentschuldigt, 3× in Folge (einmalig, mit Nachricht)
  await abendStrafenBuchen(terminId);

  // Badge-/Amt-Wechsel melden: an alle „Resi is jetza Heiwong!“, spöttisch an den Neuen, Gratulation an den Alten
  const nachher = getVergabeStand();
  const mitglieder = getAktiveMitglieder();
  const nameVon = (id: string) => {
    const m = mitglieder.find((x) => x.id === id);
    return m ? anzeigeName(m) : '—';
  };
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
      // Automatische eigene Strafen (Reservierung, Abstimmen, Bewertung, Orga-Flop)
      const s = await runWithTenant(g.id, () => autoStrafenPruefen());
      if (s > 0) console.log(`[strafen] ${g.id}: ${s} automatisch gebucht`);
    } catch (e) {
      console.error(`[abend] ${g.id}:`, e);
    }
  }
}

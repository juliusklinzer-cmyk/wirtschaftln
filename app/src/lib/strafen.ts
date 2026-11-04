import { and, eq } from 'drizzle-orm';
import { db, strafen, kasse, besuche, votes, termine, wirtshaeuser, members } from '@/lib/db';
import { getAktiveMitglieder, getPraesidentId, getStats } from '@/lib/queries';
import { WACKELT_AB_UNENTSCHULDIGT } from '@/lib/punkte';
import { tenantConfig } from '@/lib/tenant-config';
import { pushAn } from '@/lib/push';
import { mailAn } from '@/lib/mail';
import { mailStrafe, berlinNachUtc } from '@/lib/mail-vorlagen';
import { mailRahmen, rufname, willMail } from '@/lib/mail-rahmen';
import { anzeigeName } from '@/lib/namen';
import { newId, nowIso } from '@/lib/ids';
import { katalog, festeRegel, fehltUnentschuldigt, folgeWort, STRAFEN_KATALOG_AB, type Regel } from '@/lib/strafen-regeln';

/**
 * Strafen buchen (Strafenkatalog, 04.11.2026). WP und Betrag werden beim
 * Buchen eingefroren, ein €-Anteil steht zusätzlich als offene Forderung
 * in der Kasse. Benachrichtigt wird genau einmal pro Buchung.
 */

type Mitglied = typeof members.$inferSelect;
type Buchung = typeof strafen.$inferSelect;

function wirtshausVon(terminId: string | null): string | null {
  if (!terminId) return null;
  const t = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!t?.wirtshausId) return null;
  return db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, t.wirtshausId)).get()?.name ?? null;
}

/** Buchung + ggf. Kassenzeile anlegen. */
function anlegen(d: { regel: Regel; memberId: string; terminId: string | null; wp: number | null; gebuchtVon: string | null; auto?: boolean }): Buchung {
  const jetzt = nowIso();
  const kasseId = d.regel.betragCents > 0 ? newId('k') : null;
  const ort = wirtshausVon(d.terminId);
  const buchung: Buchung = {
    id: newId('st'), regelId: d.regel.id, art: d.regel.art, name: d.regel.name, memberId: d.memberId, terminId: d.terminId,
    wp: d.wp, betragCents: d.regel.betragCents, kasseId, status: 'offen', gebuchtVon: d.gebuchtVon, benachrichtigt: false, auto: !!d.auto, createdAt: jetzt,
  };
  // In einer Transaktion: kracht der eindeutige Index (zwei Läufe gleichzeitig), bleibt auch keine Kassenzeile übrig
  db.transaction((tx) => {
    if (kasseId) {
      tx.insert(kasse)
        .values({
          id: kasseId, memberId: d.memberId, terminId: d.terminId,
          grund: ort ? `${d.regel.name} im ${ort}` : d.regel.name,
          betragCents: -d.regel.betragCents, kind: 'strafe', status: 'offen', gemeldetVon: d.gebuchtVon, createdAt: jetzt,
        })
        .run();
    }
    tx.insert(strafen).values(buchung).run();
  });
  return buchung;
}

/** Auto-Buchung anlegen, ein paralleler Lauf war schneller (eindeutiger Index) → nix tun. */
function einmalig(f: () => void) {
  try {
    f();
  } catch (e) {
    if (!String(e).includes('UNIQUE')) throw e;
  }
}

/** Buchung samt offener Kassenzeile löschen, wenn sie schon gemeldet war: Push „zurückgenommen“. */
async function loeschen(b: Buchung): Promise<void> {
  if (b.kasseId) db.delete(kasse).where(eq(kasse.id, b.kasseId)).run();
  db.delete(strafen).where(eq(strafen.id, b.id)).run();
  if (b.benachrichtigt) await pushAn([b.memberId], 'Strafe zurückgenommen', `„${b.name}“ ist wieder weg.`, '/kasse');
}

/** Ist die Buchung schon bezahlt (dann bleibt sie, wie sie ist)? */
function beglichen(b: Buchung): boolean {
  if (!b.kasseId) return false;
  return db.select().from(kasse).where(eq(kasse.id, b.kasseId)).get()?.status === 'beglichen';
}

/** Push + Mail für eine Buchung, danach als benachrichtigt markieren. */
async function melden(b: Buchung, opfer: Mitglied, von: string | null): Promise<void> {
  db.update(strafen).set({ benachrichtigt: true }).where(eq(strafen.id, b.id)).run();
  const wpAbzug = b.wp != null ? Math.max(0, -b.wp) : 0;
  const folge = folgeWort(b.betragCents, wpAbzug);
  const paypal = tenantConfig().istGruender;
  const text = `${von ? `${von} hat dir` : 'Die App hat dir'} „${b.name}“ gebucht: ${folge}.${b.betragCents > 0 ? ' Zahlen beim Kassenwart.' : ''}`;
  const mail = mailStrafe(mailRahmen(), { name: rufname(opfer), von, strafe: b.name, folge, zahlen: b.betragCents > 0, paypal });
  await Promise.allSettled([
    pushAn([opfer.id], 'Strafe gebucht', text, '/kasse'),
    willMail(opfer, 'kasse') ? mailAn([opfer.email], mail.betreff, mail.inhalt) : Promise.resolve(),
  ]);
}

/**
 * Feste Strafen eines Abends (neu) buchen: unentschuldigt für alle, die
 * gefehlt und nicht rechtzeitig abgesagt haben, und nach dem Abschluss
 * die Serien-Strafe beim 3. Mal in Folge. Upsert über (termin, art, member):
 * vorhandene bleiben, weggefallene offene werden gelöscht, beglichene und
 * erlassene nie angefasst. Benachrichtigt wird erst nach dem Abschluss.
 */
export async function abendStrafenBuchen(terminId: string): Promise<void> {
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin || termin.datum < STRAFEN_KATALOG_AB) return;
  const regeln = katalog();
  const regelU = festeRegel('unentschuldigt', regeln);
  const regelE = festeRegel('entschuldigt', regeln);
  const regelS = festeRegel('serie', regeln);

  const besuchVon = new Map(db.select().from(besuche).where(eq(besuche.terminId, terminId)).all().map((b) => [b.memberId, b]));
  const voteVon = new Map(db.select().from(votes).where(eq(votes.terminId, terminId)).all().map((v) => [v.memberId, v]));
  const vorhanden = db.select().from(strafen).where(eq(strafen.terminId, terminId)).all().filter((b) => b.art !== 'eigene');
  const mitglieder = getAktiveMitglieder();
  const jobs: Promise<void>[] = [];

  // ── Unentschuldigt (immer gebucht, friert den Status ein) und entschuldigt (nur wenn's Geld kostet) ──
  const soll = new Set<string>();
  const entschuldigtSoll = new Set<string>();
  for (const m of mitglieder) {
    const besuch = besuchVon.get(m.id);
    if (besuch?.anwesend) continue;
    if (!besuch && m.createdAt.slice(0, 10) > termin.datum) continue; // erst danach dazugekommen
    if (fehltUnentschuldigt(voteVon.get(m.id), termin, regelU)) soll.add(m.id);
    else if (regelE?.aktiv && regelE.betragCents > 0) entschuldigtSoll.add(m.id);
  }
  for (const b of vorhanden.filter((x) => x.art === 'entschuldigt')) {
    if (entschuldigtSoll.has(b.memberId)) entschuldigtSoll.delete(b.memberId);
    else if (b.status === 'offen' && !beglichen(b)) jobs.push(loeschen(b));
  }
  for (const memberId of entschuldigtSoll) einmalig(() => anlegen({ regel: regelE!, memberId, terminId, wp: null, gebuchtVon: null }));
  for (const b of vorhanden.filter((x) => x.art === 'unentschuldigt')) {
    if (soll.has(b.memberId)) soll.delete(b.memberId);
    else if (b.status === 'offen' && !beglichen(b)) jobs.push(loeschen(b));
  }
  for (const memberId of soll) einmalig(() => anlegen({ regel: regelU!, memberId, terminId, wp: null, gebuchtVon: null }));

  // ── 3× unentschuldigt in Folge (erst wenn der Abend zu ist, sonst stimmt die Serie noch nicht) ──
  if (termin.phase === 'abgeschlossen') {
    const serieSoll = new Set<string>();
    if (regelS?.aktiv) {
      const unentschuldigtHeute = new Set(
        db.select().from(strafen).where(and(eq(strafen.terminId, terminId), eq(strafen.art, 'unentschuldigt'), eq(strafen.status, 'offen'))).all().map((b) => b.memberId),
      );
      for (const s of getStats()) {
        if (s.unentschuldigtStreak === WACKELT_AB_UNENTSCHULDIGT && unentschuldigtHeute.has(s.member.id)) serieSoll.add(s.member.id);
      }
    }
    for (const b of vorhanden.filter((x) => x.art === 'serie')) {
      if (serieSoll.has(b.memberId)) serieSoll.delete(b.memberId);
      else if (b.status === 'offen' && !beglichen(b)) jobs.push(loeschen(b));
    }
    for (const memberId of serieSoll) einmalig(() => anlegen({ regel: regelS!, memberId, terminId, wp: null, gebuchtVon: null }));

    // Benachrichtigen: nur Buchungen mit Geld (die WP-Abzüge laufen still wie bisher)
    const neu = db.select().from(strafen).where(and(eq(strafen.terminId, terminId), eq(strafen.benachrichtigt, false), eq(strafen.status, 'offen'))).all();
    for (const b of neu) {
      if (b.art === 'eigene' || b.betragCents <= 0) continue;
      const opfer = mitglieder.find((m) => m.id === b.memberId);
      if (opfer) jobs.push(melden(b, opfer, null));
    }
  }
  await Promise.allSettled(jobs);
}

/** Eigene Strafe buchen (Zettel oder Kasse), darf jeder. Der Spezl kriegt sofort Bescheid. */
export async function strafeBuchen(me: Mitglied, memberId: string, regelId: string, terminId: string | null): Promise<{ ok: boolean; meldung: string }> {
  const regel = katalog().find((r) => r.id === regelId);
  if (!regel || regel.art !== 'eigene' || !regel.aktiv) return { ok: false, meldung: 'Diese Strafe gibt’s nicht (mehr).' };
  if (regel.ausloeser) return { ok: false, meldung: 'Die bucht die App von allein.' };
  const opfer = getAktiveMitglieder().find((m) => m.id === memberId);
  if (!opfer) return { ok: false, meldung: 'Den Spezl gibt’s nicht.' };
  if (terminId && !db.select().from(termine).where(eq(termine.id, terminId)).get()) return { ok: false, meldung: 'Den Termin gibt’s nicht.' };
  const wp = regel.wpStaffel[0] ?? 0;
  const b = anlegen({ regel, memberId, terminId, wp: wp || null, gebuchtVon: me.id });
  await melden(b, opfer, anzeigeName(me));
  return { ok: true, meldung: `${anzeigeName(opfer)}: ${regel.name}, ${folgeWort(regel.betragCents, Math.max(0, -wp))}.` };
}

/** Darf `me` diese Buchung zurücknehmen? Wer gebucht hat, Präsident, Admin; solange der Abend offen bzw. die Forderung offen ist. */
export function darfZuruecknehmen(me: Mitglied, b: Buchung): boolean {
  if (b.art !== 'eigene' || b.status !== 'offen' || beglichen(b)) return false;
  if (b.terminId) {
    const t = db.select().from(termine).where(eq(termine.id, b.terminId)).get();
    if (t?.phase === 'abgeschlossen') return false;
  }
  return b.gebuchtVon === me.id || me.role === 'admin' || me.id === getPraesidentId();
}

export async function strafeZuruecknehmen(me: Mitglied, strafeId: string): Promise<boolean> {
  const b = db.select().from(strafen).where(eq(strafen.id, strafeId)).get();
  if (!b || !darfZuruecknehmen(me, b)) return false;
  await loeschen(b);
  return true;
}

/**
 * Darf `me` erlassen? Admin immer. Präsident nur, wenn die Regel erlassbar
 * ist und es nicht seine eigene Strafe ist. Bezahlte Strafen erst zurück auf offen.
 */
export function darfErlassen(me: Mitglied, b: Pick<Buchung, 'regelId' | 'memberId' | 'status' | 'kasseId'> & { id?: string }): boolean {
  if (b.status !== 'offen') return false;
  if (b.kasseId && db.select().from(kasse).where(eq(kasse.id, b.kasseId)).get()?.status !== 'offen') return false;
  if (me.role === 'admin') return true;
  if (me.id !== getPraesidentId() || b.memberId === me.id) return false;
  const regel = b.regelId ? katalog().find((r) => r.id === b.regelId) : null;
  return regel ? regel.erlassbar : true;
}

/** Erlassen: WP und € zurück. Bei „unentschuldigt“ zählt das Fehlen danach als entschuldigt. */
export async function strafeErlassen(me: Mitglied, strafeId: string): Promise<boolean> {
  const b = db.select().from(strafen).where(eq(strafen.id, strafeId)).get();
  if (!b || !darfErlassen(me, b)) return false;
  db.update(strafen).set({ status: 'erlassen' }).where(eq(strafen.id, b.id)).run();
  if (b.kasseId) db.update(kasse).set({ status: 'aufgehoben' }).where(eq(kasse.id, b.kasseId)).run();
  // Ohne das Unentschuldigt fällt evtl. die Serien-Strafe weg
  if (b.terminId && b.art === 'unentschuldigt') await abendStrafenBuchen(b.terminId);
  return true;
}

/** Buchung zu einer Kassenzeile (für die Erlassen-Rechte im Kassenbuch). */
export function buchungZurKasse(kasseId: string): Buchung | undefined {
  return db.select().from(strafen).where(eq(strafen.kasseId, kasseId)).get();
}

/** Kassenwart setzt eine Forderung zurück auf offen: eine erlassene Buchung lebt wieder auf. */
export function buchungStatusAusKasse(kasseId: string, status: 'offen' | 'beglichen' | 'aufgehoben') {
  const b = buchungZurKasse(kasseId);
  if (!b) return;
  db.update(strafen).set({ status: status === 'aufgehoben' ? 'erlassen' : 'offen' }).where(eq(strafen.id, b.id)).run();
}

/** Zeitpunkt „bis 24 Uhr am Tag `datum` + `tage`“ (Berliner Zeit) als UTC-Millisekunden. */
function tagesEnde(datum: string, tage: number): number {
  const d = new Date(`${datum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + tage + 1);
  return berlinNachUtc(d.toISOString().slice(0, 10), '00:00').getTime();
}

/**
 * Automatische eigene Strafen (Julius, 04.11.2026): läuft alle paar Minuten
 * im Hintergrund. Gebucht wird nur, wenn die Frist NACH dem Anlegen bzw.
 * Ändern der Regel abgelaufen ist (nix rückwirkend), je Termin, Regel und
 * Spezl genau einmal.
 */
export async function autoStrafenPruefen(jetztIso = nowIso()): Promise<number> {
  const jetzt = Date.parse(jetztIso);
  const regeln = katalog().filter((r) => r.art === 'eigene' && r.aktiv && r.ausloeser);
  if (regeln.length === 0) return 0;
  const alleTermine = db.select().from(termine).all().filter((t) => t.datum >= STRAFEN_KATALOG_AB);
  const mitglieder = getAktiveMitglieder();
  const neu: Array<{ b: Buchung; opfer: Mitglied }> = [];
  const buchen = (regel: Regel, terminId: string, memberId: string) => {
    const opfer = mitglieder.find((m) => m.id === memberId);
    if (!opfer) return;
    einmalig(() => {
      const wp = regel.wpStaffel[0] ?? 0;
      neu.push({ b: anlegen({ regel, memberId, terminId, wp: wp || null, gebuchtVon: null, auto: true }), opfer });
    });
  };
  const schonGebucht = new Set(db.select().from(strafen).all().filter((b) => b.auto).map((b) => `${b.terminId}:${b.regelId}:${b.memberId}`));

  for (const r of regeln) {
    const ab = Date.parse(r.geaendertAm ?? r.erstelltAm);
    const x = Math.max(0, r.ausloeserWert);
    const faellig = (frist: number) => jetzt >= frist && frist >= ab;
    for (const t of alleTermine) {
      const offen = (memberId: string) => !schonGebucht.has(`${t.id}:${r.id}:${memberId}`);
      if (r.ausloeser === 'reservierung') {
        // „bis x Tage vorher reserviert“: Frist = 24 Uhr, x Tage vor dem Termin
        if (t.phase === 'planung' && t.planerId && faellig(tagesEnde(t.datum, -x)) && offen(t.planerId)) buchen(r, t.id, t.planerId);
      } else if (r.ausloeser === 'abstimmen') {
        if (t.phase === 'abgeschlossen' || !faellig(tagesEnde(t.datum, -x))) continue;
        const gestimmt = new Set(db.select().from(votes).where(eq(votes.terminId, t.id)).all().filter((v) => v.wert !== 'vielleicht').map((v) => v.memberId));
        for (const m of mitglieder) if (!gestimmt.has(m.id) && m.createdAt.slice(0, 10) <= t.datum && offen(m.id)) buchen(r, t.id, m.id);
      } else if (r.ausloeser === 'bewertung') {
        if (t.phase !== 'abgeschlossen' || !faellig(tagesEnde(t.datum, x))) continue;
        for (const b of db.select().from(besuche).where(eq(besuche.terminId, t.id)).all()) {
          const bewertet = b.sterne != null || !!b.kommentar?.trim() || b.kaiserSterne != null || b.brodnSterne != null;
          if (b.anwesend && !bewertet && offen(b.memberId)) buchen(r, t.id, b.memberId);
        }
      } else if (r.ausloeser === 'orga_flop') {
        if (t.phase !== 'abgeschlossen' || !t.planerId || !t.abgeschlossenAm) continue;
        if (!faellig(Date.parse(t.abgeschlossenAm) + 7 * 86_400_000)) continue;
        const sterne = db.select().from(besuche).where(eq(besuche.terminId, t.id)).all().filter((b) => b.anwesend && b.sterne != null).map((b) => b.sterne!);
        if (sterne.length < 2) continue;
        const schnitt = sterne.reduce((a, b) => a + b, 0) / sterne.length;
        if (schnitt < x && offen(t.planerId)) buchen(r, t.id, t.planerId);
      }
    }
  }
  await Promise.allSettled(neu.map(({ b, opfer }) => melden(b, opfer, null)));
  return neu.length;
}

import { asc, eq, and } from 'drizzle-orm';
import { db, strafenRegeln, votes, termine } from '@/lib/db';
import { alteFehlStrafeCents } from '@/lib/tenant-config';
import { berlinNachUtc } from '@/lib/mail-vorlagen';
import { berlinTag } from '@/lib/punkte';
import type { StrafenUebersicht } from '@/lib/tenant-config-public';

/**
 * Strafenkatalog (Julius, 04.11.2026): jeder Stammtisch stellt seine Strafen
 * selber ein. Die drei festen Regeln (unentschuldigt, entschuldigt, serie)
 * stehen von Anfang an drin, eigene legen Admin und Präsident an.
 * Hier nur Lesen und Regel-Logik, ohne Abhängigkeit zu queries.ts (die
 * braucht's für getStats). Buchen steht in lib/strafen.ts.
 */

export type Regel = typeof strafenRegeln.$inferSelect;
export type FesteArt = 'unentschuldigt' | 'entschuldigt' | 'serie';
type Vote = typeof votes.$inferSelect;
type Termin = Pick<typeof termine.$inferSelect, 'datum' | 'zeit'>;

/**
 * Ab diesem Termin-Datum wird „unentschuldigt“ beim Abschluss als Buchung
 * eingefroren. Ältere Abende rechnen weiter wie vorher (ab = entschuldigt).
 */
export const STRAFEN_KATALOG_AB = '2026-11-05';

/** Alter fester Betrag „Strafe fürs Fehlen“ einmalig in die Regel übernehmen (idempotent, ein UPDATE). */
function configUebernehmen() {
  const offen = db.select({ id: strafenRegeln.id }).from(strafenRegeln).where(eq(strafenRegeln.configUebernommen, false)).get();
  if (!offen) return;
  const cents = alteFehlStrafeCents() ?? 0;
  db.update(strafenRegeln)
    .set({ betragCents: cents, configUebernommen: true })
    .where(and(eq(strafenRegeln.art, 'unentschuldigt'), eq(strafenRegeln.configUebernommen, false)))
    .run();
}

/** Der ganze Katalog, feste zuerst, dann eigene in Anlege-Reihenfolge. */
export function katalog(): Regel[] {
  configUebernehmen();
  const alle = db.select().from(strafenRegeln).orderBy(asc(strafenRegeln.sort), asc(strafenRegeln.erstelltAm)).all();
  return [...alle.filter((r) => r.art !== 'eigene'), ...alle.filter((r) => r.art === 'eigene')];
}

/** Feste Regel einer Art (gibt's immer, Migration 0025). */
export function festeRegel(art: FesteArt, alle = katalog()): Regel | undefined {
  return alle.find((r) => r.art === art);
}

/** WP beim n-ten Mal in Folge (1-basiert), der letzte Staffelwert gilt ab da. */
export function staffelWert(staffel: number[], n: number): number {
  if (staffel.length === 0 || n < 1) return 0;
  return staffel[Math.min(n, staffel.length) - 1] ?? 0;
}

/** Ende der Absage-Frist als UTC-Zeitpunkt. */
export function fristEnde(termin: Termin, regel: Pick<Regel, 'fristArt' | 'fristWert'>): Date {
  const beginn = berlinNachUtc(termin.datum, termin.zeit || '19:00');
  if (regel.fristArt === 'stunden') return new Date(beginn.getTime() - regel.fristWert * 3_600_000);
  if (regel.fristArt === 'tage') {
    // „1 Tag vorher“ = bis 24 Uhr am Vortag = 0 Uhr am Termintag (Berliner Zeit)
    const d = new Date(`${termin.datum}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - Math.max(0, regel.fristWert - 1));
    return berlinNachUtc(d.toISOString().slice(0, 10), '00:00');
  }
  return beginn;
}

/** Rechtzeitig abgesagt? Eine Absage ohne Zeitstempel (vor dem Katalog) gilt als rechtzeitig. */
export function absageRechtzeitig(vote: Pick<Vote, 'wert' | 'abgesagtAm'>, termin: Termin, regel: Regel): boolean {
  if (vote.wert !== 'ab') return false;
  if (!vote.abgesagtAm) return true;
  return new Date(vote.abgesagtAm).getTime() <= fristEnde(termin, regel).getTime();
}

/**
 * Fehlt der Spezl unentschuldigt (er war NICHT da)? Ist die Regel
 * abgeschaltet, gilt jedes Fehlen als entschuldigt.
 */
export function fehltUnentschuldigt(vote: Pick<Vote, 'wert' | 'abgesagtAm'> | undefined, termin: Termin, regel: Regel | undefined): boolean {
  if (!regel?.aktiv) return false;
  if (!vote) return regel.nichtEingetragenZusage;
  if (vote.wert === 'ab') return !absageRechtzeitig(vote, termin, regel);
  return true; // zu oder vielleicht
}

/** „bis Mi, 24 Uhr“ / „bis 17 Uhr“: wann die Frist endet, für Hinweise. */
export function fristWort(termin: Termin, regel: Regel): string {
  const ende = fristEnde(termin, regel);
  if (regel.fristArt === 'tage') {
    const vortag = new Date(ende.getTime() - 60_000);
    const tag = vortag.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short' }).replace('.', '');
    return `${tag}, 24 Uhr`;
  }
  const tag = berlinTag(ende.toISOString()) === termin.datum ? '' : `${ende.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short' }).replace('.', '')}, `;
  const uhr = ende.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
  return `${tag}${uhr} Uhr`;
}

/** „20 € und 5 WP“, „5 WP“, „20 €“ für Texte. `wp` ist der Abzug als positive Zahl. */
export function folgeWort(cents: number, wp: number): string {
  const teile: string[] = [];
  if (cents > 0) teile.push(`${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })} €`);
  if (wp > 0) teile.push(`${wp} WP`);
  return teile.join(' und ') || 'nichts';
}

/** „bis zum Beginn“, „bis 24 Uhr am Vortag“, „bis 3 Std. vor Beginn“ (allgemein, ohne Termin). */
export function fristAllgemein(regel: Pick<Regel, 'fristArt' | 'fristWert'>): string {
  if (regel.fristArt === 'tage') return regel.fristWert <= 1 ? 'bis 24 Uhr am Vortag' : `bis 24 Uhr, ${regel.fristWert} Tage vorher`;
  if (regel.fristArt === 'stunden') return `bis ${regel.fristWert} Std. vor Beginn`;
  return 'bis zum Beginn';
}

/** Die festen Strafen kompakt für Client-Komponenten (Punktesystem-Erklärung). */
export function strafenUebersicht(alle = katalog()): StrafenUebersicht {
  const u = festeRegel('unentschuldigt', alle);
  const e = festeRegel('entschuldigt', alle);
  const s = festeRegel('serie', alle);
  return {
    unentschuldigt: { aktiv: !!u?.aktiv, staffel: u?.wpStaffel ?? [], cents: u?.betragCents ?? 0, frist: u ? fristAllgemein(u) : 'bis zum Beginn', nichtEingetragenZusage: u?.nichtEingetragenZusage ?? true },
    entschuldigt: { aktiv: !!e?.aktiv, staffel: e?.wpStaffel ?? [] },
    serie: { aktiv: !!s?.aktiv, wp: s?.wpStaffel[0] ?? 0, cents: s?.betragCents ?? 0 },
  };
}

/** „Absagen bis zum Beginn · −5/−10/−15 WP · 20 €“: kurz, was eine Strafe kostet. */
export function regelZusammenfassung(r: Regel): string {
  const staffel = r.wpStaffel.map((w) => (w === 0 ? '±0' : String(w))).join('/');
  const geld = r.betragCents > 0 ? folgeWort(r.betragCents, 0) : null;
  if (r.art === 'unentschuldigt') return [`Absagen ${fristAllgemein(r)}`, `${staffel} WP`, geld].filter(Boolean).join(' · ');
  if (r.art === 'entschuldigt') return `${staffel} WP`;
  const wp = r.wpStaffel[0] ?? 0;
  const folge = folgeWort(r.betragCents, -wp);
  if (r.art === 'serie') return folge === 'nichts' ? 'Nur die Frage „Bist du noch dabei?“' : folge;
  return folge;
}

/**
 * Hinweis an der Abstimmung, wenn die Absage-Strafe eine Frist hat: vor der
 * Frist „Absagen bis Mi, 24 Uhr. Danach …“, danach „Frist abgelaufen …“.
 * Die Folge ist persönlich (Staffel nach der eigenen Serie). null = nix zeigen.
 */
export function absageHinweis(
  termin: Termin,
  vote: Pick<Vote, 'wert' | 'abgesagtAm'> | undefined,
  unentschuldigtSerie: number,
  jetztIso: string,
  alle = katalog(),
): string | null {
  const u = festeRegel('unentschuldigt', alle);
  if (!u?.aktiv || u.fristArt === 'beginn') return null;
  const folge = folgeWort(u.betragCents, -staffelWert(u.wpStaffel, unentschuldigtSerie + 1));
  if (folge === 'nichts') return null;
  const jetzt = new Date(jetztIso).getTime();
  if (jetzt >= berlinNachUtc(termin.datum, termin.zeit || '19:00').getTime()) return null;
  if (jetzt <= fristEnde(termin, u).getTime()) return `Absagen bis ${fristWort(termin, u)}. Danach unentschuldigt, bei dir: ${folge}.`;
  if (vote?.wert === 'ab' && absageRechtzeitig(vote, termin, u)) return `Du hast rechtzeitig abgesagt. Wer jetzt umschwenkt und wieder absagt, zahlt ${folge}.`;
  return `Frist abgelaufen, eine Absage zählt jetzt als unentschuldigt: ${folge}.`;
}

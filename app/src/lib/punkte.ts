/**
 * Wirtschaftln-Punkte (WP), Punktesystem V2 (docs/spec-punktesystem-v2.md,
 * von Julius am 17.07.2026 festgelegt, Bewertung/Check-in am 27.08.2026):
 *
 *   Dabei +5 · Hoibe +1 · Taxi (gfahren & Spezln mitgnommen) +5 · Runde +5 ·
 *   Erster Abschluss +3 · Rechtzeitig abgstimmt +1 · Wirtshaus vorgschlagen +1
 *   (+1 wenn's besucht wird) · Eigene Bewertung +1 (mit Text no +1) ·
 *   Als Erster eingecheckt +1 · Organisiert 0–5 nach Bewertungsschnitt des Abends.
 *
 *   Jeder bewertet für sich, der Abend-Schnitt entsteht aus allen Einzel-
 *   Bewertungen (Kaisi/Brodn nur aus denen, die probiert haben).
 *
 *   Serie: fest je Abend verbucht (2. Besuch in Folge +1, 3. +2, … ungedeckelt) —
 *   a Riss löscht nix rückwirkend. Fehlen: abgsagt 0/−1/−5/−10 (gedeckelt),
 *   unentschuldigt −5/−10/−15 (gedeckelt, ab dem 3. Strafrunde + „wackelt").
 */
export const PTS = {
  hoibe: 1,
  teilnahme: 5,
  taxi: 5,
  runde: 5,
  abschluss: 3,
  abstimmen: 1,
  vorschlag: 1,
  vorschlagBesucht: 1,
  bewertung: 1,
  bewertungsText: 0, // Bewertung is EIN Punkt, Text gibt nix extra (Julius 12.09.2026)
  checkin: 1,
  orgaMax: 5,
} as const;

/** Ab so vielen unentschuldigten Fehlterminen in Folge „wackelt" ein Spezl (beim 3. gibt's die Strafrunde). */
export const WACKELT_AB_UNENTSCHULDIGT = 3;

/** Serienbonus des jeweiligen Abends: 1. Besuch 0, 2. in Folge +1, 3. +2, … (ungedeckelt, für immer verbucht). */
export function anwesenheitsBonus(besucheInFolge: number): number {
  return Math.max(0, besucheInFolge - 1);
}

/** Abzug am n-ten entschuldigten (= abgsagten) Fehltermin in Folge: 0 / −1 / −5 / −10 (gedeckelt). */
export function entschuldigtMalus(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return -1;
  if (n === 3) return -5;
  return -10;
}

/** Abzug am n-ten unentschuldigten Fehltermin in Folge: −5 / −10 / ab dem 3. −15 (gedeckelt). */
export function unentschuldigtMalus(n: number): number {
  if (n <= 1) return -5;
  if (n === 2) return -10;
  return -15;
}

/** Orga-WP: kaufmännisch gerundeter Sterne-Schnitt des Abends, 0–5 (ohne Bewertung 0). */
export function orgaPunkte(schnitt: number): number {
  if (!Number.isFinite(schnitt) || schnitt <= 0) return 0;
  return Math.max(0, Math.min(PTS.orgaMax, Math.round(schnitt)));
}

/** ISO-Zeitstempel → Kalendertag (YYYY-MM-DD) in Europe/Berlin, für den Fristvergleich. */
export function berlinTag(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}

/** ISO-Zeitstempel → Uhrzeit (HH:MM) in Europe/Berlin. */
export function berlinUhrzeit(iso: string): string {
  return new Date(iso).toLocaleTimeString('sv-SE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
}

/**
 * Bierdeckel offen? Am Stammtisch-Abend derf jeder seine eigenen Hoiben
 * stricheln: ab der Termin-Uhrzeit (Standard 19:00, Berlin-Zeit) am
 * Stammtisch-Tag, bzw. sobald d'Anmeldung zua is (Phase „heute") —
 * bis der Besuch abgschlossen is.
 */
export function bierdeckelOffen(
  termin: { datum: string; zeit: string; phase: string },
  jetztIso: string,
): boolean {
  if (termin.phase === 'abgeschlossen') return false;
  if (termin.phase === 'heute') return true;
  return berlinTag(jetztIso) === termin.datum && berlinUhrzeit(jetztIso) >= (termin.zeit || '19:00');
}

/** "HH:MM" → Minuten seit Mitternacht. */
function minutenVon(zeit: string): number {
  const [h, m] = zeit.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Abgschlossen wird erst, wenn der Abend wirklich rum is: frühestens
 * ABSCHLUSS_SPERRE_STUNDEN nach Termin-Beginn (19:00 → ab 21:00, von Julius
 * am 27.08.2026 so festgelegt), oder ab dem Folgetag. Verhindert, dass wer
 * Punktegeiles den Abend mittendrin zuamacht, bevor alle Infos beinand san.
 */
export const ABSCHLUSS_SPERRE_STUNDEN = 2;

export function abschlussOffen(termin: { datum: string; zeit: string }, jetztIso: string): boolean {
  const heute = berlinTag(jetztIso);
  if (heute > termin.datum) return true;
  if (heute < termin.datum) return false;
  return minutenVon(berlinUhrzeit(jetztIso)) >= minutenVon(termin.zeit || '19:00') + ABSCHLUSS_SPERRE_STUNDEN * 60;
}

/** Ab wann heut abgschlossen werden derf ("22:00"), für die Anzeige. */
export function abschlussAb(termin: { zeit: string }): string {
  const m = Math.min(minutenVon(termin.zeit || '19:00') + ABSCHLUSS_SPERRE_STUNDEN * 60, 23 * 60 + 59);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/**
 * Eingecheckt wird am Stammtisch-Tag ab CHECKIN_VORLAUF_STUNDEN vor Beginn
 * (wer früher da is, wart' halt no), bis der Besuch abgschlossen is.
 * Der Erste kriegt PTS.checkin WP und sagt den Spezln, wo ihr hockts.
 */
export const CHECKIN_VORLAUF_STUNDEN = 2;

export function checkinOffen(termin: { datum: string; zeit: string; phase: string }, jetztIso: string): boolean {
  if (termin.phase === 'abgeschlossen') return false;
  if (berlinTag(jetztIso) !== termin.datum) return false;
  return minutenVon(berlinUhrzeit(jetztIso)) >= minutenVon(termin.zeit || '19:00') - CHECKIN_VORLAUF_STUNDEN * 60;
}

/** Letzter Tag, an dem die Stimme noch den Bonus bringt: 3 Kalendertage vor dem Termin (inklusive). */
export function abstimmFristTag(terminDatum: string): string {
  const d = new Date(`${terminDatum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 3);
  return d.toISOString().slice(0, 10);
}

/** Rechtzeitig = die ERSTE Stimme kam bis einschließlich Ende des Frist-Tags (Europe/Berlin). */
export function rechtzeitigAbgestimmt(erstmalsAm: string | null | undefined, terminDatum: string): boolean {
  if (!erstmalsAm) return false;
  return berlinTag(erstmalsAm) <= abstimmFristTag(terminDatum);
}

/** Gesamt-WP aus den fest verbuchten Bestandteilen. */
export function wirtschaftlnPunkte(s: {
  hoiben: number;
  abende: number;
  taxi: number;
  runden: number;
  abschluesse: number;
  orgaSumme: number;
  serienBonus: number;
  fehlMalus: number;
  abstimmBonus: number;
  vorschlagPunkte: number;
  bewertungsBonus: number;
  textBonus: number;
  checkinBonus: number;
}): number {
  return (
    s.hoiben * PTS.hoibe +
    s.abende * PTS.teilnahme +
    s.taxi * PTS.taxi +
    s.runden * PTS.runde +
    s.abschluesse * PTS.abschluss +
    s.orgaSumme +
    s.serienBonus +
    s.fehlMalus +
    s.abstimmBonus +
    s.vorschlagPunkte +
    s.bewertungsBonus +
    s.textBonus +
    s.checkinBonus
  );
}

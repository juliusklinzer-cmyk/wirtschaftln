/**
 * Biersorten fürs Wirtshaus — beim Club quasi gesetzt: Augustiner.
 * Beim Besuch-Abschluss per Dropdown (mit Logo) änderbar.
 * Logos liegen unter public/brand/biersorten/ (Quelle: Wikipedia/Favicons —
 * bessere Dateien einfach unter gleichem Namen drüberlegen).
 */
export type Bier = { name: string; logo: string };
/** Dropdown-Eintrag: entweder a Bier oder a Trennstrich mit Überschrift. */
export type BierOption = Bier | { divider: string };

const logo = (slug: string) => `/brand/biersorten/${slug}.png`;

/** Helle — Julius' 30er-Karte (19.07.), Reihenfolge = seine Rangfolge. */
export const HELLE: Bier[] = [
  { name: 'Augustiner – Lagerbier Hell', logo: logo('augustiner') },
  { name: 'Tegernseer – Hell', logo: logo('tegernseer') },
  { name: 'Augustiner – Edelstoff', logo: logo('augustiner') },
  { name: 'Andechser – Vollbier Hell', logo: logo('andechser') },
  { name: 'Ayinger – Lager Hell', logo: logo('ayinger') },
  { name: 'Weihenstephan – Original Helles', logo: logo('weihenstephan') },
  { name: 'Giesinger – Münchner Hell', logo: logo('giesinger') },
  { name: 'Hacker-Pschorr – Münchner Hell', logo: logo('hacker-pschorr') },
  { name: 'Schönramer – Hell', logo: logo('schoenramer') },
  { name: 'Wieninger – Ruperti Hell', logo: logo('wieninger') },
  { name: 'Hofbräu – Original', logo: logo('hofbraeu') },
  { name: 'Spaten – Münchner Hell', logo: logo('spaten') },
  { name: 'Paulaner – Münchner Hell', logo: logo('paulaner') },
  { name: 'Löwenbräu – Original', logo: logo('loewenbraeu') },
  { name: 'Tilmans – Das Helle', logo: logo('tilmans') },
  { name: 'Camba – Bavaria Hell', logo: logo('camba') },
  { name: 'Flötzinger – Hell', logo: logo('floetzinger') },
  { name: 'Maxlrainer – Schloss Hell', logo: logo('maxlrainer') },
  { name: 'König Ludwig – Hell', logo: logo('koenig-ludwig') },
  { name: 'Hoppebräu – Helles', logo: logo('hoppebraeu') },
  { name: 'Klosterbrauerei Reutberg – Export Hell', logo: logo('reutberg') },
  { name: 'Toerring – Hell', logo: logo('toerring') },
  { name: 'Aying – Jahrhundert-Bier', logo: logo('ayinger') },
  { name: 'Schweiger – Helles Export', logo: logo('schweiger') },
  { name: 'Holzkirchner Oberbräu – Hell', logo: logo('holzkirchner-oberbraeu') },
  { name: 'Unertl – Landbier Hell (Haager Hell)', logo: logo('unertl') },
  { name: 'Erhartinger – Hell', logo: logo('erhartinger') },
  { name: 'Graminger – Hell', logo: logo('graminger') },
  { name: 'Bayrischzeller – Josefi Hell', logo: logo('bayrischzeller') },
  { name: 'Giesinger – Erhellung', logo: logo('giesinger') },
];

/** Weißbiere — Julius' 30er-Karte (19.07.), Reihenfolge = seine Rangfolge. */
export const WEISSBIERE: Bier[] = [
  { name: 'Schneider Weisse – TAP 7 Unser Original', logo: logo('schneider-weisse') },
  { name: 'Weihenstephan – Hefeweissbier', logo: logo('weihenstephan') },
  { name: 'Augustiner – Weißbier', logo: logo('augustiner') },
  { name: 'Schneider Weisse – TAP 6 Aventinus', logo: logo('schneider-weisse') },
  { name: 'Unertl – Weißbier', logo: logo('unertl') },
  { name: 'Gutmann – Hefeweizen', logo: logo('gutmann') },
  { name: 'Ayinger – Bräuweisse', logo: logo('ayinger') },
  { name: 'Hacker-Pschorr – Sternweisse', logo: logo('hacker-pschorr') },
  { name: 'Erdinger – Urweisse', logo: logo('erdinger') },
  { name: 'König Ludwig – Weissbier', logo: logo('koenig-ludwig') },
  { name: 'Franziskaner – Hefe-Weissbier', logo: logo('franziskaner') },
  { name: 'Weihenstephan – Vitus', logo: logo('weihenstephan') },
  { name: 'Paulaner – Hefe-Weißbier', logo: logo('paulaner') },
  { name: 'Hofbräu – Münchner Weisse', logo: logo('hofbraeu') },
  { name: 'Andechser – Weißbier Hell', logo: logo('andechser') },
  { name: 'Schneider Weisse – TAP 5 Hopfenweisse', logo: logo('schneider-weisse') },
  { name: 'Tegernseer – Weissbier', logo: logo('tegernseer') },
  { name: 'Karg – Weißbier', logo: logo('karg') },
  { name: 'Maxlrainer – Weißbier', logo: logo('maxlrainer') },
  { name: 'Flötzinger – Weißbier', logo: logo('floetzinger') },
  { name: 'Löwenbräu – Weisse', logo: logo('loewenbraeu') },
  { name: 'Hopf – Weiße', logo: logo('hopf') },
  { name: 'Schweiger – Weißbier', logo: logo('schweiger') },
  { name: 'Erhartinger – Weißbier', logo: logo('erhartinger') },
  { name: 'Giesinger – Weißbier', logo: logo('giesinger') },
  { name: 'Weihenstephan – Kristallweissbier', logo: logo('weihenstephan') },
  { name: 'Ayinger – Urweisse', logo: logo('ayinger') },
  { name: 'Erdinger – Weißbier', logo: logo('erdinger') },
  { name: 'Schneider Weisse – TAP 4 Meine Festweisse', logo: logo('schneider-weisse') },
  { name: 'Paulaner – Weißbier Kristall', logo: logo('paulaner') },
];

/** Alkoholfreie Helle — Julius' Karte (19.07.), stehen unterm Trennstrich. */
export const ALKOHOLFREIE_HELLE: Bier[] = [
  { name: 'Augustiner – Hell Alkoholfrei', logo: logo('augustiner') },
  { name: 'Weihenstephan – Original Helles Alkoholfrei', logo: logo('weihenstephan') },
  { name: 'Neumarkter Lammsbräu – Alkoholfrei', logo: logo('neumarkter-lammsbraeu') },
  { name: 'Hofbräu – Münchner Sommer Alkoholfrei', logo: logo('hofbraeu') },
  { name: 'Paulaner – Münchner Hell Alkoholfrei', logo: logo('paulaner') },
  { name: 'Giesinger – Erhellung Alkoholfrei', logo: logo('giesinger') },
  { name: 'Tegernseer – Hell Alkoholfrei', logo: logo('tegernseer') },
];

/** Helle-Auswahl fürs Dropdown: normale Helle, Trennstrich, alkoholfreie Helle. */
export const HELLE_WAHL: BierOption[] = [...HELLE, { divider: 'Alkoholfrei' }, ...ALKOHOLFREIE_HELLE];

// Standard beim Abschluss = das erste Helle der Karte (Augustiner Lagerbier Hell)
export const STANDARD_BIERSORTE = HELLE[0].name;

export function bierLogo(name: string | null): string | null {
  if (!name) return null;
  const alle = [...HELLE, ...WEISSBIERE, ...ALKOHOLFREIE_HELLE];
  const exakt = alle.find((b) => b.name === name);
  if (exakt) return exakt.logo;
  // Alt-Einträge aus der DB (z. B. „Schneider Weisse" vor der 30er-Karte):
  // über den Brauerei-Namen (erstes Wort) zuordnen
  const brauerei = name.split(/[\s–]/)[0];
  return alle.find((b) => b.name.split(/[\s–]/)[0] === brauerei)?.logo ?? null;
}

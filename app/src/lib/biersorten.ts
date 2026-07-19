/**
 * Biersorten fürs Wirtshaus — beim Club quasi gesetzt: Augustiner.
 * Beim Besuch-Abschluss per Dropdown (mit Logo) änderbar.
 * Logos liegen unter public/brand/biersorten/ (Quelle: Wikipedia/Favicons —
 * bessere Dateien einfach unter gleichem Namen drüberlegen).
 */
export type Bier = { name: string; logo: string };

const logo = (slug: string) => `/brand/biersorten/${slug}.png`;

/** Münchner (und eing'meindete) Helle. */
export const HELLE: Bier[] = [
  { name: 'Augustiner', logo: logo('augustiner') },
  { name: 'Paulaner', logo: logo('paulaner') },
  { name: 'Hacker-Pschorr', logo: logo('hacker-pschorr') },
  { name: 'Löwenbräu', logo: logo('loewenbraeu') },
  { name: 'Hofbräu', logo: logo('hofbraeu') },
  { name: 'Spaten', logo: logo('spaten') },
  { name: 'Giesinger', logo: logo('giesinger') },
  { name: 'Tegernseer', logo: logo('tegernseer') },
  { name: 'Andechser', logo: logo('andechser') },
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

export const STANDARD_BIERSORTE = 'Augustiner';

export function bierLogo(name: string | null): string | null {
  if (!name) return null;
  const alle = [...HELLE, ...WEISSBIERE];
  const exakt = alle.find((b) => b.name === name);
  if (exakt) return exakt.logo;
  // Alt-Einträge aus der DB (z. B. „Schneider Weisse" vor der 30er-Karte):
  // über den Brauerei-Namen (erstes Wort) zuordnen
  const brauerei = name.split(/[\s–]/)[0];
  return alle.find((b) => b.name.split(/[\s–]/)[0] === brauerei)?.logo ?? null;
}

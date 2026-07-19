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

/** Weißbiere, die in Münchner Wirtshäusern typischerweise ausg'schenkt werden. */
export const WEISSBIERE: Bier[] = [
  { name: 'Augustiner Weißbier', logo: logo('augustiner') },
  { name: 'Franziskaner', logo: logo('franziskaner') },
  { name: 'Paulaner Hefe-Weißbier', logo: logo('paulaner') },
  { name: 'Hofbräu Weisse', logo: logo('hofbraeu') },
  { name: 'Hacker-Pschorr Weisse', logo: logo('hacker-pschorr') },
  { name: 'Schneider Weisse', logo: logo('schneider-weisse') },
  { name: 'Erdinger', logo: logo('erdinger') },
  { name: 'König Ludwig Weissbier', logo: logo('koenig-ludwig') },
  { name: 'Andechser Weißbier', logo: logo('andechser') },
];

export const STANDARD_BIERSORTE = 'Augustiner';

export function bierLogo(name: string | null): string | null {
  if (!name) return null;
  return [...HELLE, ...WEISSBIERE].find((b) => b.name === name)?.logo ?? null;
}

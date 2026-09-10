import { bierLogo } from '@/lib/biersorten';

/**
 * Welcher Bierdeckel liegt am Tisch? Zum Bier des Wirtshauses (biersorte) den
 * passenden Deckel: beim Augustiner unser echter Deckel-Scan, bei allen
 * anderen bekannten Brauereien a Papp-Deckel in Brauereifarbe mit Logo,
 * sonst der neutrale Wirtschaftln-Deckel.
 */
export type Deckel =
  | { art: 'augustiner' }
  | { art: 'marke'; slug: string; logo: string; name: string; farbe: string }
  | { art: 'neutral'; name: string | null };

/** Brauerei-Farbe + Schriftzug je Logo-Slug (public/brand/biersorten/<slug>.png). */
const MARKEN: Record<string, { name: string; farbe: string }> = {
  tegernseer: { name: 'Tegernseer Bräu', farbe: '#0B6FB7' },
  andechser: { name: 'Klosterbrauerei Andechs', farbe: '#4A2C1A' },
  ayinger: { name: 'Brauerei Aying', farbe: '#1C2F5E' },
  weihenstephan: { name: 'Weihenstephan', farbe: '#1F4E9C' },
  giesinger: { name: 'Giesinger Bräu', farbe: '#5A3A1E' },
  'hacker-pschorr': { name: 'Hacker-Pschorr', farbe: '#A57C2C' },
  schoenramer: { name: 'Schönramer', farbe: '#1E6B3A' },
  wieninger: { name: 'Wieninger Bräu', farbe: '#B0202A' },
  hofbraeu: { name: 'Hofbräu München', farbe: '#1E56A0' },
  spaten: { name: 'Spaten', farbe: '#C8102E' },
  paulaner: { name: 'Paulaner', farbe: '#005B99' },
  loewenbraeu: { name: 'Löwenbräu', farbe: '#1F4FA3' },
  tilmans: { name: 'Tilmans Biere', farbe: '#1A1A1A' },
  camba: { name: 'Camba Bavaria', farbe: '#1B7A8C' },
  floetzinger: { name: 'Flötzinger Bräu', farbe: '#B4232C' },
  maxlrainer: { name: 'Schlossbrauerei Maxlrain', farbe: '#8A1C23' },
  'koenig-ludwig': { name: 'König Ludwig', farbe: '#B8860B' },
  hoppebraeu: { name: 'Hoppebräu', farbe: '#2E6B3F' },
  reutberg: { name: 'Klosterbrauerei Reutberg', farbe: '#5B3A22' },
  toerring: { name: 'Toerring Bräu', farbe: '#A32020' },
  schweiger: { name: 'Schweiger Bräu', farbe: '#2F6B3A' },
  'holzkirchner-oberbraeu': { name: 'Holzkirchner Oberbräu', farbe: '#1E5A3C' },
  unertl: { name: 'Unertl Weißbier', farbe: '#6B3F1D' },
  erhartinger: { name: 'Erhartinger', farbe: '#9E1B1B' },
  graminger: { name: 'Graminger Bräu', farbe: '#2B6E3E' },
  bayrischzeller: { name: 'Bayrischzeller', farbe: '#2C5AA0' },
  'schneider-weisse': { name: 'Schneider Weisse', farbe: '#B08A2E' },
  gutmann: { name: 'Brauerei Gutmann', farbe: '#A51C1C' },
  erdinger: { name: 'Erdinger Weißbräu', farbe: '#1D4C9C' },
  franziskaner: { name: 'Franziskaner', farbe: '#6B4423' },
  karg: { name: 'Karg Weißbier', farbe: '#2D6B34' },
  hopf: { name: 'Hopf Weiße', farbe: '#B22222' },
  'neumarkter-lammsbraeu': { name: 'Neumarkter Lammsbräu', farbe: '#2E7D32' },
};

export function deckelFuer(biersorte: string | null | undefined): Deckel {
  const logo = bierLogo(biersorte ?? null);
  if (!logo) return { art: 'neutral', name: biersorte?.trim() || null };
  const slug = logo.split('/').pop()!.replace(/\.png$/, '');
  if (slug === 'augustiner') return { art: 'augustiner' };
  const marke = MARKEN[slug];
  if (!marke) return { art: 'neutral', name: biersorte?.trim() || null };
  return { art: 'marke', slug, logo, name: marke.name, farbe: marke.farbe };
}

export const ALLE_MARKEN_SLUGS = Object.keys(MARKEN);

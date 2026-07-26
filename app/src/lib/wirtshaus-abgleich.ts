/**
 * Unscharfer Wirtshaus-Namensabgleich — EINE Logik für die Warnung in der
 * Suche (Client) und die harte Regel beim Vorschlagen (Server):
 * „Max Emanuel Brauerei Wirtshaus und Biergarten" trifft auch „Max Emanuel".
 */

export type BekanntesWirtshaus = {
  name: string;
  /** besucht = Chronik/Altbestand · eingeplant = aktueller Termin · vorgeschlagen = offener Pin */
  art: 'besucht' | 'eingeplant' | 'vorgeschlagen';
  /** Wer's gfunden hat (nur bei „vorgeschlagen" interessant). */
  von: string | null;
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** Findet den ersten bekannten Eintrag, dessen Name unscharf auf `name` passt. */
export function findeBekanntes(name: string, bekannte: BekanntesWirtshaus[]): BekanntesWirtshaus | null {
  const n = norm(name);
  if (n.length < 4) return null;
  for (const b of bekannte) {
    const bn = norm(b.name);
    if (bn === n || (bn.length >= 6 && n.includes(bn)) || (n.length >= 6 && bn.includes(n))) return b;
  }
  return null;
}

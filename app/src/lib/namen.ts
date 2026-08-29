/**
 * Anzeigename überall in der App: Spitzname gewinnt, sonst der eingegebene
 * Name („Julius Klinzer"). Vor-/Nachname sind getrennt gespeichert, aber nur
 * zur Identifikation, nicht für die Anzeige (Julius' Entscheid vom 18.07.2026).
 */
export function anzeigeName(m: {
  name: string;
  spitzname?: string | null;
  vorname?: string | null;
  nachname?: string | null;
}): string {
  return m.spitzname?.trim() || m.name;
}

/**
 * Zeremonielle volle Form für Urkunden-Köpfe (Profil, Spezl-Detail):
 * „Da <Nachname> <Vorname>", steht als Zeile unterm Anzeigenamen.
 */
export function urkundenName(m: { vorname?: string | null; nachname?: string | null }): string | null {
  if (!m.nachname?.trim()) return null;
  return `Da ${m.nachname.trim()} ${m.vorname?.trim() ?? ''}`.trim();
}

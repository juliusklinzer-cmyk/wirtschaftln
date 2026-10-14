/**
 * Einladungstext für d'WhatsApp-Gruppe: beim Einladen (Profil-Menü) und
 * direkt nach der Gründung (Geschafft-Screen) derselbe Wortlaut.
 */
export function einladungsText(c: { name: string; stadt: string | null }, link: string, code: string): string {
  return `Servus! Du bist eingeladen zum ${c.name}${c.stadt ? ` (${c.stadt})` : ''} in der Wirtschaftln-App: Termine, Abstimmung, Kasse, Rangliste und Chronik für unsere Runde.\n\nHier beitreten: ${link}\nGründungscode: ${code}\n\nDanach Passwort setzen, Profil ausfüllen, fertig. Bis boid am Tisch! 🍺`;
}

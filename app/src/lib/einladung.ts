/**
 * Einladungstext für d'WhatsApp-Gruppe: beim Einladen (Profil-Menü) und
 * direkt nach der Gründung (Geschafft-Screen) derselbe Wortlaut. Kurz, weil
 * Stammtisch und Mitgliedsnummer seit dem Link-Vorschau-Redesign (16.10.2026)
 * im Vorschaubild stehen.
 */
export function einladungsText(link: string): string {
  return `Servus! Hier ist dein Link für unseren Stammtisch: ${link}`;
}

/**
 * Saison-Zählung des Clubs: zwei Saisons pro Jahr (Frühjahr/Herbst),
 * kalibriert auf "Saison 9 · Frühjahr 2026" aus der Chronik.
 */
export function aktuelleSaison(date = new Date()): { nummer: number; label: string; jahr: number; start: string } {
  const jahr = date.getFullYear();
  const herbst = date.getMonth() >= 6; // ab Juli
  const nummer = (jahr - 2022) * 2 + (herbst ? 2 : 1);
  return {
    nummer,
    jahr,
    label: `Saison ${nummer} · ${herbst ? 'Herbst' : 'Frühjahr'} ${jahr}`,
    start: `${jahr}-${herbst ? '07' : '01'}-01`, // erster Tag der Saison (ISO)
  };
}

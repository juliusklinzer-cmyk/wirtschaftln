/**
 * Dauerhafte Serien-Abzeichen: ab 3/5/8/10/15 Abenden in Folge, bleiben für
 * immer (bemessen an der Rekord-Serie). Eigenes Modul ohne DB-Import, damit
 * Client-Komponenten (Rangliste) es laden können.
 */
export const SERIEN_ABZEICHEN = [
  { ab: 3, icon: '🥉', name: 'Stammgast' },
  { ab: 5, icon: '🥈', name: 'Inventar' },
  { ab: 8, icon: '🏅', name: 'Urgestein' },
  { ab: 10, icon: '🥇', name: 'Wirtshaus-Legende' },
  { ab: 15, icon: '💎', name: 'Unkaputtbar' },
] as const;

export function serienAbzeichen(bestStreak: number) {
  return SERIEN_ABZEICHEN.filter((a) => bestStreak >= a.ab);
}

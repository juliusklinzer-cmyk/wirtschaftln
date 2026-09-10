import { tenantConfig } from '@/lib/tenant-config';

/**
 * Saison-Zählung des Clubs: zwei Saisons pro Jahr (Frühjahr/Herbst). Die
 * Epoche (erstes gezähltes Jahr) kommt aus der Tenant-Config — beim Gründer
 * 2022, kalibriert auf „Saison 9 · Frühjahr 2026" aus der Chronik.
 */
export function aktuelleSaison(date = new Date(), epocheJahr = tenantConfig().saisonEpocheJahr): { nummer: number; label: string; jahr: number; start: string } {
  const jahr = date.getFullYear();
  const herbst = date.getMonth() >= 6; // ab Juli
  const nummer = (jahr - epocheJahr) * 2 + (herbst ? 2 : 1);
  return {
    nummer,
    jahr,
    label: `Saison ${nummer} · ${herbst ? 'Herbst' : 'Frühjahr'} ${jahr}`,
    start: `${jahr}-${herbst ? '07' : '01'}-01`, // erster Tag der Saison (ISO)
  };
}

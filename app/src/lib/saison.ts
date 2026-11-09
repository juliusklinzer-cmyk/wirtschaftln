import { tenantConfig } from '@/lib/tenant-config';

/**
 * Saison-Zählung des Clubs: zwei Saisons pro Jahr (Frühjahr/Herbst). Die
 * Epoche (erstes gezähltes Jahr) kommt aus der Tenant-Config — beim Gründer
 * 2022, kalibriert auf „Saison 9 · Frühjahr 2026" aus der Chronik.
 */
export function aktuelleSaison(date = new Date(), epocheJahr = tenantConfig().saisonEpocheJahr): { nummer: number; label: string; jahr: number; start: string } {
  // Kalendertag in München, ned in der Zeitzone vom Server (Container läuft
  // in UTC, sonst wechselt die Saison am 1.1./1.7. erst um 1 bzw. 2 Uhr)
  const [jahr, monat] = date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }).split('-').map(Number);
  const herbst = monat >= 7; // ab Juli
  const nummer = (jahr - epocheJahr) * 2 + (herbst ? 2 : 1);
  return {
    nummer,
    jahr,
    label: `Saison ${nummer} · ${herbst ? 'Herbst' : 'Frühjahr'} ${jahr}`,
    start: `${jahr}-${herbst ? '07' : '01'}-01`, // erster Tag der Saison (ISO)
  };
}

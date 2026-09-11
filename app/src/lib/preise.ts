import { tenantConfig } from '@/lib/tenant-config';

/**
 * Die Maßeinheit vom Stammtisch: der Preis für a Hoibe (0,5 l), Grundlage
 * für ALLE automatischen Geldstrafen (Strafrunde = Teilnehmer × Hoibe-Preis).
 * Kommt pro Stammtisch aus der Tenant-Config (Admin-Seite „Stammtisch");
 * der Gründer-Default ist der Augustiner-Kellerpreis („C3" im Bräustüberl,
 * Quelle: https://braeustuben.de/speisekarten-getraenke/#getraenkekarte).
 */
export const HOIBE_KELLERPREIS_CENTS = 370;

export function hoibePreisCents(): number {
  return tenantConfig().hoibePreisCents;
}

/** „3,70" — der Hoibe-Preis in Euro fürs Anzeigen. */
export function hoibePreisEuro(cents = hoibePreisCents()): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

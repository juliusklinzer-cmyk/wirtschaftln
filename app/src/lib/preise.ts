import { tenantConfig } from '@/lib/tenant-config';

/**
 * Die Maßeinheit vom Stammtisch: der Preis für a Hoibe (0,5 l), Grundlage
 * für Runden, Spenden und gemeldete Strafen. Die Strafe fürs Fehlen is
 * standardmäßig a Runde (Teilnehmer × Hoibe-Preis), kann aber pro Stammtisch
 * a fester Betrag sein (strafeFehlenCents, z. B. 50 €).
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

/**
 * Strafe fürs Fehlen (zugsagt & ned kemma bzw. 3× unentschuldigt): fester
 * Betrag aus der Config oder a Runde für alle, die da waren.
 */
export function strafeFehlen(teilnehmer: number): { cents: number; text: string } {
  const fest = tenantConfig().strafeFehlenCents;
  if (fest != null) return { cents: fest, text: `${hoibePreisEuro(fest)} €` };
  return { cents: teilnehmer * hoibePreisCents(), text: `Runde für die Spezln (${teilnehmer} × ${hoibePreisEuro()} €)` };
}

/**
 * Formular-Feld „Strafe fürs Fehlen" lesen: leer = Runde (null), sonst
 * 1 bis 500 €. Liefert undefined bei Murks.
 */
export function strafeFehlenLesen(roh: string): number | null | undefined {
  const t = roh.trim().replace('€', '').trim().replace(',', '.');
  if (!t) return null;
  const cents = Math.round(Number(t) * 100);
  return Number.isInteger(cents) && cents >= 100 && cents <= 50000 ? cents : undefined;
}

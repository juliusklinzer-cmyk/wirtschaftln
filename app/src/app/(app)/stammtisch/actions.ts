'use server';

import { revalidatePath } from 'next/cache';
import { currentTenant } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { stammdatenSpeichern } from '@/lib/stammdaten';
import { getPraesidentId } from '@/lib/queries';
import { tenantConfig } from '@/lib/tenant-config';
import { eingetragenerPraesident } from '@/lib/praesident';
import { praesidentEintragen } from '@/lib/praesident-wahl';

export type StammtischState = { error?: string; ok?: boolean };

/**
 * „Unser Stammtisch“ bearbeiten (Präsident und Admin): Name, Motto, Stadt, Gründungsjahr, Gründungscode
 * und Einstellungen. Die eigentliche Prüfung und das Speichern liegen in
 * lib/stammdaten.ts (gemeinsam mit dem Verzeichnis).
 */
export async function stammtischSpeichern(_prev: StammtischState, formData: FormData): Promise<StammtischState> {
  const me = await getCurrentMember();
  if (!me || (me.role !== 'admin' && me.id !== getPraesidentId())) return { error: 'Das dürfen nur Präsident und Admin.' };
  // Präsident nach WP oder gewählt stellt nur der Admin um
  if (me.role !== 'admin') formData.delete('praesidentModus');
  const vorher = tenantConfig().praesidentModus;
  const bisherigerPraesident = getPraesidentId();
  const ergebnis = await stammdatenSpeichern(currentTenant().gruppe, formData);
  if (ergebnis.error) return ergebnis;
  // Umgestellt auf „gewählt“: der bisherige Präsident bleibt fest im Amt, bis gewählt wird
  if (vorher === 'wp' && formData.get('praesidentModus') === 'wahl' && bisherigerPraesident && !eingetragenerPraesident()) {
    praesidentEintragen(bisherigerPraesident);
  }
  // bindTenant lädt die gruppen-Zeile bei jedem Request frisch → nächste Seite zeigt die neuen Werte
  revalidatePath('/', 'layout');
  return { ok: true };
}

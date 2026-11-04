'use server';

import { revalidatePath } from 'next/cache';
import { currentTenant } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { stammdatenSpeichern } from '@/lib/stammdaten';
import { getPraesidentId } from '@/lib/queries';

export type StammtischState = { error?: string; ok?: boolean };

/**
 * „Unser Stammtisch“ bearbeiten (Präsident und Admin): Name, Motto, Stadt, Gründungsjahr, Gründungscode
 * und Einstellungen. Die eigentliche Prüfung und das Speichern liegen in
 * lib/stammdaten.ts (gemeinsam mit dem Verzeichnis).
 */
export async function stammtischSpeichern(_prev: StammtischState, formData: FormData): Promise<StammtischState> {
  const me = await getCurrentMember();
  if (!me || (me.role !== 'admin' && me.id !== getPraesidentId())) return { error: 'Das dürfen nur Präsident und Admin.' };
  const ergebnis = await stammdatenSpeichern(currentTenant().gruppe, formData);
  if (ergebnis.error) return ergebnis;
  // bindTenant lädt die gruppen-Zeile bei jedem Request frisch → nächste Seite zeigt die neuen Werte
  revalidatePath('/', 'layout');
  return { ok: true };
}

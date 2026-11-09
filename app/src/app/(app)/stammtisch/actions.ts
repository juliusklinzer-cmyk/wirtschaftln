'use server';

import { revalidatePath } from 'next/cache';
import { currentTenant } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { stammdatenSpeichern } from '@/lib/stammdaten';
import { getAktiveMitglieder, getPraesidentId } from '@/lib/queries';
import { tenantConfig } from '@/lib/tenant-config';
import { eingetragenerPraesident } from '@/lib/praesident';
import { praesidentEintragen } from '@/lib/praesident-wahl';
import { pflichtenWahl } from '@/lib/badges';
import { gruppeAktualisieren } from '@/lib/db/directory';

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
  if (me.role !== 'admin') { formData.delete('praesidentModus'); formData.delete('praesidentWahlZeit'); formData.delete('praesidentAktuell'); }
  const vorher = tenantConfig().praesidentModus;
  const bisherigerPraesident = getPraesidentId();
  const ergebnis = await stammdatenSpeichern(currentTenant().gruppe, formData);
  if (ergebnis.error) return ergebnis;
  // Umgestellt auf „gewählt“: der bisherige Präsident bleibt fest im Amt, bis gewählt wird
  // Beim Umstellen wählt der Admin aus, wer grad Präsident is (die letzte Wahl war meistens scho)
  if (vorher === 'wp' && formData.get('praesidentModus') === 'wahl') {
    const gewaehlt = String(formData.get('praesidentAktuell') ?? '');
    const aktuell = getAktiveMitglieder().some((m) => m.id === gewaehlt) ? gewaehlt : bisherigerPraesident;
    if (aktuell && (gewaehlt || !eingetragenerPraesident())) praesidentEintragen(aktuell);
  }
  // bindTenant lädt die gruppen-Zeile bei jedem Request frisch → nächste Seite zeigt die neuen Werte
  revalidatePath('/', 'layout');
  return { ok: true };
}

/**
 * Pflichten der Ämter und Badges festlegen (WIR-003, 09.11.2026): pro
 * Stammtisch eigene, typischerweise zum Jahresanfang. Ein geleertes Feld
 * heißt „koane Pflicht“ und überschreibt auch die Vorbelegung.
 */
export async function pflichtenSpeichern(_prev: StammtischState, formData: FormData): Promise<StammtischState> {
  const me = await getCurrentMember();
  if (!me || (me.role !== 'admin' && me.id !== getPraesidentId())) return { error: 'Das dürfen nur Präsident und Admin.' };
  const gruppe = currentTenant().gruppe;
  const pflichten: Record<string, string> = {};
  for (const { key } of pflichtenWahl()) {
    const text = formData.get(`pflicht:${key}`);
    if (typeof text === 'string') pflichten[key] = text.trim().replace(/\s+/g, ' ').slice(0, 160);
  }
  let config: Record<string, unknown> = {};
  try {
    const v = JSON.parse(gruppe.config);
    if (v && typeof v === 'object') config = v as Record<string, unknown>;
  } catch {
    /* kaputtes JSON → frisch anfangen */
  }
  const bisher = (config.pflichten && typeof config.pflichten === 'object' ? config.pflichten : {}) as Record<string, unknown>;
  config.pflichten = { ...bisher, ...pflichten };
  config.pflichtenJahr = Number(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin', year: 'numeric' }));
  gruppeAktualisieren(gruppe.id, { config: JSON.stringify(config) });
  revalidatePath('/', 'layout');
  return { ok: true };
}

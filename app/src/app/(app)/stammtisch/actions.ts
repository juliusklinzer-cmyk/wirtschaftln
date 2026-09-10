'use server';

import { revalidatePath } from 'next/cache';
import { currentTenant } from '@/lib/db';
import { findGruppeByCode, gruppeAktualisieren } from '@/lib/db/directory';
import { getCurrentMember } from '@/lib/session';

export type StammtischState = { error?: string; ok?: boolean };

/**
 * Admin-Seite „Stammtisch": Name, Motto, Stadt, Gründungsjahr, Gründungscode
 * und Hoibn-Preis. Stammdaten landen in der gruppen-Zeile, der Preis in der
 * Config (JSON) — nur Keys, die der Admin setzt, alles andere bleibt Default.
 */
export async function stammtischSpeichern(_prev: StammtischState, formData: FormData): Promise<StammtischState> {
  const me = await getCurrentMember();
  if (!me || me.role !== 'admin') return { error: 'Des derf nur der Admin.' };
  const tenant = currentTenant();

  const feld = (name: string, max = 80) => String(formData.get(name) ?? '').trim().slice(0, max);
  const name = feld('name', 60);
  if (name.length < 2) return { error: 'Der Stammtisch braucht an Namen.' };
  const motto = feld('motto', 120) || null;
  const stadt = feld('stadt', 60) || null;
  const jahrRoh = feld('gruendungsjahr', 4);
  const gruendungsjahr = jahrRoh ? Number(jahrRoh) : null;
  if (gruendungsjahr !== null && (!Number.isInteger(gruendungsjahr) || gruendungsjahr < 1500 || gruendungsjahr > 2100)) {
    return { error: 'Des Gründungsjahr schaut komisch aus.' };
  }
  // Leerer Code = Aufnahme zu (fail-closed wie bisher)
  const gruendungscode = feld('gruendungscode', 40) || null;
  if (gruendungscode && !/^[A-Za-z0-9-]{3,40}$/.test(gruendungscode)) {
    return { error: 'Der Gründungscode: 3–40 Zeichen, nur Buchstaben, Ziffern, Bindestrich.' };
  }
  if (gruendungscode) {
    const andere = findGruppeByCode(gruendungscode);
    if (andere && andere.id !== tenant.id) return { error: 'Den Code hat scho a anderer Stammtisch, nimm an eigenen.' };
  }
  const preisRoh = feld('hoibePreis', 10).replace(',', '.');
  const hoibePreisCents = Math.round(Number(preisRoh) * 100);
  if (!Number.isInteger(hoibePreisCents) || hoibePreisCents < 50 || hoibePreisCents > 5000) {
    return { error: 'Der Hoibn-Preis muss zwischen 0,50 € und 50 € liegen.' };
  }

  // Config-JSON: bestehende Keys behalten, nur den Preis setzen
  let config: Record<string, unknown> = {};
  try {
    const v = JSON.parse(tenant.gruppe.config);
    if (v && typeof v === 'object') config = v as Record<string, unknown>;
  } catch {
    /* kaputtes JSON → frisch anfangen */
  }
  config.hoibePreisCents = hoibePreisCents;

  gruppeAktualisieren(tenant.id, { name, motto, stadt, gruendungsjahr, gruendungscode, config: JSON.stringify(config) });
  // bindTenant lädt die gruppen-Zeile bei jedem Request frisch → nächste Seite zeigt die neuen Werte
  revalidatePath('/', 'layout');
  return { ok: true };
}

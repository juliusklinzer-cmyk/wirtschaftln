import { findGruppeByCode, gruppeAktualisieren, type Gruppe } from '@/lib/db/directory';
import { logoNormieren } from '@/lib/logo';

export type StammdatenErgebnis = { error?: string; ok?: boolean };

/**
 * Stammdaten eines Stammtischs speichern: Name, Motto, Stadt, Gründungsjahr,
 * Gründungscode (leer = Aufnahme zu), Hoibe-Preis, Bier, Schnaps, Logo.
 * Gemeinsam für „Stammtisch verwalten“ (eigener Mandant) und das Verzeichnis
 * (Wirtschaftln-Admin bearbeitet an fremden Stammtisch).
 */
export async function stammdatenSpeichern(gruppe: Gruppe, formData: FormData): Promise<StammdatenErgebnis> {
  const feld = (name: string, max = 80) => String(formData.get(name) ?? '').trim().slice(0, max);
  const name = feld('name', 60);
  if (name.length < 2) return { error: 'Der Stammtisch braucht an Namen.' };
  const motto = feld('motto', 120) || null;
  const stadt = feld('stadt', 60) || null;
  const jahrRoh = feld('gruendungsjahr', 4);
  const gruendungsjahr = jahrRoh ? Number(jahrRoh) : null;
  if (gruendungsjahr !== null && (!Number.isInteger(gruendungsjahr) || gruendungsjahr < 1)) {
    return { error: 'Des Gründungsjahr is koa Jahreszahl.' };
  }
  if (gruendungsjahr !== null && gruendungsjahr > new Date().getFullYear()) {
    return { error: 'In der Zukunft gründen geht ned.' };
  }
  // Leerer Code = Aufnahme zu (fail-closed wie bisher)
  const gruendungscode = feld('gruendungscode', 40) || null;
  if (gruendungscode && !/^[A-Za-z0-9-]{3,40}$/.test(gruendungscode)) {
    return { error: 'Der Gründungscode: 3–40 Zeichen, nur Buchstaben, Ziffern, Bindestrich.' };
  }
  if (gruendungscode) {
    const andere = findGruppeByCode(gruendungscode);
    if (andere && andere.id !== gruppe.id) return { error: 'Den Code hat scho a anderer Stammtisch, nimm an eigenen.' };
  }
  const preisRoh = feld('hoibePreis', 10).replace(',', '.');
  const hoibePreisCents = Math.round(Number(preisRoh) * 100);
  if (!Number.isInteger(hoibePreisCents) || hoibePreisCents < 50 || hoibePreisCents > 5000) {
    return { error: 'Der Hoibe-Preis muss zwischen 0,50 € und 50 € liegen.' };
  }

  // Config-JSON: bestehende Keys behalten, nur das Gesetzte ändern
  let config: Record<string, unknown> = {};
  try {
    const v = JSON.parse(gruppe.config);
    if (v && typeof v === 'object') config = v as Record<string, unknown>;
  } catch {
    /* kaputtes JSON → frisch anfangen */
  }
  config.hoibePreisCents = hoibePreisCents;
  const bierName = feld('bierName', 60);
  if (bierName) config.bierName = bierName;
  const features = (config.features && typeof config.features === 'object' ? config.features : {}) as Record<string, unknown>;
  features.schnaps = feld('schnaps', 3) === 'on';
  config.features = features;
  // Logo: nur ändern, wenn a neues gewählt wurde (leer = so lassen)
  const logoData = String(formData.get('logoData') ?? '');
  if (logoData && logoData !== config.logo) {
    const logo = await logoNormieren(logoData);
    if (!logo) return { error: 'Des Logo kann i ned lesen, probier a anders Bild.' };
    config.logo = logo;
  }

  gruppeAktualisieren(gruppe.id, { name, motto, stadt, gruendungsjahr, gruendungscode, config: JSON.stringify(config) });
  return { ok: true };
}

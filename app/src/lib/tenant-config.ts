import { currentTenant } from '@/lib/db';
import type { Gruppe } from '@/lib/db/directory';
import {
  GENERISCHE_FEATURES,
  GRUENDER_FEATURES,
  MUENCHEN_GEO,
  type PublicTenantConfig,
  type TenantFeatures,
  type TenantGeo,
} from '@/lib/tenant-config-public';

import { logoUrlFuer } from '@/lib/logo';

export type { PublicTenantConfig, TenantFeatures, TenantGeo } from '@/lib/tenant-config-public';

/**
 * Tenant-Config des gebundenen Stammtischs (Server-Code only). Liegt als JSON
 * in `gruppen.config`; fehlende Keys werden mit Defaults gefüllt — beim
 * Gründer mit den Werten, die bisher hart im Code standen (Verhalten bleibt
 * bit-identisch), bei allen anderen mit neutralen Werten.
 */
export type TenantConfig = PublicTenantConfig & {
  /** Erstes Jahr der Saison-Zählung (Gründer: 2022, kalibriert auf „Saison 9 · Frühjahr 2026") */
  saisonEpocheJahr: number;
  /** Logo als PNG-Data-URL (512×512), bleibt serverseitig — der Client kriegt logoUrl */
  logo: string | null;
  /** Vom Admin abgeschaltete Ämter/Badges (Keys wie 'taxler', 'amt:kassenwart') */
  auszeichnungenAus: string[];
  /** Präsident: 'wp' = wer die meisten WP der Saison hat (Standard), 'wahl' = jedes Jahr gewählt (06.11.2026) */
  praesidentModus: PraesidentModus;
  /** Wann gewählt wird: Jahresanfang (Standard), Jahresende fürs neue Jahr oder alle zwei Jahre */
  praesidentWahlZeit: PraesidentWahlZeit;
};

export type PraesidentModus = 'wp' | 'wahl';
export type PraesidentWahlZeit = 'jahresanfang' | 'jahresende' | 'zweiJahre';
export const WAHL_ZEITEN: PraesidentWahlZeit[] = ['jahresanfang', 'jahresende', 'zweiJahre'];

type ConfigJson = Partial<{
  stammhausWirtshausId: string | null;
  bierName: string;
  /** Bis 04.11.2026: Hoibe-Preis und Fehl-Strafe, jetzt im Strafenkatalog (nur noch für die Übernahme gelesen) */
  hoibePreisCents: number;
  strafeFehlenCents: number | null;
  saisonEpocheJahr: number;
  geo: TenantGeo | null;
  features: Partial<TenantFeatures>;
  logo: string | null;
  auszeichnungenAus: string[];
  praesidentModus: PraesidentModus;
  praesidentWahlZeit: PraesidentWahlZeit;
}>;

function lesen(json: string): ConfigJson {
  try {
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? (v as ConfigJson) : {};
  } catch {
    return {};
  }
}

export function parseTenantConfig(gruppe: Gruppe): TenantConfig {
  const c = lesen(gruppe.config);
  const gruender = gruppe.istGruender;
  const basisFeatures = gruender ? GRUENDER_FEATURES : GENERISCHE_FEATURES;
  const features: TenantFeatures = { ...basisFeatures, ...(c.features ?? {}) };
  if (gruppe.typ === 'stammhaus' && c.features?.nieZweimal === undefined) features.nieZweimal = false;
  const logo = typeof c.logo === 'string' && c.logo.startsWith('data:image/') ? c.logo : null;
  const epoche = Number(c.saisonEpocheJahr);
  return {
    id: gruppe.id,
    name: gruppe.name,
    motto: gruppe.motto,
    stadt: gruppe.stadt,
    gruendungsjahr: gruppe.gruendungsjahr,
    typ: gruppe.typ,
    stammhausWirtshausId: c.stammhausWirtshausId ?? null,
    bierName: c.bierName?.trim() || 'Augustiner Hell',
    saisonEpocheJahr: Number.isInteger(epoche) ? epoche : gruender ? 2022 : new Date(gruppe.createdAt).getFullYear(),
    geo: c.geo === undefined ? (gruender ? MUENCHEN_GEO : null) : c.geo,
    features,
    istGruender: gruender,
    logoUrl: logoUrlFuer(gruppe.id, logo),
    logo,
    auszeichnungenAus: Array.isArray(c.auszeichnungenAus) ? c.auszeichnungenAus.filter((k): k is string => typeof k === 'string') : [],
    praesidentModus: c.praesidentModus === 'wahl' ? 'wahl' : 'wp',
    praesidentWahlZeit: WAHL_ZEITEN.includes(c.praesidentWahlZeit as PraesidentWahlZeit) ? (c.praesidentWahlZeit as PraesidentWahlZeit) : 'jahresanfang',
  };
}

/** Is des Amt/Badge bei dem Stammtisch an? (Admin kann z. B. den Taxler abschalten, wenn koaner fährt) */
export function auszeichnungAn(key: string): boolean {
  return !tenantConfig().auszeichnungenAus.includes(key);
}

/** Config des Mandanten im laufenden Request (wirft ohne gebundenen Mandanten). */
/** Alte Einstellung „Strafe fürs Fehlen“ (bis 04.11.2026), nur noch für die einmalige Übernahme in den Strafenkatalog. */
export function alteFehlStrafeCents(): number | null {
  const n = Number(lesen(currentTenant().gruppe.config).strafeFehlenCents);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function tenantConfig(): TenantConfig {
  return parseTenantConfig(currentTenant().gruppe);
}

/** Der Teil, der als Props an Client-Komponenten darf (siehe TenantProvider). */
export function publicTenantConfig(): PublicTenantConfig {
  const { saisonEpocheJahr: _epoche, logo: _logo, auszeichnungenAus: _aus, praesidentModus: _modus, praesidentWahlZeit: _zeit, ...rest } = tenantConfig();
  void _modus;
  void _zeit;
  void _epoche;
  void _logo;
  void _aus;
  return rest;
}

/**
 * Öffentliche Basis-URL der App für Links in Mails/Push (APP_BASE_URL,
 * Default: die bisherige Domain). Pfad wird angehängt.
 */
export function appUrl(pfad = '/'): string {
  const basis = (process.env.APP_BASE_URL ?? 'https://wirtschaftln.de').replace(/\/+$/, '');
  return `${basis}${pfad.startsWith('/') ? pfad : `/${pfad}`}`;
}

/** Hostname für stabile Kennungen (ICS-UIDs) */
export function appHost(): string {
  try {
    return new URL(appUrl()).hostname;
  } catch {
    return 'wirtschaftln.de';
  }
}

/** Mail-Fußzeile: „Dei Wirtschaftln-App" bzw. mit dem Namen des Stammtischs */
export function mailSignatur(): string {
  return `Dei ${tenantConfig().name}-App`;
}

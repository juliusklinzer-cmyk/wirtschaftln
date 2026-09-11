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
};

type ConfigJson = Partial<{
  stammhausWirtshausId: string | null;
  bierName: string;
  hoibePreisCents: number;
  saisonEpocheJahr: number;
  geo: TenantGeo | null;
  features: Partial<TenantFeatures>;
  logo: string | null;
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
  if (gruppe.typ === 'stammhaus' && c.features?.archivKarte === undefined) features.archivKarte = false;
  if (gruppe.typ === 'stammhaus' && c.features?.nieZweimal === undefined) features.nieZweimal = false;
  const logo = typeof c.logo === 'string' && c.logo.startsWith('data:image/') ? c.logo : null;
  const hoibe = Number(c.hoibePreisCents);
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
    hoibePreisCents: Number.isInteger(hoibe) && hoibe > 0 ? hoibe : 370,
    saisonEpocheJahr: Number.isInteger(epoche) ? epoche : gruender ? 2022 : new Date(gruppe.createdAt).getFullYear(),
    geo: c.geo === undefined ? (gruender ? MUENCHEN_GEO : null) : c.geo,
    features,
    istGruender: gruender,
    logoUrl: logoUrlFuer(gruppe.id, logo),
    logo,
  };
}

/** Config des Mandanten im laufenden Request (wirft ohne gebundenen Mandanten). */
export function tenantConfig(): TenantConfig {
  return parseTenantConfig(currentTenant().gruppe);
}

/** Der Teil, der als Props an Client-Komponenten darf (siehe TenantProvider). */
export function publicTenantConfig(): PublicTenantConfig {
  const { saisonEpocheJahr: _epoche, logo: _logo, ...rest } = tenantConfig();
  void _epoche;
  void _logo;
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

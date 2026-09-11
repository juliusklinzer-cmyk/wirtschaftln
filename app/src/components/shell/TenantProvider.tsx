'use client';

import { createContext, useContext } from 'react';
import { GRUENDER_FEATURES, MUENCHEN_GEO, type PublicTenantConfig } from '@/lib/tenant-config-public';

/**
 * Tenant-Config für Client-Komponenten: kommt als Prop aus dem Server-Layout
 * (`(app)/layout.tsx`), nie aus NEXT_PUBLIC_*. Der Fallback entspricht dem
 * Gründer-Mandanten, damit Komponenten außerhalb des App-Layouts (Login,
 * Beitreten) und Storybook-artige Aufrufe ned krachen.
 */
const FALLBACK: PublicTenantConfig = {
  id: 'wirtschaftln',
  name: 'Wirtschaftln',
  motto: 'Oiwei anders. Oiwei dahoam.',
  stadt: 'München',
  gruendungsjahr: 2019,
  typ: 'wandernd',
  stammhausWirtshausId: null,
  bierName: 'Augustiner Hell',
  hoibePreisCents: 370,
  geo: MUENCHEN_GEO,
  features: GRUENDER_FEATURES,
  istGruender: true,
  logoUrl: null,
};

const TenantContext = createContext<PublicTenantConfig>(FALLBACK);

export function TenantProvider({ config, children }: { config: PublicTenantConfig; children: React.ReactNode }) {
  return <TenantContext.Provider value={config}>{children}</TenantContext.Provider>;
}

export function useTenantConfig(): PublicTenantConfig {
  return useContext(TenantContext);
}

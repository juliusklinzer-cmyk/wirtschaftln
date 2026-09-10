'use client';

import { Steckbrief, type SteckbriefDaten } from '@/components/domain/Steckbrief';
import { useTenantConfig } from '@/components/shell/TenantProvider';

/** Steckbrief in Client-Komponenten: Brauerei-Logos nach Tenant-Config (nur Gründer). */
export function SteckbriefClient({ daten }: { daten: SteckbriefDaten }) {
  const logos = useTenantConfig().features.brauereiLogos;
  return <Steckbrief daten={daten} logos={logos} />;
}

import { redirect } from 'next/navigation';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { currentTenant } from '@/lib/db';
import { tenantConfig } from '@/lib/tenant-config';
import { hoibePreisEuro } from '@/lib/preise';
import { Card, SectionHeader } from '@/components/ds';
import { StammtischForm } from './stammtisch-form';

export const metadata = { title: 'Stammtisch verwalten' };

/**
 * Admin-Seite „Stammtisch": Stammdaten und Hoibe-Preis des eigenen
 * Stammtischs. Alles andere (Feature-Flags, Geo, Typ) kommt aus dem
 * Gründungs-Wizard bzw. bleibt beim Gründer auf den gewohnten Werten.
 */
export default async function StammtischPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  if (me.role !== 'admin') redirect('/');
  const config = tenantConfig();
  const gruppe = currentTenant().gruppe;

  return (
    <div className="wn-eintritt" style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader eyebrow="Verwaltung" title="Dei Stammtisch" fraktur />
      <Card pad={16}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 14, lineHeight: 1.45 }}>
          Kennung <b>{config.id}</b> · Typ <b>{config.typ === 'stammhaus' ? 'Stammhaus' : 'wandernd'}</b>
          {config.istGruender ? ' · Gründer-Stammtisch' : ''}
        </div>
        <StammtischForm
          werte={{
            name: gruppe.name,
            motto: gruppe.motto ?? '',
            stadt: gruppe.stadt ?? '',
            gruendungsjahr: gruppe.gruendungsjahr ? String(gruppe.gruendungsjahr) : '',
            gruendungscode: gruppe.gruendungscode ?? '',
            hoibePreis: hoibePreisEuro(config.hoibePreisCents),
            logo: config.logo,
            bierName: config.bierName,
            schnaps: config.features.schnaps,
          }}
        />
      </Card>
    </div>
  );
}

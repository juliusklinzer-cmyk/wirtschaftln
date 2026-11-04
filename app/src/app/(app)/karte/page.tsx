import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { ladeArchivEintraege } from '@/lib/archiv-eintraege';
import { getPraesidentId, getAktuellerTermin } from '@/lib/queries';
import { ArchivScreen } from '@/components/domain/ArchivScreen';
import { tenantConfig } from '@/lib/tenant-config';
import { wirtshausFestlegen } from '@/app/(app)/termin/actions';

export const metadata = { title: 'Wirtshäuser · Wirtschaftln' };

export default async function KartePage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const praesidentId = getPraesidentId();
  const darfModerieren = me.role === 'admin' || me.id === praesidentId;
  // Vorschlag direkt von der Karte reservieren: solang der nächste Termin in
  // Planung is und i Organisator, Präsident oder Admin bin
  const termin = getAktuellerTermin();
  const reservierbar = !!termin && termin.phase === 'planung' && !!termin.planerId && (darfModerieren || termin.planerId === me.id);
  return (
    <ArchivScreen
      eintraege={ladeArchivEintraege(me.id)}
      ich={{ id: me.id, darfModerieren }}
      ohneKarte={!tenantConfig().features.archivKarte}
      reservieren={reservierbar && termin ? wirtshausFestlegen.bind(null, termin.id) : null}
    />
  );
}

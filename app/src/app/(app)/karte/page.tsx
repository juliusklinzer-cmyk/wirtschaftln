import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { ladeArchivEintraege } from '@/lib/archiv-eintraege';
import { getPraesidentId } from '@/lib/queries';
import { ArchivScreen } from '@/components/domain/ArchivScreen';

export const metadata = { title: 'Archiv · Wirtschaftln' };

export default async function KartePage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  return (
    <ArchivScreen
      eintraege={ladeArchivEintraege(me.id)}
      ich={{ id: me.id, darfModerieren: me.role === 'admin' || me.id === getPraesidentId() }}
    />
  );
}

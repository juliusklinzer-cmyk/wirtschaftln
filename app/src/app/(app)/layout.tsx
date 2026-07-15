import { redirect } from 'next/navigation';
import { getCurrentMember } from '@/lib/session';
import { aktuelleSaison } from '@/lib/saison';
import { logout } from '@/app/login/actions';
import { AppBar } from '@/components/shell/AppBar';
import { TabBar } from '@/components/shell/TabBar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentMember();
  if (!me) redirect('/login');

  return (
    <div
      style={{
        maxWidth: 'var(--container-app)',
        margin: '0 auto',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
        boxShadow: '0 0 40px rgba(12,43,90,0.10)',
      }}
    >
      <AppBar
        name={me.spitzname ?? me.name}
        photoUrl={me.photoUrl}
        isAdmin={me.role === 'admin'}
        saison={aktuelleSaison().label}
        onLogout={logout}
      />
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>{children}</main>
      <TabBar />
    </div>
  );
}

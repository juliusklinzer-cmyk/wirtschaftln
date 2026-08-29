import { redirect } from 'next/navigation';
import { anzeigeName } from '@/lib/namen';
import { getCurrentMember } from '@/lib/session';
import { getStats } from '@/lib/queries';
import { aktuelleSaison } from '@/lib/saison';
import { logout } from '@/app/login/actions';
import { AppBar } from '@/components/shell/AppBar';
import { TabBar } from '@/components/shell/TabBar';
import { DaniStreifen } from '@/components/domain/DaniModus';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  // Eigene Saison-WP für die Anzeige im Header
  const saison = aktuelleSaison();
  const meineWp = getStats({ abDatum: saison.start }).find((s) => s.member.id === me.id)?.punkte ?? 0;

  return (
    <div
      style={{
        // Fest verankerter App-Rahmen (statt 100dvh): füllt den sichtbaren
        // Bildschirm IMMER exakt — koa Spalt mehr unterm Menü, wenn iOS im
        // Vollbild-Modus (black-translucent) die Höhe anders rechnet.
        position: 'fixed',
        inset: 0,
        maxWidth: 'var(--container-app)',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
        boxShadow: '0 0 60px rgba(7,25,58,0.45)',
      }}
    >
      {/* 🤳 Dani-Modus: der weiße Streifen liegt über der ganzen App */}
      <DaniStreifen />
      {/* Header scrollt MIT dem Inhalt weg (bewusst ned sticky, Julius 29.08.) —
          nur d'Tab-Leiste unten bleibt stehen */}
      <main className="wn-scroll-still" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', overscrollBehavior: 'contain' }}>
        <AppBar
          name={anzeigeName(me)}
          photoUrl={me.photoUrl}
          isAdmin={me.role === 'admin'}
          saison={saison.label}
          wp={meineWp}
          onLogout={logout}
        />
        {children}
      </main>
      <TabBar />
    </div>
  );
}

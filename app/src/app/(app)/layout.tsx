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
      {/* Safe-Area (Statusleiste/Kamera-Insel): farbloser, weich auslaufender
          Blur — oben leicht milchig, nach unten 100 % transparent, koa harte
          Kante (Julius, 29.08.). Beim Öffnen liegt er überm weißen Header und
          is unsichtbar; beim Scrollen läuft der Inhalt sichtbar drunter durch.
          Ohne Notch is env() = 0 und nix zu sehen. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40,
          height: 'calc(env(safe-area-inset-top) + 16px)',
          pointerEvents: 'none',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          maskImage: 'linear-gradient(180deg, black 0%, black 45%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 45%, transparent 100%)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 85%)',
        }}
      />
      {/* Header scrollt MIT dem Inhalt weg (bewusst ned sticky, Julius 29.08.) —
          nur d'Tab-Leiste unten bleibt stehen */}
      {/* paddingBottom hält den Inhalt über der fix verankerten Tab-Leiste frei */}
      <main className="wn-scroll-still" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', overscrollBehavior: 'contain', paddingBottom: 'calc(58px + env(safe-area-inset-bottom))' }}>
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

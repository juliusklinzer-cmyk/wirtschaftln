import { redirect } from 'next/navigation';
import { anzeigeName } from '@/lib/namen';
import { getCurrentMember } from '@/lib/session';
import { getStats, getVergabeStand } from '@/lib/queries';
import { aktuelleSaison } from '@/lib/saison';
import { logout } from '@/app/login/actions';
import { AppBar } from '@/components/shell/AppBar';
import { TabBar, TABS_STAMMHAUS, TABS_WANDERND } from '@/components/shell/TabBar';
import { DaniStreifen } from '@/components/domain/DaniModus';
import { TenantProvider } from '@/components/shell/TenantProvider';
import { publicTenantConfig } from '@/lib/tenant-config';
import { ZiehenAktualisieren } from '@/components/shell/ZiehenAktualisieren';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  // Tenant-Config einmal fürs Layout + als Props für Client-Komponenten
  const config = publicTenantConfig();
  // Eigene Saison-WP + Platz für Header-Pill und Profil-Menü
  const saison = aktuelleSaison();
  const rangliste = getStats({ abDatum: saison.start }).sort((a, b) => b.punkte - a.punkte);
  const meineWp = rangliste.find((s) => s.member.id === me.id)?.punkte ?? 0;
  const meinRang = rangliste.findIndex((s) => s.member.id === me.id) + 1;
  // Badges & Ämter, die i grad trag (fürs Profil-Menü), Amt-Titel fürs Kopf-Untertitel
  const vergabe = getVergabeStand();
  const meineBadges = [...vergabe.values()].filter((id) => id === me.id).length;
  const AMT_TITEL: Record<string, string> = { 'amt:praesident': 'Präsident', 'amt:schriftfuehrer': 'Schriftführer', 'amt:kassenwart': 'Kassenwart' };
  const meinAmt = [...vergabe.entries()].find(([key, id]) => id === me.id && AMT_TITEL[key])?.[0];

  return (
    <TenantProvider config={config}>
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
      {/* 🤳 Dani-Modus: der weiße Streifen liegt über der ganzen App (nur beim Gründer) */}
      {config.features.daniModus && <DaniStreifen />}
      {/* Header scrollt MIT dem Inhalt weg (bewusst ned sticky, Julius 29.08.),
          nur d'Tab-Leiste unten bleibt stehen */}
      {/* Der Scrollbereich selber is Navy: beim Runterziehen (iOS-Gummiband) blitzt
          oberhalb vom Header der Container-Hintergrund durch, und der soll wia
          Statusleiste und Kopf ausschauen (Julius, 14.10.2026). Der Inhalt liegt hell drauf. */}
      <main className="wn-scroll-still" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', overscrollBehavior: 'contain', background: 'var(--navy-900)' }}>
        {/* Runterziehen zum Aktualisieren */}
        <ZiehenAktualisieren />
        <div style={{ minHeight: '100%', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
        <AppBar
          appName={config.name}
          logoSrc={config.logoUrl ? `${config.logoUrl}?s=128` : config.istGruender ? '/brand/shield-256.png' : '/brand/rauten-256.png'}
          name={anzeigeName(me)}
          photoUrl={me.photoUrl}
          isAdmin={me.role === 'admin'}
          saison={saison.label}
          wp={meineWp}
          rang={meinRang}
          badges={meineBadges}
          amt={meinAmt ? AMT_TITEL[meinAmt] : null}
          onLogout={logout}
        />
        {children}
        </div>
      </main>
      <TabBar tabs={config.typ === 'stammhaus' ? TABS_STAMMHAUS : TABS_WANDERND} />
    </div>
    </TenantProvider>
  );
}

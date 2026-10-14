import Image from 'next/image';

/**
 * Rahmen für Anmelden, Beitreten und Passwort (Login-Redesign 14.10.2026):
 * blauer Grund mit Rautenband und Wappen, darunter das weiße Sheet mit
 * Fraktur-Titel. Server-tauglich, koa State.
 */
export function AuthRahmen({
  logoHoehe = 150,
  eyebrow,
  titel,
  untertitel,
  children,
}: {
  /** 150 am Login, 110 bei Beitreten/Passwort */
  logoHoehe?: number;
  eyebrow: string;
  titel: string;
  untertitel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(120% 70% at 50% 25%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', fontFamily: 'var(--font-ui)' }}>
      <div className="wn-raute wn-raute--sm" style={{ height: 8, flex: 'none' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(32px + env(safe-area-inset-top)) 28px 24px', textAlign: 'center', gap: 8 }}>
        <Image
          src="/brand/rauten-app.svg"
          alt=""
          width={logoHoehe}
          height={logoHoehe}
          priority
          style={{ height: `clamp(${Math.round(logoHoehe * 0.65)}px, 18vh, ${logoHoehe}px)`, width: 'auto', filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.4))' }}
        />
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: logoHoehe >= 150 ? 42 : 36, lineHeight: 1, color: 'var(--gold-bright)', marginTop: 12 }}>Wirtschaftln</span>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.75)' }}>{eyebrow}</span>
      </div>
      <div style={{ background: 'var(--weiss)', borderRadius: '28px 28px 0 0', padding: '24px 22px calc(34px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(7,25,58,0.35)' }}>
        <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 30, lineHeight: 1, color: 'var(--navy)', margin: 0 }}>{titel}</h1>
            {untertitel && <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>{untertitel}</span>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

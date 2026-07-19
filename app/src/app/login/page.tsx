import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getCurrentMember } from '@/lib/session';
import { LoginForm } from './login-form';

export const metadata = { title: 'Anmelden · Wirtschaftln' };

export default async function LoginPage() {
  const me = await getCurrentMember();
  if (me) redirect('/');

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--grad-navy)',
      }}
    >
      <div className="wn-raute wn-raute--sm" style={{ height: 8, opacity: 0.85 }} />

      {/* Wappen + Wortmarke */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px 28px 22px',
          textAlign: 'center',
        }}
      >
        {/* Wappen auf weißer Plakette mit Gold-Rahmen */}
        <div
          style={{
            background: 'var(--weiss)',
            border: '2.5px solid var(--gold-bright)',
            borderRadius: 24,
            padding: '18px 22px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.4), inset 0 0 0 5px var(--weiss), inset 0 0 0 6.5px var(--gold)',
          }}
        >
          <Image
            src="/brand/logo-verziert.png"
            alt="Wirtschaftln Wappen"
            width={188}
            height={188}
            priority
            style={{ height: 'clamp(128px, 21vh, 170px)', width: 'auto' }}
          />
        </div>
        <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 40, color: 'var(--gold-bright)', lineHeight: 1, marginTop: 18 }}>
          Wirtschaftln
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--pergament)',
            opacity: 0.75,
            marginTop: 8,
          }}
        >
          Münchner Stammtisch · seit 2019
        </div>
      </div>

      {/* Sheet mit Formular */}
      <div
        style={{
          background: 'var(--weiss)',
          borderRadius: '24px 24px 0 0',
          padding: '22px 24px calc(22px + env(safe-area-inset-bottom))',
          boxShadow: '0 -10px 40px rgba(7,25,58,0.35)',
        }}
      >
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 2 }}>Servus, eini mit dir!</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', marginBottom: 16 }}>
            Nur für Stammtisch-Mitglieder. Mit Account anmelden.
          </div>

          <LoginForm />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--ink-100)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-300)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              oder
            </span>
            <span style={{ flex: 1, height: 1, background: 'var(--ink-100)' }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 10 }}>
              No ned dabei? Mit dem Gründungscode aus der Runde geht’s eini.
            </div>
            <a
              href="/beitreten"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                minHeight: 54,
                padding: '14px 24px',
                borderRadius: 'var(--r-md)',
                background: 'var(--grad-gold)',
                boxShadow: 'var(--sh-gold)',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--navy-900)',
                textDecoration: 'none',
              }}
            >
              🍻 Gründungsmitglied werden
            </a>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-300)', marginTop: 10 }}>
              Aufnahme nur mitm Code aus der Wirtshaus-Gruppe.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

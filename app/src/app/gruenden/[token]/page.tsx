import Image from 'next/image';
import Link from 'next/link';
import { einladerName, gruppenName, normalisiereToken } from '@/lib/gruendung';
import { findToken } from '@/lib/db/directory';
import { datumKurz } from '@/lib/format';
import { GruendungsWizard } from './wizard';

export const metadata = {
  title: 'Stammtisch gründen · Wirtschaftln',
  openGraph: {
    title: 'A Ehren-Einladung: Gründ dein eigenen Stammtisch',
    description: 'Mit dem Wirtschaftln kriegt euer Stammtisch Termine, Abstimmung, Kasse, Rangliste und Chronik — in einer eigenen App.',
    images: [{ url: '/brand/og.jpg', width: 1200, height: 630, alt: 'Wirtschaftln-Wappen' }],
  },
};

/**
 * Öffentliche Gründungs-Route: Token prüfen, Ehren-Einladung erklären, Wizard.
 * Kein Login nötig — der Gründer legt hier direkt sein Konto an.
 */
export default async function GruendenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: roh } = await params;
  const token = normalisiereToken(decodeURIComponent(roh));
  const zeile = token ? findToken(token) : null;
  const einlader = zeile ? einladerName(zeile) : null;

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--grad-navy)' }}>
      <div className="wn-raute wn-raute--sm" style={{ height: 8, opacity: 0.85 }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 24px 18px', textAlign: 'center' }}>
        <Image
          src="/brand/willi.svg"
          alt=""
          width={132}
          height={132}
          priority
          style={{
            height: 'clamp(104px, 16vh, 132px)',
            width: 'auto',
            filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.4))',
          }}
        />
        <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 34, color: 'var(--gold-bright)', lineHeight: 1, marginTop: 14 }}>
          Wirtschaftln
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--pergament)', opacity: 0.75, marginTop: 8 }}>
          A Ehren-Einladung
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background: 'var(--weiss)',
          borderRadius: '24px 24px 0 0',
          padding: '22px 24px calc(28px + env(safe-area-inset-bottom))',
          boxShadow: '0 -10px 40px rgba(7,25,58,0.35)',
        }}
      >
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          {!zeile && (
            <>
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 6 }}>Der Link stimmt ned.</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-500)', lineHeight: 1.5 }}>
                A Gründungs-Link schaut so aus: <b>…/gruenden/WIRT-XXXX-XXXX</b>. Lass dir den Link vom Spezl nomoi schicken.
              </div>
              <Link href="/login" style={{ display: 'inline-block', marginTop: 18, fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', textDecoration: 'none' }}>
                → Zum Anmelden
              </Link>
            </>
          )}

          {zeile && zeile.status === 'eingeloest' && (
            <>
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 6 }}>Der Token is scho eingelöst.</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-500)', lineHeight: 1.5 }}>
                Damit wurde am {zeile.eingeloestAm ? datumKurz(zeile.eingeloestAm.slice(0, 10)) : '—'} der Stammtisch{' '}
                <b>{gruppenName(zeile.eingeloestVonGruppeId) ?? '—'}</b> gegründet. Jeder derf genau oan Stammtisch in d’Welt setzen.
              </div>
              <Link href="/login" style={{ display: 'inline-block', marginTop: 18, fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', textDecoration: 'none' }}>
                → Zum Anmelden
              </Link>
            </>
          )}

          {zeile && zeile.status === 'offen' && token && (
            <>
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 4 }}>
                {einlader ? `${einlader} lädt di ein.` : 'Du bist eingladen.'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-500)', lineHeight: 1.5, marginBottom: 18 }}>
                Mit dem Wirtschaftln kriegt euer Stammtisch a eigene App: Termine mit Abstimmung, Wirtshaus-Reservierung,
                Kasse, Rangliste, Chronik und Ämter. Alles in eurer eigenen Umgebung, nur für eure Runde. Der Token gilt genau
                für <b>oan</b> Stammtisch, du wirst dessen Gründer und Admin.
              </div>
              <GruendungsWizard token={token} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

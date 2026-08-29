import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCurrentMember } from '@/lib/session';
import { BeitrittForm } from './beitritt-form';

export const metadata = {
  title: 'Gründungsmitglied werden · Wirtschaftln',
  // WhatsApp-Vorschau für den Einladungs-Link
  openGraph: {
    title: 'A persönliche Einladung zum Wirtschaftln',
    description:
      'Du bist eingeladen, Gründungsmitglied vom Wirtschaftln zu werden, dem Münchner Stammtisch seit 2019. Treu im Brauch, offen für Neis.',
    images: [{ url: '/brand/og.jpg', width: 1200, height: 630, alt: 'Wirtschaftln-Wappen' }],
  },
};

/**
 * Beitritt für die Runde: Link aus der WhatsApp-Gruppe + Gründungscode.
 * Danach: Passwort setzen + Profil ausfüllen (Erstanmeldung), und los geht’s.
 */
export default async function BeitretenPage() {
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
        {/* Wappen mit Konturrahmen, wie am Login */}
        <Image
          src="/brand/logo-verziert.png"
          alt="Wirtschaftln Wappen"
          width={160}
          height={160}
          priority
          style={{
            height: 'clamp(120px, 20vh, 160px)',
            width: 'auto',
            filter:
              'drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff) ' +
              'drop-shadow(0 0 1px #E6C684) drop-shadow(0 0 1.5px #D0AD66) drop-shadow(0 12px 28px rgba(0,0,0,0.45))',
          }}
        />
        <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 36, color: 'var(--gold-bright)', lineHeight: 1, marginTop: 16 }}>
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
          Gründungsmitglieder · München seit 2019
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
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 2 }}>
            Servus, du gehörst dazua!
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', marginBottom: 16 }}>
            Mit dem Gründungscode aus der Runde wirst’d Gründungsmitglied.
          </div>

          <BeitrittForm />

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', textDecoration: 'none' }}>
              Scho dabei? → Anmelden
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

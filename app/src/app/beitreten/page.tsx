import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCurrentMember } from '@/lib/session';
import { BeitrittForm } from './beitritt-form';
import { findGruppeByCode } from '@/lib/db/directory';

export const metadata = {
  title: 'Gründungsmitglied werden · Wirtschaftln',
  // WhatsApp-Vorschau für den Einladungs-Link
  openGraph: {
    title: 'A persönliche Einladung zum Wirtschaftln',
    description:
      'Du bist eingeladen, Gründungsmitglied bei deinem Stammtisch zu werden. Treu im Brauch, offen für Neis.',
    images: [{ url: '/brand/og.jpg', width: 1200, height: 630, alt: 'Wirtschaftln-Wappen' }],
  },
};

/**
 * Beitritt für die Runde: Link aus der WhatsApp-Gruppe + Gründungscode.
 * Danach: Passwort setzen + Profil ausfüllen (Erstanmeldung), und los geht’s.
 */
export default async function BeitretenPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const me = await getCurrentMember();
  if (me) redirect('/');
  const { code } = await searchParams;
  const codeVorbelegt = typeof code === 'string' ? code.slice(0, 40) : '';
  // Einladungs-Link: der Stammtisch steht scho fest → persönlich ansprechen
  const eingeladen = codeVorbelegt ? findGruppeByCode(codeVorbelegt.trim()) : null;
  const eingeladenZu = eingeladen && eingeladen.status === 'aktiv' ? eingeladen : null;

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
          src="/brand/willi.svg"
          alt=""
          width={160}
          height={160}
          priority
          style={{
            height: 'clamp(120px, 20vh, 160px)',
            width: 'auto',
            filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.4))',
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
          {eingeladenZu ? [eingeladenZu.stadt, eingeladenZu.gruendungsjahr ? `seit ${eingeladenZu.gruendungsjahr}` : null].filter(Boolean).join(' · ') || 'Einladung' : 'Mit dem Code aus deiner Runde'}
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
            {eingeladenZu ? `Du bist eingeladen zum ${eingeladenZu.name}!` : 'Servus, du gehörst dazua!'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', marginBottom: 16 }}>
            {eingeladenZu
              ? 'Der Gründungscode steht scho drin. Nur no Name und E-Mail, dann bist dabei.'
              : 'Mit dem Gründungscode aus deiner Runde wirst’d Mitglied bei eurem Stammtisch.'}
          </div>

          <BeitrittForm codeVorbelegt={codeVorbelegt} />

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

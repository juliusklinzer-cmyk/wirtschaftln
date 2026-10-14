import { redirect } from 'next/navigation';
import { getCurrentMember } from '@/lib/session';
import { findGruppeByCode } from '@/lib/db/directory';
import { AuthRahmen } from '@/components/domain/AuthRahmen';
import { AuthLink } from '@/components/domain/AuthFeld';
import { BeitrittForm } from './beitritt-form';

export const metadata = {
  title: 'Gründungsmitglied werden · Wirtschaftln',
  // WhatsApp-Vorschau für den Einladungs-Link (Login-Redesign 2f)
  openGraph: {
    title: 'Eine persönliche Einladung zum Wirtschaftln',
    description: 'Du bist eingeladen, Gründungsmitglied bei deinem Stammtisch zu werden.',
    images: [{ url: '/brand/og.jpg', width: 1200, height: 630, alt: 'Wirtschaftln-Wappen' }],
  },
};

/**
 * Beitritt (Login-Redesign 1b/1c): aus dem Einladungs-Link steht der Code
 * scho drin und der Stammtisch wird persönlich genannt, ohne Link tippt man
 * den Code selbst und sieht drunter, wem man beitritt.
 */
export default async function BeitretenPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const me = await getCurrentMember();
  if (me) redirect('/');
  const { code } = await searchParams;
  const codeVorbelegt = typeof code === 'string' ? code.slice(0, 40) : '';
  const eingeladen = codeVorbelegt ? findGruppeByCode(codeVorbelegt.trim()) : null;
  const eingeladenZu = eingeladen && eingeladen.status === 'aktiv' ? eingeladen : null;

  const eyebrow = eingeladenZu
    ? [eingeladenZu.stadt, eingeladenZu.gruendungsjahr ? `seit ${eingeladenZu.gruendungsjahr}` : null].filter(Boolean).join(' · ') || 'Einladung'
    : 'Mit dem Code aus deiner Runde';

  return (
    <AuthRahmen
      logoHoehe={110}
      eyebrow={eyebrow}
      titel={eingeladenZu ? 'Du bist eingeladen!' : 'Werd Mitglied'}
      untertitel={eingeladenZu ? `Zum ${eingeladenZu.name}. Nur noch Name und E-Mail, dann bist du dabei.` : 'Mit dem Gründungscode aus deiner Runde.'}
    >
      <BeitrittForm codeVorbelegt={codeVorbelegt} />
      <AuthLink href="/login">Schon dabei? Anmelden</AuthLink>
    </AuthRahmen>
  );
}

import Link from 'next/link';
import { LinkBreak } from '@phosphor-icons/react/dist/ssr/LinkBreak';
import { SealCheck } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { einlader, gruppenName, normalisiereToken } from '@/lib/gruendung';
import { findToken } from '@/lib/db/directory';
import { datumMitJahr } from '@/lib/format';
import { AuthRahmen } from '@/components/domain/AuthRahmen';
import { GruendungsWizard } from './wizard';

export const metadata = {
  title: 'Stammtisch gründen · Wirtschaftln',
  openGraph: {
    title: 'Eine Ehren-Einladung: Gründe deinen eigenen Stammtisch',
    description: 'Mit dem Wirtschaftln kriegt euer Stammtisch Termine, Abstimmung, Kasse, Rangliste und Chronik in einer eigenen App.',
    images: [{ url: '/brand/og.jpg', width: 1200, height: 630, alt: 'Wirtschaftln-Wappen' }],
  },
};

/**
 * Öffentliche Gründungs-Route (Gründung-Redesign 14.10.2026): Token prüfen,
 * dann die Ehren-Einladung (1a) und der Wizard in fünf Schritten. Ungültig
 * oder scho eingelöst (2a/2b) kriegt die Zustands-Karte im Login-Rahmen.
 * Kein Login nötig, der Gründer legt hier direkt sein Konto an.
 */
export default async function GruendenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: roh } = await params;
  const token = normalisiereToken(decodeURIComponent(roh));
  const zeile = token ? findToken(token) : null;

  if (zeile && zeile.status === 'offen' && token) {
    const wer = einlader(zeile);
    const von = wer ? `Von ${wer.name}${wer.herkunft ? ` aus ${wer.herkunft}` : ''}` : 'Eine persönliche Einladung';
    return <GruendungsWizard token={token} von={von} />;
  }

  const eingeloest = !!zeile;
  return (
    <AuthRahmen logoHoehe={100} eyebrow="Eine Ehren-Einladung" titel="">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 0 8px', marginTop: -20, textAlign: 'center' }}>
        <span style={{ width: 56, height: 56, borderRadius: 999, display: 'grid', placeItems: 'center', background: eingeloest ? 'var(--pergament)' : '#FBE7E4', color: eingeloest ? 'var(--gold-700)' : 'var(--strafe)' }}>
          {eingeloest ? <SealCheck size={28} weight="fill" /> : <LinkBreak size={28} weight="fill" />}
        </span>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 24, lineHeight: 1, color: 'var(--navy)' }}>{eingeloest ? 'Schon eingelöst' : 'Der Link stimmt nicht'}</span>
        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)' }}>
          {eingeloest ? (
            <>
              Damit wurde{zeile?.eingeloestAm ? ` am ${datumMitJahr(zeile.eingeloestAm.slice(0, 10))}` : ''} der Stammtisch{' '}
              <b style={{ color: 'var(--ink-700)' }}>{gruppenName(zeile?.eingeloestVonGruppeId ?? null) ?? 'eines Spezls'}</b> gegründet. Jeder Token gilt für genau einen Stammtisch.
            </>
          ) : (
            <>So sieht ein Gründungs-Link aus: …/gruenden/WIRT-XXXX-XXXX. Lass ihn dir nochmal schicken.</>
          )}
        </span>
        <Link href="/login" style={{ marginTop: 4, fontSize: 14, fontWeight: 800, color: 'var(--muc-blau)', textDecoration: 'none' }}>Zur Anmeldung</Link>
      </div>
    </AuthRahmen>
  );
}

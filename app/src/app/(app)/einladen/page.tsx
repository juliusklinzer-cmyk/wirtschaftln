import Link from 'next/link';
import QRCode from 'qrcode';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { currentTenant } from '@/lib/db';
import { appUrl } from '@/lib/tenant-config';
import { Card, SectionHeader } from '@/components/ds';
import { einladungsText } from '@/lib/einladung';
import { EinladenKarte } from '@/components/domain/EinladenKarte';

export const metadata = { title: 'Spezln einladen' };

/**
 * Spezln einladen: Beitritts-Link mit Gründungscode, WhatsApp/Teilen, QR.
 * Jederzeit über das Profil-Menü erreichbar (nach der Gründung kommt zuerst
 * der Geschafft-Screen unter /gruenden/fertig). Ohne Gründungscode (Aufnahme zu) gibt's
 * den Hinweis auf die Verwaltung.
 */
export default async function EinladenPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const code = currentTenant().gruppe.gruendungscode;
  const link = code ? `${appUrl('/beitreten')}?code=${encodeURIComponent(code)}` : null;
  const text = link && code ? einladungsText(link) : '';
  const qrSvg = link ? await QRCode.toDataURL(link, { type: 'image/png', margin: 1, width: 360, color: { dark: '#0C2B5A', light: '#FFFFFF' } }) : '';

  return (
    <div className="wn-eintritt" style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader eyebrow="Einladen" title="Hol d’Spezln eini" fraktur />
      <Card pad={16}>
        {link && code ? (
          <EinladenKarte link={link} code={code} text={text} qrSvg={qrSvg} />
        ) : (
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5 }}>
            D’Aufnahme is grad zua: es gibt koan Gründungscode.{' '}
            {me.role === 'admin' ? (
              <>
                Leg unter <Link href="/stammtisch" style={{ color: 'var(--muc-blau)', fontWeight: 800 }}>Stammtisch verwalten</Link> an Code fest, dann gibt’s hier den Einladungs-Link.
              </>
            ) : (
              'Frag den Admin, der kann an Code festlegen.'
            )}
          </div>
        )}
      </Card>

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center', lineHeight: 1.5 }}>
        Wer beitritt, setzt beim ersten Anmelden sei Passwort und füllt sei Profil aus. Den Code kannst jederzeit unter „Stammtisch verwalten“ ändern oder zumachen.
      </div>
    </div>
  );
}

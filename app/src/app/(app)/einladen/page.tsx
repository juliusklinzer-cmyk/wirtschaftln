import Link from 'next/link';
import QRCode from 'qrcode';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { currentTenant } from '@/lib/db';
import { appUrl, tenantConfig } from '@/lib/tenant-config';
import { Card, SectionHeader } from '@/components/ds';
import { EinladenKarte } from '@/components/domain/EinladenKarte';

export const metadata = { title: 'Spezln einladen' };

/**
 * Spezln einladen: Beitritts-Link mit Gründungscode, WhatsApp/Teilen, QR.
 * Landet direkt nach dem Gründungs-Wizard hier (?neu=1) und is jederzeit
 * über das Profil-Menü erreichbar. Ohne Gründungscode (Aufnahme zu) gibt's
 * den Hinweis auf die Verwaltung.
 */
export default async function EinladenPage({ searchParams }: { searchParams: Promise<{ neu?: string }> }) {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const { neu } = await searchParams;
  const config = tenantConfig();
  const code = currentTenant().gruppe.gruendungscode;
  const link = code ? `${appUrl('/beitreten')}?code=${encodeURIComponent(code)}` : null;
  const text = link
    ? `Servus! Du bist eingeladen zum ${config.name}${config.stadt ? ` (${config.stadt})` : ''} in der Wirtschaftln-App: Termine, Abstimmung, Kasse, Rangliste und Chronik für unsere Runde.\n\nHier beitreten: ${link}\nGründungscode: ${code}\n\nDanach Passwort setzen, Profil ausfüllen, fertig. Bis boid am Tisch! 🍺`
    : '';
  const qrSvg = link ? await QRCode.toDataURL(link, { type: 'image/png', margin: 1, width: 360, color: { dark: '#0C2B5A', light: '#FFFFFF' } }) : '';

  return (
    <div className="wn-eintritt" style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {neu === '1' && (
        <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
          <div style={{ padding: '18px 20px' }}>
            <div className="wn-eyebrow" style={{ color: 'var(--gold)' }}>Gegründet</div>
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, color: 'var(--pergament)', margin: '6px 0 4px' }}>{config.name} steht!</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(246,240,226,0.8)', lineHeight: 1.5 }}>
              Jetzt d’Spezln einladen, dann kann der erste Stammtisch ausgmacht werden. Alles Weitere (Logo, Motto, Hoibe-Preis) findst unter „Stammtisch verwalten“.
            </div>
          </div>
        </Card>
      )}

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

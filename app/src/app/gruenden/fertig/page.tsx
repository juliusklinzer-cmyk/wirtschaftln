import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import { getCurrentMember } from '@/lib/session';
import { currentTenant } from '@/lib/db';
import { appUrl, tenantConfig } from '@/lib/tenant-config';
import { einladungsText } from '@/lib/einladung';
import { CodeKopieren } from './code-kopieren';

export const metadata = { title: 'Gegründet · Wirtschaftln' };

/**
 * Geschafft-Screen nach der Gründung (Design 1g): Wappen im Rahmen, Name in
 * Fraktur, Gründungscode zum Kopieren, Einladung in d'WhatsApp-Gruppe, dann
 * eini in d'App. Nur für den eingeloggten Gründer, sonst zum Login.
 */
export default async function GruendenFertigPage() {
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  const config = tenantConfig();
  const code = currentTenant().gruppe.gruendungscode;
  const link = code ? `${appUrl('/beitreten')}?code=${encodeURIComponent(code)}` : appUrl('/beitreten');
  const text = code ? einladungsText(config, link, code) : '';
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 'calc(24px + env(safe-area-inset-top)) 28px calc(24px + env(safe-area-inset-bottom))', textAlign: 'center', background: 'radial-gradient(circle at 50% 34%, #123E78 0%, #07193A 70%)', fontFamily: 'var(--font-ui)' }}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 140, height: 140, borderRadius: 32, background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A, #07193A)', border: '2px solid var(--gold)', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 10px rgba(230,198,132,0.12), 0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          {config.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${config.logoUrl}?s=256`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <Image src="/brand/rauten-app.svg" alt="" width={100} height={100} priority style={{ height: 100, width: 'auto' }} />
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.75)' }}>Gegründet</span>
        <h1 style={{ fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 40, lineHeight: 1.05, color: 'var(--gold-bright)', margin: 0 }}>{config.name} steht!</h1>
        <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: 'rgba(246,240,226,0.85)' }}>
          {code ? 'Schick deinen Spezln den Code, dann kann’s losgehen.' : 'Jetzt die Spezln einladen, dann kann’s losgehen.'}
        </span>
        {code && <CodeKopieren code={code} />}
        <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {code && (
            <a href={wa} target="_blank" rel="noopener" className="wn-press" style={{ height: 54, borderRadius: 14, background: 'var(--grad-gold)', color: 'var(--navy-900)', boxShadow: 'var(--sh-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 800, textDecoration: 'none' }}>
              <WhatsappLogo size={20} weight="fill" />
              In die WhatsApp-Gruppe
            </a>
          )}
          <Link href="/willkommen" className="wn-press" style={{ height: 50, borderRadius: 14, border: '1.5px solid rgba(246,240,226,0.3)', color: 'var(--pergament)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
            Zur App
          </Link>
        </div>
      </div>
    </div>
  );
}

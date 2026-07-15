import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getCurrentMember } from '@/lib/session';
import { CrestMark } from '@/components/ds';
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background:
          'linear-gradient(rgba(7,25,58,0.88), rgba(7,25,58,0.94)), url(/brand/munich-alps-panorama.jpg) center/cover',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <Image src="/brand/shield-256.png" alt="Wirtschaftln Wappen" width={96} height={96} style={{ height: 96, width: 'auto', marginBottom: 14 }} />
          <CrestMark tone="gold" size="md" />
          <div
            style={{
              fontFamily: 'var(--font-quote)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'rgba(246,240,226,0.75)',
              marginTop: 10,
            }}
          >
            „Oiwei anders. Oiwei dahoam.“
          </div>
        </div>

        <div
          style={{
            background: 'var(--weiss)',
            borderRadius: 'var(--r-xl)',
            padding: 24,
            boxShadow: 'var(--sh-lg)',
          }}
        >
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 16 }}>Servus, Spezl!</div>
          <LoginForm />
        </div>

        <div className="wn-raute wn-raute--sm" style={{ height: 8, borderRadius: 4, marginTop: 24, opacity: 0.85 }} />
      </div>
    </div>
  );
}

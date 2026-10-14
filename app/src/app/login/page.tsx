import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentMember } from '@/lib/session';
import { AuthRahmen } from '@/components/domain/AuthRahmen';
import { AuthOder } from '@/components/domain/AuthFeld';
import { LoginForm } from './login-form';

export const metadata = { title: 'Anmelden · Wirtschaftln' };

/** Anmelden (Login-Redesign 1a): Wappen oben, Formular im weißen Sheet, darunter der Weg zum Beitritt. */
export default async function LoginPage() {
  const me = await getCurrentMember();
  if (me) redirect('/');

  return (
    <AuthRahmen eyebrow="Dein Stammtisch in der Hosentasche" titel="Servus!" untertitel="Nur für Stammtisch-Mitglieder.">
      <LoginForm />
      <AuthOder />
      <Link
        href="/beitreten"
        className="wn-press"
        style={{ height: 54, borderRadius: 14, background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 800, textDecoration: 'none' }}
      >
        Gründungsmitglied werden
      </Link>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-300)', textAlign: 'center', marginTop: -6 }}>Nur mit dem Code aus eurer Wirtshaus-Gruppe.</span>
    </AuthRahmen>
  );
}

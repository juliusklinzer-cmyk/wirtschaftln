import { redirect } from 'next/navigation';
import { getCurrentMember } from '@/lib/session';
import { AuthRahmen } from '@/components/domain/AuthRahmen';
import { AnfordernForm } from './anfordern-form';

export const metadata = { title: 'Passwort vergessen · Wirtschaftln' };

/** „Passwort vergessen?“ vom Login: E-Mail eingeben, Link kommt per Mail. */
export default async function PasswortPage() {
  const me = await getCurrentMember();
  if (me) redirect('/');
  return (
    <AuthRahmen logoHoehe={110} eyebrow="Dein Stammtisch in der Hosentasche" titel="Passwort vergessen?" untertitel="Wir schicken dir einen Link an deine E-Mail. Damit setzt du dir ein neues.">
      <AnfordernForm />
    </AuthRahmen>
  );
}

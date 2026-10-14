import { eq } from 'drizzle-orm';
import { db, members, bindTenant } from '@/lib/db';
import { findGruppe, passwortTokenFinden } from '@/lib/db/directory';
import { AuthRahmen } from '@/components/domain/AuthRahmen';
import { AuthFehlerBox, AuthLink } from '@/components/domain/AuthFeld';
import { NeuForm } from './neu-form';

export const metadata = { title: 'Neues Passwort · Wirtschaftln' };

/** Link aus der Mail: neues Passwort setzen, danach gleich drin. */
export default async function PasswortNeuPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = passwortTokenFinden(token.slice(0, 80));
  const gruppe = t ? findGruppe(t.gruppeId) : null;
  const member = t && bindTenant(t.gruppeId) ? db.select().from(members).where(eq(members.id, t.memberId)).get() : null;

  if (!t || !member) {
    return (
      <AuthRahmen logoHoehe={110} eyebrow="Dein Stammtisch in der Hosentasche" titel="Link abgelaufen" untertitel="Der Link gilt nur eine Stunde und nur einmal.">
        <AuthFehlerBox>Dieser Link ist nicht mehr gültig.</AuthFehlerBox>
        <AuthLink href="/passwort">Neuen Link anfordern</AuthLink>
      </AuthRahmen>
    );
  }
  return (
    <AuthRahmen
      logoHoehe={110}
      eyebrow="Dein Stammtisch in der Hosentasche"
      titel="Neues Passwort"
      untertitel={<>Für <strong style={{ color: 'var(--ink-700)' }}>{t.email}</strong>{gruppe ? ` beim ${gruppe.name}` : ''}. Mindestens 6 Zeichen.</>}
    >
      <NeuForm token={t.token} />
    </AuthRahmen>
  );
}

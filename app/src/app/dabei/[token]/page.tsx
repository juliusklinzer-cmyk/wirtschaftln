import { and, eq } from 'drizzle-orm';
import { db, kasse } from '@/lib/db';
import { anfrageZuToken } from '@/lib/wackler';
import { euro } from '@/lib/format';
import { AuthRahmen } from '@/components/domain/AuthRahmen';
import { AuthFehlerBox, AuthLink } from '@/components/domain/AuthFeld';
import { AntwortForm } from './antwort-form';

export const metadata = { title: 'Bist du noch dabei? · Wirtschaftln' };

/** Link aus der Wackler-Mail: dabei bleiben oder verabschieden, ohne Login. */
export default async function DabeiPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ a?: string }> }) {
  const { token } = await params;
  const { a } = await searchParams;
  const t = anfrageZuToken(decodeURIComponent(token));

  if (!t || t.anfrage.erledigt || t.member.status !== 'aktiv') {
    return (
      <AuthRahmen logoHoehe={110} eyebrow="Dein Stammtisch in der Hosentasche" titel="Schon erledigt" untertitel="Dieser Link gilt nicht mehr.">
        <AuthFehlerBox>Die Frage ist schon beantwortet oder der Link ist ungültig.</AuthFehlerBox>
        <AuthLink href="/login">Zur Anmeldung</AuthLink>
      </AuthRahmen>
    );
  }

  // Offene Strafen/Runden für den Hinweis nach dem Abschied
  const offen = db.select().from(kasse).where(and(eq(kasse.memberId, t.member.id), eq(kasse.status, 'offen'))).all();
  const cents = -offen.reduce((s, k) => s + Math.min(0, k.betragCents), 0);
  const schulden = cents > 0 ? euro(cents) : null;
  const vorname = t.member.vorname?.trim() || t.member.name;

  return (
    <AuthRahmen
      logoHoehe={110}
      eyebrow="Dein Stammtisch in der Hosentasche"
      titel="Bist du noch dabei?"
      untertitel={<>Servus {vorname}! Du hast ein paar Stammtische hintereinander ohne Absage gefehlt. Kein Vorwurf, wir wollen nur wissen, woran wir sind.</>}
    >
      <AntwortForm token={t.anfrage.token} vorwahl={a === 'abschied' ? 'abschied' : a === 'dabei' ? 'dabei' : null} schulden={schulden} />
    </AuthRahmen>
  );
}

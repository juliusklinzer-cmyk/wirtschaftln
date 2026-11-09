import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { HourglassMedium } from '@phosphor-icons/react/dist/ssr/HourglassMedium';
import { db, members, currentTenant } from '@/lib/db';
import { getAntragsteller, getCurrentMember } from '@/lib/session';
import { anzeigeName } from '@/lib/namen';
import { AuthRahmen } from '@/components/domain/AuthRahmen';
import { AuthKnopf } from '@/components/domain/AuthFeld';
import { logout } from '@/app/login/actions';
import { NachschauenTakt } from './nachschauen';

export const metadata: Metadata = { title: 'Aufnahme · Wirtschaftln' };

/**
 * Warteseite nach dem Beitritt (WIR-013): der Neue hat einen Bürgen genannt
 * und wartet, bis der für ihn bürgt. Ist er aufgenommen, geht's weiter zu
 * Erklär-Slides und Profil wie bisher.
 */
export default async function WartenPage() {
  if (await getCurrentMember()) redirect('/');
  const ich = await getAntragsteller();
  if (!ich) redirect('/login');
  const buerge = ich.buergeId ? db.select().from(members).where(eq(members.id, ich.buergeId)).get() : null;
  const stammtisch = currentTenant().gruppe.name;

  return (
    <AuthRahmen logoHoehe={110} eyebrow={stammtisch} titel="Gleich bist du dabei" untertitel={`Servus ${ich.vorname ?? anzeigeName(ich)}, dein Antrag ist angekommen.`}>
      <NachschauenTakt />
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '16px 18px', borderRadius: 16, background: 'var(--pergament)', border: '1.5px solid var(--gold)' }}>
        <HourglassMedium size={30} weight="duotone" color="var(--gold-700)" style={{ flex: 'none' }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>
            {buerge ? `Wartet auf ${anzeigeName(buerge)}` : 'Wartet auf den Präsidenten'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink-500)' }}>
            {buerge ? 'Sobald dein Bürge zusagt, bist du drin.' : 'Dein Bürge kennt dich nicht, jetzt entscheidet der Präsident.'} Du kriegst eine Mail, die Seite schaut auch selbst nach.
          </span>
        </span>
      </div>
      <form style={{ display: 'flex', flexDirection: 'column' }}>
        <AuthKnopf variante="navy">Nachschauen</AuthKnopf>
      </form>
      <form action={logout} style={{ display: 'flex', justifyContent: 'center' }}>
        <button type="submit" style={{ border: 'none', background: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer', padding: '4px 8px' }}>Abmelden</button>
      </form>
    </AuthRahmen>
  );
}

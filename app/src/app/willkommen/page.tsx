import { redirect } from 'next/navigation';
import { getCurrentMember } from '@/lib/session';
import { tenantConfig } from '@/lib/tenant-config';
import { OnboardingSlides } from './slides';

export const metadata = { title: 'So geht’s · Wirtschaftln' };

/**
 * Erklär-Slides für Neue (Design „Onboarding Slides“ 1a–1e): nach dem ersten
 * Login, vor dem Profil. Fünf Slides, wischen oder „Weiter“, oben rechts
 * überspringen. Wird pro Konto einmal gezeigt (members.onboarding_gesehen),
 * später übers Profil-Menü („So geht’s“) wieder aufrufbar.
 */
export default async function WillkommenPage() {
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  const c = tenantConfig();
  return (
    <OnboardingSlides
      stammhaus={c.typ === 'stammhaus'}
      schnaps={c.features.schnaps}
      hoibePreis={(c.hoibePreisCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      ersterLogin={me.erstanmeldung}
    />
  );
}

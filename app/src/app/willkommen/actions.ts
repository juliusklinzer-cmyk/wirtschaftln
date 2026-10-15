'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db, members } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { steckbriefLeer } from '@/components/domain/Steckbrief';

/**
 * Slides fertig oder übersprungen: merken, dann weiter. Erster Login → Profil;
 * der Gründer (Konto steht scho, Steckbrief no leer) sieht die Slides zum
 * ersten Mal → gleich in den Steckbrief-Editor; sonst Hoam.
 */
export async function onboardingFertig(): Promise<void> {
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  if (!me.onboardingGesehen) db.update(members).set({ onboardingGesehen: true }).where(eq(members.id, me.id)).run();
  if (me.erstanmeldung) redirect('/profil');
  redirect(!me.onboardingGesehen && steckbriefLeer(me) ? '/profil?steckbrief=1' : '/');
}

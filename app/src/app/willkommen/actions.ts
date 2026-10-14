'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db, members } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';

/** Slides fertig oder übersprungen: merken, dann weiter (erster Login → Profil, sonst Hoam). */
export async function onboardingFertig(): Promise<void> {
  const me = await getCurrentMember();
  if (!me) redirect('/login');
  if (!me.onboardingGesehen) db.update(members).set({ onboardingGesehen: true }).where(eq(members.id, me.id)).run();
  redirect(me.erstanmeldung ? '/profil' : '/');
}

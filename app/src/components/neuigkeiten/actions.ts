'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db, members } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { NEUIGKEITEN_AUSGABE } from '@/lib/neuigkeiten';

/** „Was ist neu“ weggewischt: merken, dann kommt's nimmer. */
export async function neuigkeitenGesehen(): Promise<void> {
  const me = await getCurrentMember();
  if (!me) return;
  db.update(members).set({ neuigkeitenGesehen: NEUIGKEITEN_AUSGABE }).where(eq(members.id, me.id)).run();
  revalidatePath('/', 'layout');
}

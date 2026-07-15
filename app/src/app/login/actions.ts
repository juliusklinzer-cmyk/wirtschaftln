'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, members } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSession, destroySession } from '@/lib/session';

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Bitte E-Mail und Passwort eingeben.' };

  const member = db.select().from(members).where(eq(members.email, email)).get();
  if (!member || !verifyPassword(password, member.passwordHash)) {
    return { error: 'Des passt ned — E-Mail oder Passwort falsch.' };
  }
  if (member.status !== 'aktiv') {
    return { error: 'Dein Antrag läuft noch — a bisserl Geduld.' };
  }
  await createSession(member.id);
  redirect('/');
}

export async function logout() {
  await destroySession();
  redirect('/login');
}

'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, members } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { createSession, destroySession } from '@/lib/session';

export type LoginState = { error?: string };

// Brute-Force-Bremse: 5 Fehlversuche pro E-Mail → 15 Minuten Sperre.
// In-Memory reicht, die App läuft als einzelne Container-Instanz; nebenbei
// bremst die Sperre das synchrone scrypt (sonst DoS-Hebel ohne Account).
const MAX_FEHLVERSUCHE = 5;
const SPERRE_MS = 15 * 60_000;
const fehlversuche = new Map<string, { count: number; bis: number }>();
// Vergleich läuft auch bei unbekannter E-Mail (gleiches Timing, keine Enumeration).
const DUMMY_HASH = hashPassword(randomDummy());
function randomDummy() {
  return `dummy-${Math.random().toString(36).slice(2)}`;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Bitte E-Mail und Passwort eingeben.' };

  const sperre = fehlversuche.get(email);
  if (sperre && sperre.count >= MAX_FEHLVERSUCHE) {
    if (Date.now() < sperre.bis) return { error: 'Z’viele Fehlversuche, probier’s in a Viertelstund nomoi.' };
    fehlversuche.delete(email);
  }

  const member = db.select().from(members).where(eq(members.email, email)).get();
  const passt = verifyPassword(password, member?.passwordHash ?? DUMMY_HASH);
  if (!member || !passt) {
    if (fehlversuche.size > 500) {
      for (const [k, v] of fehlversuche) if (Date.now() >= v.bis) fehlversuche.delete(k);
    }
    const f = fehlversuche.get(email) ?? { count: 0, bis: 0 };
    fehlversuche.set(email, { count: f.count + 1, bis: Date.now() + SPERRE_MS });
    return { error: 'Des passt ned, E-Mail oder Passwort falsch.' };
  }
  fehlversuche.delete(email);
  if (member.status !== 'aktiv') {
    return { error: 'Dein Antrag läuft noch, a bisserl Geduld.' };
  }
  await createSession(member.id);
  // Erstanmeldung: zuerst Passwort setzen und Profil ausfüllen
  redirect(member.erstanmeldung ? '/profil' : '/');
}

export async function logout() {
  await destroySession();
  redirect('/login');
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { randomBytes } from 'node:crypto';
import { and, eq, ne } from 'drizzle-orm';
import { db, members, sessions } from '@/lib/db';

const COOKIE = 'wn_session';
const MAX_AGE_DAYS = 90;

export async function createSession(memberId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAX_AGE_DAYS * 864e5).toISOString();
  db.insert(sessions).values({ token, memberId, expiresAt }).run();
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_DAYS * 86400,
    path: '/',
  });
}

/**
 * Erstanmeldung erzwingen: solange Passwort/Profil nicht gesetzt sind, führt
 * jede Seite auf /profil (dort selbst nicht aufrufen, sonst Redirect-Schleife).
 */
export function erzwingeProfil(me: { erstanmeldung: boolean } | null) {
  // Ohne Session rendert die Seite parallel zum Login-Redirect des Layouts —
  // hier sauber selbst redirecten statt mit TypeError d'Logs zuzumüllen
  if (!me) redirect('/login');
  if (me.erstanmeldung) redirect('/profil');
}

/** Alle anderen Sessions des Mitglieds beenden (nach Passwortwechsel). */
export async function destroyOtherSessions(memberId: string) {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  db.delete(sessions)
    .where(token ? and(eq(sessions.memberId, memberId), ne(sessions.token, token)) : eq(sessions.memberId, memberId))
    .run();
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.delete(sessions).where(eq(sessions.token, token)).run();
  jar.delete(COOKIE);
}

/** Eingeloggtes Mitglied oder null. Pro Request gecacht. */
export const getCurrentMember = cache(async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const row = db
    .select({ member: members, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(members, eq(sessions.memberId, members.id))
    .where(eq(sessions.token, token))
    .get();
  if (!row) return null;
  if (row.expiresAt < new Date().toISOString()) {
    db.delete(sessions).where(eq(sessions.token, token)).run();
    return null;
  }
  if (row.member.status !== 'aktiv') return null;
  return row.member;
});

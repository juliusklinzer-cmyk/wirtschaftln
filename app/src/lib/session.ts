import { cookies } from 'next/headers';
import { cache } from 'react';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
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

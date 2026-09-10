import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { randomBytes } from 'node:crypto';
import { and, eq, ne } from 'drizzle-orm';
import { db, members, sessions, bindTenant, currentTenant, runWithTenant, tenantVerfuegbar } from '@/lib/db';
import { istGueltigerSlug } from '@/lib/db/core';
import { gruenderGruppeId } from '@/lib/db/directory';

const COOKIE = 'wn_session';
const MAX_AGE_DAYS = 90;

/**
 * Cookie-Wert ist `<gruppeId>:<token>`. Legacy-Cookies von vor dem
 * Mandanten-Umbau haben kein Präfix → gehören zum Gründer-Mandanten
 * (Übergangsfenster, damit beim Umstieg keiner rausfliegt).
 * Der gruppeId-Teil ist client-kontrolliert und wird IMMER erst gegen das
 * Verzeichnis geprüft (bindTenant), bevor irgendwas eine DB anfasst.
 */
function parseSessionCookie(raw: string): { gruppeId: string; token: string } | null {
  const i = raw.indexOf(':');
  if (i < 0) return { gruppeId: gruenderGruppeId(), token: raw };
  const gruppeId = raw.slice(0, i);
  const token = raw.slice(i + 1);
  if (!istGueltigerSlug(gruppeId) || !token) return null;
  return { gruppeId, token };
}

async function sessionAusCookie() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  return raw ? parseSessionCookie(raw) : null;
}

/** Session für ein Mitglied des GERADE GEBUNDENEN Mandanten anlegen. */
export async function createSession(memberId: string) {
  const tenant = currentTenant();
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAX_AGE_DAYS * 864e5).toISOString();
  db.insert(sessions).values({ token, memberId, expiresAt }).run();
  const jar = await cookies();
  jar.set(COOKIE, `${tenant.id}:${token}`, {
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
  const token = (await sessionAusCookie())?.token;
  db.delete(sessions)
    .where(token ? and(eq(sessions.memberId, memberId), ne(sessions.token, token)) : eq(sessions.memberId, memberId))
    .run();
}

export async function destroySession() {
  const jar = await cookies();
  const s = await sessionAusCookie();
  if (s && bindTenant(s.gruppeId)) db.delete(sessions).where(eq(sessions.token, s.token)).run();
  jar.delete(COOKIE);
}

/**
 * Eingeloggtes Mitglied oder null. Pro Request gecacht — und der Punkt, an
 * dem der Mandant für Server Components & Actions gebunden wird.
 */
export const getCurrentMember = cache(async () => {
  const s = await sessionAusCookie();
  if (!s) return null;
  if (!bindTenant(s.gruppeId)) return null;
  const row = db
    .select({ member: members, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(members, eq(sessions.memberId, members.id))
    .where(eq(sessions.token, s.token))
    .get();
  if (!row) return null;
  if (row.expiresAt < new Date().toISOString()) {
    db.delete(sessions).where(eq(sessions.token, s.token)).run();
    return null;
  }
  if (row.member.status !== 'aktiv') return null;
  return row.member;
});

/**
 * Für Route-Handler: React-cache greift dort ned, deshalb den Mandanten aus
 * dem Cookie per AsyncLocalStorage um den ganzen Handler legen. Ohne (gültigen)
 * Cookie läuft der Callback ohne Mandanten — getCurrentMember liefert dann null.
 */
export async function withSessionTenant<T>(fn: () => Promise<T>): Promise<T> {
  const s = await sessionAusCookie();
  if (s && tenantVerfuegbar(s.gruppeId)) return runWithTenant(s.gruppeId, fn);
  return fn();
}

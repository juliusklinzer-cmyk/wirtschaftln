'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, members, bindTenant } from '@/lib/db';
import { findGruppe, kontenFuerEmail, passwortTokenAnlegen, passwortTokenFinden, passwortTokensLoeschen } from '@/lib/db/directory';
import { hashPassword } from '@/lib/password';
import { createSession } from '@/lib/session';
import { mailAn } from '@/lib/mail';
import { appUrl } from '@/lib/tenant-config';

export type AnfordernState = { fertig?: boolean; error?: string };
export type NeuState = { error?: string };

// Bremse: 5 Anfragen pro Absender in 15 Minuten, damit koana fremde Postfächer zumüllt
const MAX_ANFRAGEN = 5;
const FENSTER_MS = 15 * 60_000;
const anfragen = new Map<string, { count: number; bis: number }>();

async function absender(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unbekannt';
}

/**
 * „Passwort vergessen“: pro Konto (E-Mail + Stammtisch) ein Link-Token, alles
 * in EINER Mail. Die Antwort is immer gleich, egal ob's die E-Mail gibt
 * (koa Enumeration).
 */
export async function linkAnfordern(_prev: AnfordernState, formData: FormData): Promise<AnfordernState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Das schaut nicht nach einer E-Mail aus.' };

  const wer = await absender();
  if (anfragen.size > 500) {
    for (const [k, v] of anfragen) if (Date.now() >= v.bis) anfragen.delete(k);
  }
  const a = anfragen.get(wer) ?? { count: 0, bis: Date.now() + FENSTER_MS };
  if (Date.now() >= a.bis) { a.count = 0; a.bis = Date.now() + FENSTER_MS; }
  if (a.count >= MAX_ANFRAGEN) return { error: 'Zu viele Anfragen, probier’s in einer Viertelstunde nochmal.' };
  anfragen.set(wer, { count: a.count + 1, bis: a.bis });

  const links: Array<{ name: string; url: string; vorname: string | null }> = [];
  for (const konto of kontenFuerEmail(email).slice(0, 5)) {
    if (!bindTenant(konto.gruppeId)) continue;
    const member = db.select().from(members).where(eq(members.email, email)).get();
    if (!member || member.status !== 'aktiv') continue;
    const t = passwortTokenAnlegen(email, konto.gruppeId, member.id);
    links.push({ name: findGruppe(konto.gruppeId)?.name ?? 'Wirtschaftln', url: appUrl(`/passwort/${t.token}`), vorname: member.vorname });
  }
  if (links.length > 0) {
    const anrede = links[0].vorname ? `Servus ${links[0].vorname},` : 'Servus,';
    const liste = links.length === 1 ? links[0].url : links.map((l) => `${l.name}: ${l.url}`).join('\n');
    const text = [
      anrede,
      '',
      links.length === 1 ? 'mit diesem Link setzt du dir ein neues Passwort für Wirtschaftln:' : 'du bist in mehreren Stammtischen, für jeden gibt’s einen eigenen Link zum neuen Passwort:',
      '',
      liste,
      '',
      'Der Link gilt eine Stunde. Wenn du das nicht warst, ignorier die Mail einfach, dein Passwort bleibt wie es ist.',
      '',
      'Dei Wirtschaftln-App',
    ].join('\n');
    await mailAn([email], 'Neues Passwort für Wirtschaftln', text);
  }
  return { fertig: true };
}

/** Neues Passwort über den Link setzen; danach gleich angemeldet. */
export async function passwortSetzen(_prev: NeuState, formData: FormData): Promise<NeuState> {
  const token = String(formData.get('token') ?? '').trim();
  const passwort = String(formData.get('passwort') ?? '');
  const wdh = String(formData.get('passwortWdh') ?? '');
  const t = token ? passwortTokenFinden(token) : null;
  if (!t) return { error: 'Der Link ist abgelaufen. Fordere einfach einen neuen an.' };
  if (passwort.length < 6) return { error: 'Das Passwort braucht mindestens 6 Zeichen.' };
  if (passwort !== wdh) return { error: 'Die beiden Passwörter passen nicht zusammen.' };
  if (!bindTenant(t.gruppeId)) return { error: 'Der Stammtisch ist gerade nicht erreichbar.' };
  const member = db.select().from(members).where(eq(members.id, t.memberId)).get();
  if (!member || member.status !== 'aktiv') return { error: 'Der Link ist abgelaufen. Fordere einfach einen neuen an.' };
  db.update(members).set({ passwordHash: hashPassword(passwort) }).where(eq(members.id, member.id)).run();
  passwortTokensLoeschen(t.email);
  await createSession(member.id);
  redirect(member.erstanmeldung ? '/profil' : '/');
}

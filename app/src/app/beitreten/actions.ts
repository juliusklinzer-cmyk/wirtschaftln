'use server';

import { redirect } from 'next/navigation';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, members } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { createSession } from '@/lib/session';
import { newId, nowIso } from '@/lib/ids';

export type BeitrittState = { error?: string };

/**
 * Gründungscode aus der Env; leerer String = Aufnahme geschlossen.
 * Fail-closed: fehlt die Env auf Prod, ist die Aufnahme ZU (der Default
 * stünde sonst für jeden lesbar im Repo). Nur im Dev gibt's den Default.
 */
function gruendungscode(): string {
  return process.env.WN_GRUENDUNGSCODE ?? (process.env.NODE_ENV === 'development' ? '1328' : '');
}

// Bremse gegen Code-Raten: 10 Fehlversuche → 15 Minuten Pause (in-memory reicht)
const MAX_FEHLVERSUCHE = 10;
const SPERRE_MS = 15 * 60_000;
let fehlversuche = 0;
let gesperrtBis = 0;

/**
 * Gründungsmitglied werden: Code aus der WhatsApp-Gruppe + Name + E-Mail.
 * Der Account startet als Erstanmeldung, Passwort setzen + Profil ausfüllen
 * passiert direkt danach auf /profil, dann geht’s eini in d’App.
 */
export async function beitreten(_prev: BeitrittState, formData: FormData): Promise<BeitrittState> {
  const code = String(formData.get('code') ?? '').trim();
  const nachname = String(formData.get('nachname') ?? '').trim();
  const vorname = String(formData.get('vorname') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!gruendungscode()) return { error: 'D’Aufnahme is grad zua, meld di beim Julius.' };
  if (Date.now() < gesperrtBis) return { error: 'Z’viele Fehlversuche, probier’s in a Viertelstund nomoi.' };
  if (code !== gruendungscode()) {
    fehlversuche += 1;
    if (fehlversuche >= MAX_FEHLVERSUCHE) {
      gesperrtBis = Date.now() + SPERRE_MS;
      fehlversuche = 0;
    }
    return { error: 'Der Gründungscode stimmt ned, schau nomoi in d’Gruppe.' };
  }
  fehlversuche = 0;

  if (!vorname || !nachname) return { error: 'Bitte Vor- und Nachname eintragen.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Des schaut ned nach einer E-Mail aus.' };
  if (db.select().from(members).where(eq(members.email, email)).get()) {
    return { error: 'Mit der E-Mail gibt’s scho an Account, probier di einfach anzumelden.' };
  }

  const id = newId('m');
  db.insert(members)
    .values({
      id,
      name: `${vorname} ${nachname}`,
      vorname,
      nachname,
      email,
      // Zufalls-Hash als Platzhalter, das echte Passwort setzt der Spezl
      // gleich selbst (Erstanmeldung erzwingt es auf /profil)
      passwordHash: hashPassword(randomBytes(24).toString('hex')),
      role: 'mitglied',
      status: 'aktiv',
      erstanmeldung: true,
      createdAt: nowIso(),
    })
    .run();

  await createSession(id);
  redirect('/profil');
}

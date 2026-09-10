'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, members, bindTenant } from '@/lib/db';
import { findGruppeByCode, kontoAnlegen } from '@/lib/db/directory';
import { hashPassword } from '@/lib/password';
import { createSession } from '@/lib/session';
import { newId, nowIso } from '@/lib/ids';

export type BeitrittState = { error?: string };

// Bremse gegen Code-Raten: 10 Fehlversuche → 15 Minuten Pause, gezählt pro
// Absender (X-Forwarded-For von Caddy). Bewusst NICHT global: sonst könnt
// ein einzelner Rater die Aufnahme für ALLE Stammtische dichtmachen.
const MAX_FEHLVERSUCHE = 10;
const SPERRE_MS = 15 * 60_000;
const fehlversuche = new Map<string, { count: number; bis: number }>();

async function absender(): Promise<string> {
  const h = await headers();
  const xff = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  return xff || h.get('x-real-ip') || 'unbekannt';
}

/**
 * Gründungsmitglied werden: Code aus der WhatsApp-Gruppe + Name + E-Mail.
 * Der Code bestimmt den Stammtisch (Verzeichnis-Lookup, ein Code pro Gruppe).
 * Der Account startet als Erstanmeldung, Passwort setzen + Profil ausfüllen
 * passiert direkt danach auf /profil, dann geht’s eini in d’App.
 */
export async function beitreten(_prev: BeitrittState, formData: FormData): Promise<BeitrittState> {
  const code = String(formData.get('code') ?? '').trim();
  const nachname = String(formData.get('nachname') ?? '').trim();
  const vorname = String(formData.get('vorname') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  const wer = await absender();
  const sperre = fehlversuche.get(wer);
  if (sperre && sperre.count >= MAX_FEHLVERSUCHE) {
    if (Date.now() < sperre.bis) return { error: 'Z’viele Fehlversuche, probier’s in a Viertelstund nomoi.' };
    fehlversuche.delete(wer);
  }

  const gruppe = code ? findGruppeByCode(code) : null;
  if (!gruppe || gruppe.status !== 'aktiv') {
    if (fehlversuche.size > 500) {
      for (const [k, v] of fehlversuche) if (Date.now() >= v.bis) fehlversuche.delete(k);
    }
    const f = fehlversuche.get(wer) ?? { count: 0, bis: 0 };
    fehlversuche.set(wer, { count: f.count + 1, bis: Date.now() + SPERRE_MS });
    return { error: 'Der Gründungscode stimmt ned, schau nomoi in d’Gruppe.' };
  }
  fehlversuche.delete(wer);

  if (!vorname || !nachname) return { error: 'Bitte Vor- und Nachname eintragen.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Des schaut ned nach einer E-Mail aus.' };

  if (!bindTenant(gruppe.id)) return { error: 'D’Aufnahme is grad zua, meld di beim Julius.' };
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
  kontoAnlegen(email, gruppe.id, id);

  await createSession(id);
  redirect('/profil');
}

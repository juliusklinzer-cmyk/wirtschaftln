'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db, members, aemter } from '@/lib/db';
import { getCurrentMember } from '@/lib/session';
import { hashPassword } from '@/lib/password';
import { newId, nowIso } from '@/lib/ids';
import { amtInfo } from '@/lib/badges';
import { aktuelleSaison } from '@/lib/saison';
import { getPraesidentId, getAktiveMitglieder } from '@/lib/queries';
import { anzeigeName } from '@/lib/namen';
import { pushAnAlle } from '@/lib/push';
import { mailAn } from '@/lib/mail';

/** Admin legt ein neues Mitglied an (geschlossener Kreis — keine Selbstregistrierung). */
export async function mitgliedAnlegen(formData: FormData) {
  const me = await getCurrentMember();
  if (!me || me.role !== 'admin') return;
  const vorname = String(formData.get('vorname') ?? '').trim();
  const nachname = String(formData.get('nachname') ?? '').trim();
  const spitzname = String(formData.get('spitzname') ?? '').trim() || null;
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!vorname || !nachname || !email || password.length < 6) return;
  db.insert(members)
    .values({
      id: newId('m'),
      name: `${vorname} ${nachname}`,
      vorname,
      nachname,
      spitzname,
      email,
      passwordHash: hashPassword(password),
      role: 'mitglied',
      status: 'aktiv',
      erstanmeldung: true, // beim ersten Login: Passwort setzen + Profil ausfüllen
      createdAt: nowIso(),
    })
    .run();
  revalidatePath('/spezln');
}

/**
 * Kassenwart-Wahlergebnis eintragen — darf der Admin oder der aktuelle
 * Präsident. Es gibt nur dieses eine wählbare Amt (Präsident & Schriftführer
 * werden automatisch vergeben); alle Spezln kriegen Push + Mail.
 * Echte In-App-Wahl kommt später — siehe TODO.md.
 */
export async function amtZuweisen(formData: FormData) {
  const me = await getCurrentMember();
  if (!me || (me.role !== 'admin' && me.id !== getPraesidentId())) return;
  const memberId = String(formData.get('memberId') ?? '');
  const neuer = getAktiveMitglieder().find((m) => m.id === memberId);
  if (!neuer) return;
  const titel = 'Kassenwart';
  const saison = String(aktuelleSaison().jahr);
  db.delete(aemter).where(and(eq(aemter.titel, titel), eq(aemter.saison, saison))).run();
  db.insert(aemter)
    .values({ id: newId('a'), titel, icon: amtInfo(titel).icon, memberId, saison })
    .run();

  // 📣 Info an alle: neuer Kassenwart
  const name = anzeigeName(neuer);
  const titelText = '💰 Neuer Kassenwart!';
  const text = `${name} is jetza da Kassenwart — wahrt d’Kasse, treibt d’Schulden ein und nimmt Bares entgegen.`;
  const empfaenger = getAktiveMitglieder().filter((m) => m.id !== me.id).map((m) => m.email);
  await Promise.allSettled([
    pushAnAlle(titelText, text, '/spezln'),
    mailAn(empfaenger, titelText, `Servus!\n\n${text}\n\n→ https://wirtschaftln.de/spezln\n\nDei Wirtschaftln-App`),
  ]);
  revalidatePath('/spezln');
}

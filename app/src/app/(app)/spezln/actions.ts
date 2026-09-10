'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db, members, aemter, currentTenant } from '@/lib/db';
import { kontoAnlegen } from '@/lib/db/directory';
import { getCurrentMember } from '@/lib/session';
import { hashPassword } from '@/lib/password';
import { newId, nowIso } from '@/lib/ids';
import { amtInfo } from '@/lib/badges';
import { aktuelleSaison } from '@/lib/saison';
import { getPraesidentId, getAktiveMitglieder } from '@/lib/queries';
import { anzeigeName } from '@/lib/namen';
import { pushAnAlle } from '@/lib/push';
import { mailAn } from '@/lib/mail';
import { appUrl, mailSignatur, tenantConfig } from '@/lib/tenant-config';

export type AufnahmeErgebnis = { ok: true; meldung: string } | { ok: false; meldung: string };

/**
 * Admin legt ein neues Mitglied an (geschlossener Kreis, keine Selbst-
 * registrierung). Der Neue kriegt eine Willkommens-Mail mit Login-Link und
 * Start-Passwort (beim ersten Login muss er eh ein eigenes setzen).
 * Früher scheiterte das stumm (kurzes Passwort, doppelte E-Mail) und
 * verschickte nix, drum gibt's jetzt eine ordentliche Rückmeldung.
 */
export async function mitgliedAnlegen(formData: FormData): Promise<AufnahmeErgebnis> {
  const me = await getCurrentMember();
  if (!me || me.role !== 'admin') return { ok: false, meldung: 'Aufnehmen derf nur der Admin.' };
  const vorname = String(formData.get('vorname') ?? '').trim();
  const nachname = String(formData.get('nachname') ?? '').trim();
  const spitzname = String(formData.get('spitzname') ?? '').trim() || null;
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!vorname || !nachname || !email) return { ok: false, meldung: 'Vorname, Nachname und E-Mail brauchts.' };
  if (password.length < 6) return { ok: false, meldung: 'Des Start-Passwort braucht mindestens 6 Zeichen.' };
  // E-Mail is unique, Dublette würd sonst als Unique-Fehler krachen
  if (db.select().from(members).where(eq(members.email, email)).get()) {
    return { ok: false, meldung: `Mit ${email} gibt's scho an Account.` };
  }
  const id = newId('m');
  db.insert(members)
    .values({
      id,
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
  // Login-Routing: E-Mail → Stammtisch im Verzeichnis merken
  kontoAnlegen(email, currentTenant().id, id);

  // 📬 Willkommens-Mail an den Neuen, mit Zugang und dem Hinweis, dass er
  // beim ersten Anmelden sei eigenes Passwort setzt.
  const c = tenantConfig();
  const woher = [c.stadt, c.gruendungsjahr ? `seit ${c.gruendungsjahr}` : null].filter(Boolean).join(', ');
  await mailAn(
    [email],
    `🍺 Servus beim ${c.name}-Stammtisch!`,
    `Servus ${vorname}!\n\nDu bist jetzt dabei beim ${c.name}, dem Stammtisch${woher ? `, ${woher}` : ''}.\n\nSo kommst eini:\n→ ${appUrl('/login')}\nE-Mail: ${email}\nStart-Passwort: ${password}\n\nBeim ersten Anmelden setzt dich glei dei eigenes Passwort und füllst dei Profil aus (Lieblingsbier ned vergessen).\n\nBis boid am Tisch!\n${mailSignatur()}`,
  );
  revalidatePath('/spezln');
  return { ok: true, meldung: `✓ ${vorname} is aufgnommen, d'Willkommens-Mail an ${email} is raus.` };
}

/**
 * Kassenwart-Wahlergebnis eintragen, darf der Admin oder der aktuelle
 * Präsident. Es gibt nur dieses eine wählbare Amt (Präsident & Schriftführer
 * werden automatisch vergeben); alle Spezln kriegen Push + Mail.
 * Echte In-App-Wahl kommt später, siehe TODO.md.
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
  const text = `${name} is jetza da Kassenwart, wahrt d’Kasse, treibt d’Schulden ein und nimmt Bares entgegen.`;
  const empfaenger = getAktiveMitglieder().filter((m) => m.id !== me.id).map((m) => m.email);
  await Promise.allSettled([
    pushAnAlle(titelText, text, '/spezln'),
    mailAn(empfaenger, titelText, `Servus!\n\n${text}\n\n→ ${appUrl('/spezln')}\n\n${mailSignatur()}`),
  ]);
  revalidatePath('/spezln');
}

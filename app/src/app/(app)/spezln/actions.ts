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
import { mailWillkommen } from '@/lib/mail-vorlagen';
import { mailRahmen } from '@/lib/mail-rahmen';
import { darfWacklerEntscheiden, wacklerEntscheiden } from '@/lib/wackler';
import { offeneAntraege, darfEntscheiden, antragAnnehmen, antragAblehnen, buergeLehntAb } from '@/lib/aufnahme';
import { auszeichnungAn, tenantConfig } from '@/lib/tenant-config';

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
  // E-Mail is unique, Dublette würd sonst als Unique-Fehler krachen.
  // Ausnahme: wer sich verabschiedet hat, wird mit derselben E-Mail wieder aufgnommen
  // (Chronik und Punkte san no da, er kriegt a neues Start-Passwort).
  const vorhanden = db.select().from(members).where(eq(members.email, email)).get();
  if (vorhanden && vorhanden.status === 'inaktiv') {
    db.update(members)
      .set({ status: 'aktiv', ausgeschiedenAm: null, abschied: null, vorname, nachname, name: `${vorname} ${nachname}`, spitzname, passwordHash: hashPassword(password), erstanmeldung: true })
      .where(eq(members.id, vorhanden.id))
      .run();
    const c = tenantConfig();
    const woher = [c.stadt ? `aus ${c.stadt}` : null, c.gruendungsjahr ? `seit ${c.gruendungsjahr}` : null].filter(Boolean).join(', ');
    const mail = mailWillkommen(mailRahmen(), { vorname, woher, email, passwort: password });
    await mailAn([email], mail.betreff, mail.inhalt);
    revalidatePath('/spezln');
    return { ok: true, meldung: `✓ ${vorname} is wieder dabei, d'Willkommens-Mail an ${email} is raus.` };
  }
  if (vorhanden) {
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
  const woher = [c.stadt ? `aus ${c.stadt}` : null, c.gruendungsjahr ? `seit ${c.gruendungsjahr}` : null].filter(Boolean).join(', ');
  const mail = mailWillkommen(mailRahmen(), { vorname, woher, email, passwort: password });
  await mailAn([email], mail.betreff, mail.inhalt);
  revalidatePath('/spezln');
  return { ok: true, meldung: `✓ ${vorname} is aufgnommen, d'Willkommens-Mail an ${email} is raus.` };
}

/**
 * Kassenwart-Wahlergebnis eintragen, darf der Admin oder der aktuelle
 * Präsident. Es gibt nur dieses eine wählbare Amt (Präsident & Schriftführer
 * werden automatisch vergeben); alle Spezln kriegen an Push.
 * Echte In-App-Wahl kommt später, siehe TODO.md.
 */
export async function amtZuweisen(formData: FormData) {
  const me = await getCurrentMember();
  if (!me || (me.role !== 'admin' && me.id !== getPraesidentId()) || !auszeichnungAn('amt:kassenwart')) return;
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
  // Nur Push, für so was gibt's koa Mail (Julius, 30.10.2026)
  await pushAnAlle(titelText, text, '/spezln');
  revalidatePath('/spezln');
}

/** Wackler ohne Antwort: Präsident (oder Admin) lässt ihn ausscheiden oder dabei. */
export async function wacklerEntscheidenAction(anfrageId: string, entscheidung: 'raus' | 'bleibt'): Promise<{ ok: boolean }> {
  const me = await getCurrentMember();
  if (!me || !darfWacklerEntscheiden(me)) return { ok: false };
  if (entscheidung !== 'raus' && entscheidung !== 'bleibt') return { ok: false };
  const ok = await wacklerEntscheiden(anfrageId, entscheidung);
  revalidatePath('/spezln');
  return { ok };
}

/**
 * Aufnahme (WIR-013): der Bürge bürgt oder kennt den Neuen nicht; Präsident
 * und Admin nehmen auf oder lehnen ab, auch ohne Bürgen (Notfall).
 */
export async function aufnahmeEntscheiden(antragId: string, entscheidung: 'buergen' | 'kenneNicht' | 'aufnehmen' | 'ablehnen'): Promise<{ ok: boolean }> {
  const me = await getCurrentMember();
  if (!me) return { ok: false };
  const antrag = offeneAntraege().find((a) => a.id === antragId);
  if (!antrag || !darfEntscheiden(antrag, me)) return { ok: false };
  const istEntscheider = me.role === 'admin' || me.id === getPraesidentId();
  let ok = false;
  if (entscheidung === 'buergen' || (entscheidung === 'aufnehmen' && istEntscheider)) ok = await antragAnnehmen(antragId, me.id);
  else if (entscheidung === 'kenneNicht' && antrag.buergeId === me.id) ok = await buergeLehntAb(antragId, me.id);
  else if (entscheidung === 'ablehnen' && istEntscheider) ok = antragAblehnen(antragId);
  revalidatePath('/', 'layout');
  return { ok };
}

import { and, eq, inArray } from 'drizzle-orm';
import { db, members, sessions, currentTenant } from '@/lib/db';
import { kontoLoeschen } from '@/lib/db/directory';
import { tenantConfig } from '@/lib/tenant-config';
import { anzeigeName } from '@/lib/namen';
import { getAktiveMitglieder, getPraesidentId } from '@/lib/queries';
import { pushAn } from '@/lib/push';
import { mailAn } from '@/lib/mail';
import { mailAufgenommen, mailBuergschaft } from '@/lib/mail-vorlagen';
import { mailRahmen } from '@/lib/mail-rahmen';

/**
 * Aufnahme mit Bürge und Kodex (WIR-013, 09.11.2026): wer mit dem Code kommt,
 * nennt einen Bürgen aus der Runde und bestätigt den Kodex. Er steht dann auf
 * 'antrag' und sieht nur die Warteseite, bis der Bürge für ihn bürgt. Kennt
 * der Bürge ihn nicht oder rührt sich nicht, entscheiden Präsident und Admin.
 */

/** Gilt, solange der Stammtisch keinen eigenen Kodex hinterlegt hat. */
export const STANDARD_KODEX = [
  'Wer zusagt, kommt. Wer nicht kann, sagt rechtzeitig ab.',
  'Jeder zahlt seine Zeche, Strafen gehen in die Kasse.',
  'Was am Stammtisch gesagt wird, bleibt am Stammtisch.',
  'Der Abend wird ehrlich eingetragen, Hoibe für Hoibe.',
].join('\n');

export function kodexText(): string {
  return tenantConfig().kodex ?? STANDARD_KODEX;
}

/** Der Kodex als einzelne Sätze (je Zeile einer). */
export function kodexSaetze(text = kodexText()): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

/** Wer als Bürge in Frage kommt: alle aktiven Spezln (Erstanmeldung fertig). */
export function moeglicheBuergen() {
  return getAktiveMitglieder()
    .filter((m) => !m.erstanmeldung)
    .map((m) => ({ id: m.id, name: anzeigeName(m) }));
}

export type Antrag = { id: string; name: string; seit: string; buergeId: string | null; buergeName: string | null };

/** Offene Anträge im gebundenen Stammtisch, die ältesten zuerst. */
export function offeneAntraege(): Antrag[] {
  const antraege = db.select().from(members).where(eq(members.status, 'antrag')).orderBy(members.createdAt).all();
  if (antraege.length === 0) return [];
  const buergen = new Map(getAktiveMitglieder().map((m) => [m.id, anzeigeName(m)]));
  return antraege.map((a) => ({ id: a.id, name: anzeigeName(a), seit: a.createdAt, buergeId: a.buergeId, buergeName: a.buergeId ? (buergen.get(a.buergeId) ?? null) : null }));
}

/** Darf der Spezl über den Antrag entscheiden? Der genannte Bürge, der Präsident und jeder Admin. */
export function darfEntscheiden(antrag: { buergeId: string | null }, me: { id: string; role: string }): boolean {
  return antrag.buergeId === me.id || me.role === 'admin' || getPraesidentId() === me.id;
}

/** Bürge per Push und Mail Bescheid geben (nach dem Beitritt). */
export async function buergenBenachrichtigen(neuerId: string): Promise<void> {
  const neu = db.select().from(members).where(eq(members.id, neuerId)).get();
  if (!neu?.buergeId) return;
  const buerge = db.select().from(members).where(eq(members.id, neu.buergeId)).get();
  if (!buerge) return;
  const name = anzeigeName(neu);
  await pushAn([buerge.id], `${name} will rein`, 'Du bist als Bürge genannt. Bürgst du?', '/');
  const mail = mailBuergschaft(mailRahmen(), { vorname: buerge.vorname ?? anzeigeName(buerge), neuer: name });
  await mailAn([buerge.email], mail.betreff, mail.inhalt).catch((e) => console.error('Bürgen-Mail:', e));
}

/** Aufnehmen: aus dem Antrag wird ein Spezl, er setzt danach Passwort und Profil. */
export async function antragAnnehmen(id: string, vonId: string): Promise<boolean> {
  const neu = db.select().from(members).where(and(eq(members.id, id), eq(members.status, 'antrag'))).get();
  if (!neu) return false;
  db.update(members).set({ status: 'aktiv' }).where(eq(members.id, id)).run();
  const von = db.select().from(members).where(eq(members.id, vonId)).get();
  const vonName = von ? anzeigeName(von) : 'Der Stammtisch';
  const mail = mailAufgenommen(mailRahmen(), { vorname: neu.vorname ?? anzeigeName(neu), von: vonName });
  await mailAn([neu.email], mail.betreff, mail.inhalt).catch((e) => console.error('Aufnahme-Mail:', e));
  // Die anderen, die hätten entscheiden dürfen, wissen's auch
  const andere = getAktiveMitglieder().filter((m) => m.id !== vonId && m.id !== id && (m.role === 'admin' || m.id === getPraesidentId() || m.id === neu.buergeId));
  await pushAn(andere.map((m) => m.id), `${anzeigeName(neu)} ist dabei`, `${vonName} hat aufgenommen.`, '/spezln');
  return true;
}

/** Ablehnen: der Antrag samt Konto verschwindet wieder (es gab ja noch nix von ihm). */
export function antragAblehnen(id: string): boolean {
  const neu = db.select().from(members).where(and(eq(members.id, id), eq(members.status, 'antrag'))).get();
  if (!neu) return false;
  db.delete(sessions).where(inArray(sessions.memberId, [id])).run();
  db.delete(members).where(eq(members.id, id)).run();
  kontoLoeschen(currentTenant().id, id);
  return true;
}

/** Der Bürge kennt den Neuen nicht: Bürge raus, Präsident und Admins entscheiden. */
export async function buergeLehntAb(id: string, buergeId: string): Promise<boolean> {
  const neu = db.select().from(members).where(and(eq(members.id, id), eq(members.status, 'antrag'), eq(members.buergeId, buergeId))).get();
  if (!neu) return false;
  db.update(members).set({ buergeId: null }).where(eq(members.id, id)).run();
  const entscheider = getAktiveMitglieder().filter((m) => m.role === 'admin' || m.id === getPraesidentId()).map((m) => m.id);
  await pushAn(entscheider, `${anzeigeName(neu)} will rein`, 'Der Bürge kennt den Neuen nicht. Du entscheidest.', '/');
  return true;
}

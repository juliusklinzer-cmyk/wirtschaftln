import { randomBytes } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db, members, sessions, pushSubscriptions, besuche, termine, wackelAnfragen, bindTenant, currentTenant } from '@/lib/db';
import { getAktiveMitglieder, getPraesidentId, getStats } from '@/lib/queries';
import { WACKELT_AB_UNENTSCHULDIGT, berlinTag } from '@/lib/punkte';
import { appUrl } from '@/lib/tenant-config';
import { datumKurz } from '@/lib/format';
import { anzeigeName } from '@/lib/namen';
import { newId, nowIso } from '@/lib/ids';
import { mailAn } from '@/lib/mail';
import { pushAn } from '@/lib/push';
import { mailAbschied, mailWackeln, mailWacklerOhneAntwort } from '@/lib/mail-vorlagen';
import { mailRahmen, rufname, willMail } from '@/lib/mail-rahmen';

/**
 * „Willst du no dabei sein?“ (Julius, 30.10.2026). Wer wackelt (3× in Folge
 * unentschuldigt), kriegt EINMAL pro Wackel-Phase a Mail mit Ja/Abschied.
 * A Phase endet, sobald er wieder dabei war (dann zählt die Serie neu).
 * Ohne Antwort meldet sich die App nach 14 Tagen beim Präsidenten, der
 * entscheidet dann auf /spezln (WacklerKarte).
 */
export const WACKEL_ANTWORT_TAGE = 14;

type Mitglied = typeof members.$inferSelect;
type Anfrage = typeof wackelAnfragen.$inferSelect;

/** Datum des letzten Abends, an dem der Spezl da war ('' = no nie). */
function zuletztDabei(memberId: string): string {
  const r = db
    .select({ datum: termine.datum })
    .from(besuche)
    .innerJoin(termine, eq(besuche.terminId, termine.id))
    .where(and(eq(besuche.memberId, memberId), eq(besuche.anwesend, true)))
    .orderBy(desc(termine.datum))
    .get();
  return r?.datum ?? '';
}

function antwortUrl(token: string, a: 'dabei' | 'abschied'): string {
  return appUrl(`/dabei/${encodeURIComponent(token)}?a=${a}`);
}

/** Wackler des gebundenen Stammtischs fragen und überfällige Anfragen beim Präsidenten melden. */
export async function wacklerPruefen(jetztIso = nowIso()): Promise<number> {
  const jobs: Promise<void>[] = [];
  const rahmen = mailRahmen();

  // Wer seit der Frage wieder dabei war, wackelt nimmer → Phase erledigt
  for (const a of db.select().from(wackelAnfragen).where(eq(wackelAnfragen.erledigt, false)).all()) {
    if (zuletztDabei(a.memberId) >= a.erstelltAm.slice(0, 10)) db.update(wackelAnfragen).set({ erledigt: true }).where(eq(wackelAnfragen.id, a.id)).run();
  }

  // ── Neue Wackler fragen ──
  for (const s of getStats()) {
    if (s.unentschuldigtStreak < WACKELT_AB_UNENTSCHULDIGT) continue;
    const seit = zuletztDabei(s.member.id);
    const schon = db
      .select({ erstelltAm: wackelAnfragen.erstelltAm })
      .from(wackelAnfragen)
      .where(eq(wackelAnfragen.memberId, s.member.id))
      .all()
      .some((a) => a.erstelltAm > seit);
    if (schon) continue;
    const token = `${currentTenant().id}.${randomBytes(18).toString('base64url')}`;
    db.insert(wackelAnfragen).values({ id: newId('wa'), memberId: s.member.id, token, erstelltAm: jetztIso }).run();
    const { betreff, inhalt } = mailWackeln(rahmen, {
      vorname: rufname(s.member),
      anzahl: s.unentschuldigtStreak,
      dabeiUrl: antwortUrl(token, 'dabei'),
      abschiedUrl: antwortUrl(token, 'abschied'),
    });
    jobs.push(mailAn([s.member.email], betreff, inhalt));
  }

  // ── Ohne Antwort nach 14 Tagen: Präsident (sonst die Admins) entscheidet ──
  const grenze = new Date(Date.parse(jetztIso) - WACKEL_ANTWORT_TAGE * 86_400_000).toISOString();
  const ueberfaellig = db
    .select()
    .from(wackelAnfragen)
    .where(and(isNull(wackelAnfragen.antwort), isNull(wackelAnfragen.praesidentGemeldetAm), eq(wackelAnfragen.erledigt, false)))
    .all()
    .filter((a) => a.erstelltAm <= grenze);
  if (ueberfaellig.length > 0) {
    const mitglieder = getAktiveMitglieder();
    const entscheider = entscheiderListe(mitglieder);
    for (const a of ueberfaellig) {
      const wackler = mitglieder.find((m) => m.id === a.memberId);
      db.update(wackelAnfragen).set({ praesidentGemeldetAm: jetztIso }).where(eq(wackelAnfragen.id, a.id)).run();
      if (!wackler) continue;
      const an = entscheider.filter((m) => m.id !== wackler.id);
      for (const m of an) {
        const { betreff, inhalt } = mailWacklerOhneAntwort(rahmen, { anrede: rufname(m), wackler: anzeigeName(wackler), gefragtAm: datumKurz(a.erstelltAm.slice(0, 10)) });
        jobs.push(mailAn([m.email], betreff, inhalt));
      }
      jobs.push(pushAn(an.map((m) => m.id), '⚠️ Wackler ohne Antwort', `${anzeigeName(wackler)} hat sich nicht gemeldet. Du entscheidest: ausscheiden lassen oder dabei lassen.`, '/spezln#wackler'));
    }
  }

  await Promise.allSettled(jobs);
  return jobs.length;
}

/** Präsident, und ohne Präsident die Admins. */
function entscheiderListe(mitglieder: Mitglied[]): Mitglied[] {
  const praesId = getPraesidentId();
  const praes = mitglieder.find((m) => m.id === praesId);
  return praes ? [praes] : mitglieder.filter((m) => m.role === 'admin');
}

/** Darf der Spezl über Wackler entscheiden? Präsident oder Admin. */
export function darfWacklerEntscheiden(m: Mitglied): boolean {
  return m.role === 'admin' || m.id === getPraesidentId();
}

/**
 * Spezl scheidet aus: Konto stilllegen (Login geht nimmer, Chronik bleibt),
 * Sessions und Push-Abos weg, alle anderen kriegen Push und a kurze Mail
 * (außer wer „Keine Mails“ eingestellt hat).
 */
export async function ausscheiden(memberId: string, wie: 'selbst' | 'praesident'): Promise<void> {
  const m = db.select().from(members).where(eq(members.id, memberId)).get();
  if (!m || m.status !== 'aktiv') return;
  db.update(members).set({ status: 'inaktiv', ausgeschiedenAm: nowIso(), abschied: wie }).where(eq(members.id, memberId)).run();
  db.delete(sessions).where(eq(sessions.memberId, memberId)).run();
  db.delete(pushSubscriptions).where(eq(pushSubscriptions.memberId, memberId)).run();
  db.update(wackelAnfragen).set({ erledigt: true }).where(eq(wackelAnfragen.memberId, memberId)).run();
  const name = anzeigeName(m);
  const text = wie === 'selbst' ? `${name} hat sich vom Stammtisch verabschiedet. Servus und mach’s gut!` : `${name} ist aus dem Stammtisch ausgeschieden.`;
  const andere = getAktiveMitglieder();
  const rahmen = mailRahmen();
  const mails = andere
    .filter((x) => willMail(x, 'termin') || willMail(x, 'erinnerung') || willMail(x, 'kasse'))
    .map((x) => {
      const { betreff, inhalt } = mailAbschied(rahmen, { anrede: rufname(x), name, selbst: wie === 'selbst' });
      return mailAn([x.email], betreff, inhalt);
    });
  await Promise.allSettled([pushAn(andere.map((x) => x.id), '👋 Abschied', text, '/spezln'), ...mails]);
}

/** Abschiede der letzten 90 Tage für die Zeile auf /spezln. */
export function letzteAbschiede(jetztIso = nowIso()): Array<{ id: string; name: string; am: string; selbst: boolean }> {
  const grenze = new Date(Date.parse(jetztIso) - 90 * 86_400_000).toISOString();
  return db
    .select()
    .from(members)
    .where(eq(members.status, 'inaktiv'))
    .orderBy(desc(members.ausgeschiedenAm))
    .all()
    .filter((m) => m.ausgeschiedenAm && m.ausgeschiedenAm >= grenze)
    .map((m) => ({ id: m.id, name: anzeigeName(m), am: datumKurz(berlinTag(m.ausgeschiedenAm!)), selbst: m.abschied !== 'praesident' }));
}

export type AnfrageMitMitglied = { anfrage: Anfrage; member: Mitglied };

/** Token aus der Mail → Anfrage + Spezl, Mandant wird dabei gebunden. null = ungültig. */
export function anfrageZuToken(tokenRoh: string): AnfrageMitMitglied | null {
  const token = tokenRoh.slice(0, 120);
  const gruppeId = token.split('.')[0];
  if (!gruppeId || !bindTenant(gruppeId)) return null;
  const anfrage = db.select().from(wackelAnfragen).where(eq(wackelAnfragen.token, token)).get();
  if (!anfrage) return null;
  const member = db.select().from(members).where(eq(members.id, anfrage.memberId)).get();
  return member ? { anfrage, member } : null;
}

/** Antwort aus der Mail speichern. */
export async function wackelAntwort(token: string, antwort: 'dabei' | 'abschied'): Promise<'ok' | 'ungueltig' | 'schon'> {
  const t = anfrageZuToken(token);
  if (!t) return 'ungueltig';
  if (t.anfrage.erledigt || t.member.status !== 'aktiv') return 'schon';
  db.update(wackelAnfragen)
    .set({ antwort, beantwortetAm: nowIso(), erledigt: antwort === 'abschied' })
    .where(eq(wackelAnfragen.id, t.anfrage.id))
    .run();
  if (antwort === 'abschied') await ausscheiden(t.member.id, 'selbst');
  return 'ok';
}

/** Offene Wackel-Phasen fürs Präsidenten-Panel (/spezln). */
export function offeneWackler(jetztIso = nowIso()): Array<{ id: string; name: string; gefragtAm: string; antwort: 'dabei' | null; entscheidbar: boolean }> {
  const grenze = new Date(Date.parse(jetztIso) - WACKEL_ANTWORT_TAGE * 86_400_000).toISOString();
  const mitglieder = getAktiveMitglieder();
  return db
    .select()
    .from(wackelAnfragen)
    .where(eq(wackelAnfragen.erledigt, false))
    .all()
    .flatMap((a) => {
      const m = mitglieder.find((x) => x.id === a.memberId);
      if (!m) return [];
      return [{ id: a.id, name: anzeigeName(m), gefragtAm: datumKurz(a.erstelltAm.slice(0, 10)), antwort: a.antwort === 'dabei' ? ('dabei' as const) : null, entscheidbar: !a.antwort && a.erstelltAm <= grenze }];
    });
}

/** Präsident entscheidet: raus oder bleibt (Phase is damit erledigt). */
export async function wacklerEntscheiden(anfrageId: string, entscheidung: 'raus' | 'bleibt'): Promise<boolean> {
  const a = db.select().from(wackelAnfragen).where(eq(wackelAnfragen.id, anfrageId)).get();
  if (!a || a.erledigt) return false;
  db.update(wackelAnfragen).set({ erledigt: true }).where(eq(wackelAnfragen.id, anfrageId)).run();
  if (entscheidung === 'raus') await ausscheiden(a.memberId, 'praesident');
  return true;
}

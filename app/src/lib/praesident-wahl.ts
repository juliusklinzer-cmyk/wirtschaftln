import { and, desc, eq, like } from 'drizzle-orm';
import { db, aemter, praesidentWahlen, praesidentStimmen, termine, runWithTenant } from '@/lib/db';
import { alleGruppen } from '@/lib/db/directory';
import { getAktiveMitglieder, getStats } from '@/lib/queries';
import { AEMTER_INFO } from '@/lib/badges';
import { eingetragenerPraesident, praesidentGewaehlt } from '@/lib/praesident';
import { berlinTag } from '@/lib/punkte';
import { pushAnAlle } from '@/lib/push';
import { anzeigeName } from '@/lib/namen';
import { newId, nowIso } from '@/lib/ids';

/**
 * Präsidentenwahl (Feedback München Tag & Nacht, 06.11.2026): Bei „Präsident
 * gewählt“ startet beim Schließen des ersten Stammtischs im Jahr automatisch
 * die Wahl, a Woch’ offen. Jeder hat oa Stimme (änderbar, solang offen), der
 * mit den meisten Stimmen is Präsident fürs Jahr. Gleichstand: mehr WP im Jahr.
 * Der Admin kann das Amt jederzeit selber eintragen oder a Wahl starten.
 */

export const WAHL_TAGE = 7;

export type Wahl = typeof praesidentWahlen.$inferSelect;

export function offeneWahl(): Wahl | null {
  return db.select().from(praesidentWahlen).where(eq(praesidentWahlen.status, 'offen')).orderBy(desc(praesidentWahlen.createdAt)).get() ?? null;
}

/** Jüngste ausgewertete Wahl (für den Hinweis „gewählt am …“). */
export function letzteWahl(): Wahl | null {
  return db.select().from(praesidentWahlen).where(eq(praesidentWahlen.status, 'ausgewertet')).orderBy(desc(praesidentWahlen.ende)).get() ?? null;
}

function stimmenVon(wahlId: string) {
  return db.select().from(praesidentStimmen).where(eq(praesidentStimmen.wahlId, wahlId)).all();
}

/** Präsident fürs laufende Jahr eintragen (Wahl-Ergebnis oder Admin). */
export function praesidentEintragen(memberId: string, jahr = Number(berlinTag(nowIso()).slice(0, 4))) {
  const saison = String(jahr);
  db.delete(aemter).where(and(eq(aemter.titel, 'Präsident'), eq(aemter.saison, saison))).run();
  db.insert(aemter).values({ id: newId('a'), titel: 'Präsident', icon: AEMTER_INFO['Präsident'].icon, memberId, saison }).run();
}

/** Wahl aufmachen (oane auf einmal) und alle per Push zum Abstimmen holen. */
export async function wahlStarten(opts: { terminId?: string | null; vonId?: string | null } = {}): Promise<Wahl> {
  const laeuft = offeneWahl();
  if (laeuft) return laeuft;
  const jetzt = new Date();
  const ende = new Date(jetzt.getTime() + WAHL_TAGE * 24 * 3600 * 1000).toISOString();
  const wahl: Wahl = {
    id: newId('pw'),
    jahr: Number(berlinTag(jetzt.toISOString()).slice(0, 4)),
    ende,
    terminId: opts.terminId ?? null,
    gestartetVon: opts.vonId ?? null,
    status: 'offen',
    gewinnerId: null,
    createdAt: jetzt.toISOString(),
  };
  db.insert(praesidentWahlen).values(wahl).run();
  const bis = new Date(ende).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' });
  await pushAnAlle('👑 Präsidentenwahl!', `Wer wird Präsident ${wahl.jahr}? Stimm ab bis ${bis}.`, '/');
  return wahl;
}

/**
 * Nach dem Schließen eines Abends (lib/abend.ts): war’s der erste Stammtisch
 * im Jahr und es gab heuer no koa Wahl, geht sie jetzt auf.
 */
export async function wahlNachAbendPruefen(terminId: string): Promise<void> {
  if (!praesidentGewaehlt()) return;
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return;
  const jahr = termin.datum.slice(0, 4);
  const abgeschlossen = db.select({ id: termine.id }).from(termine).where(and(eq(termine.phase, 'abgeschlossen'), like(termine.datum, `${jahr}-%`))).all();
  if (abgeschlossen.length !== 1 || abgeschlossen[0].id !== terminId) return;
  const schonGewaehlt = db.select().from(praesidentWahlen).where(eq(praesidentWahlen.jahr, Number(jahr))).get();
  if (schonGewaehlt) return;
  await wahlStarten({ terminId });
}

/** Stimme abgeben oder ändern, solang die Wahl offen is. */
export function stimmeAbgeben(wahlId: string, memberId: string, kandidatId: string): boolean {
  const wahl = db.select().from(praesidentWahlen).where(eq(praesidentWahlen.id, wahlId)).get();
  if (!wahl || wahl.status !== 'offen' || wahl.ende <= nowIso()) return false;
  if (!getAktiveMitglieder().some((m) => m.id === kandidatId)) return false;
  db.insert(praesidentStimmen)
    .values({ id: newId('ps'), wahlId, memberId, kandidatId, updatedAt: nowIso() })
    .onConflictDoUpdate({ target: [praesidentStimmen.wahlId, praesidentStimmen.memberId], set: { kandidatId, updatedAt: nowIso() } })
    .run();
  return true;
}

/** Auszählen: meiste Stimmen, bei Gleichstand mehr WP im Wahljahr, dann der Name. */
export function auszaehlen(wahl: Wahl): { gewinnerId: string | null; stimmen: Map<string, number> } {
  const aktive = getAktiveMitglieder();
  const stimmen = new Map<string, number>();
  for (const s of stimmenVon(wahl.id)) {
    if (!aktive.some((m) => m.id === s.kandidatId)) continue;
    stimmen.set(s.kandidatId, (stimmen.get(s.kandidatId) ?? 0) + 1);
  }
  if (stimmen.size === 0) return { gewinnerId: null, stimmen };
  const wp = new Map(getStats({ abDatum: `${wahl.jahr}-01-01` }).map((s) => [s.member.id, s.punkte]));
  const name = (id: string) => anzeigeName(aktive.find((m) => m.id === id)!);
  const [gewinnerId] = [...stimmen.keys()].sort((a, b) => stimmen.get(b)! - stimmen.get(a)! || (wp.get(b) ?? 0) - (wp.get(a) ?? 0) || name(a).localeCompare(name(b)));
  return { gewinnerId, stimmen };
}

/** Wahl schließen und den Gewinner eintragen (nach a Woch’ oder vorzeitig vom Admin). */
export async function wahlAuswerten(wahlId: string): Promise<string | null> {
  const wahl = db.select().from(praesidentWahlen).where(eq(praesidentWahlen.id, wahlId)).get();
  if (!wahl || wahl.status !== 'offen') return null;
  const { gewinnerId } = auszaehlen(wahl);
  db.update(praesidentWahlen).set({ status: 'ausgewertet', gewinnerId, ende: wahl.ende < nowIso() ? wahl.ende : nowIso() }).where(eq(praesidentWahlen.id, wahl.id)).run();
  if (!gewinnerId) {
    // Koa Stimme: der bisherige bleibt, der Admin kann selber oan eintragen
    await pushAnAlle('👑 Präsidentenwahl vorbei', 'Koaner hat abgstimmt, der bisherige Präsident bleibt im Amt.', '/stammtisch');
    return null;
  }
  const vorher = eingetragenerPraesident()?.memberId ?? null;
  praesidentEintragen(gewinnerId, wahl.jahr);
  const m = getAktiveMitglieder().find((x) => x.id === gewinnerId);
  const name = m ? anzeigeName(m) : 'Wer';
  await pushAnAlle('👑 Wir haben an Präsidenten!', vorher === gewinnerId ? `${name} bleibt Präsident ${wahl.jahr}, wiedergewählt!` : `${name} is gewählt, Präsident ${wahl.jahr}!`, '/');
  return gewinnerId;
}

/** Alle abgelaufenen Wahlen des gebundenen Stammtischs auswerten. */
export async function abgelaufeneWahlenAuswerten(): Promise<number> {
  const wahl = offeneWahl();
  if (!wahl || wahl.ende > nowIso()) return 0;
  await wahlAuswerten(wahl.id);
  return 1;
}

/** Läuft im Takt (instrumentation-node) über alle aktiven Stammtische. */
export async function wahlenAllerStammtischeAuswerten(): Promise<void> {
  for (const g of alleGruppen()) {
    if (g.status !== 'aktiv') continue;
    try {
      const n = await runWithTenant(g.id, () => abgelaufeneWahlenAuswerten());
      if (n > 0) console.log(`[wahl] ${g.id}: Präsidentenwahl ausgewertet`);
    } catch (e) {
      console.error(`[wahl] ${g.id}:`, e);
    }
  }
}

/** Für die Wahl-Karte: wie viele haben scho gewählt, und wen hab i gewählt (der Rest bleibt geheim). */
export function wahlStand(wahlId: string, meId: string): { abgestimmt: number; meineStimme: string | null } {
  const stimmen = stimmenVon(wahlId);
  return { abgestimmt: stimmen.length, meineStimme: stimmen.find((s) => s.memberId === meId)?.kandidatId ?? null };
}

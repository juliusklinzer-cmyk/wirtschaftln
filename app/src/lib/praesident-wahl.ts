import { and, desc, eq, isNotNull, like } from 'drizzle-orm';
import { db, aemter, praesidentWahlen, praesidentStimmen, termine, runWithTenant } from '@/lib/db';
import { tenantConfig } from '@/lib/tenant-config';
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
 * Wann gewählt wird, stellt der Stammtisch ein (praesidentWahlZeit): erster
 * Stammtisch im Jahr, erster im Dezember fürs neue Jahr, oder alle zwei Jahre.
 * Gleichstand vorn: Stichwahl unter den Gleichplatzierten, 3 Tage. Steht’s da
 * wieder gleich, entscheiden die WP im Jahr.
 */

export const WAHL_TAGE = 7;
export const STICHWAHL_TAGE = 3;

export type Wahl = typeof praesidentWahlen.$inferSelect;

export function offeneWahl(): Wahl | null {
  return db.select().from(praesidentWahlen).where(eq(praesidentWahlen.status, 'offen')).orderBy(desc(praesidentWahlen.createdAt)).get() ?? null;
}

/** Jüngste ausgewertete Wahl (für den Hinweis „gewählt am …“). */
export function letzteWahl(): Wahl | null {
  return db.select().from(praesidentWahlen).where(and(eq(praesidentWahlen.status, 'ausgewertet'), isNotNull(praesidentWahlen.gewinnerId))).orderBy(desc(praesidentWahlen.ende)).get() ?? null;
}

function stimmenVon(wahlId: string) {
  return db.select().from(praesidentStimmen).where(eq(praesidentStimmen.wahlId, wahlId)).all();
}

/** Präsident fürs laufende Jahr eintragen (Wahl-Ergebnis oder Admin). */
export function praesidentEintragen(memberId: string, jahr?: number) {
  // Ohne Jahr (Admin trägt ein): laufendes Jahr, oder das scho gewählte nächste (Wahl im Dezember)
  const saison = String(jahr ?? Math.max(Number(berlinTag(nowIso()).slice(0, 4)), Number(eingetragenerPraesident()?.saison ?? 0)));
  db.delete(aemter).where(and(eq(aemter.titel, 'Präsident'), eq(aemter.saison, saison))).run();
  db.insert(aemter).values({ id: newId('a'), titel: 'Präsident', icon: AEMTER_INFO['Präsident'].icon, memberId, saison }).run();
}

/** Wahl aufmachen (oane auf einmal) und alle per Push zum Abstimmen holen. */
export async function wahlStarten(opts: { terminId?: string | null; vonId?: string | null; jahr?: number; stichwahlUnter?: string[] } = {}): Promise<Wahl> {
  const laeuft = offeneWahl();
  if (laeuft) return laeuft;
  const jetzt = new Date();
  const stichwahl = !!opts.stichwahlUnter?.length;
  const ende = new Date(jetzt.getTime() + (stichwahl ? STICHWAHL_TAGE : WAHL_TAGE) * 24 * 3600 * 1000).toISOString();
  const wahl: Wahl = {
    id: newId('pw'),
    jahr: opts.jahr ?? amtsJahrJetzt(),
    ende,
    terminId: opts.terminId ?? null,
    gestartetVon: opts.vonId ?? null,
    status: 'offen',
    gewinnerId: null,
    createdAt: jetzt.toISOString(),
    stichwahl,
    kandidaten: stichwahl ? JSON.stringify(opts.stichwahlUnter) : null,
  };
  db.insert(praesidentWahlen).values(wahl).run();
  const bis = new Date(ende).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' });
  if (stichwahl) {
    const namen = namenListe(opts.stichwahlUnter!);
    await pushAnAlle('👑 Stichwahl!', `Gleichstand zwischen ${namen}. Stimm nochmal ab bis ${bis}.`, '/');
  } else {
    await pushAnAlle('👑 Präsidentenwahl!', `Wer wird Präsident ${wahl.jahr}? Stimm ab bis ${bis}.`, '/');
  }
  return wahl;
}

/** Für welches Jahr wird gwählt, wenn der Admin jetzt startet? Im Dezember bei „Jahresabschluss“ fürs nächste. */
function amtsJahrJetzt(): number {
  const tag = berlinTag(nowIso());
  const jahr = Number(tag.slice(0, 4));
  return tenantConfig().praesidentWahlZeit === 'jahresende' && tag.slice(5, 7) === '12' ? jahr + 1 : jahr;
}

/** „Anna, Basti und Franzi“ */
function namenListe(ids: string[]): string {
  const aktive = getAktiveMitglieder();
  const namen = ids.map((id) => aktive.find((m) => m.id === id)).filter((m) => !!m).map((m) => anzeigeName(m!));
  return namen.length <= 1 ? namen.join('') : `${namen.slice(0, -1).join(', ')} und ${namen[namen.length - 1]}`;
}

/** Die Kandidaten der Wahl: bei der Stichwahl nur die Gleichplatzierten, sonst null (= alle). */
export function wahlKandidaten(wahl: Wahl): string[] | null {
  if (!wahl.kandidaten) return null;
  try {
    const ids = JSON.parse(wahl.kandidaten);
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : null;
  } catch {
    return null;
  }
}

/**
 * Nach dem Schließen eines Abends (lib/abend.ts): is des der Stammtisch, an
 * dem laut Einstellung gwählt wird, und is des Amt fürs Jahr no ned vergeben,
 * geht die Wahl jetzt auf.
 * - jahresanfang / zweiJahre: der erste gschlossene Stammtisch im Jahr
 * - jahresende: der erste gschlossene im Dezember, gwählt wird fürs nächste Jahr
 */
export async function wahlNachAbendPruefen(terminId: string): Promise<void> {
  if (!praesidentGewaehlt()) return;
  const termin = db.select().from(termine).where(eq(termine.id, terminId)).get();
  if (!termin) return;
  const zeit = tenantConfig().praesidentWahlZeit;
  const jahr = Number(termin.datum.slice(0, 4));
  const zeitraum = zeit === 'jahresende' ? `${jahr}-12-%` : `${jahr}-%`;
  if (zeit === 'jahresende' && termin.datum.slice(5, 7) !== '12') return;
  const abgeschlossen = db.select({ id: termine.id }).from(termine).where(and(eq(termine.phase, 'abgeschlossen'), like(termine.datum, zeitraum))).all();
  if (abgeschlossen.length !== 1 || abgeschlossen[0].id !== terminId) return;
  const zielJahr = zeit === 'jahresende' ? jahr + 1 : jahr;
  if (db.select().from(praesidentWahlen).where(eq(praesidentWahlen.jahr, zielJahr)).get()) return;
  // Amt läuft no (z. B. beim Umstellen eingetragen, oder zwei Jahre Amtszeit)
  const amt = eingetragenerPraesident();
  const dauer = zeit === 'zweiJahre' ? 2 : 1;
  if (amt && Number(amt.saison) + dauer > zielJahr) return;
  await wahlStarten({ terminId, jahr: zielJahr });
}

/** Stimme abgeben oder ändern, solang die Wahl offen is. */
export function stimmeAbgeben(wahlId: string, memberId: string, kandidatId: string): boolean {
  const wahl = db.select().from(praesidentWahlen).where(eq(praesidentWahlen.id, wahlId)).get();
  if (!wahl || wahl.status !== 'offen' || wahl.ende <= nowIso()) return false;
  if (!getAktiveMitglieder().some((m) => m.id === kandidatId)) return false;
  const kandidaten = wahlKandidaten(wahl);
  if (kandidaten && !kandidaten.includes(kandidatId)) return false;
  db.insert(praesidentStimmen)
    .values({ id: newId('ps'), wahlId, memberId, kandidatId, updatedAt: nowIso() })
    .onConflictDoUpdate({ target: [praesidentStimmen.wahlId, praesidentStimmen.memberId], set: { kandidatId, updatedAt: nowIso() } })
    .run();
  return true;
}

export type WahlZaehlung = {
  gewinnerId: string | null;
  /** Stimmen je Kandidat, meiste zuerst */
  stimmen: Array<{ id: string; anzahl: number }>;
  /** Mehrere mit den meisten Stimmen */
  gleichstand: string[];
};

/** Auszählen: meiste Stimmen, bei Gleichstand (nach der Stichwahl) mehr WP im Wahljahr, dann der Name. */
export function auszaehlen(wahl: Wahl): WahlZaehlung {
  const aktive = getAktiveMitglieder();
  const zaehler = new Map<string, number>();
  for (const s of stimmenVon(wahl.id)) {
    if (!aktive.some((m) => m.id === s.kandidatId)) continue;
    zaehler.set(s.kandidatId, (zaehler.get(s.kandidatId) ?? 0) + 1);
  }
  if (zaehler.size === 0) return { gewinnerId: null, stimmen: [], gleichstand: [] };
  const wp = new Map(getStats({ abDatum: `${wahl.jahr}-01-01` }).map((s) => [s.member.id, s.punkte]));
  const name = (id: string) => anzeigeName(aktive.find((m) => m.id === id)!);
  const ids = [...zaehler.keys()].sort((a, b) => zaehler.get(b)! - zaehler.get(a)! || (wp.get(b) ?? 0) - (wp.get(a) ?? 0) || name(a).localeCompare(name(b)));
  const meiste = zaehler.get(ids[0])!;
  return {
    gewinnerId: ids[0],
    stimmen: ids.map((id) => ({ id, anzahl: zaehler.get(id)! })),
    gleichstand: ids.filter((id) => zaehler.get(id) === meiste),
  };
}

/**
 * Wahl schließen und den Gewinner eintragen (nach a Woch’ oder vorzeitig vom
 * Admin). Gleichstand vorn in der ersten Runde: Stichwahl statt Gewinner.
 */
export async function wahlAuswerten(wahlId: string): Promise<{ gewinnerId: string | null; stichwahl: boolean }> {
  const wahl = db.select().from(praesidentWahlen).where(eq(praesidentWahlen.id, wahlId)).get();
  if (!wahl || wahl.status !== 'offen') return { gewinnerId: null, stichwahl: false };
  const { gewinnerId, gleichstand } = auszaehlen(wahl);
  const ende = wahl.ende < nowIso() ? wahl.ende : nowIso();
  if (gleichstand.length > 1 && !wahl.stichwahl) {
    db.update(praesidentWahlen).set({ status: 'ausgewertet', gewinnerId: null, ende }).where(eq(praesidentWahlen.id, wahl.id)).run();
    await wahlStarten({ jahr: wahl.jahr, terminId: wahl.terminId, stichwahlUnter: gleichstand });
    return { gewinnerId: null, stichwahl: true };
  }
  db.update(praesidentWahlen).set({ status: 'ausgewertet', gewinnerId, ende }).where(eq(praesidentWahlen.id, wahl.id)).run();
  if (!gewinnerId) {
    // Koa Stimme: der bisherige bleibt, der Admin kann selber oan eintragen
    await pushAnAlle('👑 Präsidentenwahl vorbei', 'Koaner hat abgstimmt, der bisherige Präsident bleibt im Amt.', '/stammtisch');
    return { gewinnerId: null, stichwahl: false };
  }
  const vorher = eingetragenerPraesident()?.memberId ?? null;
  praesidentEintragen(gewinnerId, wahl.jahr);
  const m = getAktiveMitglieder().find((x) => x.id === gewinnerId);
  const name = m ? anzeigeName(m) : 'Wer';
  await pushAnAlle('👑 Wir haben an Präsidenten!', vorher === gewinnerId ? `${name} bleibt Präsident ${wahl.jahr}, wiedergewählt!` : `${name} is gewählt, Präsident ${wahl.jahr}!`, '/');
  return { gewinnerId, stichwahl: false };
}

/**
 * Ergebnis der letzten Wahl fürs Jahr (für Hoam und Unser Stammtisch):
 * Stimmen je Kandidat, einstimmig?, und ob’s über a Stichwahl ging.
 */
export function wahlErgebnis(wahl: Wahl): { gewinnerId: string | null; stimmen: Array<{ id: string; anzahl: number }>; abgegeben: number; einstimmig: boolean; nachStichwahl: boolean; vorrunde: Array<{ id: string; anzahl: number }> | null } {
  const { stimmen } = auszaehlen(wahl);
  const abgegeben = stimmen.reduce((n, s) => n + s.anzahl, 0);
  const vorrundeWahl = wahl.stichwahl
    ? db.select().from(praesidentWahlen).where(and(eq(praesidentWahlen.jahr, wahl.jahr), eq(praesidentWahlen.stichwahl, false))).orderBy(desc(praesidentWahlen.createdAt)).get()
    : null;
  return {
    gewinnerId: wahl.gewinnerId,
    stimmen,
    abgegeben,
    einstimmig: abgegeben > 1 && stimmen.length === 1,
    nachStichwahl: wahl.stichwahl,
    vorrunde: vorrundeWahl ? auszaehlen(vorrundeWahl).stimmen : null,
  };
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

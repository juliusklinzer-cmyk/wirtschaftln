import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { db, jahressieger, termine, runWithTenant } from '@/lib/db';
import { alleGruppen } from '@/lib/db/directory';
import { getAemter, getVergabeStand } from '@/lib/queries';
import { AEMTER_INFO, saisonBadges } from '@/lib/badges';
import { auszeichnungAn } from '@/lib/tenant-config';
import { berlinTag } from '@/lib/punkte';
import { pushAnAlle } from '@/lib/push';
import { newId, nowIso } from '@/lib/ids';

/**
 * Jahressieger (Jahresabschluss, 08.11.2026): Wer an Silvester ein Badge oder
 * Amt hält, steht dafür fest drin, z. B. „Maximator 2026“, wia der Clubmeister
 * im Golfclub. Vergeben wird am 31.12. (im Dezember rennen manche no um
 * Plätze), gezählt wird die Herbst-Saison bis Silvester. Läuft no a Abend vom
 * 30. oder 31.12., wartet’s, bis der um 3 Uhr zu is.
 */

export type Jahressieger = typeof jahressieger.$inferSelect;

/** Name, Icon und Grafik je Key (Badge oder Amt). */
export function siegerMeta(key: string): { name: string; icon: string; slug: string | null; art: 'badge' | 'amt' } | null {
  const amt = { 'amt:praesident': 'Präsident', 'amt:schriftfuehrer': 'Schriftführer', 'amt:kassenwart': 'Kassenwart' }[key];
  if (amt) return { name: amt, icon: AEMTER_INFO[amt].icon, slug: AEMTER_INFO[amt].slug, art: 'amt' };
  const b = saisonBadges().find((x) => x.key === key);
  return b ? { name: b.name, icon: b.icon, slug: b.slug, art: 'badge' } : null;
}

export function jahressiegerVon(jahr: number): Jahressieger[] {
  return db.select().from(jahressieger).where(eq(jahressieger.jahr, jahr)).all();
}

/** Alle Jahressieger, neuestes Jahr zerst (fürs Badge-Fenster). */
export function alleJahressieger(): Jahressieger[] {
  return db.select().from(jahressieger).orderBy(desc(jahressieger.jahr)).all();
}

/** Die jüngste Vergabe (für die Feier auf Hoam): Jahr und wann. */
export function letzteVergabe(): { jahr: number; am: string } | null {
  const z = db.select().from(jahressieger).orderBy(desc(jahressieger.jahr), desc(jahressieger.createdAt)).get();
  return z ? { jahr: z.jahr, am: z.createdAt } : null;
}

/** Wer hält was am Jahresende? Herbst-Saison bis Silvester, plus der Kassenwart des Jahres. */
export function jahresStand(jahr: number): Map<string, string> {
  const stand = getVergabeStand(undefined, { abDatum: `${jahr}-07-01`, bisDatum: `${jahr}-12-31` });
  if (auszeichnungAn('amt:kassenwart')) {
    const kassenwart = getAemter(String(jahr)).find(({ amt }) => amt.titel.startsWith('Kassenwart'))?.amt.memberId;
    if (kassenwart) stand.set('amt:kassenwart', kassenwart);
  }
  return stand;
}

/** Festschreiben (idempotent): gibt die Zahl der neu eingetragenen Sieger zurück. */
export function jahressiegerFestschreiben(jahr: number): number {
  const jetzt = nowIso();
  let neu = 0;
  for (const [key, memberId] of jahresStand(jahr)) {
    if (!memberId || !siegerMeta(key)) continue;
    const r = db.insert(jahressieger).values({ id: newId('js'), jahr, key, memberId, createdAt: jetzt }).onConflictDoNothing().run();
    neu += r.changes;
  }
  return neu;
}

/**
 * Takt: ab Silvester (Berliner Zeit) einmal pro Jahr. Bis zum 31.12. zählt das
 * laufende Jahr, im neuen Jahr (z. B. nach am Silvester-Stammtisch) das alte.
 */
export async function jahresabschlussPruefen(jetzt = new Date()): Promise<boolean> {
  const tag = berlinTag(jetzt.toISOString());
  const jahr = tag.slice(5) === '12-31' ? Number(tag.slice(0, 4)) : tag.slice(5, 7) === '01' ? Number(tag.slice(0, 4)) - 1 : null;
  if (!jahr) return false;
  if (jahressiegerVon(jahr).length > 0) return false;
  // A Abend vom 30. oder 31.12. is no offen → warten, der schließt sich um 3 Uhr von allein
  const offen = db
    .select({ id: termine.id })
    .from(termine)
    .where(and(inArray(termine.datum, [`${jahr}-12-30`, `${jahr}-12-31`]), ne(termine.phase, 'abgeschlossen')))
    .get();
  if (offen) return false;
  const n = jahressiegerFestschreiben(jahr);
  if (n > 0) await pushAnAlle(`🏆 Die Jahressieger ${jahr} stehen fest`, 'Wer ein Badge oder Amt hält, geht in die Geschichte ein. Schau nach, wer’s gworden is!', '/spezln');
  return n > 0;
}

/** Läuft im Takt (instrumentation-node) über alle aktiven Stammtische. */
export async function jahresabschlussAllerStammtische(): Promise<void> {
  for (const g of alleGruppen()) {
    if (g.status !== 'aktiv') continue;
    try {
      if (await runWithTenant(g.id, () => jahresabschlussPruefen())) console.log(`[jahressieger] ${g.id}: festgeschrieben`);
    } catch (e) {
      console.error(`[jahressieger] ${g.id}:`, e);
    }
  }
}

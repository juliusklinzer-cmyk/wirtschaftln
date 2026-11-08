import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { db, jahressieger, termine, runWithTenant } from '@/lib/db';
import { alleGruppen } from '@/lib/db/directory';
import { getAemter, getStats, getVergabeStand, type MitgliedStats } from '@/lib/queries';
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

/** Welche Zahl hat das Badge gebracht? (Herbst-Saison) */
const WERT: Record<string, (s: MitgliedStats) => number> = {
  zacherHund: (s) => s.abende,
  heiwong: (s) => s.abende,
  maximator: (s) => s.hoiben,
  moshammer: (s) => s.runden,
  taxler: (s) => s.taxi,
  dieSau: (s) => s.schweinsbraten,
  schnapsler: (s) => s.schnaps,
  gschaftler: (s) => s.zuSpaet,
  alterPeter: (s) => s.bestStreak,
  'amt:praesident': (s) => s.punkte,
  'amt:schriftfuehrer': (s) => s.abschluesse,
};

/** Spruch für die Silvester-Feier, mit der Zahl, die’s gebracht hat. */
export function siegerSpruch(key: string, wert: number | null): string {
  const n = wert ?? 0;
  const mit = wert !== null && wert > 0;
  const s: Record<string, string> = {
    'amt:praesident': 'Du hast den Stammtisch durchs Jahr geführt. Ab heute heißt’s: Präsident des Jahres.',
    'amt:schriftfuehrer': mit ? `${n} Abende zsammgschriebn. Was ned aufgschrieben is, is nie passiert.` : 'Was ned aufgschrieben is, is nie passiert.',
    'amt:kassenwart': 'Ein Jahr lang über die Kasse gwacht. Ohne di wär’s Geld scho lang versoffen.',
    zacherHund: mit ? `${n} Abende in der Saison. Bei Schnee, Bahnstreik und Männergrippe.` : 'Am öftesten dabei von allen.',
    heiwong: mit ? `Grad amal ${n} Abende. Nächstes Jahr kimmst öfter, gell?` : 'Am wenigsten dabei. Nächstes Jahr kimmst öfter, gell?',
    maximator: mit ? `${n} Hoibe in einer Saison. Mehr hat koaner gstrichelt.` : 'Die meisten Hoibe der Saison.',
    moshammer: mit ? `${n} Runden gschmissn. Spendabler geht’s nimmer.` : 'Die meisten Runden gschmissn.',
    taxler: mit ? `${n} mal den Heimweg organisiert. Ohne di warn mia no heit im Wirtshaus.` : 'Am öftesten den Heimweg organisiert.',
    dieSau: mit ? `${n} Schweinsbraten in einer Saison. Kruste, Knödl, Soß, nix bleibt über.` : 'Die meisten Schweinsbraten der Saison.',
    schnapsler: mit ? `${n} Stamperl in einer Saison. Zum Wohl!` : 'Die meisten Stamperl der Saison.',
    gschaftler: mit ? `${n} mal z’spät kemma. Pünktlich is was für Preißn.` : 'Am öftesten z’spät kemma.',
    alterPeter: mit ? `${n} Stammtische am Stück. Die längste Serie, seit’s den Stammtisch gibt.` : 'Die längste Serie, seit’s den Stammtisch gibt.',
    meisterEder: 'Dei Wirtshaus hat die beste Bewertung der Saison.',
  };
  return s[key] ?? 'Am Jahresende hast du’s ghabt.';
}

/** Festschreiben (idempotent): gibt die Zahl der neu eingetragenen Sieger zurück. */
export function jahressiegerFestschreiben(jahr: number): number {
  const jetzt = nowIso();
  const stats = getStats({ abDatum: `${jahr}-07-01`, bisDatum: `${jahr}-12-31` });
  let neu = 0;
  for (const [key, memberId] of jahresStand(jahr)) {
    if (!memberId || !siegerMeta(key)) continue;
    const s = stats.find((x) => x.member.id === memberId);
    const wert = s && WERT[key] ? WERT[key](s) : null;
    const r = db.insert(jahressieger).values({ id: newId('js'), jahr, key, memberId, createdAt: jetzt, wert }).onConflictDoNothing().run();
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

import { and, eq, gte, inArray } from 'drizzle-orm';
import { db, termine, votes, wirtshaeuser, erinnerungen, runWithTenant } from '@/lib/db';
import { alleGruppen } from '@/lib/db/directory';
import { getAktiveMitglieder, getPraesidentId } from '@/lib/queries';
import { berlinTag, berlinUhrzeit } from '@/lib/punkte';
import { tenantConfig } from '@/lib/tenant-config';
import { datumLang } from '@/lib/format';
import { newId, nowIso } from '@/lib/ids';
import { mailAn } from '@/lib/mail';
import { mailAbstimmen, mailOrgaOffen, mailReservierungOffen } from '@/lib/mail-vorlagen';
import { mailRahmen, rufname, willMail } from '@/lib/mail-rahmen';

/**
 * Erinnerungs-Mails (Julius, 30.10.2026), weil Push an der Web-App oft ned
 * ankommt. Nur an die, die was tun müssen, jede Art pro Termin und Spezl
 * genau einmal. Läuft im 5-Minuten-Takt (instrumentation-node.ts), verschickt
 * aber erst ab 18 Uhr (Berlin), bis 22 Uhr.
 *
 *   orga      14 Tage vorher, Orga no frei            → alle (ned bei Stammhaus)
 *   reserv1    7 Tage vorher, Orga da, koa Wirtshaus  → Organisator
 *   reserv2    3 Tage vorher, immer no koa Wirtshaus  → Organisator + Präsident
 *   abstimmen  1 Tag vor der Abstimm-Frist            → wer no ned abgstimmt hat
 *   letzte     Tag vorm Termin                        → wer immer no ned abgstimmt hat
 */
const AB_UHRZEIT = '18:00';
const BIS_UHRZEIT = '22:00';

type Art = 'orga' | 'reserv1' | 'reserv2' | 'abstimmen' | 'letzte';
const ALLE = '*';

function tageBis(heute: string, datum: string): number {
  return Math.round((Date.parse(`${datum}T12:00:00Z`) - Date.parse(`${heute}T12:00:00Z`)) / 86_400_000);
}

function schonGesendet(terminId: string, art: Art, memberId: string): boolean {
  return !!db
    .select({ id: erinnerungen.id })
    .from(erinnerungen)
    .where(and(eq(erinnerungen.terminId, terminId), eq(erinnerungen.art, art), eq(erinnerungen.memberId, memberId)))
    .get();
}

function merken(terminId: string, art: Art, memberIds: string[]): void {
  for (const memberId of memberIds) {
    db.insert(erinnerungen).values({ id: newId('e'), terminId, art, memberId, gesendetAm: nowIso() }).onConflictDoNothing().run();
  }
}

/** Erinnerungen des gebundenen Stammtischs verschicken. Liefert die Zahl der Mails. */
export async function erinnerungenVerschicken(jetztIso = nowIso()): Promise<number> {
  const uhr = berlinUhrzeit(jetztIso);
  if (uhr < AB_UHRZEIT || uhr >= BIS_UHRZEIT) return 0;
  const heute = berlinTag(jetztIso);
  const config = tenantConfig();
  const rahmen = mailRahmen();
  const mitglieder = getAktiveMitglieder();
  let anzahl = 0;

  const offene = db
    .select()
    .from(termine)
    .where(and(gte(termine.datum, heute), inArray(termine.phase, ['planung', 'reserviert'])))
    .all();

  for (const t of offene) {
    const tage = tageBis(heute, t.datum);
    if (tage < 1) continue;
    const datumText = datumLang(t.datum);
    const jobs: Promise<void>[] = [];

    // ── Orga no frei ──
    if (config.typ !== 'stammhaus' && t.phase === 'planung' && !t.planerId && tage <= 14 && !schonGesendet(t.id, 'orga', ALLE)) {
      const { betreff, inhalt } = mailOrgaOffen(rahmen, { datumText, tage });
      jobs.push(mailAn(mitglieder.filter((m) => willMail(m, 'erinnerung')).map((m) => m.email), betreff, inhalt));
      merken(t.id, 'orga', [ALLE]);
    }

    // ── Reservierung offen ──
    // Beim Stammhaus ohne Organisator kümmert si der Präsident
    const orgaId = t.planerId ?? (config.typ === 'stammhaus' ? getPraesidentId() : null);
    const organisator = orgaId ? mitglieder.find((m) => m.id === orgaId) : undefined;
    if (t.phase === 'planung' && organisator) {
      const zweite = tage <= 3;
      const art: Art = zweite ? 'reserv2' : 'reserv1';
      if (tage <= 7 && !schonGesendet(t.id, art, ALLE)) {
        const praesId = zweite ? getPraesidentId() : null;
        const an = mitglieder.filter((m) => (m.id === organisator.id || m.id === praesId) && willMail(m, 'erinnerung'));
        const { betreff, inhalt } = mailReservierungOffen(rahmen, { datumText, tage, organisator: rufname(organisator), zweite: zweite && !!praesId && praesId !== organisator.id });
        jobs.push(mailAn(an.map((m) => m.email), betreff, inhalt));
        merken(t.id, art, [ALLE]);
      }
    }

    // ── Abstimmen: erst wenn's Wirtshaus feststeht ──
    if (t.phase === 'reserviert' && (tage === 4 || tage === 1)) {
      const art: Art = tage === 1 ? 'letzte' : 'abstimmen';
      const abgestimmt = new Set(db.select({ memberId: votes.memberId }).from(votes).where(eq(votes.terminId, t.id)).all().map((v) => v.memberId));
      const fehlen = mitglieder.filter((m) => !abgestimmt.has(m.id) && !schonGesendet(t.id, art, m.id));
      const an = fehlen.filter((m) => willMail(m, 'erinnerung'));
      if (fehlen.length > 0) {
        const wirtshaus = t.wirtshausId ? db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, t.wirtshausId)).get() : null;
        const { betreff, inhalt } = mailAbstimmen(rahmen, { datumText, zeit: t.zeit, wirtshaus: wirtshaus?.name ?? null, letzte: art === 'letzte' });
        jobs.push(mailAn(an.map((m) => m.email), betreff, inhalt));
        merken(t.id, art, fehlen.map((m) => m.id));
      }
    }

    await Promise.allSettled(jobs);
    anzahl += jobs.length;
  }
  return anzahl;
}

/** Für den Takt: alle aktiven Stammtische durchgehen. */
export async function erinnerungenAllerStammtische(): Promise<void> {
  for (const g of alleGruppen()) {
    if (g.status !== 'aktiv') continue;
    try {
      const n = await runWithTenant(g.id, () => erinnerungenVerschicken());
      if (n > 0) console.log(`[erinnerung] ${g.id}: ${n} Erinnerung(en) verschickt`);
    } catch (e) {
      console.error(`[erinnerung] ${g.id}:`, e);
    }
  }
}

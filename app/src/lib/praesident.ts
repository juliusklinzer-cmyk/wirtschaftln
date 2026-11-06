import { and, desc, eq } from 'drizzle-orm';
import { db, aemter, members } from '@/lib/db';
import { tenantConfig } from '@/lib/tenant-config';
import type { MitgliedStats } from '@/lib/queries';

/**
 * Wer is Präsident? (06.11.2026) Zwoa Arten, pro Stammtisch eingestellt:
 * - 'wp': wer in der Saison die meisten WP hat, wechselt nach jedem Abend (Standard)
 * - 'wahl': jedes Jahr gewählt (lib/praesident-wahl.ts), bleibt bis zur nächsten
 *   Wahl oder bis der Admin wen anders einträgt. Steht als Amt „Präsident“ in aemter.
 * Solang im Wahl-Modus no koaner eingetragen is, gilt wie bisher Rang 1 nach WP.
 * Keine Abhängigkeit auf queries.ts (nur der Typ), sonst gibt's an Kreis über badges.ts.
 */
export function praesidentGewaehlt(): boolean {
  return tenantConfig().praesidentModus === 'wahl';
}

/** Der eingetragene (gewählte) Präsident: das jüngste Amt „Präsident“, solang er aktiv is. */
export function eingetragenerPraesident(): { memberId: string; saison: string; amtId: string } | null {
  const row = db
    .select({ amt: aemter })
    .from(aemter)
    .innerJoin(members, eq(aemter.memberId, members.id))
    .where(and(eq(aemter.titel, 'Präsident'), eq(members.status, 'aktiv')))
    .orderBy(desc(aemter.saison))
    .get();
  return row?.amt.memberId ? { memberId: row.amt.memberId, saison: row.amt.saison, amtId: row.amt.id } : null;
}

/** Rang 1 nach WP der Saison, bei 0 Punkten (Saisonstart) koaner. */
export function praesidentNachWp(statsSaison: MitgliedStats[]): string | null {
  const erster = [...statsSaison].sort((a, b) => b.punkte - a.punkte)[0];
  return erster && erster.punkte > 0 ? erster.member.id : null;
}

/** EINE Regel für Rangliste, Ämter, Badge-Wechsel und Rechte. */
export function praesidentAus(statsSaison: MitgliedStats[]): string | null {
  if (praesidentGewaehlt()) {
    const eingetragen = eingetragenerPraesident();
    if (eingetragen) return eingetragen.memberId;
  }
  return praesidentNachWp(statsSaison);
}

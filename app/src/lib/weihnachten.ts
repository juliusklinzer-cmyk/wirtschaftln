import { and, eq } from 'drizzle-orm';
import { db, members, runWithTenant, currentTenant } from '@/lib/db';
import { alleGruppen, tokensFuerMitglied, type GruendungsToken } from '@/lib/db/directory';
import { parseTenantConfig } from '@/lib/tenant-config';
import { neuerToken, tokenLink } from '@/lib/gruendung';
import { berlinTag } from '@/lib/punkte';
import { pushAn } from '@/lib/push';
import { mailAn } from '@/lib/mail';
import { mailWeihnachten } from '@/lib/mail-vorlagen';
import { mailRahmen } from '@/lib/mail-rahmen';

/**
 * Weihnachtsgeschenk (Jahresabschluss 2026): Bei Stammtischen, für die ein
 * Wirtschaftln-Admin im Verzeichnis „Weihnachts-Token“ fürs Jahr einschaltet,
 * kriegt am 24.12. jeder aktive Spezl seinen persönlichen Einladungstoken
 * (quelle 'geschenk'), dazu Push und Mail. Auf Hoam geht dann das Popup
 * „Frohe Weihnachten“ auf (WeihnachtsGeschenk), im Profil steht er aa.
 */

const HEILIGABEND = '12-24';

/** Ab Heiligabend bis Jahresende: für welches Jahr wird verschenkt? */
function geschenkJahr(jetzt: Date): number | null {
  const tag = berlinTag(jetzt.toISOString());
  return tag.slice(5) >= HEILIGABEND ? Number(tag.slice(0, 4)) : null;
}

function geschenkVon(memberId: string, gruppeId: string, jahr: number): GruendungsToken | null {
  return tokensFuerMitglied(memberId).find((t) => t.gruppeId === gruppeId && t.quelle === 'geschenk' && t.createdAt.startsWith(String(jahr))) ?? null;
}

/** Im gebundenen Stammtisch: jedem aktiven Spezl ohne Geschenk an Token münzen und Bescheid geben. */
export async function weihnachtsTokensStammtisch(jahr: number): Promise<number> {
  const gruppeId = currentTenant().gruppe.id;
  const spezln = db.select().from(members).where(and(eq(members.status, 'aktiv'))).all();
  const jobs: Promise<unknown>[] = [];
  let neu = 0;
  for (const m of spezln) {
    if (geschenkVon(m.id, gruppeId, jahr)) continue;
    const t = neuerToken(m.id, gruppeId, 'geschenk');
    neu += 1;
    const vorname = m.spitzname || m.vorname || m.name.split(' ')[0];
    const mail = mailWeihnachten(mailRahmen(), { vorname, token: t.token });
    jobs.push(pushAn([m.id], '🎁 Frohe Weihnachten!', 'Unterm Christbaum liegt dein persönlicher Einladungstoken. Mach die App auf!', '/'));
    jobs.push(mailAn([m.email], mail.betreff, mail.inhalt));
  }
  await Promise.allSettled(jobs);
  return neu;
}

/** Läuft im Takt: ab 24.12. über alle Stammtische mit eingeschaltetem Weihnachts-Token. */
export async function weihnachtsTokensVergeben(jetzt = new Date()): Promise<void> {
  const jahr = geschenkJahr(jetzt);
  if (!jahr) return;
  for (const g of alleGruppen()) {
    if (g.status !== 'aktiv' || g.istGruender) continue;
    if (parseTenantConfig(g).weihnachtsTokenJahr !== jahr) continue;
    try {
      const n = await runWithTenant(g.id, () => weihnachtsTokensStammtisch(jahr));
      if (n > 0) console.log(`[weihnachten] ${g.id}: ${n} Token verschenkt`);
    } catch (e) {
      console.error(`[weihnachten] ${g.id}:`, e);
    }
  }
}

/**
 * Für Hoam: das no ned eingelöste Geschenk des Spezls (fürs Popup), sonst null.
 * Gewidmete kommen aa mit, sonst verschwindet das Popup mitten im Widmen
 * (die Seite lädt nach der Server-Action neu); das Popup zeigt sich nur, wenn
 * er beim Öffnen no ungewidmet war.
 */
export function offenesGeschenk(memberId: string): { token: string; link: string; jahr: number; gewidmet: boolean } | null {
  const gruppeId = currentTenant().gruppe.id;
  const t = tokensFuerMitglied(memberId)
    .filter((x) => x.gruppeId === gruppeId && x.quelle === 'geschenk' && x.status === 'offen')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return t ? { token: t.token, link: tokenLink(t.token), jahr: Number(t.createdAt.slice(0, 4)), gewidmet: !!t.widmung } : null;
}

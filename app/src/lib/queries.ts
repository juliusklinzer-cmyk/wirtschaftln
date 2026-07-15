import { desc, eq, ne, and, asc } from 'drizzle-orm';
import { db, members, termine, votes, besuche, wirtshaeuser, kasse, aemter } from '@/lib/db';

export type Termin = typeof termine.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Wirtshaus = typeof wirtshaeuser.$inferSelect;
export type KasseEintrag = typeof kasse.$inferSelect;

/** Der aktuell laufende Termin (nicht abgeschlossen), oder null. */
export function getAktuellerTermin() {
  return (
    db
      .select()
      .from(termine)
      .where(ne(termine.phase, 'abgeschlossen'))
      .orderBy(desc(termine.datum))
      .get() ?? null
  );
}

export function getTerminMitWirtshaus(termin: Termin) {
  const wirtshaus = termin.wirtshausId
    ? (db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, termin.wirtshausId)).get() ?? null)
    : null;
  const planer = termin.planerId
    ? (db.select().from(members).where(eq(members.id, termin.planerId)).get() ?? null)
    : null;
  return { termin, wirtshaus, planer };
}

export function getVotesFuerTermin(terminId: string) {
  return db
    .select({ vote: votes, member: members })
    .from(votes)
    .innerJoin(members, eq(votes.memberId, members.id))
    .where(eq(votes.terminId, terminId))
    .all();
}

export function getAktiveMitglieder() {
  return db.select().from(members).where(eq(members.status, 'aktiv')).orderBy(asc(members.name)).all();
}

export type MitgliedStats = {
  member: Member;
  hoiben: number;
  abende: number;
  wirtshaeuser: number;
  kaiserschmarrn: number;
  streak: number;
};

/** Statistiken über alle abgeschlossenen Besuche, inkl. Streak (Serie besuchter Abende). */
export function getStats(): MitgliedStats[] {
  const alleMitglieder = getAktiveMitglieder();
  const abgeschlossene = db
    .select()
    .from(termine)
    .where(eq(termine.phase, 'abgeschlossen'))
    .orderBy(desc(termine.datum))
    .all();
  const alleBesuche = db.select().from(besuche).all();
  const byTermin = new Map<string, Map<string, (typeof alleBesuche)[number]>>();
  for (const b of alleBesuche) {
    if (!byTermin.has(b.terminId)) byTermin.set(b.terminId, new Map());
    byTermin.get(b.terminId)!.set(b.memberId, b);
  }

  return alleMitglieder.map((member) => {
    let hoiben = 0;
    let abende = 0;
    let kaiserschmarrn = 0;
    const besuchteWirtshaeuser = new Set<string>();
    let streak = 0;
    let streakBroken = false;

    for (const t of abgeschlossene) {
      const b = byTermin.get(t.id)?.get(member.id);
      const dabei = !!b?.anwesend;
      if (dabei) {
        hoiben += b!.hoiben;
        kaiserschmarrn += b!.kaiserschmarrn;
        abende += 1;
        if (t.wirtshausId) besuchteWirtshaeuser.add(t.wirtshausId);
        if (!streakBroken) streak += 1;
      } else {
        streakBroken = true;
      }
    }

    return { member, hoiben, abende, wirtshaeuser: besuchteWirtshaeuser.size, kaiserschmarrn, streak };
  });
}

/** Kassensaldo in Cent: Einzahlungen/Runden + beglichene Strafen − Ausgaben. */
export function getSaldo(): number {
  const eintraege = db.select().from(kasse).all();
  let saldo = 0;
  for (const e of eintraege) {
    if (e.status === 'aufgehoben') continue;
    if (e.kind === 'strafe') {
      if (e.status === 'beglichen') saldo += Math.abs(e.betragCents);
    } else {
      saldo += e.betragCents;
    }
  }
  return saldo;
}

export function getKasseEintraege() {
  return db
    .select({ eintrag: kasse, member: members })
    .from(kasse)
    .leftJoin(members, eq(kasse.memberId, members.id))
    .orderBy(desc(kasse.createdAt))
    .all();
}

export function getOffeneStrafen() {
  return db
    .select({ eintrag: kasse, member: members })
    .from(kasse)
    .leftJoin(members, eq(kasse.memberId, members.id))
    .where(and(eq(kasse.kind, 'strafe'), eq(kasse.status, 'offen')))
    .all();
}

/** Besuchte Wirtshäuser inkl. Durchschnittsbewertung und Besuchsdatum. */
export function getArchiv() {
  const abgeschlossene = db
    .select()
    .from(termine)
    .where(eq(termine.phase, 'abgeschlossen'))
    .orderBy(desc(termine.datum))
    .all();
  const alleBesuche = db.select().from(besuche).all();

  return abgeschlossene
    .filter((t) => t.wirtshausId)
    .map((t) => {
      const wirtshaus = db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, t.wirtshausId!)).get()!;
      const planer = t.planerId
        ? (db.select().from(members).where(eq(members.id, t.planerId)).get() ?? null)
        : null;
      const bewertungen = alleBesuche.filter((b) => b.terminId === t.id && b.sterne != null);
      const rating = bewertungen.length
        ? bewertungen.reduce((sum, b) => sum + (b.sterne ?? 0), 0) / bewertungen.length
        : 0;
      const hoiben = alleBesuche.filter((b) => b.terminId === t.id).reduce((sum, b) => sum + b.hoiben, 0);
      return { termin: t, wirtshaus, planer, rating, hoiben };
    });
}

export function getAemter(saison: string) {
  return db
    .select({ amt: aemter, member: members })
    .from(aemter)
    .leftJoin(members, eq(aemter.memberId, members.id))
    .where(eq(aemter.saison, saison))
    .all();
}

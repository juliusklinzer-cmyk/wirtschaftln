import { desc, eq, ne, and, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { anzeigeName } from '@/lib/namen';
import { db, members, termine, votes, besuche, wirtshaeuser, kasse, aemter, umfragen, umfrageStimmen, wirtshausBewertungen } from '@/lib/db';
import {
  PTS,
  wirtschaftlnPunkte,
  anwesenheitsBonus,
  entschuldigtMalus,
  unentschuldigtMalus,
  orgaPunkte,
  rechtzeitigAbgestimmt,
} from '@/lib/punkte';
import { vergabeStand } from '@/lib/badges';
import { aktuelleSaison } from '@/lib/saison';

export type Termin = typeof termine.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Wirtshaus = typeof wirtshaeuser.$inferSelect;
export type KasseEintrag = typeof kasse.$inferSelect;

/** Nachtragen/Ändern ist bis 7 Tage nach dem Abschluss erlaubt. */
export function nachtragsfristOffen(abgeschlossenAm: string | null): boolean {
  if (!abgeschlossenAm) return true;
  return Date.now() - new Date(abgeschlossenAm).getTime() < 7 * 24 * 60 * 60 * 1000;
}

/** Der jüngste abgeschlossene Termin, oder null. */
export function getLetzterAbgeschlossenerTermin() {
  return (
    db
      .select()
      .from(termine)
      .where(eq(termine.phase, 'abgeschlossen'))
      .orderBy(desc(termine.datum))
      .get() ?? null
  );
}

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

/** „Gfundene" Wirtshäuser, die noch keinem Termin zugeordnet sind (offene Pins). */
export function getOffeneWirtshaeuser() {
  const belegt = new Set(
    db.select().from(termine).all().map((t) => t.wirtshausId).filter(Boolean) as string[],
  );
  return db
    .select({ wirtshaus: wirtshaeuser, finder: members })
    .from(wirtshaeuser)
    .leftJoin(members, eq(wirtshaeuser.vorgeschlagenVon, members.id))
    .all()
    // Altbestand is NICHT offen — der gilt als besucht (und wird eh nie zweimal besucht)
    .filter(({ wirtshaus }) => !belegt.has(wirtshaus.id) && !wirtshaus.altbestand);
}

export function getBesucheFuerTermin(terminId: string) {
  return db.select().from(besuche).where(eq(besuche.terminId, terminId)).all();
}

export function getKasseFuerTermin(terminId: string) {
  return db.select().from(kasse).where(eq(kasse.terminId, terminId)).all();
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

/** Namen aller schon besuchten Wirtshäuser (Termine + Altbestand) — für die „schon gwesen"-Warnung in der Suche. */
export function getBesuchteWirtshausNamen(): string[] {
  const besuchtIds = new Set(
    db.select().from(termine).where(eq(termine.phase, 'abgeschlossen')).all().map((t) => t.wirtshausId).filter(Boolean),
  );
  return db
    .select()
    .from(wirtshaeuser)
    .all()
    .filter((w) => w.altbestand || besuchtIds.has(w.id))
    .map((w) => w.name);
}

/** Aktueller Kassenwart (gewähltes Amt der laufenden Saison) — darf Ausgaben buchen. */
export function getKassenwartId(): string | null {
  return (
    getAemter(String(aktuelleSaison().jahr)).find(({ amt }) => amt.titel.startsWith('Kassenwart'))?.amt.memberId ?? null
  );
}

/**
 * Aktueller Präsident = Saison-Rang 1 nach WP — EINE Quelle für Rangliste, Ämter und Rechte.
 * Bei 0 Punkten (Saisonstart/Launch) gibt's KOAN Präsidenten — sonst kriegt der
 * alphabetisch Erste still die Rechte (Strafen erlassen, Wirtshaus festlegen).
 */
export function getPraesidentId(): string | null {
  const stats = getStats({ abDatum: aktuelleSaison().start });
  const erster = [...stats].sort((a, b) => b.punkte - a.punkte)[0];
  return erster && erster.punkte > 0 ? erster.member.id : null;
}

/** Alle Umfragen (neueste zuerst) samt Stimmen und Ersteller. */
export function getUmfragen() {
  const alle = db
    .select({ umfrage: umfragen, ersteller: members })
    .from(umfragen)
    .leftJoin(members, eq(umfragen.erstelltVon, members.id))
    .orderBy(desc(umfragen.createdAt))
    .all();
  const stimmen = db.select().from(umfrageStimmen).all();
  return alle.map(({ umfrage, ersteller }) => ({
    umfrage,
    ersteller,
    stimmen: stimmen.filter((s) => s.umfrageId === umfrage.id),
  }));
}

export type MitgliedStats = {
  member: Member;
  hoiben: number;
  abende: number;
  wirtshaeuser: number;
  kaiserschmarrn: number;
  schweinsbraten: number;
  taxi: number;
  organisiert: number;
  abschluesse: number;
  runden: number;
  /** >0 = Abende in Folge dabei, <0 = Abende in Folge gefehlt (jüngster Abend zuerst). */
  streak: number;
  bestStreak: number;
  /** Unentschuldigte Fehltermine in Folge (seit der letzten Anwesenheit) — ab 3 „wackelt" er. */
  unentschuldigtStreak: number;
  /** Fest verbuchte Punkte-Bestandteile (fürs „Dei Ausbeute"-Aufschlüsseln auf Hoam). */
  orgaSumme: number;
  serienBonus: number;
  fehlMalus: number;
  abstimmBonus: number;
  vorschlagPunkte: number;
  textBonus: number;
  /** Wirtschaftln-Punkte (V2), siehe lib/punkte.ts */
  punkte: number;
};

/**
 * Statistiken nach Punktesystem V2: jeder Abend verbucht seine Punkte fest
 * (Serienbonus je Abend, Fehl-Staffeln aus den Zu-/Absagen, Orga nach
 * Bewertungsschnitt, Abstimm-/Vorschlags-/Text-Bonus).
 * Mit `abDatum` zählen nur Ereignisse ab diesem Datum (Saison-Ansicht) —
 * die Serien-Zähler laufen aber immer über die ganze Chronik.
 * Mit `ohneTerminId` wird ein Termin komplett ausgeblendet („Stand davor").
 * Mit `bisDatum` gibt's den historischen Stand zu diesem Datum (Hall of Fame).
 */
export function getStats(optionen?: { abDatum?: string; bisDatum?: string; ohneTerminId?: string }): MitgliedStats[] {
  const alleMitglieder = getAktiveMitglieder();
  // Chronologisch alt → neu, damit die Serien-Zähler sauber mitlaufen
  const chronologisch = db
    .select()
    .from(termine)
    .where(eq(termine.phase, 'abgeschlossen'))
    .orderBy(asc(termine.datum))
    .all()
    .filter((t) => t.id !== optionen?.ohneTerminId)
    .filter((t) => !optionen?.bisDatum || t.datum <= optionen.bisDatum);
  /** Zählt dieses Ereignis-Datum ins gewählte Fenster (Saison/Allzeit)? */
  const imFenster = (datum: string) => !optionen?.abDatum || datum >= optionen.abDatum;

  const alleBesuche = db.select().from(besuche).all();
  const byTermin = new Map<string, Map<string, (typeof alleBesuche)[number]>>();
  for (const b of alleBesuche) {
    if (!byTermin.has(b.terminId)) byTermin.set(b.terminId, new Map());
    byTermin.get(b.terminId)!.set(b.memberId, b);
  }
  const alleVotes = db.select().from(votes).all();
  const voteByTermin = new Map<string, Map<string, (typeof alleVotes)[number]>>();
  for (const v of alleVotes) {
    if (!voteByTermin.has(v.terminId)) voteByTermin.set(v.terminId, new Map());
    voteByTermin.get(v.terminId)!.set(v.memberId, v);
  }
  /** Bewertungsschnitt eines Abends → Orga-Punkte (0–5). */
  const orgaVon = new Map<string, number>();
  for (const t of chronologisch) {
    const werte = [...(byTermin.get(t.id)?.values() ?? [])].filter((b) => b.sterne != null).map((b) => b.sterne!);
    orgaVon.set(t.id, orgaPunkte(werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : 0));
  }

  // Runden: Saison-Zuordnung über das Termin-Datum (Nachträge ändern die Saison nicht)
  const terminDatum = new Map(db.select().from(termine).all().map((t) => [t.id, t.datum]));
  const rundenJeMitglied = new Map<string, number>();
  for (const e of db.select().from(kasse).where(eq(kasse.kind, 'runde')).all()) {
    if (e.status === 'aufgehoben' || !e.memberId) continue;
    if (optionen?.ohneTerminId && e.terminId === optionen.ohneTerminId) continue;
    const datum = (e.terminId ? terminDatum.get(e.terminId) : null) ?? e.createdAt.slice(0, 10);
    if (!imFenster(datum)) continue;
    if (optionen?.bisDatum && datum > optionen.bisDatum) continue;
    rundenJeMitglied.set(e.memberId, (rundenJeMitglied.get(e.memberId) ?? 0) + 1);
  }

  // Wirtshaus-Vorschläge: +1 beim Vorschlagen, +1 wenn's tatsächlich besucht wird
  const alleWirtshaeuser = db.select().from(wirtshaeuser).all();
  const besuchtErstmalsAm = new Map<string, string>(); // wirtshausId → Datum des (ersten) Besuchs
  for (const t of chronologisch) {
    if (t.wirtshausId && !besuchtErstmalsAm.has(t.wirtshausId)) besuchtErstmalsAm.set(t.wirtshausId, t.datum);
  }

  return alleMitglieder.map((member) => {
    let hoiben = 0;
    let abende = 0;
    let kaiserschmarrn = 0;
    let schweinsbraten = 0;
    let taxi = 0;
    let organisiert = 0;
    let abschluesse = 0;
    let orgaSumme = 0;
    let abstimmBonus = 0;
    let textBonus = 0;
    const besuchteWirtshaeuser = new Set<string>();

    // Serien-Zähler laufen über die ganze Chronik (ab Beitritt); in die Punkte
    // fließen nur Ereignisse im gewählten Fenster.
    const beitritt = member.createdAt.slice(0, 10);
    let besuchtInFolge = 0;
    let entschuldigtInFolge = 0;
    let unentschuldigtInFolge = 0;
    let serienBonus = 0;
    let fehlMalus = 0;
    let bestStreak = 0;

    for (const t of chronologisch) {
      const b = byTermin.get(t.id)?.get(member.id);
      const vote = voteByTermin.get(t.id)?.get(member.id);
      const dabei = !!b?.anwesend;
      const zaehlt = imFenster(t.datum);

      if (dabei) {
        if (zaehlt) {
          hoiben += b!.hoiben;
          kaiserschmarrn += b!.kaiserschmarrn;
          schweinsbraten += b!.schweinsbraten;
          if (b!.taxi) taxi += 1;
          abende += 1;
          if (b!.kommentar?.trim()) textBonus += PTS.bewertungsText;
          if (t.wirtshausId) besuchteWirtshaeuser.add(t.wirtshausId);
        }
      }
      if (t.planerId === member.id) {
        if (zaehlt) {
          organisiert += 1;
          orgaSumme += orgaVon.get(t.id) ?? 0;
        }
      }
      if (t.abgeschlossenVon === member.id && zaehlt) abschluesse += 1;
      // Rechtzeitig (erste Stimme bis 3 Tage vorher) zu- ODER abgesagt → +1
      if (zaehlt && vote && rechtzeitigAbgestimmt(vote.erstmalsAm, t.datum)) abstimmBonus += PTS.abstimmen;

      // Serie & Fehl-Staffeln — Termine vor dem Beitritt zählen nicht als gefehlt
      const zaehltFuerSerie = t.datum >= beitritt || byTermin.get(t.id)?.has(member.id);
      if (!zaehltFuerSerie) continue;
      if (dabei) {
        besuchtInFolge += 1;
        entschuldigtInFolge = 0;
        unentschuldigtInFolge = 0;
        if (besuchtInFolge > bestStreak) bestStreak = besuchtInFolge;
        if (zaehlt) serienBonus += anwesenheitsBonus(besuchtInFolge);
      } else {
        besuchtInFolge = 0;
        // abgsagt = entschuldigt; zugesagt/„vielleicht"/gar nix + ned da = unentschuldigt
        if (vote?.wert === 'ab') {
          entschuldigtInFolge += 1;
          if (zaehlt) fehlMalus += entschuldigtMalus(entschuldigtInFolge);
        } else {
          unentschuldigtInFolge += 1;
          if (zaehlt) fehlMalus += unentschuldigtMalus(unentschuldigtInFolge);
        }
      }
    }

    // Anzeige-Serie: dabei = positiv, gefehlt (egal welche Art) = negativ
    const streak = besuchtInFolge > 0 ? besuchtInFolge : -(entschuldigtInFolge + unentschuldigtInFolge);

    // Wirtshaus-Vorschläge (Altbestand hat koan Vorschlager, zählt also nicht)
    let vorschlagPunkte = 0;
    for (const w of alleWirtshaeuser) {
      if (w.vorgeschlagenVon !== member.id) continue;
      const vorgeschlagenAm = w.createdAt.slice(0, 10);
      if (optionen?.bisDatum && vorgeschlagenAm > optionen.bisDatum) continue;
      if (imFenster(vorgeschlagenAm)) vorschlagPunkte += PTS.vorschlag;
      const besuchtAm = besuchtErstmalsAm.get(w.id);
      if (besuchtAm && imFenster(besuchtAm)) vorschlagPunkte += PTS.vorschlagBesucht;
    }

    const runden = rundenJeMitglied.get(member.id) ?? 0;
    const komponenten = { hoiben, abende, taxi, runden, abschluesse, orgaSumme, serienBonus, fehlMalus, abstimmBonus, vorschlagPunkte, textBonus };
    return {
      member,
      ...komponenten,
      wirtshaeuser: besuchteWirtshaeuser.size,
      kaiserschmarrn,
      schweinsbraten,
      organisiert,
      streak,
      bestStreak,
      unentschuldigtStreak: unentschuldigtInFolge,
      punkte: wirtschaftlnPunkte(komponenten),
    };
  });
}

/** Kassensaldo in Cent: Einzahlungen/Runden + beglichene Strafen − Ausgaben. */
export function getSaldo(): number {
  const eintraege = db.select().from(kasse).all();
  let saldo = 0;
  for (const e of eintraege) {
    if (e.status === 'aufgehoben') continue;
    // Runden werden am Tisch zahlt — der Wert zählt für WP & Großbauer, ned für d'Kasse
    if (e.kind === 'runde') continue;
    if (e.kind === 'strafe') {
      // Offene Forderungen stehen scho in der Kasse — der Kassenwart treibt's nur no ein
      saldo += Math.abs(e.betragCents);
    } else {
      saldo += e.betragCents;
    }
  }
  return saldo;
}

export function getKasseEintraege() {
  // Melder als zweiter members-Join (Alias), dazu Termin + Wirtshaus fürs „wo".
  // Runden bleiben draußen: am Tisch zahlt, koa Geldbewegung — dokumentiert über WP + Moshammer.
  const melder = alias(members, 'melder');
  return db
    .select({ eintrag: kasse, member: members, melder, termin: termine, wirtshaus: wirtshaeuser })
    .from(kasse)
    .leftJoin(members, eq(kasse.memberId, members.id))
    .leftJoin(melder, eq(kasse.gemeldetVon, melder.id))
    .leftJoin(termine, eq(kasse.terminId, termine.id))
    .leftJoin(wirtshaeuser, eq(termine.wirtshausId, wirtshaeuser.id))
    .where(ne(kasse.kind, 'runde'))
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

export type ArchivHinweis = { art: 'kaisi' | 'brodn' | 'allgemein'; text: string; von: string };
export type ArchivTeilnehmer = {
  name: string;
  photoUrl: string | null;
  verein: 'bayern' | 'sechzig' | null;
  hoiben: number;
  kaiserschmarrn: number;
  schweinsbraten: number;
};

/** Besuchte Wirtshäuser inkl. Ø-Bewertungen (Sterne/Kaisi/Brodn), Teilnehmern und Hinweisen. */
export function getArchiv() {
  const abgeschlossene = db
    .select()
    .from(termine)
    .where(eq(termine.phase, 'abgeschlossen'))
    .orderBy(desc(termine.datum))
    .all();
  const alleBesuche = db.select().from(besuche).all();
  const alleMitglieder = db.select().from(members).all();
  const memberById = new Map(alleMitglieder.map((m) => [m.id, m]));
  const schnitt = (werte: number[]) => (werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : 0);

  return abgeschlossene
    .filter((t) => t.wirtshausId)
    .map((t) => {
      const wirtshaus = db.select().from(wirtshaeuser).where(eq(wirtshaeuser.id, t.wirtshausId!)).get()!;
      const planer = t.planerId ? (memberById.get(t.planerId) ?? null) : null;
      const besucheHier = alleBesuche.filter((b) => b.terminId === t.id);

      const sterneWerte = besucheHier.filter((b) => b.sterne != null).map((b) => b.sterne!);
      const kaiserWerte = besucheHier.filter((b) => b.kaiserSterne != null).map((b) => b.kaiserSterne!);
      const brodnWerte = besucheHier.filter((b) => b.brodnSterne != null).map((b) => b.brodnSterne!);
      const rating = schnitt(sterneWerte);
      const ratingAnzahl = sterneWerte.length;
      const kaiser = schnitt(kaiserWerte);
      const kaiserAnzahl = kaiserWerte.length;
      const brodn = schnitt(brodnWerte);
      const brodnAnzahl = brodnWerte.length;
      const hoiben = besucheHier.reduce((sum, b) => sum + b.hoiben, 0);

      const teilnehmer: ArchivTeilnehmer[] = besucheHier
        .filter((b) => b.anwesend)
        .map((b) => {
          const m = memberById.get(b.memberId);
          return {
            name: (m ? anzeigeName(m) : '—'),
            photoUrl: m?.photoUrl ?? null,
            verein: m?.verein ?? null,
            hoiben: b.hoiben,
            kaiserschmarrn: b.kaiserschmarrn,
            schweinsbraten: b.schweinsbraten,
          };
        })
        .sort((a, b) => b.hoiben - a.hoiben);

      const hinweise: ArchivHinweis[] = [];
      for (const b of besucheHier) {
        const von = (memberById.get(b.memberId) ? anzeigeName(memberById.get(b.memberId)!) : '—');
        if (b.kaiserNotiz) hinweise.push({ art: 'kaisi', text: b.kaiserNotiz, von });
        if (b.brodnNotiz) hinweise.push({ art: 'brodn', text: b.brodnNotiz, von });
        if (b.kommentar) hinweise.push({ art: 'allgemein', text: b.kommentar, von });
      }

      return { termin: t, wirtshaus, planer, rating, ratingAnzahl, kaiser, kaiserAnzahl, brodn, brodnAnzahl, hoiben, teilnehmer, hinweise };
    });
}

/** Freiwillige Nachbewertungen (ohne WP) samt Bewerter — für Karte & Sterne-Statistik. */
export function getNachbewertungen() {
  return db
    .select({ bewertung: wirtshausBewertungen, member: members })
    .from(wirtshausBewertungen)
    .innerJoin(members, eq(wirtshausBewertungen.memberId, members.id))
    .all();
}

/** Altbestand: vor der App-Zeit besuchte Wirtshäuser (Chronik seit 2019). */
export function getAltbestand() {
  return db.select().from(wirtshaeuser).where(eq(wirtshaeuser.altbestand, true)).all();
}

/**
 * Aktueller Badge-/Amt-Vergabe-Stand der Saison (Badge-Key → Halter).
 * Mit `ohneTerminId` = der Stand, wie er VOR diesem Termin war.
 */
export function getVergabeStand(ohneTerminId?: string): Map<string, string> {
  const saison = aktuelleSaison();
  const stats = getStats({ abDatum: saison.start, ohneTerminId });
  const archivSaison = getArchiv().filter(
    (a) => a.termin.datum >= saison.start && a.termin.id !== ohneTerminId && a.rating > 0,
  );
  const bestes = [...archivSaison].sort((a, b) => b.rating - a.rating)[0];
  return vergabeStand(stats, bestes?.planer?.id ?? null);
}

export type HistorienSegment = { holderId: string; von: string; bis: string | null };

/**
 * Badge-/Amt-Historie für die Hall of Fame: Für jeden abgeschlossenen Termin
 * (chronologisch) wird der damalige Vergabe-Stand rekonstruiert; daraus
 * entstehen Halte-Zeiträume pro Badge/Amt. Offene Segmente (bis=null) = aktuell.
 */
export function getBadgeHistorie(): Map<string, HistorienSegment[]> {
  const chronik = db
    .select()
    .from(termine)
    .where(eq(termine.phase, 'abgeschlossen'))
    .orderBy(asc(termine.datum))
    .all();
  const archiv = getArchiv();
  const verlauf = new Map<string, HistorienSegment[]>();

  for (const t of chronik) {
    const saisonStart = aktuelleSaison(new Date(t.datum)).start;
    const stats = getStats({ abDatum: saisonStart, bisDatum: t.datum });
    const archivBis = archiv.filter((a) => a.termin.datum >= saisonStart && a.termin.datum <= t.datum && a.rating > 0);
    const bestes = [...archivBis].sort((a, b) => b.rating - a.rating)[0];
    const stand = vergabeStand(stats, bestes?.planer?.id ?? null);

    for (const [key, holderId] of stand) {
      const segmente = verlauf.get(key) ?? [];
      const letztes = segmente[segmente.length - 1];
      if (letztes && letztes.bis === null && letztes.holderId === holderId) continue; // hält weiter
      if (letztes && letztes.bis === null) letztes.bis = t.datum;
      segmente.push({ holderId, von: t.datum, bis: null });
      verlauf.set(key, segmente);
    }
    // Saisonwechsel o. Ä.: Keys ohne aktuellen Halter → offenes Segment schließen
    for (const [key, segmente] of verlauf) {
      const letztes = segmente[segmente.length - 1];
      if (letztes.bis === null && !stand.has(key)) letztes.bis = t.datum;
    }
  }
  return verlauf;
}

/** Alle Kassenwart-Einträge über die Saisons (gewähltes Amt — Historie aus der DB). */
export function getKassenwartHistorie() {
  return db
    .select({ amt: aemter, member: members })
    .from(aemter)
    .leftJoin(members, eq(aemter.memberId, members.id))
    .all()
    .filter(({ amt }) => amt.titel.startsWith('Kassenwart'))
    .sort((a, b) => b.amt.saison.localeCompare(a.amt.saison));
}

export function getAemter(saison: string) {
  return db
    .select({ amt: aemter, member: members })
    .from(aemter)
    .leftJoin(members, eq(aemter.memberId, members.id))
    .where(eq(aemter.saison, saison))
    .all();
}

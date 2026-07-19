import {
  getStats,
  getAemter,
  getArchiv,
  getLetzterAbgeschlossenerTermin,
  getBadgeHistorie,
  getKassenwartHistorie,
  type MitgliedStats,
  type HistorienSegment,
} from '@/lib/queries';
import { anzeigeName, urkundenName } from '@/lib/namen';
import { aktuelleSaison } from '@/lib/saison';
import { datumKurz } from '@/lib/format';
import { saisonBadgesVergeben, serienAbzeichen, amtInfo, AEMTER_INFO, SAISON_BADGES } from '@/lib/badges';
import type { BadgeInfoDaten, HallOfFameEintrag, ZaehlerBlock } from '@/components/domain/BadgeInfo';
import type { SpezlEintrag, AmtEintrag, GalerieBadge, StatsBlock } from './rangliste';

function rangVon(liste: MitgliedStats[], memberId: string): number {
  return [...liste].sort((a, b) => b.punkte - a.punkte).findIndex((s) => s.member.id === memberId) + 1;
}

/** Stats fürs UI, inkl. Veränderung (Punkte + Plätze) seit dem letzten Stammtisch. */
function statsBlock(s: MitgliedStats, aktuell: MitgliedStats[], vorher: MitgliedStats[]): StatsBlock {
  const vor = vorher.find((v) => v.member.id === s.member.id);
  return {
    punkte: s.punkte,
    hoiben: s.hoiben,
    abende: s.abende,
    wirtshaeuser: s.wirtshaeuser,
    organisiert: s.organisiert,
    runden: s.runden,
    schweinsbraten: s.schweinsbraten,
    taxi: s.taxi,
    streak: s.streak,
    bestStreak: s.bestStreak,
    unentschuldigtStreak: s.unentschuldigtStreak,
    deltaPunkte: s.punkte - (vor?.punkte ?? 0),
    deltaRang: vor ? rangVon(vorher, s.member.id) - rangVon(aktuell, s.member.id) : 0,
  };
}

/** Gemeinsame Datenaufbereitung für beide Ranglisten-Stile. */
export function ladeRanglisteDaten(meId: string): {
  eintraege: SpezlEintrag[];
  aemterListe: AmtEintrag[];
  galerie: GalerieBadge[];
  badgeInfos: Record<string, BadgeInfoDaten>;
  mitglieder: MitgliedStats['member'][];
  saison: ReturnType<typeof aktuelleSaison>;
  /** Aktueller Präsident (Saison-Rang 1) — darf den Kassenwart eintragen. */
  praesidentId: string | null;
} {
  const saison = aktuelleSaison();
  const statsAllzeit = getStats();
  const statsSaison = getStats({ abDatum: saison.start });
  // Stand vor dem letzten Stammtisch → Veränderung + Umsortier-Animation
  const letzter = getLetzterAbgeschlossenerTermin();
  const vorherAllzeit = letzter ? getStats({ ohneTerminId: letzter.id }) : statsAllzeit;
  const vorherSaison = letzter ? getStats({ abDatum: saison.start, ohneTerminId: letzter.id }) : statsSaison;
  const aemterDb = getAemter(String(saison.jahr));

  // Meister Eder: Planer des bestbewerteten Wirtshauses dieser Saison
  const archivSaison = getArchiv().filter((a) => a.termin.datum >= saison.start && a.rating > 0);
  const bestes = [...archivSaison].sort((a, b) => b.rating - a.rating)[0];
  const badges = saisonBadgesVergeben(statsSaison, bestes?.planer?.id ?? null);

  // Automatische Ämter: Präsident = Saison-Rang 1, Schriftführer = meiste Abschlüsse.
  // Der Rest (Kassenwart, …) kommt als Wahl-Ergebnis aus der DB.
  // Wie getPraesidentId: bei 0 Punkten (Saisonstart) gibt's no koan Präsidenten
  const praesidentKandidat = [...statsSaison].sort((a, b) => b.punkte - a.punkte)[0];
  const praesident = praesidentKandidat && praesidentKandidat.punkte > 0 ? praesidentKandidat.member : null;
  const fleissigster = [...statsSaison].sort((a, b) => b.abschluesse - a.abschluesse)[0];
  const schriftfuehrer = fleissigster && fleissigster.abschluesse > 0 ? fleissigster.member : null;
  const amtVonMember = new Map<string, { titel: string; icon: string }>();
  if (praesident) amtVonMember.set(praesident.id, { titel: 'Präsident', icon: AEMTER_INFO['Präsident'].icon });
  if (schriftfuehrer && !amtVonMember.has(schriftfuehrer.id)) {
    amtVonMember.set(schriftfuehrer.id, { titel: 'Schriftführer', icon: AEMTER_INFO['Schriftführer'].icon });
  }
  for (const { amt } of aemterDb) {
    if (amt.titel === 'Schriftführer') continue; // wird automatisch vergeben
    if (amt.memberId && !amtVonMember.has(amt.memberId)) {
      amtVonMember.set(amt.memberId, { titel: amt.titel, icon: amt.icon });
    }
  }

  const badgesJeMember = new Map<string, typeof badges>();
  for (const b of badges) {
    if (!badgesJeMember.has(b.holderId)) badgesJeMember.set(b.holderId, []);
    badgesJeMember.get(b.holderId)!.push(b);
  }

  const eintraege: SpezlEintrag[] = statsAllzeit.map((allzeit) => {
    const s = statsSaison.find((x) => x.member.id === allzeit.member.id)!;
    return {
      id: allzeit.member.id,
      name: anzeigeName(allzeit.member),
      vollerName: urkundenName(allzeit.member),
      photoUrl: allzeit.member.photoUrl,
      istIch: allzeit.member.id === meId,
      amt: amtVonMember.get(allzeit.member.id) ?? null,
      badges: (badgesJeMember.get(allzeit.member.id) ?? []).map(({ key, icon, name, tag, pflicht }) => ({ key, icon, name, tag, pflicht })),
      serien: [...serienAbzeichen(allzeit.bestStreak)],
      steckbrief: {
        herkunft: allzeit.member.herkunft,
        lieblingsbier: allzeit.member.lieblingsbier,
        lieblingsweissbier: allzeit.member.lieblingsweissbier,
        leibspeise: allzeit.member.leibspeise,
        lieblingsbiergarten: allzeit.member.lieblingsbiergarten,
        lieblingswirtshaus: allzeit.member.lieblingswirtshaus,
        verein: allzeit.member.verein,
        schafkopfer: allzeit.member.schafkopfer,
        beschreibung: allzeit.member.beschreibung,
      },
      saison: statsBlock(s, statsSaison, vorherSaison),
      allzeit: statsBlock(allzeit, statsAllzeit, vorherAllzeit),
    };
  });

  const holderVon = (memberId: string | null | undefined) => {
    if (!memberId) return null;
    const m = statsAllzeit.find((s) => s.member.id === memberId)?.member;
    return m ? { name: anzeigeName(m), photoUrl: m.photoUrl } : null;
  };

  const aemterListe: AmtEintrag[] = [
    { titel: 'Präsident', ...AEMTER_INFO['Präsident'], holder: holderVon(praesident?.id) },
    { titel: 'Schriftführer', ...AEMTER_INFO['Schriftführer'], holder: holderVon(schriftfuehrer?.id) },
    ...aemterDb
      .filter(({ amt }) => amt.titel !== 'Präsident' && amt.titel !== 'Schriftführer')
      .map(({ amt }) => {
        const info = amtInfo(amt.titel);
        return { titel: amt.titel, icon: amt.icon, slug: info.slug ?? null, patron: info.patron ?? null, mode: info.mode, duties: info.duties, holder: holderVon(amt.memberId) };
      }),
  ];
  // Kassenwart immer zeigen — vor der ersten Wahl steht er als „unbesetzt" da
  if (!aemterListe.some((a) => a.titel.startsWith('Kassenwart'))) {
    aemterListe.push({ titel: 'Kassenwart', ...AEMTER_INFO['Kassenwart'], holder: null });
  }

  const galerie: GalerieBadge[] = badges.map(({ key, icon, name, tag, pflicht, holderId }) => ({
    key,
    icon,
    name,
    tag,
    pflicht,
    holder: holderVon(holderId),
  }));

  // ── Info-Fenster: G'schichtl + Hall of Fame je Badge/Amt ──
  const historie = getBadgeHistorie();
  const hallOfFameVon = (key: string): HallOfFameEintrag[] =>
    (historie.get(key) ?? [])
      .slice()
      .reverse()
      .map((seg: HistorienSegment) => {
        const halter = holderVon(seg.holderId);
        return {
          name: halter?.name ?? '—',
          photoUrl: halter?.photoUrl ?? null,
          zeitraum: seg.bis ? `${datumKurz(seg.von)} – ${datumKurz(seg.bis)}` : `seit ${datumKurz(seg.von)}`,
          aktiv: seg.bis === null,
        };
      });

  // Moshammer-Zähler: die Runden-Rangliste lebt im Badge (im Kassenbuch stehen Runden ned).
  const moshammerId = badges.find((b) => b.key === 'moshammer')?.holderId ?? null;
  const rundenZaehler: ZaehlerBlock = {
    titel: 'D’Runden-Rangliste',
    hinweis: 'wer wia oft a Runde gschmissen hat',
    einheit: 'Runden',
    eintraege: statsAllzeit
      .filter((a) => a.runden > 0)
      .map((a) => ({
        name: anzeigeName(a.member),
        photoUrl: a.member.photoUrl,
        saison: statsSaison.find((x) => x.member.id === a.member.id)?.runden ?? 0,
        gesamt: a.runden,
        aktiv: a.member.id === moshammerId,
      }))
      .sort((x, y) => y.saison - x.saison || y.gesamt - x.gesamt),
  };

  const badgeInfos: Record<string, BadgeInfoDaten> = {};
  for (const b of SAISON_BADGES) {
    badgeInfos[b.key] = {
      key: b.key,
      art: 'badge',
      slug: b.key,
      icon: b.icon,
      name: b.name,
      untertitel: b.tag,
      text: b.geschichte,
      pflicht: b.pflicht,
      duties: null,
      hallOfFame: hallOfFameVon(b.key),
      zaehler: b.key === 'moshammer' ? rundenZaehler : null,
    };
  }
  for (const [key, titel] of [
    ['amt:praesident', 'Präsident'],
    ['amt:schriftfuehrer', 'Schriftführer'],
  ] as const) {
    const info = AEMTER_INFO[titel];
    badgeInfos[key] = {
      key,
      art: 'amt',
      slug: info.slug,
      icon: info.icon,
      name: titel,
      untertitel: `Amt · ${info.mode} · Patron: ${info.patron}`,
      text: info.geschichte,
      pflicht: null,
      duties: info.duties,
      hallOfFame: hallOfFameVon(key),
    };
  }
  badgeInfos['amt:kassenwart'] = {
    key: 'amt:kassenwart',
    art: 'amt',
    slug: AEMTER_INFO['Kassenwart'].slug,
    icon: AEMTER_INFO['Kassenwart'].icon,
    name: 'Kassenwart',
    untertitel: `Amt · Gewählt · Patron: ${AEMTER_INFO['Kassenwart'].patron}`,
    text: AEMTER_INFO['Kassenwart'].geschichte,
    pflicht: null,
    duties: AEMTER_INFO['Kassenwart'].duties,
    hallOfFame: getKassenwartHistorie().map(({ amt, member }) => ({
      name: member ? (anzeigeName(member)) : 'unbesetzt',
      photoUrl: member?.photoUrl ?? null,
      zeitraum: `Saison ${amt.saison}`,
      aktiv: amt.saison === String(saison.jahr),
    })),
  };

  return { eintraege, aemterListe, galerie, badgeInfos, mitglieder: statsAllzeit.map((s) => s.member), saison, praesidentId: praesident?.id ?? null };
}

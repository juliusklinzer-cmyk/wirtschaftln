import { anzeigeName } from '@/lib/namen';
import {
  getArchiv,
  getAktuellerTermin,
  getTerminMitWirtshaus,
  getOffeneWirtshaeuser,
  getAltbestand,
  getNachbewertungen,
} from '@/lib/queries';
import { datumKurz } from '@/lib/format';
import type { ArchivEintrag } from '@/components/domain/ArchivScreen';

/**
 * Baut die kompletten Archiv-Einträge (Karte, Ranglisten, Detail-Dialog) auf —
 * gemeinsam genutzt von der Karten-Seite und der Chronik auf der Termin-Seite.
 * Nachbewertungen (freiwillig, ohne WP) fließen in Sterne/Schmarrn/Brodn ein;
 * Meister Eder rechnet weiterhin nur mit Termin-Bewertungen.
 */
export function ladeArchivEintraege(meId: string): ArchivEintrag[] {
  const archiv = getArchiv();
  const aktueller = getAktuellerTermin();

  const nachbewertungen = getNachbewertungen();
  const nachVon = (wirtshausId: string) => nachbewertungen.filter((n) => n.bewertung.wirtshausId === wirtshausId);
  const meineVon = (wirtshausId: string) => {
    const eigene = nachVon(wirtshausId).find((n) => n.bewertung.memberId === meId);
    return eigene
      ? {
          sterne: eigene.bewertung.sterne,
          kaiserSterne: eigene.bewertung.kaiserSterne,
          brodnSterne: eigene.bewertung.brodnSterne,
          kommentar: eigene.bewertung.kommentar,
          kaiserNotiz: eigene.bewertung.kaiserNotiz,
          brodnNotiz: eigene.bewertung.brodnNotiz,
        }
      : null;
  };
  /** Termin-Schnitt (schnitt × anzahl) mit Nachbewertungs-Werten zu einem Gesamtschnitt verrechnen. */
  const blend = (schnitt: number, anzahl: number, werte: number[]) => {
    const summe = schnitt * anzahl + werte.reduce((s, w) => s + w, 0);
    const gesamt = anzahl + werte.length;
    return gesamt > 0 ? summe / gesamt : 0;
  };
  // Notizen aus Nachbewertungen als Hinweise, je Wertung mit passendem Icon (💬/🥞/🍖)
  const nachKommentare = (wirtshausId: string) =>
    nachVon(wirtshausId).flatMap(({ bewertung, member }) => {
      const von = `${anzeigeName(member)} (nachbewertet)`;
      const hinweise: { art: 'allgemein' | 'kaisi' | 'brodn'; text: string; von: string }[] = [];
      if (bewertung.kommentar) hinweise.push({ art: 'allgemein', text: bewertung.kommentar, von });
      if (bewertung.kaiserNotiz) hinweise.push({ art: 'kaisi', text: bewertung.kaiserNotiz, von });
      if (bewertung.brodnNotiz) hinweise.push({ art: 'brodn', text: bewertung.brodnNotiz, von });
      return hinweise;
    });

  // Das reservierte Wirtshaus des laufenden Termins → goldener „Nächstes Mal"-Pin
  const eintraege: ArchivEintrag[] = [];
  if (aktueller && (aktueller.phase === 'reserviert' || aktueller.phase === 'heute')) {
    const { wirtshaus, planer } = getTerminMitWirtshaus(aktueller);
    if (wirtshaus) {
      eintraege.push({
        id: wirtshaus.id,
        name: wirtshaus.name,
        bezirk: wirtshaus.bezirk,
        lat: wirtshaus.lat,
        lng: wirtshaus.lng,
        photoUrl: wirtshaus.photoUrl,
        biersorte: wirtshaus.biersorte,
        besuchtAm: null,
        organisator: planer ? { name: anzeigeName(planer), photoUrl: planer.photoUrl } : null,
        rating: 0,
        kaiser: 0,
        brodn: 0,
        hoiben: 0,
        teilnehmer: [],
        hinweise: [],
        naechstes: true,
      });
    }
  }

  // „Gfundene" Wirtshäuser, offen, noch von koan Termin belegt
  for (const { wirtshaus, finder } of getOffeneWirtshaeuser()) {
    eintraege.push({
      id: wirtshaus.id,
      name: wirtshaus.name,
      bezirk: wirtshaus.bezirk,
      lat: wirtshaus.lat,
      lng: wirtshaus.lng,
      photoUrl: wirtshaus.photoUrl,
      biersorte: wirtshaus.biersorte,
      besuchtAm: null,
      organisator: null,
      gfundenVon: finder ? anzeigeName(finder) : null,
      gfundenVonId: wirtshaus.vorgeschlagenVon,
      rating: 0,
      kaiser: 0,
      brodn: 0,
      hoiben: 0,
      teilnehmer: [],
      hinweise: [],
      meineBewertung: meineVon(wirtshaus.id),
    });
  }

  for (const a of archiv) {
    const nach = nachVon(a.wirtshaus.id);
    eintraege.push({
      id: a.wirtshaus.id,
      name: a.wirtshaus.name,
      bezirk: a.wirtshaus.bezirk,
      lat: a.wirtshaus.lat,
      lng: a.wirtshaus.lng,
      photoUrl: a.wirtshaus.photoUrl,
      biersorte: a.wirtshaus.biersorte,
      besuchtAm: datumKurz(a.termin.datum),
      organisator: a.planer ? { name: anzeigeName(a.planer), photoUrl: a.planer.photoUrl } : null,
      rating: blend(a.rating, a.ratingAnzahl, nach.map((n) => n.bewertung.sterne)),
      kaiser: blend(a.kaiser, a.kaiserAnzahl, nach.map((n) => n.bewertung.kaiserSterne).filter((s): s is number => s != null)),
      brodn: blend(a.brodn, a.brodnAnzahl, nach.map((n) => n.bewertung.brodnSterne).filter((s): s is number => s != null)),
      nachAnzahl: nach.length,
      hoiben: a.hoiben,
      teilnehmer: a.teilnehmer,
      hinweise: [...a.hinweise, ...nachKommentare(a.wirtshaus.id)],
      meineBewertung: meineVon(a.wirtshaus.id),
    });
  }

  // Altbestand: bsucht vor da App-Zeit (Chronik seit 2019), ohne Termin-Daten,
  // Bewertung nur aus freiwilligen Nachbewertungen. Wiederbesuchte (echter
  // Termin existiert) sind oben schon drin und werden übersprungen.
  const schonDrin = new Set(eintraege.map((e) => e.id));
  for (const w of getAltbestand()) {
    if (schonDrin.has(w.id)) continue;
    const nach = nachVon(w.id);
    eintraege.push({
      id: w.id,
      name: w.name,
      bezirk: w.bezirk,
      lat: w.lat,
      lng: w.lng,
      photoUrl: w.photoUrl,
      biersorte: w.biersorte,
      besuchtAm: null,
      altbestand: true,
      organisator: null,
      rating: blend(0, 0, nach.map((n) => n.bewertung.sterne)),
      kaiser: blend(0, 0, nach.map((n) => n.bewertung.kaiserSterne).filter((s): s is number => s != null)),
      brodn: blend(0, 0, nach.map((n) => n.bewertung.brodnSterne).filter((s): s is number => s != null)),
      nachAnzahl: nach.length,
      hoiben: 0,
      teilnehmer: [],
      hinweise: nachKommentare(w.id),
      meineBewertung: meineVon(w.id),
    });
  }

  return eintraege;
}

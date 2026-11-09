import { absageHinweis } from '@/lib/strafen-regeln';
import { ausgegebenVon } from '@/lib/runden';
import Link from 'next/link';
import { getCurrentMember, erzwingeProfil } from '@/lib/session';
import { anzeigeName } from '@/lib/namen';
import {
  getAktuellerTermin,
  getTerminMitWirtshaus,
  getVotesFuerTermin,
  getAktiveMitglieder,
  getArchiv,
  getBesucheFuerTermin,
  getKasseFuerTermin,
  getLetzterAbgeschlossenerTermin,
  getOffeneWirtshaeuser,
  nachtragsfristOffen,
  getPraesidentId,
  getBekannteWirtshaeuser,
  getWirtshausById,
  getCheckinsFuerTermin,
  getNaechsterTermin,
  getStats,
} from '@/lib/queries';
import { datumMittel, datumKurz } from '@/lib/format';
import { PTS, berlinTag, bierdeckelOffen, abschlussOffen, abschlussAb, ABEND_ENDE_UHRZEIT } from '@/lib/punkte';
import { nowIso } from '@/lib/ids';
import { Icon, Chip, Kachel, Zeile, ZeilenKarte, KlappenKopf } from '@/components/ds';
import { neuerTermin, wirtshausFestlegen, phaseSetzen, besuchAbschliessen, meineBewertung, orgaSchnappen, terminVerschieben, terminAbsagen } from './actions';
import { type AbschlussWerte } from './abschluss-form';
import { MeiBewertung } from '@/components/domain/MeiBewertung';
import { bewertungsDaten } from '@/lib/bewertungs-daten';
import { ChronikListe } from '@/components/domain/ChronikListe';
import { ladeArchivEintraege } from '@/lib/archiv-eintraege';
import { WirtshausSuche } from '@/components/domain/WirtshausSuche';
import { Bierdeckel, type BierdeckelSpezl } from '@/components/domain/Bierdeckel';
import { tenantConfig } from '@/lib/tenant-config';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { AbstimmungKarte, type AbstimmSpezl } from '@/components/domain/AbstimmungKarte';
import { OrganisationKarte } from '@/components/domain/OrganisationKarte';
import { LetzterAbendKarte } from '@/components/domain/LetzterAbendKarte';
import { WerKommtKarte } from '@/components/domain/WerKommtKarte';
import { OrgaKnopf } from '@/components/domain/OrgaKnopf';
import { RichtungsKnopf } from '@/components/domain/RichtungsKnopf';
import { eyebrowStil, titelStil, zeileStil, goldKnopfStil, rundKnopfStil, bereichHinweisStil, feldStil, feldLabelStil } from '@/components/domain/hero-stil';
import { HeroBand } from '@/components/domain/HeroBand';
import { navigationsUrl } from '@/lib/google-maps';

const dez = (n: number) => n.toFixed(1).replace('.', ',');

/** Gespeicherten Stand des Abschlusses fürs Nachtragen wieder ins Formular laden. */
function nachtragInitial(terminId: string): AbschlussWerte {
  const alleBesuche = getBesucheFuerTermin(terminId);
  const kasseEintraege = getKasseFuerTermin(terminId);
  const { wirtshaus } = getTerminMitWirtshaus(getLetzterAbgeschlossenerTermin()!);
  const rows: NonNullable<AbschlussWerte>['rows'] = {};
  for (const b of alleBesuche) {
    if (b.anwesend) {
      rows[b.memberId] = {
        hoiben: b.hoiben,
        schnaps: b.schnaps,
        brodn: b.schweinsbraten > 0,
        taxi: b.taxi,
        runde: kasseEintraege.some((k) => k.kind === 'runde' && k.memberId === b.memberId),
        abgsagt: false,
        spaet: b.zuSpaet,
      };
    } else if (kasseEintraege.some((k) => k.kind === 'strafe' && k.memberId === b.memberId && k.grund.startsWith('Zugesagt'))) {
      rows[b.memberId] = { hoiben: 0, schnaps: 0, brodn: false, taxi: false, runde: false, abgsagt: true };
    }
  }
  return {
    rows,
    kaisiBestellt: alleBesuche.some((b) => b.kaiserschmarrn > 0),
    biersorte: wirtshaus?.biersorte ?? 'Augustiner',
    weissbier: wirtshaus?.weissbier ?? '',
  };
}

/** Hinweiszeile unter einer Hauptaktion. */
function Hinweis({ children }: { children: React.ReactNode }) {
  return <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)' }}>{children}</div>;
}

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 };

/** Navy-Gold-Karte mit Rautenband, ab Tablet das Band mit dem Wirtshaus-Foto. */
function HeroKarte({ bild = null, children }: { bild?: string | null; children: React.ReactNode }) {
  return <HeroBand bild={bild} pad="14px 20px 18px">{children}</HeroBand>;
}

/** Fester Platz in der Handy-Reihenfolge; ab Tablet stehen die Teile in zwei Spalten. */
function Platz({ n, children }: { n: number; children: React.ReactNode }) {
  return <div style={{ order: n, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>{children}</div>;
}

const kartenTitel: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 26, lineHeight: 1, color: 'var(--navy)' };

/** Bierdeckel-Vorschau vor dem Abend (Responsive 2a): stricheln geht erst am Tisch. */
function DeckelVorschau({ wann }: { wann: string }) {
  return (
    <section style={karteStil}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={kartenTitel}>Bierdeckel</h2>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{wann}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bierdeckel.webp" alt="" width={88} height={88} style={{ width: 88, height: 88, borderRadius: '50%', flex: 'none', boxShadow: 'var(--sh-md)' }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>Stricheln geht erst am Tisch.</span>
          <span aria-disabled style={{ minHeight: 42, borderRadius: 12, border: '1.5px solid var(--ink-100)', color: 'var(--ink-300)', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="lock" size={15} />
            Deckel öffnen
          </span>
        </div>
      </div>
    </section>
  );
}

/** Das Wirtshaus vom Termin (Responsive 2a): Adresse, Bier, Route und Anrufen. */
function WirtshausKarte({ w, ort }: { w: { name: string; adresse: string | null; bezirk: string | null; biersorte: string; weissbier: string | null; telefon: string | null; lat: number | null; lng: number | null }; ort: string | null }) {
  const knopf: React.CSSProperties = { minHeight: 42, padding: '0 16px', borderRadius: 12, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontSize: 14, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' };
  const zeile: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: 'var(--ink-700)' };
  return (
    <section style={karteStil}>
      <h2 style={kartenTitel}>{w.name}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(w.adresse || w.bezirk) && <span style={zeile}><Icon name="pin" size={16} color="var(--gold-700)" />{w.adresse ?? w.bezirk}</span>}
        <span style={zeile}><Icon name="beer" size={16} color="var(--gold-700)" />{[w.biersorte, w.weissbier ? `Weißbier: ${w.weissbier}` : null].filter(Boolean).join(' · ')}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={navigationsUrl({ name: w.name, adresse: w.adresse, lat: w.lat, lng: w.lng }, ort)} target="_blank" rel="noopener noreferrer" className="wn-press" style={knopf}>
          <Icon name="navigation" size={16} />Route
        </a>
        {w.telefon && (
          <a href={`tel:${w.telefon.replace(/[^+\d]/g, '')}`} className="wn-press" style={knopf}>
            <Icon name="bell" size={16} />Anrufen
          </a>
        )}
      </div>
    </section>
  );
}

/** Kopf der Termin-Karte: Eyebrow, Fraktur-Titel, Unterzeile, rechts die runden Knöpfe. */
function HeroKopf({ eyebrow, titel, zeile, extra = null, rechts = null }: { eyebrow: string; titel: string; zeile: React.ReactNode; extra?: React.ReactNode; rechts?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <span style={eyebrowStil}>{eyebrow}</span>
        <h2 style={{ ...titelStil, fontSize: titel.length > 16 ? 30 : 38, overflowWrap: 'anywhere' }}>{titel}</h2>
        <span style={{ ...zeileStil, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>{zeile}</span>
        {extra && <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.6)' }}>{extra}</span>}
      </div>
      {rechts && <div style={{ display: 'flex', gap: 8, flex: 'none' }}>{rechts}</div>}
    </div>
  );
}

export default async function TerminPage({ searchParams }: { searchParams: Promise<{ deckel?: string; abgesagt?: string }> }) {
  const { deckel: deckelParam, abgesagt } = await searchParams;
  const abgesagtParam = abgesagt === '1';
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const config = tenantConfig();
  const termin = getAktuellerTermin();
  const mitglieder = getAktiveMitglieder();
  const jetzt = nowIso();
  const abend = termin ? bierdeckelOffen(termin, jetzt) : false;
  const stammhausId = config.typ === 'stammhaus' ? config.stammhausWirtshausId : null;
  const istStammhaus = (id: string | null | undefined) => !!stammhausId && id === stammhausId;

  // Chronik: die letzten 6 Abende (Stammhaus-Abende stehen ned drin, nur d’Ausflüge)
  const archivEintraege = ladeArchivEintraege(me.id);
  const chronik = getArchiv()
    .filter((a) => !istStammhaus(a.wirtshaus.id))
    .slice(0, 6)
    .flatMap((a) => {
      const e = archivEintraege.find((x) => x.besuchtAm && x.id === a.wirtshaus.id);
      return e ? [{ ...e, besuchtAm: datumKurz(a.termin.datum), rating: a.rating }] : [];
    });

  // Letzter Abend: a Woch’ lang eigene Striche und Wertung richten, Orga-Team trägt für alle nach
  const letzter = getLetzterAbgeschlossenerTermin();
  const nachtrag = letzter && nachtragsfristOffen(letzter.abgeschlossenAm) ? letzter : null;
  const nachtragWirtshaus = nachtrag ? getTerminMitWirtshaus(nachtrag).wirtshaus : null;
  const nachtragRestTage = nachtrag?.abgeschlossenAm
    ? Math.max(1, Math.ceil(7 - (Date.now() - new Date(nachtrag.abgeschlossenAm).getTime()) / 864e5))
    : 7;
  const besucheLetzter = nachtrag ? getBesucheFuerTermin(nachtrag.id) : [];
  const meinLetzter = besucheLetzter.find((b) => b.memberId === me.id);
  const darfNachtragen = me.role === 'admin' || me.id === getPraesidentId();
  const nachtragOrga = nachtrag && darfNachtragen
    ? {
        restTage: nachtragRestTage,
        schnapsAn: config.features.schnaps,
        mitglieder: mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein, zugesagt: false })),
        initial: nachtragInitial(nachtrag.id),
        action: besuchAbschliessen.bind(null, nachtrag.id),
      }
    : null;

  // Letzter Abend: solang’s Nachtrags-Fenster offen is und i dabei war (am Abend selber ned, da zählt der Deckel)
  const letzterAbend = nachtrag && meinLetzter?.anwesend && !abend ? (() => {
    const daten = bewertungsDaten(besucheLetzter, me.id);
    const stammhausAbend = istStammhaus(nachtragWirtshaus?.id);
    const bewertet = stammhausAbend ? daten.initial.kaisiProbiert || daten.initial.brodnGessen || !!daten.initial.kommentar : daten.initial.sterne != null;
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <HoamTitel action={<span style={bereichHinweisStil}>{nachtragWirtshaus?.name ?? 'Stammtisch'} · {datumKurz(nachtrag.datum)}</span>}>Letzter Abend</HoamTitel>
        <LetzterAbendKarte
          deckel={{
            zeile: `${meinLetzter.hoiben} Bier${config.features.schnaps ? ` · ${meinLetzter.schnaps} Schnaps` : ''}`,
            restTage: nachtragRestTage,
            inhalt: (
              <Bierdeckel
                terminId={nachtrag.id}
                biersorte={nachtragWirtshaus?.biersorte ?? null}
                initialHoiben={meinLetzter.hoiben}
                initialWeissbier={meinLetzter.weissbier}
                initialSchnaps={meinLetzter.schnaps}
                initialFlags={{ taxi: meinLetzter.taxi, brodn: meinLetzter.schweinsbraten > 0, kaisi: meinLetzter.kaiserschmarrn > 0, rundenBier: meinLetzter.rundenBier, rundenSchnaps: meinLetzter.rundenSchnaps, hoibenAusgegeben: meinLetzter.hoibenAusgegeben, schnapsAusgegeben: meinLetzter.schnapsAusgegeben }}
                schnapsAn={config.features.schnaps}
                rundenErlaubt={false}
                ausgegebenVon={ausgegebenVon(nachtrag.id, me.id)}
                spezln={[]}
                kopfKurz={`Deckel vom ${datumKurz(nachtrag.datum)}`}
                kopf={
                  <HeroKopf
                    eyebrow={`Dein Deckel vom ${datumKurz(nachtrag.datum)}`}
                    titel={nachtragWirtshaus?.name ?? 'Stammtisch'}
                    zeile={`Eigene Striche richten, noch ${nachtragRestTage} ${nachtragRestTage === 1 ? 'Tag' : 'Tage'}`}
                  />
                }
              />
            ),
          }}
          wertung={{
            zeile: bewertet
              ? stammhausAbend ? 'abgegeben' : `${dez(daten.initial.sterne ?? 0)} ★${daten.team.anzahl > 1 ? ` · Team Ø ${dez(daten.team.schnitt)}` : ''}`
              : `noch nicht bewertet${stammhausAbend ? '' : ` · +${PTS.bewertung} WP`}`,
            inhalt: (
              <MeiBewertung
                variante="abend"
                wirtshausName={null}
                initial={daten.initial}
                team={daten.team}
                action={meineBewertung.bind(null, nachtrag.id)}
                ohneSterne={stammhausAbend}
              />
            ),
          }}
        />
      </section>
    );
  })() : null;

  const chronikTeil = chronik.length > 0 ? (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HoamTitel action={<Link href="/karte" style={bereichHinweisStil}>alle im Archiv</Link>}>Chronik</HoamTitel>
      <ChronikListe eintraege={chronik} />
    </section>
  ) : null;

  // Letzter Abend und Chronik stehen ab Tablet links unten
  const unten = (
    <>
      {letzterAbend && <Platz n={50}>{letzterAbend}</Platz>}
      {chronikTeil && <Platz n={51}>{chronikTeil}</Platz>}
    </>
  );

  return (
    <div className="wn-eintritt wn-zwei wn-breit" style={{ padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {termin ? (
        <AktiverTermin terminId={termin.id} meId={me.id} isAdmin={me.role === 'admin'} nachtragOrga={nachtragOrga} deckelVoll={deckelParam === 'voll'} unten={unten} />
      ) : (
        <>
          <HeroKarte>
            <HeroKopf eyebrow="Nächster Stammtisch" titel="Noch nix ausgemacht" zeile={abgesagtParam ? 'Der letzte Termin ist abgesagt. Macht gleich einen neuen aus.' : 'Wer abgeschlossen hat, legt den nächsten Termin fest.'} />
          </HeroKarte>
          {abgesagtParam && (
            <div className="wn-toast-in wn-zwei-voll" style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center', background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)', fontSize: 13, fontWeight: 800, color: 'var(--erfolg)' }}>
              ✓ Abgesagt, alle bekommen Bescheid.
            </div>
          )}
          <div className="wn-spalte wn-spalte--l">
          <Platz n={1}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <HoamTitel>Neuer Termin</HoamTitel>
            <form action={neuerTermin} style={karteStil}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={feldLabelStil}>Datum</span>
                  <input type="date" name="datum" required style={feldStil} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={feldLabelStil}>Uhrzeit</span>
                  <input type="time" name="zeit" defaultValue="19:00" style={feldStil} />
                </label>
              </div>
              <button type="submit" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>Termin anlegen</button>
              <Hinweis>Alle bekommen Bescheid, den Organisator-Posten schnappt sich danach wer mag.</Hinweis>
            </form>
          </section>
          </Platz>
          {unten}
          </div>
          {nachtragOrga && (
            <div className="wn-spalte wn-spalte--r">
              <Platz n={2}><OrganisationKarte hint="Präsident · Admin" nachtrag={nachtragOrga} /></Platz>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Aktiver Termin: Phasen-Maschine ---------- */
async function AktiverTermin({
  terminId,
  meId,
  isAdmin,
  nachtragOrga,
  deckelVoll = false,
  unten = null,
}: {
  terminId: string;
  meId: string;
  isAdmin: boolean;
  nachtragOrga: React.ComponentProps<typeof OrganisationKarte>['nachtrag'];
  /** Vom Hoam-Deckel aus (/termin?deckel=voll): Deckel geht gleich im Vollbild auf */
  deckelVoll?: boolean;
  /** Letzter Abend und Chronik, ab Tablet links unten */
  unten?: React.ReactNode;
}) {
  const termin = getAktuellerTermin();
  if (!termin || termin.id !== terminId) return null;
  const { wirtshaus, planer } = getTerminMitWirtshaus(termin);
  const alleVotes = getVotesFuerTermin(termin.id);
  const mitglieder = getAktiveMitglieder();
  const meinVote = alleVotes.find((v) => v.vote.memberId === meId)?.vote.wert ?? null;
  const fristHinweis = absageHinweis(termin, alleVotes.find((v) => v.vote.memberId === meId)?.vote, getStats().find((s) => s.member.id === meId)?.unentschuldigtStreak ?? 0, nowIso());
  const voteVon = (id: string) => alleVotes.find((x) => x.vote.memberId === id)?.vote.wert;
  const spezl = (m: (typeof mitglieder)[number]): AbstimmSpezl => ({ name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein });
  const dabei = mitglieder.filter((m) => voteVon(m.id) === 'zu').map(spezl);
  const abgesagt = mitglieder.filter((m) => voteVon(m.id) === 'ab').map(spezl);
  const offen = mitglieder.filter((m) => { const v = voteVon(m.id); return v !== 'zu' && v !== 'ab'; }).map(spezl);
  // Verwalten (Wirtshaus festlegen/ändern, Anmeldung schließen): Organisator, aktueller Präsident oder Admin
  const darfVerwalten = isAdmin || termin.planerId === meId || meId === getPraesidentId();
  const config = tenantConfig();
  const stammhaus = config.typ === 'stammhaus' && config.stammhausWirtshausId ? getWirtshausById(config.stammhausWirtshausId) : null;
  const jetzt = nowIso();
  const heuteTag = termin.datum === berlinTag(jetzt);
  const planung = termin.phase === 'planung';
  const orgaFrei = planung && !termin.planerId;
  const ichPlane = !!planer && planer.id === meId;
  const planerName = planer ? anzeigeName(planer).split(' ')[0] : 'Der Organisator';
  const abend = bierdeckelOffen(termin, jetzt);
  const abschluss = abschlussOffen(termin, jetzt);

  const adresseZeile = wirtshaus ? (
    <>
      <Icon name="pin" size={15} />
      {[wirtshaus.adresse, wirtshaus.bezirk].filter(Boolean).join(' · ') || 'Adresse folgt'}
    </>
  ) : orgaFrei ? `Organisator gesucht · bis zu +${PTS.orgaMax} WP` : ichPlane ? 'Wirtshaus aussuchen und reservieren' : 'Wirtshaus wird gesucht';
  const titel = wirtshaus ? wirtshaus.name : orgaFrei ? 'Wer regelt’s?' : ichPlane ? 'Du regelst’s' : `${planerName} regelt’s`;
  const navi = wirtshaus && <RichtungsKnopf ziel={{ name: wirtshaus.name, adresse: wirtshaus.adresse, lat: wirtshaus.lat, lng: wirtshaus.lng }} style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.25)', color: 'var(--pergament)' }} />;
  const kalender = (
    <a href={`/termin/${termin.id}/ics`} aria-label="Termin im Kalender speichern" title="Im Kalender speichern" style={rundKnopfStil}>
      <Icon name="calendar-plus" size={20} />
    </a>
  );

  /* ---------- Am Abend: Wirtshaus und Deckel san oa Karte (1b) ---------- */
  if (abend) {
    const besucheLive = getBesucheFuerTermin(termin.id);
    const meinBesuch = besucheLive.find((b) => b.memberId === meId);
    const deckelSpezln: BierdeckelSpezl[] = besucheLive
      .filter((b) => b.anwesend && (b.hoiben > 0 || b.schnaps > 0) && b.memberId !== meId)
      .flatMap((b) => {
        const m = mitglieder.find((x) => x.id === b.memberId);
        return m ? [{ name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein, hoiben: b.hoiben, schnaps: b.schnaps, hoibenAusgegeben: b.hoibenAusgegeben }] : [];
      });
    const erster = getCheckinsFuerTermin(termin.id)[0] ?? null;
    const daten = bewertungsDaten(besucheLive, meId);
    const stammhausAbend = !!stammhaus && wirtshaus?.id === stammhaus.id;
    const naechster = termin.erfasstVon ? getNaechsterTermin(termin) : null;
    const erfasser = termin.erfasstVon ? mitglieder.find((m) => m.id === termin.erfasstVon) : null;
    const bewertet = stammhausAbend ? daten.initial.kaisiProbiert || daten.initial.brodnGessen || !!daten.initial.kommentar : daten.initial.sterne != null;

    return (
      <>
        <div className="wn-spalte wn-spalte--l">
        <Platz n={1}>
        <Bierdeckel
          terminId={termin.id}
          startVoll={deckelVoll}
          biersorte={wirtshaus?.biersorte ?? null}
          initialHoiben={meinBesuch?.hoiben ?? 0}
          initialWeissbier={meinBesuch?.weissbier ?? 0}
          initialSchnaps={meinBesuch?.schnaps ?? 0}
          initialFlags={{
            taxi: !!meinBesuch?.taxi,
            brodn: (meinBesuch?.schweinsbraten ?? 0) > 0,
            kaisi: (meinBesuch?.kaiserschmarrn ?? 0) > 0,
            rundenBier: meinBesuch?.rundenBier ?? 0,
            rundenSchnaps: meinBesuch?.rundenSchnaps ?? 0,
            hoibenAusgegeben: meinBesuch?.hoibenAusgegeben ?? 0,
            schnapsAusgegeben: meinBesuch?.schnapsAusgegeben ?? 0,
          }}
          schnapsAn={config.features.schnaps}
          ausgegebenVon={ausgegebenVon(termin.id, meId)}
          spezln={deckelSpezln}
          kopfKurz={`Heute · ${wirtshaus?.bezirk ?? wirtshaus?.name ?? 'Stammtisch'}`}
          kopf={
            <HeroKopf
              eyebrow={`${heuteTag ? 'Heute' : datumMittel(termin.datum)} · ${termin.zeit} Uhr`}
              titel={titel}
              zeile={adresseZeile}
              extra={`${dabei.length} dabei${erster ? ` · ${anzeigeName(erster.member).split(' ')[0]} sitzt ${erster.checkin.platz ?? 'scho am Tisch'}` : ''}`}
              rechts={navi}
            />
          }
        />
        </Platz>
        {unten}
        </div>

        <div className="wn-spalte wn-spalte--r">
        {/* Mei Wertung, jeder für sich, scho am Abend (bis 7 Tag nach’m Abschluss) */}
        <Platz n={2}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={bereichHinweisStil}>{bewertet ? '✓ abgegeben' : stammhausAbend ? 'Brodn? Schmarrn?' : 'jeder für sich'}</span>}>Deine Wertung</HoamTitel>
          <MeiBewertung variante="abend" wirtshausName={null} initial={daten.initial} team={daten.team} action={meineBewertung.bind(null, termin.id)} ohneSterne={stammhausAbend} />
        </section>
        </Platz>

        {/* Anmeldung no offen (Uhrzeit is rum, aber koaner hat gschlossen): Zeile mit Abstimmung drunter */}
        {termin.phase === 'reserviert' && (
          <Platz n={3}>
          <WerKommtKarte anzahl={dabei.length}>
            <AbstimmungKarte terminId={termin.id} terminDatum={termin.datum} meinVote={meinVote} dabei={dabei} offen={offen} abgesagt={abgesagt} fristHinweis={fristHinweis} />
            {darfVerwalten && heuteTag && (
              <form action={phaseSetzen.bind(null, termin.id, 'heute')}>
                <button type="submit" className="wn-press" style={{ width: '100%', minHeight: 48, borderRadius: 'var(--r-md)', border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                  Anmeldung schließen
                </button>
              </form>
            )}
          </WerKommtKarte>
          </Platz>
        )}

        {/* Wer war da + nächster Termin: die eine Hauptaktion, frühestens 2 Stunden nach Beginn.
            Der Abend bleibt dabei offen, er schließt sich um 3 Uhr früh von allein. */}
        <div style={{ order: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {termin.erfasstVon ? (
            <>
              <div style={{ ...karteStil, gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>Nächster Stammtisch</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)' }}>
                  {naechster ? `${datumMittel(naechster.datum)} · ${naechster.zeit} Uhr` : 'Noch kein Termin'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>
                  {naechster ? 'Ausgemacht' : '„Wer war da“ abgehakt'} von {erfasser ? anzeigeName(erfasser).split(' ')[0] : 'einem Spezl'}.{naechster ? ' Zu- und absagen geht, sobald der heutige Abend zu ist.' : ''}
                </span>
              </div>
              <Link href="/termin/abschluss" className="wn-press" style={{ minHeight: 48, borderRadius: 'var(--r-md)', border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                <Icon name="users" size={18} />
                Wer war da ändern
              </Link>
              <Hinweis>Bis {Number(ABEND_ENDE_UHRZEIT.slice(0, 2))} Uhr früh kann jeder noch stricheln und „Wer war da“ ändern. Dann ist der Abend zu und Punkte und Strafen werden verbucht.</Hinweis>
            </>
          ) : abschluss ? (
            <>
              <Link href="/termin/abschluss" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>
                <Icon name="calendar-plus" size={20} />
                Nächsten Termin ausmachen · +{PTS.terminAusmachen} WP
              </Link>
              <Hinweis>Nur „Wer war da“ und das Datum, bewerten geht extra. Der Erste bekommt die Punkte, der Deckel bleibt offen bis {ABEND_ENDE_UHRZEIT} Uhr.</Hinweis>
            </>
          ) : (
            <>
              <div style={{ minHeight: 52, borderRadius: 'var(--r-md)', background: 'var(--ink-100)', color: 'var(--ink-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 800 }}>
                <Icon name="lock" size={20} />
                Nächsten Termin ausmachen
              </div>
              <Hinweis>Geht ab {abschlussAb(termin)} Uhr.</Hinweis>
            </>
          )}
        </div>
        </div>
      </>
    );
  }

  /* ---------- Vorher: Termin-Karte, Reservieren, Abstimmung, Organisation (1a, 2b–2e) ---------- */
  const offene = getOffeneWirtshaeuser();
  const gesperrt = getLetzterAbgeschlossenerTermin()?.planerId === meId;
  const stimmeHint = meinVote === 'zu' ? 'du bist dabei' : meinVote === 'ab' ? 'du hast abgesagt' : 'noch nicht abgestimmt';
  const orgaRollen = [planer ? planerName : null, 'Präsident', 'Admin'].filter(Boolean).join(' · ');
  const anmeldungSchliessen = darfVerwalten && termin.phase === 'reserviert' && heuteTag ? phaseSetzen.bind(null, termin.id, 'heute') : null;
  const verschieben = darfVerwalten && !termin.erfasstVon
    ? { action: terminVerschieben.bind(null, termin.id), datum: termin.datum, zeit: termin.zeit, heute: berlinTag(nowIso()) }
    : null;
  // Absagen nur Präsident und Admin, ned der Organisator allein (WIR-007)
  const absagen = (isAdmin || meId === getPraesidentId()) && !termin.erfasstVon ? terminAbsagen.bind(null, termin.id) : null;
  const reservierung = termin.phase === 'reserviert' && darfVerwalten && wirtshaus
    ? { action: wirtshausFestlegen.bind(null, termin.id), bekannte: getBekannteWirtshaeuser(), aktuell: { name: wirtshaus.name, bezirk: wirtshaus.bezirk } }
    : null;

  const ort = config.geo?.suchSuffix ?? null;
  const deckelWann = `${heuteTag ? 'heute' : datumMittel(termin.datum)} ab ${termin.zeit} Uhr`;

  return (
    <>
      <HeroKarte bild={wirtshaus?.photoUrl ?? null}>
        <HeroKopf
          eyebrow={`${heuteTag ? 'Heute' : datumMittel(termin.datum)} · ${termin.zeit} Uhr`}
          titel={titel}
          zeile={adresseZeile}
          rechts={<>{kalender}{navi}</>}
        />
        {orgaFrei && !gesperrt && (
          <OrgaKnopf action={orgaSchnappen.bind(null, termin.id)} gesperrt={false} label="Ich übernehm’s" icon={<Icon name="hand" size={20} />} />
        )}
      </HeroKarte>

      <div className="wn-spalte wn-spalte--l">
      {/* Reservieren: die eigene Aufgabe direkt unter der Karte (2c) */}
      {planung && termin.planerId && darfVerwalten && (
        <Platz n={2}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={bereichHinweisStil}>{ichPlane ? 'deine Aufgabe' : 'Orga-Team'}</span>}>Reservieren</HoamTitel>
          {stammhaus ? (
            <>
              <form action={wirtshausFestlegen.bind(null, termin.id)} style={karteStil}>
                <input type="hidden" name="vorhandenesWirtshausId" value={stammhaus.id} />
                <button type="submit" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>Wia immer im {stammhaus.name}</button>
                <Hinweis>Alle bekommen Push und Mail.</Hinweis>
              </form>
              <details style={{ background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden' }}>
                <KlappenKopf icon={<Icon name="pin-plus" size={20} />}>Ausflug: heit amoi wo anders</KlappenKopf>
                <div style={{ padding: '4px 18px 18px' }}>
                  <form action={wirtshausFestlegen.bind(null, termin.id)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <WirtshausSuche bekannte={getBekannteWirtshaeuser()} />
                    <button type="submit" className="wn-press" style={{ minHeight: 48, borderRadius: 'var(--r-md)', border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                      Ausflug eintragen
                    </button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <div style={karteStil}>
              {offene.length > 0 && (
                <div>
                  {offene.map(({ wirtshaus: w, finder }, i) => (
                    <form key={w.id} action={wirtshausFestlegen.bind(null, termin.id)}>
                      <input type="hidden" name="vorhandenesWirtshausId" value={w.id} />
                      <Zeile
                        submit
                        kachel={<Kachel ton="gold"><Icon name="pin" size={19} /></Kachel>}
                        titel={w.name}
                        untertitel={finder ? `vorgeschlagen von ${anzeigeName(finder).split(' ')[0]}` : (w.bezirk ?? 'auf der Karte')}
                        chip={<Chip ton="gold">wählen</Chip>}
                        pfeil={false}
                        letzte={i === offene.length - 1}
                      />
                    </form>
                  ))}
                </div>
              )}
              <form action={wirtshausFestlegen.bind(null, termin.id)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <WirtshausSuche bekannte={getBekannteWirtshaeuser()} label={offene.length > 0 ? 'Oder neu suchen' : 'Wirtshaus suchen'} />
                <button type="submit" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>Reservierung eintragen</button>
                <Hinweis>Alle bekommen Push und Mail.</Hinweis>
              </form>
            </div>
          )}
        </section>
        </Platz>
      )}

      {/* Abstimmung: sobald wer organisiert (geht scho vor der Reservierung) */}
      {!orgaFrei && (
        <Platz n={3}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={bereichHinweisStil}>{stimmeHint}</span>}>Abstimmung</HoamTitel>
          <AbstimmungKarte terminId={termin.id} terminDatum={termin.datum} meinVote={meinVote} dabei={dabei} offen={offen} abgesagt={abgesagt} fristHinweis={fristHinweis} />
        </section>
        </Platz>
      )}
      {unten}
      </div>

      <div className="wn-spalte wn-spalte--r">
      {orgaFrei && gesperrt && (
        <Platz n={1}>
        <ZeilenKarte>
          <Zeile kachel={<Kachel ton="grau"><Icon name="lock" size={19} /></Kachel>} titel="Diesmal nicht du" untertitel="Du hast den letzten Abend organisiert" pfeil={false} letzte />
        </ZeilenKarte>
        </Platz>
      )}

      <Platz n={4}>
        <OrganisationKarte hint={orgaRollen} anmeldungSchliessen={anmeldungSchliessen} reservierung={reservierung} verschieben={verschieben} absagen={absagen} nachtrag={nachtragOrga} />
      </Platz>
      {/* Nur breit: Deckel-Vorschau und das Wirtshaus (Responsive 2a) */}
      <div className="wn-nur-breit" style={{ order: 5 }}>
        <DeckelVorschau wann={deckelWann} />
      </div>
      {wirtshaus && (
        <div className="wn-nur-breit" style={{ order: 6 }}>
          <WirtshausKarte w={wirtshaus} ort={ort} />
        </div>
      )}
      </div>
    </>
  );
}

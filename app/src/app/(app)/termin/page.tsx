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
} from '@/lib/queries';
import { datumMittel, datumKurz } from '@/lib/format';
import { PTS, berlinTag, bierdeckelOffen, abschlussOffen, abschlussAb } from '@/lib/punkte';
import { nowIso } from '@/lib/ids';
import { Card, Icon, Chip, Kachel, Zeile, ZeilenKarte, KlappenKopf } from '@/components/ds';
import { neuerTermin, wirtshausFestlegen, phaseSetzen, besuchAbschliessen, meineBewertung, orgaSchnappen } from './actions';
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

/** Navy-Gold-Karte: Rautenband oben, Inhalt mit 14er Abstand. */
function HeroKarte({ children }: { children: React.ReactNode }) {
  return (
    <Card tone="dark" framed pad={0} style={{ overflow: 'hidden', boxShadow: 'var(--sh-lg)' }}>
      <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
      <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </Card>
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

export default async function TerminPage({ searchParams }: { searchParams: Promise<{ deckel?: string }> }) {
  const { deckel: deckelParam } = await searchParams;
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

  return (
    <div className="wn-eintritt" style={{ padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {termin ? (
        <AktiverTermin terminId={termin.id} meId={me.id} isAdmin={me.role === 'admin'} nachtragOrga={nachtragOrga} deckelVoll={deckelParam === 'voll'} />
      ) : (
        <>
          <HeroKarte>
            <HeroKopf eyebrow="Nächster Stammtisch" titel="Noch nix ausgemacht" zeile="Wer abgeschlossen hat, legt den nächsten Termin fest." />
          </HeroKarte>
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
          {nachtragOrga && <OrganisationKarte hint="Präsident · Admin" nachtrag={nachtragOrga} />}
        </>
      )}

      {/* Letzter Abend: solang’s Nachtrags-Fenster offen is und i dabei war (am Abend selber ned, da zählt der Deckel) */}
      {nachtrag && meinLetzter?.anwesend && !abend && (() => {
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
                    initialFlags={{ taxi: meinLetzter.taxi, brodn: meinLetzter.schweinsbraten > 0, kaisi: meinLetzter.kaiserschmarrn > 0, rundenBier: meinLetzter.rundenBier, rundenSchnaps: meinLetzter.rundenSchnaps }}
                    schnapsAn={config.features.schnaps}
                    rundenErlaubt={false}
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
      })()}

      {chronik.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<Link href="/karte" style={bereichHinweisStil}>alle im Archiv</Link>}>Chronik</HoamTitel>
          <ChronikListe eintraege={chronik} />
        </section>
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
}: {
  terminId: string;
  meId: string;
  isAdmin: boolean;
  nachtragOrga: React.ComponentProps<typeof OrganisationKarte>['nachtrag'];
  /** Vom Hoam-Deckel aus (/termin?deckel=voll): Deckel geht gleich im Vollbild auf */
  deckelVoll?: boolean;
}) {
  const termin = getAktuellerTermin();
  if (!termin || termin.id !== terminId) return null;
  const { wirtshaus, planer } = getTerminMitWirtshaus(termin);
  const alleVotes = getVotesFuerTermin(termin.id);
  const mitglieder = getAktiveMitglieder();
  const meinVote = alleVotes.find((v) => v.vote.memberId === meId)?.vote.wert ?? null;
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
        return m ? [{ name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein, hoiben: b.hoiben, schnaps: b.schnaps }] : [];
      });
    const erster = getCheckinsFuerTermin(termin.id)[0] ?? null;
    const daten = bewertungsDaten(besucheLive, meId);
    const stammhausAbend = !!stammhaus && wirtshaus?.id === stammhaus.id;
    const bewertet = stammhausAbend ? daten.initial.kaisiProbiert || daten.initial.brodnGessen || !!daten.initial.kommentar : daten.initial.sterne != null;

    return (
      <>
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
          }}
          schnapsAn={config.features.schnaps}
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

        {/* Mei Wertung, jeder für sich, scho am Abend (bis 7 Tag nach’m Abschluss) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={bereichHinweisStil}>{bewertet ? '✓ abgegeben' : stammhausAbend ? 'Brodn? Schmarrn?' : `+${PTS.bewertung} WP`}</span>}>Deine Wertung</HoamTitel>
          <MeiBewertung variante="abend" wirtshausName={null} initial={daten.initial} team={daten.team} action={meineBewertung.bind(null, termin.id)} ohneSterne={stammhausAbend} />
        </section>

        {/* Anmeldung no offen (Uhrzeit is rum, aber koaner hat gschlossen): Zeile mit Abstimmung drunter */}
        {termin.phase === 'reserviert' && (
          <WerKommtKarte anzahl={dabei.length}>
            <AbstimmungKarte terminId={termin.id} terminDatum={termin.datum} meinVote={meinVote} dabei={dabei} offen={offen} abgesagt={abgesagt} />
            {darfVerwalten && heuteTag && (
              <form action={phaseSetzen.bind(null, termin.id, 'heute')}>
                <button type="submit" className="wn-press" style={{ width: '100%', minHeight: 48, borderRadius: 'var(--r-md)', border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                  Anmeldung schließen
                </button>
              </form>
            )}
          </WerKommtKarte>
        )}

        {/* Zapfenstreich: die eine Hauptaktion, frühestens 2 Stunden nach Beginn (2h: gesperrt) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {abschluss ? (
            <>
              <Link href="/termin/abschluss" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>
                <Icon name="check-circle" size={20} />
                Abend abschließen · +{PTS.abschluss} WP
              </Link>
              <Hinweis>Der Erste bekommt die Punkte. Bis 7 Tage danach kann nachgetragen werden.</Hinweis>
            </>
          ) : (
            <>
              <div style={{ minHeight: 52, borderRadius: 'var(--r-md)', background: 'var(--ink-100)', color: 'var(--ink-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 800 }}>
                <Icon name="lock" size={20} />
                Abend abschließen
              </div>
              <Hinweis>Abschließen geht ab {abschlussAb(termin)} Uhr.</Hinweis>
            </>
          )}
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
  const reservierung = termin.phase === 'reserviert' && darfVerwalten && wirtshaus
    ? { action: wirtshausFestlegen.bind(null, termin.id), bekannte: getBekannteWirtshaeuser(), aktuell: { name: wirtshaus.name, bezirk: wirtshaus.bezirk } }
    : null;

  return (
    <>
      <HeroKarte>
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

      {orgaFrei && gesperrt && (
        <ZeilenKarte>
          <Zeile kachel={<Kachel ton="grau"><Icon name="lock" size={19} /></Kachel>} titel="Diesmal nicht du" untertitel="Du hast den letzten Abend organisiert" pfeil={false} letzte />
        </ZeilenKarte>
      )}

      {/* Reservieren: die eigene Aufgabe direkt unter der Karte (2c) */}
      {planung && termin.planerId && darfVerwalten && (
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
      )}

      {/* Abstimmung: sobald wer organisiert (geht scho vor der Reservierung) */}
      {!orgaFrei && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={bereichHinweisStil}>{stimmeHint}</span>}>Abstimmung</HoamTitel>
          <AbstimmungKarte terminId={termin.id} terminDatum={termin.datum} meinVote={meinVote} dabei={dabei} offen={offen} abgesagt={abgesagt} />
        </section>
      )}

      <OrganisationKarte hint={orgaRollen} anmeldungSchliessen={anmeldungSchliessen} reservierung={reservierung} nachtrag={nachtragOrga} />
    </>
  );
}

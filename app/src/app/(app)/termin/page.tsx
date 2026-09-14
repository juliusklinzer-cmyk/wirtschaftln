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
} from '@/lib/queries';
import { datumLang, datumKurz } from '@/lib/format';
import { PTS, berlinTag, bierdeckelOffen, abschlussOffen, abschlussAb } from '@/lib/punkte';
import { nowIso } from '@/lib/ids';
import { Card, SectionHeader, Avatar, Badge, Button, Input, Icon, KlappenKopf } from '@/components/ds';
import { VotePills } from '@/components/domain/VotePills';
import { neuerTermin, wirtshausFestlegen, phaseSetzen, besuchAbschliessen, meineBewertung, orgaSchnappen } from './actions';
import { OrgaSchnappen } from './orga-schnappen';
import { AbschlussForm, type AbschlussWerte } from './abschluss-form';
import { NachtragKlappe } from './nachtrag-klappe';
import { MeiBewertung } from '@/components/domain/MeiBewertung';
import { bewertungsDaten } from '@/lib/bewertungs-daten';
import { ReservierungAendern } from './reservierung-aendern';
import { ChronikListe } from '@/components/domain/ChronikListe';
import { ladeArchivEintraege } from '@/lib/archiv-eintraege';
import { WirtshausSuche } from '@/components/domain/WirtshausSuche';
import { Bierdeckel, type BierdeckelSpezl } from '@/components/domain/Bierdeckel';
import { tenantConfig } from '@/lib/tenant-config';

/**
 * Vorbelegung des Abschluss-Zettels am Abend selbst: Zugesagte stehen auf der
 * Liste, und wer am Bierdeckel gstrichelt hat, bringt seine Hoiben (und wer
 * über den Deckel dazukam, seine Anwesenheit) schon mit.
 */
function abschlussVorbelegung(
  besucheLive: ReturnType<typeof getBesucheFuerTermin>,
  zugesagtIds: string[],
  wirtshaus: { biersorte: string; weissbier: string | null } | null,
): AbschlussWerte {
  const rows: NonNullable<AbschlussWerte>['rows'] = {};
  for (const id of zugesagtIds) rows[id] = { hoiben: 0, schnaps: 0, brodn: false, taxi: false, runde: false, abgsagt: false };
  for (const b of besucheLive) {
    if (!b.anwesend) continue;
    rows[b.memberId] = { hoiben: b.hoiben, schnaps: b.schnaps, brodn: b.schweinsbraten > 0, taxi: b.taxi, runde: b.rundenBier + b.rundenSchnaps > 0, abgsagt: false };
  }
  return {
    rows,
    kaisiBestellt: besucheLive.some((b) => b.kaiserschmarrn > 0),
    biersorte: wirtshaus?.biersorte ?? 'Augustiner',
    weissbier: wirtshaus?.weissbier ?? '',
  };
}

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

/** Eine Hinweiszeile, dezent, zentriert (die einzige Art Erklärtext auf dieser Seite). */
function Hinweis({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', padding: '2px 8px' }}>
      {children}
    </div>
  );
}

const klappeStil: React.CSSProperties = {
  background: 'var(--weiss)', border: '1px solid var(--ink-100)',
  borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
};

export default async function TerminPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const termin = getAktuellerTermin();
  const mitglieder = getAktiveMitglieder();
  // Chronik: die letzten 6 Abende, je Abend eine Zeile mit Datum und Tages-Wertung
  // (Antippen öffnet das Wirtshaus-Detail wie im Archiv; beim Stammhaus is es
  // sechsmal dasselbe Wirtshaus, aber sechs verschiedene Abende)
  const archivEintraege = ladeArchivEintraege(me.id);
  const chronik = getArchiv()
    .slice(0, 6)
    .flatMap((a) => {
      const e = archivEintraege.find((x) => x.besuchtAm && x.id === a.wirtshaus.id);
      return e ? [{ ...e, besuchtAm: datumKurz(a.termin.datum), rating: a.rating }] : [];
    });
  const letzter = getLetzterAbgeschlossenerTermin();
  const nachtrag = letzter && nachtragsfristOffen(letzter.abgeschlossenAm) ? letzter : null;
  const nachtragWirtshaus = nachtrag ? getTerminMitWirtshaus(nachtrag).wirtshaus : null;
  // Restlaufzeit der 7-Tage-Frist (aufgerundet, mind. 1)
  const nachtragRestTage = nachtrag?.abgeschlossenAm
    ? Math.max(1, Math.ceil(7 - (Date.now() - new Date(nachtrag.abgeschlossenAm).getTime()) / 864e5))
    : 7;

  return (
    <div className="wn-eintritt" style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!termin && <NeuerTerminForm />}
      {termin && <AktiverTermin terminId={termin.id} meId={me.id} isAdmin={me.role === 'admin'} />}

      {nachtrag && (() => {
        const daten = bewertungsDaten(getBesucheFuerTermin(nachtrag.id), me.id);
        return (
          <>
            <SectionHeader eyebrow="Letzter Abend" title={`${nachtragWirtshaus?.name ?? 'Stammtisch'} · ${datumKurz(nachtrag.datum)}`} />
            {/* Mei Bewertung zum letzten Besuch, nur wer dabei war, derf werten */}
            {daten.mein?.anwesend && (
              <MeiBewertung
                wirtshausName={null}
                initial={daten.initial}
                team={daten.team}
                action={meineBewertung.bind(null, nachtrag.id)}
              />
            )}
            <NachtragKlappe
              schnapsAn={tenantConfig().features.schnaps}
              titel={`Nachtragen · no ${nachtragRestTage} ${nachtragRestTage === 1 ? 'Tag' : 'Tag’'}`}
              mitglieder={mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein, zugesagt: false }))}
              action={besuchAbschliessen.bind(null, nachtrag.id)}
              initial={nachtragInitial(nachtrag.id)}
            />
          </>
        );
      })()}

      {chronik.length > 0 && (
        <>
          <SectionHeader eyebrow="Chronik" title="G’wesen samma" fraktur />
          <ChronikListe eintraege={chronik} />
        </>
      )}
    </div>
  );
}

/* ---------- Kein aktiver Termin: neuen anlegen (typisch: der Abschließer) ---------- */
function NeuerTerminForm() {
  return (
    <>
      <SectionHeader eyebrow="Auf geht’s" title="Neuer Termin" />
      <Card>
        <form action={neuerTermin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Datum" name="datum" type="date" required />
          <Input label="Uhrzeit" name="zeit" type="time" defaultValue="19:00" />
          <Button type="submit" fullWidth>
            Termin anlegen
          </Button>
          <Hinweis>Alle Spezln kriegen Bescheid, den Organisator-Posten schnappt sich danach wer mag.</Hinweis>
        </form>
      </Card>
    </>
  );
}

/* ---------- Aktiver Termin: Phasen-Maschine ---------- */
async function AktiverTermin({ terminId, meId, isAdmin }: { terminId: string; meId: string; isAdmin: boolean }) {
  const termin = getAktuellerTermin();
  if (!termin || termin.id !== terminId) return null;
  const { wirtshaus, planer } = getTerminMitWirtshaus(termin);
  const alleVotes = getVotesFuerTermin(termin.id);
  const mitglieder = getAktiveMitglieder();
  const offene = getOffeneWirtshaeuser();
  const meinVote = alleVotes.find((v) => v.vote.memberId === meId)?.vote.wert ?? null;
  const voteVon = (id: string) => alleVotes.find((x) => x.vote.memberId === id)?.vote.wert;
  const zugesagt = mitglieder.filter((m) => voteVon(m.id) === 'zu');
  // Verwalten (Wirtshaus festlegen/ändern, Anmeldung schließen):
  // Organisator, aktueller Präsident oder Admin
  const darfVerwalten = isAdmin || termin.planerId === meId || meId === getPraesidentId();
  // Stammhaus-Typ: das Stammhaus is der Default, Reservieren is a Ein-Tap-Bestätigung
  const config = tenantConfig();
  const stammhaus = config.typ === 'stammhaus' && config.stammhausWirtshausId ? getWirtshausById(config.stammhausWirtshausId) : null;
  const jetzt = nowIso();
  const heuteTag = termin.datum === berlinTag(jetzt);

  // Abend-Modus: ab Termin-Uhrzeit am Tag selbst (oder sobald d'Anmeldung
  // gschlossen is) bis zum Abschluss. Dann is der Deckel das Wichtigste.
  const abend = bierdeckelOffen(termin, jetzt);
  const besucheLive = abend ? getBesucheFuerTermin(termin.id) : [];
  const meinBesuch = besucheLive.find((b) => b.memberId === meId);
  const deckelSpezln: BierdeckelSpezl[] = besucheLive
    .filter((b) => b.anwesend && (b.hoiben > 0 || b.schnaps > 0) && b.memberId !== meId)
    .flatMap((b) => {
      const m = mitglieder.find((x) => x.id === b.memberId);
      return m ? [{ name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein, hoiben: b.hoiben, schnaps: b.schnaps }] : [];
    });

  const phasenLabel = {
    planung: 'In Planung',
    reserviert: abend ? 'Heut’ is’ Stammtisch' : 'Reserviert',
    heute: 'Heut’ is’ Stammtisch',
    abgeschlossen: 'Abgeschlossen',
  }[termin.phase];

  const naviUrl = wirtshaus
    ? wirtshaus.lat != null && wirtshaus.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${wirtshaus.lat},${wirtshaus.lng}`
      : wirtshaus.adresse
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${wirtshaus.name}, ${wirtshaus.adresse}`)}`
        : null
    : null;

  const abstimmungsListe = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Man selbst immer oben, danach: Zugesagt → Vielleicht → Ausstehend → Abgesagt */}
      {[...mitglieder]
        .sort((a, b) => {
          if (a.id === meId) return -1;
          if (b.id === meId) return 1;
          const prio = (id: string) => {
            const w = voteVon(id);
            return w === 'zu' ? 0 : w === 'vielleicht' ? 1 : !w ? 2 : 3;
          };
          return prio(a.id) - prio(b.id);
        })
        .map((m) => {
          const v = voteVon(m.id);
          const label = v === 'zu' ? 'Zugesagt' : v === 'vielleicht' ? 'Vielleicht' : v === 'ab' ? 'Abgesagt' : 'Keine Antwort';
          const tone = v === 'zu' ? 'erfolg' : v === 'vielleicht' ? 'warnung' : v === 'ab' ? 'strafe' : 'neutral';
          const ich = m.id === meId;
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: ich ? '6px 8px' : 0, background: ich ? 'var(--info-bg)' : 'transparent', borderRadius: ich ? 'var(--r-sm)' : 0 }}>
              <Avatar src={m.photoUrl} name={m.name} size={32} present={v === 'zu'} verein={m.verein} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {anzeigeName(m)}
              </span>
              <Badge tone={tone as 'erfolg' | 'warnung' | 'strafe' | 'neutral'}>{label}</Badge>
            </div>
          );
        })}
    </div>
  );

  const anmeldungSchliessen = darfVerwalten && termin.phase === 'reserviert' && heuteTag && (
    <form action={phaseSetzen.bind(null, termin.id, 'heute')}>
      <Button type="submit" fullWidth variant="secondary">
        Anmeldung schließen
      </Button>
    </form>
  );

  return (
    <>
      {/* Kopfkarte: Datum, Phase, Wirtshaus, Adresse, Kalender + Navigation */}
      <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div className="wn-eyebrow" style={{ color: 'var(--gold)' }}>{datumLang(termin.datum)} · {termin.zeit} Uhr</div>
            <Badge tone={abend ? 'gold' : 'blau'} solid>
              {phasenLabel}
            </Badge>
          </div>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, color: 'var(--pergament)', margin: '8px 0 2px' }}>
            {wirtshaus ? wirtshaus.name : planer ? `${anzeigeName(planer)} reglt’s` : 'Wer reglt’s?'}
          </div>
          {wirtshaus?.adresse && (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(246,240,226,0.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="pin" size={14} /> {wirtshaus.adresse}
            </div>
          )}
          {wirtshaus && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {!abend && (
                <a href={`/termin/${termin.id}/ics`} style={kopfLinkStil}>
                  <Icon name="calendar" size={15} /> Kalender
                </a>
              )}
              {naviUrl && (
                <a href={naviUrl} target="_blank" rel="noopener noreferrer" style={kopfLinkStil}>
                  <Icon name="richtung" size={15} /> Hinfahren
                </a>
              )}
            </div>
          )}
        </div>
      </Card>

      {abend ? (
        /* ---------- Abend: Deckel, Marken, Bewertung, Tisch, Abschluss ---------- */
        <>
          <SectionHeader eyebrow="Heit am Tisch" title="Dei Bierdeckel" fraktur />
          <Bierdeckel
            terminId={termin.id}
            biersorte={wirtshaus?.biersorte ?? null}
            initialHoiben={meinBesuch?.hoiben ?? 0}
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
          />

          {/* Mei Bewertung, jeder für sich, scho am Abend (bis 7 Tag nach’m Abschluss) */}
          {(() => {
            const daten = bewertungsDaten(besucheLive, meId);
            return (
              <MeiBewertung
                wirtshausName={null}
                initial={daten.initial}
                team={daten.team}
                action={meineBewertung.bind(null, termin.id)}
              />
            );
          })()}

          {/* Anmeldung no offen (Uhrzeit is rum, aber koaner hat gschlossen): Liste als Klappe */}
          {termin.phase === 'reserviert' && (
            <>
              <details style={klappeStil}>
                <KlappenKopf chip={<Badge tone="erfolg">{zugesagt.length} zugesagt</Badge>}>Wer kommt?</KlappenKopf>
                <div style={{ padding: '4px 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <VotePills terminId={termin.id} current={meinVote} terminDatum={termin.datum} />
                  {abstimmungsListe}
                </div>
              </details>
              {anmeldungSchliessen}
            </>
          )}

          {/* Zapfenstreich: Logistik abschließen (darf jeder, der Erste kriegt WP),
              frühestens 2 Stunden nach Beginn, damit koaner mittendrin zuamacht. */}
          {abschlussOffen(termin, jetzt) ? (
            <details style={klappeStil}>
              <KlappenKopf chip={<span className="wn-tnum" style={{ flex: 'none', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'var(--grad-gold)', color: 'var(--navy-900)' }}>+{PTS.abschluss} WP</span>}>
                Besuch abschließen
              </KlappenKopf>
              <div style={{ padding: '4px 18px 18px' }}>
                <AbschlussForm
                  mitglieder={mitglieder.map((m) => ({
                    id: m.id,
                    name: anzeigeName(m),
                    photoUrl: m.photoUrl,
                    verein: m.verein,
                    zugesagt: voteVon(m.id) === 'zu',
                  }))}
                  action={besuchAbschliessen.bind(null, termin.id)}
                  schnapsAn={config.features.schnaps}
                  naechsterTermin={!termin.abgeschlossenVon}
                  bewertung={{ memberId: meId, werte: bewertungsDaten(besucheLive, meId).initial }}
                  initial={abschlussVorbelegung(besucheLive, zugesagt.map((m) => m.id), wirtshaus)}
                />
              </div>
            </details>
          ) : (
            <Hinweis>Abschließen geht ab {abschlussAb(termin)} Uhr.</Hinweis>
          )}
        </>
      ) : (
        /* ---------- Vorher: Orga, Reservierung, Abstimmung ---------- */
        <>
          {termin.phase === 'planung' && !termin.planerId && (
            <OrgaSchnappen
              action={orgaSchnappen.bind(null, termin.id)}
              gesperrt={getLetzterAbgeschlossenerTermin()?.planerId === meId}
            />
          )}

          {termin.phase === 'planung' && termin.planerId && (
            darfVerwalten ? (
              <>
                <SectionHeader eyebrow="Dei Aufgabe" title="Reservieren" />
                {stammhaus ? (
                  <>
                    <Card>
                      <form action={wirtshausFestlegen.bind(null, termin.id)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input type="hidden" name="vorhandenesWirtshausId" value={stammhaus.id} />
                        <Button type="submit" fullWidth variant="gold">
                          Wia immer im {stammhaus.name}
                        </Button>
                        <Hinweis>Alle Spezln kriegen a Push und a Mail.</Hinweis>
                      </form>
                    </Card>
                    <details style={klappeStil}>
                      <KlappenKopf>Ausflug: heit amoi wo anders</KlappenKopf>
                      <div style={{ padding: '4px 18px 18px' }}>
                        <form action={wirtshausFestlegen.bind(null, termin.id)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <WirtshausSuche bekannte={getBekannteWirtshaeuser()} />
                          <Button type="submit" fullWidth variant="secondary">
                            Ausflug eintragen
                          </Button>
                        </form>
                      </div>
                    </details>
                  </>
                ) : (
                  <Card>
                    <form action={wirtshausFestlegen.bind(null, termin.id)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {offene.length > 0 && (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
                              Offen auf der Karte
                            </label>
                            <select
                              name="vorhandenesWirtshausId"
                              defaultValue=""
                              style={{
                                width: '100%', padding: '12px 14px', border: '1.5px solid var(--ink-200)',
                                borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 15,
                                fontWeight: 500, color: 'var(--ink-900)', background: 'var(--weiss)',
                              }}
                            >
                              <option value="">Neues Wirtshaus suchen…</option>
                              {offene.map(({ wirtshaus: w, finder }) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                  {w.bezirk ? ` (${w.bezirk})` : ''}
                                  {finder ? ` · gfunden von ${anzeigeName(finder)}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-300)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            oder
                          </div>
                        </>
                      )}
                      <WirtshausSuche bekannte={getBekannteWirtshaeuser()} />
                      <Button type="submit" fullWidth variant="gold">
                        Reservierung eintragen
                      </Button>
                      <Hinweis>Alle Spezln kriegen a Push und a Mail.</Hinweis>
                    </form>
                  </Card>
                )}
              </>
            ) : (
              <Hinweis>{planer ? anzeigeName(planer) : 'Der Organisator'} suacht’s Wirtshaus aus.</Hinweis>
            )
          )}

          {/* Abstimmung (planung + reserviert) */}
          <SectionHeader eyebrow="Abstimmung" title="Hast du Zeit?" />
          <Card>
            <VotePills terminId={termin.id} current={meinVote} terminDatum={termin.datum} />
            <div style={{ marginTop: 16 }}>{abstimmungsListe}</div>
          </Card>
          {anmeldungSchliessen}

          {/* Reservierung ändern: selten, drum ganz unten als Klappe (Orga, Präsident, Admin) */}
          {termin.phase === 'reserviert' && darfVerwalten && (
            <ReservierungAendern
              action={wirtshausFestlegen.bind(null, termin.id)}
              bekannte={getBekannteWirtshaeuser()}
            />
          )}
        </>
      )}
    </>
  );
}

const kopfLinkStil: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 'var(--r-pill)',
  border: '1px solid rgba(246,240,226,0.28)', fontSize: 13, fontWeight: 800, color: 'var(--gold-bright)', textDecoration: 'none',
};

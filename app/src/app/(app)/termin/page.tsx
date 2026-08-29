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
} from '@/lib/queries';
import { datumLang, datumKurz } from '@/lib/format';
import { PTS, rechtzeitigAbgestimmt, berlinTag, bierdeckelOffen, abschlussOffen, abschlussAb } from '@/lib/punkte';
import { nowIso } from '@/lib/ids';
import { Card, SectionHeader, Avatar, Badge, Button, Input, Icon } from '@/components/ds';
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
  for (const id of zugesagtIds) rows[id] = { hoiben: 0, brodn: false, taxi: false, runde: false, abgsagt: false };
  for (const b of besucheLive) {
    if (!b.anwesend) continue;
    rows[b.memberId] = { hoiben: b.hoiben, brodn: b.schweinsbraten > 0, taxi: b.taxi, runde: false, abgsagt: false };
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
        brodn: b.schweinsbraten > 0,
        taxi: b.taxi,
        runde: kasseEintraege.some((k) => k.kind === 'runde' && k.memberId === b.memberId),
        abgsagt: false,
      };
    } else if (kasseEintraege.some((k) => k.kind === 'strafe' && k.memberId === b.memberId && k.grund.startsWith('Zugesagt'))) {
      rows[b.memberId] = { hoiben: 0, brodn: false, taxi: false, runde: false, abgsagt: true };
    }
  }
  return {
    rows,
    kaisiBestellt: alleBesuche.some((b) => b.kaiserschmarrn > 0),
    biersorte: wirtshaus?.biersorte ?? 'Augustiner',
    weissbier: wirtshaus?.weissbier ?? '',
  };
}

export default async function TerminPage() {
  const me = (await getCurrentMember())!;
  erzwingeProfil(me);
  const termin = getAktuellerTermin();
  const mitglieder = getAktiveMitglieder();
  // Chronik: die letzten 6 besuchten Wirtshäuser als volle Archiv-Einträge
  // (Antippen öffnet dasselbe Detail wie im Archiv)
  const archivEintraege = ladeArchivEintraege(me.id);
  const chronik = getArchiv()
    .slice(0, 6)
    .map((a) => archivEintraege.find((e) => e.besuchtAm && e.id === a.wirtshaus.id))
    .filter((e): e is NonNullable<typeof e> => !!e);
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
            {/* Mei Bewertung zum letzten Besuch, nur wer dabei war, derf werten */}
            {daten.mein?.anwesend && (
              <MeiBewertung
                wirtshausName={nachtragWirtshaus?.name ?? null}
                initial={daten.initial}
                team={daten.team}
                action={meineBewertung.bind(null, nachtrag.id)}
              />
            )}
            <NachtragKlappe
              titel={`Letzten Besuch${nachtragWirtshaus ? ` im ${nachtragWirtshaus.name}` : ''} nachtragen (${datumKurz(nachtrag.datum)}), no ${nachtragRestTage} ${nachtragRestTage === 1 ? 'Tag' : 'Tag’'} offen`}
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
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
            An Organisator brauchts ned eintragen, den Posten schnappt sich danach wer mag („I regle das!“).
            Nur wer grad organisiert hat, setzt aus. Beim Anlegen kriegen alle Spezln Push + Mail zur Abstimmung.
          </div>
        </form>
      </Card>
    </>
  );
}

/* ---------- Aktiver Termin: Phasen-Maschine ---------- */
async function AktiverTermin({ terminId, meId, isAdmin }: { terminId: string; meId: string; isAdmin: boolean }) {
  const termin = getAktuellerTermin();
  if (!termin) return null;
  const { wirtshaus, planer } = getTerminMitWirtshaus(termin);
  const alleVotes = getVotesFuerTermin(termin.id);
  const mitglieder = getAktiveMitglieder();
  const offene = getOffeneWirtshaeuser();
  const meinVoteRow = alleVotes.find((v) => v.vote.memberId === meId)?.vote ?? null;
  const meinVote = meinVoteRow?.wert ?? null;
  // Verwalten (Wirtshaus festlegen/ändern, Anmeldung schließen):
  // Organisator, aktueller Präsident oder Admin
  const darfVerwalten = isAdmin || termin.planerId === meId || meId === getPraesidentId();

  // Bierdeckel: am Stammtisch-Abend (ab Termin-Uhrzeit bis zum Abschluss)
  // strichelt jeder seine eigenen Hoiben live, Stand aus den Besuchs-Einträgen.
  const deckelOffen = bierdeckelOffen(termin, nowIso());
  const besucheLive = deckelOffen || termin.phase === 'heute' ? getBesucheFuerTermin(termin.id) : [];
  const deckelSpezln: BierdeckelSpezl[] = besucheLive
    .filter((b) => b.anwesend && b.hoiben > 0 && b.memberId !== meId)
    .flatMap((b) => {
      const m = mitglieder.find((x) => x.id === b.memberId);
      return m ? [{ name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein, hoiben: b.hoiben }] : [];
    });

  const phasenLabel = {
    planung: 'In Planung',
    reserviert: 'Reserviert',
    heute: 'Heut’ is’ Stammtisch',
    abgeschlossen: 'Abgeschlossen',
  }[termin.phase];

  return (
    <>
      <Card tone="dark" framed pad={0} style={{ overflow: 'hidden' }}>
        <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="wn-eyebrow" style={{ color: 'var(--gold)' }}>{datumLang(termin.datum)} · {termin.zeit} Uhr</div>
            <Badge tone={termin.phase === 'heute' ? 'gold' : 'blau'} solid>
              {phasenLabel}
            </Badge>
          </div>
          <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, color: 'var(--pergament)', margin: '8px 0 2px' }}>
            {wirtshaus ? wirtshaus.name : planer ? `organisiert von ${anzeigeName(planer)}` : 'Wer reglt’s? Orga is frei!'}
          </div>
          {wirtshaus?.adresse && (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(246,240,226,0.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="pin" size={14} /> {wirtshaus.adresse}
            </div>
          )}
          {termin.phase === 'reserviert' && (
            <a
              href={`/termin/${termin.id}/ics`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                fontSize: 13, fontWeight: 800, color: 'var(--gold-bright)', textDecoration: 'none',
              }}
            >
              <Icon name="calendar" size={15} /> Zum Kalender
            </a>
          )}
        </div>
      </Card>

      {/* Bierdeckel, am Stammtisch-Abend strichelt jeder seine eigenen Hoiben */}
      {deckelOffen && (
        <>
          <SectionHeader eyebrow="Heit am Tisch" title="Dei Bierdeckel" fraktur />
          <Bierdeckel
            terminId={termin.id}
            wirtshausName={wirtshaus?.name ?? null}
            initialHoiben={besucheLive.find((b) => b.memberId === meId)?.hoiben ?? 0}
            spezln={deckelSpezln}
          />
          {/* Mei Bewertung, jeder für sich, scho am Abend (bis 7 Tag nach’m Abschluss) */}
          {(() => {
            const daten = bewertungsDaten(besucheLive, meId);
            return (
              <MeiBewertung
                wirtshausName={wirtshaus?.name ?? null}
                initial={daten.initial}
                team={daten.team}
                action={meineBewertung.bind(null, termin.id)}
              />
            );
          })()}
        </>
      )}

      {/* Reservierung ändern, direkt unter der Termin-Karte, vor der Abstimmung.
          Organisator, Präsident oder Admin; schließt sich nach dem Speichern und meldet Erfolg. */}
      {termin.phase === 'reserviert' && darfVerwalten && (
        <ReservierungAendern
          action={wirtshausFestlegen.bind(null, termin.id)}
          bekannte={getBekannteWirtshaeuser()}
        />
      )}

      {/* Phase: Planung, zuerst schnappt sich wer d'Orga („I regle das!"),
          dann legt der Organisator's Wirtshaus fest. Sperre: wer den letzten
          Stammtisch organisiert hat, muss aussetzen. */}
      {termin.phase === 'planung' && !termin.planerId && (
        <OrgaSchnappen
          action={orgaSchnappen.bind(null, termin.id)}
          gesperrt={getLetzterAbgeschlossenerTermin()?.planerId === meId}
        />
      )}
      {termin.phase === 'planung' && termin.planerId &&
        (darfVerwalten ? (
          <>
            <SectionHeader eyebrow="Dei Aufgabe" title="Wirtshaus festlegen" />
            <Card>
              <form action={wirtshausFestlegen.bind(null, termin.id)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {offene.length > 0 && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
                        Gfundene Wirtshäuser (offen auf der Karte)
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
                        {offene.map(({ wirtshaus, finder }) => (
                          <option key={wirtshaus.id} value={wirtshaus.id}>
                            {wirtshaus.name}
                            {wirtshaus.bezirk ? ` (${wirtshaus.bezirk})` : ''}
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
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
                  Beim Eintragen kriegen alle Spezln a Push-Nachricht und a Mail.
                </div>
              </form>
            </Card>
          </>
        ) : (
          <Card tone="parchment">
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-700)' }}>
              {(planer ? anzeigeName(planer) : '—')} suacht no a Wirtshaus aus. Du kannst derweil scho abstimmen, ob’st Zeit hast.
            </div>
          </Card>
        ))}

      {/* Abstimmung (planung + reserviert) */}
      {(termin.phase === 'planung' || termin.phase === 'reserviert') && (
        <>
          <SectionHeader eyebrow="Abstimmung" title="Hast du Zeit?" />
          <Card>
            <VotePills
              terminId={termin.id}
              current={meinVote}
              terminDatum={termin.datum}
            />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Man selbst immer oben, danach: Zugesagt → Vielleicht → Ausstehend → Abgesagt */}
              {[...mitglieder]
                .sort((a, b) => {
                  if (a.id === meId) return -1;
                  if (b.id === meId) return 1;
                  const prio = (id: string) => {
                    const w = alleVotes.find((x) => x.vote.memberId === id)?.vote.wert;
                    return w === 'zu' ? 0 : w === 'vielleicht' ? 1 : !w ? 2 : 3;
                  };
                  return prio(a.id) - prio(b.id);
                })
                .map((m) => {
                  const v = alleVotes.find((x) => x.vote.memberId === m.id)?.vote.wert;
                  const label = v === 'zu' ? 'Zugesagt' : v === 'vielleicht' ? 'Vielleicht' : v === 'ab' ? 'Abgesagt' : 'Keine Antwort';
                  const tone = v === 'zu' ? 'erfolg' : v === 'vielleicht' ? 'warnung' : v === 'ab' ? 'strafe' : 'neutral';
                  const ich = m.id === meId;
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: ich ? '6px 8px' : 0, background: ich ? 'var(--info-bg)' : 'transparent', borderRadius: ich ? 'var(--r-sm)' : 0 }}>
                      <Avatar src={m.photoUrl} name={m.name} size={32} present={v === 'zu'} verein={m.verein} />
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
                        {anzeigeName(m)}
                      </span>
                      <Badge tone={tone as 'erfolg' | 'warnung' | 'strafe' | 'neutral'}>{label}</Badge>
                    </div>
                  );
                })}
            </div>
          </Card>
          {termin.phase === 'reserviert' && darfVerwalten && (
            termin.datum === berlinTag(new Date().toISOString()) ? (
              <form action={phaseSetzen.bind(null, termin.id, 'heute')}>
                <Button type="submit" fullWidth variant="secondary">
                  Heut’ is’ so weit, Anmeldung schließen
                </Button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', padding: '4px 0' }}>
                🔒 D’Anmeldung kannst erst am Stammtisch-Tag ({datumKurz(termin.datum)}) schließen.
              </div>
            )
          )}

        </>
      )}

      {/* Phase: Heute, Besuch abschließen (nur Logistik, darf jeder; der Erste
          kriegt +3 WP). Frühestens 2 Stunden nach Beginn, damit koaner den
          Abend mittendrin zuamacht, bewertet wird eh jeder für sich. */}
      {termin.phase === 'heute' && (
        <>
          <Card tone="parchment" pad={14}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Anmeldung geschlossen
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginTop: 4 }}>
              Jeder gibt bei <b>„Mei Bewertung“</b> sei eigene Wertung ab (<b>+{PTS.bewertung} WP</b>, mit Text no <b>+{PTS.bewertungsText} WP</b>), aus allen zusammen wird d’Tages-Wertung. Nach’m Abend schließt irgendwer vo eich no d’Logistik ab (wer da war, Hoibe, Runden), der Erste kriegt <b>+{PTS.abschluss} WP</b> (und wer am meisten abschließt, is’ Schriftführer).
            </div>
          </Card>

          {abschlussOffen(termin, nowIso()) ? (
            <>
              <SectionHeader eyebrow="Zapfenstreich" title="Besuch abschließen" fraktur />
              <Card>
                <AbschlussForm
                  mitglieder={mitglieder.map((m) => ({
                    id: m.id,
                    name: anzeigeName(m),
                    photoUrl: m.photoUrl,
                    verein: m.verein,
                    zugesagt: alleVotes.some((v) => v.vote.memberId === m.id && v.vote.wert === 'zu'),
                  }))}
                  action={besuchAbschliessen.bind(null, termin.id)}
                  initial={abschlussVorbelegung(
                    besucheLive,
                    mitglieder.filter((m) => alleVotes.some((v) => v.vote.memberId === m.id && v.vote.wert === 'zu')).map((m) => m.id),
                    wirtshaus,
                  )}
                />
              </Card>
            </>
          ) : (
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', padding: '4px 0' }}>
              🔒 Abgschlossen wird erst, wenn der Abend rum is: ab {abschlussAb(termin)} Uhr. Bis dahin wird gstrichelt und bewertet.
            </div>
          )}
        </>
      )}
    </>
  );
}

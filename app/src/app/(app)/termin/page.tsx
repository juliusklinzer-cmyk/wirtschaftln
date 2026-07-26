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
import { PTS, rechtzeitigAbgestimmt, berlinTag } from '@/lib/punkte';
import { Card, SectionHeader, Avatar, Badge, Button, Input, Icon } from '@/components/ds';
import { VotePills } from '@/components/domain/VotePills';
import { neuerTermin, wirtshausFestlegen, phaseSetzen, besuchAbschliessen } from './actions';
import { AbschlussForm, type AbschlussWerte } from './abschluss-form';
import { NachtragKlappe } from './nachtrag-klappe';
import { ReservierungAendern } from './reservierung-aendern';
import { ChronikListe } from '@/components/domain/ChronikListe';
import { ladeArchivEintraege } from '@/lib/archiv-eintraege';
import { WirtshausSuche } from '@/components/domain/WirtshausSuche';

/** Gespeicherten Stand des Abschlusses fürs Nachtragen wieder ins Formular laden. */
function nachtragInitial(terminId: string, meId: string): AbschlussWerte {
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
  const mein = alleBesuche.find((b) => b.memberId === meId);
  return {
    rows,
    sterne: mein?.sterne ?? null,
    kommentar: mein?.kommentar ?? '',
    kaisiBestellt: alleBesuche.some((b) => b.kaiserschmarrn > 0),
    kaiserSterne: mein?.kaiserSterne ?? null,
    kaiserNotiz: mein?.kaiserNotiz ?? '',
    brodnSterne: mein?.brodnSterne ?? null,
    brodnNotiz: mein?.brodnNotiz ?? '',
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
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!termin && <NeuerTerminForm mitglieder={mitglieder} meId={me.id} />}
      {termin && <AktiverTermin terminId={termin.id} meId={me.id} isAdmin={me.role === 'admin'} />}

      {nachtrag && (
        <NachtragKlappe
          titel={`✏️ Letzten Besuch${nachtragWirtshaus ? ` im ${nachtragWirtshaus.name}` : ''} bewerten bzw. verfeinern (${datumKurz(nachtrag.datum)}) — no ${nachtragRestTage} ${nachtragRestTage === 1 ? 'Tag' : 'Tag’'} offen`}
          mitglieder={mitglieder.map((m) => ({ id: m.id, name: anzeigeName(m), photoUrl: m.photoUrl, verein: m.verein, zugesagt: false }))}
          action={besuchAbschliessen.bind(null, nachtrag.id)}
          initial={nachtragInitial(nachtrag.id, me.id)}
        />
      )}

      {chronik.length > 0 && (
        <>
          <SectionHeader eyebrow="Chronik" title="G’wesen samma" fraktur />
          <ChronikListe eintraege={chronik} />
        </>
      )}
    </div>
  );
}

/* ---------- Kein aktiver Termin: neuen anlegen ---------- */
function NeuerTerminForm({
  mitglieder,
  meId,
}: {
  mitglieder: Array<{ id: string; name: string; spitzname: string | null }>;
  meId: string;
}) {
  return (
    <>
      <SectionHeader eyebrow="Auf geht’s" title="Neuer Termin" />
      <Card>
        <form action={neuerTermin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Datum" name="datum" type="date" required />
          <Input label="Uhrzeit" name="zeit" type="time" defaultValue="19:00" />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
              Organisiert von
            </label>
            <select
              name="planerId"
              defaultValue={meId}
              style={{
                width: '100%', padding: '12px 14px', border: '1.5px solid var(--ink-200)',
                borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 15,
                fontWeight: 500, color: 'var(--ink-900)', background: 'var(--weiss)',
              }}
            >
              {mitglieder.map((m) => (
                <option key={m.id} value={m.id}>
                  {anzeigeName(m)}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" fullWidth>
            Termin anlegen
          </Button>
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
            {wirtshaus ? wirtshaus.name : `organisiert von ${(planer ? anzeigeName(planer) : '—')}`}
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

      {/* Reservierung ändern — direkt unter der Termin-Karte, vor der Abstimmung.
          Organisator, Präsident oder Admin; schließt sich nach dem Speichern und meldet Erfolg. */}
      {termin.phase === 'reserviert' && darfVerwalten && (
        <ReservierungAendern
          action={wirtshausFestlegen.bind(null, termin.id)}
          bekannte={getBekannteWirtshaeuser()}
        />
      )}

      {/* Phase: Planung — Wirtshaus festlegen */}
      {termin.phase === 'planung' &&
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
                        <option value="">— Neues Wirtshaus suchen —</option>
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
                  Heut’ is’ so weit — Anmeldung schließen
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

      {/* Phase: Heute — Besuch abschließen (darf jeder; der Erste kriegt +3 WP) */}
      {termin.phase === 'heute' && (
        <>
          <Card tone="parchment" pad={14}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Anmeldung geschlossen
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginTop: 4 }}>
              Nach’m Abend schließt irgendwer vo eich den Besuch ab — der Erste kriegt <b>+{PTS.abschluss} WP</b> (und wer am meisten abschließt, is’ Schriftführer ✒️). Wer sei Bewertung mit am Text ausschmückt, kriegt no <b>+{PTS.bewertungsText} WP</b> dazu.
            </div>
          </Card>

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
            />
          </Card>
        </>
      )}
    </>
  );
}

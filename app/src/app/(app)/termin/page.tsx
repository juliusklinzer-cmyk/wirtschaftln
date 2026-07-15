import { getCurrentMember } from '@/lib/session';
import {
  getAktuellerTermin,
  getTerminMitWirtshaus,
  getVotesFuerTermin,
  getAktiveMitglieder,
  getArchiv,
} from '@/lib/queries';
import { datumLang, datumKurz } from '@/lib/format';
import { Card, SectionHeader, Avatar, Badge, Button, Input, Icon } from '@/components/ds';
import { VotePills } from '@/components/domain/VotePills';
import { neuerTermin, wirtshausFestlegen, phaseSetzen, besuchAbschliessen } from './actions';

export default async function TerminPage() {
  const me = (await getCurrentMember())!;
  const termin = getAktuellerTermin();
  const mitglieder = getAktiveMitglieder();
  const archiv = getArchiv().slice(0, 6);

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!termin && <NeuerTerminForm mitglieder={mitglieder} meId={me.id} />}
      {termin && <AktiverTermin terminId={termin.id} meId={me.id} isAdmin={me.role === 'admin'} />}

      {archiv.length > 0 && (
        <>
          <SectionHeader eyebrow="Chronik" title="G’wesen samma" fraktur />
          <Card pad={12}>
            {archiv.map(({ termin: t, wirtshaus, rating }, i) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 8px',
                  borderBottom: i < archiv.length - 1 ? '1px solid var(--ink-100)' : 'none',
                }}
              >
                <span style={{ color: 'var(--gold-700)', display: 'inline-flex' }}>
                  <Icon name="pin" size={17} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{wirtshaus.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
                    {wirtshaus.bezirk ?? '—'} · {datumKurz(t.datum)}
                  </div>
                </div>
                {rating > 0 && (
                  <Badge tone="gold">
                    ★ {rating.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </Badge>
                )}
              </div>
            ))}
          </Card>
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
                  {m.spitzname ?? m.name}
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
  const meinVote = alleVotes.find((v) => v.vote.memberId === meId)?.vote.wert ?? null;
  const darfVerwalten = isAdmin || termin.planerId === meId;

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
            {wirtshaus ? wirtshaus.name : `organisiert von ${planer?.spitzname ?? planer?.name ?? '—'}`}
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

      {/* Phase: Planung — Wirtshaus festlegen */}
      {termin.phase === 'planung' &&
        (darfVerwalten ? (
          <>
            <SectionHeader eyebrow="Dei Aufgabe" title="Wirtshaus festlegen" />
            <Card>
              <form action={wirtshausFestlegen.bind(null, termin.id)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input label="Wirtshaus" name="name" placeholder="z. B. Wirtshaus am Hart" required />
                <Input label="Adresse" name="adresse" placeholder="Straße Nr., PLZ München" />
                <Input label="Bezirk" name="bezirk" placeholder="z. B. Am Hart" />
                <Button type="submit" fullWidth variant="gold">
                  Reservierung eintragen
                </Button>
              </form>
            </Card>
          </>
        ) : (
          <Card tone="parchment">
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-700)' }}>
              {planer?.spitzname ?? planer?.name} suacht no a Wirtshaus aus. Du kannst derweil scho abstimmen, ob’st Zeit hast.
            </div>
          </Card>
        ))}

      {/* Abstimmung (planung + reserviert) */}
      {(termin.phase === 'planung' || termin.phase === 'reserviert') && (
        <>
          <SectionHeader eyebrow="Abstimmung" title="Hast du Zeit?" />
          <Card>
            <VotePills terminId={termin.id} current={meinVote} />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mitglieder.map((m) => {
                const v = alleVotes.find((x) => x.vote.memberId === m.id)?.vote.wert;
                const label = v === 'zu' ? 'Zugesagt' : v === 'vielleicht' ? 'Vielleicht' : v === 'ab' ? 'Abgesagt' : 'Keine Antwort';
                const tone = v === 'zu' ? 'erfolg' : v === 'vielleicht' ? 'warnung' : v === 'ab' ? 'strafe' : 'neutral';
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar src={m.photoUrl} name={m.name} size={32} present={v === 'zu'} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
                      {m.spitzname ?? m.name}
                    </span>
                    <Badge tone={tone as 'erfolg' | 'warnung' | 'strafe' | 'neutral'}>{label}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
          {termin.phase === 'reserviert' && darfVerwalten && (
            <form action={phaseSetzen.bind(null, termin.id, 'heute')}>
              <Button type="submit" fullWidth variant="secondary">
                Heut’ is’ so weit — Anmeldung schließen
              </Button>
            </form>
          )}
        </>
      )}

      {/* Phase: Heute — Besuch abschließen */}
      {termin.phase === 'heute' && (
        <>
          <Card tone="parchment" pad={14}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Anmeldung geschlossen
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginTop: 4 }}>
              Nach’m Abend trägt {planer?.spitzname ?? planer?.name} die Hoiben ein und schließt den Besuch ab.
            </div>
          </Card>

          {darfVerwalten && (
            <>
              <SectionHeader eyebrow="Zapfenstreich" title="Besuch abschließen" fraktur />
              <Card>
                <form action={besuchAbschliessen.bind(null, termin.id)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {mitglieder.map((m, i) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        paddingBottom: 12,
                        borderBottom: i < mitglieder.length - 1 ? '1px solid var(--ink-100)' : 'none',
                      }}
                    >
                      <input type="hidden" name="memberId" value={m.id} />
                      <input type="checkbox" name={`anwesend_${m.id}`} defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--erfolg)' }} />
                      <Avatar src={m.photoUrl} name={m.name} size={32} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.spitzname ?? m.name}
                      </span>
                      <ZahlFeld name={`hoiben_${m.id}`} label="🍺" />
                      <ZahlFeld name={`kaiser_${m.id}`} label="🥞" />
                    </div>
                  ))}

                  <div style={{ marginTop: 4 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
                      Deine Sterne fürs Wirtshaus
                    </label>
                    <select
                      name="sterne"
                      defaultValue="4"
                      style={{
                        width: '100%', padding: '12px 14px', border: '1.5px solid var(--ink-200)',
                        borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500,
                        color: 'var(--ink-900)', background: 'var(--weiss)',
                      }}
                    >
                      {[5, 4, 3, 2, 1].map((s) => (
                        <option key={s} value={s}>
                          {'★'.repeat(s)}{'☆'.repeat(5 - s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input label="Kommentar" name="kommentar" placeholder="Brodn-Qualität, Bedienung, G’schichten…" />
                  <Button type="submit" fullWidth variant="gold">
                    Besuch abschließen & archivieren
                  </Button>
                </form>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}

function ZahlFeld({ name, label }: { name: string; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <input
        type="number"
        name={name}
        min={0}
        max={30}
        defaultValue={0}
        style={{
          width: 52, padding: '8px 6px', border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-sm)',
          fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', textAlign: 'center',
        }}
      />
    </label>
  );
}

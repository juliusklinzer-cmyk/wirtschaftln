'use client';

import { useState, useTransition } from 'react';
import { Avatar, ZeilenKarte } from '@/components/ds';
import { PTS } from '@/lib/punkte';
import { StrafeBuchen, type StrafWahl, type StrafAntwort } from '@/components/domain/StrafeBuchen';
import { goldKnopfStil, feldStil, feldLabelStil } from '@/components/domain/hero-stil';

export type ZettelMitglied = {
  id: string;
  name: string;
  photoUrl: string | null;
  verein: string | null;
  /** hat beim Termin zugesagt */
  zugesagt: boolean;
  /** Was es kostet, wenn er fehlt (unentschuldigt laut Strafenkatalog), null = nix */
  wennWeg: string | null;
  /** hat am Abend scho gstrichelt / eingecheckt → steht als „da“ */
  live: boolean;
  /** Scho amal abgehakt: der gespeicherte Stand (zum Ändern) */
  stand?: { status: 'da' | 'spaet' | 'weg' };
};

type Status = 'da' | 'spaet' | 'weg';

const karte: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 };

/** Schritt-Kopf: Nummer im Navy-Kreis, Titel, rechts a Hinweis. */
function SchrittKopf({ nummer, titel, hint }: { nummer: number; titel: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
      <span className="wn-tnum" style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold-bright)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{nummer}</span>
      <span style={{ flex: 1, fontSize: 17, fontWeight: 800, color: 'var(--navy)' }}>{titel}</span>
      {hint && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>{hint}</span>}
    </div>
  );
}

/**
 * Wer war da + nächster Termin, Schritt für Schritt (Redesign 1c): 1 Wer war
 * da? 2 Nächster Stammtisch. Bewertet wird getrennt, jeder wann er mag. Hoibe und Marken trägt
 * jeder selber am Deckel ein, hier wird nur bestätigt, wer da war, wer z’spät
 * kemma is und wer gfehlt hat, dazu Strafen aus dem Katalog. Der Abend
 * bleibt danach offen, er schließt sich um 3 Uhr früh von allein.
 */
export function AbschlussZettel({
  mitglieder,
  meId,
  naechsterTermin,
  ersterErfasser = true,
  mindestDatum,
  action,
  strafen,
}: {
  mitglieder: ZettelMitglied[];
  meId: string;
  naechsterTermin: boolean;
  /** Erster, der abhakt → kriegt die WP */
  ersterErfasser?: boolean;
  /** Der nächste Termin muss nach diesem Abend liegen */
  mindestDatum?: string;
  action: (formData: FormData) => Promise<void>;
  /** Strafe hinzufügen (eigene aus dem Katalog) und was an dem Abend schon gebucht ist */
  strafen?: {
    regeln: StrafWahl[];
    gebucht: Array<{ id: string; text: string; folge: string; darfWeg: boolean }>;
    terminId: string;
    buchen: (fd: FormData) => Promise<StrafAntwort>;
    zuruecknehmen: (id: string) => Promise<boolean>;
    /** Präsident oder Admin: „Neue Strafe erstellen“ */
    neuErstellen?: boolean;
  };
}) {
  const [status, setStatus] = useState<Record<string, Status>>(() => {
    const s: Record<string, Status> = {};
    // Erstmal sind alle da, abgehakt wird, wer gefehlt hat (Julius, 04.11.2026)
    for (const m of mitglieder) s[m.id] = m.stand?.status ?? 'da';
    return s;
  });
  const [strafeOffen, setStrafeOffen] = useState(false);
  const [strafMeldung, setStrafMeldung] = useState<string | null>(null);
  const [nimmtZurueck, startZuruecknehmen] = useTransition();

  const dabei = mitglieder.filter((m) => status[m.id] !== 'weg');
  // Reihenfolge einmal festlegen (beim Ändern springt nix, sonst verliert man den Überblick)
  const [sortiert] = useState(() => [...mitglieder].sort((a, b) => a.name.localeCompare(b.name, 'de')));
  let schritt = 0;

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Versteckte Felder in EINEM Kasten, sonst zählen sie als Flex-Kinder mit Abstand */}
      <div hidden>
        <input type="hidden" name="modus" value="zettel" />
        {mitglieder.map((m) => (
          <span key={m.id}>
            <input type="hidden" name="memberId" value={m.id} />
            <input type="hidden" name={`status_${m.id}`} value={status[m.id]} />
          </span>
        ))}
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SchrittKopf nummer={++schritt} titel="Wer war da?" hint={`${dabei.length} von ${mitglieder.length}`} />
        <ZeilenKarte>
          {sortiert.map((m, i) => {
            const s = status[m.id];
            const weg = s === 'weg';
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0', borderBottom: i < sortiert.length - 1 ? '1px solid var(--ink-50)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={m.photoUrl} name={m.name} size={34} verein={m.verein} present={!weg} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: weg ? 'var(--ink-300)' : 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {kurzName(m.name)}
                  </span>
                  <Wahl aktiv={s} onChange={(v) => setStatus((r) => ({ ...r, [m.id]: v }))} />
                </div>
                {weg && m.wennWeg && (
                  <span style={{ paddingLeft: 44, marginTop: -4, fontSize: 12, fontWeight: 700, lineHeight: 1.4, color: 'var(--strafe)' }}>
                    Unentschuldigt: {m.wennWeg}
                  </span>
                )}
              </div>
            );
          })}
        </ZeilenKarte>
      </section>

      {strafen && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SchrittKopf nummer={++schritt} titel="Strafen" hint="optional" />
          <div style={karte}>
            {strafen.gebucht.length === 0 && !strafeOffen && !strafMeldung && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>Heute noch nichts gebucht. Wer unentschuldigt fehlt, bucht die App von allein.</span>}
            {strafen.gebucht.map((g) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.text}</span>
                <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 800, color: 'var(--strafe)', flex: 'none' }}>{g.folge}</span>
                {g.darfWeg && (
                  <button type="button" disabled={nimmtZurueck} aria-label="Zurücknehmen" onClick={() => startZuruecknehmen(async () => { await strafen.zuruecknehmen(g.id); })} style={{ width: 28, height: 28, flex: 'none', borderRadius: '50%', border: 'none', background: 'var(--ink-50)', color: 'var(--ink-500)', cursor: 'pointer', fontSize: 14, fontWeight: 800, padding: 0 }}>✕</button>
                )}
              </div>
            ))}
            {strafMeldung && <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--erfolg)' }}>Gebucht: {strafMeldung}</span>}
            {strafeOffen ? (
              <StrafeBuchen
                mitglieder={mitglieder.map((m) => ({ id: m.id, name: m.name, photoUrl: m.photoUrl, verein: m.verein }))}
                regeln={strafen.regeln}
                terminId={strafen.terminId}
                buchen={strafen.buchen}
                neuErstellen={strafen.neuErstellen}
                onGebucht={(meldung) => { setStrafMeldung(meldung); setStrafeOffen(false); }}
              />
            ) : (
              <button type="button" onClick={() => { setStrafMeldung(null); setStrafeOffen(true); }} className="wn-press" style={{ height: 44, borderRadius: 12, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                Strafe hinzufügen
              </button>
            )}
          </div>
        </section>
      )}

      {/* Wer abhakt, macht den nächsten Termin aus: Datum + Uhrzeit reichen,
          zu-/absagen tun danach alle selber (Julius, 11.09.2026) */}
      {naechsterTermin && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SchrittKopf nummer={++schritt} titel="Nächster Stammtisch" />
          <div style={karte}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={feldLabelStil}>Datum</span>
                <input type="date" name="naechstesDatum" required min={mindestDatum ? naechsterTag(mindestDatum) : undefined} style={feldStil} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={feldLabelStil}>Uhrzeit</span>
                <input type="time" name="naechsteZeit" defaultValue="19:00" style={feldStil} />
              </label>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)', textAlign: 'center' }}>Zu- oder absagen tun danach alle selbst.</div>
          </div>
        </section>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button type="submit" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>{naechsterTermin ? 'Termin ausmachen & speichern' : 'Speichern'}</button>
        <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)', textAlign: 'center' }}>
          {ersterErfasser ? `+${PTS.terminAusmachen} WP für dich. ` : ''}Der Deckel bleibt offen bis 3 Uhr, wer später noch kommt und strichelt, zählt automatisch als da.
        </div>
      </div>
    </form>
  );
}

/** Tag nach `datum` (YYYY-MM-DD), frühestmöglicher nächster Termin. */
function naechsterTag(datum: string): string {
  const d = new Date(`${datum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Vorname fürs Enge: „Sepp Brunner“ → „Sepp“, aber „da André“ bleibt ganz (kurzer Artikel vorn). */
function kurzName(name: string): string {
  const [erster, ...rest] = name.split(' ');
  return erster.length <= 3 && rest.length > 0 ? name : erster;
}

/** Dreier-Wahl je Zeile: Da · Zu spät · Nicht da (Segment im grauen Pill) */
function Wahl({ aktiv, onChange }: { aktiv: Status; onChange: (v: Status) => void }) {
  const knopf = (v: Status, label: string, ton: string) => {
    const an = aktiv === v;
    return (
      <button
        type="button"
        className="wn-press"
        onClick={() => onChange(v)}
        aria-pressed={an}
        style={{
          padding: '6px 10px', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800,
          background: an ? ton : 'transparent', color: an ? 'var(--weiss)' : 'var(--ink-500)',
          transition: 'background 140ms var(--ease-standard), color 140ms var(--ease-standard)',
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <div style={{ display: 'inline-flex', flex: 'none', padding: 3, borderRadius: 999, background: 'var(--ink-50)' }}>
      {knopf('da', 'Da', 'var(--erfolg)')}
      {knopf('spaet', 'Zu spät', '#B7791F')}
      {knopf('weg', 'Nicht da', 'var(--ink-700)')}
    </div>
  );
}

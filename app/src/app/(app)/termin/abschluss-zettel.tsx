'use client';

import { useState } from 'react';
import { Avatar, Button, Input } from '@/components/ds';
import { PTS } from '@/lib/punkte';
import type { MeiBewertungWerte } from '@/components/domain/MeiBewertung';
import { EigeneWertung } from './eigene-wertung';

export type ZettelMitglied = {
  id: string;
  name: string;
  photoUrl: string | null;
  verein: string | null;
  /** hat beim Termin zugesagt (→ ned kemma = Strafrunde) */
  zugesagt: boolean;
  /** hat am Abend scho gstrichelt / eingecheckt → steht als „da“ */
  live: boolean;
};

type Status = 'da' | 'spaet' | 'weg';

/**
 * Der schlanke Abschluss-Zettel (Julius, 14.09.2026): Hoibe, Schnaps, Taxler,
 * Brodn, Schmarrn und Runden trägt jeder selber am Deckel ein, bewertet wird
 * beim Bewerten. Der Abschließer bestätigt nur no, wer da war, wer z’spät
 * kemma is und wer gfehlt hat (zugsagt & ned kemma → Strafrunde), gibt seine
 * eigene Wertung ab und macht den nächsten Termin aus.
 */
export function AbschlussZettel({
  mitglieder,
  meId,
  meineWerte,
  naechsterTermin,
  action,
}: {
  mitglieder: ZettelMitglied[];
  meId: string;
  meineWerte: MeiBewertungWerte;
  naechsterTermin: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  const [status, setStatus] = useState<Record<string, Status>>(() => {
    const s: Record<string, Status> = {};
    for (const m of mitglieder) s[m.id] = m.live || m.zugesagt || m.id === meId ? 'da' : 'weg';
    return s;
  });
  const [strafe, setStrafe] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {};
    for (const m of mitglieder) s[m.id] = m.zugesagt;
    return s;
  });
  const [meinBrodn, setMeinBrodn] = useState(meineWerte.brodnGessen);

  const dabei = mitglieder.filter((m) => status[m.id] !== 'weg');
  const ichDabei = status[meId] !== 'weg';
  // Da/z’spät zuerst, dann die Fehlenden
  const sortiert = [...mitglieder].sort((a, b) => {
    const rang = (id: string) => (status[id] === 'weg' ? 1 : 0);
    return rang(a.id) - rang(b.id) || a.name.localeCompare(b.name, 'de');
  });

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <input type="hidden" name="modus" value="zettel" />
      {mitglieder.map((m) => (
        <span key={m.id}>
          <input type="hidden" name="memberId" value={m.id} />
          <input type="hidden" name={`status_${m.id}`} value={status[m.id]} />
          {status[m.id] === 'weg' && m.zugesagt && strafe[m.id] && <input type="hidden" name={`strafe_${m.id}`} value="on" />}
        </span>
      ))}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 8 }}>
        Wer war da? · {dabei.length} von {mitglieder.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sortiert.map((m) => {
          const s = status[m.id];
          const weg = s === 'weg';
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', border: `1px solid ${weg ? 'var(--ink-100)' : 'var(--pergament-edge)'}`, borderRadius: 'var(--r-md)', background: weg ? 'var(--weiss)' : 'var(--pergament)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar src={m.photoUrl} name={m.name} size={30} verein={m.verein} present={!weg} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: weg ? 'var(--ink-500)' : 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.name.split(' ')[0]}
                </span>
                <Wahl aktiv={s} onChange={(v) => setStatus((r) => ({ ...r, [m.id]: v }))} />
              </div>
              {weg && m.zugesagt && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: strafe[m.id] ? 'var(--strafe)' : 'var(--ink-500)', cursor: 'pointer', paddingLeft: 38 }}>
                  <input type="checkbox" checked={strafe[m.id]} onChange={(e) => setStrafe((r) => ({ ...r, [m.id]: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--strafe)' }} />
                  Zugsagt & ned kemma: zahlt a Runde
                </label>
              )}
            </div>
          );
        })}
      </div>

      {ichDabei && (
        <div style={{ marginTop: 18 }}>
          <EigeneWertung werte={meineWerte} brodn={meinBrodn} onBrodn={setMeinBrodn} />
        </div>
      )}

      {/* Wer abschließt, macht den nächsten Termin aus — Datum + Uhrzeit reichen,
          zu-/absagen tun danach alle selber (Julius, 11.09.2026) */}
      {naechsterTermin && (
        <div style={{ marginTop: 18, padding: 14, background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Und wann geht’s weiter?</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-500)' }}>
              Wer abschließt, macht den nächsten Stammtisch aus. Zu- oder absagen tun danach alle selber.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
            <Input label="Datum" name="naechstesDatum" type="date" required />
            <Input label="Uhrzeit" name="naechsteZeit" type="time" defaultValue="19:00" />
          </div>
        </div>
      )}

      <Button type="submit" fullWidth variant="gold" size="lg" style={{ marginTop: 18 }}>
        Abschließen & ins Archiv
      </Button>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center', marginTop: 8 }}>
        Der Erste kriagt +{PTS.abschluss} WP. Hoibe, Marken und Wertung richtet jeder selber, no a Woch’ lang.
      </div>
    </form>
  );
}

/** Dreier-Wahl je Zeile: da · z’spät · ned da */
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
          padding: '6px 9px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800,
          background: an ? ton : 'transparent', color: an ? 'var(--weiss)' : 'var(--ink-500)',
          transition: 'background 140ms var(--ease-standard), color 140ms var(--ease-standard)',
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <div style={{ display: 'inline-flex', flex: 'none', border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-pill)', overflow: 'hidden', background: 'var(--weiss)' }}>
      {knopf('da', 'Da', 'var(--erfolg)')}
      {knopf('spaet', 'Z’spät', 'var(--warnung, #B7791F)')}
      {knopf('weg', 'Ned da', 'var(--ink-700)')}
    </div>
  );
}

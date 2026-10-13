'use client';

import { useState } from 'react';
import { Avatar, ZeilenKarte } from '@/components/ds';
import { PTS } from '@/lib/punkte';
import type { MeiBewertungWerte } from '@/components/domain/MeiBewertung';
import { WertungFelder } from '@/components/domain/WertungFelder';
import { goldKnopfStil, feldStil, feldLabelStil } from '@/components/domain/hero-stil';

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
 * Abend abschließen, Schritt für Schritt (Redesign 1c): 1 Wer war da?
 * 2 Deine Wertung & Essen, 3 Nächster Stammtisch. Hoibe und Marken trägt
 * jeder selber am Deckel ein, der Abschließer bestätigt nur no, wer da war,
 * wer z’spät kemma is und wer gfehlt hat (zugsagt & ned kemma → Strafrunde).
 */
export function AbschlussZettel({
  mitglieder,
  meId,
  meineWerte,
  naechsterTermin,
  action,
  ohneSterne = false,
}: {
  mitglieder: ZettelMitglied[];
  meId: string;
  meineWerte: MeiBewertungWerte;
  naechsterTermin: boolean;
  action: (formData: FormData) => Promise<void>;
  /** Stammhaus-Abend: koa Wirtshaus-Wertung */
  ohneSterne?: boolean;
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
            {status[m.id] === 'weg' && m.zugesagt && strafe[m.id] && <input type="hidden" name={`strafe_${m.id}`} value="on" />}
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
                {weg && m.zugesagt && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--strafe-bg)', fontSize: 12, fontWeight: 700, color: 'var(--strafe)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={strafe[m.id]} onChange={(e) => setStrafe((r) => ({ ...r, [m.id]: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--strafe)', margin: 0 }} />
                    Zugesagt, nicht gekommen: zahlt eine Runde
                  </label>
                )}
              </div>
            );
          })}
        </ZeilenKarte>
      </section>

      {ichDabei && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SchrittKopf nummer={++schritt} titel="Deine Wertung & Essen" hint="ohne Extrapunkte" />
          <div style={karte}>
            <WertungFelder werte={meineWerte} brodn={meinBrodn} onBrodn={setMeinBrodn} ohneSterne={ohneSterne} />
          </div>
        </section>
      )}

      {/* Wer abschließt, macht den nächsten Termin aus: Datum + Uhrzeit reichen,
          zu-/absagen tun danach alle selber (Julius, 11.09.2026) */}
      {naechsterTermin && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SchrittKopf nummer={++schritt} titel="Nächster Stammtisch" />
          <div style={karte}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={feldLabelStil}>Datum</span>
                <input type="date" name="naechstesDatum" required style={feldStil} />
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
        <button type="submit" className="wn-press" style={{ ...goldKnopfStil, minHeight: 52 }}>Abschließen & ins Archiv</button>
        <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)', textAlign: 'center' }}>
          +{PTS.abschluss} WP für dich, damit ist alles abgegolten: Wertung und Texte bringen dem Abschließer keine Extrapunkte. Änderbar bis eine Woche danach.
        </div>
      </div>
    </form>
  );
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

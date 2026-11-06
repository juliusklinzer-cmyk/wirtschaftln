'use client';

import { useState, useTransition } from 'react';
import { Avatar } from '@/components/ds';
import { KlappenKopf } from '@/components/ds';
import { praesidentSetzen, praesidentWahlBeenden, praesidentWahlStarten, type WahlAntwort } from '../praesident/actions';

type Spezl = { id: string; name: string; photoUrl: string | null; verein: string | null };

const vorname = (name: string) => { const [a, ...r] = name.split(' '); return a.length <= 3 && r.length > 0 ? name : a; };

/**
 * Admin bei „Präsident gewählt“ (06.11.2026): das Amt im laufenden Jahr selber
 * eintragen, a Wahl starten oder die laufende vorzeitig auszählen.
 */
export function PraesidentVerwaltung({ spezln, praesidentId, wahlOffen }: { spezln: Spezl[]; praesidentId: string | null; wahlOffen: boolean }) {
  const [wer, setWer] = useState<string | null>(null);
  const [antwort, setAntwort] = useState<WahlAntwort | null>(null);
  const [pending, startTransition] = useTransition();
  const los = (fn: () => Promise<WahlAntwort>) => startTransition(async () => { setAntwort(await fn()); setWer(null); });
  const knopf: React.CSSProperties = { minHeight: 46, borderRadius: 14, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, cursor: 'pointer', padding: '0 14px' };
  const gewaehlt = spezln.find((s) => s.id === wer);

  return (
    <details style={{ background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      <KlappenKopf icon={<span style={{ fontSize: 18 }}>👑</span>}>Präsident verwalten</KlappenKopf>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>
          Die Wahl startet von allein beim Schließen des ersten Stammtischs im Jahr. Hier kannst du das Amt selber eintragen oder eine Wahl jetzt starten.
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Präsident eintragen</span>
          <div className="wn-scroll-still" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 4px 2px' }}>
            {spezln.map((s) => {
              const an = s.id === wer;
              const amt = s.id === praesidentId;
              return (
                <button key={s.id} type="button" onClick={() => setWer(s.id)} aria-pressed={an} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none', border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                  <span style={{ display: 'inline-flex', borderRadius: '50%', boxShadow: an ? '0 0 0 3px var(--gold-700)' : 'none' }}>
                    <Avatar src={s.photoUrl} name={s.name} size={44} verein={s.verein} />
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: an ? 'var(--gold-700)' : 'var(--ink-500)', whiteSpace: 'nowrap' }}>{amt ? `👑 ${vorname(s.name)}` : vorname(s.name)}</span>
                </button>
              );
            })}
          </div>
          <button type="button" disabled={!wer || pending} onClick={() => wer && los(() => praesidentSetzen(wer))} className="wn-press" style={{ ...knopf, border: 'none', background: 'var(--navy)', color: 'var(--pergament)', opacity: wer && !pending ? 1 : 0.55 }}>
            {gewaehlt ? `${vorname(gewaehlt.name)} als Präsident eintragen` : 'Spezl antippen'}
          </button>
        </div>
        {wahlOffen ? (
          <button type="button" disabled={pending} onClick={() => los(praesidentWahlBeenden)} className="wn-press" style={{ ...knopf, border: '1.5px solid var(--gold)', background: 'var(--pergament)', color: 'var(--gold-700)' }}>
            Laufende Wahl jetzt auszählen
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => los(praesidentWahlStarten)} className="wn-press" style={{ ...knopf, border: '1.5px solid var(--gold)', background: 'var(--pergament)', color: 'var(--gold-700)' }}>
            Wahl jetzt starten (eine Woche offen)
          </button>
        )}
        {antwort && <span style={{ fontSize: 13, fontWeight: 700, color: antwort.ok ? 'var(--erfolg)' : 'var(--strafe)' }}>{antwort.meldung}</span>}
      </div>
    </details>
  );
}

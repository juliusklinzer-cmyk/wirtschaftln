'use client';

import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';

export type WacklerZeile = { id: string; name: string; gefragtAm: string; antwort: 'dabei' | null; entscheidbar: boolean };

/**
 * Wackler (nur Präsident & Admin): wer gefragt wurde, ob er no dabei is, und
 * was er gsagt hat. Ohne Antwort nach 14 Tagen entscheidet der Präsident.
 */
export function WacklerKarte({ wackler, entscheiden }: { wackler: WacklerZeile[]; entscheiden: (id: string, e: 'raus' | 'bleibt') => Promise<{ ok: boolean }> }) {
  const [sicher, setSicher] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);

  const los = async (w: WacklerZeile, e: 'raus' | 'bleibt') => {
    setLaeuft(true);
    const r = await entscheiden(w.id, e);
    setLaeuft(false);
    setSicher(null);
    setMeldung(r.ok ? (e === 'raus' ? `${w.name} ist ausgeschieden, alle wissen Bescheid.` : `${w.name} bleibt dabei.`) : 'Hat nicht geklappt, probier’s nochmal.');
  };

  const knopf = (farbe: 'navy' | 'rot' | 'hell'): React.CSSProperties => ({
    flex: 1, height: 44, borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-ui)',
    border: farbe === 'hell' ? '1.5px solid var(--ink-200)' : 'none',
    background: farbe === 'navy' ? 'var(--navy)' : farbe === 'rot' ? 'var(--strafe)' : 'var(--weiss)',
    color: farbe === 'hell' ? 'var(--navy)' : '#fff',
    opacity: laeuft ? 0.6 : 1,
  });

  return (
    <section id="wackler" style={{ display: 'flex', flexDirection: 'column', gap: 12, scrollMarginTop: 12 }}>
      <div style={{ background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Warning size={20} weight="fill" color="var(--strafe)" />
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink-900)' }}>Wackler</span>
        </div>
        {wackler.map((w) => (
          <div key={w.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--ink-50)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{w.name}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: w.antwort ? 'var(--erfolg)' : 'var(--ink-500)' }}>
                Gefragt am {w.gefragtAm} · {w.antwort === 'dabei' ? 'hat gesagt: bin dabei' : w.entscheidbar ? 'keine Antwort, du entscheidest' : 'wartet noch auf Antwort'}
              </span>
            </div>
            {w.entscheidbar && (
              sicher === w.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5 }}>{w.name} wirklich ausscheiden lassen? Die Chronik bleibt, ein Admin kann wieder aufnehmen.</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" disabled={laeuft} onClick={() => void los(w, 'raus')} style={knopf('rot')}>Ja, ausscheiden</button>
                    <button type="button" disabled={laeuft} onClick={() => setSicher(null)} style={knopf('hell')}>Abbrechen</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" disabled={laeuft} onClick={() => { setMeldung(null); setSicher(w.id); }} style={knopf('hell')}>Ausscheiden lassen</button>
                  <button type="button" disabled={laeuft} onClick={() => void los(w, 'bleibt')} style={knopf('navy')}>Dabei lassen</button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
      {meldung && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'var(--erfolg-bg)' }}>
          <CheckCircle size={22} weight="fill" color="var(--erfolg)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--erfolg)' }}>{meldung}</span>
        </div>
      )}
    </section>
  );
}

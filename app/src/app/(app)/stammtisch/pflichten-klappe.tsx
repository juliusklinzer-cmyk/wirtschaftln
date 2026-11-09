'use client';

import { useActionState, useEffect, useState } from 'react';
import { Scroll } from '@phosphor-icons/react/dist/ssr/Scroll';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Button } from '@/components/ds';
import { BadgeBild } from '@/components/domain/BadgeBild';
import type { PflichtWahl } from '@/lib/badges';
import { pflichtenSpeichern, type StammtischState } from './actions';

const feldStil: React.CSSProperties = {
  width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--ink-100)', background: 'var(--ink-50)',
  fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', resize: 'vertical', boxSizing: 'border-box',
};

/**
 * Pflichten der Ämter und Badges (WIR-003, 09.11.2026): für alle die Liste,
 * was bei uns gilt; Präsident und Admin klappen die Maske auf und legen sie
 * fest, typischerweise zum Jahresanfang.
 */
export function PflichtenKlappe({ wahl, darfPflegen }: { wahl: PflichtWahl[]; darfPflegen: boolean }) {
  const [offen, setOffen] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [state, action, pending] = useActionState<StammtischState, FormData>(pflichtenSpeichern, {});
  useEffect(() => {
    if (state.ok) {
      setOffen(false);
      setGespeichert(true);
    }
  }, [state]);
  const gesetzt = wahl.filter((w) => w.pflicht);

  if (offen) {
    return (
      <form action={action} style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>
          Was muss der Träger bei euch tun? Zum Beispiel: trinkt vorweg ein Starkbier. Leer lassen heißt keine Pflicht.
        </span>
        {wahl.map((w) => (
          <label key={w.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ flex: 'none', paddingTop: 2 }}>
              <BadgeBild slug={w.slug} icon={w.icon} name={w.name} size={40} />
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>
                {w.name} <span style={{ fontWeight: 600, color: 'var(--ink-500)' }}>· {w.art}</span>
              </span>
              <textarea name={`pflicht:${w.key}`} defaultValue={w.pflicht} rows={1} maxLength={160} placeholder="Keine Pflicht" style={feldStil} />
            </span>
          </label>
        ))}
        {state.error && (
          <div style={{ padding: '10px 12px', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>{state.error}</div>
        )}
        <Button type="submit" fullWidth size="lg" disabled={pending}>
          {pending ? 'Moment…' : 'Pflichten speichern'}
        </Button>
        <button type="button" onClick={() => setOffen(false)} style={{ height: 44, border: 'none', background: 'none', color: 'var(--ink-500)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Abbrechen</button>
      </form>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {gesetzt.length > 0 && (
        <div style={{ background: 'var(--pergament)', border: '1.5px solid var(--gold)', borderRadius: 20, padding: '4px 16px' }}>
          {gesetzt.map((w, i) => (
            <div key={w.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 0', borderTop: i ? '1px solid var(--pergament-edge)' : 'none' }}>
              <span style={{ flex: 'none' }}>
                <BadgeBild slug={w.slug} icon={w.icon} name={w.name} size={32} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>{w.name}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.35 }}>{w.pflicht}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      {gespeichert && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 16, background: 'var(--erfolg-bg)' }}>
          <CheckCircle size={22} weight="fill" color="var(--erfolg)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--erfolg)' }}>Pflichten gespeichert!</span>
        </div>
      )}
      {darfPflegen && (
        <button
          type="button"
          className="wn-press"
          onClick={() => { setGespeichert(false); setOffen(true); }}
          style={{ minHeight: 52, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Scroll size={18} />
          Pflichten festlegen
        </button>
      )}
    </div>
  );
}

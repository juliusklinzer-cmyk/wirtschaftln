'use client';

import { useTransition } from 'react';
import { ZeilenKarte } from '@/components/ds';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { bereichHinweisStil } from '@/components/domain/hero-stil';

export type BuchungZeile = {
  id: string;
  wer: string;
  name: string;
  folge: string;
  datum: string;
  erlassen: boolean;
  darfErlassen: boolean;
  darfZuruecknehmen: boolean;
};

/** Gebuchte Strafen der letzten 30 Tage in der Kasse, hier wird zurückgenommen und erlassen. */
export function GebuchteStrafen({ gebucht, erlassen, zuruecknehmen }: { gebucht: BuchungZeile[]; erlassen: (id: string) => Promise<boolean>; zuruecknehmen: (id: string) => Promise<boolean> }) {
  const [pending, startTransition] = useTransition();
  const knopfKlein = (farbe: string): React.CSSProperties => ({ padding: '5px 10px', borderRadius: 999, border: `1.5px solid ${farbe}`, background: 'transparent', color: farbe, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-ui)', opacity: pending ? 0.6 : 1 });
  if (gebucht.length === 0) return null;
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HoamTitel action={<span style={bereichHinweisStil}>letzte 30 Tage</span>}>Gebuchte Strafen</HoamTitel>
      <ZeilenKarte>
        {gebucht.map((b, i) => (
          <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '11px 0', borderBottom: i < gebucht.length - 1 ? '1px solid var(--ink-50)' : 'none', opacity: b.erlassen ? 0.55 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.wer} · {b.name}</span>
              <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 800, color: b.erlassen ? 'var(--ink-300)' : 'var(--strafe)', textDecoration: b.erlassen ? 'line-through' : undefined, flex: 'none' }}>{b.folge}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--ink-300)' }}>{b.datum}{b.erlassen ? ' · erlassen' : ''}</span>
              {b.darfZuruecknehmen && <button type="button" disabled={pending} onClick={() => startTransition(async () => { await zuruecknehmen(b.id); })} style={knopfKlein('var(--ink-500)')}>Zurücknehmen</button>}
              {b.darfErlassen && <button type="button" disabled={pending} onClick={() => startTransition(async () => { await erlassen(b.id); })} style={knopfKlein('var(--gold-700)')}>Erlassen</button>}
            </div>
          </div>
        ))}
      </ZeilenKarte>
    </section>
  );
}

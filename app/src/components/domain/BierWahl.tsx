'use client';

import { useState } from 'react';
import type { Bier, BierOption } from '@/lib/biersorten';

const istBier = (o: BierOption): o is Bier => 'name' in o;

/** Bier-Dropdown mit Brauerei-Logos (natives select kann keine Bilder). */
export function BierWahl({
  label,
  biere,
  value,
  onChange,
  leerLabel,
}: {
  label: string;
  biere: BierOption[];
  value: string;
  onChange: (v: string) => void;
  leerLabel?: string;
}) {
  const [offen, setOffen] = useState(false);
  const gewaehlt = biere.find((b): b is Bier => istBier(b) && b.name === value) ?? null;
  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>{label}</label>
      <button type="button" onClick={() => setOffen(!offen)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', background: 'var(--weiss)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, color: gewaehlt ? 'var(--ink-900)' : 'var(--ink-500)', textAlign: 'left' }}>
        {gewaehlt ? <BierLogo bier={gewaehlt} /> : <span style={{ width: 26, textAlign: 'center' }}>🍺</span>}
        <span style={{ flex: 1 }}>{gewaehlt?.name ?? leerLabel ?? 'Auswählen…'}</span>
        <span style={{ color: 'var(--ink-300)', fontSize: 12 }}>▼</span>
      </button>
      {offen && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 40, marginTop: 4, background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-lg)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
          {leerLabel && (
            <BierZeile aktiv={!gewaehlt} onClick={() => { onChange(''); setOffen(false); }}>
              <span style={{ width: 26, textAlign: 'center' }}>—</span>
              <span>{leerLabel}</span>
            </BierZeile>
          )}
          {biere.map((b, i) =>
            istBier(b) ? (
              <BierZeile key={b.name} aktiv={b.name === value} onClick={() => { onChange(b.name); setOffen(false); }}>
                <BierLogo bier={b} />
                <span>{b.name}</span>
              </BierZeile>
            ) : (
              <div key={`div-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--pergament)', borderTop: '1px solid var(--ink-100)', borderBottom: '1px solid var(--ink-100)' }}>
                <span style={{ flex: 1, height: 1, background: 'var(--ink-200)' }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>{b.divider}</span>
                <span style={{ flex: 1, height: 1, background: 'var(--ink-200)' }} />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function BierZeile({ aktiv, onClick, children }: { aktiv: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--ink-50)', background: aktiv ? 'var(--pergament)' : 'var(--weiss)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: aktiv ? 800 : 600, color: 'var(--ink-900)', textAlign: 'left' }}>
      {children}
      {aktiv && <span style={{ marginLeft: 'auto', color: 'var(--gold-700)', fontWeight: 800 }}>✓</span>}
    </button>
  );
}

export function BierLogo({ bier }: { bier: Bier }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={bier.logo} alt="" width={26} height={26}
      style={{ width: 26, height: 26, objectFit: 'contain', flex: 'none' }}
      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
  );
}

'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Bier, BierOption } from '@/lib/biersorten';
import { useTenantConfig } from '@/components/shell/TenantProvider';

const istBier = (o: BierOption): o is Bier => 'name' in o;
// Nur ei Bierwahl offen: geht oane auf, schließen d'anderen
const OFFEN_EVENT = 'wn-bierwahl-offen';

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
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [offen, setOffen] = useState(false);
  const [nachOben, setNachOben] = useState(false);
  const [maxH, setMaxH] = useState(300);
  const gewaehlt = biere.find((b): b is Bier => istBier(b) && b.name === value) ?? null;

  // Andere Bierwahl geht auf → diese zua
  useEffect(() => {
    const zu = (e: Event) => { if ((e as CustomEvent).detail !== id) setOffen(false); };
    window.addEventListener(OFFEN_EVENT, zu);
    return () => window.removeEventListener(OFFEN_EVENT, zu);
  }, [id]);

  // Außerhalb tippen schließt (koa Vollbild-Overlay, damit's ned's Scrollen blockiert)
  useEffect(() => {
    if (!offen) return;
    const ausserhalb = (e: Event) => { if (!wrapRef.current?.contains(e.target as Node)) setOffen(false); };
    document.addEventListener('pointerdown', ausserhalb);
    return () => document.removeEventListener('pointerdown', ausserhalb);
  }, [offen]);

  const umschalten = () => {
    if (offen) { setOffen(false); return; }
    // Richtung + Höhe nach'm verfügbaren Platz, damit's ned hinter da TabBar verschwindt
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const platzUnten = window.innerHeight - r.bottom - 96; // ~TabBar + Rand
      const platzOben = r.top - 72;
      const oben = platzUnten < 220 && platzOben > platzUnten;
      setNachOben(oben);
      setMaxH(Math.max(180, Math.min(340, oben ? platzOben : platzUnten)));
    }
    window.dispatchEvent(new CustomEvent(OFFEN_EVENT, { detail: id }));
    setOffen(true);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>{label}</label>
      <button ref={btnRef} type="button" onClick={umschalten}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', background: 'var(--weiss)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, color: gewaehlt ? 'var(--ink-900)' : 'var(--ink-500)', textAlign: 'left' }}>
        {gewaehlt ? <BierLogo bier={gewaehlt} /> : <span style={{ width: 26, textAlign: 'center' }}>🍺</span>}
        <span style={{ flex: 1 }}>{gewaehlt?.name ?? leerLabel ?? 'Auswählen…'}</span>
        <span style={{ color: 'var(--ink-300)', fontSize: 12 }}>▼</span>
      </button>
      {offen && (
        <div style={{ position: 'absolute', left: 0, right: 0, ...(nachOben ? { bottom: '100%', marginBottom: 4 } : { top: '100%', marginTop: 4 }), zIndex: 50, background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-lg)', overflow: 'hidden', maxHeight: maxH, overflowY: 'auto' }}>
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
  // Brauerei-Logos (Quelle Wikipedia) gibt's nur beim Gründer (Feature brauereiLogos), sonst nix
  const logos = useTenantConfig().features.brauereiLogos;
  if (!logos) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={bier.logo} alt="" width={26} height={26}
      style={{ width: 26, height: 26, objectFit: 'contain', flex: 'none' }}
      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
  );
}

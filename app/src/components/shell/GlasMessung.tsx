'use client';

import { useEffect, useState } from 'react';

/**
 * Glas-Leiste, vorübergehend (04.11.2026): misst am iPhone, was iOS im
 * black-translucent-Modus wirklich hergibt (Fensterhöhe, Bildschirm, Safe-Areas,
 * Tab-Leiste). Nur für Admins, verschwindet beim Antippen.
 */
export function GlasMessung() {
  const [text, setText] = useState<string | null>(null);
  const [zu, setZu] = useState(false);
  useEffect(() => {
    const sonde = document.createElement('div');
    sonde.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
    document.body.appendChild(sonde);
    const messen = () => {
      const cs = getComputedStyle(sonde);
      const nav = document.querySelector('nav')?.getBoundingClientRect();
      const vv = window.visualViewport;
      setText(
        `Fenster ${innerHeight} · Schirm ${screen.height} · VV ${vv ? Math.round(vv.height) : '-'}/${vv ? Math.round(vv.offsetTop) : '-'} · Doc ${document.documentElement.clientHeight} · oben ${parseFloat(cs.paddingTop)} unten ${parseFloat(cs.paddingBottom)} · Leiste ${nav ? `${Math.round(nav.top)}–${Math.round(nav.bottom)}` : '-'}`,
      );
    };
    messen();
    const t = setTimeout(messen, 800);
    addEventListener('resize', messen);
    return () => {
      clearTimeout(t);
      removeEventListener('resize', messen);
      sonde.remove();
    };
  }, []);
  if (!text || zu) return null;
  return (
    <button type="button" onClick={() => setZu(true)} style={{ position: 'fixed', left: 8, right: 8, top: 'calc(env(safe-area-inset-top) + 4px)', zIndex: 10001, border: 'none', borderRadius: 10, padding: '6px 10px', background: 'rgba(200,30,30,0.92)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, textAlign: 'left' }}>
      {text}
    </button>
  );
}

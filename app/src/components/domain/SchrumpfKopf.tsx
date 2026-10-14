'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ds';

/**
 * Schrumpf-Kopf: die große Urkunden-/Namenskarte scrollt normal weg, sobald
 * sie aus dem Sichtbereich ist, blendet sich stattdessen eine schmale
 * Sticky-Leiste ein. Ersetzt das alte „ganze Karte bleibt sticky", das auf
 * kleinen Handys den halben Schirm gfressen hat.
 */
export function SchrumpfKopf({
  kompakt,
  children,
  gapAusgleich = 0,
}: {
  /** Die schmale Leiste, die beim Scrollen erscheint (z. B. <MiniKopfLeiste />). */
  kompakt: React.ReactNode;
  /** Die große Karte, scrollt ganz normal mit. */
  children: React.ReactNode;
  /** Flex-gap des Eltern-Containers (px), gleicht den zusätzlichen Sticky-Anker aus. */
  gapAusgleich?: number;
}) {
  const gross = useRef<HTMLDivElement>(null);
  const [klein, setKlein] = useState(false);

  useEffect(() => {
    const el = gross.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Sichtbarkeit wird automatisch am scrollenden Vorfahren (main/Sheet) geclippt
    const io = new IntersectionObserver(([e]) => setKlein(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 20, height: 0, overflow: 'visible',
          marginTop: -gapAusgleich, pointerEvents: klein ? 'auto' : 'none',
        }}
      >
        <div
          aria-hidden={!klein}
          style={{
            opacity: klein ? 1 : 0,
            transform: klein ? 'none' : 'translateY(-10px)',
            transition: 'opacity 200ms ease, transform 200ms ease',
          }}
        >
          {kompakt}
        </div>
      </div>
      <div ref={gross}>{children}</div>
    </>
  );
}

/** Schmale Navy-Pille (Profil-Redesign 2a): Avatar, Fraktur-Name, WP rechts, plus optionaler Knopf (×). */
export function MiniKopfLeiste({
  photoUrl,
  name,
  wp,
  verein,
  rechts,
}: {
  photoUrl: string | null;
  name: string;
  wp: number;
  verein?: string | null;
  /** Extra-Element ganz rechts, z. B. der Schließen-Knopf. */
  rechts?: React.ReactNode;
  /** @deprecated ohne Wirkung, die Leiste is immer die schwebende Pille */
  schwebend?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px 8px 8px', borderRadius: 999, background: 'var(--navy)', border: '1.5px solid var(--gold)', boxShadow: '0 8px 20px rgba(12,43,90,0.25)' }}>
      <Avatar src={photoUrl} name={name} size={36} verein={verein} />
      <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-fraktur)', fontSize: 20, color: 'var(--gold-bright)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      <span className="wn-tnum" style={{ flex: 'none', fontSize: 16, fontWeight: 800, color: 'var(--gold-bright)' }}>
        {wp}<span style={{ fontSize: 10, marginLeft: 3, color: 'var(--gold)' }}>WP</span>
      </span>
      {rechts}
    </div>
  );
}

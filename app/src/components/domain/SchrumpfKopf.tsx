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

/** Schmale Navy-Leiste: kleiner Avatar, Fraktur-Name, WP rechts, plus optionaler Knopf (z. B. ×). */
export function MiniKopfLeiste({
  photoUrl,
  name,
  wp,
  verein,
  rechts,
  schwebend = false,
}: {
  photoUrl: string | null;
  name: string;
  wp: number;
  verein?: 'bayern' | 'sechzig' | null;
  /** Extra-Element ganz rechts, z. B. der Schließen-Knopf im Spezl-Sheet. */
  rechts?: React.ReactNode;
  /** true = frei schwebende Karte mit Radius + Schatten (Profil-Seite); false = bündig (Sheet-Kopf). */
  schwebend?: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--grad-navy)',
        borderRadius: schwebend ? 'var(--r-lg)' : 'var(--r-xl) var(--r-xl) 0 0',
        boxShadow: schwebend ? 'var(--sh-lg)' : 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px' }}>
        <Avatar src={photoUrl} name={name} size={28} verein={verein} />
        <span
          style={{
            flex: 1, minWidth: 0, fontFamily: 'var(--font-fraktur)', fontSize: 19,
            color: 'var(--gold-bright)', lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
        <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
          <span className="wn-tnum" style={{ fontSize: 17, fontWeight: 800, color: 'var(--gold-bright)', lineHeight: 1 }}>{wp}</span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)' }}>WP</span>
        </span>
        {rechts}
      </div>
      <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
    </div>
  );
}

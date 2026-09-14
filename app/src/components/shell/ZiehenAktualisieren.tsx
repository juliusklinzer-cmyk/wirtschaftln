'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const SCHWELLE = 64;
const MAX = 96;

/**
 * „Runterziehen zum Aktualisieren“ wia in jeder App: hängt sich an den
 * scrollenden Rahmen (das Eltern-Element, `main`) und lauscht auf Touch.
 * Ganz oben runterziehen → kleiner Kreis kommt mit, ab der Schwelle dreht
 * sich der Pfeil um, loslassen → Seite wird frisch geladen (router.refresh,
 * Server-Daten neu, Formulare bleiben). Dazu liegt ein weißer Block über
 * dem Inhalt (negativ versetzt), damit beim Überziehen oben koa anderer
 * Farbton als der Header rausschaut.
 */
export function ZiehenAktualisieren() {
  const router = useRouter();
  const anker = useRef<HTMLDivElement>(null);
  const [zug, setZug] = useState(0);
  const [laedt, startTransition] = useTransition();
  const aktiv = useRef(false);
  const startY = useRef(0);
  const zugRef = useRef(0);

  useEffect(() => {
    const scroller = anker.current?.parentElement;
    if (!scroller) return;
    const setzen = (v: number) => { zugRef.current = v; setZug(v); };
    const start = (e: TouchEvent) => {
      if (scroller.scrollTop > 0 || e.touches.length !== 1) return;
      aktiv.current = true;
      startY.current = e.touches[0].clientY;
    };
    const bewegen = (e: TouchEvent) => {
      if (!aktiv.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || scroller.scrollTop > 0) { if (zugRef.current) setzen(0); return; }
      // Gedämpft: je weiter, desto zäher, wia a Gummiband
      setzen(Math.min(MAX, dy * 0.55));
    };
    const ende = () => {
      if (!aktiv.current) return;
      aktiv.current = false;
      if (zugRef.current >= SCHWELLE) {
        setzen(SCHWELLE);
        startTransition(() => router.refresh());
      } else {
        setzen(0);
      }
    };
    scroller.addEventListener('touchstart', start, { passive: true });
    scroller.addEventListener('touchmove', bewegen, { passive: true });
    scroller.addEventListener('touchend', ende, { passive: true });
    scroller.addEventListener('touchcancel', ende, { passive: true });
    return () => {
      scroller.removeEventListener('touchstart', start);
      scroller.removeEventListener('touchmove', bewegen);
      scroller.removeEventListener('touchend', ende);
      scroller.removeEventListener('touchcancel', ende);
    };
  }, [router]);

  // Fertig geladen → Kreis wieder einziehen
  useEffect(() => {
    if (!laedt && zugRef.current === SCHWELLE && !aktiv.current) { zugRef.current = 0; setZug(0); }
  }, [laedt]);

  const sichtbar = zug > 0 || laedt;
  const fortschritt = Math.min(1, zug / SCHWELLE);

  return (
    <div ref={anker} aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 0, zIndex: 40, pointerEvents: 'none' }}>
      <style>{`
        @keyframes wnZiehDreh { to { transform: rotate(360deg); } }
      `}</style>
      {/* Überzieh-Deckung: gleicher Ton wia der Header, sitzt oberhalb vom Inhalt */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: '-100vh', height: '100vh', background: 'var(--weiss)' }} />
      <div
        style={{
          position: 'absolute', left: '50%', top: 0,
          width: 36, height: 36, borderRadius: '50%', background: 'var(--weiss)',
          boxShadow: '0 2px 10px rgba(7,25,58,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `translate(-50%, ${sichtbar ? zug + 8 : -48}px)`,
          opacity: sichtbar ? 1 : 0,
          transition: aktiv.current ? 'none' : 'transform 220ms cubic-bezier(0.23, 1, 0.32, 1), opacity 160ms ease',
        }}
      >
        {laedt ? (
          <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid var(--ink-200)', borderTopColor: 'var(--navy)', animation: 'wnZiehDreh 700ms linear infinite' }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: `rotate(${fortschritt >= 1 ? 180 : 0}deg)`, transition: 'transform 160ms ease', opacity: 0.4 + 0.6 * fortschritt }}>
            <path d="M12 4v16M5 13l7 7 7-7" />
          </svg>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const SCHWELLE = 64;
const MAX = 96;

/**
 * Liegt der Finger in einem eigenen Scroll-Bereich über `main` (Vollbild-Blatt
 * wia Spezl-Detail, Profil bearbeiten, Badge-Info)? Dann geht uns die Geste
 * nix an: Sperre und Aktualisieren gelten nur für `main` selber. Sonst wurde
 * im Spezl-Detail jeder Wisch nach oben verschluckt, solang die Rangliste
 * dahinter ganz oben stand (iPhone, 15.10.2026).
 */
function inEigenemScroller(ziel: EventTarget | null, scroller: HTMLElement): boolean {
  let el = ziel instanceof Element ? ziel : null;
  while (el && el !== scroller) {
    const s = getComputedStyle(el);
    if (s.position === 'fixed' || ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight)) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * „Runterziehen zum Aktualisieren“ wia in jeder App: hängt sich an den
 * scrollenden Rahmen (das Eltern-Element, `main`) und lauscht auf Touch.
 * Ganz oben runterziehen und ab der Schwelle loslassen → Seite wird frisch
 * geladen (router.refresh, Server-Daten neu, Formulare bleiben). Ohne
 * Anzeige, bewusst still. Die Farbe beim Überziehen kommt
 * vom Hintergrund von `main` (Navy wia der Kopf, siehe (app)/layout.tsx).
 */
export function ZiehenAktualisieren() {
  const router = useRouter();
  const pathname = usePathname();
  // Auf der Karte wird gewischt und gezogen, da soll's ned aus Versehen neu laden (Julius, 14.10.2026)
  const aus = pathname.startsWith('/karte');
  // Rang und Kasse haben koan Navy-Kopf: dort gar ned runterziehen lassen (koa Gummiband, koa
  // Blau überm hellen Inhalt), also aa koa Aktualisieren (Julius, 14.10.2026)
  const gesperrt = /^\/(spezln|kasse)(\/|$)/.test(pathname);
  const anker = useRef<HTMLDivElement>(null);
  const [laedt, startTransition] = useTransition();
  const aktiv = useRef(false);
  const startY = useRef(0);
  const zugRef = useRef(0);

  useEffect(() => {
    const scroller = anker.current?.parentElement;
    if (!scroller) return;
    const setzen = (v: number) => { zugRef.current = v; };
    // Nie auf '' setzen: des löscht das 'contain' aus dem Layout, dann reicht iOS
    // den Wisch am Ende von main an die Seite weiter und das Scrollen hängt.
    scroller.style.overscrollBehaviorY = gesperrt ? 'none' : 'contain';
    // Sperre: ganz oben nach unten ziehen wird abgefangen (nicht-passiv, damit preventDefault greift)
    const sperren = (e: TouchEvent) => {
      if (!gesperrt || scroller.scrollTop > 0 || e.touches.length !== 1 || inEigenemScroller(e.target, scroller)) return;
      if (e.touches[0].clientY - startY.current > 0 && e.cancelable) e.preventDefault();
    };
    const start = (e: TouchEvent) => {
      if (e.touches.length === 1) startY.current = e.touches[0].clientY;
      if (aus || gesperrt || scroller.scrollTop > 0 || e.touches.length !== 1 || inEigenemScroller(e.target, scroller)) return;
      aktiv.current = true;
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
    scroller.addEventListener('touchmove', sperren, { passive: false });
    scroller.addEventListener('touchmove', bewegen, { passive: true });
    scroller.addEventListener('touchend', ende, { passive: true });
    scroller.addEventListener('touchcancel', ende, { passive: true });
    return () => {
      scroller.removeEventListener('touchstart', start);
      scroller.removeEventListener('touchmove', sperren);
      scroller.removeEventListener('touchmove', bewegen);
      scroller.style.overscrollBehaviorY = 'contain';
      scroller.removeEventListener('touchend', ende);
      scroller.removeEventListener('touchcancel', ende);
    };
  }, [router, aus, gesperrt]);

  // Fertig geladen → Zug zurücksetzen
  useEffect(() => {
    if (!laedt && zugRef.current === SCHWELLE && !aktiv.current) zugRef.current = 0;
  }, [laedt]);

  // Koa Pfeil, koa Ladekreis (Julius, 14.10.2026): es wird still aktualisiert,
  // der Anker bleibt nur, damit der Scroll-Rahmen gefunden wird.
  return <div ref={anker} aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 0, pointerEvents: 'none' }} />;
}

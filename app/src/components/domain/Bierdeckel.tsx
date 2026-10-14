'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Icon, Zeile, ZeilenKarte } from '@/components/ds';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { PTS } from '@/lib/punkte';
import { hoibenStricheln, schnapsStricheln, abendFlagsSetzen, rundeSchmeissen } from '@/app/(app)/termin/actions';
import { deckelFuer, deckelKreis } from '@/lib/bierdeckel';
import { DeckelGrafik } from '@/components/domain/DeckelGrafik';

export type BierdeckelSpezl = {
  name: string;
  photoUrl: string | null;
  verein: string | null;
  hoiben: number;
  schnaps?: number;
};

export type AbendFlags = {
  taxi: boolean;
  brodn: boolean;
  kaisi: boolean;
  rundenBier: number;
  rundenSchnaps: number;
};

/** Stift-Schwarz wie auf'm echten Deckel, bewusst KEIN Design-Token, des is Tinte, ned UI. */
const TINTE = '#202226';
const MITTE = 132;
const RADIUS = 103;
/** Plätze der Fünfer-Gruppen: Hoibe unten (links → rechts), Schnaps oben (links → rechts). */
const HOIBE_WINKEL = [144, 122, 100, 78, 56, 34];
const SCHNAPS_WINKEL = [214, 238, 262, 286, 310, 334];
/** Kürzel „WB“ vor der Schnaps-Reihe, links am Rand. */
const WB_WINKEL = 190;

/**
 * Deterministisches „Zittern" (−1…1) je Strich & Merkmal, stabil über
 * SSR/Re-Render (koa Math.random, sonst springen d'Striche beim Hydrieren).
 */
function zitter(i: number, salz: number): number {
  // Reiner Ganzzahl-Hash statt Math.sin: sin rechnet in Node und im Browser
  // in den letzten Bits verschieden, dann passt's Server-HTML ned zum Client
  // (Hydration-Warnung). Mit imul kimmt überall exakt dasselbe raus.
  let h = Math.imul(Math.round(i * 1000) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(Math.round(salz * 1000) + 0x165667b1, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967296) * 2 - 1;
}

const amRand = (winkel: number, r = RADIUS) => {
  const rad = (winkel * Math.PI) / 180;
  return { x: MITTE + r * Math.cos(rad), y: MITTE + r * Math.sin(rad) };
};

/**
 * Strichgruppen (Fünfer: 4 senkrecht, der 5. quer) im Bogen am Deckelrand
 * entlang. `salz` trennt die Zitter-Muster der beiden Reihen.
 */
function Strichgruppen({ anzahl, winkel, salz }: { anzahl: number; winkel: number[]; salz: number }) {
  const gruppen: React.ReactNode[] = [];
  for (let g = 0; g * 5 < anzahl; g++) {
    const w = winkel[g % winkel.length];
    const { x: gx, y: gy } = amRand(w);
    const wg = Math.min(1, (g * 5) / 18);
    const dreh = w - 90 + zitter(g + salz, 3) * (2 + 7 * wg);
    const striche: React.ReactNode[] = [];
    for (let p = 0; p < Math.min(5, anzahl - g * 5); p++) {
      const k = g * 5 + p + salz * 100;
      const wt = Math.min(1, (g * 5 + p) / 18);
      const j = (s: number, amp: number) => zitter(k, s) * amp;
      let x1: number, y1: number, x2: number, y2: number;
      if (p < 4) {
        const x = -17 + p * 11;
        x1 = x + j(11, 0.5 + 4 * wt);
        y1 = -16 + j(12, 0.5 + 4 * wt);
        x2 = x + 1.5 + j(13, 0.5 + 5.5 * wt);
        y2 = 16 + j(14, 0.5 + 5 * wt);
      } else {
        x1 = -23 + j(11, 1 + 5 * wt);
        y1 = 11 + j(12, 1 + 5 * wt);
        x2 = 21 + j(13, 1 + 6 * wt);
        y2 = -11 + j(14, 1 + 5.5 * wt);
      }
      const cx = (x1 + x2) / 2 + j(15, 1.5 + 6.5 * wt);
      const cy = (y1 + y2) / 2 + j(16, 1 + 4 * wt);
      striche.push(
        <path
          key={k}
          d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`}
          stroke={TINTE}
          strokeWidth={+(3.3 + zitter(k, 17) * 0.5 + wt * 0.4).toFixed(2)}
          strokeLinecap="round"
          fill="none"
          opacity={+(0.9 + zitter(k, 18) * 0.08).toFixed(3)}
          className={g * 5 + p === anzahl - 1 ? 'wn-strich-neu' : undefined}
        />,
      );
    }
    gruppen.push(
      <g key={g} transform={`translate(${(gx + zitter(g + salz, 1) * (1 + 5 * wg)).toFixed(1)} ${(gy + zitter(g + salz, 2) * (1 + 5 * wg)).toFixed(1)}) rotate(${dreh.toFixed(1)})`}>
        {striche}
      </g>,
    );
  }
  return <>{gruppen}</>;
}

/**
 * „WB“ (Williams Birne) mit'm Kugelschreiber hingschrieben: koa Schrift,
 * sondern drei Stiftzüge (W in einem Zug, B-Stamm, B-Bäuche), tangential am
 * linken Rand vor der Schnaps-Reihe, Oberkante zur Mitte: an Deckel liest ma
 * von außen (Julius, 14.09.2026).
 */
function KuerzelWB() {
  const { x, y } = amRand(WB_WINKEL, RADIUS - 2);
  const zug: React.SVGProps<SVGPathElement> = {
    stroke: TINTE, strokeWidth: 2.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none', opacity: 0.9,
  };
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(WB_WINKEL - 90 + zitter(1, 21) * 3).toFixed(1)})`}>
      <path d="M -20 -10 Q -18 1 -15 10 Q -13 2 -10 -3 Q -7 2 -5 10 Q -2 0 1 -10" {...zug} />
      <path d="M 5.5 -10.5 Q 4.5 0 4 10.5" {...zug} />
      <path d="M 5 -10 Q 18 -12 17 -2.5 Q 16.5 0.5 6 0 Q 20 -0.5 19 7 Q 18 11.5 4 10" {...zug} />
    </g>
  );
}

/**
 * Handschriftlicher Stern (Pentagramm in einem Zug) für a gschmissene Runde,
 * rechts am Rand gegenüber vom „WB“. Mehrere Sterne rücken nebeneinander.
 */
function Sterne({ anzahl }: { anzahl: number }) {
  if (anzahl <= 0) return null;
  const sterne: React.ReactNode[] = [];
  for (let s = 0; s < anzahl; s++) {
    const ring = Math.floor(s / 4);
    const i = s % 4;
    const n = Math.min(4, anzahl - ring * 4);
    const winkel = (i - (n - 1) / 2) * 19;
    const { x, y } = amRand(winkel, RADIUS - 2 - ring * 24);
    const R = 13 + zitter(s, 31) * 1.4;
    const pts = [0, 1, 2, 3, 4].map((k) => {
      const a = ((-90 + 144 * k + zitter(s * 5 + k, 32) * 6) * Math.PI) / 180;
      return { x: R * Math.cos(a) + zitter(s * 5 + k, 33) * 1.2, y: R * Math.sin(a) + zitter(s * 5 + k, 34) * 1.2 };
    });
    const ende = { x: pts[0].x + zitter(s, 35) * 2.5, y: pts[0].y + 1.5 + zitter(s, 36) * 2 };
    const d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} ${pts.slice(1).map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} L ${ende.x.toFixed(1)} ${ende.y.toFixed(1)}`;
    sterne.push(
      <g key={s} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(zitter(s, 37) * 14).toFixed(1)})`}>
        <path d={d} stroke={TINTE} strokeWidth={+(3 + zitter(s, 38) * 0.4).toFixed(2)} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.9} className={s === anzahl - 1 ? 'wn-stern-neu' : undefined} />
      </g>,
    );
  }
  return <>{sterne}</>;
}

/** Alles, was mit Tinte am Deckel steht: Hoibe unten, WB + Schnaps oben, Sterne rechts, +/− als Wegweiser. */
function Tinte({ hoiben, schnaps, sterne, schnapsAn }: { hoiben: number; schnaps: number; sterne: number; schnapsAn: boolean }) {
  return (
    <svg viewBox="0 0 264 264" fill="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
      <Strichgruppen anzahl={hoiben} winkel={HOIBE_WINKEL} salz={0} />
      {schnapsAn && schnaps > 0 && <KuerzelWB />}
      {schnapsAn && <Strichgruppen anzahl={schnaps} winkel={SCHNAPS_WINKEL} salz={7} />}
      <Sterne anzahl={sterne} />
    </svg>
  );
}

/** Mini-Strichliste für d'Spezl-Zeilen, gleiche Tinte, kompakt. */
function MiniStrichliste({ anzahl }: { anzahl: number }) {
  const gruppen: number[] = [];
  for (let rest = anzahl; rest > 0; rest -= 5) gruppen.push(Math.min(5, rest));
  const ROTATION = [-4, 3, -2, 5];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
      {gruppen.map((n, gi) => (
        <svg key={gi} width={26} height={24} viewBox="0 0 46 42" fill="none" style={{ overflow: 'visible', flex: 'none' }}>
          {Array.from({ length: Math.min(4, n) }, (_, i) => (
            <line
              key={i}
              x1={8 + i * 10} y1={5} x2={9.5 + i * 10} y2={37}
              stroke={TINTE} strokeWidth={4} strokeLinecap="round"
              transform={`rotate(${ROTATION[i]} ${8 + i * 10} 21)`}
            />
          ))}
          {n >= 5 && <line x1={1} y1={33} x2={45} y2={9} stroke={TINTE} strokeWidth={4} strokeLinecap="round" />}
        </svg>
      ))}
    </div>
  );
}

type Ziel = 'hoibe' | 'weisse' | 'schnaps';

/** Ziele der Halte-und-Zieh-Geste, Winkel wia im SVG (90 = unten, 270 = oben, 180 = links). */
function zieleFuer(schnapsAn: boolean): Array<{ key: Ziel; label: string; winkel: number }> {
  // Nur wo's mehrere Getränke gibt (Schnaps-Stammtische) lohnt sich d’Geste; sonst bleibt's beim Tippen (Julius, 18.09.2026)
  if (!schnapsAn) return [];
  return [
    { key: 'hoibe', label: 'Hoibe', winkel: 90 },
    { key: 'schnaps', label: 'Schnaps', winkel: 270 },
    { key: 'weisse', label: 'Weiße', winkel: 180 },
  ];
}

/**
 * Stift-Ton: a kurzer, gefilterter Rausch-Kratzer (~130 ms), wia a Kugelschreiber
 * aufm Karton. Koa Datei, alles aus'm AudioContext, drum aa offline.
 */
function stiftTon(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const dauer = 0.14;
    const puffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dauer), ctx.sampleRate);
    const daten = puffer.getChannelData(0);
    for (let i = 0; i < daten.length; i++) daten[i] = (Math.random() * 2 - 1) * (1 - i / daten.length);
    const quelle = ctx.createBufferSource();
    quelle.buffer = puffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(2600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + dauer);
    const laut = ctx.createGain();
    laut.gain.setValueAtTime(0.0001, ctx.currentTime);
    laut.gain.exponentialRampToValueAtTime(0.32, ctx.currentTime + 0.012);
    laut.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dauer);
    quelle.connect(filter).connect(laut).connect(ctx.destination);
    quelle.start();
    quelle.stop(ctx.currentTime + dauer);
  } catch { /* koa Ton, aa guad */ }
}

/**
 * Plopp: Bügelverschluss auf (freesound, Julius 14.10.2026), kommt bei jeder
 * Hoibe, die dazukommt. Eine Audio-Instanz, von vorn abgespielt; muss aus
 * einer Berührung heraus starten, drum liegt der Aufruf direkt im Tipp-Handler.
 */
let ploppAudio: HTMLAudioElement | null = null;
function ploppTon() {
  try {
    if (!ploppAudio) { ploppAudio = new Audio('/sounds/plopp.mp3'); ploppAudio.preload = 'auto'; }
    ploppAudio.currentTime = 0;
    void ploppAudio.play().catch(() => { /* koa Ton, aa guad */ });
  } catch { /* koa Ton, aa guad */ }
}

const TIPP_KEY = 'wn-deckel-tipp-gsehn';

/**
 * Dei Bierdeckel, Strichliste wie im Wirtshaus. Am Stammtisch-Abend strichelt
 * jeder Spezl für sich, und zwar direkt am Deckel, ohne Knöpfe drauf:
 * rechts tippen = a Strich dazu, links tippen = oaner weg; untere Hälfte
 * Hoibe, obere Hälfte Schnaps (mit „WB“ als Kürzel, wenn der Stammtisch
 * schnapselt). Am Deckel steht nur, was mit Tinte hingschrieben aussieht.
 * Drunter d'Marken vom Abend (Taxler, Runde; Brodn/Schmarrn kommen mit der
 * Bewertung); a gschmissene
 * Runde kriegt an Stern am Deckel und bei allen am Tisch an Strich.
 */
export function Bierdeckel({
  terminId,
  biersorte = null,
  initialHoiben,
  initialWeissbier = 0,
  initialSchnaps = 0,
  schnapsAn = false,
  initialFlags,
  spezln,
  rundenErlaubt = true,
  kopf = null,
  kopfKurz = 'Heute',
}: {
  terminId: string;
  /** Helles vom Wirtshaus → passender Deckel (Augustiner-Scan, Brauerei-Deckel oder neutral) */
  biersorte?: string | null;
  initialHoiben: number;
  /** davon Weißbier (in initialHoiben enthalten) */
  initialWeissbier?: number;
  initialSchnaps?: number;
  /** Feature schnaps: obere Deckelhälfte zählt Schnaps, Schnaps-Runde möglich */
  schnapsAn?: boolean;
  /** Eigene Abend-Marken (Taxler, Brodn, Schmarrn, Runden) */
  initialFlags?: AbendFlags;
  /** Die anderen am Tisch mit ihrem aktuellen Strich-Stand (nur > 0). */
  spezln: BierdeckelSpezl[];
  /** false = Deckel im Nachtrag (a Woch’ nach’m Abschluss): eigene Sachen richten ja, Runde schmeißen nimmer */
  rundenErlaubt?: boolean;
  /** Kopf der Tisch-Karte (Eyebrow, Wirtshaus, Adresse, Navigation), kommt von der Seite */
  kopf?: React.ReactNode;
  /** Kurze Zeile fürs Vollbild („Heute · Am Hart“) */
  kopfKurz?: string;
}) {
  const router = useRouter();
  const [hoiben, setHoiben] = useState(initialHoiben);
  const [weissbier, setWeissbier] = useState(initialWeissbier);
  const [schnaps, setSchnaps] = useState(initialSchnaps);
  // Halte-und-Zieh-Geste: Deckel gedrückt halten → Ziele erscheinen, Richtung ziehen, am Rand raus = Strich
  const [halten, setHalten] = useState(false);
  const [ziel, setZiel] = useState<Ziel | null>(null);
  const [flags, setFlags] = useState<AbendFlags>(initialFlags ?? { taxi: false, brodn: false, kaisi: false, rundenBier: 0, rundenSchnaps: 0 });
  const [rundeWahl, setRundeWahl] = useState(false);
  const [status, setStatus] = useState<'still' | 'speichert' | 'gspeichert'>('still');
  const [fehler, setFehler] = useState<string | null>(null);
  const [tipp, setTipp] = useState(false);
  // Info-Layer übern Deckel (oben Schnaps, unten Bier, links weg, rechts dazu) + Vollbild für späte Stunden
  const [info, setInfo] = useState(false);
  const [voll, setVoll] = useState(false);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schnapsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Aktuellster Stand für die verzögerte Speicherung (schnelle Tipps hintereinander zählen alle)
  const hoibenRef = useRef(initialHoiben);
  const weissbierRef = useRef(initialWeissbier);
  const schnapsRef = useRef(initialSchnaps);
  const deckel = deckelFuer(biersorte);
  const kreis = deckelKreis(deckel);
  const deckelRef = useRef<HTMLButtonElement>(null);
  const geste = useRef<{ pointerId: number | null; startX: number; startY: number; startZeit: number; timer: ReturnType<typeof setTimeout> | null; aktiv: boolean; bewegt: boolean; ziel: Ziel | null }>({ pointerId: null, startX: 0, startY: 0, startZeit: 0, timer: null, aktiv: false, bewegt: false, ziel: null });
  const audio = useRef<AudioContext | null>(null);

  // Frischer Stand vom Server (z. B. nach einer Runde von wem anders) → übernehmen
  useEffect(() => { setHoiben(initialHoiben); hoibenRef.current = initialHoiben; }, [initialHoiben]);
  useEffect(() => { setWeissbier(initialWeissbier); weissbierRef.current = initialWeissbier; }, [initialWeissbier]);
  useEffect(() => { setSchnaps(initialSchnaps); schnapsRef.current = initialSchnaps; }, [initialSchnaps]);
  useEffect(() => { if (initialFlags) setFlags(initialFlags); }, [initialFlags]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (schnapsTimer.current) clearTimeout(schnapsTimer.current);
  }, []);
  // Einmaliger Tipp, wie der Deckel bedient wird (bis zum ersten Tippen)
  useEffect(() => {
    try { if (!localStorage.getItem(TIPP_KEY)) setTipp(true); } catch { /* egal */ }
  }, []);

  const melden = (ergebnis: { ok: true } | { ok: false; meldung: string }) => {
    if (ergebnis.ok) {
      setFehler(null);
      setStatus('gspeichert');
      router.refresh(); // damit aa die anderen Deckel am Tisch frisch sind
    } else {
      setStatus('still');
      setFehler(ergebnis.meldung);
    }
  };

  // Kurz sammeln, dann speichern, schnelles Nachstricheln hämmert so nicht den Server.
  const hoibeAendern = (delta: number, weisse = false) => {
    const neu = Math.max(0, Math.min(30, hoibenRef.current + delta));
    if (neu === hoibenRef.current) return;
    hoibenRef.current = neu;
    if (delta > 0) ploppTon(); // Bügelverschluss auf: a Hoibe dazu
    // Weißbier-Anteil: a Weiße dazu zählt mit, beim Wegnehmen nie mehr Weiße als Hoibe
    weissbierRef.current = Math.max(0, Math.min(neu, weissbierRef.current + (weisse && delta > 0 ? 1 : 0)));
    setHoiben(neu);
    setWeissbier(weissbierRef.current);
    if (timer.current) clearTimeout(timer.current);
    setStatus('speichert');
    const weissbierNeu = weissbierRef.current;
    timer.current = setTimeout(() => startTransition(async () => melden(await hoibenStricheln(terminId, neu, weissbierNeu))), 600);
  };
  const schnapsAendern = (delta: number) => {
    const neu = Math.max(0, Math.min(30, schnapsRef.current + delta));
    if (neu === schnapsRef.current) return;
    schnapsRef.current = neu;
    setSchnaps(neu);
    if (schnapsTimer.current) clearTimeout(schnapsTimer.current);
    setStatus('speichert');
    schnapsTimer.current = setTimeout(() => startTransition(async () => melden(await schnapsStricheln(terminId, neu))), 600);
  };

  const tippGsehn = () => {
    if (!tipp) return;
    setTipp(false);
    try { localStorage.setItem(TIPP_KEY, '1'); } catch { /* egal */ }
  };

  /** Strich fürs Ziel: Hoibe / Weiße (aa a Hoibe) / Schnaps */
  const strichSetzen = (z: Ziel) => {
    if (z === 'schnaps') schnapsAendern(1);
    else hoibeAendern(1, z === 'weisse');
  };

  /**
   * Vier Zonen am Deckel (kurzer Tipp): rechts dazu, links weg; oben Schnaps,
   * unten Hoibe (ohne Schnaps-Feature zählt der ganze Deckel Hoibe).
   */
  const zonenTipp = (clientX: number, clientY: number) => {
    const rect = deckelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const delta = x >= 0.5 ? 1 : -1;
    try { navigator.vibrate?.(delta > 0 ? 10 : [6, 30, 6]); } catch { /* egal */ }
    if (schnapsAn && y < 0.5) schnapsAendern(delta);
    else hoibeAendern(delta);
  };

  /** Welches Ziel liegt in der Zieh-Richtung? (Winkel wia im SVG: 0 rechts, 90 unten, 270 oben) */
  const zielFuer = (clientX: number, clientY: number): { ziel: Ziel | null; draussen: boolean; entschieden: boolean } => {
    const rect = deckelRef.current?.getBoundingClientRect();
    if (!rect) return { ziel: null, draussen: false, entschieden: false };
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // Abstand relativ zum echten Deckelrand (Kreis kann a bisserl kleiner sein als das Feld)
    const abstand = Math.hypot(dx, dy) / (rect.width * kreis.r / 100);
    if (abstand < 0.22) return { ziel: null, draussen: false, entschieden: false };
    const winkel = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const ziele = zieleFuer(schnapsAn);
    let best: Ziel | null = null;
    let bestDiff = 999;
    for (const z of ziele) {
      const diff = Math.min(Math.abs(winkel - z.winkel), 360 - Math.abs(winkel - z.winkel));
      if (diff < bestDiff) { bestDiff = diff; best = z.key; }
    }
    return { ziel: bestDiff <= 58 ? best : null, draussen: abstand >= 0.96, entschieden: abstand >= 0.55 };
  };

  const gesteEnde = () => {
    const g = geste.current;
    if (g.timer) { clearTimeout(g.timer); g.timer = null; }
    if (g.pointerId != null) {
      try { deckelRef.current?.releasePointerCapture(g.pointerId); } catch { /* egal */ }
    }
    g.pointerId = null;
    g.aktiv = false;
    g.ziel = null;
    setHalten(false);
    setZiel(null);
  };

  const zeigerRunter = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = geste.current;
    if (g.pointerId != null) return; // Multi-Touch: der erste Finger zählt
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    tippGsehn();
    g.pointerId = e.pointerId;
    g.startX = e.clientX;
    g.startY = e.clientY;
    g.startZeit = performance.now();
    g.bewegt = false;
    g.aktiv = false;
    g.ziel = null;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* egal */ }
    audioBereit();
    // Halten: nach 260 ms ohne Bewegung wird der Deckel unscharf und d'Ziele kommen (nur mit mehreren Getränken)
    if (zieleFuer(schnapsAn).length === 0) return;
    g.timer = setTimeout(() => {
      g.timer = null;
      if (g.pointerId == null || g.bewegt) return;
      g.aktiv = true;
      setHalten(true);
      try { navigator.vibrate?.(8); } catch { /* egal */ }
    }, 260);
  };

  const zeigerBewegt = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = geste.current;
    if (e.pointerId !== g.pointerId) return;
    if (!g.aktiv) {
      // Vor dem Halten: a bisserl Bewegung is Scrollen, koa Tipp und koa Halten mehr
      if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 10) {
        g.bewegt = true;
        if (g.timer) { clearTimeout(g.timer); g.timer = null; }
      }
      return;
    }
    const { ziel: z, draussen } = zielFuer(e.clientX, e.clientY);
    if (z !== g.ziel) { g.ziel = z; setZiel(z); }
    // Über den Rand raus in Richtung Ziel → Strich, Stift-Ton, fertig
    if (draussen && z) {
      strichSetzen(z);
      if (z === 'schnaps') stiftTon(audio.current); // Hoibe ploppt scho in hoibeAendern
      try { navigator.vibrate?.(12); } catch { /* egal */ }
      gesteEnde();
    }
  };

  const zeigerHoch = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = geste.current;
    if (e.pointerId !== g.pointerId) return;
    const kurz = !g.aktiv && !g.bewegt && performance.now() - g.startZeit < 400;
    // Beim Halten losgelassen: wenn der Daumen scho deutlich Richtung Ziel gezogen war, zählt's aa
    const zug = g.aktiv ? zielFuer(e.clientX, e.clientY) : null;
    gesteEnde();
    if (kurz) { zonenTipp(e.clientX, e.clientY); return; }
    if (zug?.ziel && zug.entschieden) {
      strichSetzen(zug.ziel);
      if (zug.ziel === 'schnaps') stiftTon(audio.current);
      try { navigator.vibrate?.(12); } catch { /* egal */ }
    }
  };

  const zeigerWeg = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerId !== geste.current.pointerId) return;
    gesteEnde();
  };

  // Solang gehalten wird, derf der Finger den Bildschirm ned scrollen (touchmove abfangen,
  // ned-passiv). Vorher bleibt Scrollen erlaubt, drum koa touch-action: none.
  useEffect(() => {
    const el = deckelRef.current;
    if (!el) return;
    const halt = (ev: TouchEvent) => { if (geste.current.aktiv && ev.cancelable) ev.preventDefault(); };
    el.addEventListener('touchmove', halt, { passive: false });
    return () => el.removeEventListener('touchmove', halt);
  }, []);

  const audioBereit = () => {
    try {
      if (!audio.current) {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) audio.current = new Ctx();
      }
      if (audio.current?.state === 'suspended') void audio.current.resume();
    } catch { /* koa Ton, aa guad */ }
  };

  const bewegungReduziert = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const flagUmschalten = (key: 'taxi' | 'brodn' | 'kaisi') => {
    const neu = { ...flags, [key]: !flags[key] };
    setFlags(neu);
    setStatus('speichert');
    startTransition(async () => melden(await abendFlagsSetzen(terminId, { taxi: neu.taxi, brodn: neu.brodn, kaisi: neu.kaisi })));
  };
  const runde = (art: 'bier' | 'schnaps') => {
    setRundeWahl(false);
    setFlags((f) => ({ ...f, rundenBier: f.rundenBier + (art === 'bier' ? 1 : 0), rundenSchnaps: f.rundenSchnaps + (art === 'schnaps' ? 1 : 0) }));
    // Die eigene Reihe wächst gleich mit, der Rest vom Tisch kommt per refresh
    if (art === 'bier') { hoibenRef.current = Math.min(30, hoibenRef.current + 1); setHoiben(hoibenRef.current); }
    else { schnapsRef.current = Math.min(30, schnapsRef.current + 1); setSchnaps(schnapsRef.current); }
    setStatus('speichert');
    startTransition(async () => melden(await rundeSchmeissen(terminId, art)));
  };

  const rundenGesamt = flags.rundenBier + flags.rundenSchnaps;
  const statusText = status === 'speichert' ? 'Speichert …' : status === 'gspeichert' ? '✓ Gespeichert' : '';
  const statusFarbe = status === 'gspeichert' ? '#7FD3A0' : 'rgba(246,240,226,0.7)';
  const amTisch = spezln.length + 1;
  const rundKnopf: React.CSSProperties = {
    width: 38, height: 38, flex: 'none', borderRadius: '50%', padding: 0, cursor: 'pointer',
    border: '1.5px solid rgba(246,240,226,0.35)', background: 'rgba(255,255,255,0.1)', color: 'var(--pergament)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  };
  const schnapsAnzeigen = schnapsAn;

  /* Der Deckel selbst: Pappe + Tinte, leicht schräg wia hinglegt, Schatten drunter. Koa Knopf drauf,
     bedient wird durch Tippen (und Halten + Ziehen); Info-Layer und Tipp-Kreise liegen drüber. */
  const deckelBlock = (gross: boolean) => (
    <div style={{ position: 'relative', width: gross ? 'min(92vw, 400px)' : 'min(calc(100% + 24px), 352px)', aspectRatio: '1 / 1', alignSelf: 'center', margin: gross ? 0 : '0 -12px', flex: 'none' }}>
      <div aria-hidden style={{ position: 'absolute', left: `${kreis.cx - kreis.r}%`, top: `${kreis.cy - kreis.r}%`, width: `${2 * kreis.r}%`, height: `${2 * kreis.r}%`, borderRadius: '50%', boxShadow: '0 18px 30px rgba(0,0,0,0.45), 0 3px 6px rgba(0,0,0,0.3)' }} />
      <button
        ref={deckelRef}
        type="button"
        onPointerDown={zeigerRunter}
        onPointerMove={zeigerBewegt}
        onPointerUp={zeigerHoch}
        onPointerCancel={zeigerWeg}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hoibeAendern(1); } }}
        aria-label={schnapsAn ? 'Bierdeckel: unten Bier, oben Schnaps; rechts dazu, links weg. Halten und ziehen für Bier, Weiße oder Schnaps.' : 'Bierdeckel: rechts a Bier dazu, links oans weg.'}
        className="wn-bierdeckel"
        style={{
          width: '100%', height: '100%', display: 'block', position: 'relative', padding: 0, border: 'none',
          background: 'transparent', cursor: 'pointer', borderRadius: '50%',
          WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none',
        }}
      >
        {/* Beim Halten wird der Deckel unscharf und a bisserl kleiner, d'Ziele liegen scharf drüber */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          filter: halten && !bewegungReduziert ? 'blur(2.5px)' : 'none',
          transform: `rotate(-6deg) scale(${halten && !bewegungReduziert ? 0.985 : 1})`,
          transition: 'filter 180ms cubic-bezier(0.23, 1, 0.32, 1), transform 180ms cubic-bezier(0.23, 1, 0.32, 1)',
        }}>
          <DeckelGrafik deckel={deckel} />
          <Tinte hoiben={hoiben} schnaps={schnaps} sterne={rundenGesamt} schnapsAn={schnapsAn} />
        </div>
        {zieleFuer(schnapsAn).map((z, i) => {
          const rad = (z.winkel * Math.PI) / 180;
          const an = ziel === z.key;
          return (
            <span
              key={z.key}
              aria-hidden
              style={{
                position: 'absolute', left: `${50 + 40 * Math.cos(rad)}%`, top: `${50 + 40 * Math.sin(rad)}%`,
                transform: `translate(-50%, -50%) scale(${halten ? (an ? 1.08 : 1) : 0.94})`,
                opacity: halten ? 1 : 0,
                transition: `transform 160ms cubic-bezier(0.23, 1, 0.32, 1) ${halten ? i * 40 : 0}ms, opacity 140ms ease ${halten ? i * 40 : 0}ms, background 120ms ease, border-color 120ms ease`,
                padding: '7px 13px', borderRadius: 'var(--r-pill)',
                background: an ? 'var(--grad-gold)' : 'rgba(246,240,226,0.94)',
                border: an ? '1.5px solid var(--gold-700)' : '1.5px solid rgba(32,34,38,0.35)',
                boxShadow: an ? 'var(--sh-gold)' : '0 2px 8px rgba(30,28,24,0.18)',
                fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, letterSpacing: '0.01em',
                color: an ? 'var(--navy-900)' : TINTE, whiteSpace: 'nowrap', pointerEvents: 'none',
              }}
            >
              {z.label}
            </span>
          );
        })}
      </button>

      {/* Tipp-Kreise am Rand, bis zum ersten Strich */}
      {tipp && !info && (
        <>
          <span aria-hidden style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(7,25,58,0.75)', border: '1.5px solid rgba(246,240,226,0.4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--pergament)', pointerEvents: 'none' }}>−</span>
          <span aria-hidden style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--navy-900)', pointerEvents: 'none' }}>+</span>
        </>
      )}

      {/* Info-Layer (4h): legt die Bedienung übern Deckel, Tipp irgendwo schließt */}
      {info && (
        <div
          role="button"
          aria-label="Erklärung schließen"
          onClick={(e) => { e.stopPropagation(); setInfo(false); }}
          style={{ position: 'absolute', inset: '4%', borderRadius: '50%', overflow: 'hidden', display: 'grid', gridTemplateRows: schnapsAnzeigen ? '1fr 1fr' : '1fr', zIndex: 3, cursor: 'pointer' }}
        >
          {schnapsAnzeigen && (
            <div style={{ background: 'rgba(7,25,58,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--pergament)', borderBottom: '2px dashed rgba(230,198,132,0.8)' }}>
              <Icon name="wine" size={24} color="var(--gold-bright)" />
              <span style={{ fontSize: 18, fontWeight: 800 }}>Schnaps</span>
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>obere Hälfte</span>
            </div>
          )}
          <div style={{ background: 'rgba(0,74,137,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--pergament)' }}>
            <Icon name="beer" size={24} color="var(--gold-bright)" />
            <span style={{ fontSize: 18, fontWeight: 800 }}>Bier</span>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{schnapsAnzeigen ? 'untere Hälfte' : 'der ganze Deckel'}</span>
          </div>
          <span style={{ position: 'absolute', left: '9%', top: '50%', transform: 'translateY(-50%)', padding: '5px 10px', borderRadius: 999, background: 'var(--pergament)', color: 'var(--navy)', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>− weg</span>
          <span style={{ position: 'absolute', right: '9%', top: '50%', transform: 'translateY(-50%)', padding: '5px 10px', borderRadius: 999, background: 'var(--gold)', color: 'var(--navy-900)', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>+ dazu</span>
        </div>
      )}
    </div>
  );

  /* Zahlen unterm Deckel: Bier in Gold, Schnaps in Pergament */
  const zahlen = (gross: boolean) => (
    <div style={{ display: 'flex', gap: gross ? 40 : 28, alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span key={`h${hoiben}`} className="wn-tnum wn-hoiben-pop" style={{ fontSize: gross ? 56 : 40, fontWeight: 800, lineHeight: 1, color: 'var(--gold-bright)', letterSpacing: '-0.02em' }}>{hoiben}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.7)' }}>
          Bier{weissbier > 0 ? ` · ${weissbier} Weiße` : ''}
        </span>
      </div>
      {schnapsAnzeigen && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span key={`s${schnaps}`} className="wn-tnum wn-hoiben-pop" style={{ fontSize: gross ? 56 : 40, fontWeight: 800, lineHeight: 1, color: 'var(--pergament)', letterSpacing: '-0.02em' }}>{schnaps}</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.7)' }}>Schnaps</span>
        </div>
      )}
    </div>
  );

  const rundeKnopfVoll = (rundenErlaubt || rundenGesamt > 0) && (
    <button
      type="button"
      className="wn-press"
      disabled={!rundenErlaubt}
      onClick={() => setRundeWahl(true)}
      style={{
        marginTop: 8, height: 52, padding: '0 22px', borderRadius: 999, cursor: rundenErlaubt ? 'pointer' : 'default',
        border: `1.5px solid ${rundenGesamt > 0 ? 'var(--gold-700)' : 'rgba(246,240,226,0.35)'}`,
        background: rundenGesamt > 0 ? 'var(--grad-gold)' : 'rgba(255,255,255,0.1)',
        color: rundenGesamt > 0 ? 'var(--navy-900)' : 'var(--pergament)',
        display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800,
      }}
    >
      <Icon name="star" size={20} />
      {rundenGesamt > 0 ? `Runde ×${rundenGesamt}${rundenErlaubt ? ' · noch eine?' : ''}` : 'Runde schmeißen'}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @keyframes wnStrichZiehen { to { stroke-dashoffset: 0; } }
        .wn-strich-neu { stroke-dasharray: 60; stroke-dashoffset: 60; animation: wnStrichZiehen 240ms cubic-bezier(0.32, 0.72, 0, 1) 40ms forwards; }
        .wn-stern-neu { stroke-dasharray: 140; stroke-dashoffset: 140; animation: wnStrichZiehen 480ms cubic-bezier(0.32, 0.72, 0, 1) 40ms forwards; }
        @keyframes wnHoibenPop { 0% { transform: scale(0.6); } 60% { transform: scale(1.18); } 100% { transform: scale(1); } }
        .wn-hoiben-pop { display: inline-block; animation: wnHoibenPop 320ms cubic-bezier(0.34, 1.56, 0.64, 1); }
        .wn-bierdeckel { outline: none; }
        .wn-bierdeckel:focus-visible { outline: 3px solid var(--muc-blau); outline-offset: 6px; }
      `}</style>

      {/* Der Tisch: dunkle Karte mit Rautenband; im Vollbild derselbe Tisch über der ganzen App */}
      <div
        style={
          voll
            ? { position: 'fixed', inset: 0, zIndex: 70, maxWidth: 'var(--container-app)', margin: '0 auto', background: 'radial-gradient(120% 80% at 50% 45%, #1B4C8A 0%, #0C2B5A 52%, #07193A 100%)', color: 'var(--pergament)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 'calc(16px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom))' }
            : { borderRadius: 'var(--r-lg)', background: 'var(--grad-navy)', color: 'var(--pergament)', border: '1.5px solid var(--gold)', boxShadow: 'var(--sh-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }
        }
      >
        {voll ? (
          <>
            <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kopfKurz}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: statusFarbe, minHeight: 16 }}>{statusText}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                <button type="button" aria-label="Bedienung erklären" onClick={() => setInfo((i) => !i)} style={rundKnopf}><Icon name="info" size={19} /></button>
                <button type="button" aria-label="Vollbild schließen" onClick={() => { setVoll(false); setInfo(false); }} style={rundKnopf}><Icon name="x" size={19} /></button>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>{deckelBlock(true)}</div>
            {zahlen(true)}
            {rundeKnopfVoll}
          </>
        ) : (
          <>
            <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />
            <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {kopf}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: -6 }}>
                <button type="button" aria-label="Bedienung erklären" onClick={() => setInfo((i) => !i)} style={rundKnopf}><Icon name="info" size={19} /></button>
                <button type="button" aria-label="Deckel im Vollbild" onClick={() => setVoll(true)} style={rundKnopf}><Icon name="arrows-out" size={19} /></button>
              </div>
              {deckelBlock(false)}
              {zahlen(false)}
              <span className="wn-tnum" style={{ alignSelf: 'center', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(246,240,226,0.7)', minHeight: 16 }}>
                {tipp ? 'Rechts tippen: Strich dazu · links: einer weg' : schnapsAnzeigen ? 'Unten Bier, oben Schnaps' : ''}
                {statusText && <>{tipp || schnapsAnzeigen ? ' · ' : ''}<span style={{ color: statusFarbe }}>{statusText}</span></>}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Taxler + Runde: zwei Knöpfe unterm Tisch (Brodn/Schmarrn kommen mit der Wertung) */}
      <div style={{ display: 'grid', gridTemplateColumns: rundenErlaubt || rundenGesamt > 0 ? '1fr 1fr' : '1fr', gap: 8 }}>
        <button
          type="button"
          className="wn-press"
          aria-pressed={flags.taxi}
          onClick={() => flagUmschalten('taxi')}
          style={{
            minHeight: 56, borderRadius: 16, cursor: 'pointer', padding: '0 14px', textAlign: 'left',
            border: `1.5px solid ${flags.taxi ? 'var(--gold)' : 'var(--ink-200)'}`,
            background: flags.taxi ? 'var(--pergament)' : 'var(--weiss)', color: flags.taxi ? 'var(--gold-700)' : 'var(--ink-500)',
            display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800,
          }}
        >
          <Icon name="taxi" size={22} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <span>Taxler</span>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, whiteSpace: 'nowrap' }}>{flags.taxi ? `Du fährst · +${PTS.taxi} WP` : 'Fährst du heute?'}</span>
          </span>
        </button>
        {(rundenErlaubt || rundenGesamt > 0) && (
          <button
            type="button"
            className="wn-press"
            disabled={!rundenErlaubt}
            onClick={() => setRundeWahl(true)}
            style={{
              minHeight: 56, borderRadius: 16, cursor: rundenErlaubt ? 'pointer' : 'default', padding: '0 14px', textAlign: 'left',
              border: `1.5px solid ${rundenGesamt > 0 ? 'var(--gold)' : 'var(--ink-200)'}`,
              background: rundenGesamt > 0 ? 'var(--pergament)' : 'var(--weiss)', color: rundenGesamt > 0 ? 'var(--gold-700)' : 'var(--ink-500)',
              display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800,
            }}
          >
            <Icon name="star" size={22} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span>{rundenGesamt > 0 ? `Runde ×${rundenGesamt}` : 'Runde'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, whiteSpace: 'nowrap' }}>{rundenErlaubt ? 'für alle am Tisch' : 'gschmissen'}</span>
            </span>
          </button>
        )}
      </div>

      {fehler && (
        <div style={{ padding: '8px 12px', borderRadius: 'var(--r-md)', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', fontSize: 12, fontWeight: 700, color: 'var(--strafe)', textAlign: 'center' }}>
          {fehler}
        </div>
      )}

      {/* De anderen am Tisch */}
      {spezln.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HoamTitel action={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>{spezln.length} {spezln.length === 1 ? 'strichelt' : 'strichln'}</span>}>Am Tisch</HoamTitel>
          <ZeilenKarte>
            {[...spezln].sort((a, b) => b.hoiben - a.hoiben || (b.schnaps ?? 0) - (a.schnaps ?? 0)).map((s, i, arr) => (
              <Zeile
                key={s.name}
                kachel={<Avatar src={s.photoUrl} name={s.name} size={34} verein={s.verein} />}
                titel={s.name}
                untertitel={schnapsAnzeigen ? `${s.schnaps ?? 0} Schnaps` : null}
                chip={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                    <MiniStrichliste anzahl={s.hoiben} />
                    <span className="wn-tnum" style={{ width: 24, textAlign: 'right', fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{s.hoiben}</span>
                  </span>
                }
                pfeil={false}
                letzte={i === arr.length - 1}
              />
            ))}
          </ZeilenKarte>
        </section>
      )}

      {/* Runde schmeißen: Sheet von unten (2g) */}
      {rundeWahl && (
        <>
          <div onClick={() => setRundeWahl(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(7,25,58,0.5)' }} />
          <div
            role="dialog"
            aria-label="Runde schmeißen"
            className="wn-sheet-auf"
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 81, maxWidth: 'var(--container-app)', margin: '0 auto', background: 'var(--ink-50)', borderRadius: '28px 28px 0 0', padding: '10px 16px calc(24px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <span style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 999, background: 'var(--ink-200)' }} />
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, lineHeight: 1, color: 'var(--navy)', padding: '0 4px' }}>Runde schmeißen</span>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)', padding: '0 4px' }}>
              Bei allen am Tisch kommt ein Strich dazu, bei dir ein Stern. Rausnehmen geht nur beim Abschluss.
            </span>
            <ZeilenKarte>
              <Zeile
                kachel={<span style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: 'var(--pergament)', color: 'var(--gold-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="beer" size={19} /></span>}
                titel="Bier-Runde"
                untertitel={`${amTisch} Bier · +${PTS.runde} WP für dich`}
                onClick={() => runde('bier')}
                letzte={!schnapsAn}
              />
              {schnapsAn && (
                <Zeile
                  kachel={<span style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: 'var(--pergament)', color: 'var(--gold-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="wine" size={19} /></span>}
                  titel="Schnaps-Runde"
                  untertitel={`${amTisch} Stamperl · +${PTS.runde} WP für dich`}
                  onClick={() => runde('schnaps')}
                  letzte
                />
              )}
            </ZeilenKarte>
            <button type="button" className="wn-press" onClick={() => setRundeWahl(false)} style={{ height: 48, borderRadius: 'var(--r-md)', border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
              Doch nicht
            </button>
          </div>
        </>
      )}
    </div>
  );
}

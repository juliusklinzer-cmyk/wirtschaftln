'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ds';
import { hoibenStricheln } from '@/app/(app)/termin/actions';

export type BierdeckelSpezl = {
  name: string;
  photoUrl: string | null;
  verein: 'bayern' | 'sechzig' | null;
  hoiben: number;
};

/** Stift-Schwarz wie auf'm echten Deckel, bewusst KEIN Design-Token, des is Tinte, ned UI. */
const TINTE = '#202226';

/**
 * Deterministisches „Zittern" (−1…1) je Strich & Merkmal, stabil über
 * SSR/Re-Render (koa Math.random, sonst springen d'Striche beim Hydrieren).
 */
function zitter(i: number, salz: number): number {
  const x = Math.sin(i * 127.1 + salz * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * D'Striche am Deckel, schwarz wie mit'm Stift hingekritzelt (Vorlage:
 * „Wirtschaftln Logo 2 (1).png"): leichte Bögen statt gerader Linien, Druck &
 * Deckung schwanken, und je mehr Hoibe scho drauf san, desto krummer wird der
 * nächste Strich (ab ~18 volle Schräglage). Fünfergruppen wie im Wirtshaus:
 * 4 senkrecht, der 5. quer durch. Die Gruppen wandern IM BOGEN am Deckelrand
 * entlang (unten links anfangend, radial gedreht, quer übern blauen Ring) —
 * der neueste Strich wird „gezogen" (dashoffset-Animation).
 */
function KritzelStriche({ anzahl }: { anzahl: number }) {
  // Gruppen-Plätze als Winkel am Rand-Ring (viewBox 264×264, Zentrum 132/132,
  // Ring-Radius ~103): von links unten übern unteren Rand nach rechts.
  const WINKEL = [150, 126, 102, 78, 54, 30];
  const RADIUS = 103;
  const gruppen: React.ReactNode[] = [];
  for (let g = 0; g * 5 < anzahl; g++) {
    const winkel = WINKEL[g % WINKEL.length];
    const rad = (winkel * Math.PI) / 180;
    const gx = 132 + RADIUS * Math.cos(rad);
    const gy = 132 + RADIUS * Math.sin(rad);
    const wg = Math.min(1, (g * 5) / 18);
    // Grundausrichtung: Striche stehen radial (senkrecht zum Rand) + Zittern
    const dreh = winkel - 90 + zitter(g, 3) * (2 + 7 * wg);
    const striche: React.ReactNode[] = [];
    for (let p = 0; p < Math.min(5, anzahl - g * 5); p++) {
      const k = g * 5 + p; // globaler Strich-Index → so wird jeder spätere Strich zittriger
      const w = Math.min(1, k / 18);
      const j = (salz: number, amp: number) => zitter(k, salz) * amp;
      let x1: number, y1: number, x2: number, y2: number;
      if (p < 4) {
        // Lokale Koordinaten: Gruppe zentriert um (0,0), Striche von oben nach unten
        const x = -17 + p * 11;
        x1 = x + j(11, 0.5 + 4 * w);
        y1 = -16 + j(12, 0.5 + 4 * w);
        x2 = x + 1.5 + j(13, 0.5 + 5.5 * w);
        y2 = 16 + j(14, 0.5 + 5 * w);
      } else {
        // Der Fünfte streicht quer durch d'Gruppe
        x1 = -23 + j(11, 1 + 5 * w);
        y1 = 11 + j(12, 1 + 5 * w);
        x2 = 21 + j(13, 1 + 6 * w);
        y2 = -11 + j(14, 1 + 5.5 * w);
      }
      const cx = (x1 + x2) / 2 + j(15, 1.5 + 6.5 * w);
      const cy = (y1 + y2) / 2 + j(16, 1 + 4 * w);
      striche.push(
        <path
          key={k}
          d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`}
          stroke={TINTE}
          strokeWidth={3.3 + zitter(k, 17) * 0.5 + w * 0.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.9 + zitter(k, 18) * 0.08}
          className={k === anzahl - 1 ? 'wn-strich-neu' : undefined}
        />,
      );
    }
    gruppen.push(
      <g key={g} transform={`translate(${(gx + zitter(g, 1) * (1 + 5 * wg)).toFixed(1)} ${(gy + zitter(g, 2) * (1 + 5 * wg)).toFixed(1)}) rotate(${dreh.toFixed(1)})`}>
        {striche}
      </g>,
    );
  }
  return (
    <svg viewBox="0 0 264 264" fill="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
      {gruppen}
    </svg>
  );
}

/** Mini-Strichliste für d'Spezl-Zeilen („Aa am Stricheln"), gleiche Tinte, kompakt. */
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

/**
 * Dei Bierdeckel, Strichliste wie im Wirtshaus. Am Stammtisch-Abend
 * (ab Termin-Uhrzeit bis zum Abschluss) strichelt jeder Spezl seine eigenen
 * Hoiben LIVE: aufn Deckel tippen = a Strich dazu. Der Stand landet im
 * eigenen Besuchs-Eintrag und belegt den Abschluss-Zettel vor.
 */
export function Bierdeckel({
  terminId,
  wirtshausName,
  initialHoiben,
  spezln,
}: {
  terminId: string;
  wirtshausName: string | null;
  initialHoiben: number;
  /** Die anderen am Tisch mit ihrem aktuellen Strich-Stand (nur > 0). */
  spezln: BierdeckelSpezl[];
}) {
  const router = useRouter();
  const [hoiben, setHoiben] = useState(initialHoiben);
  const [status, setStatus] = useState<'still' | 'speichert' | 'gspeichert'>('still');
  const [fehler, setFehler] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Kurz sammeln, dann speichern, schnelles Nachstricheln hämmert so nicht den Server.
  const speichern = (wert: number) => {
    if (timer.current) clearTimeout(timer.current);
    setStatus('speichert');
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const ergebnis = await hoibenStricheln(terminId, wert);
        if (ergebnis.ok) {
          setFehler(null);
          setStatus('gspeichert');
          router.refresh(); // damit aa die anderen Deckel am Tisch frisch sind
        } else {
          setStatus('still');
          setFehler(ergebnis.meldung);
        }
      });
    }, 600);
  };

  const aendern = (delta: number) => {
    const neu = Math.max(0, Math.min(30, hoiben + delta));
    if (neu === hoiben) return;
    setHoiben(neu);
    speichern(neu);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <style>{`
        @keyframes wnStrichZiehen { to { stroke-dashoffset: 0; } }
        .wn-strich-neu { stroke-dasharray: 60; stroke-dashoffset: 60; animation: wnStrichZiehen 240ms cubic-bezier(0.32, 0.72, 0, 1) 40ms forwards; }
        @keyframes wnHoibenPop { 0% { transform: scale(0.6); } 60% { transform: scale(1.18); } 100% { transform: scale(1); } }
        .wn-hoiben-pop { display: inline-block; animation: wnHoibenPop 320ms cubic-bezier(0.34, 1.56, 0.64, 1); }
        .wn-bierdeckel:active { transform: scale(0.97); }
      `}</style>

      {/* Der Deckel: unser echter Wirtschaftln-Deckel, antippen strichelt,
          d'Striche kritzeln sich wie mit'm blauen Kugelschreiber drüber */}
      <button
        type="button"
        onClick={() => aendern(1)}
        aria-label="A Hoibe dazustricheln"
        className="wn-bierdeckel"
        style={{
          width: 264, height: 264, position: 'relative', padding: 0, border: 'none',
          background: 'transparent', cursor: 'pointer', borderRadius: '50%',
          filter: 'drop-shadow(0 6px 14px rgba(12,43,90,0.22))',
          transition: 'transform var(--dur-fast) var(--ease-standard)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bierdeckel.webp"
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', userSelect: 'none', pointerEvents: 'none' }}
        />
        <KritzelStriche anzahl={hoiben} />
      </button>

      <div style={{ textAlign: 'center' }}>
        <span className="wn-tnum" style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold-700)' }}>
          <span key={hoiben} className="wn-hoiben-pop">{hoiben}</span> Hoibe
          {wirtshausName && <span style={{ fontWeight: 700, color: 'var(--ink-500)' }}> · {wirtshausName}</span>}
        </span>
        {hoiben === 0 && (
          <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
            Aufn Deckel tippen, a Strich pro Hoibe
          </div>
        )}
      </div>

      {/* Korrektur + Speicher-Stand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          className="wn-press"
          onClick={() => aendern(-1)}
          disabled={hoiben === 0}
          style={{
            border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', borderRadius: 'var(--r-pill)',
            padding: '7px 14px', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800,
            color: hoiben === 0 ? 'var(--ink-300)' : 'var(--ink-700)', cursor: hoiben === 0 ? 'default' : 'pointer',
          }}
        >
          − Oans z’vui gstrichelt
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: status === 'gspeichert' ? 'var(--erfolg)' : 'var(--ink-500)', minWidth: 86 }}>
          {status === 'speichert' ? 'Speichert…' : status === 'gspeichert' ? '✓ Gspeichert' : ''}
        </span>
      </div>
      {fehler && (
        <div style={{ padding: '8px 12px', borderRadius: 'var(--r-md)', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', fontSize: 12, fontWeight: 700, color: 'var(--strafe)', textAlign: 'center' }}>
          {fehler}
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
        Deine Striche stehen beim Abschluss-Zettel scho drin: 1 Hoibe = 1 WP.
      </div>

      {/* De anderen am Tisch */}
      {spezln.length > 0 && (
        <div style={{ width: '100%', marginTop: 4, background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 8 }}>
            Aa am Stricheln
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...spezln].sort((a, b) => b.hoiben - a.hoiben).map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar src={s.photoUrl} name={s.name} size={28} verein={s.verein} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </span>
                <MiniStrichliste anzahl={s.hoiben} />
                <span className="wn-tnum" style={{ flex: 'none', width: 26, textAlign: 'right', fontSize: 13, fontWeight: 800, color: 'var(--gold-700)' }}>
                  {s.hoiben}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

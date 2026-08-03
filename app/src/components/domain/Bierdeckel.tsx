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

/** Leichte „Hand-Zittrigkeit" je Strich — deterministisch, damit's beim Rendern stabil bleibt. */
const STRICH_ROTATION = [-4, 3, -2, 5];

/**
 * Eine Fünfergruppe wie am Wirtshaus-Deckel: bis zu 4 senkrechte Striche,
 * der fünfte streicht quer durch. Der jeweils neueste Strich wird
 * „gezogen" (stroke-dashoffset-Animation wie ein Filzstift).
 */
function StrichGruppe({ n, klein = false }: { n: number; klein?: boolean }) {
  return (
    <svg
      width={klein ? 26 : 46}
      height={klein ? 24 : 42}
      viewBox="0 0 46 42"
      fill="none"
      style={{ overflow: 'visible', flex: 'none' }}
    >
      {Array.from({ length: Math.min(4, n) }, (_, i) => (
        <line
          key={i}
          x1={8 + i * 10} y1={5} x2={9.5 + i * 10} y2={37}
          stroke="var(--navy)" strokeWidth={4} strokeLinecap="round"
          transform={`rotate(${STRICH_ROTATION[i]} ${8 + i * 10} 21)`}
          className={n < 5 && i === n - 1 ? 'wn-strich-neu' : undefined}
        />
      ))}
      {n >= 5 && (
        <line
          x1={1} y1={33} x2={45} y2={9}
          stroke="var(--navy)" strokeWidth={4} strokeLinecap="round"
          className="wn-strich-neu"
        />
      )}
    </svg>
  );
}

function Strichliste({ anzahl, klein = false }: { anzahl: number; klein?: boolean }) {
  const gruppen: number[] = [];
  for (let rest = anzahl; rest > 0; rest -= 5) gruppen.push(Math.min(5, rest));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: klein ? 4 : '6px 12px', justifyContent: klein ? 'flex-end' : 'center', alignItems: 'center' }}>
      {gruppen.map((n, i) => (
        // key mit Füllstand: die angefangene Gruppe remountet beim Stricheln → Zieh-Animation
        <StrichGruppe key={i === gruppen.length - 1 ? `${i}-${n}` : i} n={n} klein={klein} />
      ))}
    </div>
  );
}

/**
 * Dei Bierdeckel — Strichliste wie im Wirtshaus. Am Stammtisch-Abend
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

  // Kurz sammeln, dann speichern — schnelles Nachstricheln hämmert so nicht den Server.
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

      {/* Der Deckel: Pergament-Rund mit klassischem Doppelring — antippen strichelt */}
      <button
        type="button"
        onClick={() => aendern(1)}
        aria-label="A Hoibe dazustricheln"
        className="wn-bierdeckel"
        style={{
          width: 264, height: 264, borderRadius: '50%', cursor: 'pointer', padding: '0 26px',
          background: 'radial-gradient(circle at 50% 40%, #FBF7EC 0%, var(--pergament) 60%, #EDE3C9 100%)',
          border: '2px solid var(--pergament-edge)', boxShadow: 'var(--sh-md)',
          position: 'relative', fontFamily: 'var(--font-ui)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'transform var(--dur-fast) var(--ease-standard)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ position: 'absolute', inset: 9, borderRadius: '50%', border: '1.5px solid rgba(12,43,90,0.3)', pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: '3px solid rgba(12,43,90,0.45)', pointerEvents: 'none' }} />

        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>
          Dei Strichliste
        </span>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 21, lineHeight: 1.1, color: 'var(--navy)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {wirtshausName ?? 'Stammtisch'}
        </span>

        <span style={{ minHeight: 48, maxWidth: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hoiben > 0 ? (
            <Strichliste anzahl={hoiben} />
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.4 }}>
              Aufn Deckel tippen —<br />a Strich pro Hoibe 🍺
            </span>
          )}
        </span>

        <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold-700)' }}>
          <span key={hoiben} className="wn-hoiben-pop">{hoiben}</span> {hoiben === 1 ? 'Hoibe' : 'Hoiben'}
        </span>
      </button>

      {/* Korrektur + Speicher-Stand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
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
        Deine Striche stehen beim Abschluss-Zettel scho drin — 1 Hoibe = 1 WP. 🍺
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
                <Strichliste anzahl={s.hoiben} klein />
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

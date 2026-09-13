'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ds';
import { hoibenStricheln, schnapsStricheln, abendFlagsSetzen, rundeSchmeissen } from '@/app/(app)/termin/actions';
import { deckelFuer } from '@/lib/bierdeckel';
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

/**
 * Deterministisches „Zittern" (−1…1) je Strich & Merkmal, stabil über
 * SSR/Re-Render (koa Math.random, sonst springen d'Striche beim Hydrieren).
 */
function zitter(i: number, salz: number): number {
  const x = Math.sin(i * 127.1 + salz * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * Strichgruppen (Fünfer: 4 senkrecht, der 5. quer) im Bogen am Deckelrand
 * entlang. `winkel` gibt die Plätze der Gruppen vor: Hoibe laufen unten
 * (links unten → rechts unten), Schnaps oben (links oben → rechts oben).
 * `salz` trennt die Zitter-Muster der beiden Reihen.
 */
function Strichgruppen({ anzahl, winkel, salz, kennung }: { anzahl: number; winkel: number[]; salz: number; kennung?: string }) {
  const RADIUS = 103;
  const gruppen: React.ReactNode[] = [];
  for (let g = 0; g * 5 < anzahl; g++) {
    const w = winkel[g % winkel.length];
    const rad = (w * Math.PI) / 180;
    const gx = 132 + RADIUS * Math.cos(rad);
    const gy = 132 + RADIUS * Math.sin(rad);
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
          strokeWidth={3.3 + zitter(k, 17) * 0.5 + wt * 0.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.9 + zitter(k, 18) * 0.08}
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
  return (
    <>
      {kennung && anzahl > 0 && (
        // Handschriftliche Kennzeichnung vor der Reihe, tangential am Rand
        <text
          x={132 + (RADIUS - 2) * Math.cos((winkel[0] - 14) * Math.PI / 180)}
          y={132 + (RADIUS - 2) * Math.sin((winkel[0] - 14) * Math.PI / 180)}
          transform={`rotate(${winkel[0] - 14 + 90} ${132 + (RADIUS - 2) * Math.cos((winkel[0] - 14) * Math.PI / 180)} ${132 + (RADIUS - 2) * Math.sin((winkel[0] - 14) * Math.PI / 180)})`}
          fill={TINTE}
          opacity={0.9}
          fontSize={11}
          fontWeight={800}
          fontStyle="italic"
          textAnchor="middle"
          style={{ fontFamily: 'var(--font-ui)', letterSpacing: '0.02em' }}
        >
          {kennung}
        </text>
      )}
      {gruppen}
    </>
  );
}

/** Beide Reihen am Deckel: Hoibe unten, Schnaps oben (mit „Schnaps“-Kennung). */
function KritzelStriche({ hoiben, schnaps }: { hoiben: number; schnaps: number }) {
  return (
    <svg viewBox="0 0 264 264" fill="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
      <Strichgruppen anzahl={hoiben} winkel={[150, 126, 102, 78, 54, 30]} salz={0} />
      <Strichgruppen anzahl={schnaps} winkel={[210, 234, 258, 282, 306, 330]} salz={7} kennung="Schnaps" />
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

const chipStil = (an: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--r-pill)',
  border: an ? '1.5px solid var(--gold)' : '1.5px solid var(--ink-200)',
  background: an ? 'var(--pergament)' : 'var(--weiss)', cursor: 'pointer',
  fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800, color: an ? 'var(--gold-700)' : 'var(--ink-500)',
  transition: 'background 160ms var(--ease-standard), border-color 160ms var(--ease-standard)',
});

/**
 * Dei Bierdeckel, Strichliste wie im Wirtshaus. Am Stammtisch-Abend
 * (ab Termin-Uhrzeit bis zum Abschluss) strichelt jeder Spezl für sich:
 * aufn Deckel tippen = a Hoibe, der 🥃-Knopf am Deckel = a Schnaps (eigene
 * Reihe oben mit Kennung). Drunter d'Abend-Chips (Taxler, Brodn, Schmarrn,
 * Runde gschmissen → Bier oder Schnaps, landet bei allen am Tisch am Deckel).
 * Alles wandert in den eigenen Besuchs-Eintrag und belegt den Abschluss-
 * Zettel vor; Admin, Präsident und der Abschließer richten dort für alle.
 */
export function Bierdeckel({
  terminId,
  wirtshausName,
  biersorte = null,
  initialHoiben,
  initialSchnaps = 0,
  schnapsAn = false,
  initialFlags,
  spezln,
}: {
  terminId: string;
  wirtshausName: string | null;
  /** Helles vom Wirtshaus → passender Deckel (Augustiner-Scan, Brauerei-Deckel oder neutral) */
  biersorte?: string | null;
  initialHoiben: number;
  initialSchnaps?: number;
  /** Feature schnaps: Schnaps-Reihe am Deckel + Schnaps-Runde */
  schnapsAn?: boolean;
  /** Eigene Abend-Chips (Taxler, Brodn, Schmarrn, Runden) */
  initialFlags?: AbendFlags;
  /** Die anderen am Tisch mit ihrem aktuellen Strich-Stand (nur > 0). */
  spezln: BierdeckelSpezl[];
}) {
  const router = useRouter();
  const [hoiben, setHoiben] = useState(initialHoiben);
  const [schnaps, setSchnaps] = useState(initialSchnaps);
  const [flags, setFlags] = useState<AbendFlags>(initialFlags ?? { taxi: false, brodn: false, kaisi: false, rundenBier: 0, rundenSchnaps: 0 });
  const [rundeWahl, setRundeWahl] = useState(false);
  const [status, setStatus] = useState<'still' | 'speichert' | 'gspeichert'>('still');
  const [fehler, setFehler] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schnapsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Aktuellster Stand für die verzögerte Speicherung (schnelle Tipps hintereinander zählen alle)
  const hoibenRef = useRef(initialHoiben);
  const schnapsRef = useRef(initialSchnaps);
  const deckel = deckelFuer(biersorte);

  // Frischer Stand vom Server (z. B. nach einer Runde von wem anders) → übernehmen
  useEffect(() => { setHoiben(initialHoiben); hoibenRef.current = initialHoiben; }, [initialHoiben]);
  useEffect(() => { setSchnaps(initialSchnaps); schnapsRef.current = initialSchnaps; }, [initialSchnaps]);
  useEffect(() => { if (initialFlags) setFlags(initialFlags); }, [initialFlags]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (schnapsTimer.current) clearTimeout(schnapsTimer.current);
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
  const hoibeAendern = (delta: number) => {
    const neu = Math.max(0, Math.min(30, hoibenRef.current + delta));
    if (neu === hoibenRef.current) return;
    hoibenRef.current = neu;
    setHoiben(neu);
    if (timer.current) clearTimeout(timer.current);
    setStatus('speichert');
    timer.current = setTimeout(() => startTransition(async () => melden(await hoibenStricheln(terminId, neu))), 600);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <style>{`
        @keyframes wnStrichZiehen { to { stroke-dashoffset: 0; } }
        .wn-strich-neu { stroke-dasharray: 60; stroke-dashoffset: 60; animation: wnStrichZiehen 240ms cubic-bezier(0.32, 0.72, 0, 1) 40ms forwards; }
        @keyframes wnHoibenPop { 0% { transform: scale(0.6); } 60% { transform: scale(1.18); } 100% { transform: scale(1); } }
        .wn-hoiben-pop { display: inline-block; animation: wnHoibenPop 320ms cubic-bezier(0.34, 1.56, 0.64, 1); }
        .wn-bierdeckel:active { transform: scale(0.97); }
      `}</style>

      {/* Der Deckel: antippen strichelt a Hoibe; der 🥃-Knopf strichelt a Schnaps (eigene Reihe oben) */}
      <div style={{ position: 'relative', width: 264, height: 264 }}>
        <button
          type="button"
          onClick={() => hoibeAendern(1)}
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
          <DeckelGrafik deckel={deckel} />
          <KritzelStriche hoiben={hoiben} schnaps={schnapsAn ? schnaps : 0} />
        </button>
        {schnapsAn && (
          <button
            type="button"
            className="wn-press"
            onClick={(e) => { e.stopPropagation(); schnapsAendern(1); }}
            aria-label="A Schnaps dazustricheln"
            title="A Schnaps"
            style={{
              position: 'absolute', top: 2, right: 2, width: 46, height: 46, borderRadius: '50%', border: '2px solid var(--weiss)',
              background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)', cursor: 'pointer', fontSize: 22, lineHeight: 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            🥃
          </button>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <span className="wn-tnum" style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold-700)' }}>
          🍺 <span key={`h${hoiben}`} className="wn-hoiben-pop">{hoiben}</span> Hoibe
          {schnapsAn && (
            <>
              {' '}· 🥃 <span key={`s${schnaps}`} className="wn-hoiben-pop">{schnaps}</span> Schnaps
            </>
          )}
          {wirtshausName && <span style={{ fontWeight: 700, color: 'var(--ink-500)' }}> · {wirtshausName}</span>}
        </span>
        {hoiben === 0 && schnaps === 0 && (
          <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
            Aufn Deckel tippen, a Strich pro Hoibe{schnapsAn ? ', 🥃 fürn Schnaps' : ''}.
          </div>
        )}
      </div>

      {/* Korrektur + Speicher-Stand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          className="wn-press"
          onClick={() => hoibeAendern(-1)}
          disabled={hoiben === 0}
          style={{
            border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', borderRadius: 'var(--r-pill)',
            padding: '7px 12px', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800,
            color: hoiben === 0 ? 'var(--ink-300)' : 'var(--ink-700)', cursor: hoiben === 0 ? 'default' : 'pointer',
          }}
        >
          − Hoibe
        </button>
        {schnapsAn && (
          <button
            type="button"
            className="wn-press"
            onClick={() => schnapsAendern(-1)}
            disabled={schnaps === 0}
            style={{
              border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', borderRadius: 'var(--r-pill)',
              padding: '7px 12px', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800,
              color: schnaps === 0 ? 'var(--ink-300)' : 'var(--ink-700)', cursor: schnaps === 0 ? 'default' : 'pointer',
            }}
          >
            − Schnaps
          </button>
        )}
        <span style={{ fontSize: 12, fontWeight: 700, color: status === 'gspeichert' ? 'var(--erfolg)' : 'var(--ink-500)', minWidth: 80 }}>
          {status === 'speichert' ? 'Speichert…' : status === 'gspeichert' ? '✓ Gspeichert' : ''}
        </span>
      </div>

      {/* Abend-Chips: was sonst no zum Abend ghört. Runde gschmissen → Bier oder Schnaps, kommt bei allen am Deckel dazu */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" className="wn-press" onClick={() => flagUmschalten('taxi')} style={chipStil(flags.taxi)} title="Mit'm Auto da & Spezln mitgnommen">
            🚕 Taxler
          </button>
          <button type="button" className="wn-press" onClick={() => flagUmschalten('brodn')} style={chipStil(flags.brodn)} title="Schweinsbraten gegessen">
            🍖 Brodn
          </button>
          <button type="button" className="wn-press" onClick={() => flagUmschalten('kaisi')} style={chipStil(flags.kaisi)} title="Kaiserschmarrn bestellt (wird eh geteilt)">
            🥞 Schmarrn
          </button>
          <button type="button" className="wn-press" onClick={() => setRundeWahl((w) => !w)} style={chipStil(rundenGesamt > 0)} title="A Runde für alle am Tisch gschmissen">
            ⭐ Runde{rundenGesamt > 0 ? ` ×${rundenGesamt}` : ''}
          </button>
        </div>
        {rundeWahl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Was hast gschmissen?</span>
            <button type="button" className="wn-press" onClick={() => runde('bier')} style={{ ...chipStil(true), padding: '7px 12px' }}>🍺 Bier-Runde</button>
            {schnapsAn && (
              <button type="button" className="wn-press" onClick={() => runde('schnaps')} style={{ ...chipStil(true), padding: '7px 12px' }}>🥃 Schnaps-Runde</button>
            )}
          </div>
        )}
        {rundenGesamt > 0 && (
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
            Deine Runde{rundenGesamt > 1 ? 'n' : ''} ({flags.rundenBier > 0 ? `${flags.rundenBier}× Bier` : ''}{flags.rundenBier > 0 && flags.rundenSchnaps > 0 ? ', ' : ''}{flags.rundenSchnaps > 0 ? `${flags.rundenSchnaps}× Schnaps` : ''}) steh{rundenGesamt > 1 ? 'n' : 't'} bei allen am Tisch am Deckel. Rausnehmen geht beim Abschluss-Zettel.
          </div>
        )}
      </div>

      {fehler && (
        <div style={{ padding: '8px 12px', borderRadius: 'var(--r-md)', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', fontSize: 12, fontWeight: 700, color: 'var(--strafe)', textAlign: 'center' }}>
          {fehler}
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
        Jeder strichelt für sich; Admin, Präsident und wer abschließt richten’s beim Abschluss-Zettel für alle. 1 Hoibe = 1 WP.
      </div>

      {/* De anderen am Tisch */}
      {spezln.length > 0 && (
        <div style={{ width: '100%', marginTop: 4, background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: 8 }}>
            Aa am Stricheln
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...spezln].sort((a, b) => b.hoiben - a.hoiben || (b.schnaps ?? 0) - (a.schnaps ?? 0)).map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar src={s.photoUrl} name={s.name} size={28} verein={s.verein} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </span>
                <MiniStrichliste anzahl={s.hoiben} />
                <span className="wn-tnum" style={{ flex: 'none', width: 26, textAlign: 'right', fontSize: 13, fontWeight: 800, color: 'var(--gold-700)' }}>
                  {s.hoiben}
                </span>
                {schnapsAn && (
                  <span className="wn-tnum" style={{ flex: 'none', fontSize: 12, fontWeight: 800, color: 'var(--ink-500)' }}>
                    🥃 {s.schnaps ?? 0}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

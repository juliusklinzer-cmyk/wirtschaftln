'use client';

import { useState, useTransition } from 'react';
import { abstimmen } from '@/app/(app)/termin/actions';
import { PTS, rechtzeitigAbgestimmt } from '@/lib/punkte';

// „Vielleicht" is raus (Altlast) — es gibt nur no Zusagen oder Absagen,
// die Stimme lässt sich bis zum Termin jederzeit ändern.
const OPTIONS = [
  { wert: 'zu', label: 'Zusagen', color: 'var(--erfolg)', bg: 'var(--erfolg-bg)' },
  { wert: 'ab', label: 'Absagen', color: 'var(--strafe)', bg: 'var(--strafe-bg)' },
] as const;

export function VotePills({
  terminId,
  current,
  terminDatum,
  links = null,
  onDark = false,
}: {
  terminId: string;
  current: 'zu' | 'vielleicht' | 'ab' | null;
  /** Termindatum (YYYY-MM-DD) — für die „+1 WP"-Anzeige bei rechtzeitiger Erst-Stimme. */
  terminDatum?: string;
  /** Zähler-Zeile („✅ 3 zugesagt · ❌ 1 abgesagt") — steht links, der Bonus rechts daneben. */
  links?: React.ReactNode;
  onDark?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [frischVerdient, setFrischVerdient] = useState(false);
  const [geklickt, setGeklickt] = useState<'zu' | 'ab' | null>(null);

  const klick = (wert: 'zu' | 'ab') => {
    setGeklickt(wert);
    // Bonus zählt nur für die ERSTE Stimme — und nur, wenn sie rechtzeitig is
    if (current === null && terminDatum && rechtzeitigAbgestimmt(new Date().toISOString(), terminDatum)) {
      setFrischVerdient(true);
    }
    startTransition(() => abstimmen(terminId, wert));
  };

  // Frist läuft noch und keine Stimme da → beide Buttons zeigen, dass's an Punkt gibt.
  // Nach der Stimme verschwindet der Zusatz — der Punkt is dann oben in der Pill gezählt.
  const fristOffen = current === null && !frischVerdient && !!terminDatum && rechtzeitigAbgestimmt(new Date().toISOString(), terminDatum);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        {frischVerdient && (
          <style>{`@keyframes wnPlusFlug { 0% { transform: translateY(0); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-26px); opacity: 0; } }`}</style>
        )}
        {OPTIONS.map((o) => {
          const active = current === o.wert;
          // „+1 WP" nur als Anreiz VOR der Stimme — danach zählt der Punkt oben in der Pill
          const mitBonus = fristOffen;
          return (
            <div key={o.wert} style={{ position: 'relative', flex: 1 }}>
              {/* Punkteflug aus dem gedrückten Button, wenn die Stimme rechtzeitig war */}
              {frischVerdient && geklickt === o.wert && (
                <span
                  className="wn-tnum"
                  style={{
                    position: 'absolute', left: '50%', top: -8, transform: 'translateX(-50%)',
                    fontSize: 13, fontWeight: 800, color: 'var(--gold-700)',
                    pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 2,
                    animation: 'wnPlusFlug 1.4s ease-out both',
                  }}
                >
                  +{PTS.abstimmen} WP
                </span>
              )}
              <button
                disabled={pending}
                onClick={() => klick(o.wert)}
                style={{
                  width: '100%',
                  border: active ? `1.5px solid ${o.color}` : '1.5px solid transparent',
                  cursor: 'pointer',
                  borderRadius: 'var(--r-pill)',
                  padding: '10px 8px',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 800,
                  fontSize: 13,
                  color: active ? o.color : onDark ? 'var(--pergament)' : 'var(--ink-500)',
                  background: active ? o.bg : onDark ? 'rgba(255,255,255,0.10)' : 'var(--ink-50)',
                  transition: 'all var(--dur-base) var(--ease-standard)',
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {o.label}
                {mitBonus && <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.75 }}> +{PTS.abstimmen} WP</span>}
              </button>
            </div>
          );
        })}
      </div>
      {links && (
        <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: onDark ? 'rgba(246,240,226,0.65)' : 'var(--ink-500)' }}>
          {links}
        </div>
      )}
    </div>
  );
}

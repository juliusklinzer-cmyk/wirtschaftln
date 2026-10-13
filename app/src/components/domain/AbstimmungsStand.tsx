'use client';

import { useEffect, useState, useTransition } from 'react';
import { Icon } from '@/components/ds';
import { abstimmen } from '@/app/(app)/termin/actions';
import { PTS, rechtzeitigAbgestimmt } from '@/lib/punkte';

/**
 * Abstimmung in der Termin-Karte auf Hoam (Zustände 2c–2e): solange koa
 * Stimme da is, die Frage „Hast du Zeit?“ mit „Bin dabei“ (Gold) und
 * „Absagen“. Danach is die Karte „zua“: Daumen + eigene Antwort fix, Ändern
 * geht über den kleinen Knopf, bis zum Abend derf jeder umschwenken.
 */
export function AbstimmungsStand({
  terminId,
  terminDatum,
  meinVote,
}: {
  terminId: string;
  terminDatum: string;
  meinVote: 'zu' | 'vielleicht' | 'ab' | null;
}) {
  // Legacy-„vielleicht" zählt wie keine Antwort
  const stimme = meinVote === 'zu' || meinVote === 'ab' ? meinVote : null;
  const [aendern, setAendern] = useState(false);
  const [pending, startTransition] = useTransition();
  const [geklickt, setGeklickt] = useState<'zu' | 'ab' | null>(null);
  const [frischVerdient, setFrischVerdient] = useState(false);
  // Neue Stimme vom Server angekommen → Ändern-Modus wieder zuklappen
  useEffect(() => { setAendern(false); setGeklickt(null); }, [meinVote]);

  const fristOffen = rechtzeitigAbgestimmt(new Date().toISOString(), terminDatum);
  const klick = (wert: 'zu' | 'ab') => {
    setGeklickt(wert);
    // Bonus zählt nur für die ERSTE Stimme, und nur, wenn sie rechtzeitig is
    if (stimme === null && fristOffen) setFrischVerdient(true);
    startTransition(() => abstimmen(terminId, wert));
  };

  if (stimme === null || aendern) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold-bright)' }}>Hast du Zeit?</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8, position: 'relative' }}>
          {frischVerdient && (
            <>
              <style>{`@keyframes wnPlusFlug { 0% { transform: translate(-50%, 0); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(-50%, -26px); opacity: 0; } }`}</style>
              <span
                className="wn-tnum"
                style={{
                  position: 'absolute', left: geklickt === 'ab' ? '80%' : '29%', top: -10, transform: 'translateX(-50%)',
                  fontSize: 13, fontWeight: 800, color: 'var(--gold-bright)', pointerEvents: 'none',
                  whiteSpace: 'nowrap', zIndex: 2, animation: 'wnPlusFlug 1.4s ease-out both',
                }}
              >
                +{PTS.abstimmen} WP
              </span>
            </>
          )}
          <button
            type="button"
            className="wn-press"
            disabled={pending}
            onClick={() => klick('zu')}
            style={{
              minHeight: 50, border: 'none', borderRadius: 'var(--r-md)', background: 'var(--grad-gold)',
              boxShadow: 'var(--sh-gold)', color: 'var(--navy-900)', fontFamily: 'var(--font-ui)',
              fontSize: 16, fontWeight: 800, cursor: pending ? 'default' : 'pointer', opacity: pending && geklickt !== 'zu' ? 0.6 : 1,
            }}
          >
            {pending && geklickt === 'zu' ? '…' : 'Bin dabei'}
          </button>
          <button
            type="button"
            className="wn-press"
            disabled={pending}
            onClick={() => klick('ab')}
            style={{
              minHeight: 50, borderRadius: 'var(--r-md)', border: '1.5px solid rgba(246,240,226,0.3)', background: 'transparent',
              color: 'var(--pergament)', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700,
              cursor: pending ? 'default' : 'pointer', opacity: pending && geklickt !== 'ab' ? 0.6 : 1,
            }}
          >
            {pending && geklickt === 'ab' ? '…' : 'Absagen'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(246,240,226,0.6)' }}>
            {stimme === null && fristOffen
              ? `Bis 3 Tage vorher abstimmen bringt +${PTS.abstimmen} WP.`
              : 'Deine Stimme lässt sich bis zum Abend ändern.'}
          </span>
          {aendern && (
            <button
              type="button"
              onClick={() => setAendern(false)}
              style={{ flex: 'none', border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, color: 'rgba(246,240,226,0.75)', cursor: 'pointer' }}
            >
              Doch ned ändern
            </button>
          )}
        </div>
      </div>
    );
  }

  const dabei = stimme === 'zu';
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        background: 'rgba(255,255,255,0.08)', border: `1.5px solid ${dabei ? 'var(--erfolg)' : 'var(--strafe)'}`,
        borderRadius: 'var(--r-md)',
      }}
    >
      <span
        className={dabei ? 'wn-pop' : undefined}
        style={{
          width: 38, height: 38, flex: 'none', borderRadius: '50%',
          background: dabei ? 'var(--erfolg)' : 'var(--strafe)', color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name="daumen" size={19} style={dabei ? undefined : { transform: 'rotate(180deg) scaleX(-1)' }} />
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: 'var(--pergament)' }}>
        {dabei ? 'Passt, du bist dabei!' : 'Du hast abgesagt.'}
      </span>
      <button
        type="button"
        onClick={() => setAendern(true)}
        style={{
          flex: 'none', border: '1px solid rgba(255,255,255,0.35)', background: 'transparent',
          borderRadius: 'var(--r-pill)', padding: '6px 12px', fontFamily: 'var(--font-ui)',
          fontSize: 12, fontWeight: 800, color: 'var(--pergament)', cursor: 'pointer',
        }}
      >
        Ändern
      </button>
    </div>
  );
}

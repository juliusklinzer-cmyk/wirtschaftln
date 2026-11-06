'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '@/components/ds';

export type ZusagenSpezl = { name: string; photoUrl: string | null; verein: string | null };
export type ZusagenListen = { dabei: ZusagenSpezl[]; abgesagt: ZusagenSpezl[]; offen: ZusagenSpezl[] };

/**
 * Wer kommt? Die ganze Liste (Feedback München Tag & Nacht, 06.11.2026): bei
 * vielen Spezln war die Zeile abgschnitten. Ein Tipp öffnet das Blatt von
 * unten mit allen Namen: Dabei, Abgesagt, Noch offen.
 */
export function ZusagenBlatt({ listen, onZu }: { listen: ZusagenListen; onZu: () => void }) {
  const [da, setDa] = useState(false);
  useEffect(() => setDa(true), []);
  useEffect(() => {
    const taste = (e: KeyboardEvent) => { if (e.key === 'Escape') onZu(); };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [onZu]);
  if (!da) return null;

  const gruppe = (titel: string, liste: ZusagenSpezl[], farbe: string, leer: string) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: farbe, flex: 'none' }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-700)' }}>{titel}</span>
        <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 800, color: farbe }}>{liste.length}</span>
      </div>
      {liste.length === 0 ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', padding: '0 4px' }}>{leer}</span>
      ) : (
        <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', padding: '4px 14px' }}>
          {liste.map((s, i) => (
            <div key={`${s.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, borderBottom: i === liste.length - 1 ? 'none' : '1px solid var(--ink-50)' }}>
              <Avatar src={s.photoUrl} name={s.name} size={32} verein={s.verein} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return createPortal(
    <>
      <div onClick={onZu} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(7,25,58,0.5)' }} />
      <div
        role="dialog"
        aria-label="Wer kommt"
        className="wn-sheet-auf wn-scroll-still"
        style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 81, maxWidth: 'var(--container-app)', margin: '0 auto', maxHeight: '85dvh', overflowY: 'auto', background: 'var(--ink-50)', borderRadius: '28px 28px 0 0', padding: '10px 16px calc(24px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 -14px 36px rgba(7,25,58,0.3)' }}
      >
        <span style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 999, background: 'var(--ink-200)', flex: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0 4px' }}>
          <span style={{ flex: 1, fontFamily: 'var(--font-fraktur)', fontSize: 28, lineHeight: 1, color: 'var(--navy)' }}>Wer kommt?</span>
          <button type="button" onClick={onZu} style={{ border: 'none', background: 'none', padding: 4, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, color: 'var(--muc-blau)' }}>Fertig</button>
        </div>
        {gruppe('Dabei', listen.dabei, 'var(--erfolg)', 'No koaner.')}
        {gruppe('Abgesagt', listen.abgesagt, 'var(--strafe)', 'Koaner.')}
        {gruppe('Noch offen', listen.offen, 'var(--ink-500)', 'Alle haben abgstimmt.')}
      </div>
    </>,
    document.body,
  );
}

/** Antippbarer Bereich (z. B. die Wer-kommt-Zeile auf Hoam), der das Blatt aufmacht. */
export function ZusagenAuf({ listen, children, style }: { listen: ZusagenListen; children: React.ReactNode; style?: React.CSSProperties }) {
  const [auf, setAuf] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAuf(true)}
        aria-label="Alle Zu- und Absagen anzeigen"
        className="wn-press"
        style={{ border: 'none', background: 'none', padding: 0, margin: 0, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-ui)', color: 'inherit', WebkitTapHighlightColor: 'transparent', ...style }}
      >
        {children}
      </button>
      {auf && <ZusagenBlatt listen={listen} onZu={() => setAuf(false)} />}
    </>
  );
}

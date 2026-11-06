'use client';

import { useState, useTransition } from 'react';
import { Avatar } from '@/components/ds';
import { abstimmen } from '@/app/(app)/termin/actions';
import { PTS, rechtzeitigAbgestimmt } from '@/lib/punkte';

export type AbstimmSpezl = { name: string; photoUrl: string | null; verein: string | null };

const vorname = (name: string) => { const [a, ...r] = name.split(' '); return a.length <= 3 && r.length > 0 ? name : a; };

/**
 * Abstimmung auf der Termin-Seite (Redesign 1a/2d/2e): oben das Segment
 * Zusagen (grün) / Absagen (rot), drunter Dabei, Noch offen und Abgesagt
 * mit allen Gsichtern und Vornamen. (Auf Hoam geht dafür das ZusagenBlatt auf.)
 */
export function AbstimmungKarte({
  terminId,
  terminDatum,
  meinVote,
  dabei,
  offen,
  abgesagt,
  fristHinweis,
}: {
  terminId: string;
  terminDatum: string;
  meinVote: 'zu' | 'vielleicht' | 'ab' | null;
  dabei: AbstimmSpezl[];
  offen: AbstimmSpezl[];
  abgesagt: AbstimmSpezl[];
  /** Absage-Frist aus dem Strafenkatalog */
  fristHinweis?: string | null;
}) {
  const stimme = meinVote === 'zu' || meinVote === 'ab' ? meinVote : null;
  const [pending, startTransition] = useTransition();
  const [geklickt, setGeklickt] = useState<'zu' | 'ab' | null>(null);
  const [frischVerdient, setFrischVerdient] = useState(false);
  const fristOffen = rechtzeitigAbgestimmt(new Date().toISOString(), terminDatum);

  const klick = (wert: 'zu' | 'ab') => {
    if (wert === stimme) return;
    setGeklickt(wert);
    if (stimme === null && fristOffen) setFrischVerdient(true);
    startTransition(() => abstimmen(terminId, wert));
  };

  const segment = (wert: 'zu' | 'ab', label: string, farbe: string) => {
    const an = stimme === wert;
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => klick(wert)}
        aria-pressed={an}
        style={{
          height: 42, borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)',
          fontSize: 14, fontWeight: an ? 800 : 700,
          background: an ? farbe : 'transparent', color: an ? '#fff' : 'var(--ink-500)',
          boxShadow: an ? '0 1px 3px rgba(12,43,90,0.15)' : 'none',
          opacity: pending && geklickt !== wert ? 0.6 : 1,
          transition: 'background 160ms var(--ease-standard), color 160ms var(--ease-standard)',
        }}
      >
        {pending && geklickt === wert ? '…' : label}
      </button>
    );
  };

  // Alle Spezl direkt in der Karte, jeder mit Gsicht und Vorname (Feedback 06.11.2026)
  const gruppe = (titel: string, liste: AbstimmSpezl[], farbe: string, leer: string, letzte = false) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0', borderBottom: letzte ? 'none' : '1px solid var(--ink-50)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: farbe, flex: 'none' }} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{titel}</span>
        <span className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: farbe }}>{liste.length}</span>
      </div>
      {liste.length === 0 ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{leer}</span>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))', gap: '10px 4px' }}>
          {liste.map((s, i) => (
            <div key={`${s.name}-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <Avatar src={s.photoUrl} name={s.name} size={40} verein={s.verein} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-700)', maxWidth: '100%', textAlign: 'center', overflowWrap: 'anywhere', lineHeight: 1.2 }}>{vorname(s.name)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, borderRadius: 14, background: 'var(--ink-50)' }}>
        {frischVerdient && (
          <>
            <style>{`@keyframes wnPlusFlug { 0% { transform: translate(-50%, 0); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(-50%, -26px); opacity: 0; } }`}</style>
            <span className="wn-tnum" style={{ position: 'absolute', left: geklickt === 'ab' ? '75%' : '25%', top: -10, transform: 'translateX(-50%)', fontSize: 13, fontWeight: 800, color: 'var(--gold-700)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 2, animation: 'wnPlusFlug 1.4s ease-out both' }}>
              +{PTS.abstimmen} WP
            </span>
          </>
        )}
        {segment('zu', 'Zusagen', 'var(--erfolg)')}
        {segment('ab', 'Absagen', 'var(--strafe)')}
      </div>
      {stimme === null && fristOffen && (
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', padding: '4px 4px 0' }}>
          Bis 3 Tage vorher abstimmen bringt +{PTS.abstimmen} WP.
        </div>
      )}
      {fristHinweis && (
        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4, color: 'var(--strafe)', padding: '4px 4px 0' }}>{fristHinweis}</div>
      )}
      <div>
        {gruppe('Dabei', dabei, 'var(--erfolg)', 'No koaner.')}
        {gruppe('Noch offen', offen, 'var(--ink-500)', 'Alle haben abgstimmt.')}
        {gruppe('Abgesagt', abgesagt, 'var(--strafe)', 'Koaner.', true)}
      </div>
    </div>
  );
}

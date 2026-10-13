'use client';

import { useState, useTransition } from 'react';
import { Avatar, Chip, Zeile } from '@/components/ds';
import { abstimmen } from '@/app/(app)/termin/actions';
import { PTS, rechtzeitigAbgestimmt } from '@/lib/punkte';

export type AbstimmSpezl = { name: string; photoUrl: string | null; verein: string | null };

/**
 * Abstimmung auf der Termin-Seite (Redesign 1a/2d/2e): oben das Segment
 * Zusagen (grün) / Absagen (rot), drunter drei Zeilen: Dabei, Noch offen,
 * Abgesagt, jeweils mit Avataren, Namen und Zähl-Chip.
 */
export function AbstimmungKarte({
  terminId,
  terminDatum,
  meinVote,
  dabei,
  offen,
  abgesagt,
}: {
  terminId: string;
  terminDatum: string;
  meinVote: 'zu' | 'vielleicht' | 'ab' | null;
  dabei: AbstimmSpezl[];
  offen: AbstimmSpezl[];
  abgesagt: AbstimmSpezl[];
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

  const namen = (liste: AbstimmSpezl[]) => {
    const kurz = liste.map((s) => s.name.split(' ')[0]);
    if (kurz.length <= 5) return kurz.join(', ');
    return `${kurz.slice(0, 4).join(', ')} und ${kurz.length - 4} weitere`;
  };
  const stapel = (liste: AbstimmSpezl[]) => (
    <span style={{ display: 'inline-flex', flex: 'none' }}>
      {liste.slice(0, 4).map((s, i) => (
        <span key={s.name} style={{ marginLeft: i === 0 ? 0 : -10, display: 'inline-flex', borderRadius: '50%', border: '2px solid var(--weiss)', zIndex: 4 - i }}>
          <Avatar src={s.photoUrl} name={s.name} size={32} verein={s.verein} />
        </span>
      ))}
      {liste.length === 0 && (
        <span style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px dashed var(--ink-200)' }} />
      )}
    </span>
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
      <div>
        <Zeile kachel={stapel(dabei)} titel="Dabei" untertitel={dabei.length ? namen(dabei) : 'no koaner'} chip={<Chip ton="erfolg">{dabei.length}</Chip>} pfeil={false} />
        <Zeile kachel={stapel(offen)} titel="Noch offen" untertitel={offen.length ? namen(offen) : 'alle haben abgstimmt'} chip={<Chip ton="grau">{offen.length}</Chip>} pfeil={false} />
        <Zeile kachel={stapel(abgesagt)} titel="Abgesagt" untertitel={abgesagt.length ? namen(abgesagt) : 'koaner'} chip={<Chip ton="strafe">{abgesagt.length}</Chip>} pfeil={false} letzte />
      </div>
    </div>
  );
}

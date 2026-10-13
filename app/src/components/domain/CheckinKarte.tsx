'use client';

import { useState, useTransition } from 'react';
import { Avatar } from '@/components/ds';
import { PTS } from '@/lib/punkte';
import { einchecken } from '@/app/(app)/termin/actions';

export type EingecheckterSpezl = {
  name: string;
  photoUrl: string | null;
  verein: string | null;
  platz: string | null;
  istIch: boolean;
};

/**
 * Check-in in der Termin-Karte (Zustand 2f/2g, am Stammtisch-Tag ab 2 Stund’
 * vor Beginn): Der Erste sagt „Wo sitz ma heut?“, kriegt +1 WP, alle anderen
 * sehen’s hier und kriegen an Push. Wer nachkommt, checkt mit einem Tipper ein.
 */
export function CheckinKarte({ terminId, eingecheckte }: { terminId: string; eingecheckte: EingecheckterSpezl[] }) {
  const [platz, setPlatz] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const erster = eingecheckte[0] ?? null;
  const ichBinDa = eingecheckte.some((e) => e.istIch);

  const abschicken = () => {
    // Der Erste MUSS sagen, wo ihr hockts (Pflichtfeld), Nachkommende ned
    if (!erster && !platz.trim()) {
      setFehler('Wo hockts ihr? Des Feld brauchts, dann finden di d’Spezln.');
      return;
    }
    setFehler(null);
    startTransition(async () => {
      const fd = new FormData();
      if (platz.trim()) fd.set('platz', platz.trim());
      const ergebnis = await einchecken(terminId, fd);
      if (!ergebnis.ok) setFehler(ergebnis.meldung);
    });
  };

  if (!erster) {
    return (
      <div style={{ padding: 14, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold-bright)' }}>Wo sitz ma heut?</span>
          <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-bright)' }}>+{PTS.checkin} WP</span>
        </div>
        <input
          value={platz}
          onChange={(e) => { setPlatz(e.target.value); if (fehler) setFehler(null); }}
          maxLength={120}
          required
          placeholder="z.B. hinten rechts, bei der Band"
          style={{
            width: '100%', boxSizing: 'border-box', height: 44, padding: '0 12px',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12,
            background: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-ui)', fontSize: 14,
            fontWeight: 600, color: 'var(--pergament)', outline: 'none',
          }}
        />
        <button
          type="button"
          className="wn-press"
          onClick={abschicken}
          disabled={pending}
          style={{
            minHeight: 46, border: 'none', borderRadius: 'var(--r-md)',
            background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)', cursor: pending ? 'default' : 'pointer',
            fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, color: 'var(--navy-900)',
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? 'Wird eingecheckt…' : 'Einchecken'}
        </button>
        {fehler && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)' }}>{fehler}</div>}
      </div>
    );
  }

  return (
    <div style={{ padding: 14, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.08)', border: '1.5px solid var(--erfolg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pergament)', lineHeight: 1.4 }}>
        <b style={{ color: 'var(--gold-bright)' }}>{erster.istIch ? 'Du' : erster.name}</b> {erster.istIch ? 'bist' : 'is'} als Erster da
        {erster.platz && <>: „{erster.platz}“</>}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', flex: 'none' }}>
          {eingecheckte.slice(0, 8).map((s, i) => (
            <span key={s.name} style={{ marginLeft: i === 0 ? 0 : -9, display: 'inline-flex', borderRadius: '50%', border: '2px solid var(--navy-900)', zIndex: 8 - i }}>
              <Avatar src={s.photoUrl} name={s.name} size={27} verein={s.verein} />
            </span>
          ))}
          {eingecheckte.length > 8 && (
            <span className="wn-tnum" style={{ marginLeft: -9, width: 31, height: 31, borderRadius: '50%', border: '2px solid var(--navy-900)', background: 'rgba(255,255,255,0.18)', color: 'var(--pergament)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
              +{eingecheckte.length - 8}
            </span>
          )}
        </span>
        <span className="wn-tnum" style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.75)' }}>
          {eingecheckte.length} {eingecheckte.length === 1 ? 'is’ scho da' : 'san scho da'}
        </span>
        {!ichBinDa && (
          <button
            type="button"
            className="wn-press"
            onClick={abschicken}
            disabled={pending}
            style={{
              flex: 'none', border: '1px solid rgba(255,255,255,0.35)', background: 'transparent',
              borderRadius: 'var(--r-pill)', padding: '7px 14px', fontFamily: 'var(--font-ui)',
              fontSize: 12, fontWeight: 800, color: 'var(--pergament)', cursor: pending ? 'default' : 'pointer',
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? '…' : 'I bin a da'}
          </button>
        )}
      </div>
      {fehler && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)' }}>{fehler}</div>}
    </div>
  );
}

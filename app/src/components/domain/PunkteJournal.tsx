'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ds';
import { datumMittel } from '@/lib/format';
import type { JournalPosten } from '@/lib/queries';
import { ladePunkteJournal } from './punkte-journal-actions';

type Gruppe = { key: string; datum: string; wo: string | null; posten: JournalPosten[]; summe: number };

/** Posten vom selben Tag und Abend zusammen, neueste zuerst (kommen schon sortiert). */
function gruppieren(posten: JournalPosten[]): Gruppe[] {
  const gruppen: Gruppe[] = [];
  for (const p of posten) {
    const key = `${p.datum}|${p.terminId ?? ''}`;
    let g = gruppen.find((x) => x.key === key);
    if (!g) {
      g = { key, datum: p.datum, wo: p.wo, posten: [], summe: 0 };
      gruppen.push(g);
    }
    g.posten.push(p);
    g.summe += p.wp;
  }
  return gruppen;
}

/**
 * Fenster „Meine WP“ (WIR-014): wofür es wann Punkte gab, die laufende Saison,
 * neueste oben. Kommt aus derselben Rechnung wie die Rangliste, die Summe
 * stimmt also immer mit der Pill überein.
 */
export function PunkteJournal({ onClose }: { onClose: () => void }) {
  const [daten, setDaten] = useState<Awaited<ReturnType<typeof ladePunkteJournal>> | undefined>(undefined);
  useEffect(() => {
    ladePunkteJournal().then(setDaten).catch(() => setDaten(null));
  }, []);

  const gruppen = daten ? gruppieren(daten.posten) : [];
  const summe = daten ? daten.posten.reduce((s, p) => s + p.wp, 0) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Meine WP"
      className="wn-scroll-still wn-fenster"
      style={{ position: 'fixed', inset: 0, zIndex: 70, maxWidth: 'var(--container-app)', margin: '0 auto', overflowY: 'auto', overscrollBehavior: 'contain', background: 'var(--ink-50)', ['--wn-fenster-breite' as string]: '560px' }}
    >
      <div style={{ position: 'relative', background: 'radial-gradient(circle at 50% 30%, #123E78 0%, #07193A 80%)', color: 'var(--pergament)', textAlign: 'center', padding: 'calc(16px + var(--wn-oben)) 20px 18px' }}>
        <button type="button" onClick={onClose} aria-label="Schließen" className="wn-press" style={{ position: 'absolute', top: 'calc(14px + var(--wn-oben))', right: 16, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 2 }}>
          <Icon name="x" size={18} />
        </button>
        <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, lineHeight: 1, color: 'var(--gold-bright)', marginTop: 28 }}>Meine WP</div>
        <div className="wn-tnum" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, marginTop: 12, color: 'var(--pergament)' }}>
          {daten ? summe : '…'} <span style={{ fontSize: 16, color: 'var(--gold-bright)' }}>WP</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.8)', marginTop: 6 }}>{daten?.saison ?? ' '}</div>
      </div>
      <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />

      <div style={{ padding: '20px 16px calc(32px + var(--wn-unten))', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {daten === null && <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>Das hat grad nicht geklappt. Probier’s gleich nochmal.</p>}
        {daten && gruppen.length === 0 && (
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center', padding: '12px 0' }}>
            In dieser Saison hast du noch keine WP. Sag beim nächsten Termin rechtzeitig zu, dann gibt’s den ersten.
          </p>
        )}
        {gruppen.map((g) => (
          <section key={g.key} style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '12px 16px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 6 }}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>{datumMittel(g.datum)}</span>
                {g.wo && <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.wo}</span>}
              </span>
              <WpWert wp={g.summe} fett />
            </div>
            {g.posten.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 38, borderTop: '1px solid var(--ink-50)' }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>{p.was}</span>
                <WpWert wp={p.wp} />
              </div>
            ))}
          </section>
        ))}
        <Link href="/spezln" onClick={onClose} className="wn-press" style={{ alignSelf: 'center', marginTop: 4, padding: '10px 18px', borderRadius: 999, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
          Zur Rangliste
        </Link>
      </div>
    </div>
  );
}

function WpWert({ wp, fett = false }: { wp: number; fett?: boolean }) {
  return (
    <span className="wn-tnum" style={{ flex: 'none', fontSize: fett ? 16 : 14, fontWeight: 800, color: wp < 0 ? 'var(--strafe)' : 'var(--navy)', whiteSpace: 'nowrap' }}>
      {wp > 0 ? '+' : wp < 0 ? '−' : ''}{Math.abs(wp)} <span style={{ fontSize: 10, color: 'var(--gold-700)' }}>WP</span>
    </span>
  );
}

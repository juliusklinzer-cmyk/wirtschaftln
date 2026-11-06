'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ds';

export type PraesidentModus = 'wp' | 'wahl';
export type PraesidentWahlZeit = 'jahresanfang' | 'jahresende' | 'zweiJahre';
type Spezl = { id: string; name: string; photoUrl: string | null; verein: string | null };

const ZEITEN: Array<{ wert: PraesidentWahlZeit; titel: string; text: string }> = [
  { wert: 'jahresanfang', titel: 'Beim ersten Stammtisch im Jahr', text: 'Der Gewinner ist Präsident fürs ganze Jahr.' },
  { wert: 'jahresende', titel: 'Zum Jahresabschluss im Dezember', text: 'Gewählt wird beim ersten Stammtisch im Dezember, der Gewinner übernimmt gleich und bleibt das ganze nächste Jahr.' },
  { wert: 'zweiJahre', titel: 'Alle zwei Jahre', text: 'Beim ersten Stammtisch im Jahr, die Amtszeit geht über zwei Jahre.' },
];

const vorname = (name: string) => { const [a, ...r] = name.split(' '); return a.length <= 3 && r.length > 0 ? name : a; };

const ARTEN: Array<{ wert: PraesidentModus; titel: string; marke?: string; text: string }> = [
  {
    wert: 'wp',
    titel: 'Nach WP',
    marke: 'Empfohlen',
    text: 'Wer sich über die Saison am meisten einbringt, hat die meisten WP und ist Präsident. Das Amt kann nach jedem Stammtisch wechseln, so bleibt’s spannend.',
  },
  {
    wert: 'wahl',
    titel: 'Gewählt',
    text: 'Ihr wählt euren Präsidenten in der App. Die Wahl startet von allein beim Schließen des Stammtischs, an dem gewählt wird, und ist eine Woche offen. Der Admin kann das Amt jederzeit anpassen.',
  },
];

/**
 * Wie wird der Präsident bestimmt? (06.11.2026) Bei der Gründung und in den
 * Stammtisch-Einstellungen, zwei Karten mit kurzer Erklärung. Bei „Gewählt“
 * dazu: wann gewählt wird und (beim ersten Umstellen) wer gerade Präsident
 * ist, weil die letzte Wahl meistens scho war. Schickt `praesidentModus`,
 * `praesidentWahlZeit` und `praesidentAktuell` mit.
 */
export function PraesidentModusWahl({
  start = 'wp',
  wahlZeit = 'jahresanfang',
  spezln,
  praesidentId = null,
}: {
  start?: PraesidentModus;
  wahlZeit?: PraesidentWahlZeit;
  /** Zum Auswählen des aktuellen Präsidenten beim Umstellen (fehlt bei der Gründung) */
  spezln?: Spezl[];
  praesidentId?: string | null;
}) {
  const [modus, setModus] = useState<PraesidentModus>(start);
  const [zeit, setZeit] = useState<PraesidentWahlZeit>(wahlZeit);
  const [aktuell, setAktuell] = useState<string | null>(praesidentId);
  const ersteEinrichtung = start === 'wp' && !!spezln?.length;
  const radio = (an: boolean) => (
    <span aria-hidden style={{ marginTop: 2, width: 18, height: 18, flex: 'none', borderRadius: '50%', border: an ? '5px solid var(--gold-700)' : '2px solid var(--ink-200)', background: 'var(--weiss)', boxSizing: 'border-box' }} />
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Wie wird euer Präsident bestimmt?</span>
      <input type="hidden" name="praesidentModus" value={modus} />
      <input type="hidden" name="praesidentWahlZeit" value={zeit} />
      {modus === 'wahl' && ersteEinrichtung && aktuell && <input type="hidden" name="praesidentAktuell" value={aktuell} />}
      <div role="radiogroup" aria-label="Präsident" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ARTEN.map((a) => {
          const an = modus === a.wert;
          return (
            <button
              key={a.wert}
              type="button"
              role="radio"
              aria-checked={an}
              onClick={() => setModus(a.wert)}
              className="wn-press"
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)',
                background: an ? 'var(--pergament)' : 'var(--weiss)', border: an ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)',
              }}
            >
              <span aria-hidden style={{ marginTop: 2, width: 20, height: 20, flex: 'none', borderRadius: '50%', border: an ? '6px solid var(--gold-700)' : '2px solid var(--ink-200)', background: 'var(--weiss)', boxSizing: 'border-box' }} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{a.titel}</span>
                  {a.marke && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, background: 'var(--grad-gold)', color: 'var(--navy-900)' }}>{a.marke}</span>}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>{a.text}</span>
              </span>
            </button>
          );
        })}
      </div>
      {modus === 'wahl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '14px', borderRadius: 14, background: 'var(--pergament)', border: '1px solid var(--pergament-edge)' }}>
          {ersteEinrichtung && spezln && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>Wer ist gerade euer Präsident?</span>
              <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>Meistens habt ihr schon gewählt. Er bleibt im Amt bis zur nächsten Wahl.</span>
              <div className="wn-scroll-still" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 4px 2px' }}>
                {spezln.map((sp) => {
                  const an = sp.id === aktuell;
                  return (
                    <button key={sp.id} type="button" onClick={() => setAktuell(sp.id)} aria-pressed={an} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none', border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                      <span style={{ display: 'inline-flex', borderRadius: '50%', boxShadow: an ? '0 0 0 3px var(--gold-700)' : 'none' }}>
                        <Avatar src={sp.photoUrl} name={sp.name} size={44} verein={sp.verein} />
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: an ? 'var(--gold-700)' : 'var(--ink-500)', whiteSpace: 'nowrap' }}>{an ? `👑 ${vorname(sp.name)}` : vorname(sp.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div role="radiogroup" aria-label="Wann wird gewählt" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>Wann wird gewählt?</span>
            {ZEITEN.map((z) => {
              const an = zeit === z.wert;
              return (
                <button key={z.wert} type="button" role="radio" aria-checked={an} onClick={() => setZeit(z.wert)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', background: 'var(--weiss)', border: an ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)' }}>
                  {radio(an)}
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{z.titel}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink-500)' }}>{z.text}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
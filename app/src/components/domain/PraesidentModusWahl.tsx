'use client';

import { useState } from 'react';

export type PraesidentModus = 'wp' | 'wahl';

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
    text: 'Beim Schließen des ersten Stammtischs im Jahr startet automatisch die Wahl, eine Woche offen. Der Gewinner ist Präsident fürs ganze Jahr. Der Admin kann das Amt jederzeit anpassen.',
  },
];

/**
 * Wie wird der Präsident bestimmt? (06.11.2026) Bei der Gründung und in den
 * Stammtisch-Einstellungen, zwei Karten mit kurzer Erklärung. Schickt das
 * Feld `praesidentModus` mit.
 */
export function PraesidentModusWahl({ start = 'wp' }: { start?: PraesidentModus }) {
  const [modus, setModus] = useState<PraesidentModus>(start);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Wie wird euer Präsident bestimmt?</span>
      <input type="hidden" name="praesidentModus" value={modus} />
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
    </div>
  );
}

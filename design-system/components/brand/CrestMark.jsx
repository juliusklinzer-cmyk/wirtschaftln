import React from 'react';

/**
 * Wirtschaftln — CrestMark
 * Typographic lockup of the club wordmark in Fraktur + motto.
 * Pass `crest` (an <img src>) to prepend the shield. `tone`:
 * 'gold' (on dark) | 'navy' (on light) | 'mono'.
 */
export function CrestMark({ crest = null, tone = 'gold', size = 'md', motto = true, align = 'center', style = {} }) {
  const sizes = { sm: { word: 26, crest: 34, motto: 11 }, md: { word: 40, crest: 52, motto: 13 }, lg: { word: 60, crest: 78, motto: 15 } };
  const s = sizes[size] || sizes.md;
  const tones = {
    gold: { word: 'var(--gold-bright)', sub: 'var(--pergament)', motto: 'var(--gold)' },
    navy: { word: 'var(--navy)', sub: 'var(--ink-700)', motto: 'var(--gold-700)' },
    mono: { word: 'currentColor', sub: 'currentColor', motto: 'currentColor' },
  };
  const t = tones[tone] || tones.gold;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start',
      textAlign: align, fontFamily: 'var(--font-ui)', gap: 2, ...style,
    }}>
      {crest && <img src={crest} alt="Wirtschaftln Wappen" style={{ height: s.crest, marginBottom: 8 }} />}
      <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: s.word, color: t.word, lineHeight: 1, letterSpacing: '0.01em' }}>Wirtschaftln</div>
      {motto && (
        <div style={{ fontSize: s.motto, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.motto, marginTop: 6 }}>
          München · seit 2019
        </div>
      )}
    </div>
  );
}

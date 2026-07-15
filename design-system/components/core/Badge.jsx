import React from 'react';

/**
 * Wirtschaftln — Badge
 * Small status/label pill. Tones map to semantic colors.
 * `gold` & `blau` are brand tones; `solid` fills, default is soft.
 */
export function Badge({ children, tone = 'neutral', solid = false, iconLeft = null, style = {} }) {
  const tones = {
    neutral: { soft: ['var(--ink-50)', 'var(--ink-700)'], solid: ['var(--ink-700)', '#fff'] },
    blau: { soft: ['var(--info-bg)', 'var(--muc-blau-700)'], solid: ['var(--muc-blau)', '#fff'] },
    gold: { soft: ['#F6ECD4', 'var(--gold-700)'], solid: ['var(--gold)', 'var(--navy-900)'] },
    erfolg: { soft: ['var(--erfolg-bg)', 'var(--erfolg)'], solid: ['var(--erfolg)', '#fff'] },
    warnung: { soft: ['var(--warnung-bg)', '#9A7510'], solid: ['var(--warnung)', '#fff'] },
    strafe: { soft: ['var(--strafe-bg)', 'var(--strafe)'], solid: ['var(--strafe)', '#fff'] },
  };
  const [bg, color] = (tones[tone] || tones.neutral)[solid ? 'solid' : 'soft'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12,
      letterSpacing: '0.01em', lineHeight: 1.2, background: bg, color,
      whiteSpace: 'nowrap', ...style,
    }}>
      {iconLeft && <span style={{ display: 'inline-flex' }}>{iconLeft}</span>}
      {children}
    </span>
  );
}

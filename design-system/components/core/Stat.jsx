import React from 'react';

/**
 * Wirtschaftln — Stat
 * Big tabular numeral with label + optional unit/icon. The
 * gamified workhorse: Hoibe getrunken, Abende dabei, Wirtshäuser.
 */
export function Stat({ value, label, unit = null, icon = null, tone = 'blau', align = 'left', size = 'md', style = {} }) {
  const colors = { blau: 'var(--muc-blau)', gold: 'var(--gold-700)', dark: 'var(--navy)', light: 'var(--weiss)', ink: 'var(--ink-900)' };
  const sizes = { sm: 26, md: 38, lg: 52 };
  const numColor = colors[tone] || colors.blau;
  const labColor = tone === 'light' ? 'rgba(246,240,226,0.7)' : 'var(--ink-500)';
  return (
    <div style={{ textAlign: align, fontFamily: 'var(--font-ui)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
        {icon && <span style={{ display: 'inline-flex', alignSelf: 'center', color: numColor }}>{icon}</span>}
        <span style={{ fontSize: sizes[size], fontWeight: 800, letterSpacing: '-0.03em', color: numColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: sizes[size] * 0.4, fontWeight: 700, color: numColor, opacity: 0.7 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: labColor, marginTop: 5 }}>{label}</div>
    </div>
  );
}

import React from 'react';

/**
 * Wirtschaftln — SectionHeader
 * Eyebrow + title row with optional Fraktur title and trailing action.
 */
export function SectionHeader({ eyebrow = null, title, fraktur = false, action = null, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, ...style }}>
      <div>
        {eyebrow && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-700)', marginBottom: 4 }}>{eyebrow}</div>}
        <div style={{
          fontFamily: fraktur ? 'var(--font-fraktur)' : 'var(--font-ui)',
          fontSize: fraktur ? 30 : 22, fontWeight: fraktur ? 400 : 800,
          letterSpacing: fraktur ? '0.01em' : '-0.02em', color: 'var(--ink-900)', lineHeight: 1.1,
        }}>{title}</div>
      </div>
      {action && <div style={{ flex: 'none' }}>{action}</div>}
    </div>
  );
}

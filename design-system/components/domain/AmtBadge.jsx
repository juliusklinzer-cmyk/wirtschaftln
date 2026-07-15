import React from 'react';

/**
 * Wirtschaftln — AmtBadge
 * A "Spaßamt" — honorary year-end office. Ceremonial gold seal with
 * Fraktur title. `size`: 'sm' (chip) | 'md' (seal).
 */
export function AmtBadge({ title, holder = null, icon = '🏅', size = 'md', style = {} }) {
  if (size === 'sm') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px 5px 8px',
        borderRadius: 'var(--r-pill)', background: 'var(--navy)', color: 'var(--gold-bright)',
        border: '1px solid var(--border-on-dark)', fontFamily: 'var(--font-ui)', ...style,
      }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 16, lineHeight: 1, color: 'var(--gold-bright)' }}>{title}</span>
      </span>
    );
  }
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '18px 16px', borderRadius: 'var(--r-lg)', background: 'var(--grad-navy)',
      border: '1.5px solid var(--gold)', boxShadow: 'var(--sh-md)', fontFamily: 'var(--font-ui)', ...style,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 'var(--r-pill)', background: 'var(--grad-gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        boxShadow: 'var(--sh-gold)', border: '2px solid var(--gold-bright)',
      }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 24, color: 'var(--gold-bright)', marginTop: 12, lineHeight: 1.1 }}>{title}</div>
      {holder && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pergament)', marginTop: 4, opacity: 0.85 }}>{holder}</div>}
    </div>
  );
}

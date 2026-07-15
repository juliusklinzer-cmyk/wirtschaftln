import React from 'react';

/**
 * Wirtschaftln — Avatar
 * Member photo with optional gold ring (for active office holders),
 * rank badge, and online/present dot. Falls back to initials.
 */
export function Avatar({ src, name = '', size = 48, ring = false, badge = null, present = false, style = {} }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const ringWidth = Math.max(2, Math.round(size * 0.05));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none', ...style }}>
      <div style={{
        width: size, height: size, borderRadius: 'var(--r-pill)',
        overflow: 'hidden', background: 'var(--ink-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: ring ? `${ringWidth}px solid var(--gold)` : `1px solid var(--ink-100)`,
        boxShadow: ring ? 'var(--sh-gold)' : 'var(--sh-xs)',
        boxSizing: 'border-box',
      }}>
        {src
          ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: size * 0.36, color: 'var(--ink-500)' }}>{initials}</span>}
      </div>
      {present && (
        <span style={{
          position: 'absolute', right: 0, bottom: 0, width: size * 0.28, height: size * 0.28,
          borderRadius: 'var(--r-pill)', background: 'var(--erfolg)',
          border: '2px solid var(--weiss)', boxSizing: 'border-box',
        }} />
      )}
      {badge != null && (
        <span style={{
          position: 'absolute', right: -2, top: -2, minWidth: size * 0.4, height: size * 0.4,
          padding: '0 4px', borderRadius: 'var(--r-pill)', background: 'var(--gold)',
          color: 'var(--navy-900)', fontFamily: 'var(--font-ui)', fontWeight: 800,
          fontSize: size * 0.24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--weiss)', boxSizing: 'border-box',
        }}>{badge}</span>
      )}
    </div>
  );
}

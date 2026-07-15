import React from 'react';

/**
 * Wirtschaftln — Card
 * Base surface container. `tone`: white | parchment | brand | dark.
 * Optional gold hairline frame for ceremonial content.
 */
export function Card({ children, tone = 'white', framed = false, pad = 20, interactive = false, onClick, style = {} }) {
  const tones = {
    white: { bg: 'var(--surface-card)', color: 'var(--text-body)', border: '1px solid var(--ink-100)' },
    parchment: { bg: 'var(--pergament)', color: 'var(--ink-700)', border: '1px solid var(--pergament-edge)' },
    brand: { bg: 'var(--grad-blau)', color: '#fff', border: 'none' },
    dark: { bg: 'var(--grad-navy)', color: 'var(--pergament)', border: 'none' },
  };
  const t = tones[tone] || tones.white;
  return (
    <div
      onClick={onClick}
      style={{
        background: t.bg, color: t.color,
        border: framed ? '1.5px solid var(--gold)' : t.border,
        borderRadius: 'var(--r-lg)', padding: pad,
        boxShadow: tone === 'white' ? 'var(--sh-sm)' : 'var(--sh-md)',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
        boxSizing: 'border-box', ...style,
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-lg)'; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = tone === 'white' ? 'var(--sh-sm)' : 'var(--sh-md)'; } : undefined}
    >
      {children}
    </div>
  );
}

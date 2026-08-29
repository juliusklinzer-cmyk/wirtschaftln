'use client';

import { useState } from 'react';

/**
 * Wirtschaftln, IconButton
 * Quadratisches Icon-Control für Toolbar- und Nav-Aktionen.
 */
export function IconButton({
  children,
  label,
  variant = 'soft',
  size = 40,
  onClick,
  style = {},
  ...rest
}: {
  children: React.ReactNode;
  label: string;
  variant?: 'soft' | 'blau' | 'gold' | 'ghost' | 'outline';
  size?: number;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  style?: React.CSSProperties;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'onClick'>) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const palettes = {
    soft: { bg: 'var(--ink-50)', bgHover: 'var(--ink-100)', color: 'var(--ink-700)', border: 'none' },
    blau: { bg: 'var(--muc-blau)', bgHover: 'var(--muc-blau-600)', color: '#fff', border: 'none' },
    gold: { bg: 'var(--gold)', bgHover: 'var(--gold-600)', color: 'var(--navy-900)', border: 'none' },
    ghost: { bg: 'transparent', bgHover: 'var(--ink-50)', color: 'var(--ink-700)', border: 'none' },
    outline: { bg: 'var(--weiss)', bgHover: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--ink-200)' },
  };
  const p = palettes[variant] ?? palettes.soft;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      onTouchStart={() => setPress(true)}
      onTouchEnd={() => setPress(false)}
      style={{
        width: size, height: size, flex: 'none', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-md)',
        background: hover ? p.bgHover : p.bg, color: p.color, border: p.border,
        cursor: 'pointer', transform: press ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform var(--dur-fast) var(--ease-standard), background var(--dur-base) var(--ease-standard)',
        WebkitTapHighlightColor: 'transparent', ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

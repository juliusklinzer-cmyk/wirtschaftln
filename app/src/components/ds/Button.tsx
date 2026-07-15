'use client';

import { useState } from 'react';

/**
 * Wirtschaftln — Button
 * Varianten: primary (Münchner Blau), gold (zeremonieller CTA),
 * secondary (Outline), ghost, danger (Kasse).
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  onClick,
  type = 'button',
  style = {},
  ...rest
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'type' | 'onClick'>) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);

  const sizes = {
    sm: { padding: '7px 14px', fontSize: 13, radius: 'var(--r-sm)', gap: 6, height: 34 },
    md: { padding: '10px 18px', fontSize: 15, radius: 'var(--r-md)', gap: 8, height: 44 },
    lg: { padding: '14px 24px', fontSize: 17, radius: 'var(--r-md)', gap: 10, height: 54 },
  };
  const s = sizes[size] ?? sizes.md;

  const palettes = {
    primary: {
      bg: 'var(--muc-blau)', bgHover: 'var(--muc-blau-600)', color: 'var(--weiss)',
      border: 'none', shadow: 'var(--sh-sm)',
    },
    gold: {
      bg: 'var(--grad-gold)', bgHover: 'var(--gold-600)', color: 'var(--navy-900)',
      border: 'none', shadow: 'var(--sh-gold)',
    },
    secondary: {
      bg: 'var(--weiss)', bgHover: 'var(--ink-50)', color: 'var(--muc-blau)',
      border: '1.5px solid var(--muc-blau)', shadow: 'none',
    },
    ghost: {
      bg: 'transparent', bgHover: 'var(--ink-50)', color: 'var(--ink-700)',
      border: '1.5px solid transparent', shadow: 'none',
    },
    danger: {
      bg: 'var(--strafe)', bgHover: '#A93226', color: 'var(--weiss)',
      border: 'none', shadow: 'var(--sh-sm)',
    },
  };
  const p = palettes[variant] ?? palettes.primary;

  const css: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    width: fullWidth ? '100%' : 'auto',
    minHeight: s.height,
    boxSizing: 'border-box',
    padding: s.padding,
    fontFamily: 'var(--font-ui)',
    fontWeight: 700,
    fontSize: s.fontSize,
    lineHeight: 1,
    letterSpacing: '-0.01em',
    background: disabled ? 'var(--ink-100)' : hover && !press ? p.bgHover : p.bg,
    border: disabled ? '1.5px solid transparent' : p.border,
    borderRadius: s.radius,
    boxShadow: disabled ? 'none' : press ? 'none' : p.shadow,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transform: press && !disabled ? 'scale(0.97)' : 'scale(1)',
    transition:
      'transform var(--dur-fast) var(--ease-standard), background var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
    color: disabled ? 'var(--ink-300)' : p.color,
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      onTouchStart={() => setPress(true)}
      onTouchEnd={() => setPress(false)}
      style={css}
      {...rest}
    >
      {iconLeft && <span style={{ display: 'inline-flex' }}>{iconLeft}</span>}
      {children}
      {iconRight && <span style={{ display: 'inline-flex' }}>{iconRight}</span>}
    </button>
  );
}

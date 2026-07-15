'use client';

/**
 * Wirtschaftln — Card
 * Basis-Fläche. `tone`: white | parchment | brand | dark.
 * Optionaler Gold-Haarlinienrahmen für zeremonielle Inhalte.
 */
export function Card({
  children,
  tone = 'white',
  framed = false,
  pad = 20,
  interactive = false,
  onClick,
  style = {},
}: {
  children: React.ReactNode;
  tone?: 'white' | 'parchment' | 'brand' | 'dark';
  framed?: boolean;
  pad?: number | string;
  interactive?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}) {
  const tones = {
    white: { bg: 'var(--surface-card)', color: 'var(--text-body)', border: '1px solid var(--ink-100)' },
    parchment: { bg: 'var(--pergament)', color: 'var(--ink-700)', border: '1px solid var(--pergament-edge)' },
    brand: { bg: 'var(--grad-blau)', color: '#fff', border: 'none' },
    dark: { bg: 'var(--grad-navy)', color: 'var(--pergament)', border: 'none' },
  };
  const t = tones[tone] ?? tones.white;
  const restShadow = tone === 'white' ? 'var(--sh-sm)' : 'var(--sh-md)';
  return (
    <div
      onClick={onClick}
      style={{
        background: t.bg,
        color: t.color,
        border: framed ? '1.5px solid var(--gold)' : t.border,
        borderRadius: 'var(--r-lg)',
        padding: pad,
        boxShadow: restShadow,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'transform var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
        boxSizing: 'border-box',
        ...style,
      }}
      onMouseEnter={
        interactive
          ? (e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--sh-lg)';
            }
          : undefined
      }
      onMouseLeave={
        interactive
          ? (e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = restShadow;
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

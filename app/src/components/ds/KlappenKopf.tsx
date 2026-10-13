import { Icon } from './Icon';

/**
 * Wirtschaftln, KlappenKopf
 * Einheitlicher <summary>-Kopf für alle Klappen: optionales Icon links,
 * Titel, optionaler Chip (z. B. „+1 WP"), rechts der Pfeil, der sich beim
 * Aufklappen dreht (CSS: .wn-klappe-pfeil in globals.css).
 */
export function KlappenKopf({
  children,
  chip = null,
  icon = null,
  pad = '14px 18px',
}: {
  children: React.ReactNode;
  chip?: React.ReactNode;
  icon?: React.ReactNode;
  pad?: string;
}) {
  return (
    <summary
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: pad,
        fontSize: 15, fontWeight: 800, color: 'var(--ink-900)',
        cursor: 'pointer', listStyle: 'none', userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon && <span style={{ flex: 'none', display: 'inline-flex', color: 'var(--muc-blau)' }}>{icon}</span>}
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      {chip}
      <span className="wn-klappe-pfeil" style={{ flex: 'none', display: 'inline-flex', color: 'var(--ink-300)' }}>
        <Icon name="chevron" size={16} />
      </span>
    </summary>
  );
}

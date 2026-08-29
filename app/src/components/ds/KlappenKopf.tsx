import { Icon } from './Icon';

/**
 * Wirtschaftln, KlappenKopf
 * Einheitlicher <summary>-Kopf für alle Klappen: Titel links, optionaler
 * Chip (z. B. „+1 WP"), rechts der Pfeil, der sich beim Aufklappen dreht
 * (CSS: .wn-klappe-pfeil in globals.css).
 */
export function KlappenKopf({ children, chip = null }: { children: React.ReactNode; chip?: React.ReactNode }) {
  return (
    <summary
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
        fontSize: 15, fontWeight: 800, color: 'var(--ink-900)',
        cursor: 'pointer', listStyle: 'none', userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      {chip}
      <span className="wn-klappe-pfeil" style={{ flex: 'none', display: 'inline-flex', color: 'var(--ink-300)' }}>
        <Icon name="chevron" size={16} />
      </span>
    </summary>
  );
}

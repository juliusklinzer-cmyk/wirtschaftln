import { Icon } from '@/components/ds';

/** Statische Sterne-Anzeige (Ø-Bewertung). */
export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= Math.round(rating) ? 'var(--gold)' : 'var(--ink-200)', display: 'inline-flex' }}>
          <Icon name="star" size={size} stroke={0} color={i <= Math.round(rating) ? 'var(--gold)' : 'var(--ink-200)'} style={{ fill: 'currentColor' } as React.CSSProperties} />
        </span>
      ))}
      {rating > 0 && (
        <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-700)', marginLeft: 4 }}>
          {rating.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
      )}
    </span>
  );
}

import React from 'react';
import { Badge } from '../core/Badge.jsx';

/**
 * Wirtschaftln — StarRating
 * Gold five-star rating. Read-only display or interactive.
 */
export function StarRating({ value = 0, max = 5, size = 18, onChange = null, showValue = false, style = {} }) {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    const filled = i <= Math.round(value);
    stars.push(
      <span
        key={i}
        onClick={onChange ? () => onChange(i) : undefined}
        style={{
          fontSize: size, lineHeight: 1, cursor: onChange ? 'pointer' : 'default',
          color: filled ? 'var(--gold)' : 'var(--ink-200)',
          textShadow: filled ? '0 1px 1px rgba(166,132,62,0.3)' : 'none',
        }}
      >★</span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ui)', ...style }}>
      <span style={{ display: 'inline-flex', gap: 2 }}>{stars}</span>
      {showValue && <span style={{ fontSize: size * 0.78, fontWeight: 700, color: 'var(--ink-700)', fontVariantNumeric: 'tabular-nums', marginLeft: 2 }}>{Number(value).toFixed(1)}</span>}
    </span>
  );
}

/**
 * Wirtschaftln — WirtshausCard
 * Tavern card: photo, name, district, rating, visit status.
 * The collectible unit — every Wirtshaus visited once.
 */
export function WirtshausCard({
  name, photo, bezirk = null, rating = 0, besuchtAm = null,
  naechstes = false, onClick, style = {},
}) {
  return (
    <div onClick={onClick} style={{
      width: '100%', background: 'var(--surface-card)', borderRadius: 'var(--r-lg)',
      border: naechstes ? '1.5px solid var(--gold)' : '1px solid var(--ink-100)',
      boxShadow: naechstes ? 'var(--sh-md)' : 'var(--sh-sm)', overflow: 'hidden',
      fontFamily: 'var(--font-ui)', cursor: onClick ? 'pointer' : 'default', ...style,
    }}>
      <div style={{ position: 'relative', height: 132, background: 'var(--ink-100)' }}>
        {photo && <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          {naechstes
            ? <Badge tone="gold" solid iconLeft="📍">Nächstes Mal</Badge>
            : besuchtAm
              ? <Badge tone="blau" solid iconLeft="✓">Besucht</Badge>
              : <Badge tone="neutral" solid>Offen</Badge>}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            {bezirk && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginTop: 2 }}>{bezirk}</div>}
          </div>
          <StarRating value={rating} size={15} showValue />
        </div>
        {besuchtAm && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-400, var(--ink-500))', marginTop: 10, borderTop: '1px solid var(--ink-100)', paddingTop: 10 }}>Besucht am {besuchtAm}</div>}
      </div>
    </div>
  );
}

import React from 'react';
import { Avatar } from '../core/Avatar.jsx';
import { Badge } from '../core/Badge.jsx';

/**
 * Wirtschaftln — PersonCard
 * Member card with photo, name, honorary office (Amt) and the three
 * core stats: Abende dabei, Hoibe getrunken, Wirtshäuser. The social
 * unit of the club. `layout`: 'tile' (vertical) | 'row' (horizontal).
 */
export function PersonCard({
  name, photo, amt = null, since = null,
  abende = 0, mass = 0, wirtshaeuser = 0,
  ring = false, layout = 'tile', onClick, style = {},
}) {
  const stats = [
    { v: abende, l: 'Abende' },
    { v: mass, l: 'Hoibe' },
    { v: wirtshaeuser, l: 'Wirtsh.' },
  ];
  const StatStrip = (
    <div style={{ display: 'flex', gap: 0 }}>
      {stats.map((s, i) => (
        <div key={s.l} style={{
          flex: 1, textAlign: 'center',
          borderLeft: i ? '1px solid var(--ink-100)' : 'none', padding: '0 4px',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--muc-blau)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{s.v}</div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 4 }}>{s.l}</div>
        </div>
      ))}
    </div>
  );

  if (layout === 'row') {
    return (
      <div onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: 14,
        background: 'var(--surface-card)', border: '1px solid var(--ink-100)',
        borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', fontFamily: 'var(--font-ui)',
        cursor: onClick ? 'pointer' : 'default', ...style,
      }}>
        <Avatar src={photo} name={name} size={56} ring={ring} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{name}</div>
          {amt && <div style={{ marginTop: 4 }}><Badge tone="gold" iconLeft="★">{amt}</Badge></div>}
        </div>
        <div style={{ width: 180 }}>{StatStrip}</div>
      </div>
    );
  }

  return (
    <div onClick={onClick} style={{
      width: '100%', background: 'var(--surface-card)', border: '1px solid var(--ink-100)',
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
      fontFamily: 'var(--font-ui)', cursor: onClick ? 'pointer' : 'default', ...style,
    }}>
      <div style={{ padding: '20px 18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'var(--pergament)' }}>
        <Avatar src={photo} name={name} size={76} ring={ring} />
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink-900)', marginTop: 12 }}>{name}</div>
        {amt
          ? <div style={{ marginTop: 6 }}><Badge tone="gold" solid iconLeft="★">{amt}</Badge></div>
          : since && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginTop: 4 }}>Mitglied seit {since}</div>}
      </div>
      <div style={{ padding: '14px 12px' }}>{StatStrip}</div>
    </div>
  );
}

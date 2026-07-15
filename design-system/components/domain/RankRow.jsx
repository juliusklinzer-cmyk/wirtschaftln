import React from 'react';
import { Avatar } from '../core/Avatar.jsx';

/**
 * Wirtschaftln — RankRow
 * One leaderboard line: rank, member, value. Top-3 get gold/silver/
 * bronze rank chips; `me` highlights the current member.
 */
export function RankRow({ rank, name, photo, value, unit = 'Hoibe', me = false, amt = null, style = {} }) {
  const medal = { 1: 'var(--gold)', 2: '#B8C0CC', 3: '#C9853F' };
  const isTop = rank <= 3;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)',
      background: me ? 'var(--info-bg)' : 'transparent',
      border: me ? '1.5px solid var(--muc-blau)' : '1.5px solid transparent', ...style,
    }}>
      <div style={{
        width: 30, height: 30, flex: 'none', borderRadius: 'var(--r-pill)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums',
        background: isTop ? medal[rank] : 'var(--ink-50)',
        color: isTop ? 'var(--navy-900)' : 'var(--ink-500)',
        boxShadow: isTop ? 'var(--sh-xs)' : 'none',
      }}>{rank}</div>
      <Avatar src={photo} name={name} size={40} ring={rank === 1} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}{me && <span style={{ color: 'var(--muc-blau)', fontWeight: 700 }}> · Du</span>}</div>
        {amt && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-700)' }}>{amt}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--muc-blau)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400, var(--ink-500))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{unit}</span>
      </div>
    </div>
  );
}

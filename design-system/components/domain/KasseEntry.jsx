import React from 'react';
import { Avatar } from '../core/Avatar.jsx';

/**
 * Wirtschaftln — KasseEntry
 * One Vereinskasse line: who, why (Grund), how much. Penalties show red
 * & negative; payments green. `status` drives the pill: 'offen' |
 * 'beglichen' | 'aufgehoben' (falls back to `paid` / sign). Pass
 * `onClick` to make a Forderung tappable. Set `kind="ausgabe"` for a
 * club expenditure (icon tile instead of avatar, no status pill).
 */
export function KasseEntry({ name, photo, grund, betrag, datum = null, paid = false, status, gemeldet = false, kind = 'strafe', icon = '🧾', onClick, style = {} }) {
  const isAusgabe = kind === 'ausgabe';
  const isStrafe = betrag < 0 && !isAusgabe;
  const st = status || (betrag >= 0 ? 'einzahlung' : (paid ? 'beglichen' : 'offen'));
  const aufgehoben = st === 'aufgehoben';
  const pill = {
    offen:     ['var(--strafe)', 'Offen'],
    beglichen: ['var(--erfolg)', 'Bezahlt'],
    aufgehoben:['var(--ink-300)', 'Aufgehoben'],
  }[st];
  const amountColor = isAusgabe ? 'var(--ink-700)' : (aufgehoben ? 'var(--ink-300)' : (st === 'beglichen' ? 'var(--erfolg)' : (isStrafe ? 'var(--strafe)' : 'var(--erfolg)')));
  const sign = betrag > 0 ? '+' : '−';
  const abs = Math.abs(betrag).toFixed(2).replace('.', ',');
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        background: 'var(--surface-card)', borderRadius: 'var(--r-md)',
        border: '1px solid var(--ink-100)', fontFamily: 'var(--font-ui)',
        cursor: onClick ? 'pointer' : 'default', opacity: aufgehoben ? 0.7 : 1, ...style,
      }}
    >
      {isAusgabe
        ? <span style={{ width: 40, height: 40, flex: 'none', borderRadius: 'var(--r-md)', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</span>
        : <Avatar src={photo} name={name} size={40} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {name}{gemeldet && <span style={{ fontSize: 13 }}>⚖️</span>}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {grund}{datum && <span style={{ color: 'var(--ink-300)' }}> · {datum}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flex: 'none' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: amountColor, fontVariantNumeric: 'tabular-nums', textDecoration: aufgehoben ? 'line-through' : 'none' }}>{sign} {abs} €</div>
        {isAusgabe
          ? <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-300)' }}>Ausgabe</div>
          : isStrafe && pill && (
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: pill[0] }}>
              {pill[1]}
            </div>
          )}
      </div>
    </div>
  );
}

import React from 'react';

/**
 * Wirtschaftln — VotePill
 * Availability vote for a Termin: Zusagen / Vielleicht / Absagen.
 * Segmented, semantic colors, fills the active choice.
 */
export function VotePill({ value = null, onChange, style = {} }) {
  const opts = [
    { key: 'zu', label: 'Zusagen', icon: '✓', on: 'var(--erfolg)' },
    { key: 'vielleicht', label: 'Vielleicht', icon: '~', on: 'var(--warnung)' },
    { key: 'ab', label: 'Absagen', icon: '✕', on: 'var(--strafe)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, ...style }}>
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onChange && onChange(o.key)}
            style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '11px 10px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14,
              border: active ? '1.5px solid transparent' : '1.5px solid var(--ink-200)',
              background: active ? o.on : 'var(--weiss)',
              color: active ? '#fff' : 'var(--ink-500)',
              boxShadow: active ? 'var(--sh-sm)' : 'none',
              transition: 'all var(--dur-base) var(--ease-standard)',
            }}
          >
            <span style={{ fontWeight: 800 }}>{o.icon}</span>{o.label}
          </button>
        );
      })}
    </div>
  );
}

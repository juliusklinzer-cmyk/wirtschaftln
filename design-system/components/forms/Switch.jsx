import React from 'react';

/**
 * Wirtschaftln — Switch
 * On/off toggle. On = Münchner Blau (or gold). Apple-style knob.
 */
export function Switch({ checked = false, onChange, disabled = false, tone = 'blau', label = null, style = {} }) {
  const onColor = tone === 'gold' ? 'var(--gold)' : 'var(--muc-blau)';
  const toggle = (
    <button
      role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      style={{
        width: 48, height: 28, flex: 'none', borderRadius: 'var(--r-pill)', border: 'none',
        background: checked ? onColor : 'var(--ink-200)', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 3, display: 'flex', justifyContent: checked ? 'flex-end' : 'flex-start',
        alignItems: 'center', transition: 'background var(--dur-base) var(--ease-standard)',
        opacity: disabled ? 0.5 : 1, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.12)',
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: 'var(--r-pill)', background: 'var(--weiss)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'all var(--dur-base) var(--ease-spring)',
      }} />
    </button>
  );
  if (!label) return toggle;
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, color: 'var(--ink-700)', cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      {toggle}{label}
    </label>
  );
}

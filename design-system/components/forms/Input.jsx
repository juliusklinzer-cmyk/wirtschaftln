import React, { useState } from 'react';

/**
 * Wirtschaftln — Input
 * Text field with label, optional icon, hint/error. Apple-clean,
 * soft border that warms to Münchner Blau on focus.
 */
export function Input({
  label, value, onChange, placeholder, type = 'text', iconLeft = null,
  hint = null, error = null, disabled = false, id, style = {}, ...rest
}) {
  const [focus, setFocus] = useState(false);
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const borderColor = error ? 'var(--strafe)' : (focus ? 'var(--muc-blau)' : 'var(--ink-200)');
  return (
    <div style={{ fontFamily: 'var(--font-ui)', ...style }}>
      {label && (
        <label htmlFor={inputId} style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>{label}</label>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
        background: disabled ? 'var(--ink-50)' : 'var(--weiss)',
        border: `1.5px solid ${borderColor}`, borderRadius: 'var(--r-md)',
        boxShadow: focus && !error ? 'var(--ring)' : 'none',
        transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
      }}>
        {iconLeft && <span style={{ display: 'inline-flex', color: 'var(--ink-300)' }}>{iconLeft}</span>}
        <input
          id={inputId} type={type} value={value} onChange={onChange}
          placeholder={placeholder} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            padding: '12px 0', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500,
            color: 'var(--ink-900)', minWidth: 0,
          }}
          {...rest}
        />
      </div>
      {(hint || error) && (
        <div style={{ fontSize: 12, fontWeight: 500, marginTop: 6, color: error ? 'var(--strafe)' : 'var(--ink-500)' }}>{error || hint}</div>
      )}
    </div>
  );
}

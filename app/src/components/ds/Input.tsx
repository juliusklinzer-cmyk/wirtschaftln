'use client';

import { useState } from 'react';

/**
 * Wirtschaftln, Input
 * Textfeld mit Label, optionalem Icon, Hint/Error. Apple-clean,
 * Rahmen wird bei Fokus Münchner Blau.
 */
export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  iconLeft = null,
  hint = null,
  error = null,
  disabled = false,
  id,
  name,
  style = {},
  ...rest
}: {
  label?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: string;
  iconLeft?: React.ReactNode;
  hint?: string | null;
  error?: string | null;
  disabled?: boolean;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'onChange' | 'value' | 'type'>) {
  const [focus, setFocus] = useState(false);
  const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const borderColor = error ? 'var(--strafe)' : focus ? 'var(--muc-blau)' : 'var(--ink-200)';
  return (
    <div style={{ fontFamily: 'var(--font-ui)', ...style }}>
      {label && (
        <label htmlFor={inputId} style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
          background: disabled ? 'var(--ink-50)' : 'var(--weiss)',
          border: `1.5px solid ${borderColor}`, borderRadius: 'var(--r-md)',
          boxShadow: focus && !error ? 'var(--ring)' : 'none',
          transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
        }}
      >
        {iconLeft && <span style={{ display: 'inline-flex', color: 'var(--ink-300)' }}>{iconLeft}</span>}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            padding: '12px 0', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500,
            color: 'var(--ink-900)', minWidth: 0,
          }}
          {...rest}
        />
      </div>
      {(hint || error) && (
        <div style={{ fontSize: 12, fontWeight: 500, marginTop: 6, color: error ? 'var(--strafe)' : 'var(--ink-500)' }}>
          {error || hint}
        </div>
      )}
    </div>
  );
}

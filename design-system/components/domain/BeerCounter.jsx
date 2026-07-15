import React, { useState } from 'react';

/**
 * Wirtschaftln — BeerCounter
 * The signature gamified control: tally Hoibe for the evening with a
 * big tappable stepper. Stein-gold accents, spring pop on change.
 */
export function BeerCounter({ value = 0, onChange, label = 'Hoibe heut’', max = 20, style = {} }) {
  const [pop, setPop] = useState(false);
  const set = (next) => {
    const v = Math.max(0, Math.min(max, next));
    setPop(true); setTimeout(() => setPop(false), 180);
    onChange && onChange(v);
  };
  const StepBtn = ({ dir, children }) => (
    <button
      onClick={() => set(value + dir)}
      style={{
        width: 52, height: 52, flex: 'none', borderRadius: 'var(--r-pill)', cursor: 'pointer',
        border: 'none', fontSize: 26, fontWeight: 700, lineHeight: 1,
        background: dir > 0 ? 'var(--grad-gold)' : 'var(--ink-50)',
        color: dir > 0 ? 'var(--navy-900)' : 'var(--ink-500)',
        boxShadow: dir > 0 ? 'var(--sh-gold)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform var(--dur-fast) var(--ease-spring)',
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  );
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '16px 20px', background: 'var(--surface-card)', borderRadius: 'var(--r-lg)',
      border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', fontFamily: 'var(--font-ui)', ...style,
    }}>
      <StepBtn dir={-1}>−</StepBtn>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{
          fontSize: 52, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--gold-700)',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          transform: pop ? 'scale(1.12)' : 'scale(1)', transition: 'transform var(--dur-base) var(--ease-spring)',
        }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 4 }}>{label}</div>
      </div>
      <StepBtn dir={+1}>+</StepBtn>
    </div>
  );
}

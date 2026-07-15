import React from 'react';

/**
 * Wirtschaftln — SegmentedTabs
 * Apple-style segmented control. Used for filters
 * (Worldwide / Saison / Allzeit) and view switches.
 */
export function SegmentedTabs({ tabs = [], value, onChange, style = {} }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'var(--ink-100)', borderRadius: 'var(--r-pill)',
      padding: 3, gap: 2, ...style,
    }}>
      {tabs.map((tab) => {
        const key = typeof tab === 'string' ? tab : tab.value;
        const lbl = typeof tab === 'string' ? tab : tab.label;
        const active = key === value;
        return (
          <button
            key={key}
            onClick={() => onChange && onChange(key)}
            style={{
              border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)',
              padding: '7px 16px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13,
              color: active ? 'var(--muc-blau)' : 'var(--ink-500)',
              background: active ? 'var(--weiss)' : 'transparent',
              boxShadow: active ? 'var(--sh-xs)' : 'none',
              transition: 'all var(--dur-base) var(--ease-standard)', whiteSpace: 'nowrap',
            }}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}

'use client';

/**
 * Wirtschaftln — SegmentedTabs
 * Apple-Style Segmented Control für Filter und Ansichts-Wechsel.
 */
export function SegmentedTabs({
  tabs = [],
  value,
  onChange,
  style = {},
}: {
  tabs: Array<string | { value: string; label: string }>;
  value: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'inline-flex', background: 'var(--ink-100)', borderRadius: 'var(--r-pill)',
        padding: 3, gap: 2, ...style,
      }}
    >
      {tabs.map((tab) => {
        const key = typeof tab === 'string' ? tab : tab.value;
        const lbl = typeof tab === 'string' ? tab : tab.label;
        const active = key === value;
        return (
          <button
            key={key}
            onClick={() => onChange?.(key)}
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

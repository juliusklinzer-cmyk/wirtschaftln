'use client';

import { useTransition } from 'react';
import { abstimmen } from '@/app/(app)/termin/actions';

const OPTIONS = [
  { wert: 'zu', label: 'Zusagen', color: 'var(--erfolg)', bg: 'var(--erfolg-bg)' },
  { wert: 'vielleicht', label: 'Vielleicht', color: '#9A7510', bg: 'var(--warnung-bg)' },
  { wert: 'ab', label: 'Absagen', color: 'var(--strafe)', bg: 'var(--strafe-bg)' },
] as const;

export function VotePills({
  terminId,
  current,
  onDark = false,
}: {
  terminId: string;
  current: 'zu' | 'vielleicht' | 'ab' | null;
  onDark?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {OPTIONS.map((o) => {
        const active = current === o.wert;
        return (
          <button
            key={o.wert}
            disabled={pending}
            onClick={() => startTransition(() => abstimmen(terminId, o.wert))}
            style={{
              flex: 1,
              border: active ? `1.5px solid ${o.color}` : '1.5px solid transparent',
              cursor: 'pointer',
              borderRadius: 'var(--r-pill)',
              padding: '10px 8px',
              fontFamily: 'var(--font-ui)',
              fontWeight: 800,
              fontSize: 13,
              color: active ? o.color : onDark ? 'var(--pergament)' : 'var(--ink-500)',
              background: active ? o.bg : onDark ? 'rgba(255,255,255,0.10)' : 'var(--ink-50)',
              transition: 'all var(--dur-base) var(--ease-standard)',
              opacity: pending ? 0.6 : 1,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

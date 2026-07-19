'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ds';

/**
 * Klappe mit Server-Action nach Julius' UI-Prinzip: nach dem Speichern
 * schließt sie sich, das Formular wird geleert und eine Erfolgsmeldung
 * erscheint. Felder kommen als children rein, der Submit-Knopf gehört uns.
 */
export function ErfolgsKlappe({
  titel,
  erfolgText,
  submitLabel,
  submitVariant = 'primary',
  action,
  children,
}: {
  titel: string;
  erfolgText: string;
  submitLabel: string;
  submitVariant?: 'primary' | 'secondary' | 'gold' | 'danger';
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [offen, setOffen] = useState(false);
  const [danke, setDanke] = useState(false);
  const [pending, setPending] = useState(false);

  const speichern = async (formData: FormData) => {
    setPending(true);
    try {
      await action(formData);
      formRef.current?.reset();
      setOffen(false);
      setDanke(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <details
        open={offen}
        onToggle={(e) => {
          setOffen((e.currentTarget as HTMLDetailsElement).open);
          if ((e.currentTarget as HTMLDetailsElement).open) setDanke(false);
        }}
        style={{
          background: 'var(--weiss)', border: '1px solid var(--ink-100)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
        }}
      >
        <summary style={{ padding: '14px 18px', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)', cursor: 'pointer', listStyle: 'none', userSelect: 'none' }}>
          {titel}
        </summary>
        <div style={{ padding: '4px 18px 18px' }}>
          <form ref={formRef} action={speichern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {children}
            <Button type="submit" variant={submitVariant} fullWidth disabled={pending}>
              {pending ? 'Moment…' : submitLabel}
            </Button>
          </form>
        </div>
      </details>
      {danke && !offen && (
        <div
          style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center',
            background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)',
            fontSize: 13, fontWeight: 800, color: 'var(--erfolg)',
          }}
        >
          {erfolgText}
        </div>
      )}
    </div>
  );
}

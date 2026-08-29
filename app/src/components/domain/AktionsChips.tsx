'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ds';

export type AktionsChip = {
  key: string;
  /** Kurzer Chip-Text, z. B. „⚖️ Melden" */
  chip: string;
  /** Überschrift überm aufgeklappten Formular */
  titel: string;
  erfolgText: string;
  submitLabel: string;
  submitVariant?: 'primary' | 'secondary' | 'gold' | 'danger';
  action: (formData: FormData) => Promise<void>;
  felder: React.ReactNode;
};

/**
 * Kompakte Aktions-Leiste nach Julius' UI-Prinzip (Nachfolger der ErfolgsKlappe):
 * kleine Chips statt vollbreiter Klappen, nur die angetippte Aktion klappt
 * drunter auf, nach dem Speichern schließt sie sich und eine Erfolgsmeldung
 * erscheint.
 */
export function AktionsChips({ aktionen }: { aktionen: AktionsChip[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [offen, setOffen] = useState<string | null>(null);
  const [danke, setDanke] = useState<AktionsChip | null>(null);
  const [pending, setPending] = useState(false);
  const aktiv = aktionen.find((a) => a.key === offen) ?? null;

  const speichern = async (formData: FormData) => {
    if (!aktiv) return;
    setPending(true);
    try {
      await aktiv.action(formData);
      formRef.current?.reset();
      setDanke(aktiv);
      setOffen(null);
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {aktionen.map((a) => {
          const an = a.key === offen;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                setOffen(an ? null : a.key);
                setDanke(null);
              }}
              style={{
                padding: '8px 13px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
                border: an ? '1.5px solid var(--navy)' : '1.5px solid var(--ink-200)',
                background: an ? 'var(--navy)' : 'var(--weiss)',
                color: an ? 'var(--weiss)' : 'var(--ink-700)',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800,
                boxShadow: 'var(--sh-xs)', userSelect: 'none',
              }}
            >
              {a.chip}
            </button>
          );
        })}
      </div>

      {aktiv && (
        <div style={{ background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', padding: '14px 16px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 10 }}>{aktiv.titel}</div>
          <form ref={formRef} action={speichern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {aktiv.felder}
            <Button type="submit" variant={aktiv.submitVariant ?? 'primary'} fullWidth disabled={pending}>
              {pending ? 'Moment…' : aktiv.submitLabel}
            </Button>
          </form>
        </div>
      )}

      {danke && !aktiv && (
        <div
          style={{
            padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center',
            background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)',
            fontSize: 13, fontWeight: 800, color: 'var(--erfolg)',
          }}
        >
          {danke.erfolgText}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ds';
import { WirtshausSuche } from '@/components/domain/WirtshausSuche';
import type { BekanntesWirtshaus } from '@/lib/wirtshaus-abgleich';

/**
 * „Reservierung ändern"-Klappe: schließt sich nach dem Speichern von selbst
 * und zeigt eine Erfolgsmeldung (Julius' UI-Prinzip: jede Änderung kriegt
 * a Rückmeldung, und offene Fenster gehen danach zua).
 */
export function ReservierungAendern({
  action,
  bekannte,
}: {
  action: (formData: FormData) => Promise<void>;
  bekannte: BekanntesWirtshaus[];
}) {
  const [offen, setOffen] = useState(false);
  const [erfolg, setErfolg] = useState(false);

  const speichern = async (formData: FormData) => {
    await action(formData);
    setOffen(false);
    setErfolg(true);
  };

  return (
    <div>
      <details
        open={offen}
        onToggle={(e) => {
          setOffen((e.currentTarget as HTMLDetailsElement).open);
          if ((e.currentTarget as HTMLDetailsElement).open) setErfolg(false);
        }}
        style={{
          background: 'var(--weiss)', border: '1px solid var(--ink-100)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
        }}
      >
        <summary style={{ padding: '14px 18px', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)', cursor: 'pointer', listStyle: 'none', userSelect: 'none' }}>
          🔁 Reservierung ändern (anderes Wirtshaus)
        </summary>
        <div style={{ padding: '4px 18px 18px' }}>
          <form action={speichern} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <WirtshausSuche bekannte={bekannte} />
            <Button type="submit" fullWidth variant="gold">
              Wirtshaus ändern
            </Button>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
              Beim Ändern kriegen alle Spezln wieder a Push-Nachricht und a Mail mit dem neuen Wirtshaus.
            </div>
          </form>
        </div>
      </details>
      {erfolg && !offen && (
        <div
          style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center',
            background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)',
            fontSize: 13, fontWeight: 800, color: 'var(--erfolg)',
          }}
        >
          ✓ Wirtshaus gändert — alle Spezln kriegen Bescheid! 📣
        </div>
      )}
    </div>
  );
}

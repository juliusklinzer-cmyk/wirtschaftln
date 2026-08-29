'use client';

import { useState } from 'react';
import { Button, KlappenKopf } from '@/components/ds';

/**
 * Kassenwart-Wahlergebnis eintragen (nur Admin & Präsident): kein Amts-Dropdown
 * mehr, es gibt nur das eine wählbare Amt. Schließt sich nach dem Speichern
 * und meldet Erfolg; alle Spezln kriegen Push + Mail.
 */
export function AmtZuweisen({
  mitglieder,
  action,
}: {
  mitglieder: Array<{ id: string; name: string }>;
  action: (formData: FormData) => Promise<void>;
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
        <KlappenKopf>Kassenwart eintragen (Wahl-Ergebnis)</KlappenKopf>
        <div style={{ padding: '4px 18px 18px' }}>
          <form action={speichern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
                Wen hat der Stammtisch gwählt?
              </label>
              <select
                name="memberId"
                style={{
                  width: '100%', padding: '12px 14px', border: '1.5px solid var(--ink-200)',
                  borderRadius: 'var(--r-md)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500,
                  color: 'var(--ink-900)', background: 'var(--weiss)',
                }}
              >
                {mitglieder.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" fullWidth>
              Kassenwart eintragen
            </Button>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
              Alle Spezln kriegen a Push-Nachricht und a Mail. Präsident (WP-Rang 1) und Schriftführer (meiste Abschlüsse) werden automatisch vergeben.
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
          ✓ Kassenwart eingetragen, alle Spezln kriegen Bescheid!
        </div>
      )}
    </div>
  );
}

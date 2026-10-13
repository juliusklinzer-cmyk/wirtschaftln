'use client';

import { useState, useTransition } from 'react';
import type { OrgaErgebnis } from '@/app/(app)/termin/actions';

/**
 * „Ich organisier’s“ in der Termin-Karte auf Hoam (Zustand 2a): solang der
 * Termin no koan Organisator hat, schnappt sich den Posten, wer zuerst tippt.
 * Wer den letzten Stammtisch organisiert hat, muss aussetzen und kriegt
 * statt’m Knopf den Hinweis.
 */
export function OrgaKnopf({ action, gesperrt }: { action: () => Promise<OrgaErgebnis>; gesperrt: boolean }) {
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (gesperrt) {
    return (
      <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(208,173,102,0.5)', fontSize: 13, fontWeight: 700, color: 'var(--pergament)', lineHeight: 1.45 }}>
        Du hast grad erst organisiert, zwoamoi hintereinander gibt’s ned. Diesmal is a anderer Spezl dran.
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="wn-press"
        disabled={pending}
        onClick={() => {
          setFehler(null);
          startTransition(async () => {
            const ergebnis = await action();
            if (!ergebnis.ok) setFehler(ergebnis.meldung);
          });
        }}
        style={{
          minHeight: 50, border: 'none', borderRadius: 'var(--r-md)', background: 'var(--grad-gold)',
          boxShadow: 'var(--sh-gold)', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.7 : 1,
          fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 800, color: 'var(--navy-900)',
        }}
      >
        {pending ? 'Wird eingetragen…' : 'Ich organisier’s'}
      </button>
      {fehler && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', fontSize: 13, fontWeight: 800, color: 'var(--strafe)' }}>
          {fehler}
        </div>
      )}
    </>
  );
}

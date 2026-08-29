'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ds';
import type { OrgaErgebnis } from './actions';

/**
 * „I regle das!", solang der neue Termin no koan Organisator hat, derf sich
 * jeder den Posten schnappen (wer zuerst kommt, reglt's). Nur wer den letzten
 * Stammtisch organisiert hat, muss aussetzen, der kriegt statt'm Knopf den
 * Hinweis. Alle anderen kriegen beim Schnappen an Push.
 */
export function OrgaSchnappen({
  action,
  gesperrt,
}: {
  action: () => Promise<OrgaErgebnis>;
  /** true = i hab den letzten Stammtisch organisiert → aussetzen */
  gesperrt: boolean;
}) {
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card tone="parchment">
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Organisator gsuacht
      </div>
      {gesperrt ? (
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginTop: 6 }}>
          Du hast grad erst organisiert, zwoamoi hintereinander gibt’s ned. Diesmal reglt’s a anderer Spezl.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginTop: 6 }}>
            Wer zuerst kommt, reglt’s: Der Organisator suacht’s Wirtshaus aus, trägt d’Reservierung ein
            und kriegt dafür 0–5 WP nach der Tages-Wertung vom Abend.
          </div>
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
              marginTop: 12, width: '100%', minHeight: 48, border: 'none', borderRadius: 'var(--r-md)',
              background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)', cursor: pending ? 'default' : 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, color: 'var(--navy-900)',
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? 'Wird eingetragen…' : 'I regle das!'}
          </button>
        </>
      )}
      {fehler && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', fontSize: 13, fontWeight: 800, color: 'var(--strafe)' }}>
          {fehler}
        </div>
      )}
    </Card>
  );
}

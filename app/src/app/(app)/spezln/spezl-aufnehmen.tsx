'use client';

import { useState } from 'react';
import { Button, Input, KlappenKopf } from '@/components/ds';
import type { AufnahmeErgebnis } from './actions';

const LEER = { nachname: '', vorname: '', spitzname: '', email: '', password: '' };

/**
 * „Neuen Spezl aufnehmen"-Klappe (nur Admin): meldet Erfolg oder Fehler,
 * statt stumm zu scheitern, und schließt sich nach der Aufnahme von selbst
 * (der Neue kriegt automatisch d'Willkommens-Mail mit Login + Start-Passwort).
 * Felder sind kontrolliert: React-19-Formulare resetten nach der Action —
 * bei einem Fehler (z. B. doppelte E-Mail) soll aber nix Getipptes verloren gehen.
 */
export function SpezlAufnehmen({ action }: { action: (formData: FormData) => Promise<AufnahmeErgebnis> }) {
  const [offen, setOffen] = useState(false);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [felder, setFelder] = useState(LEER);
  const setzen = (name: keyof typeof LEER) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFelder((f) => ({ ...f, [name]: e.target.value }));

  const abschicken = async () => {
    const formData = new FormData();
    for (const [name, wert] of Object.entries(felder)) formData.set(name, wert);
    const ergebnis = await action(formData);
    setMeldung({ ok: ergebnis.ok, text: ergebnis.meldung });
    if (ergebnis.ok) {
      setFelder(LEER);
      setOffen(false);
    }
  };

  return (
    <div>
      <details
        open={offen}
        onToggle={(e) => {
          setOffen((e.currentTarget as HTMLDetailsElement).open);
          if ((e.currentTarget as HTMLDetailsElement).open) setMeldung(null);
        }}
        style={{
          background: 'var(--weiss)', border: '1px solid var(--ink-100)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
        }}
      >
        <KlappenKopf>Neuen Spezl aufnehmen</KlappenKopf>
        <div style={{ padding: '4px 18px 18px' }}>
          <form action={abschicken} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Nachname" name="nachname" placeholder="Brunner" value={felder.nachname} onChange={setzen('nachname')} required />
            <Input label="Vorname" name="vorname" placeholder="Sepp" value={felder.vorname} onChange={setzen('vorname')} required />
            <Input label="Spitzname (optional)" name="spitzname" placeholder="da Sepp" hint="Ohne Spitznamen steht der volle Name in der App" value={felder.spitzname} onChange={setzen('spitzname')} />
            <Input label="E-Mail" name="email" type="email" value={felder.email} onChange={setzen('email')} required />
            <Input label="Start-Passwort" name="password" type="text" hint="Mindestens 6 Zeichen, steht in der Willkommens-Mail, der Spezl ändert's beim ersten Login." value={felder.password} onChange={setzen('password')} required />
            <Button type="submit" fullWidth variant="gold">
              Aufnehmen
            </Button>
            {meldung && !meldung.ok && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', fontSize: 13, fontWeight: 800, color: 'var(--strafe)' }}>
                {meldung.text}
              </div>
            )}
          </form>
        </div>
      </details>
      {meldung && meldung.ok && !offen && (
        <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center', background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)', fontSize: 13, fontWeight: 800, color: 'var(--erfolg)' }}>
          {meldung.text}
        </div>
      )}
    </div>
  );
}

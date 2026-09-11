'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { Button, Input } from '@/components/ds';
import { beitreten, codePruefen, type BeitrittState } from './actions';

export function BeitrittForm({ codeVorbelegt = '' }: { codeVorbelegt?: string }) {
  const [state, action, pending] = useActionState<BeitrittState, FormData>(beitreten, {});
  // Nach der Code-Eingabe steht dran, wem man beitritt (Verzeichnis-Lookup)
  const [gruppe, setGruppe] = useState<{ name: string; stadt: string | null } | null>(null);
  const [, starte] = useTransition();
  const pruefen = (code: string) => {
    if (code.trim().length < 3) {
      setGruppe(null);
      return;
    }
    starte(async () => setGruppe(await codePruefen(code)));
  };
  // Aus dem Einladungs-Link: Code steht scho drin → gleich nachschauen, wem man beitritt
  useEffect(() => {
    if (codeVorbelegt) pruefen(codeVorbelegt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeVorbelegt]);

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Gründungscode"
        name="code"
        defaultValue={codeVorbelegt}
        inputMode="text"
        placeholder="Der Code aus da Gruppe"
        hint={gruppe ? `✓ Du trittst dem ${gruppe.name}${gruppe.stadt ? ` (${gruppe.stadt})` : ''} bei.` : 'Steht in der WhatsApp-Gruppe von eurem Stammtisch.'}
        required
        onChange={(e) => pruefen(e.target.value)}
        onBlur={(e) => pruefen(e.target.value)}
      />
      <Input label="Nachname" name="nachname" placeholder="Klinzer" required />
      <Input label="Vorname" name="vorname" placeholder="Julius" required />
      <Input label="E-Mail" name="email" type="email" placeholder="julius@beispiel.de" required />

      {state.error && (
        <div style={{ padding: '10px 12px', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>
          {state.error}
        </div>
      )}

      <Button type="submit" fullWidth variant="gold" size="lg" disabled={pending}>
        {pending ? 'Moment…' : 'Gründungsmitglied werden'}
      </Button>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
        Danach setzt’d dei Passwort und stellst di kurz vor, dann geht’s eini.
      </div>
    </form>
  );
}

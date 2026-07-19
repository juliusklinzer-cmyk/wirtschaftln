'use client';

import { useActionState } from 'react';
import { Button, Input } from '@/components/ds';
import { beitreten, type BeitrittState } from './actions';

export function BeitrittForm() {
  const [state, action, pending] = useActionState<BeitrittState, FormData>(beitreten, {});

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Gründungscode"
        name="code"
        inputMode="numeric"
        placeholder="Der Code aus da Gruppe"
        hint="Steht in der Wirtshaus-WhatsApp-Gruppe."
        required
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
        {pending ? 'Moment…' : '🍻 Gründungsmitglied werden'}
      </Button>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
        Danach setzt’d dei Passwort und stellst di kurz vor — dann geht’s eini.
      </div>
    </form>
  );
}

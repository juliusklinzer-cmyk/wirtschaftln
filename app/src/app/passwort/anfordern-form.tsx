'use client';

import { useActionState } from 'react';
import { AuthErfolgBox, AuthFeld, AuthKnopf, AuthLink } from '@/components/domain/AuthFeld';
import { linkAnfordern, type AnfordernState } from './actions';

export function AnfordernForm() {
  const [state, action, pending] = useActionState<AnfordernState, FormData>(linkAnfordern, {});
  if (state.fertig) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AuthErfolgBox>Wenn wir die E-Mail kennen, ist der Link unterwegs. Schau auch im Spam-Ordner nach.</AuthErfolgBox>
        <AuthLink href="/login">Zur Anmeldung</AuthLink>
      </div>
    );
  }
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AuthFeld
        label="E-Mail"
        name="email"
        type="email"
        placeholder="sepp@beispiel.de"
        autoComplete="email"
        required
        zustand={state.error ? 'fehler' : null}
        meldung={state.error ? { art: 'fehler', text: state.error } : null}
      />
      <AuthKnopf variante="navy" pending={pending}>Link schicken</AuthKnopf>
      <AuthLink href="/login">Zurück zur Anmeldung</AuthLink>
    </form>
  );
}

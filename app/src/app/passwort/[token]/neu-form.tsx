'use client';

import { useActionState } from 'react';
import { AuthFehlerBox, AuthKnopf, AuthLink, PasswortFeld } from '@/components/domain/AuthFeld';
import { passwortSetzen, type NeuState } from '../actions';

export function NeuForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<NeuState, FormData>(passwortSetzen, {});
  const abgelaufen = state.error?.startsWith('Der Link ist abgelaufen');
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input type="hidden" name="token" value={token} />
      <PasswortFeld label="Neues Passwort" name="passwort" placeholder="Mindestens 6 Zeichen" autoComplete="new-password" required minLength={6} zustand={state.error && !abgelaufen ? 'fehler' : null} />
      <PasswortFeld label="Nochmal" name="passwortWdh" placeholder="Gleiches Passwort" autoComplete="new-password" required minLength={6} zustand={state.error && !abgelaufen ? 'fehler' : null} meldung={state.error && !abgelaufen ? { art: 'fehler', text: state.error } : null} />
      {abgelaufen && (
        <>
          <AuthFehlerBox>{state.error}</AuthFehlerBox>
          <AuthLink href="/passwort">Neuen Link anfordern</AuthLink>
        </>
      )}
      <AuthKnopf variante="navy" pending={pending}>Passwort speichern</AuthKnopf>
    </form>
  );
}

'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';
import { Button, Input } from '@/components/ds';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="E-Mail" name="email" type="email" placeholder="sepp@beispiel.de" autoComplete="email" required />
      <Input
        label="Passwort"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        error={state.error ?? null}
      />
      <Button type="submit" size="lg" fullWidth disabled={pending} style={{ marginTop: 6 }}>
        {pending ? 'Moment…' : 'Eini geht’s'}
      </Button>
    </form>
  );
}

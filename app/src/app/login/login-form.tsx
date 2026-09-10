'use client';

import { useActionState, useState } from 'react';
import { login, type LoginState } from './actions';
import { Button, Input } from '@/components/ds';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  // Kontrolliert, damit E-Mail/Passwort die Runde über den Server überleben
  // (React setzt Formulare nach einer Action zurück) — nötig für die
  // Stammtisch-Auswahl, wenn dieselbe E-Mail in mehreren Gruppen passt.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const gruppen = state.gruppen ?? [];
  const [gruppe, setGruppe] = useState('');

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="E-Mail"
        name="email"
        type="email"
        placeholder="sepp@beispiel.de"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Passwort"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={state.error ?? null}
      />

      {gruppen.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Du bist in mehreren Stammtischen – wo willst eini?</div>
          {gruppen.map((g) => {
            const aktiv = gruppe === g.id;
            return (
              <label
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  border: `1.5px solid ${aktiv ? 'var(--muc-blau)' : 'var(--ink-200)'}`,
                  background: aktiv ? 'var(--muc-blau-bg, var(--ink-50))' : 'var(--weiss)',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--ink-900)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="gruppe"
                  value={g.id}
                  checked={aktiv}
                  onChange={() => setGruppe(g.id)}
                  required
                  style={{ accentColor: 'var(--muc-blau)' }}
                />
                {g.name}
              </label>
            );
          })}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth disabled={pending} style={{ marginTop: 6 }}>
        {pending ? 'Moment…' : 'Eini geht’s'}
      </Button>
    </form>
  );
}

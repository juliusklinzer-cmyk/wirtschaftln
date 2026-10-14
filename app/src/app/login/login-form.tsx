'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { login, type LoginState } from './actions';
import { AuthFeld, AuthKnopf, PasswortFeld } from '@/components/domain/AuthFeld';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  // Kontrolliert, damit E-Mail/Passwort die Runde über den Server überleben
  // (React setzt Formulare nach einer Action zurück), nötig für die
  // Stammtisch-Auswahl, wenn dieselbe E-Mail in mehreren Gruppen passt.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const gruppen = state.gruppen ?? [];
  const [gruppe, setGruppe] = useState('');

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AuthFeld label="E-Mail" name="email" type="email" placeholder="sepp@beispiel.de" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswortFeld
        label="Passwort"
        name="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        zustand={state.error ? 'fehler' : null}
        meldung={state.error ? { art: 'fehler', text: state.error } : null}
      />
      <Link href="/passwort" style={{ alignSelf: 'flex-end', fontSize: 13, fontWeight: 700, color: 'var(--ink-500)', textDecoration: 'none', marginTop: -6 }}>
        Passwort vergessen?
      </Link>

      {gruppen.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>Du bist in mehreren Stammtischen. Wohin?</span>
          {gruppen.map((g) => {
            const aktiv = gruppe === g.id;
            return (
              <label
                key={g.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: aktiv ? '2px solid var(--muc-blau)' : '1.5px solid var(--ink-100)', background: aktiv ? '#E1EFF8' : 'var(--weiss)', cursor: 'pointer', margin: aktiv ? -0.5 : 0 }}
              >
                <input type="radio" name="gruppe" value={g.id} checked={aktiv} onChange={() => setGruppe(g.id)} required style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                <span aria-hidden style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${aktiv ? 'var(--muc-blau)' : 'var(--ink-200)'}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                  {aktiv && <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--muc-blau)' }} />}
                </span>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{g.name}</span>
                  {g.info && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{g.info}</span>}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <AuthKnopf variante="navy" pending={pending}>Anmelden</AuthKnopf>
    </form>
  );
}

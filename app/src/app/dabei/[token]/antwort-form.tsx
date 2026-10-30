'use client';

import { useActionState, useState } from 'react';
import { AuthErfolgBox, AuthFehlerBox, AuthKnopf } from '@/components/domain/AuthFeld';
import { dabeiAntworten, type DabeiState } from '../actions';

/**
 * Ja/Abschied: erst der Klick hier speichert (Mail-Scanner rufen Links gern
 * vorab auf). Der Abschied braucht eine zweite Bestätigung.
 */
export function AntwortForm({ token, vorwahl, schulden }: { token: string; vorwahl: 'dabei' | 'abschied' | null; schulden: string | null }) {
  const [state, action, pending] = useActionState<DabeiState, FormData>(dabeiAntworten, {});
  const [abschiedSicher, setAbschiedSicher] = useState(vorwahl === 'abschied');

  if (state.fertig === 'dabei') return <AuthErfolgBox>Super, dann bis zum nächsten Stammtisch! Sag einfach rechtzeitig zu oder ab.</AuthErfolgBox>;
  if (state.fertig === 'abschied') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AuthErfolgBox>Schade, aber danke für die ehrliche Antwort. Servus und mach’s gut!</AuthErfolgBox>
        {schulden && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5 }}>Offen sind noch {schulden}. Bitte gleich beim Kassenwart begleichen.</span>}
      </div>
    );
  }

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input type="hidden" name="token" value={token} />
      {state.error && <AuthFehlerBox>{state.error}</AuthFehlerBox>}
      {!abschiedSicher ? (
        <>
          <AuthKnopf variante="navy" name="antwort" value="dabei" pending={pending}>Ja, ich bin dabei</AuthKnopf>
          <AuthKnopf variante="gold" type="button" onClick={() => setAbschiedSicher(true)} style={{ background: 'var(--weiss)', color: 'var(--navy)', border: '1.5px solid var(--ink-200)', boxShadow: 'none' }}>Ich verabschiede mich</AuthKnopf>
        </>
      ) : (
        <>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5 }}>Sicher? Danach kannst du dich nicht mehr anmelden. Deine Abende und Punkte bleiben in der Chronik, und ein Admin kann dich jederzeit wieder aufnehmen.</span>
          <AuthKnopf variante="navy" name="antwort" value="abschied" pending={pending} style={{ background: 'var(--strafe)' }}>Ja, ich verabschiede mich</AuthKnopf>
          <AuthKnopf variante="gold" type="button" onClick={() => setAbschiedSicher(false)} style={{ background: 'var(--weiss)', color: 'var(--navy)', border: '1.5px solid var(--ink-200)', boxShadow: 'none' }}>Doch nicht, ich bleib dabei</AuthKnopf>
        </>
      )}
    </form>
  );
}

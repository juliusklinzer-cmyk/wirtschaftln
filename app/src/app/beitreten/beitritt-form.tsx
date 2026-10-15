'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { AuthFeld, AuthFehlerBox, AuthKnopf, AuthLink, GRUEN_HAKEN, type FeldMeldung } from '@/components/domain/AuthFeld';
import { beitreten, codePruefen, type BeitrittState } from './actions';

type Gruppe = { name: string; stadt: string | null };

export function BeitrittForm({ codeVorbelegt = '' }: { codeVorbelegt?: string }) {
  const [state, action, pending] = useActionState<BeitrittState, FormData>(beitreten, {});
  const [code, setCode] = useState(codeVorbelegt);
  // undefined = no ned geprüft, null = unbekannt, sonst der Stammtisch (Verzeichnis-Lookup)
  const [gruppe, setGruppe] = useState<Gruppe | null | undefined>(undefined);
  const [, starte] = useTransition();
  const pruefen = (c: string) => {
    if (c.trim().length < 3) {
      setGruppe(undefined);
      return;
    }
    starte(async () => setGruppe(await codePruefen(c)));
  };
  // Aus dem Einladungs-Link: Code steht scho drin → gleich nachschauen, wem man beitritt
  useEffect(() => {
    if (codeVorbelegt) pruefen(codeVorbelegt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeVorbelegt]);

  const codeFehler = state.feld === 'code' ? state.error : gruppe === null ? 'Diesen Code kennen wir nicht. Frag in der Gruppe nach.' : null;
  const codeZustand = codeFehler ? 'fehler' : gruppe ? 'ok' : null;
  const codeMeldung: FeldMeldung = codeFehler
    ? { art: 'fehler', text: codeFehler }
    : gruppe
      ? { art: 'ok', text: `${gruppe.name}${gruppe.stadt ? ` (${gruppe.stadt})` : ''}` }
      : { art: 'hinweis', text: 'Steht in der WhatsApp-Gruppe eures Stammtischs.' };
  const emailFehler = state.feld === 'email' ? state.error : null;
  const sonstFehler = state.error && !state.feld ? state.error : null;

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AuthFeld
        label="Gründungscode"
        name="code"
        value={code}
        onChange={(e) => { setCode(e.target.value); pruefen(e.target.value); }}
        onBlur={(e) => pruefen(e.target.value)}
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        placeholder="Code aus der Gruppe"
        required
        mono
        zustand={codeZustand}
        meldung={codeMeldung}
        rechts={gruppe ? GRUEN_HAKEN : undefined}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <AuthFeld label="Nachname" name="nachname" placeholder="Huber" autoComplete="family-name" required />
        <AuthFeld label="Vorname" name="vorname" placeholder="Sepp" autoComplete="given-name" required />
      </div>
      <AuthFeld
        label="E-Mail"
        name="email"
        type="email"
        placeholder="julius@beispiel.de"
        autoComplete="email"
        required
        zustand={emailFehler ? 'fehler' : null}
      />

      {emailFehler && (
        <>
          <AuthFehlerBox>{emailFehler}</AuthFehlerBox>
          <AuthLink href="/login">Zur Anmeldung</AuthLink>
        </>
      )}
      {sonstFehler && <AuthFehlerBox>{sonstFehler}</AuthFehlerBox>}

      <AuthKnopf variante="gold" pending={pending} disabled={!gruppe}>Gründungsmitglied werden</AuthKnopf>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center', marginTop: -4 }}>Danach Passwort setzen und kurz vorstellen.</span>
    </form>
  );
}

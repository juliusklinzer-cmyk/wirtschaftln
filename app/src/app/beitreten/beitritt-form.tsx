'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { Scroll } from '@phosphor-icons/react/dist/ssr/Scroll';
import { AuthFeld, AuthFehlerBox, AuthKnopf, AuthLink, FeldHinweis, GRUEN_HAKEN, type FeldMeldung } from '@/components/domain/AuthFeld';
import { beitreten, codePruefen, type BeitrittState, type CodeTreffer } from './actions';

type Gruppe = CodeTreffer;

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
  const buergeFehler = state.feld === 'buerge' ? state.error : null;
  const kodexFehler = state.feld === 'kodex' ? state.error : null;
  const sonstFehler = state.error && !state.feld ? state.error : null;
  const [buerge, setBuerge] = useState('');
  const [kodex, setKodex] = useState(false);
  const mitBuerge = !!gruppe && gruppe.buergen.length > 0;

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

      {/* Aufnahme mit Bürge und Kodex (WIR-013): erst wenn der Code passt */}
      {gruppe && mitBuerge && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <label htmlFor="feld-buerge" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Wer bürgt für dich?</label>
          <div style={{ position: 'relative' }}>
            <select
              id="feld-buerge"
              name="buerge"
              value={buerge}
              onChange={(e) => setBuerge(e.target.value)}
              required
              style={{ width: '100%', height: 50, padding: '0 40px 0 14px', borderRadius: 14, border: `1.5px solid ${buergeFehler ? 'var(--strafe)' : buerge ? 'var(--erfolg)' : 'var(--ink-200)'}`, background: buerge ? '#F3FAF6' : 'var(--weiss)', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, color: buerge ? 'var(--ink-900)' : 'var(--ink-500)' }}
            >
              <option value="" disabled>Spezl aus der Runde wählen</option>
              {gruppe.buergen.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <CaretDown size={16} weight="bold" color="var(--ink-500)" style={{ position: 'absolute', right: 16, top: 17, pointerEvents: 'none' }} />
          </div>
          <FeldHinweis meldung={buergeFehler ? { art: 'fehler', text: buergeFehler } : { art: 'hinweis', text: 'Er oder sie bestätigt in der App, dass du dazugehörst. Dann bist du dabei.' }} />
        </div>
      )}
      {gruppe && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', borderRadius: 16, background: 'var(--pergament)', border: `1.5px solid ${kodexFehler ? 'var(--strafe)' : 'var(--gold)'}` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>
            <Scroll size={16} weight="fill" /> Unser Kodex
          </span>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {gruppe.kodex.map((k) => <li key={k} style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: 'var(--navy)' }}>{k}</li>)}
          </ol>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, cursor: 'pointer', fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>
            <input type="checkbox" name="kodex" checked={kodex} onChange={(e) => setKodex(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--navy)', flex: 'none' }} />
            Ich halte mich dran
          </label>
          {kodexFehler && <FeldHinweis meldung={{ art: 'fehler', text: kodexFehler }} />}
        </div>
      )}

      {emailFehler && (
        <>
          <AuthFehlerBox>{emailFehler}</AuthFehlerBox>
          <AuthLink href="/login">Zur Anmeldung</AuthLink>
        </>
      )}
      {sonstFehler && <AuthFehlerBox>{sonstFehler}</AuthFehlerBox>}

      <AuthKnopf variante="gold" pending={pending} disabled={!gruppe || !kodex || (mitBuerge && !buerge)}>{mitBuerge ? 'Aufnahme beantragen' : 'Gründungsmitglied werden'}</AuthKnopf>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center', marginTop: -4 }}>
        {mitBuerge ? 'Sobald dein Bürge zusagt, setzt du dein Passwort und stellst dich kurz vor.' : 'Danach Passwort setzen und kurz vorstellen.'}
      </span>
    </form>
  );
}

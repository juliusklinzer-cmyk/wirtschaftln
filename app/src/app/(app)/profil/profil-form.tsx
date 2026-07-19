'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Switch } from '@/components/ds';
import { BierWahl } from '@/components/domain/BierWahl';
import { FotoZuschnitt } from '@/components/domain/FotoZuschnitt';
import { HELLE, WEISSBIERE } from '@/lib/biersorten';
import { profilSpeichern, type ProfilState } from './actions';

export type ProfilWerte = {
  name: string;
  vorname: string | null;
  nachname: string | null;
  spitzname: string | null;
  photoUrl: string | null;
  herkunft: string | null;
  lieblingsbier: string | null;
  lieblingsweissbier: string | null;
  leibspeise: string | null;
  lieblingsbiergarten: string | null;
  lieblingswirtshaus: string | null;
  verein: 'bayern' | 'sechzig' | null;
  schafkopfer: boolean;
  beschreibung: string | null;
  erstanmeldung: boolean;
};

export function ProfilForm({ werte, onGespeichert }: { werte: ProfilWerte; onGespeichert?: () => void }) {
  const [state, action, pending] = useActionState<ProfilState, FormData>(profilSpeichern, {});
  const router = useRouter();

  // Erstanmeldung: kurz „Merci!" zeigen, dann eini in d'App.
  // Sonst: Klappe schließen lassen (onGespeichert) und die Urkunde oben frisch laden.
  useEffect(() => {
    if (state.ok && !state.error) {
      if (werte.erstanmeldung) {
        const timer = setTimeout(() => router.push('/'), 1200);
        return () => clearTimeout(timer);
      }
      onGespeichert?.();
      router.refresh();
    }
  }, [state.ok, state.error, router, werte.erstanmeldung, onGespeichert]);
  const [bier, setBier] = useState(werte.lieblingsbier ?? '');
  const [weissbier, setWeissbier] = useState(werte.lieblingsweissbier ?? '');
  const [verein, setVerein] = useState<string>(werte.verein ?? '');
  const [schafkopfer, setSchafkopfer] = useState(werte.schafkopfer);

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Profilbild: auswählen, im Kreis zurechtschieben, zoomen */}
      <FotoZuschnitt name="fotoData" aktuellesFoto={werte.photoUrl} />

      {/* Nachname zuerst — wie auf der Urkunde („Da Klinzer Julius"), volle Breite statt Grid */}
      <Input label="Nachname" name="nachname" defaultValue={werte.nachname ?? ''} placeholder="Klinzer" required />
      <Input label="Vorname" name="vorname" defaultValue={werte.vorname ?? ''} placeholder="Julius" required />
      <Input label="Spitzname (optional) — so steht’s auf der Rangliste, sonst dein Name" name="spitzname" defaultValue={werte.spitzname ?? ''} placeholder="da Sepp" />
      <Input label="Herkunft — Viertel oder woher’s di gspuit hat" name="herkunft" defaultValue={werte.herkunft ?? ''} placeholder="z. B. Giesing" />

      <BierWahl label="Lieblingsbier (Helles)" biere={HELLE} value={bier} onChange={setBier} leerLabel="No ned festglegt" />
      <input type="hidden" name="lieblingsbier" value={bier} />
      <BierWahl label="Lieblingsweißbier" biere={WEISSBIERE} value={weissbier} onChange={setWeissbier} leerLabel="No ned festglegt" />
      <input type="hidden" name="lieblingsweissbier" value={weissbier} />

      <Input label="Leibspeise" name="leibspeise" defaultValue={werte.leibspeise ?? ''} placeholder="z. B. Schweinsbraten mit Dunkelbiersoß" />
      <Input label="Lieblings-Biergarten" name="lieblingsbiergarten" defaultValue={werte.lieblingsbiergarten ?? ''} placeholder="z. B. Augustiner-Keller" />
      <Input label="Lieblings-Wirtshaus" name="lieblingswirtshaus" defaultValue={werte.lieblingswirtshaus ?? ''} placeholder="z. B. Wirtshaus in der Au" />

      {/* Bayern oder Sechzig */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
          Bayern oder Sechzig?
        </label>
        <input type="hidden" name="verein" value={verein} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { wert: 'bayern', label: 'Bayern', logo: '/brand/vereine/fcb.png' },
            { wert: 'sechzig', label: 'Sechzig', logo: '/brand/vereine/1860.png' },
            { wert: '', label: 'Freund des Fußball', logo: null },
          ].map((o) => (
            <button
              key={o.wert}
              type="button"
              onClick={() => setVerein(o.wert)}
              style={{
                flex: 1, padding: '10px 6px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                border: verein === o.wert ? '1.5px solid var(--muc-blau)' : '1.5px solid var(--ink-200)',
                background: verein === o.wert ? 'var(--info-bg)' : 'var(--weiss)',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800,
                color: verein === o.wert ? 'var(--muc-blau)' : 'var(--ink-500)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                filter: o.logo && verein !== o.wert ? 'grayscale(0.6)' : 'none',
              }}
            >
              {o.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.logo} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 16 }}>🥨</span>
              )}
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/vereine/eichel.png" alt="Eichel" style={{ width: 30, height: 30, objectFit: 'contain', flex: 'none', filter: schafkopfer ? 'none' : 'grayscale(1) opacity(0.5)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Schafkopfer?</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Kannst mitkarteln, wenn’s Blatt aufgeht?</div>
        </div>
        <Switch checked={schafkopfer} onChange={setSchafkopfer} tone="gold" />
        {schafkopfer && <input type="hidden" name="schafkopfer" value="on" />}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
          Beschreibung — wer bist’n du?
        </label>
        <textarea
          name="beschreibung"
          defaultValue={werte.beschreibung ?? ''}
          rows={3}
          placeholder="A paar Worte über di — je bayrischer, desto besser…"
          style={{
            width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)',
            padding: 12, fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink-900)', resize: 'none', outline: 'none',
          }}
        />
      </div>

      {/* Passwort — Pflicht bei der Erstanmeldung, sonst optional */}
      <div style={{ borderTop: '1px solid var(--ink-100)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>
          {werte.erstanmeldung ? '🔑 Neues Passwort setzen (Pflicht)' : '🔑 Passwort ändern (optional)'}
        </div>
        {!werte.erstanmeldung && (
          <Input label="Aktuelles Passwort" name="passwortAktuell" type="password" autoComplete="current-password" hint="Zur Bestätigung, dass du’s wirklich selber bist" />
        )}
        <Input label="Neues Passwort" name="passwort" type="password" autoComplete="new-password" required={werte.erstanmeldung} hint="Mindestens 6 Zeichen" />
        <Input label="Nochmal zur Sicherheit" name="passwortWdh" type="password" autoComplete="new-password" required={werte.erstanmeldung} />
      </div>

      {state.error && (
        <div style={{ padding: '10px 12px', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>
          {state.error}
        </div>
      )}
      {state.ok && !state.error && (
        <div style={{ padding: '14px 12px', background: 'var(--erfolg-bg)', borderRadius: 'var(--r-md)', fontSize: 16, fontWeight: 800, color: 'var(--erfolg)', textAlign: 'center' }}>
          Merci! 🍺
        </div>
      )}

      <Button type="submit" fullWidth variant="gold" size="lg" disabled={pending}>
        {pending ? 'Moment…' : werte.erstanmeldung ? 'Fertig — eini geht’s! 🍺' : 'Profil speichern'}
      </Button>
    </form>
  );
}

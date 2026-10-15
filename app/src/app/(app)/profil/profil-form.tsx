'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { SoccerBall } from '@phosphor-icons/react/dist/ssr/SoccerBall';
import { Switch } from '@/components/ds';
import { BierKacheln } from '@/components/domain/BierKacheln';
import { FotoZuschnitt } from '@/components/domain/FotoZuschnitt';
import { feldStil, feldLabelStil, goldKnopfStil } from '@/components/domain/hero-stil';
import { HELLE_WAHL, WEISSBIERE } from '@/lib/biersorten';
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
  verein: string | null;
  schafkopfer: boolean;
  weisswuerste: number | null;
  beschreibung: string | null;
  erstanmeldung: boolean;
  /** Bayern/Sechzig-Picker mit Wappen (Gründer) statt freiem Vereinsfeld */
  vereinsWahl: boolean;
};

const labelStil: React.CSSProperties = { ...feldLabelStil, fontSize: 13 };
const hinweisStil: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' };

function Feld({ label, hinweis, children }: { label: string; hinweis?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={labelStil}>{label}</span>
      {children}
      {hinweis && <span style={hinweisStil}>{hinweis}</span>}
    </label>
  );
}

/** Gruppe: Eyebrow in Gold, drunter die weiße Karte (Profil-Redesign 1b) */
function Gruppe({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-700)', padding: '0 4px' }}>{titel}</span>
      <div style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </section>
  );
}

/**
 * Das Profil-Formular in vier Gruppen (Wer bist du, Geschmack, Über dich,
 * Passwort). Beim ersten Login steht's offen auf der Seite, sonst im
 * Vollbild-Editor. Nach dem Speichern: grüne Meldung, dann zu bzw. eini.
 */
export function ProfilForm({ werte, onGespeichert }: { werte: ProfilWerte; onGespeichert?: () => void }) {
  const [state, action, pending] = useActionState<ProfilState, FormData>(profilSpeichern, {});
  const router = useRouter();
  const [bier, setBier] = useState(werte.lieblingsbier ?? '');
  const [weissbier, setWeissbier] = useState(werte.lieblingsweissbier ?? '');
  const [verein, setVerein] = useState<string>(werte.verein ?? '');
  const [schafkopfer, setSchafkopfer] = useState(werte.schafkopfer);
  const [weisswuerste, setWeisswuerste] = useState<number | null>(werte.weisswuerste);

  // Erstanmeldung: kurz „Merci!" zeigen, dann eini in d'App. Sonst: Editor zu und die Seite frisch.
  useEffect(() => {
    if (state.ok && !state.error) {
      const timer = setTimeout(() => {
        if (werte.erstanmeldung) router.push('/');
        else { onGespeichert?.(); router.refresh(); }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.ok, state.error, router, werte.erstanmeldung, onGespeichert]);

  const stepperKnopf = (zeichen: string, onClick: () => void, dunkel: boolean) => (
    <button type="button" onClick={onClick} className="wn-press" style={{ width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: dunkel ? 'none' : '1.5px solid var(--pergament-edge)', background: dunkel ? 'var(--navy)' : 'var(--weiss)', color: dunkel ? '#fff' : 'var(--navy)' }}>{zeichen}</button>
  );

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Gruppe titel="Wer bist du">
        <FotoZuschnitt name="fotoData" aktuellesFoto={werte.photoUrl} anzeigeName={werte.spitzname || werte.name} />
        <Feld label="Nachname"><input name="nachname" defaultValue={werte.nachname ?? ''} placeholder="Klinzer" required style={feldStil} /></Feld>
        <Feld label="Vorname"><input name="vorname" defaultValue={werte.vorname ?? ''} placeholder="z. B. Sepp" required style={feldStil} /></Feld>
        <Feld label="Spitzname (optional)" hinweis="So steht’s auf der Rangliste."><input name="spitzname" defaultValue={werte.spitzname ?? ''} placeholder="z. B. da Sepp" style={feldStil} /></Feld>
        <Feld label="Herkunft"><input name="herkunft" defaultValue={werte.herkunft ?? ''} placeholder="z. B. Altstadt" style={feldStil} /></Feld>
      </Gruppe>

      <Gruppe titel="Geschmack">
        <BierKacheln label="Lieblingsbier (Helles)" biere={HELLE_WAHL} value={bier} onChange={setBier} />
        <input type="hidden" name="lieblingsbier" value={bier} />
        <BierKacheln label="Lieblingsweißbier" biere={WEISSBIERE} value={weissbier} onChange={setWeissbier} />
        <input type="hidden" name="lieblingsweissbier" value={weissbier} />
        <Feld label="Leibspeise"><input name="leibspeise" defaultValue={werte.leibspeise ?? ''} placeholder="z. B. Schweinsbraten" style={feldStil} /></Feld>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStil}>Wie viele Weißwürste gibt’s bei dir normal?</span>
          <input type="hidden" name="weisswuerste" value={weisswuerste ?? ''} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 8px 8px 14px', borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: weisswuerste == null ? 'var(--ink-300)' : 'var(--ink-900)' }}>{weisswuerste == null ? 'Noch nicht festgelegt' : `${weisswuerste} Stück`}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {stepperKnopf('−', () => setWeisswuerste((w) => (w == null || w <= 0 ? null : w - 1)), false)}
              <span className="wn-tnum" style={{ minWidth: 22, textAlign: 'center', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{weisswuerste ?? '–'}</span>
              {stepperKnopf('+', () => setWeisswuerste((w) => Math.min(20, (w ?? 0) + 1)), true)}
            </span>
          </div>
        </div>
        <Feld label="Lieblings-Biergarten"><input name="lieblingsbiergarten" defaultValue={werte.lieblingsbiergarten ?? ''} placeholder="z. B. Augustiner-Keller" style={feldStil} /></Feld>
        <Feld label="Lieblings-Wirtshaus"><input name="lieblingswirtshaus" defaultValue={werte.lieblingswirtshaus ?? ''} placeholder="z. B. Wirtshaus in der Au" style={feldStil} /></Feld>
      </Gruppe>

      <Gruppe titel="Über dich">
        {werte.vereinsWahl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={labelStil}>Bayern oder Sechzig?</span>
            <input type="hidden" name="verein" value={verein} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { wert: 'bayern', label: 'Bayern', logo: '/brand/vereine/fcb.png' },
                { wert: 'sechzig', label: 'Sechzig', logo: '/brand/vereine/1860.png' },
                { wert: '', label: 'Freund des Fußballs', logo: null },
              ].map((o) => {
                const an = verein === o.wert;
                return (
                  <button key={o.wert} type="button" onClick={() => setVerein(o.wert)} style={{ padding: '10px 6px', borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', border: an ? '2px solid var(--muc-blau)' : '1.5px solid var(--ink-100)', background: an ? 'var(--info-bg)' : 'var(--weiss)' }}>
                    {o.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.logo} alt="" style={{ width: 30, height: 30, objectFit: 'contain', filter: an ? 'none' : 'grayscale(0.6)' }} />
                    ) : (
                      <SoccerBall size={28} color={an ? 'var(--muc-blau)' : 'var(--ink-300)'} />
                    )}
                    <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.2, color: an ? 'var(--muc-blau)' : 'var(--ink-500)' }}>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <Feld label="Lieblingsverein (optional)"><input name="verein" defaultValue={werte.verein ?? ''} placeholder="z. B. 1. FC Nürnberg" style={feldStil} /></Feld>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--pergament)', border: '1px solid var(--pergament-edge)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vereine/eichel.png" alt="" style={{ width: 30, height: 30, objectFit: 'contain', flex: 'none', filter: schafkopfer ? 'none' : 'grayscale(1) opacity(0.5)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Schafkopfer?</span>
            <span style={hinweisStil}>Kannst du mitkarteln?</span>
          </div>
          <Switch checked={schafkopfer} onChange={setSchafkopfer} tone="gold" />
          {schafkopfer && <input type="hidden" name="schafkopfer" value="on" />}
        </div>

        <Feld label="Beschreibung">
          <textarea name="beschreibung" defaultValue={werte.beschreibung ?? ''} rows={3} placeholder="Ein paar Worte über dich …" style={{ ...feldStil, height: 'auto', minHeight: 88, padding: '12px 14px', lineHeight: 1.5, resize: 'none' }} />
        </Feld>
      </Gruppe>

      <Gruppe titel={werte.erstanmeldung ? 'Passwort (Pflicht)' : 'Passwort ändern (optional)'}>
        {!werte.erstanmeldung && (
          <Feld label="Aktuelles Passwort"><input name="passwortAktuell" type="password" autoComplete="current-password" style={feldStil} /></Feld>
        )}
        <Feld label="Neues Passwort" hinweis="Mindestens 6 Zeichen"><input name="passwort" type="password" autoComplete="new-password" required={werte.erstanmeldung} style={feldStil} /></Feld>
        <Feld label="Nochmal zur Sicherheit"><input name="passwortWdh" type="password" autoComplete="new-password" required={werte.erstanmeldung} style={feldStil} /></Feld>
      </Gruppe>

      {state.error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--strafe-bg)', border: '1px solid rgba(192,57,43,0.35)' }}>
          <WarningCircle size={22} weight="fill" color="var(--strafe)" style={{ flex: 'none' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>{state.error}</span>
        </div>
      )}
      {state.ok && !state.error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'var(--erfolg-bg)' }}>
          <CheckCircle size={24} weight="fill" color="var(--erfolg)" />
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--erfolg)' }}>Merci! Profil gespeichert.</span>
        </div>
      ) : (
        <button type="submit" disabled={pending} className="wn-press" style={{ ...goldKnopfStil, minHeight: 54, opacity: pending ? 0.7 : 1 }}>
          {pending ? 'Moment …' : werte.erstanmeldung ? 'Fertig, los geht’s!' : 'Profil speichern'}
        </button>
      )}
    </form>
  );
}

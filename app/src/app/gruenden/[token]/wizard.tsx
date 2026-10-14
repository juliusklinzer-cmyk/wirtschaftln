'use client';

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck';
import { CheckSquare } from '@phosphor-icons/react/dist/ssr/CheckSquare';
import { Coins } from '@phosphor-icons/react/dist/ssr/Coins';
import { Trophy } from '@phosphor-icons/react/dist/ssr/Trophy';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { CrownSimple } from '@phosphor-icons/react/dist/ssr/CrownSimple';
import { Ticket } from '@phosphor-icons/react/dist/ssr/Ticket';
import { SealCheck } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { ImageSquare } from '@phosphor-icons/react/dist/ssr/ImageSquare';
import { Wine } from '@phosphor-icons/react/dist/ssr/Wine';
import { Path } from '@phosphor-icons/react/dist/ssr/Path';
import { House } from '@phosphor-icons/react/dist/ssr/House';
import { BeerStein } from '@phosphor-icons/react/dist/ssr/BeerStein';
import { UserCircle } from '@phosphor-icons/react/dist/ssr/UserCircle';
import { Switch } from '@/components/ds';
import { AuthFehlerBox, AuthFeld, AuthKnopf, GRUEN_HAKEN, PasswortFeld, type FeldMeldung } from '@/components/domain/AuthFeld';
import { EigenesBild } from '@/components/domain/LogoWahl';
import { WirtshausSuche } from '@/components/domain/WirtshausSuche';
import { HELLE_WAHL, STANDARD_BIERSORTE, type Bier } from '@/lib/biersorten';
import { gruenden, codeVorschlagFuer, codeIstFrei, type GruendungsState } from './actions';

const SCHRITTE = ['Konto', 'Stammtisch', 'Logo', 'Bräuche', 'Code'] as const;
type Schritt = 0 | 1 | 2 | 3 | 4 | 5;
const HEUER = new Date().getFullYear();
const BIERE = HELLE_WAHL.filter((b): b is Bier => 'name' in b);
const FUNKTIONEN = [
  { Icon: CalendarCheck, text: 'Termine' }, { Icon: CheckSquare, text: 'Abstimmung' }, { Icon: Coins, text: 'Kasse' },
  { Icon: Trophy, text: 'Rangliste' }, { Icon: MapPin, text: 'Chronik' }, { Icon: CrownSimple, text: 'Ämter' },
];

const HINTERGRUND = 'radial-gradient(120% 70% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)';
const LOGO_GRUND = 'radial-gradient(120% 90% at 50% 20%, #1B4C8A, #07193A)';

/**
 * Gründung-Redesign (14.10.2026): Schritt 0 is die Ehren-Einladung (1a),
 * danach fünf Schritte (1b–1f): Konto, Stammtisch, Logo, Bräuche, Code.
 * Alles is EIN Formular: inaktive Schritte bleiben im DOM (versteckt), am
 * Ende gehen alle Felder gemeinsam an die Server Action. Geprüft wird pro
 * Schritt beim „Weiter“, Server-Fehler springen zum Schritt.
 */
export function GruendungsWizard({ token, von, fuer = null }: { token: string; /** „Von Hansi · Wirtschaftln, München“ */ von: string; /** Widmung „Sepp aus Regensburg“ (Chip „Für Sepp aus Regensburg“) */ fuer?: string | null }) {
  const [state, action, pending] = useActionState<GruendungsState, FormData>(gruenden.bind(null, token), {});
  const [schritt, setSchritt] = useState<Schritt>(0);
  const [typ, setTyp] = useState<'wandernd' | 'stammhaus'>('wandernd');
  const [name, setName] = useState('');
  const [stadt, setStadt] = useState('');
  const [jahr, setJahr] = useState('');
  const [jahrFehler, setJahrFehler] = useState<string | null>(null);
  const [bier, setBier] = useState(STANDARD_BIERSORTE);
  const [preis, setPreis] = useState('3,70');
  const [schnaps, setSchnaps] = useState(false);
  const [code, setCode] = useState('');
  const [codeFrei, setCodeFrei] = useState<boolean | null>(null);
  const [laedtCode, startCode] = useTransition();
  const [lokalerFehler, setLokalerFehler] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Server-Fehler → zum passenden Schritt springen (Konto=1, Stammtisch=2, Code=5)
  useEffect(() => {
    if (!state.schritt) return;
    const ziel: Record<number, Schritt> = { 1: 1, 2: 2, 3: 5 };
    setSchritt(ziel[state.schritt] ?? 1);
  }, [state]);

  // Beim Schrittwechsel: nach oben, erstes Feld fokussieren (am Handy kommt so gleich d'Tastatur)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (schritt === 0 || schritt === 3) return;
    const box = formRef.current?.querySelector<HTMLElement>(`[data-schritt="${schritt}"]`);
    const erstes = box?.querySelector<HTMLInputElement>('input:not([type="hidden"]):not([type="file"])');
    if (erstes) setTimeout(() => erstes.focus({ preventScroll: true }), 250);
  }, [schritt]);

  // Schritt 5: Code-Vorschlag aus dem Namen holen
  useEffect(() => {
    if (schritt !== 5 || code) return;
    startCode(async () => {
      const v = await codeVorschlagFuer(name);
      setCode(v);
      setCodeFrei(true);
    });
  }, [schritt, code, name]);

  const codePruefen = (wert: string) => {
    const c = wert.toUpperCase();
    setCode(c);
    setCodeFrei(null);
    startCode(async () => setCodeFrei(await codeIstFrei(c)));
  };

  const jahrPruefen = (wert: string): string | null => {
    const n = Number(wert.trim());
    if (!wert.trim()) return 'Wann habt ihr angefangen? Eine Jahreszahl bitte.';
    if (!Number.isInteger(n) || n < 1) return 'Das ist keine Jahreszahl.';
    if (n > HEUER) return `In der Zukunft gründen geht nicht. ${HEUER} ist das Höchste.`;
    return null;
  };

  const weiter = () => {
    const form = formRef.current!;
    // HTML-Validierung nur für die sichtbaren Felder des aktuellen Schritts
    const felder = form.querySelectorAll<HTMLInputElement>(`[data-schritt="${schritt}"] input`);
    for (const f of felder) {
      if (!f.checkValidity()) {
        f.reportValidity();
        return;
      }
    }
    if (schritt === 2) {
      const fehler = jahrPruefen(jahr);
      setJahrFehler(fehler);
      if (fehler) return;
    }
    if (schritt === 4 && typ === 'stammhaus') {
      const gname = (form.querySelector<HTMLInputElement>('input[name="stammhaus_name"]')?.value || form.querySelector<HTMLInputElement>('input[name="stammhaus_freitext"]')?.value || '').trim();
      if (gname.length < 2) {
        setLokalerFehler('Wie heißt euer Stammhaus? Such es über Google oder tipp den Namen ein.');
        return;
      }
    }
    setLokalerFehler(null);
    setSchritt((s) => (s < 5 ? ((s + 1) as Schritt) : s));
  };
  const zurueck = () => {
    setLokalerFehler(null);
    setSchritt((s) => (s > 0 ? ((s - 1) as Schritt) : s));
  };

  const sichtbar = (n: number): React.CSSProperties => ({ display: schritt === n ? 'flex' : 'none', flexDirection: 'column', gap: 14 });
  const codeMeldung: FeldMeldung = codeFrei === false
    ? { art: 'fehler', text: 'Diesen Code hat schon ein anderer Stammtisch.' }
    : laedtCode ? { art: 'hinweis', text: 'Wird geprüft …' }
    : codeFrei ? { art: 'ok', text: 'Frei' }
    : { art: 'hinweis', text: 'Buchstaben, Ziffern, Bindestrich (3 bis 40 Zeichen)' };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: HINTERGRUND, fontFamily: 'var(--font-ui)' }}>
      <div className="wn-raute wn-raute--sm" style={{ height: 8, flex: 'none' }} />

      {/* Kopf: groß auf der Einladung, kompakt im Wizard */}
      {schritt === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'calc(28px + env(safe-area-inset-top)) 28px 26px', textAlign: 'center', gap: 8 }}>
          <Image src="/brand/rauten-app.svg" alt="" width={100} height={100} priority style={{ height: 'clamp(72px, 14vh, 100px)', width: 'auto', filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.4))' }} />
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 38, lineHeight: 1, color: 'var(--gold-bright)', marginTop: 10 }}>Wirtschaftln</span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.75)' }}>Eine Ehren-Einladung</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(20px + env(safe-area-inset-top)) 22px 18px' }}>
          <Image src="/brand/rauten-app.svg" alt="" width={44} height={44} priority style={{ height: 44, width: 'auto', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 24, lineHeight: 1, color: 'var(--gold-bright)' }}>Stammtisch gründen</span>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(246,240,226,0.7)' }}>Schritt {schritt} von {SCHRITTE.length}</span>
          </div>
        </div>
      )}

      <form ref={formRef} action={action} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--weiss)', borderRadius: '28px 28px 0 0', padding: '22px 22px calc(34px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(7,25,58,0.35)' }}>
        <div style={{ flex: 1, width: '100%', maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 0 · Ehren-Einladung (1a) */}
          <div data-schritt="0" style={{ ...sichtbar(0), gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {fuer && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: 'var(--grad-gold)', color: 'var(--navy-900)', whiteSpace: 'nowrap' }}>
                    <SealCheck size={13} weight="fill" />Für {fuer}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: 'var(--pergament)', color: 'var(--gold-700)' }}>{von}</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 32, lineHeight: 1, color: 'var(--navy)', margin: 0 }}>Gründe deinen Stammtisch</h1>
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)' }}>Eure eigene App, nur für eure Runde. Du wirst Gründer und Admin.</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {FUNKTIONEN.map(({ Icon, text }) => (
                <div key={text} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px', borderRadius: 14, background: 'var(--ink-50)', textAlign: 'center' }}>
                  <Icon size={22} weight="fill" color="var(--muc-blau)" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--navy)' }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 14, background: 'var(--pergament)', border: '1px dashed var(--gold)' }}>
              <Ticket size={22} weight="fill" color="var(--gold-700)" style={{ flex: 'none' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Gilt für genau einen Stammtisch</span>
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, fontWeight: 700, color: 'var(--gold-700)' }}>{token}</span>
            </div>
          </div>

          {/* Stepper (1b–1f) */}
          {schritt > 0 && (
            <div style={{ display: 'flex', gap: 6 }} aria-label={`Schritt ${schritt} von ${SCHRITTE.length}`}>
              {SCHRITTE.map((label, i) => {
                const n = i + 1;
                const aktiv = n === schritt;
                const fertig = n < schritt;
                return (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }} aria-current={aktiv ? 'step' : undefined}>
                    <span style={{ height: 4, borderRadius: 99, background: aktiv || fertig ? 'var(--muc-blau)' : 'var(--ink-100)', transition: 'background 200ms ease' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: aktiv ? 'var(--muc-blau)' : fertig ? 'var(--ink-500)' : 'var(--ink-300)' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 1 · Konto */}
          <div data-schritt="1" style={sichtbar(1)}>
            <Titel text="Zuerst du" unter="Du wirst Gründer und Admin." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <AuthFeld label="Nachname" name="nachname" placeholder="Huber" required autoComplete="family-name" />
              <AuthFeld label="Vorname" name="vorname" placeholder="Sepp" required autoComplete="given-name" />
            </div>
            <AuthFeld label="E-Mail" name="email" type="email" placeholder="sepp@beispiel.de" required autoComplete="email" inputMode="email" />
            <PasswortFeld label="Passwort" name="passwort" placeholder="mindestens 6 Zeichen" required minLength={6} autoComplete="new-password" />
          </div>

          {/* 2 · Stammtisch */}
          <div data-schritt="2" style={sichtbar(2)}>
            <Titel text="Euer Stammtisch" unter="Name, Heimat und seit wann." />
            <AuthFeld label="Name" name="name" placeholder="z. B. Hirschen-Stammtisch" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            <AuthFeld label="Stadt" name="stadt" placeholder="z. B. Regensburg" required maxLength={60} value={stadt} onChange={(e) => setStadt(e.target.value)} autoComplete="address-level2" meldung={{ art: 'hinweis', text: 'Karte und Wirtshaus-Suche richten sich danach.' }} />
            <AuthFeld
              label="Gründungsjahr"
              name="gruendungsjahr"
              placeholder={String(HEUER)}
              inputMode="numeric"
              required
              maxLength={4}
              value={jahr}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setJahr(v);
                if (jahrFehler) setJahrFehler(v.length === 4 ? jahrPruefen(v) : null);
              }}
              onBlur={() => setJahrFehler(jahr ? jahrPruefen(jahr) : null)}
              zustand={jahrFehler ? 'fehler' : null}
              meldung={jahrFehler ? { art: 'fehler', text: jahrFehler } : null}
            />
            <AuthFeld label="Motto (optional)" name="motto" placeholder="z. B. Immer anders. Immer daheim." maxLength={120} />
          </div>

          {/* 3 · Logo */}
          <div data-schritt="3" style={sichtbar(3)}>
            <Titel text="Euer Logo" unter="Kommt aufs App-Icon. Kannst du später ändern." />
            <LogoSchritt name="logoData" stammtischName={name} />
          </div>

          {/* 4 · Bräuche */}
          <div data-schritt="4" style={sichtbar(4)}>
            <Titel text="Wie ihr’s haltet" unter="Wirtshaus, Bier und was eine Hoibe kostet." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Wie seid ihr unterwegs?</span>
              <input type="hidden" name="typ" value={typ} />
              <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, borderRadius: 14, background: 'var(--navy)' }}>
                {(['wandernd', 'stammhaus'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={typ === t}
                    onClick={() => setTyp(t)}
                    style={{ height: 40, borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, background: typ === t ? 'var(--gold)' : 'transparent', color: typ === t ? 'var(--navy-900)' : 'rgba(246,240,226,0.7)', transition: 'background 150ms ease, color 150ms ease' }}
                  >
                    {t === 'wandernd' ? 'Wandernd' : 'Stammhaus'}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>
                {typ === 'wandernd'
                  ? 'Jedes Mal ein anderes Wirtshaus, mit Karte und der Regel „kein Wirtshaus zweimal“.'
                  : 'Immer dasselbe Wirtshaus. Reservieren ist ein Tipp, Ausflüge gehen trotzdem.'}
              </span>
            </div>
            {typ === 'stammhaus' && <WirtshausSuche namePrefix="stammhaus" bias={null} label="Euer Stammhaus" bekannte={[]} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Euer Bier</span>
              <input type="hidden" name="bierName" value={bier} />
              <BierChips value={bier} onChange={setBier} />
            </div>
            <AuthFeld
              label="Preis für eine Hoibe"
              name="hoibePreis"
              inputMode="decimal"
              required
              value={preis}
              onChange={(e) => setPreis(e.target.value)}
              rechts={<span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-500)' }}>€</span>}
              meldung={{ art: 'hinweis', text: 'Maßeinheit für alle Strafen.' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--pergament)', border: '1px solid var(--pergament-edge)' }}>
              <Wine size={26} weight="fill" color="var(--gold-700)" style={{ flex: 'none', opacity: schnaps ? 1 : 0.5 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Trinkt ihr Schnaps?</span>
                <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink-500)' }}>Dann gibt’s Schnaps am Bierdeckel, in der Statistik und als Badge.</span>
              </div>
              <input type="hidden" name="schnaps" value={schnaps ? 'on' : ''} />
              <Switch checked={schnaps} onChange={setSchnaps} tone="gold" />
            </div>
          </div>

          {/* 5 · Code + Anlegen */}
          <div data-schritt="5" style={sichtbar(5)}>
            <Titel text="Euer Gründungscode" unter="Damit kommen deine Spezln rein. Jederzeit änderbar." />
            <AuthFeld
              label="Gründungscode"
              name="code"
              mono
              value={code}
              onChange={(e) => codePruefen(e.target.value)}
              placeholder="z. B. HIRS-4711"
              required
              maxLength={40}
              autoComplete="off"
              autoCapitalize="characters"
              zustand={codeFrei === false ? 'fehler' : codeFrei && !laedtCode ? 'ok' : null}
              rechts={codeFrei && !laedtCode ? GRUEN_HAKEN : undefined}
              meldung={codeMeldung}
            />
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1.5px solid var(--gold)', background: 'var(--pergament)' }}>
              <div className="wn-raute wn-raute--sm" style={{ height: 6 }} />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 24, lineHeight: 1, color: 'var(--navy)' }}>{name || 'Euer Stammtisch'}</span>
                <Zeile icon={<MapPin size={16} weight="fill" />}>{[stadt, jahr ? `seit ${jahr}` : ''].filter(Boolean).join(', ') || 'Stadt und Jahr'}</Zeile>
                <Zeile icon={typ === 'stammhaus' ? <House size={16} weight="fill" /> : <Path size={16} weight="fill" />}>{typ === 'stammhaus' ? 'Stammhaus' : 'Wandernd'}</Zeile>
                <Zeile icon={<BeerStein size={16} weight="fill" />}>{bier.split(' – ')[0]} · Hoibe {preis.trim() || '?'} €</Zeile>
                <Zeile icon={<Wine size={16} weight="fill" />}>{schnaps ? 'Mit Schnaps' : 'Ohne Schnaps'}</Zeile>
                <Zeile icon={<UserCircle size={16} weight="fill" />}>Du bist Admin</Zeile>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)', marginTop: -6 }}>Der Gründungs-Token ist danach eingelöst.</span>
          </div>

          {lokalerFehler && <AuthFehlerBox>{lokalerFehler}</AuthFehlerBox>}
          {state.fehler && <AuthFehlerBox>{state.fehler}</AuthFehlerBox>}

          {/* Knöpfe unten: Zurück (weiß) + Weiter / Gründen (gold) */}
          <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
            {schritt > 0 && (
              <button type="button" onClick={zurueck} disabled={pending} className="wn-press" style={{ flex: 1, height: 54, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
                Zurück
              </button>
            )}
            {schritt < 5 ? (
              <AuthKnopf variante="gold" type="button" onClick={weiter} style={{ flex: 2 }}>
                {schritt === 0 ? 'Los geht’s' : 'Weiter'}
              </AuthKnopf>
            ) : (
              <AuthKnopf variante="gold" type="submit" pending={pending} wartend="Wird angelegt …" disabled={codeFrei === false} style={{ flex: 2 }}>
                Stammtisch gründen
              </AuthKnopf>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function Titel({ text, unter }: { text: string; unter: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <h2 style={{ fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 30, lineHeight: 1, color: 'var(--navy)', margin: 0 }}>{text}</h2>
      <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>{unter}</span>
    </div>
  );
}

function Zeile({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>
      <span style={{ color: 'var(--gold-700)', display: 'inline-flex', flex: 'none' }}>{icon}</span>
      {children}
    </span>
  );
}

/** Bier als Kacheln zum Durchwischen: Brauerei-Logo, Brauerei, Sorte. */
function BierChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -22px', padding: '2px 22px 6px', scrollbarWidth: 'none' }}>
      {BIERE.map((b) => {
        const aktiv = b.name === value;
        const [brauerei, sorte] = b.name.split(' – ');
        return (
          <button
            key={b.name}
            type="button"
            onClick={() => onChange(b.name)}
            aria-pressed={aktiv}
            className="wn-press"
            style={{ flex: 'none', width: 84, padding: '10px 4px 8px', borderRadius: 14, border: aktiv ? '2px solid var(--muc-blau)' : '1.5px solid var(--ink-100)', background: aktiv ? 'var(--info-bg)' : 'var(--weiss)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.logo} alt="" width={34} height={34} style={{ width: 34, height: 34, objectFit: 'contain', filter: aktiv ? 'none' : 'grayscale(0.5)' }} onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: aktiv ? 'var(--muc-blau)' : 'var(--ink-500)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brauerei}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--ink-300)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: -4 }}>{sorte ?? ''}</span>
          </button>
        );
      })}
    </div>
  );
}

function initialen(name: string): string {
  const w = name.trim().split(/[\s-]+/).filter(Boolean);
  const s = (w.length >= 2 ? w[0][0] + w[1][0] : (w[0] ?? 'S').slice(0, 2)).toUpperCase();
  return s || 'S';
}

/** Initialen in Fraktur-Gold auf Navy (Design 1d), im Browser gemalt. */
async function initialenMalen(text: string): Promise<string> {
  try { await document.fonts.load('230px "Pirata One"'); } catch { /* Fallback-Schrift */ }
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const g = ctx.createRadialGradient(256, 100, 40, 256, 256, 420);
  g.addColorStop(0, '#1B4C8A');
  g.addColorStop(1, '#07193A');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#E6C684';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '270px "Pirata One", serif';
  ctx.fillText(text, 256, 276);
  return c.toDataURL('image/png');
}

/**
 * Logo-Schritt (1d): große Vorschau, drei Kacheln: Wappen (koa eigenes Logo),
 * Initialen (Fraktur auf Navy), eigenes Bild (Zuschnitt wie beim Profilbild).
 */
function LogoSchritt({ name, stammtischName }: { name: string; stammtischName: string }) {
  const [wahl, setWahl] = useState<'wappen' | 'initialen' | 'eigen'>('wappen');
  const [ini, setIni] = useState('');
  const [eigen, setEigen] = useState('');
  const buchstaben = useMemo(() => initialen(stammtischName), [stammtischName]);

  useEffect(() => {
    let aktuell = true;
    initialenMalen(buchstaben).then((d) => { if (aktuell) setIni(d); });
    return () => { aktuell = false; };
  }, [buchstaben]);

  const wert = wahl === 'initialen' ? ini : wahl === 'eigen' ? eigen : '';
  const kachel = (key: typeof wahl, bild: React.ReactNode, text: string) => {
    const aktiv = wahl === key;
    return (
      <button key={key} type="button" onClick={() => setWahl(key)} aria-pressed={aktiv} className="wn-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 6px', borderRadius: 14, border: aktiv ? '2px solid var(--muc-blau)' : '1.5px solid var(--ink-100)', background: aktiv ? 'var(--info-bg)' : 'var(--weiss)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
        {bild}
        <span style={{ fontSize: 12, fontWeight: 800, color: aktiv ? 'var(--muc-blau)' : 'var(--ink-500)' }}>{text}</span>
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input type="hidden" name={name} value={wert} />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
        <div style={{ width: 132, height: 132, borderRadius: 30, background: LOGO_GRUND, display: 'grid', placeItems: 'center', boxShadow: '0 12px 30px rgba(12,43,90,0.3)', overflow: 'hidden' }}>
          {wert ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wert} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <Image src="/brand/rauten-app.svg" alt="" width={96} height={96} style={{ height: 96, width: 'auto' }} />
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {kachel('wappen', (
          <span style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--navy)', display: 'grid', placeItems: 'center' }}>
            <Image src="/brand/rauten-app.svg" alt="" width={40} height={40} style={{ height: 40, width: 'auto' }} />
          </span>
        ), 'Wappen')}
        {kachel('initialen', (
          <span style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--navy)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-fraktur)', fontSize: 30, color: 'var(--gold-bright)' }}>{buchstaben}</span>
        ), 'Initialen')}
        {kachel('eigen', (
          <span style={{ width: 56, height: 56, borderRadius: 14, background: eigen ? 'transparent' : 'var(--ink-50)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            {eigen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={eigen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <ImageSquare size={28} color="var(--ink-500)" />
            )}
          </span>
        ), 'Eigenes Bild')}
      </div>
      {wahl === 'eigen' && <EigenesBild titel="Logo" onErgebnis={(d) => setEigen(d)} />}
    </div>
  );
}

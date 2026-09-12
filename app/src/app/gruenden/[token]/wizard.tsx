'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { Button, Input, SegmentedTabs, Switch } from '@/components/ds';
import { BierWahl } from '@/components/domain/BierWahl';
import { HELLE_WAHL, STANDARD_BIERSORTE } from '@/lib/biersorten';
import { LogoWahl } from '@/components/domain/LogoWahl';
import { WirtshausSuche } from '@/components/domain/WirtshausSuche';
import { gruenden, codeVorschlagFuer, codeIstFrei, type GruendungsState } from './actions';

const SCHRITTE = ['Konto', 'Stammtisch', 'Logo', 'Bräuche', 'Anlegen'] as const;
type Schritt = 1 | 2 | 3 | 4 | 5;
const HEUER = new Date().getFullYear();

/**
 * Gründungs-Wizard in fünf kurzen Schritten (jeder passt auf ein Handy-Display):
 * Konto → Stammtisch → Logo → Bräuche → Code + Anlegen. Alles is EIN Formular:
 * inaktive Schritte bleiben im DOM (versteckt), am Ende gehen alle Felder
 * gemeinsam an die Server Action. Geprüft wird pro Schritt beim „Weiter“,
 * mit eigenen Meldungen direkt am Feld; Server-Fehler springen zum Schritt.
 */
export function GruendungsWizard({ token }: { token: string }) {
  const [state, action, pending] = useActionState<GruendungsState, FormData>(gruenden.bind(null, token), {});
  const [schritt, setSchritt] = useState<Schritt>(1);
  const [typ, setTyp] = useState<'wandernd' | 'stammhaus'>('wandernd');
  const [name, setName] = useState('');
  const [stadt, setStadt] = useState('');
  const [jahr, setJahr] = useState('');
  const [jahrFehler, setJahrFehler] = useState<string | null>(null);
  const [passwortZeigen, setPasswortZeigen] = useState(false);
  const [bier, setBier] = useState(STANDARD_BIERSORTE);
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
    const box = formRef.current?.querySelector<HTMLElement>(`[data-schritt="${schritt}"]`);
    box?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const erstes = box?.querySelector<HTMLInputElement>('input:not([type="hidden"]):not([type="file"])');
    if (erstes && schritt !== 3) setTimeout(() => erstes.focus({ preventScroll: true }), 250);
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
    if (!wert.trim()) return 'Wann habt’s ihr angfangt? A Jahreszahl bitte.';
    if (!Number.isInteger(n) || n < 1) return 'Des is koa Jahreszahl.';
    if (n > HEUER) return `In der Zukunft gründen geht ned, ${HEUER} is des Höchste.`;
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
        setLokalerFehler('Wia hoaßt euer Stammhaus? Such’s über Google oder tipp den Namen ein.');
        return;
      }
    }
    setLokalerFehler(null);
    setSchritt((s) => (s < 5 ? ((s + 1) as Schritt) : s));
  };
  const zurueck = () => {
    setLokalerFehler(null);
    setSchritt((s) => (s > 1 ? ((s - 1) as Schritt) : s));
  };

  const sichtbar = (n: number): React.CSSProperties => ({ display: schritt === n ? 'flex' : 'none', flexDirection: 'column', gap: 14, scrollMarginTop: 16 });
  const titel = (text: string, unter?: string) => (
    <div>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink-900)' }}>{text}</div>
      {unter && <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', lineHeight: 1.5, marginTop: 2 }}>{unter}</div>}
    </div>
  );

  return (
    <form ref={formRef} action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stepper */}
      <div style={{ display: 'flex', gap: 6 }} aria-label={`Schritt ${schritt} von ${SCHRITTE.length}`}>
        {SCHRITTE.map((label, i) => {
          const n = i + 1;
          const aktiv = n === schritt;
          const fertig = n < schritt;
          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }} aria-current={aktiv ? 'step' : undefined}>
              <div style={{ height: 4, borderRadius: 999, background: aktiv || fertig ? 'var(--muc-blau)' : 'var(--ink-100)', transition: 'background 200ms var(--ease-standard)' }} />
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: aktiv ? 'var(--muc-blau)' : fertig ? 'var(--ink-500)' : 'var(--ink-300)' }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1 · Konto */}
      <div data-schritt="1" style={sichtbar(1)}>
        {titel('Zuerst du', 'Du wirst Gründer und Admin von eurem Stammtisch.')}
        <Input label="Nachname" name="nachname" placeholder="Huber" required autoComplete="family-name" />
        <Input label="Vorname" name="vorname" placeholder="Sepp" required autoComplete="given-name" />
        <Input label="E-Mail" name="email" type="email" placeholder="sepp@beispiel.de" required autoComplete="email" inputMode="email" />
        <div>
          <Input label="Passwort" name="passwort" type={passwortZeigen ? 'text' : 'password'} placeholder="mindestens 6 Zeichen" required minLength={6} autoComplete="new-password" />
          <button
            type="button"
            className="wn-press"
            onClick={() => setPasswortZeigen((z) => !z)}
            style={{ marginTop: 6, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'var(--muc-blau)' }}
          >
            {passwortZeigen ? 'Passwort verstecken' : 'Passwort anzeigen'}
          </button>
        </div>
      </div>

      {/* 2 · Stammtisch */}
      <div data-schritt="2" style={sichtbar(2)}>
        {titel('Euer Stammtisch', 'Name, Heimat und seit wann.')}
        <Input label="Name vom Stammtisch" name="name" placeholder="z. B. Hirschen-Stammtisch" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Stadt" name="stadt" placeholder="z. B. Regensburg" required maxLength={60} value={stadt} onChange={(e) => setStadt(e.target.value)} hint="Karte und Wirtshaus-Suche richten sich danach." autoComplete="address-level2" />
        <Input
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
          error={jahrFehler}
          hint={jahrFehler ? null : 'Jedes Jahr geht, nur ned in der Zukunft.'}
        />
        <Input label="Motto (optional)" name="motto" placeholder="z. B. Oiwei anders. Oiwei dahoam." maxLength={120} />
      </div>

      {/* 3 · Logo */}
      <div data-schritt="3" style={sichtbar(3)}>
        {titel('Euer Logo', 'Kommt oben in d’App und wird euer App-Icon. Kannst aa später ändern.')}
        <LogoWahl name="logoData" stammtischName={name} />
      </div>

      {/* 4 · Bräuche */}
      <div data-schritt="4" style={sichtbar(4)}>
        {titel('Wia ihr’s haltet', 'Wirtshaus, Bier und was a Hoibe kost.')}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>Wia seid’s unterwegs?</label>
          <input type="hidden" name="typ" value={typ} />
          <SegmentedTabs
            fullWidth
            value={typ}
            onChange={(v: string) => setTyp(v === 'stammhaus' ? 'stammhaus' : 'wandernd')}
            tabs={[
              { label: 'Wandernd', value: 'wandernd' },
              { label: 'Stammhaus', value: 'stammhaus' },
            ]}
          />
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginTop: 6, lineHeight: 1.45 }}>
            {typ === 'wandernd'
              ? 'Jedes Mal a anders Wirtshaus: mit Karte, Archiv und der Regel „koa Wirtshaus zweimal“.'
              : 'Immer dasselbe Wirtshaus: Reservieren is a Ein-Tap-Bestätigung, Ausflüge gehen trotzdem.'}
          </div>
        </div>
        {typ === 'stammhaus' && (
          <WirtshausSuche namePrefix="stammhaus" bias={null} label="Euer Stammhaus (Google-Suche)" bekannte={[]} />
        )}
        <BierWahl label="Euer Bier" biere={HELLE_WAHL} value={bier} onChange={setBier} />
        <input type="hidden" name="bierName" value={bier} />
        <Input label="Preis für a Hoibe (€)" name="hoibePreis" placeholder="3,70" defaultValue="3,70" inputMode="decimal" required hint="D’Maßeinheit für alle Strafen: a Runde = Teilnehmer × Hoibe-Preis." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)' }}>
          <span style={{ fontSize: 26, flex: 'none', filter: schnaps ? 'none' : 'grayscale(1) opacity(0.5)' }}>🥃</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Schnapselt ihr?</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.4 }}>Dann gibt’s Schnaps am Bierdeckel, in der Statistik und den Schnapsler-Badge.</div>
          </div>
          <input type="hidden" name="schnaps" value={schnaps ? 'on' : ''} />
          <Switch checked={schnaps} onChange={setSchnaps} tone="gold" />
        </div>
      </div>

      {/* 5 · Code + Anlegen */}
      <div data-schritt="5" style={sichtbar(5)}>
        {titel('Euer Gründungscode', 'Damit kommen deine Spezln eini. Jederzeit änderbar.')}
        <Input
          label="Gründungscode"
          name="code"
          value={code}
          onChange={(e) => codePruefen(e.target.value)}
          placeholder="z. B. HIRS-4711"
          required
          maxLength={40}
          autoComplete="off"
          autoCapitalize="characters"
          style={{ textTransform: 'uppercase' }}
          error={codeFrei === false ? 'Den Code hat scho a anderer Stammtisch.' : null}
          hint={laedtCode ? 'Prüf…' : codeFrei ? '✓ Frei' : 'Buchstaben, Ziffern, Bindestrich (3–40 Zeichen)'}
        />
        <div style={{ padding: '12px 14px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.55 }}>
          <b>{name || 'Euer Stammtisch'}</b>
          {stadt ? ` aus ${stadt}` : ''}
          {jahr ? `, seit ${jahr}` : ''}, Typ <b>{typ === 'stammhaus' ? 'Stammhaus' : 'wandernd'}</b>.
          <br />
          Du bist der Admin und landest direkt in eurer App. Der Gründungs-Token is danach eingelöst.
        </div>
      </div>

      {lokalerFehler && (
        <div role="alert" style={{ padding: '10px 12px', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>
          {lokalerFehler}
        </div>
      )}
      {state.fehler && (
        <div role="alert" style={{ padding: '10px 12px', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>
          {state.fehler}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {schritt > 1 && (
          <Button type="button" variant="secondary" onClick={zurueck} disabled={pending} style={{ flex: 1 }}>
            Zurück
          </Button>
        )}
        {schritt < 5 ? (
          <Button type="button" variant="gold" onClick={weiter} style={{ flex: 2 }}>
            Weiter
          </Button>
        ) : (
          <Button type="submit" variant="gold" disabled={pending || codeFrei === false} style={{ flex: 2 }}>
            {pending ? 'Wird angelegt…' : 'Stammtisch gründen'}
          </Button>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-300)', textAlign: 'center' }}>Schritt {schritt} von {SCHRITTE.length}</div>
    </form>
  );
}

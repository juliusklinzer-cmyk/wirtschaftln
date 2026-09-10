'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { Button, Input, SegmentedTabs } from '@/components/ds';
import { gruenden, codeVorschlagFuer, codeIstFrei, type GruendungsState } from './actions';

const SCHRITTE = ['Dei Konto', 'Euer Stammtisch', 'Gründungscode', 'Anlegen'] as const;

/**
 * Gründungs-Wizard in vier Schritten. Alles is EIN Formular: die inaktiven
 * Schritte bleiben im DOM (versteckt), damit am Ende alle Felder gemeinsam
 * an die Server Action gehen. Serverseitige Fehler springen zum passenden Schritt.
 */
export function GruendungsWizard({ token }: { token: string }) {
  const [state, action, pending] = useActionState<GruendungsState, FormData>(gruenden.bind(null, token), {});
  const [schritt, setSchritt] = useState<1 | 2 | 3 | 4>(1);
  const [typ, setTyp] = useState<'wandernd' | 'stammhaus'>('wandernd');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeFrei, setCodeFrei] = useState<boolean | null>(null);
  const [laedtCode, startCode] = useTransition();

  useEffect(() => {
    if (state.schritt) setSchritt(state.schritt);
  }, [state]);

  // Schritt 3: Vorschlag aus dem Namen holen, sobald der Schritt aufgeht
  useEffect(() => {
    if (schritt !== 3 || code) return;
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

  const weiter = (e: React.MouseEvent<HTMLButtonElement>) => {
    // HTML-Validierung nur für die sichtbaren Felder des aktuellen Schritts
    const form = e.currentTarget.form!;
    const felder = form.querySelectorAll<HTMLInputElement>(`[data-schritt="${schritt}"] input`);
    for (const f of felder) {
      if (!f.checkValidity()) {
        f.reportValidity();
        return;
      }
    }
    setSchritt((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  };
  const zurueck = () => setSchritt((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  const sichtbar = (n: number): React.CSSProperties => ({ display: schritt === n ? 'flex' : 'none', flexDirection: 'column', gap: 14 });

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stepper */}
      <div style={{ display: 'flex', gap: 6 }}>
        {SCHRITTE.map((label, i) => {
          const n = i + 1;
          const aktiv = n === schritt;
          const fertig = n < schritt;
          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ height: 4, borderRadius: 999, background: aktiv || fertig ? 'var(--muc-blau)' : 'var(--ink-100)' }} />
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: aktiv ? 'var(--muc-blau)' : 'var(--ink-300)' }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1 · Gründer-Konto */}
      <div data-schritt="1" style={sichtbar(1)}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Zuerst du: der Gründer und Admin</div>
        <Input label="Nachname" name="nachname" placeholder="Huber" required autoComplete="family-name" />
        <Input label="Vorname" name="vorname" placeholder="Sepp" required autoComplete="given-name" />
        <Input label="E-Mail" name="email" type="email" placeholder="sepp@beispiel.de" required autoComplete="email" />
        <Input label="Passwort" name="passwort" type="password" placeholder="mindestens 6 Zeichen" required minLength={6} autoComplete="new-password" />
      </div>

      {/* 2 · Stammtisch-Basis */}
      <div data-schritt="2" style={sichtbar(2)}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Euer Stammtisch</div>
        <Input label="Name vom Stammtisch" name="name" placeholder="z. B. Hirschen-Stammtisch" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Motto (optional)" name="motto" placeholder="z. B. Oiwei anders. Oiwei dahoam." maxLength={120} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
          <Input label="Stadt" name="stadt" placeholder="z. B. Regensburg" required maxLength={60} hint="Die Karte und die Wirtshaus-Suche richten sich danach." />
          <Input label="Gründungsjahr" name="gruendungsjahr" placeholder={String(new Date().getFullYear())} inputMode="numeric" required maxLength={4} />
        </div>
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
          <>
            <Input label="Euer Stammhaus" name="stammhausName" placeholder="z. B. Zum Goldenen Hirschen" required={typ === 'stammhaus'} maxLength={80} />
            <Input label="Adresse vom Stammhaus (optional)" name="stammhausAdresse" placeholder="Straße, PLZ Ort" maxLength={200} />
          </>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
          <Input label="Euer Bier" name="bierName" placeholder="z. B. Weltenburger Hell" defaultValue="Helles" maxLength={60} />
          <Input label="Preis a Hoibe (€)" name="hoibePreis" placeholder="3,70" defaultValue="3,70" inputMode="decimal" required hint="Maßeinheit für Strafen." />
        </div>
      </div>

      {/* 3 · Gründungscode */}
      <div data-schritt="3" style={sichtbar(3)}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Euer Gründungscode</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', lineHeight: 1.5 }}>
          Mit dem Code kommen deine Spezln über die Beitreten-Seite eini. Du kannst ihn jederzeit in der Verwaltung ändern oder zumachen.
        </div>
        <Input
          label="Gründungscode"
          name="code"
          value={code}
          onChange={(e) => codePruefen(e.target.value)}
          placeholder="z. B. HIRS-4711"
          required
          maxLength={40}
          autoComplete="off"
          style={{ textTransform: 'uppercase' }}
          error={codeFrei === false ? 'Den Code hat scho a anderer Stammtisch.' : null}
          hint={laedtCode ? 'Prüf…' : codeFrei ? '✓ Frei' : 'Buchstaben, Ziffern, Bindestrich (3–40 Zeichen)'}
        />
      </div>

      {/* 4 · Anlegen */}
      <div data-schritt="4" style={sichtbar(4)}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Passt so?</div>
        <div style={{ padding: '12px 14px', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.55 }}>
          <b>{name || 'Euer Stammtisch'}</b> wird angelegt, Typ <b>{typ === 'stammhaus' ? 'Stammhaus' : 'wandernd'}</b>, Gründungscode <b>{code || '—'}</b>.
          Du bist der Admin und landest direkt in eurer App. Der Gründungs-Token is danach eingelöst.
        </div>
      </div>

      {state.fehler && (
        <div style={{ padding: '10px 12px', background: 'var(--strafe-bg)', border: '1px solid var(--strafe)', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>
          {state.fehler}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {schritt > 1 && (
          <Button type="button" variant="secondary" onClick={zurueck} disabled={pending} style={{ flex: 1 }}>
            Zurück
          </Button>
        )}
        {schritt < 4 ? (
          <Button type="button" variant="gold" onClick={weiter} disabled={schritt === 3 && codeFrei === false} style={{ flex: 2 }}>
            Weiter
          </Button>
        ) : (
          <Button type="submit" variant="gold" disabled={pending} style={{ flex: 2 }}>
            {pending ? 'Moment…' : 'Stammtisch gründen'}
          </Button>
        )}
      </div>
    </form>
  );
}

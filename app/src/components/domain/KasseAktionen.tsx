'use client';

import { useEffect, useState, useTransition } from 'react';
import { Avatar, Icon } from '@/components/ds';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { goldKnopfStil, bereichHinweisStil, feldStil, feldLabelStil } from '@/components/domain/hero-stil';

export type KasseSpezl = { id: string; name: string; photoUrl: string | null; verein: string | null };
type Aktion = 'melden' | 'spenden' | 'auslage' | 'einzahlung' | 'ausgabe';
type Action = (formData: FormData) => Promise<void>;

const VERGEHEN = ['Weißwurst nach zwölf', 'Ketchup auf den Leberkäs', 'Maß mit Strohhalm', 'Handy am Tisch', 'Spezi zum Schweinsbraten'];
const euro = (cents: number) => `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const vorname = (name: string) => { const [a, ...r] = name.split(' '); return a.length <= 3 && r.length > 0 ? name : a; };

/** Ganzzahl-Stepper 1–99 für Hoibe, zeigt den Euro-Gegenwert drunter. */
function HoibeStepper({ wert, onChange, preisCents }: { wert: number; onChange: (n: number) => void; preisCents: number }) {
  const knopf: React.CSSProperties = { width: 38, height: 38, borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" className="wn-press" aria-label="Weniger" onClick={() => onChange(Math.max(1, wert - 1))} style={{ ...knopf, border: '1.5px solid var(--pergament-edge)', background: 'var(--weiss)', color: 'var(--navy)' }}>−</button>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
        <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{wert}</span>
        <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-700)' }}>{euro(wert * preisCents)}</span>
      </span>
      <button type="button" className="wn-press" aria-label="Mehr" onClick={() => onChange(Math.min(99, wert + 1))} style={{ ...knopf, border: 'none', background: 'var(--navy)', color: '#fff' }}>+</button>
    </div>
  );
}

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={feldLabelStil}>{label}</span>
      {children}
    </label>
  );
}

/**
 * Aktionen der Kasse (Kasse-Redesign 14.10.2026): Kacheln für Melden, Spenden,
 * Auslage (alle) und Einzahlung, Ausgabe (Kassenwart). Jede öffnet ein Sheet
 * von unten, nach dem Speichern kurz die Erfolgsmeldung, dann schließt’s sich.
 */
export function KasseAktionen({
  mitglieder,
  meId,
  hoibePreisCents,
  darfKasse,
  actions,
}: {
  mitglieder: KasseSpezl[];
  meId: string;
  hoibePreisCents: number;
  darfKasse: boolean;
  actions: { melden: Action; spenden: Action; auslage: Action; einzahlung: Action; ausgabe: Action };
}) {
  const [offen, setOffen] = useState<Aktion | null>(null);
  const [erfolg, setErfolg] = useState<{ titel: string; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  // Melden
  const [opfer, setOpfer] = useState<string | null>(null);
  const [grund, setGrund] = useState('');
  const [hoibe, setHoibe] = useState(1);
  // Spenden
  const [spende, setSpende] = useState(1);
  const [anlass, setAnlass] = useState('');
  // Einzahlung
  const [vonWem, setVonWem] = useState(meId);

  const andere = mitglieder.filter((m) => m.id !== meId);
  const opferName = andere.find((m) => m.id === opfer)?.name ?? null;

  useEffect(() => {
    if (!erfolg) return;
    const t = setTimeout(() => { setErfolg(null); setOffen(null); }, 1500);
    return () => clearTimeout(t);
  }, [erfolg]);

  const zu = () => { setOffen(null); setErfolg(null); };
  const oeffnen = (a: Aktion) => { setErfolg(null); setOpfer(null); setGrund(''); setHoibe(1); setSpende(1); setAnlass(''); setVonWem(meId); setOffen(a); };

  const abschicken = (fd: FormData, aktion: Action, meldung: { titel: string; text: string }) =>
    startTransition(async () => {
      await aktion(fd);
      setErfolg(meldung);
    });

  const kachel = (a: Aktion, icon: React.ReactNode, farben: [string, string], titel: string, sub: string) => (
    <button
      key={a}
      type="button"
      className="wn-press"
      onClick={() => oeffnen(a)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 18, background: 'var(--weiss)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', minWidth: 0 }}
    >
      <span style={{ width: 40, height: 40, borderRadius: 12, background: farben[0], color: farben[1], display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{titel}</span>
      <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.35, color: 'var(--ink-500)' }}>{sub}</span>
    </button>
  );

  const outlineKnopf: React.CSSProperties = { height: 48, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
  const sheetKopf = (titel: string, sub: string) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '0 4px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, lineHeight: 1, color: 'var(--navy)' }}>{titel}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{sub}</span>
      </div>
      <button type="button" onClick={zu} aria-label="Schließen" className="wn-press" style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
        <Icon name="x" size={17} />
      </button>
    </div>
  );

  let inhalt: React.ReactNode = null;
  if (erfolg) {
    inhalt = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 0 18px', textAlign: 'center' }}>
        <span className="wn-pop" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--erfolg-bg)', color: 'var(--erfolg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check-circle" size={34} stroke={2.4} />
        </span>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1, color: 'var(--navy)' }}>{erfolg.titel}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{erfolg.text}</span>
      </div>
    );
  } else if (offen === 'melden') {
    const gueltig = !!opfer && grund.trim().length > 0;
    inhalt = (
      <form
        action={(fd) => { if (!gueltig) return; abschicken(fd, actions.melden, { titel: 'Gemeldet!', text: `${vorname(opferName!)} zahlt ${hoibe === 1 ? '1 Hoibe' : `${hoibe} Hoibe`} in die Kasse.` }); }}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {sheetKopf('Das kostet eine Hoibe!', 'Wird als offene Forderung eingetragen.')}
        <input type="hidden" name="memberId" value={opfer ?? ''} />
        <input type="hidden" name="hoibe" value={hoibe} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ ...feldLabelStil, padding: '0 4px' }}>Wer war’s?</span>
          <div className="wn-scroll-still" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 4px 2px' }}>
            {andere.map((m) => {
              const an = m.id === opfer;
              return (
                <button key={m.id} type="button" onClick={() => setOpfer(m.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none', border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                  <span style={{ display: 'inline-flex', borderRadius: '50%', boxShadow: an ? '0 0 0 3px var(--strafe)' : 'none', transition: 'box-shadow 120ms' }}>
                    <Avatar src={m.photoUrl} name={m.name} size={48} verein={m.verein} />
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: an ? 'var(--strafe)' : 'var(--ink-500)', whiteSpace: 'nowrap' }}>{vorname(m.name)}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Feld label="Was hat er angestellt?">
            <input name="grund" value={grund} onChange={(e) => setGrund(e.target.value)} maxLength={200} required placeholder="frei formulieren oder Vorschlag antippen" style={feldStil} />
          </Feld>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {VERGEHEN.map((v) => {
              const an = grund === v;
              return (
                <button key={v} type="button" onClick={() => setGrund(v)} style={{ fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 999, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-ui)', background: an ? 'var(--navy)' : 'var(--weiss)', border: an ? '1px solid var(--navy)' : '1px solid var(--ink-100)', color: an ? '#fff' : 'var(--ink-700)' }}>
                  {v}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'var(--pergament)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>Und das kostet …</span>
            <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>1 Hoibe = {euro(hoibePreisCents)}</span>
          </div>
          <HoibeStepper wert={hoibe} onChange={setHoibe} preisCents={hoibePreisCents} />
        </div>
        <button type="submit" disabled={!gueltig || pending} className="wn-press" style={{ height: 52, borderRadius: 14, border: 'none', background: 'var(--strafe)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 800, cursor: gueltig ? 'pointer' : 'default', opacity: gueltig && !pending ? 1 : 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Gavel size={22} weight="fill" />
          {pending ? 'Wird gemeldet …' : opferName ? `${vorname(opferName)} melden · ${euro(hoibe * hoibePreisCents)}` : 'Spezl auswählen'}
        </button>
      </form>
    );
  } else if (offen === 'spenden') {
    inhalt = (
      <form action={(fd) => abschicken(fd, actions.spenden, { titel: 'Vergelt’s Gott!', text: `${spende === 1 ? '1 Hoibe' : `${spende} Hoibe`} für die Kasse, ${euro(spende * hoibePreisCents)}.` })} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sheetKopf('Hoibe spenden', 'für die Kasse, jede Hoibe hilft')}
        <input type="hidden" name="hoibe" value={spende} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'var(--pergament)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>Wie viele Hoibe?</span>
            <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>1 Hoibe = {euro(hoibePreisCents)}</span>
          </div>
          <HoibeStepper wert={spende} onChange={setSpende} preisCents={hoibePreisCents} />
        </div>
        <Feld label="Anlass (optional)">
          <input name="grund" value={anlass} onChange={(e) => setAnlass(e.target.value)} maxLength={200} placeholder="Geburtstag, gute Laune …" style={feldStil} />
        </Feld>
        <button type="submit" disabled={pending} className="wn-press" style={{ ...goldKnopfStil, minHeight: 52, opacity: pending ? 0.7 : 1 }}>
          <Icon name="heart" size={20} />
          {pending ? 'Wird gespendet …' : `${spende} Hoibe spenden · ${euro(spende * hoibePreisCents)}`}
        </button>
      </form>
    );
  } else if (offen === 'auslage') {
    inhalt = (
      <form action={(fd) => abschicken(fd, actions.auslage, { titel: 'Eingetragen!', text: 'Steht mit deinem Namen als Minus im Kassenbuch.' })} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sheetKopf('Auslage eintragen', 'du bekommst es aus der Kasse zurück')}
        <Feld label="Wofür"><input name="grund" required maxLength={200} placeholder="Hosting, Domain …" style={feldStil} /></Feld>
        <Feld label="Betrag (€)"><input name="betrag" type="number" step="0.01" min="0.01" required placeholder="0,00" style={feldStil} /></Feld>
        <button type="submit" disabled={pending} className="wn-press" style={{ ...outlineKnopf, opacity: pending ? 0.7 : 1 }}>{pending ? 'Wird eingetragen …' : 'Eintragen'}</button>
      </form>
    );
  } else if (offen === 'einzahlung') {
    inhalt = (
      <form action={(fd) => abschicken(fd, actions.einzahlung, { titel: 'Eingetragen!', text: 'Die Einzahlung steht im Kassenbuch.' })} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sheetKopf('Einzahlung', 'nur Kassenwart')}
        <Feld label="Von wem">
          <select name="memberId" value={vonWem} onChange={(e) => setVonWem(e.target.value)} style={{ ...feldStil, appearance: 'auto' }}>
            {mitglieder.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Feld>
        <Feld label="Grund"><input name="grund" maxLength={200} placeholder="Hüttn-Sparbeitrag …" style={feldStil} /></Feld>
        <Feld label="Betrag (€)"><input name="betrag" type="number" step="0.50" min="0.50" required placeholder="0,00" style={feldStil} /></Feld>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, background: 'var(--info-bg)' }}>
          <Icon name="info" size={18} color="var(--muc-blau)" style={{ flex: 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'var(--navy)' }}>Bar gezahlte Strafe? Nicht hier buchen, im Kassenbuch auf „beglichen“ setzen.</span>
        </div>
        <button type="submit" disabled={pending} className="wn-press" style={{ ...goldKnopfStil, minHeight: 52, opacity: pending ? 0.7 : 1 }}>{pending ? 'Wird eingetragen …' : 'Eintragen'}</button>
      </form>
    );
  } else if (offen === 'ausgabe') {
    inhalt = (
      <form action={(fd) => abschicken(fd, actions.ausgabe, { titel: 'Gebucht!', text: 'Die Ausgabe steht im Kassenbuch.' })} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sheetKopf('Ausgabe buchen', 'aus der Kasse bezahlt')}
        <Feld label="Wofür"><input name="grund" required maxLength={200} placeholder="Jahresfeier-Anzahlung …" style={feldStil} /></Feld>
        <Feld label="Betrag (€)"><input name="betrag" type="number" step="0.50" min="0.50" required placeholder="0,00" style={feldStil} /></Feld>
        <button type="submit" disabled={pending} className="wn-press" style={{ ...outlineKnopf, opacity: pending ? 0.7 : 1 }}>{pending ? 'Wird gebucht …' : 'Buchen'}</button>
      </form>
    );
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HoamTitel action={darfKasse ? <span style={bereichHinweisStil}>Kassenwart</span> : null}>Aktionen</HoamTitel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {kachel('melden', <Gavel size={22} weight="fill" />, ['var(--strafe-bg)', 'var(--strafe)'], 'Melden', 'Das kostet eine Hoibe')}
        {kachel('spenden', <Icon name="heart" size={20} stroke={2.2} />, ['var(--pergament)', 'var(--gold-700)'], 'Spenden', 'Hoibe für die Kasse')}
        {kachel('auslage', <Icon name="receipt" size={20} stroke={2.2} />, ['var(--info-bg)', 'var(--muc-blau)'], 'Auslage', 'Privat für den Verein bezahlt')}
      </div>
      {darfKasse && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {kachel('einzahlung', <Icon name="hand-coins" size={20} stroke={2.2} />, ['var(--navy)', 'var(--gold-bright)'], 'Einzahlung', 'Bares digital machen')}
          {kachel('ausgabe', <Icon name="cart" size={20} stroke={2.2} />, ['var(--navy)', 'var(--gold-bright)'], 'Ausgabe', 'Aus der Kasse bezahlt')}
        </div>
      )}

      {offen && (
        <>
          <div onClick={zu} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(7,25,58,0.5)' }} />
          <div
            role="dialog"
            className="wn-sheet-auf wn-scroll-still"
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 81, maxWidth: 'var(--container-app)', margin: '0 auto', maxHeight: '88dvh', overflowY: 'auto', background: 'var(--ink-50)', borderRadius: '28px 28px 0 0', padding: '10px 16px calc(24px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 -14px 36px rgba(7,25,58,0.3)' }}
          >
            <span style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 999, background: 'var(--ink-200)', flex: 'none' }} />
            {inhalt}
          </div>
        </>
      )}
    </section>
  );
}

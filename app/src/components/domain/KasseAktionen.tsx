'use client';

import { useEffect, useState, useTransition } from 'react';
import { Icon } from '@/components/ds';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { HoamTitel } from '@/components/domain/HoamTitel';
import { goldKnopfStil, bereichHinweisStil, feldStil, feldLabelStil } from '@/components/domain/hero-stil';
import { StrafeBuchen, type StrafWahl, type StrafAntwort } from '@/components/domain/StrafeBuchen';

export type KasseSpezl = { id: string; name: string; photoUrl: string | null; verein: string | null };
type Aktion = 'strafe' | 'spenden' | 'auslage' | 'einzahlung' | 'ausgabe';
type Action = (formData: FormData) => Promise<void>;

const euro = (cents: number) => `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={feldLabelStil}>{label}</span>
      {children}
    </label>
  );
}

/**
 * Aktionen der Kasse (Kasse-Redesign 14.10.2026): Kacheln für Strafe, Spenden,
 * Auslage (alle) und Einzahlung, Ausgabe (Kassenwart). Jede öffnet ein Sheet
 * von unten, nach dem Speichern kurz die Erfolgsmeldung, dann schließt’s sich.
 */
export function KasseAktionen({
  mitglieder,
  meId,
  regeln,
  darfKasse,
  darfKatalog = false,
  variante = 'kacheln',
  actions,
}: {
  mitglieder: KasseSpezl[];
  meId: string;
  /** Eigene Strafen aus dem Katalog */
  regeln: StrafWahl[];
  darfKasse: boolean;
  /** Präsident oder Admin → „Neue Strafe erstellen“ im Buchen-Sheet */
  darfKatalog?: boolean;
  /**
   * Responsive 4a (12.11.2026): `knoepfe` = nur „Melden“ und „Spenden“ als Knöpfe in der
   * Kassenstand-Karte, `weitere` = die übrigen Kacheln (Auslage, Kassenwart: Einzahlung, Ausgabe).
   */
  variante?: 'kacheln' | 'knoepfe' | 'weitere';
  actions: { strafeBuchen: (fd: FormData) => Promise<StrafAntwort>; spenden: Action; auslage: Action; einzahlung: Action; ausgabe: Action };
}) {
  const [offen, setOffen] = useState<Aktion | null>(null);
  const [erfolg, setErfolg] = useState<{ titel: string; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  // Spenden
  const [spende, setSpende] = useState('');
  const [anlass, setAnlass] = useState('');
  // Einzahlung
  const [vonWem, setVonWem] = useState(meId);


  useEffect(() => {
    if (!erfolg) return;
    const t = setTimeout(() => { setErfolg(null); setOffen(null); }, 1500);
    return () => clearTimeout(t);
  }, [erfolg]);

  const zu = () => { setOffen(null); setErfolg(null); };
  const oeffnen = (a: Aktion) => { setErfolg(null); setSpende(''); setAnlass(''); setVonWem(meId); setOffen(a); };

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
  } else if (offen === 'strafe') {
    inhalt = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sheetKopf('Strafe buchen', 'aus eurem Strafenkatalog')}
        <StrafeBuchen mitglieder={mitglieder} regeln={regeln} neuErstellen={darfKatalog} buchen={actions.strafeBuchen} onGebucht={(meldung) => setErfolg({ titel: 'Gebucht!', text: meldung })} />
      </div>
    );
  } else if (offen === 'spenden') {
    const cents = Math.round((Number(spende.replace(',', '.')) || 0) * 100);
    inhalt = (
      <form action={(fd) => { if (cents <= 0) return; abschicken(fd, actions.spenden, { titel: 'Vergelt’s Gott!', text: `${euro(cents)} für die Kasse.` }); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sheetKopf('Spenden', 'für die Kasse, jeder Euro hilft')}
        <Feld label="Betrag (€)">
          <input name="betrag" type="number" step="0.50" min="0.50" required inputMode="decimal" value={spende} onChange={(e) => setSpende(e.target.value)} placeholder="0,00" style={feldStil} />
        </Feld>
        <Feld label="Anlass (optional)">
          <input name="grund" value={anlass} onChange={(e) => setAnlass(e.target.value)} maxLength={200} placeholder="Geburtstag, gute Laune …" style={feldStil} />
        </Feld>
        <button type="submit" disabled={pending || cents <= 0} className="wn-press" style={{ ...goldKnopfStil, minHeight: 52, opacity: pending || cents <= 0 ? 0.6 : 1 }}>
          <Icon name="heart" size={20} />
          {pending ? 'Wird gespendet …' : cents > 0 ? `${euro(cents)} spenden` : 'Spenden'}
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

  const knopf: React.CSSProperties = { height: 46, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800 };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: variante === 'knoepfe' ? 0 : 12 }}>
      {variante === 'knoepfe' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" className="wn-press" onClick={() => oeffnen('strafe')} style={{ ...knopf, background: 'var(--strafe)', color: '#fff' }}>
            <Gavel size={18} weight="fill" />Melden
          </button>
          <button type="button" className="wn-press" onClick={() => oeffnen('spenden')} style={{ ...knopf, background: 'var(--grad-gold)', color: 'var(--navy-900)', boxShadow: 'var(--sh-gold)' }}>
            <Icon name="heart" size={18} stroke={2.2} />Spenden
          </button>
        </div>
      ) : variante === 'weitere' ? (
        <>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-500)', padding: '0 4px' }}>
            {darfKasse ? 'Weitere Aktionen · Kassenwart' : 'Weitere Aktionen'}
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: darfKasse ? 'repeat(3, 1fr)' : '1fr', gap: 8 }}>
            {kachel('auslage', <Icon name="receipt" size={20} stroke={2.2} />, ['var(--info-bg)', 'var(--muc-blau)'], 'Auslage', 'Privat für den Verein bezahlt')}
            {darfKasse && kachel('einzahlung', <Icon name="hand-coins" size={20} stroke={2.2} />, ['var(--navy)', 'var(--gold-bright)'], 'Einzahlung', 'Bares digital machen')}
            {darfKasse && kachel('ausgabe', <Icon name="cart" size={20} stroke={2.2} />, ['var(--navy)', 'var(--gold-bright)'], 'Ausgabe', 'Aus der Kasse bezahlt')}
          </div>
        </>
      ) : (
        <>
          <HoamTitel action={darfKasse ? <span style={bereichHinweisStil}>Kassenwart</span> : null}>Aktionen</HoamTitel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {kachel('strafe', <Gavel size={22} weight="fill" />, ['var(--strafe-bg)', 'var(--strafe)'], 'Strafe', 'aus dem Katalog buchen')}
            {kachel('spenden', <Icon name="heart" size={20} stroke={2.2} />, ['var(--pergament)', 'var(--gold-700)'], 'Spenden', 'Geld für die Kasse')}
            {kachel('auslage', <Icon name="receipt" size={20} stroke={2.2} />, ['var(--info-bg)', 'var(--muc-blau)'], 'Auslage', 'Privat für den Verein bezahlt')}
          </div>
          {darfKasse && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {kachel('einzahlung', <Icon name="hand-coins" size={20} stroke={2.2} />, ['var(--navy)', 'var(--gold-bright)'], 'Einzahlung', 'Bares digital machen')}
              {kachel('ausgabe', <Icon name="cart" size={20} stroke={2.2} />, ['var(--navy)', 'var(--gold-bright)'], 'Ausgabe', 'Aus der Kasse bezahlt')}
            </div>
          )}
        </>
      )}

      {offen && (
        <>
          <div onClick={zu} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(7,25,58,0.5)' }} />
          <div
            role="dialog"
            className="wn-sheet-auf wn-scroll-still"
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 81, maxWidth: 'var(--container-app)', margin: '0 auto', maxHeight: '88dvh', overflowY: 'auto', background: 'var(--ink-50)', borderRadius: '28px 28px 0 0', padding: '10px 16px calc(24px + var(--wn-unten))', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 -14px 36px rgba(7,25,58,0.3)' }}
          >
            <span style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 999, background: 'var(--ink-200)', flex: 'none' }} />
            {inhalt}
          </div>
        </>
      )}
    </section>
  );
}

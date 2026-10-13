'use client';

import { useState } from 'react';
import { Icon, Kachel, Switch } from '@/components/ds';
import type { MeiBewertungWerte } from '@/components/domain/MeiBewertung';

const dez = (n: number) => n.toFixed(1).replace('.', ',');

const feld: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', minHeight: 46, padding: '12px 14px', borderRadius: 12,
  border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', fontFamily: 'var(--font-ui)',
  fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', outline: 'none',
};

/** Kompakter ± Stepper (Redesign): − weiß mit Rand, Wert, + in Navy. Eine Kommastelle, 0 bis 5. */
export function KompaktStepper({ value, onChange, size = 38 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const clamp = (v: number) => Math.max(0, Math.min(5, Math.round(v * 10) / 10));
  const knopf: React.CSSProperties = {
    width: size, height: size, flex: 'none', borderRadius: 10, cursor: 'pointer', padding: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 17, fontWeight: 800, lineHeight: 1,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
      <button type="button" className="wn-press" aria-label="Weniger" onClick={() => onChange(clamp(value - 0.1))} style={{ ...knopf, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)' }}>−</button>
      <span className="wn-tnum" style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', minWidth: 40, textAlign: 'center' }}>{dez(value)}</span>
      <button type="button" className="wn-press" aria-label="Mehr" onClick={() => onChange(clamp(value + 0.1))} style={{ ...knopf, border: 'none', background: 'var(--navy)', color: '#fff' }}>+</button>
    </div>
  );
}

/**
 * Die Wertungs-Felder (Redesign 1b/1c): Wirtshaus-Sterne mit Satz dazu,
 * Schweinsbraten und Kaiserschmarrn je mit Schalter, Sternen und Notiz.
 * Schreibt dieselben Feldnamen wie meineBewertung / besuchAbschliessen
 * (sterne, kommentar, kaisiProbiert, kaiserSterne, kaiserNotiz, brodnGessen,
 * brodnSterne, brodnNotiz, abend), lebt also in jedem <form>.
 */
export function WertungFelder({
  werte,
  ohneSterne = false,
  brodn,
  onBrodn,
}: {
  werte: MeiBewertungWerte;
  /** Stammhaus-Abend: koa Wirtshaus-Wertung, nur Brodn/Schmarrn + a Wort zum Abend */
  ohneSterne?: boolean;
  /** Brodn-Zustand von außen (Abschluss-Zettel führt ihn selber), sonst hier */
  brodn?: boolean;
  onBrodn?: (an: boolean) => void;
}) {
  const [sterne, setSterne] = useState(werte.sterne ?? 3);
  const [kommentar, setKommentar] = useState(werte.kommentar);
  const [kaisi, setKaisi] = useState(werte.kaisiProbiert);
  const [kaiserSterne, setKaiserSterne] = useState(werte.kaiserSterne ?? 3);
  const [kaiserNotiz, setKaiserNotiz] = useState(werte.kaiserNotiz);
  const [brodnEigen, setBrodnEigen] = useState(werte.brodnGessen);
  const [brodnSterne, setBrodnSterne] = useState(werte.brodnSterne ?? 3);
  const [brodnNotiz, setBrodnNotiz] = useState(werte.brodnNotiz);
  const brodnAn = brodn ?? brodnEigen;
  const brodnSetzen = (an: boolean) => (onBrodn ? onBrodn(an) : setBrodnEigen(an));

  const kopfzeile = (icon: string, titel: string, sub: string, rechts: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Kachel ton="gold"><Icon name={icon} size={19} /></Kachel>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{titel}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{sub}</span>
      </div>
      {rechts}
    </div>
  );
  const unterblock = (frage: string, wert: number, setWert: (v: number) => void, name: string, notiz: string, setNotiz: (v: string) => void, platzhalter: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginLeft: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>{frage}</span>
        <KompaktStepper value={wert} onChange={setWert} size={32} />
      </div>
      <input name={name} value={notiz} onChange={(e) => setNotiz(e.target.value)} maxLength={500} placeholder={platzhalter} style={feld} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {ohneSterne ? <input type="hidden" name="abend" value="on" /> : <input type="hidden" name="sterne" value={String(sterne)} />}
      {kaisi && <input type="hidden" name="kaisiProbiert" value="on" />}
      {kaisi && <input type="hidden" name="kaiserSterne" value={String(kaiserSterne)} />}
      {brodnAn && <input type="hidden" name="brodnGessen" value="on" />}
      {brodnAn && <input type="hidden" name="brodnSterne" value={String(brodnSterne)} />}

      {/* Wirtshaus: Sterne + a Satz dazu (beim Stammhaus nur der Satz) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 0 14px' }}>
        {kopfzeile('home', ohneSterne ? 'Dein Abend' : 'Wirtshaus', ohneSterne ? 'S’Stammhaus kennt jeder, a Wort zum Abend reicht' : 'deine Sterne', ohneSterne ? null : <KompaktStepper value={sterne} onChange={setSterne} />)}
        <input name="kommentar" value={kommentar} onChange={(e) => setKommentar(e.target.value)} maxLength={500} placeholder="Wie war’s? z.B. Bedienung top, Bier frisch" style={feld} />
      </div>

      {/* Schweinsbraten: zählt in d’Brodn-Rangliste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0', borderTop: '1px solid var(--ink-50)' }}>
        {kopfzeile('bowl', 'Schweinsbraten', 'zählt für dich · Brodn-Wertung', <Switch checked={brodnAn} onChange={brodnSetzen} tone="erfolg" />)}
        {brodnAn && unterblock('Wie war er?', brodnSterne, setBrodnSterne, 'brodnNotiz', brodnNotiz, setBrodnNotiz, 'Kruste, Knödl, Soße …')}
      </div>

      {/* Kaiserschmarrn: zählt in d’Kaisi-Rangliste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0 0', borderTop: '1px solid var(--ink-50)' }}>
        {kopfzeile('cookie', 'Kaiserschmarrn', 'zählt für dich · Kaisi-Wertung', <Switch checked={kaisi} onChange={setKaisi} tone="erfolg" />)}
        {kaisi && unterblock('Wie war er?', kaiserSterne, setKaiserSterne, 'kaiserNotiz', kaiserNotiz, setKaiserNotiz, 'Fluffig? Rosinen?')}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { PTS } from '@/lib/punkte';
import { SterneStepper, ProbiertKopf, textareaStyle, type MeiBewertungWerte } from '@/components/domain/MeiBewertung';

/**
 * „Dei Wertung“ im Abschluss-Zettel: der Abschließer bewertet im selben Zug
 * mit (Julius, 14.09.2026), koa zweiter Schritt. Vorbelegt aus „Mei
 * Bewertung“, falls er scho dort war; anpassen geht danach a Woch’ lang.
 * Schreibt dieselben Feldnamen wie meineBewertung (sterne, kommentar, kaisi…),
 * die Action nimmt sie beim Abschluss mit. Brodn gessen kommt von außen
 * (im Nachtrag-Zettel steht der Schalter scho in der Zeile).
 */
export function EigeneWertung({
  werte,
  brodn,
  onBrodn,
}: {
  werte: MeiBewertungWerte;
  /** Brodn-Zustand und Schalter, wenn der Zettel ihn selber führt; sonst führt ihn dieser Block */
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
  const schonBewertet = werte.sterne != null;

  return (
    <div style={{ padding: 14, border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input type="hidden" name="sterne" value={String(sterne)} />
      {kaisi && <input type="hidden" name="kaisiProbiert" value="on" />}
      {kaisi && <input type="hidden" name="kaiserSterne" value={String(kaiserSterne)} />}
      {brodnAn && <input type="hidden" name="brodnGessen" value="on" />}
      {brodnAn && <input type="hidden" name="brodnSterne" value={String(brodnSterne)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Dei Wertung</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-500)' }}>
            {schonBewertet ? 'Scho abgeben, hier kannst no anpassen.' : 'Wird mit’m Abschluss gspeichert, anpassen geht danach no a Woch’.'}
          </div>
        </div>
        <span className="wn-tnum" style={{ flex: 'none', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: schonBewertet ? 'var(--erfolg-bg)' : 'var(--grad-gold)', color: schonBewertet ? 'var(--erfolg)' : 'var(--navy-900)' }}>
          {schonBewertet ? '✓' : `+${PTS.bewertung} WP`}
        </span>
      </div>
      <SterneStepper value={sterne} onChange={setSterne} />
      <textarea
        name="kommentar" value={kommentar} onChange={(e) => setKommentar(e.target.value)} rows={2}
        placeholder="Wie war’s? Bedienung, Bier, Brotzeit…" style={textareaStyle}
      />
      <div style={{ border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        <ProbiertKopf
          icon="🥞" titel="Kaiserschmarrn probiert?" an={kaisi} onToggle={() => setKaisi(!kaisi)}
          untertitel={kaisi ? 'Dei Kaisi-Wertung zählt in d’Kaisi-Rangliste.' : 'Mitgessen? Antippen und bewerten.'}
        />
        {kaisi && (
          <div style={{ padding: '12px 14px 14px', borderTop: '1px solid var(--pergament-edge)', background: 'var(--pergament)' }}>
            <SterneStepper value={kaiserSterne} onChange={setKaiserSterne} />
            <textarea name="kaiserNotiz" value={kaiserNotiz} onChange={(e) => setKaiserNotiz(e.target.value)} rows={2} placeholder="Fluffig? Z’wenig Rosinen?" style={{ ...textareaStyle, marginTop: 12 }} />
          </div>
        )}
      </div>
      <div style={{ border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        <ProbiertKopf
          icon="🍖" titel="Brodn gessen?" an={brodnAn} onToggle={() => brodnSetzen(!brodnAn)}
          untertitel={brodnAn ? 'Dei Brodn-Wertung zählt in d’Brodn-Rangliste.' : 'An Schweinsbraten ghabt? Antippen und bewerten.'}
        />
        {brodnAn && (
          <div style={{ padding: '12px 14px 14px', borderTop: '1px solid var(--pergament-edge)', background: 'var(--pergament)' }}>
            <SterneStepper value={brodnSterne} onChange={setBrodnSterne} />
            <textarea name="brodnNotiz" value={brodnNotiz} onChange={(e) => setBrodnNotiz(e.target.value)} rows={2} placeholder="Kruste? Knödel? Soß’?" style={{ ...textareaStyle, marginTop: 12 }} />
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ds';
import { WirtshausSuche } from '@/components/domain/WirtshausSuche';
import { BierWahl } from '@/components/domain/BierWahl';
import { SterneStepper, textareaStyle } from '@/components/domain/MeiBewertung';
import { HELLE_WAHL } from '@/lib/biersorten';
import { wirtshausVorschlagen } from '@/app/(app)/termin/actions';
import { PTS } from '@/lib/punkte';
import type { BekanntesWirtshaus } from '@/lib/wirtshaus-abgleich';

/**
 * „Wirtshaus gfunden?"-Formular: Wirtshaus suchen, optional das Helle, und
 * mit'm Schalter „I war scho da" gleich die eigene Wertung dazu (Sterne, Text,
 * optional Schmarrn und Brodn). Neue Entdeckung gibt den Vorschlags-WP, die
 * Wertung selber bewusst koan (sonst sammelt wer mit Schmarrn-Wertungen Punkte).
 * Nach dem Eintragen: Erfolgsmeldung, Suchfeld leer, Header-Pill zählt mit.
 * Lehnt der Server ab (scho bsucht / eingeplant), bleibt die Eingabe stehen.
 */
export function WirtshausGfunden({ bekannte }: { bekannte: BekanntesWirtshaus[] }) {
  const [danke, setDanke] = useState<{ neu: boolean; bewertet: boolean } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [suchKey, setSuchKey] = useState(0);
  const [biersorte, setBiersorte] = useState('');
  const [warDa, setWarDa] = useState(false);
  const [sterne, setSterne] = useState(3);
  const [kommentar, setKommentar] = useState('');
  const [kaisi, setKaisi] = useState(false);
  const [kaiserSterne, setKaiserSterne] = useState(3);
  const [brodn, setBrodn] = useState(false);
  const [brodnSterne, setBrodnSterne] = useState(3);
  const [pending, startTransition] = useTransition();

  const eintragen = (formData: FormData) =>
    startTransition(async () => {
      const ergebnis = await wirtshausVorschlagen(formData);
      if (!ergebnis.ok) {
        setDanke(null);
        setFehler(ergebnis.meldung);
        return; // Eingabe stehen lassen, damit ma sieht, was ned ganga is
      }
      setFehler(null);
      setSuchKey((k) => k + 1); // Suchfeld leeren (Remount)
      setBiersorte('');
      setWarDa(false);
      setSterne(3); setKommentar(''); setKaisi(false); setBrodn(false);
      setDanke({ neu: ergebnis.neu, bewertet: ergebnis.bewertet });
    });

  return (
    <form action={eintragen} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <WirtshausSuche key={suchKey} bekannte={bekannte} />
      {/* Welches Helle schenken s' aus? Optional, steht dann am Pin dabei */}
      <input type="hidden" name="w_biersorte" value={biersorte} />
      <BierWahl
        label="Welches Helle gibt's dort? (wenn'st es woaßt)"
        biere={HELLE_WAHL}
        value={biersorte}
        onChange={setBiersorte}
        leerLabel="Woaß i ned, samma gspannt"
      />

      {/* I war scho da → eigene Wertung gleich mit */}
      <div style={{ border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setWarDa((w) => !w)}
          aria-pressed={warDa}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', background: warDa ? 'var(--pergament)' : 'var(--weiss)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
        >
          <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 'var(--r-md)', background: warDa ? 'var(--grad-gold)' : 'var(--pergament)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>★</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>I war scho da</span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink-500)' }}>
              {warDa ? 'Dei Wertung steht dann bei allen im Detail, ohne WP.' : 'Antippen und gleich bewerten, dann wissen’s alle.'}
            </span>
          </span>
          <span style={{ fontSize: 18, color: warDa ? 'var(--gold-700)' : 'var(--ink-200)', fontWeight: 800 }}>{warDa ? '✓' : '+'}</span>
        </button>
        {warDa && (
          <div style={{ padding: '12px 14px 14px', borderTop: '1px solid var(--pergament-edge)', background: 'var(--pergament)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="hidden" name="bewerten" value="on" />
            <input type="hidden" name="sterne" value={String(sterne)} />
            {kaisi && <input type="hidden" name="kaiserSterne" value={String(kaiserSterne)} />}
            {brodn && <input type="hidden" name="brodnSterne" value={String(brodnSterne)} />}
            <SterneStepper value={sterne} onChange={setSterne} />
            <textarea name="kommentar" value={kommentar} onChange={(e) => setKommentar(e.target.value)} rows={2} placeholder="Wia is’s gwesen? Bedienung, Bier, Brotzeit…" style={textareaStyle} />
            <ZusatzWertung label="🥞 Schmarrn" an={kaisi} onAn={setKaisi} wert={kaiserSterne} onWert={setKaiserSterne} notizName="kaiserNotiz" platzhalter="Wia war da Schmarrn? (optional)" />
            <ZusatzWertung label="🍖 Brodn" an={brodn} onAn={setBrodn} wert={brodnSterne} onWert={setBrodnSterne} notizName="brodnNotiz" platzhalter="Wia war da Brodn? (optional)" />
          </div>
        )}
      </div>

      <Button type="submit" fullWidth variant="secondary" disabled={pending}>
        {warDa ? 'Auf d’Karte damit, mit meiner Wertung' : 'Auf d’Karte damit'}
      </Button>
      {fehler && (
        <div
          style={{
            padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center',
            background: 'var(--strafe-bg)', border: '1px solid var(--strafe)',
            fontSize: 13, fontWeight: 800, color: 'var(--strafe)',
          }}
        >
          {fehler}
        </div>
      )}
      {danke ? (
        <div style={{ position: 'relative' }}>
          <style>{`
            @keyframes wnDankeRein { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.03); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes wnPlusFlug { 0% { transform: translateY(0); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-26px); opacity: 0; } }
          `}</style>
          <div
            style={{
              padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center',
              background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)',
              fontSize: 13, fontWeight: 800, color: 'var(--erfolg)',
              animation: 'wnDankeRein 400ms cubic-bezier(0.22, 1, 0.36, 1) both',
            }}
          >
            {danke.neu
              ? danke.bewertet ? '✓ Steht auf da Kartn, samt deiner Wertung. Vergelt’s Gott! 🍺' : '✓ Steht auf da Kartn, vergelt’s Gott! 🍺'
              : '✓ War scho entdeckt, dei Wertung steht jetzt dabei. Vergelt’s Gott!'}
          </div>
          {danke.neu && (
            <span
              className="wn-tnum"
              style={{
                position: 'absolute', right: 10, top: -6, fontSize: 13, fontWeight: 800,
                color: 'var(--gold-700)', pointerEvents: 'none',
                animation: 'wnPlusFlug 1.4s ease-out 300ms both',
              }}
            >
              +{PTS.vorschlag} WP
            </span>
          )}
        </div>
      ) : !fehler ? (
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
          Steht dann auf der Karte, gibt <b>+{PTS.vorschlag} WP</b>, und no oan, wenn’s der Stammtisch wirklich bsucht. Dei Wertung gibt koane Punkte.
        </div>
      ) : null}
    </form>
  );
}

/** Optionale Zusatz-Wertung (Schmarrn/Brodn): erst antippen, dann Stepper + Notiz. */
function ZusatzWertung({ label, an, onAn, wert, onWert, notizName, platzhalter }: {
  label: string; an: boolean; onAn: (a: boolean) => void; wert: number; onWert: (v: number) => void; notizName: string; platzhalter: string;
}) {
  if (!an) {
    return (
      <button type="button" onClick={() => onAn(true)} style={{ border: '1.5px dashed var(--ink-200)', background: 'none', borderRadius: 'var(--r-md)', width: '100%', padding: '9px 12px', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, color: 'var(--ink-500)', cursor: 'pointer' }}>
        + {label} bewerten
      </button>
    );
  }
  return (
    <div style={{ padding: '10px 12px', background: 'var(--weiss)', border: '1px solid var(--pergament-edge)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-900)' }}>{label}</span>
        <button type="button" onClick={() => onAn(false)} aria-label={`${label} doch ned bewerten`} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: 'var(--ink-300)', padding: 2 }}>✕</button>
      </div>
      <SterneStepper value={wert} onChange={onWert} />
      <input name={notizName} placeholder={platzhalter} maxLength={500} style={{ ...textareaStyle, padding: '9px 12px', fontSize: 13 }} />
    </div>
  );
}

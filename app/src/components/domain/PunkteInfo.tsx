'use client';

import { useState } from 'react';
import { Icon } from '@/components/ds';
import { useTenantConfig } from '@/components/shell/TenantProvider';
import { strafeFehlenWort } from '@/lib/tenant-config-public';
import { PTS, WACKELT_AB_UNENTSCHULDIGT, ABSCHLUSS_SPERRE_STUNDEN, anwesenheitsBonus, entschuldigtMalus, unentschuldigtMalus } from '@/lib/punkte';

/**
 * „Punktesystem", Aufklärung im Urkunden-Stil (Rauten-Band, Fraktur, Gold).
 * Werte und Staffeln kommen aus lib/punkte.ts, damit die Erklärung nie von
 * den echten Regeln abweicht.
 */
export function PunkteInfo({ knopf }: { knopf?: (oeffnen: () => void) => React.ReactNode } = {}) {
  const [offen, setOffen] = useState(false);
  const { strafeFehlenCents } = useTenantConfig();

  return (
    <>
      {knopf ? (
        /* Eigener Auslöser (z. B. Zeile im Profil-Menü) */
        knopf(() => setOffen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOffen(true)}
          style={{
            alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 6,
            border: 'none', background: 'none', padding: '2px 4px', cursor: 'pointer',
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, color: 'var(--muc-blau)',
          }}
        >
          ℹ️ Punktesystem
        </button>
      )}

      {offen && (
        <div className="wn-scroll-still" style={{ position: 'fixed', inset: 0, zIndex: 70, maxWidth: 'var(--container-app)', margin: '0 auto', overflowY: 'auto', overscrollBehavior: 'contain', background: 'var(--ink-50)', animation: 'wnPunkteRein 240ms ease-out both' }}>
          <style>{`
            @keyframes wnPunkteRein { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
          {/* Kopf: Navy mit Rautenband */}
          <div style={{ position: 'relative', background: 'radial-gradient(circle at 50% 30%, #123E78 0%, #07193A 80%)', color: 'var(--pergament)', textAlign: 'center', padding: 'calc(16px + env(safe-area-inset-top)) 20px 18px' }}>
            <button type="button" onClick={() => setOffen(false)} aria-label="Schließen" className="wn-press" style={{ position: 'absolute', top: 'calc(14px + env(safe-area-inset-top))', right: 16, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 2 }}>
              <Icon name="x" size={18} />
            </button>
            <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, lineHeight: 1, color: 'var(--gold-bright)', marginTop: 28 }}>Die Wirtschaftln-Punkte</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.8)', marginTop: 6 }}>Wer wann WP bekommt und wann’s weniger werden. Einmal verdient bleibt verdient.</div>
          </div>
          <div className="wn-raute wn-raute--sm" style={{ height: 8 }} />

          <div style={{ padding: '20px 16px calc(32px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Ueberschrift text="So gibt’s Punkte" />
            <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '4px 16px' }}>
              <Zeile icon="calendar" text="Beim Stammtisch dabei" wp={`+${PTS.teilnahme}`} />
              <Zeile icon="beer" text="Pro Hoibe" wp={`+${PTS.hoibe}`} />
              <Zeile icon="taxi" text="Gefahren & Spezln mitgenommen" wp={`+${PTS.taxi}`} />
              <Zeile icon="star" text="Eine Runde geschmissen" wp={`+${PTS.runde}`} />
              <Zeile icon="hand" text="Rechtzeitig zu- oder abgesagt (bis 3 Tage vorher)" wp={`+${PTS.abstimmen}`} />
              <Zeile icon="chair" text="Als Erster im Wirtshaus eingecheckt" wp={`+${PTS.checkin}`} />
              <Zeile icon="pin-plus" text="Wirtshaus vorgeschlagen (+1 extra, wenn’s besucht wird)" wp={`+${PTS.vorschlag}`} />
              <Zeile icon="star" text="Eigene Bewertung zum Abend (Text bringt nichts extra)" wp={`+${PTS.bewertung}`} />
              <Zeile icon="check-circle" text={`Als Erster abgeschlossen (ab ${ABSCHLUSS_SPERRE_STUNDEN} Std. nach Beginn)`} wp={`+${PTS.abschluss}`} />
              <Zeile icon="clipboard" text="Organisiert, je nach Sterne-Schnitt des Abends" wp={`0–${PTS.orgaMax}`} letzte />
            </div>

            <Ueberschrift text="Die Serie" abstand />
            <div style={erklaerText}>Ab dem zweiten Abend in Folge gibt’s je Abend einen Bonus, ohne Deckel, und er bleibt für immer. Ein Riss beendet nur die Serie.</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[2, 3, 5, 10].map((n) => (
                <Kachel key={n} oben={n === 2 ? '2. in Folge' : `${n}.`} unten={`+${anwesenheitsBonus(n)}`} farbe="var(--erfolg)" />
              ))}
            </div>

            <Ueberschrift text="Absagen" abstand />
            <div style={erklaerText}>Wer absagt, ist entschuldigt. Die erste Absage kostet nichts, dann wird’s in Folge teurer:</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4].map((n) => (
                <Kachel key={n} oben={n === 4 ? 'ab 4.' : `${n}.`} unten={entschuldigtMalus(n) === 0 ? '±0' : String(entschuldigtMalus(n))} farbe={entschuldigtMalus(n) === 0 ? 'var(--erfolg)' : 'var(--strafe)'} />
              ))}
            </div>

            <Ueberschrift text="Unentschuldigt" abstand />
            <div style={erklaerText}>Keine Stimme und nicht da, oder zugesagt und nicht gekommen:</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3].map((n) => (
                <Kachel key={n} oben={n === 3 ? 'ab 3.' : `${n}.`} unten={String(unentschuldigtMalus(n))} farbe="var(--strafe)" />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, background: 'var(--strafe-bg)', marginTop: 4 }}>
              <Icon name="warning" size={18} color="var(--strafe)" style={{ flex: 'none' }} />
              <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.5, color: 'var(--strafe)' }}>Beim {WACKELT_AB_UNENTSCHULDIGT}. Mal in Folge wackelst du und {strafeFehlenWort(strafeFehlenCents)} ist fällig. Wieder dabei sein setzt alles zurück.</span>
            </div>

            <Ueberschrift text="So läuft ein Abend" abstand />
            <div style={erklaerText}>
              Die Orga schnappt sich, wer mag („Ich übernehm’s“). Nur wer den letzten Stammtisch organisiert hat, setzt aus.
              Bewertet wird einzeln: Jeder gibt seine eigene Wertung ab (bis 7 Tage nach dem Abschluss), aus allen zusammen wird die Tages-Wertung. Schmarrn und Brodn bewertet nur, wer selber probiert hat.
              Abgeschlossen wird frühestens {ABSCHLUSS_SPERRE_STUNDEN} Stunden nach Beginn, und nur noch die Logistik (wer da war, wer zu spät kam). Einchecken geht ab 2 Stunden vor Beginn auf der Startseite.
            </div>

            <Ueberschrift text="Gut zu wissen" abstand />
            <div style={erklaerText}>
              Geldstrafen laufen über die Kasse und kosten Geld, keine WP. Hoibe- und Wirtshäuser-Ranglisten sind eigene Wertungen ohne Punkte. Die Saison zählt ab 1.7. bzw. 1.1., die Serie läuft über die ganze Chronik. Nachbewertungen bringen keine Punkte.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Ueberschrift({ text, abstand = false }: { text: string; abstand?: boolean }) {
  return (
    <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, color: 'var(--navy)', marginTop: abstand ? 12 : 4, marginBottom: 4, lineHeight: 1, padding: '0 4px' }}>
      {text}
    </div>
  );
}

function Zeile({ icon, text, wp, letzte = false }: { icon: string; text: string; wp: string; letzte?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 46, padding: '6px 0', borderBottom: letzte ? 'none' : '1px solid var(--ink-50)' }}>
      <Icon name={icon} size={19} color="var(--gold-700)" style={{ flex: 'none', width: 22 }} />
      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.35 }}>{text}</span>
      <span
        className="wn-tnum"
        style={{
          flex: 'none', display: 'inline-flex', alignItems: 'baseline', gap: 3, padding: '3px 10px',
          borderRadius: 999, background: 'var(--pergament)', border: '1px solid var(--pergament-edge)',
          fontSize: 13, fontWeight: 800, color: 'var(--navy)',
        }}
      >
        {wp}
        <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gold-700)' }}>WP</span>
      </span>
    </div>
  );
}

function Kachel({ oben, unten, farbe }: { oben: string; unten: string; farbe: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'var(--pergament)', borderRadius: 'var(--r-md)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)' }}>{oben}</div>
      <div className="wn-tnum" style={{ fontSize: 15, fontWeight: 800, color: farbe, marginTop: 2 }}>{unten}</div>
    </div>
  );
}

const erklaerText: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.55, padding: '0 4px',
};

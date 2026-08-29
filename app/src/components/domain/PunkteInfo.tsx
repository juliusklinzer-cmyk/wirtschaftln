'use client';

import { useState } from 'react';
import { PTS, WACKELT_AB_UNENTSCHULDIGT, ABSCHLUSS_SPERRE_STUNDEN, anwesenheitsBonus, entschuldigtMalus, unentschuldigtMalus } from '@/lib/punkte';

/**
 * „Punktesystem", Aufklärung im Urkunden-Stil (Rauten-Band, Fraktur, Gold).
 * Werte und Staffeln kommen aus lib/punkte.ts, damit die Erklärung nie von
 * den echten Regeln abweicht.
 */
export function PunkteInfo() {
  const [offen, setOffen] = useState(false);

  return (
    <>
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

      {offen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, overflowY: 'auto', overscrollBehavior: 'contain', background: 'var(--weiss)', animation: 'wnPunkteRein 240ms ease-out both' }}>
          <style>{`
            @keyframes wnPunkteRein { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes wnPunkteZeile { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}</style>
          <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Kopf: Navy-Zeremonie mit Rauten-Band */}
            <div style={{ position: 'relative', background: 'var(--grad-navy)', overflow: 'hidden' }}>
              <div className="wn-raute wn-raute--sm" style={{ height: 7 }} />
              <button onClick={() => setOffen(false)} aria-label="Schließen" className="wn-press" style={{ position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))', right: 12, width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: 17, fontWeight: 800, cursor: 'pointer', zIndex: 2 }}>
                ×
              </button>
              <div style={{ padding: 'calc(22px + env(safe-area-inset-top)) 20px 18px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 32, color: 'var(--gold-bright)', lineHeight: 1.1 }}>D’Wirtschaftln-Punkte</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pergament)', opacity: 0.85, marginTop: 5 }}>
                  Wer wann WP kriagt, und wann’s weniger werden.
                  <br />
                  Einmal verdient bleibt verdient.
                </div>
              </div>
            </div>
            <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

            <div style={{ flex: 1, width: '100%', maxWidth: 420, margin: '0 auto', padding: '16px 18px 0' }}>
              <div style={{ animation: 'wnPunkteZeile 320ms 80ms ease-out both' }}>
                <Ueberschrift text="So gibt’s Punkte" />
                <Zeile icon="🎟️" text="Beim Stammtisch dabei" wp={`+${PTS.teilnahme}`} />
                <Zeile icon="🍺" text="Pro Hoibe" wp={`+${PTS.hoibe}`} />
                <Zeile icon="🚕" text="Gfahren & Spezln mitgnommen" wp={`+${PTS.taxi}`} />
                <Zeile icon="🍻" text="A Runde gschmissen" wp={`+${PTS.runde}`} />
                <Zeile icon="🗳️" text="Rechtzeitig zu- oder abgsagt (bis 3 Tag vorher)" wp={`+${PTS.abstimmen}`} />
                <Zeile icon="🪑" text="Als Erster im Wirtshaus eingecheckt" wp={`+${PTS.checkin}`} />
                <Zeile icon="📍" text="Wirtshaus vorgschlagen (+1 extra, wenn’s besucht wird)" wp={`+${PTS.vorschlag}`} />
                <Zeile icon="⭐" text="Eigene Bewertung zum Abend abgeben" wp={`+${PTS.bewertung}`} />
                <Zeile icon="✍️" text="… mit am Text ausgschmückt" wp={`+${PTS.bewertungsText}`} />
                <Zeile icon="✅" text={`Als Erster den Abend abgschlossen (ab ${ABSCHLUSS_SPERRE_STUNDEN} Std. nach Beginn)`} wp={`+${PTS.abschluss}`} />
                <Zeile icon="📋" text="Organisiert, je nach Sterne-Schnitt vom Abend" wp={`0–${PTS.orgaMax}`} letzte />
              </div>

              <div style={{ animation: 'wnPunkteZeile 320ms 160ms ease-out both' }}>
                <Ueberschrift text="🔥 D’Serie, dei Bonus" abstand />
                <div style={erklaerText}>
                  Ab dem zweiten Abend in Folge gibt’s je Abend an Extra-Bonus, ohne Deckel, und er bleibt dir <b>für immer</b>. A Riss beendet nur die Serie, nimmt dir aber nix weg.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[2, 3, 5, 10].map((s) => (
                    <Kachel key={s} oben={`${s}. in Folge`} unten={`+${anwesenheitsBonus(s)}`} farbe="var(--erfolg)" />
                  ))}
                </div>
              </div>

              <div style={{ animation: 'wnPunkteZeile 320ms 240ms ease-out both' }}>
                <Ueberschrift text="📅 Absagen, sauber glöst" abstand />
                <div style={erklaerText}>
                  Wer <b>absagt</b>, is entschuldigt. Die erste Absage kost’ nix, dann wird’s in Folge teurer:
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[1, 2, 3, 4].map((n) => (
                    <Kachel
                      key={n}
                      oben={n === 4 ? 'ab 4.' : `${n}.`}
                      unten={entschuldigtMalus(n) === 0 ? '±0' : String(entschuldigtMalus(n))}
                      farbe={entschuldigtMalus(n) === 0 ? 'var(--erfolg)' : 'var(--strafe)'}
                    />
                  ))}
                </div>
              </div>

              <div style={{ animation: 'wnPunkteZeile 320ms 320ms ease-out both' }}>
                <Ueberschrift text="🥶 Unentschuldigt, des werd teuer" abstand />
                <div style={erklaerText}>
                  <b>Koa Stimme und ned da</b> (oder zugsagt und ned kemma) = unentschuldigt:
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[1, 2, 3].map((n) => (
                    <Kachel key={n} oben={n === 3 ? 'ab 3.' : `${n}.`} unten={String(unentschuldigtMalus(n))} farbe="var(--strafe)" />
                  ))}
                </div>
                <div style={{ ...erklaerText, marginTop: 8 }}>
                  ⚠️ Beim {WACKELT_AB_UNENTSCHULDIGT}. unentschuldigten Fehlen in Folge <b>wackelst</b>, und a <b>Strafrunde</b> is fällig (Teilnehmer × Bräustüberl-Hoibe). Wieder dabei sein setzt alles zurück.
                </div>
              </div>

              <div style={{ animation: 'wnPunkteZeile 320ms 380ms ease-out both' }}>
                <Ueberschrift text="So läuft a Abend" abstand />
                <div style={erklaerText}>
                  🙋 <b>D’Orga schnappt sich, wer mag</b> („I regle das!“). Nur wer den letzten Stammtisch organisiert hat, setzt aus.
                  <br />
                  ⭐ <b>Bewertet wird einzeln:</b> Jeder gibt sei eigene Wertung ab (bis 7 Tag nach’m Abschluss), aus allen zusammen wird d’Tages-Wertung. Kaisi & Brodn bewertet nur, wer selber probiert hat.
                  <br />
                  ✅ <b>Abgschlossen</b> wird frühestens {ABSCHLUSS_SPERRE_STUNDEN} Stunden nach Beginn, und nur no d’Logistik (wer da war, Hoibe, Runden).
                  <br />
                  🪑 <b>Einchecken:</b> ab 2 Stund’ vor Beginn auf der Startseite, der Erste sagt, wo ihr hockts.
                </div>
              </div>

              <div style={{ animation: 'wnPunkteZeile 320ms 440ms ease-out both', paddingBottom: 16 }}>
                <Ueberschrift text="Guat zum Wissen" abstand />
                <div style={erklaerText}>
                  💶 Geldstrafen (Strafrunde, zugsagt & ned kemma) laufen über d’Kasse, die kosten <b>Geld, koane WP</b>, und WP kann ma ned zum Zahlen hernehmen.
                  <br />
                  🍺🏠 Hoibe- und Wirtshäuser-Ranglisten sind eigene Wertungen ohne Punkte, zählen tut die <b>Gesamt-Wertung (WP)</b>.
                  <br />
                  📅 <b>Saison</b> zählt ab 1.7. bzw. 1.1., d’Serie läuft immer über die ganze Chronik weiter.
                  <br />
                  📜 Nachbewertungen von alte Wirtshäuser bringen <b>koane</b> Punkte, nur Ruhm in der Sterne-Wertung.
                </div>
              </div>
            </div>

            {/* Rauten-Band als Abschluss der Urkunde */}
            <div className="wn-raute wn-raute--sm" style={{ height: 7, marginBottom: 'env(safe-area-inset-bottom)' }} />
          </div>
        </div>
      )}
    </>
  );
}

function Ueberschrift({ text, abstand = false }: { text: string; abstand?: boolean }) {
  return (
    <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: 20, color: 'var(--navy)', marginTop: abstand ? 18 : 0, marginBottom: 8, lineHeight: 1.1 }}>
      {text}
    </div>
  );
}

function Zeile({ icon, text, wp, letzte = false }: { icon: string; text: string; wp: string; letzte?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: letzte ? 'none' : '1px solid var(--ink-100)' }}>
      <span style={{ flex: 'none', fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.4 }}>{text}</span>
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
  fontSize: 13, fontWeight: 500, color: 'var(--ink-700)', lineHeight: 1.55,
};

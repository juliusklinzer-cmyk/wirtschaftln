'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { KlappenKopf } from '@/components/ds';
import { PTS } from '@/lib/punkte';
import type { BewertungErgebnis } from '@/app/(app)/termin/actions';

export type MeiBewertungWerte = {
  sterne: number | null;
  kommentar: string;
  kaisiProbiert: boolean;
  kaiserSterne: number | null;
  kaiserNotiz: string;
  brodnGessen: boolean;
  brodnSterne: number | null;
  brodnNotiz: string;
};

const dez = (n: number) => n.toFixed(1).replace('.', ',');

/**
 * „Mei Bewertung": jeder Spezl bewertet den Abend für sich, alle Einzel-
 * Bewertungen ergeben zusammen die Tages-Wertung (Kaisi/Brodn nur von denen,
 * die probiert haben; die Freitexte landen alle im Archiv). Klappe schließt
 * sich nach dem Speichern und meldet die verdienten WP.
 *
 * Varianten: 'karte' = eigenständige weiße Klappe (Termin-Seite).
 * 'eingebettet' = lebt in der „So is' glaufen"-Karte auf der Startseite:
 * ohne Bewertung ein goldener „Abend bewerten"-Knopf, mit Bewertung die
 * eigene Wertung samt Team-Schnitt und „Ändern".
 */
export function MeiBewertung({
  wirtshausName,
  initial,
  team,
  action,
  variante = 'karte',
}: {
  wirtshausName: string | null;
  initial: MeiBewertungWerte;
  /** Bisheriger Team-Schnitt (alle abgegebenen Sterne), zeigt, wo der Abend steht. */
  team: { schnitt: number; anzahl: number };
  action: (formData: FormData) => Promise<BewertungErgebnis>;
  variante?: 'karte' | 'eingebettet';
}) {
  const [offen, setOffen] = useState(false);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [sterne, setSterne] = useState(initial.sterne ?? 3);
  const [kommentar, setKommentar] = useState(initial.kommentar);
  const [kaisi, setKaisi] = useState(initial.kaisiProbiert);
  const [kaiserSterne, setKaiserSterne] = useState(initial.kaiserSterne ?? 3);
  const [kaiserNotiz, setKaiserNotiz] = useState(initial.kaiserNotiz);
  const [brodn, setBrodn] = useState(initial.brodnGessen);
  const [brodnSterne, setBrodnSterne] = useState(initial.brodnSterne ?? 3);
  const [brodnNotiz, setBrodnNotiz] = useState(initial.brodnNotiz);

  const schonBewertet = initial.sterne != null;
  const eingebettet = variante === 'eingebettet';

  const speichern = async (formData: FormData) => {
    const ergebnis = await action(formData);
    if (!ergebnis.ok) {
      setMeldung({ ok: false, text: ergebnis.meldung });
      return;
    }
    const wp = (ergebnis.neuBewertet ? PTS.bewertung : 0) + (ergebnis.neuerText ? PTS.bewertungsText : 0);
    setMeldung({
      ok: true,
      text: wp > 0 ? `Bewertung gspeichert: +${wp} WP. Vergelt’s Gott!` : '✓ Bewertung aktualisiert. Vergelt’s Gott!',
    });
    setOffen(false);
  };

  return (
    <div>
      <details
        open={offen}
        onToggle={(e) => {
          setOffen((e.currentTarget as HTMLDetailsElement).open);
          if ((e.currentTarget as HTMLDetailsElement).open) setMeldung(null);
        }}
        style={
          eingebettet
            ? undefined
            : {
                background: 'var(--weiss)', border: '1px solid var(--ink-100)',
                borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
              }
        }
      >
        {eingebettet && !schonBewertet ? (
          /* No net bewertet: klarer goldener Handlungs-Knopf */
          <summary
            className="wn-press"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 46, padding: '0 16px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              listStyle: 'none', userSelect: 'none', background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)',
              fontSize: 14, fontWeight: 800, color: 'var(--navy-900)',
            }}
          >
            Abend bewerten
            <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'rgba(7,25,58,0.14)' }}>
              +{PTS.bewertung} WP
            </span>
          </summary>
        ) : eingebettet ? (
          /* Scho bewertet: eigene Wertung + Team-Schnitt, antippen zum Ändern */
          <summary
            style={{
              display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '10px 12px',
              borderRadius: 'var(--r-md)', cursor: 'pointer', listStyle: 'none', userSelect: 'none',
              background: 'var(--pergament)',
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                Dei Wertung
              </span>
              <span className="wn-tnum" style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>
                {dez(initial.sterne ?? 0)} <span style={{ color: 'var(--gold)' }}>★</span>
                {team.anzahl > 1 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>
                    {' '}· Team Ø {dez(team.schnitt)}
                  </span>
                )}
              </span>
            </span>
            <span style={{ flex: 'none', fontSize: 12, fontWeight: 800, color: 'var(--muc-blau)' }}>Ändern</span>
          </summary>
        ) : (
          /* Karten-Variante (Termin-Seite): Klappen-Kopf mit Status-Chip */
          <KlappenKopf
            chip={
              <span
                className="wn-tnum"
                style={{
                  flex: 'none', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                  background: schonBewertet ? 'var(--erfolg-bg)' : 'var(--grad-gold)',
                  color: schonBewertet ? 'var(--erfolg)' : 'var(--navy-900)',
                }}
              >
                {schonBewertet ? `${dez(initial.sterne ?? 0)} ★` : `+${PTS.bewertung} WP`}
              </span>
            }
          >
            Mei Bewertung{wirtshausName ? ` · ${wirtshausName}` : ''}
          </KlappenKopf>
        )}

        <div style={{ padding: eingebettet ? '12px 0 0' : '4px 18px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 12 }}>
            Jeder bewertet für sich, aus allen Bewertungen wird d’Tages-Wertung.
            Dei Bewertung bringt <b>+{PTS.bewertung} WP</b>. A Text dazu hilft der Chronik, Punkte gibt’s dafür koane extra.
            {team.anzahl > 0 && (
              <>
                {' '}Team bisher: <b className="wn-tnum">Ø {dez(team.schnitt)} ★</b>
                {' '}({team.anzahl} {team.anzahl === 1 ? 'Bewertung' : 'Bewertungen'}).
              </>
            )}
          </div>

          <form action={speichern} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <input type="hidden" name="sterne" value={String(sterne)} />
            {kaisi && <input type="hidden" name="kaisiProbiert" value="on" />}
            {kaisi && <input type="hidden" name="kaiserSterne" value={String(kaiserSterne)} />}
            {brodn && <input type="hidden" name="brodnGessen" value="on" />}
            {brodn && <input type="hidden" name="brodnSterne" value={String(brodnSterne)} />}

            <div style={{ marginBottom: 14 }}>
              <SterneStepper value={sterne} onChange={setSterne} />
            </div>
            <textarea
              name="kommentar" value={kommentar} onChange={(e) => setKommentar(e.target.value)} rows={3}
              placeholder="Wie war’s? Bedienung, Bier, Brotzeit…" style={textareaStyle}
            />

            {/* Kaiserschmarrn: nur bewerten, wer selber probiert hat */}
            <div style={{ marginTop: 14, border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <ProbiertKopf
                icon="🥞" titel="Kaiserschmarrn probiert?" an={kaisi} onToggle={() => setKaisi(!kaisi)}
                untertitel={kaisi ? 'Dei Kaisi-Wertung zählt in d’Kaisi-Rangliste.' : 'Mitgessen? Antippen und bewerten.'}
              />
              {kaisi && (
                <div style={{ padding: '12px 14px 14px', borderTop: '1px solid var(--pergament-edge)', background: 'var(--pergament)' }}>
                  <SterneStepper value={kaiserSterne} onChange={setKaiserSterne} />
                  <textarea
                    name="kaiserNotiz" value={kaiserNotiz} onChange={(e) => setKaiserNotiz(e.target.value)} rows={2}
                    placeholder="Fluffig? Z’wenig Rosinen? Erzähl…" style={{ ...textareaStyle, marginTop: 12 }}
                  />
                </div>
              )}
            </div>

            {/* Brodn: nur bewerten, wer selber einen gessen hat */}
            <div style={{ marginTop: 10, border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <ProbiertKopf
                icon="🍖" titel="Brodn gessen?" an={brodn} onToggle={() => setBrodn(!brodn)}
                untertitel={brodn ? 'Dei Brodn-Wertung zählt in d’Brodn-Rangliste.' : 'An Schweinsbraten ghabt? Antippen und bewerten.'}
              />
              {brodn && (
                <div style={{ padding: '12px 14px 14px', borderTop: '1px solid var(--pergament-edge)', background: 'var(--pergament)' }}>
                  <SterneStepper value={brodnSterne} onChange={setBrodnSterne} />
                  <textarea
                    name="brodnNotiz" value={brodnNotiz} onChange={(e) => setBrodnNotiz(e.target.value)} rows={2}
                    placeholder="Knusprig? Soß’n a Gedicht? Erzähl…" style={{ ...textareaStyle, marginTop: 12 }}
                  />
                </div>
              )}
            </div>

            <SpeichernKnopf schonBewertet={schonBewertet} />
          </form>
        </div>
      </details>

      {meldung && (!offen || !meldung.ok) && (
        <div
          className="wn-toast-in"
          style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center',
            background: meldung.ok ? 'var(--erfolg-bg)' : 'var(--strafe-bg)',
            border: `1px solid ${meldung.ok ? 'var(--erfolg)' : 'var(--strafe)'}`,
            fontSize: 13, fontWeight: 800, color: meldung.ok ? 'var(--erfolg)' : 'var(--strafe)',
          }}
        >
          {meldung.text}
        </div>
      )}
    </div>
  );
}

/** Speichern mit Pending-Zustand, damit der Knopf spürbar reagiert. */
function SpeichernKnopf({ schonBewertet }: { schonBewertet: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="wn-press"
      style={{
        marginTop: 16, width: '100%', minHeight: 48, border: 'none', borderRadius: 'var(--r-md)',
        background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)', cursor: pending ? 'default' : 'pointer',
        fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, color: 'var(--navy-900)',
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? 'Speichert…' : schonBewertet ? 'Bewertung aktualisieren' : 'Bewertung abgeben'}
    </button>
  );
}

/** Aufklappbarer Kopf „hab i probiert" (wie der Kaisi-Toggle im Abschluss-Zettel). */
function ProbiertKopf({
  icon, titel, untertitel, an, onToggle,
}: {
  icon: string; titel: string; untertitel: string; an: boolean; onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', background: an ? 'var(--pergament)' : 'var(--weiss)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
      <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 'var(--r-md)', background: an ? 'var(--grad-gold)' : 'var(--pergament)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{titel}</span>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--ink-500)' }}>{untertitel}</span>
      </span>
      <span style={{ fontSize: 18, color: an ? 'var(--gold-700)' : 'var(--ink-200)', fontWeight: 800 }}>{an ? '✓' : '+'}</span>
    </button>
  );
}

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--ink-200)', borderRadius: 'var(--r-md)',
  padding: 12, fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink-900)', resize: 'none', outline: 'none',
  background: 'var(--weiss)',
};

/** ± Stepper für eine Bewertung mit einer Kommastelle, startet bei 3,0 (Design: StarStepper). */
function SterneStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(0, Math.min(5, Math.round(v * 10) / 10));
  const btn: React.CSSProperties = {
    width: 44, height: 44, flex: 'none', borderRadius: '50%', border: '1.5px solid var(--ink-200)',
    background: 'var(--weiss)', cursor: 'pointer', fontSize: 22, fontWeight: 800, color: 'var(--navy)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <button type="button" className="wn-press" onClick={() => onChange(clamp(value - 0.1))} aria-label="Weniger" style={btn}>−</button>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 96, justifyContent: 'center' }}>
        <span className="wn-tnum" style={{ fontSize: 34, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>
          {value.toFixed(1).replace('.', ',')}
        </span>
        <span style={{ fontSize: 24, color: 'var(--gold)' }}>★</span>
      </div>
      <button type="button" className="wn-press" onClick={() => onChange(clamp(value + 0.1))} aria-label="Mehr" style={btn}>+</button>
    </div>
  );
}

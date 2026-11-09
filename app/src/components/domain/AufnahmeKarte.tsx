'use client';

import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Handshake } from '@phosphor-icons/react/dist/ssr/Handshake';

export type AufnahmeZeile = { id: string; name: string; seit: string; buergeName: string | null; ichBuerge: boolean };
type Entscheidung = 'buergen' | 'kenneNicht' | 'aufnehmen' | 'ablehnen';

/**
 * Aufnahme auf Dahoam (WIR-013): wer neu rein will und wer für ihn bürgt.
 * Der Bürge bürgt oder kennt ihn nicht; Präsident und Admin dürfen immer
 * aufnehmen oder ablehnen.
 */
export function AufnahmeKarte({ antraege, entscheider, entscheiden }: { antraege: AufnahmeZeile[]; entscheider: boolean; entscheiden: (id: string, e: Entscheidung) => Promise<{ ok: boolean }> }) {
  const [sicher, setSicher] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);

  const los = async (a: AufnahmeZeile, e: Entscheidung) => {
    setLaeuft(true);
    const r = await entscheiden(a.id, e);
    setLaeuft(false);
    setSicher(null);
    const text = !r.ok
      ? 'Hat nicht geklappt, probier’s nochmal.'
      : e === 'ablehnen'
        ? `${a.name} ist nicht aufgenommen.`
        : e === 'kenneNicht'
          ? 'Passt, jetzt entscheidet der Präsident.'
          : `${a.name} ist dabei, servus in der Runde!`;
    setMeldung({ ok: r.ok, text });
  };

  const knopf = (farbe: 'gold' | 'navy' | 'hell' | 'rot'): React.CSSProperties => ({
    flex: 1, minHeight: 44, borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-ui)',
    border: farbe === 'hell' ? '1.5px solid var(--ink-200)' : 'none',
    background: farbe === 'gold' ? 'var(--grad-gold)' : farbe === 'navy' ? 'var(--navy)' : farbe === 'rot' ? 'var(--strafe)' : 'var(--weiss)',
    color: farbe === 'hell' ? 'var(--navy)' : farbe === 'gold' ? 'var(--navy-900)' : '#fff',
    opacity: laeuft ? 0.6 : 1,
  });

  // Bleibt gemountet, auch wenn der letzte Antrag weg is: sonst verschwindet die Erfolgsmeldung mit
  if (antraege.length === 0 && !meldung) return null;
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {antraege.length > 0 && (
        <div style={{ background: 'var(--weiss)', border: '1.5px solid var(--gold)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Handshake size={22} weight="fill" color="var(--gold-700)" />
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink-900)' }}>{antraege.length === 1 ? 'Einer will rein' : `${antraege.length} wollen rein`}</span>
          </div>
          {antraege.map((a) => (
            <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--ink-50)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{a.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink-500)' }}>
                  {a.ichBuerge ? 'Hat dich als Bürgen genannt und den Kodex bestätigt. Bürgst du?' : a.buergeName ? `Bürge: ${a.buergeName}, wartet noch auf die Zusage` : 'Der Bürge kennt den Neuen nicht, du entscheidest'}
                </span>
              </div>
              {sicher === a.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5 }}>{a.name} wirklich ablehnen? Der Antrag verschwindet, mit dem Code geht’s später nochmal.</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" disabled={laeuft} onClick={() => void los(a, 'ablehnen')} style={knopf('rot')}>Ja, ablehnen</button>
                    <button type="button" disabled={laeuft} onClick={() => setSicher(null)} style={knopf('hell')}>Abbrechen</button>
                  </div>
                </div>
              ) : a.ichBuerge ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" disabled={laeuft} onClick={() => void los(a, 'kenneNicht')} style={knopf('hell')}>Kenn ich nicht</button>
                  <button type="button" disabled={laeuft} onClick={() => void los(a, 'buergen')} style={knopf('gold')}>Ich bürge</button>
                </div>
              ) : entscheider ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" disabled={laeuft} onClick={() => { setMeldung(null); setSicher(a.id); }} style={knopf('hell')}>Ablehnen</button>
                  <button type="button" disabled={laeuft} onClick={() => void los(a, 'aufnehmen')} style={knopf('navy')}>Aufnehmen</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {meldung && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: meldung.ok ? 'var(--erfolg-bg)' : 'var(--strafe-bg)' }}>
          <CheckCircle size={22} weight="fill" color={meldung.ok ? 'var(--erfolg)' : 'var(--strafe)'} />
          <span style={{ fontSize: 14, fontWeight: 800, color: meldung.ok ? 'var(--erfolg)' : 'var(--strafe)' }}>{meldung.text}</span>
        </div>
      )}
    </section>
  );
}

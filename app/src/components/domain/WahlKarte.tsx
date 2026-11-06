'use client';

import { useState, useTransition } from 'react';
import { Avatar } from '@/components/ds';
import { praesidentWaehlen } from '@/app/(app)/praesident/actions';

export type WahlKandidat = { id: string; name: string; photoUrl: string | null; verein: string | null };

const vorname = (name: string) => { const [a, ...r] = name.split(' '); return a.length <= 3 && r.length > 0 ? name : a; };

/**
 * Präsidentenwahl auf Hoam (06.11.2026): Pergament-Karte wia die Umfrage. Bis
 * zur eigenen Stimme die Gesichter zum Antippen, danach „Deine Stimme: …“ mit
 * Ändern. Wer wen gewählt hat und der Zwischenstand bleiben geheim bis zum Schluss.
 */
export function WahlKarte({
  wahlId,
  jahr,
  bisText,
  kandidaten,
  meineStimme,
  abgestimmt,
  gesamt,
  stichwahl = false,
}: {
  wahlId: string;
  jahr: number;
  /** „bis Freitag, 13. November“ */
  bisText: string;
  kandidaten: WahlKandidat[];
  meineStimme: string | null;
  /** So viele haben scho gewählt */
  abgestimmt: number;
  gesamt: number;
  /** Gleichstand vorn: nur no die Gleichplatzierten stehen zur Wahl */
  stichwahl?: boolean;
}) {
  const [wahl, setWahl] = useState<string | null>(meineStimme);
  const [aendern, setAendern] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const gewaehlt = kandidaten.find((k) => k.id === wahl) ?? null;
  const zeigeAuswahl = !meineStimme || aendern;

  const abgeben = () => {
    if (!wahl) return;
    startTransition(async () => {
      const r = await praesidentWaehlen(wahlId, wahl);
      setMeldung(r.meldung);
      if (r.ok) setAendern(false);
    });
  };

  return (
    <div style={{ background: 'var(--pergament)', borderRadius: 'var(--r-lg)', padding: 18, border: '1.5px solid var(--gold)', boxShadow: '0 6px 18px rgba(166,132,62,0.22)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-700)' }}>
          Offen {bisText} · {abgestimmt} von {gesamt} haben gewählt
        </span>
        {!meineStimme && (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--grad-gold)', color: 'var(--navy-900)', whiteSpace: 'nowrap', flex: 'none' }}>
            Deine Stimme fehlt
          </span>
        )}
      </div>
      <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1.05, color: 'var(--navy)' }}>{stichwahl ? `Stichwahl um Präsident ${jahr}` : `Wer wird Präsident ${jahr}?`}</span>
      <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>
        {stichwahl
          ? 'Gleichstand vorn! Jetzt geht’s nur no zwischen denen, jeder stimmt nochmal ab. Steht’s wieder gleich, entscheiden die WP im Jahr.'
          : 'Geheime Wahl, jeder hat oa Stimme. Der mit den meisten Stimmen is Präsident. Bei Gleichstand gibt’s a Stichwahl.'}
      </span>

      {zeigeAuswahl ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '12px 6px' }}>
            {kandidaten.map((k) => {
              const an = k.id === wahl;
              return (
                <button key={k.id} type="button" onClick={() => setWahl(k.id)} aria-pressed={an} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)', minWidth: 0 }}>
                  <span style={{ display: 'inline-flex', borderRadius: '50%', boxShadow: an ? '0 0 0 3px var(--gold-700)' : 'none', transition: 'box-shadow 120ms' }}>
                    <Avatar src={k.photoUrl} name={k.name} size={48} verein={k.verein} />
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: an ? 'var(--gold-700)' : 'var(--ink-700)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vorname(k.name)}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={abgeben}
            disabled={!wahl || pending}
            className="wn-press"
            style={{ height: 50, borderRadius: 14, border: 'none', background: 'var(--navy)', color: 'var(--pergament)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: wahl ? 'pointer' : 'default', opacity: wahl && !pending ? 1 : 0.55 }}
          >
            {pending ? 'Wird gezählt …' : gewaehlt ? `${vorname(gewaehlt.name)} wählen` : 'Antippen, wen du wählst'}
          </button>
          {aendern && (
            <button type="button" onClick={() => { setAendern(false); setWahl(meineStimme); }} style={{ alignSelf: 'center', border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer' }}>
              Doch ned ändern
            </button>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14, background: 'var(--weiss)', border: '1px solid var(--pergament-edge)' }}>
          {gewaehlt && <Avatar src={gewaehlt.photoUrl} name={gewaehlt.name} size={36} verein={gewaehlt.verein} />}
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)' }}>Deine Stimme</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>{gewaehlt?.name ?? '–'}</span>
          </span>
          <button type="button" onClick={() => { setAendern(true); setMeldung(null); }} style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer', flex: 'none' }}>
            Ändern
          </button>
        </div>
      )}
      {meldung && <span style={{ fontSize: 12, fontWeight: 700, color: meldung.startsWith('✓') ? 'var(--erfolg)' : 'var(--strafe)' }}>{meldung}</span>}
    </div>
  );
}

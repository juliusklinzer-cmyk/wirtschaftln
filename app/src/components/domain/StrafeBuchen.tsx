'use client';

import { useState, useTransition } from 'react';
import { Avatar } from '@/components/ds';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { feldLabelStil } from '@/components/domain/hero-stil';

export type StrafSpezl = { id: string; name: string; photoUrl: string | null; verein: string | null };
/** Eigene Strafe aus dem Katalog, `folge` fertig formuliert („5 €“, „2 WP“) */
export type StrafWahl = { id: string; name: string; folge: string; detail: string | null };
export type StrafAntwort = { ok: boolean; meldung: string };

const vorname = (name: string) => { const [a, ...r] = name.split(' '); return a.length <= 3 && r.length > 0 ? name : a; };

/**
 * Strafe buchen (Strafenkatalog, 04.11.2026): Wer? → Welche Strafe? → Buchen.
 * Gleich in der Kasse und auf dem Zettel „Wer war da“. Nach dem Buchen
 * bleibt das Formular offen, damit man gleich die nächste buchen kann.
 */
export function StrafeBuchen({
  mitglieder,
  regeln,
  terminId,
  buchen,
  onGebucht,
}: {
  mitglieder: StrafSpezl[];
  regeln: StrafWahl[];
  terminId?: string;
  buchen: (formData: FormData) => Promise<StrafAntwort>;
  onGebucht?: (meldung: string) => void;
}) {
  const [wer, setWer] = useState<string | null>(null);
  const [regel, setRegel] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const gueltig = !!wer && !!regel;
  const werName = mitglieder.find((m) => m.id === wer)?.name;

  const los = () => {
    if (!gueltig) return;
    const fd = new FormData();
    fd.set('memberId', wer!);
    fd.set('regelId', regel!);
    if (terminId) fd.set('terminId', terminId);
    setFehler(null);
    startTransition(async () => {
      const r = await buchen(fd);
      if (!r.ok) return setFehler(r.meldung);
      setRegel(null);
      setWer(null);
      onGebucht?.(r.meldung);
    });
  };

  if (regeln.length === 0) {
    return <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)' }}>Noch keine eigenen Strafen im Katalog. Die legen Präsident oder Admin in der Kasse an.</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ ...feldLabelStil, padding: '0 4px' }}>Wer?</span>
        <div className="wn-scroll-still" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 4px 2px' }}>
          {mitglieder.map((m) => {
            const an = m.id === wer;
            return (
              <button key={m.id} type="button" onClick={() => setWer(m.id)} aria-pressed={an} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none', border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                <span style={{ display: 'inline-flex', borderRadius: '50%', boxShadow: an ? '0 0 0 3px var(--strafe)' : 'none', transition: 'box-shadow 120ms' }}>
                  <Avatar src={m.photoUrl} name={m.name} size={44} verein={m.verein} />
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: an ? 'var(--strafe)' : 'var(--ink-500)', whiteSpace: 'nowrap' }}>{vorname(m.name)}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ ...feldLabelStil, padding: '0 4px' }}>Welche Strafe?</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {regeln.map((r) => {
            const an = r.id === regel;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegel(r.id)}
                aria-pressed={an}
                className="wn-press"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', background: an ? 'var(--strafe-bg)' : 'var(--weiss)', border: an ? '1.5px solid var(--strafe)' : '1px solid var(--ink-100)' }}
              >
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{r.name}</span>
                  {r.detail && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.detail}</span>}
                </span>
                <span className="wn-tnum" style={{ fontSize: 13, fontWeight: 800, color: 'var(--strafe)', flex: 'none' }}>{r.folge}</span>
              </button>
            );
          })}
        </div>
      </div>
      {fehler && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--strafe)' }}>{fehler}</span>}
      <button type="button" onClick={los} disabled={!gueltig || pending} className="wn-press" style={{ height: 52, borderRadius: 14, border: 'none', background: 'var(--strafe)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 800, cursor: gueltig ? 'pointer' : 'default', opacity: gueltig && !pending ? 1 : 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Gavel size={22} weight="fill" />
        {pending ? 'Wird gebucht …' : werName ? `${vorname(werName)} bestrafen` : 'Spezl und Strafe wählen'}
      </button>
    </div>
  );
}

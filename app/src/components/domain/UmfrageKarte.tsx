'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ds';
import { anzeigeName } from '@/lib/namen';
import { umfrageAbstimmen, umfrageLoeschen } from '@/app/(app)/umfragen/actions';
import type { getUmfragen } from '@/lib/queries';

type UmfrageDaten = ReturnType<typeof getUmfragen>[number];

/**
 * Eine Umfrage auf Hoam (Zustände 3d/3e): vor der eigenen Stimme die
 * Pergament-Karte mit Gold-Rahmen und nur den Antworten (damit niemand
 * beeinflusst wird). Danach die weiße Karte mit Ergebnis-Balken, die eigene
 * Wahl in Gold, „Stimme ändern“ zeigt die Antworten wieder.
 */
export function UmfrageKarte({ daten, meId, meRole }: { daten: UmfrageDaten; meId: string; meRole: string }) {
  const { umfrage, ersteller, stimmen } = daten;
  const meineStimme = stimmen.find((s) => s.memberId === meId)?.antwortIndex ?? null;
  const abgestimmt = meineStimme !== null;
  const counts = umfrage.antworten.map((_, i) => stimmen.filter((s) => s.antwortIndex === i).length);
  const total = stimmen.length;
  const darfLoeschen = umfrage.erstelltVon === meId || meRole === 'admin';
  const [aendern, setAendern] = useState(false);
  useEffect(() => setAendern(false), [meineStimme]);

  const stimmenText = (n: number) => `${n} ${n === 1 ? 'Stimme' : 'Stimmen'}`;
  const loeschKnopf = darfLoeschen && (
    <form action={umfrageLoeschen} style={{ flex: 'none', display: 'inline-flex' }}>
      <input type="hidden" name="umfrageId" value={umfrage.id} />
      <button
        type="submit"
        aria-label="Umfrage löschen"
        title="Umfrage löschen"
        style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(7,25,58,0.06)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
      >
        <Icon name="x" size={13} />
      </button>
    </form>
  );

  if (!abgestimmt || aendern) {
    // Zwei kurze Antworten nebeneinander, sonst untereinander
    const zweispaltig = umfrage.antworten.length === 2 && umfrage.antworten.every((a) => a.length <= 14);
    return (
      <div style={{ background: 'var(--pergament)', borderRadius: 'var(--r-lg)', padding: 18, border: '1.5px solid var(--gold)', boxShadow: '0 6px 18px rgba(166,132,62,0.22)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-700)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            von {ersteller ? anzeigeName(ersteller) : '—'} · {stimmenText(total)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: 'none' }}>
            {aendern ? (
              <button type="button" onClick={() => setAendern(false)} style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer' }}>
                Doch ned
              </button>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: 'var(--grad-gold)', color: 'var(--navy-900)', whiteSpace: 'nowrap' }}>
                Deine Stimme fehlt
              </span>
            )}
            {loeschKnopf}
          </span>
        </div>
        <span style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25, color: 'var(--navy)' }}>{umfrage.frage}</span>
        <form action={umfrageAbstimmen} style={{ display: 'grid', gridTemplateColumns: zweispaltig ? '1fr 1fr' : '1fr', gap: 8 }}>
          <input type="hidden" name="umfrageId" value={umfrage.id} />
          {umfrage.antworten.map((antwort, i) => (
            <button
              key={i}
              type="submit"
              name="antwortIndex"
              value={i}
              className="wn-press"
              style={{
                minHeight: 46, padding: '0 12px', borderRadius: 'var(--r-md)', background: 'var(--weiss)',
                border: `1.5px solid ${meineStimme === i ? 'var(--gold)' : 'var(--pergament-edge)'}`,
                color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                textAlign: zweispaltig ? 'center' : 'left',
              }}
            >
              {antwort}
            </button>
          ))}
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', padding: 18, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 800, color: 'var(--ink-900)', lineHeight: 1.3 }}>{umfrage.frage}</span>
        {loeschKnopf}
      </div>
      {umfrage.antworten.map((antwort, i) => {
        const meine = meineStimme === i;
        const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
              <span style={{ minWidth: 0 }}>
                {antwort}
                {meine && <span style={{ color: 'var(--gold-700)' }}> · deine Wahl</span>}
              </span>
              <span className="wn-tnum" style={{ flex: 'none', color: 'var(--ink-500)' }}>{stimmenText(counts[i])}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'var(--ink-100)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%', borderRadius: 999, background: meine ? 'var(--gold)' : 'var(--muc-blau)',
                  // scaleX statt width: läuft auf der GPU, koa Layout-Arbeit
                  transformOrigin: 'left', transform: `scaleX(${pct / 100})`, width: '100%',
                  transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
          </div>
        );
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <button type="button" onClick={() => setAendern(true)} style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer' }}>
          Stimme ändern
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
          von {ersteller ? anzeigeName(ersteller) : '—'} · {stimmenText(total)}
        </span>
      </div>
    </div>
  );
}

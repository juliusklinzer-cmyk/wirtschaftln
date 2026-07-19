import { Card } from '@/components/ds';
import { anzeigeName } from '@/lib/namen';
import { datumKurz } from '@/lib/format';
import { umfrageAbstimmen, umfrageLoeschen } from '@/app/(app)/umfragen/actions';
import type { getUmfragen } from '@/lib/queries';

type UmfrageDaten = ReturnType<typeof getUmfragen>[number];

/**
 * Eine Umfrage auf Hoam: vor der eigenen Stimme nur die Antworten (damit
 * niemand beeinflusst wird), danach die Balken mit Ergebnis — die eigene
 * Antwort lässt sich durch Antippen einer anderen jederzeit ändern.
 */
export function UmfrageKarte({ daten, meId, meRole }: { daten: UmfrageDaten; meId: string; meRole: string }) {
  const { umfrage, ersteller, stimmen } = daten;
  const meineStimme = stimmen.find((s) => s.memberId === meId)?.antwortIndex ?? null;
  const abgestimmt = meineStimme !== null;
  const counts = umfrage.antworten.map((_, i) => stimmen.filter((s) => s.antwortIndex === i).length);
  const total = stimmen.length;
  const darfLoeschen = umfrage.erstelltVon === meId || meRole === 'admin';

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="wn-eyebrow" style={{ color: 'var(--gold-700)' }}>
            🗳️ Umfrage · von {ersteller ? (anzeigeName(ersteller)) : '—'} · {datumKurz(umfrage.createdAt.slice(0, 10))}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink-900)', marginTop: 6, lineHeight: 1.35 }}>
            {umfrage.frage}
          </div>
        </div>
        {darfLoeschen && (
          <form action={umfrageLoeschen} style={{ flex: 'none' }}>
            <input type="hidden" name="umfrageId" value={umfrage.id} />
            <button
              type="submit"
              aria-label="Umfrage löschen"
              title="Umfrage löschen"
              style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(7,25,58,0.06)', color: 'var(--ink-500)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              ✕
            </button>
          </form>
        )}
      </div>

      <form action={umfrageAbstimmen} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        <input type="hidden" name="umfrageId" value={umfrage.id} />
        {umfrage.antworten.map((antwort, i) => {
          const meine = meineStimme === i;
          const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
          return (
            <button
              key={i}
              type="submit"
              name="antwortIndex"
              value={i}
              style={{
                position: 'relative', overflow: 'hidden', textAlign: 'left', cursor: 'pointer',
                padding: '11px 12px', borderRadius: 'var(--r-md)',
                border: meine ? '1.5px solid var(--gold)' : '1.5px solid var(--ink-200)',
                background: 'var(--weiss)',
                fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: meine ? 800 : 600, color: 'var(--ink-900)',
              }}
            >
              {/* Ergebnis-Balken erst, wenn man selber abgstimmt hat */}
              {abgestimmt && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute', inset: 0, width: `${pct}%`,
                    background: meine ? 'rgba(208,173,102,0.28)' : 'var(--pergament)',
                    transition: 'width 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              )}
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0 }}>{meine ? '✓ ' : ''}{antwort}</span>
                {abgestimmt && (
                  <span className="wn-tnum" style={{ flex: 'none', fontSize: 12, fontWeight: 800, color: 'var(--ink-500)' }}>
                    {counts[i]} · {pct} %
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </form>

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginTop: 10 }}>
        {abgestimmt
          ? `${total} ${total === 1 ? 'Stimme' : 'Stimmen'} · zum Ändern andere Antwort antippen`
          : total > 0
            ? `${total} ${total === 1 ? 'Spezl hat' : 'Spezln haben'} scho abgstimmt — Ergebnis siehst nach deiner Stimme`
            : 'No koa Stimme — sei der Erste!'}
      </div>
    </Card>
  );
}

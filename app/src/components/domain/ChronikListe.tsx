'use client';

import { useState } from 'react';
import { Card, Badge, Icon } from '@/components/ds';
import { DetailModal, type ArchivEintrag } from '@/components/domain/ArchivScreen';

/**
 * Chronik auf der Termin-Seite: Antippen öffnet dasselbe Wirtshaus-Detail
 * wie im Archiv (Bewertungs-Kacheln, wer dabei war, Hinweise, Nachbewertung).
 */
export function ChronikListe({ eintraege }: { eintraege: ArchivEintrag[] }) {
  const [detail, setDetail] = useState<ArchivEintrag | null>(null);

  return (
    <>
      <Card pad={12}>
        {eintraege.map((e, i) => (
          <div
            key={`${e.id}-${e.besuchtAm}`}
            onClick={() => setDetail(e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 8px',
              borderBottom: i < eintraege.length - 1 ? '1px solid var(--ink-100)' : 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ color: 'var(--gold-700)', display: 'inline-flex' }}>
              <Icon name="pin" size={17} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{e.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
                {e.bezirk ?? '—'} · {e.besuchtAm}
              </div>
            </div>
            {e.rating > 0 && (
              <Badge tone="gold">
                ★ {e.rating.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </Badge>
            )}
            <span style={{ color: 'var(--ink-300)', display: 'inline-flex' }}>
              <Icon name="chevron" size={16} />
            </span>
          </div>
        ))}
      </Card>
      {detail && <DetailModal e={detail} rank={null} onClose={() => setDetail(null)} />}
    </>
  );
}

'use client';

import { useState } from 'react';
import { Zeile, ZeilenKarte } from '@/components/ds';
import { DetailModal, type ArchivEintrag } from '@/components/domain/ArchivScreen';

/**
 * Chronik auf der Termin-Seite (Redesign 1a): Foto-Kachel, Wirtshaus, Datum,
 * Tages-Wertung. Antippen öffnet dasselbe Wirtshaus-Detail wie im Archiv.
 */
export function ChronikListe({ eintraege }: { eintraege: ArchivEintrag[] }) {
  const [detail, setDetail] = useState<ArchivEintrag | null>(null);

  return (
    <>
      <ZeilenKarte>
        {eintraege.map((e, i) => (
          <Zeile
            key={`${e.id}-${e.besuchtAm}`}
            kachel={
              e.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.photoUrl} alt="" style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: 'repeating-linear-gradient(135deg, var(--ink-100) 0 6px, #DCE3EA 6px 12px)' }} />
              )
            }
            titel={e.name}
            untertitel={e.besuchtAm ?? e.bezirk ?? ''}
            chip={
              e.rating > 0 ? (
                <span className="wn-tnum" style={{ flex: 'none', fontSize: 14, fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                  {e.rating.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span style={{ color: 'var(--gold)' }}>★</span>
                </span>
              ) : null
            }
            onClick={() => setDetail(e)}
            letzte={i === eintraege.length - 1}
          />
        ))}
      </ZeilenKarte>
      {detail && <DetailModal e={detail} rank={null} onClose={() => setDetail(null)} />}
    </>
  );
}

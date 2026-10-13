'use client';

import { useState } from 'react';
import { Chip, Icon, Kachel, Zeile, ZeilenKarte } from '@/components/ds';

/**
 * Bereich „Letzter Abend“ (Redesign 1a): zwei Zeilen, „Dein Deckel“ und
 * „Deine Wertung“, jede klappt ihren Baustein direkt drunter auf, solang
 * das 7-Tage-Fenster nach’m Abschluss offen is.
 */
export function LetzterAbendKarte({
  deckel,
  wertung,
}: {
  deckel: { zeile: string; restTage: number; inhalt: React.ReactNode };
  wertung: { zeile: string; inhalt: React.ReactNode } | null;
}) {
  const [offen, setOffen] = useState<null | 'deckel' | 'wertung'>(null);
  const umschalten = (was: 'deckel' | 'wertung') => setOffen((o) => (o === was ? null : was));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ZeilenKarte>
        <Zeile
          kachel={
            <span style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: '#F4ECDA', border: '2.5px double var(--gold)', color: 'var(--navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="beer" size={17} stroke={2.2} />
            </span>
          }
          titel="Dein Deckel"
          untertitel={deckel.zeile}
          chip={<Chip ton="gold">noch {deckel.restTage} {deckel.restTage === 1 ? 'Tag' : 'Tage'}</Chip>}
          onClick={() => umschalten('deckel')}
          letzte={!wertung}
        />
        {wertung && (
          <Zeile
            kachel={<Kachel ton="gold"><Icon name="star" size={19} /></Kachel>}
            titel="Deine Wertung"
            untertitel={wertung.zeile}
            onClick={() => umschalten('wertung')}
            letzte
          />
        )}
      </ZeilenKarte>
      {offen === 'deckel' && deckel.inhalt}
      {offen === 'wertung' && wertung?.inhalt}
    </div>
  );
}

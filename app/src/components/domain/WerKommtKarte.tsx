'use client';

import { useState } from 'react';
import { Chip, Icon, Kachel, Zeile, ZeilenKarte } from '@/components/ds';

/**
 * „Wer kommt?“ am Stammtisch-Abend (Redesign 1b): eine Zeile, solang die
 * Anmeldung no offen is. Antippen klappt die Abstimmung (und fürs Orga-Team
 * „Anmeldung schließen“) drunter auf.
 */
export function WerKommtKarte({ anzahl, children }: { anzahl: number; children: React.ReactNode }) {
  const [offen, setOffen] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ZeilenKarte>
        <Zeile
          kachel={<Kachel><Icon name="users" size={19} /></Kachel>}
          titel="Wer kommt?"
          untertitel="Anmeldung noch offen"
          chip={<Chip ton="erfolg">{anzahl} dabei</Chip>}
          onClick={() => setOffen((o) => !o)}
          letzte
        />
      </ZeilenKarte>
      {offen && children}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { KlappenKopf } from '@/components/ds';
import { AbschlussForm, type AbschlussWerte, type AbschlussMitglied } from './abschluss-form';

/**
 * Klappe fürs Nachtragen der Abend-Logistik (wer da war, Hoibe, Runden …):
 * schließt sich nach dem Speichern von selbst und bedankt sich. D'Bewertung
 * läuft getrennt über „Mei Bewertung".
 */
export function NachtragKlappe({
  schnapsAn = false,
  titel,
  mitglieder,
  initial,
  action,
}: {
  schnapsAn?: boolean;
  titel: string;
  mitglieder: AbschlussMitglied[];
  initial: AbschlussWerte;
  action: (formData: FormData) => Promise<void>;
}) {
  const [offen, setOffen] = useState(false);
  const [danke, setDanke] = useState<string | null>(null);

  const speichern = async (formData: FormData) => {
    await action(formData);
    setDanke('✓ Gspeichert, vergelt’s Gott!');
    setOffen(false);
  };

  return (
    <div>
      <details
        open={offen}
        onToggle={(e) => {
          setOffen((e.currentTarget as HTMLDetailsElement).open);
          if ((e.currentTarget as HTMLDetailsElement).open) setDanke(null);
        }}
        style={{
          background: 'var(--weiss)', border: '1px solid var(--ink-100)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
        }}
      >
        <KlappenKopf>{titel}</KlappenKopf>
        <div style={{ padding: '4px 18px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 12 }}>
            Hoibe, Runden, wer da war, wenn was fehlt, trag’s nach. Bewertet wird oben bei „Mei Bewertung“.
          </div>
          <AbschlussForm schnapsAn={schnapsAn} mitglieder={mitglieder} action={speichern} initial={initial} submitLabel="Änderungen speichern" />
        </div>
      </details>
      {danke && !offen && (
        <div
          style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center',
            background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)',
            fontSize: 13, fontWeight: 800, color: 'var(--erfolg)',
          }}
        >
          {danke}
        </div>
      )}
    </div>
  );
}

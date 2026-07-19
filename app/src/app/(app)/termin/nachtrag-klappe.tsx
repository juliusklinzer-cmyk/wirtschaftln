'use client';

import { useState } from 'react';
import { PTS } from '@/lib/punkte';
import { AbschlussForm, type AbschlussWerte, type AbschlussMitglied } from './abschluss-form';

/**
 * Klappe fürs Bewerten/Verfeinern des letzten Besuchs: schließt sich nach dem
 * Speichern von selbst und bedankt sich — mit „+1 WP", wenn grad frisch a
 * Bewertungs-Text dazukommen is.
 */
export function NachtragKlappe({
  titel,
  mitglieder,
  initial,
  action,
}: {
  titel: string;
  mitglieder: AbschlussMitglied[];
  initial: AbschlussWerte;
  action: (formData: FormData) => Promise<void>;
}) {
  const [offen, setOffen] = useState(false);
  const [danke, setDanke] = useState<string | null>(null);

  const speichern = async (formData: FormData) => {
    await action(formData);
    const textJetzt = String(formData.get('kommentar') ?? '').trim();
    const textVorher = initial?.kommentar?.trim() ?? '';
    setDanke(
      textJetzt && !textVorher
        ? `✍️ +${PTS.bewertungsText} WP für dei Bewertung — vergelt’s Gott!`
        : '✓ Gspeichert — vergelt’s Gott!',
    );
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
        <summary style={{ padding: '14px 18px', fontSize: 15, fontWeight: 800, color: 'var(--ink-900)', cursor: 'pointer', listStyle: 'none', userSelect: 'none' }}>
          {titel}
        </summary>
        <div style={{ padding: '4px 18px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 12 }}>
            Dei Bewertung mit am Text ausgschmückt gibt <b>+{PTS.bewertungsText} WP</b>.
          </div>
          <AbschlussForm mitglieder={mitglieder} action={speichern} initial={initial} submitLabel="Änderungen speichern" />
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

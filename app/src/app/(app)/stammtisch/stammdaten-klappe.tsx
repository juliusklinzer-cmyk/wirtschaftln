'use client';

import { useState } from 'react';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { StammtischForm, type StammtischWerte } from './stammtisch-form';

/**
 * „Stammdaten bearbeiten“ auf „Unser Stammtisch“ (Präsident und Admin):
 * erst das Profil, mit dem Knopf klappt die Maske auf, nach dem Speichern
 * wieder zu, mit kurzer Erfolgsmeldung.
 */
export function StammdatenKlappe({ werte }: { werte: StammtischWerte }) {
  const [offen, setOffen] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  if (offen) {
    return (
      <div style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <StammtischForm werte={werte} onGespeichert={() => { setOffen(false); setGespeichert(true); }} />
        <button type="button" onClick={() => setOffen(false)} style={{ height: 44, border: 'none', background: 'none', color: 'var(--ink-500)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Abbrechen</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {gespeichert && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 16, background: 'var(--erfolg-bg)' }}>
          <CheckCircle size={22} weight="fill" color="var(--erfolg)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--erfolg)' }}>Gespeichert, vergelt’s Gott!</span>
        </div>
      )}
      <button
        type="button"
        className="wn-press"
        onClick={() => { setGespeichert(false); setOffen(true); }}
        style={{ minHeight: 52, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <PencilSimple size={18} />
        Stammdaten bearbeiten
      </button>
    </div>
  );
}

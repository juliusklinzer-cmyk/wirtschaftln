'use client';

import { useState } from 'react';
import { KlappenKopf } from '@/components/ds';
import { ProfilForm, type ProfilWerte } from './profil-form';

/**
 * „Profil bearbeiten" als Klappe: schließt sich nach dem Speichern und
 * bedankt sich (Julius' UI-Prinzip). Bei der Erstanmeldung steht das Formular
 * offen da, da führt eh kein Weg dran vorbei.
 */
export function ProfilBearbeiten({ werte }: { werte: ProfilWerte }) {
  const [offen, setOffen] = useState(false);
  const [danke, setDanke] = useState(false);

  if (werte.erstanmeldung) {
    return (
      <div style={{ background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', padding: 18 }}>
        <ProfilForm werte={werte} />
      </div>
    );
  }

  return (
    <div>
      <details
        open={offen}
        onToggle={(e) => {
          setOffen((e.currentTarget as HTMLDetailsElement).open);
          if ((e.currentTarget as HTMLDetailsElement).open) setDanke(false);
        }}
        style={{
          background: 'var(--weiss)', border: '1px solid var(--ink-100)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', overflow: 'hidden',
        }}
      >
        <KlappenKopf>Profil bearbeiten</KlappenKopf>
        <div style={{ padding: '4px 18px 18px' }}>
          <ProfilForm
            werte={werte}
            onGespeichert={() => {
              setOffen(false);
              setDanke(true);
            }}
          />
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
          ✓ Profil gspeichert, vergelt’s Gott!
        </div>
      )}
    </div>
  );
}

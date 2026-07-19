'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ds';
import { WirtshausSuche } from '@/components/domain/WirtshausSuche';
import { wirtshausVorschlagen } from '@/app/(app)/termin/actions';
import { PTS } from '@/lib/punkte';

/**
 * „Wirtshaus gfunden?"-Formular: nach dem Eintragen gibt's die Erfolgsmeldung
 * mit +1-WP-Animation, das Suchfeld wird geleert — und oben in der Header-Pill
 * zählt der Punkt direkt mit hoch (die Seite lädt die Stats frisch).
 */
export function WirtshausGfunden({ schonBesucht }: { schonBesucht: string[] }) {
  const [danke, setDanke] = useState(false);
  const [suchKey, setSuchKey] = useState(0);
  const [pending, startTransition] = useTransition();

  const eintragen = (formData: FormData) =>
    startTransition(async () => {
      await wirtshausVorschlagen(formData);
      setSuchKey((k) => k + 1); // Suchfeld leeren (Remount)
      setDanke(true);
    });

  return (
    <form action={eintragen} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <WirtshausSuche key={suchKey} schonBesucht={schonBesucht} />
      <Button type="submit" fullWidth variant="secondary" disabled={pending}>
        📍 Auf d’Karte damit
      </Button>
      {danke ? (
        <div style={{ position: 'relative' }}>
          <style>{`
            @keyframes wnDankeRein { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.03); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes wnPlusFlug { 0% { transform: translateY(0); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-26px); opacity: 0; } }
          `}</style>
          <div
            style={{
              padding: '10px 14px', borderRadius: 'var(--r-md)', textAlign: 'center',
              background: 'var(--erfolg-bg)', border: '1px solid var(--erfolg)',
              fontSize: 13, fontWeight: 800, color: 'var(--erfolg)',
              animation: 'wnDankeRein 400ms cubic-bezier(0.22, 1, 0.36, 1) both',
            }}
          >
            ✓ Steht auf da Kartn — vergelt’s Gott! 🍺
          </div>
          <span
            className="wn-tnum"
            style={{
              position: 'absolute', right: 10, top: -6, fontSize: 13, fontWeight: 800,
              color: 'var(--gold-700)', pointerEvents: 'none',
              animation: 'wnPlusFlug 1.4s ease-out 300ms both',
            }}
          >
            +{PTS.vorschlag} WP
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)' }}>
          Steht dann als „Offen“ auf der Karte — gibt <b>+{PTS.vorschlag} WP</b>, und no oan, wenn’s wirklich bsucht wird.
        </div>
      )}
    </form>
  );
}

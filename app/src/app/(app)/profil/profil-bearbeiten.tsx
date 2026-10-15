'use client';

import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { goldKnopfStil } from '@/components/domain/hero-stil';
import { ProfilForm, type ProfilWerte } from './profil-form';

/**
 * „Profil bearbeiten" als Vollbild (Profil-Redesign 1b): Knopf auf der Seite
 * (Umriss unterm Steckbrief oder Gold im leeren Steckbrief), drüber legt sich
 * der Editor mit X. Nach dem Speichern macht er sich von selber zu.
 */
export function ProfilBearbeiten({ werte, variante = 'bearbeiten', anfangsOffen = false }: { werte: ProfilWerte; variante?: 'bearbeiten' | 'ausfuellen'; /** Editor gleich offen (Gründer nach den Slides) */ anfangsOffen?: boolean }) {
  const [offen, setOffen] = useState(anfangsOffen);

  // Hintergrund ned mitscrollen lassen, solang der Editor offen is
  useEffect(() => {
    if (!offen) return;
    const main = document.querySelector('main');
    const vorher = main?.style.overflow ?? '';
    if (main) main.style.overflow = 'hidden';
    return () => { if (main) main.style.overflow = vorher; };
  }, [offen]);

  return (
    <>
      {variante === 'ausfuellen' ? (
        <button type="button" className="wn-press" onClick={() => setOffen(true)} style={{ ...goldKnopfStil, minHeight: 44, padding: '0 18px', fontSize: 14, alignSelf: 'center', width: 'auto' }}>Steckbrief ausfüllen</button>
      ) : (
        <button type="button" className="wn-press" onClick={() => setOffen(true)} style={{ height: 48, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
          <PencilSimple size={18} />
          Profil bearbeiten
        </button>
      )}

      {offen && (
        <div className="wn-scroll-still wn-profil-auf" style={{ position: 'fixed', inset: 0, zIndex: 60, maxWidth: 'var(--container-app)', margin: '0 auto', background: 'var(--ink-50)', overflowY: 'auto', overscrollBehavior: 'contain' }}>
          <div style={{ padding: 'calc(14px + env(safe-area-inset-top)) 16px calc(32px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
            <button type="button" onClick={() => setOffen(false)} aria-label="Schließen" className="wn-press" style={{ position: 'absolute', right: 16, top: 'calc(14px + env(safe-area-inset-top))', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 2 }}>
              <X size={17} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 52px 0 4px' }}>
              <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 34, lineHeight: 1, color: 'var(--navy)' }}>Profil bearbeiten</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>Änderungen sehen die Spezln sofort.</span>
            </div>
            <ProfilForm werte={werte} onGespeichert={() => setOffen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

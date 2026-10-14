'use client';

import { useRouter } from 'next/navigation';
import { X } from '@phosphor-icons/react/dist/ssr/X';

/** X oben rechts (Profil-Redesign 1a): zurück, wo man herkam, sonst auf Hoam. */
export function Schliessen({ klein = false }: { klein?: boolean }) {
  const router = useRouter();
  const zu = () => { if (window.history.length > 1) router.back(); else router.push('/'); };
  if (klein) {
    return (
      <button type="button" onClick={zu} aria-label="Schließen" style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', border: 'none', background: 'rgba(246,240,226,0.15)', color: 'var(--pergament)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
        <X size={14} />
      </button>
    );
  }
  return (
    <button type="button" onClick={zu} aria-label="Schließen" className="wn-press" style={{ position: 'absolute', right: 16, top: 'calc(14px + env(safe-area-inset-top))', zIndex: 25, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
      <X size={17} />
    </button>
  );
}

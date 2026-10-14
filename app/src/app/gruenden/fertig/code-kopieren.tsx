'use client';

import { useState } from 'react';
import { Copy } from '@phosphor-icons/react/dist/ssr/Copy';
import { Check } from '@phosphor-icons/react/dist/ssr/Check';

/** Gründungscode in der gestrichelten Gold-Box, Tipp kopiert ihn. */
export function CodeKopieren({ code }: { code: string }) {
  const [kopiert, setKopiert] = useState(false);
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1800);
    } catch {
      /* koa Clipboard: steht ja lesbar da */
    }
  };
  return (
    <button type="button" onClick={kopieren} aria-label="Gründungscode kopieren" className="wn-press" style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px dashed var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
      <span style={{ flex: 1, textAlign: 'left', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 18, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold-bright)' }}>{code}</span>
      {kopiert ? <Check size={20} weight="bold" color="var(--erfolg)" /> : <Copy size={20} color="var(--gold-bright)" />}
      {kopiert && <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--pergament)' }}>Kopiert</span>}
    </button>
  );
}

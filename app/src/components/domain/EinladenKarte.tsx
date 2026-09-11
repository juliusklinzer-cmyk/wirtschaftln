'use client';

import { useState } from 'react';
import { Button } from '@/components/ds';

/**
 * Spezln einladen: Beitritts-Link (mit Code) in d'WhatsApp-Gruppe schicken,
 * einzeln per WhatsApp/Teilen-Menü weitergeben, kopieren oder am Tisch
 * den QR-Code scannen lassen.
 */
export function EinladenKarte({
  link,
  code,
  text,
  qrSvg,
}: {
  link: string;
  code: string;
  /** Fertiger Einladungstext (mit Link + Code) */
  text: string;
  /** QR-Code als SVG-Data-URL */
  qrSvg: string;
}) {
  const [kopiert, setKopiert] = useState<'link' | 'text' | null>(null);
  const kopieren = async (was: 'link' | 'text') => {
    try {
      await navigator.clipboard.writeText(was === 'link' ? link : text);
      setKopiert(was);
      setTimeout(() => setKopiert(null), 1800);
    } catch {
      /* koa Clipboard → steht ja lesbar da */
    }
  };
  const teilen = async () => {
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: 'Einladung zum Stammtisch', text });
        return;
      } catch {
        /* abgebrochen */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="button" variant="gold" onClick={whatsapp} style={{ flex: 1 }}>
          💬 Per WhatsApp
        </Button>
        <Button type="button" variant="secondary" onClick={teilen} style={{ flex: 1 }}>
          Teilen…
        </Button>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', textAlign: 'center' }}>
        In d’WhatsApp-Gruppe posten oder einzeln an d’Spezln schicken — jeder tritt mit dem Link selber bei.
      </div>

      <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>Beitritts-Link</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', wordBreak: 'break-all' }}>{link}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="button" variant="secondary" onClick={() => kopieren('link')} style={{ flex: 1 }}>
            {kopiert === 'link' ? '✓ Kopiert' : 'Link kopieren'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => kopieren('text')} style={{ flex: 1 }}>
            {kopiert === 'text' ? '✓ Kopiert' : 'Text kopieren'}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSvg} alt="QR-Code zum Beitreten" width={120} height={120} style={{ width: 120, height: 120, borderRadius: 10, border: '1px solid var(--ink-100)', background: '#fff', flex: 'none' }} />
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.5 }}>
          <b style={{ color: 'var(--ink-900)' }}>Am Tisch:</b> QR-Code scannen lassen, der Gründungscode <b className="wn-tnum">{code}</b> steht scho drin.
        </div>
      </div>
    </div>
  );
}

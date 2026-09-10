'use client';

import { useState } from 'react';
import { Button } from '@/components/ds';

/**
 * Gründungs-Token im Profil (nur Gründer-Mitglieder): Link teilen/kopieren,
 * Status offen/eingelöst. Ton: „Du derfst genau OAN Stammtisch in d'Welt setzen."
 */
export function TokenKarte({
  token,
  link,
  eingeloest,
}: {
  token: string;
  link: string;
  /** null = no offen; sonst wer/wann eingelöst */
  eingeloest: { gruppeName: string; am: string } | null;
}) {
  const [kopiert, setKopiert] = useState(false);
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1800);
    } catch {
      /* koa Clipboard (http/alter Browser) → Link steht ja lesbar da */
    }
  };
  const teilen = async () => {
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: 'Gründ dein eigenen Stammtisch', text: 'A Ehren-Einladung: Mit dem Link gründst du euren eigenen Stammtisch in der Wirtschaftln-App.', url: link });
        return;
      } catch {
        /* abgebrochen → nix */
      }
    }
    void kopieren();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 26, flex: 'none' }}>🏰</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Dei Gründungs-Token</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.45 }}>
            Du derfst genau <b>OAN</b> Stammtisch in d’Welt setzen. Schick den Link wem, der an eigenen Stammtisch gründen soll — der kriegt seine eigene App, komplett getrennt von unserer.
          </div>
        </div>
      </div>

      <div
        className="wn-tnum"
        style={{
          padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)',
          fontSize: 15, fontWeight: 800, letterSpacing: '0.06em', color: eingeloest ? 'var(--ink-300)' : 'var(--navy)', textAlign: 'center',
          textDecoration: eingeloest ? 'line-through' : 'none',
        }}
      >
        {token}
      </div>

      {eingeloest ? (
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-500)', textAlign: 'center' }}>
          ✓ Eingelöst: <b>{eingeloest.gruppeName}</b> wurde am {eingeloest.am} gegründet.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="button" variant="gold" onClick={teilen} style={{ flex: 1 }}>
            Link teilen
          </Button>
          <Button type="button" variant="secondary" onClick={kopieren} style={{ flex: 1 }}>
            {kopiert ? '✓ Kopiert' : 'Kopieren'}
          </Button>
        </div>
      )}
      {!eingeloest && (
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-300)', textAlign: 'center', wordBreak: 'break-all' }}>{link}</div>
      )}
    </div>
  );
}

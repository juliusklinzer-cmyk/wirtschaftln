'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ds';

export type TokenAnzeige = {
  token: string;
  link: string;
  /** null = no offen; sonst wer/wann eingelöst */
  eingeloest: { gruppeName: string; am: string } | null;
};

/**
 * Gründungs-Tokens im Profil (nur Gründer-Mitglieder): Link teilen/kopieren,
 * Status offen/eingelöst. Ton: „Du derfst genau OAN Stammtisch in d'Welt setzen."
 * Der Gründer-Admin hat unbegrenzt Tokens und kriegt an Knopf für neue.
 */
export function TokenKarte({
  tokens,
  neuerToken,
}: {
  tokens: TokenAnzeige[];
  /** Server Action: frischen Token münzen (nur Admin, sonst weglassen) */
  neuerToken?: () => Promise<void>;
}) {
  const [laeuft, starte] = useTransition();
  const admin = !!neuerToken;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 26, flex: 'none' }}>🏰</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>{admin ? 'Deine Gründungs-Tokens' : 'Dei Gründungs-Token'}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.45 }}>
            {admin
              ? 'Als Gründer-Admin hast du unbegrenzt Tokens. Jeder Link setzt genau OAN neuen Stammtisch in d’Welt, komplett getrennt von unserem.'
              : 'Du derfst genau OAN Stammtisch in d’Welt setzen. Schick den Link wem, der an eigenen Stammtisch gründen soll — der kriegt seine eigene App, komplett getrennt von unserer.'}
          </div>
        </div>
      </div>

      {tokens.map((t) => (
        <TokenZeile key={t.token} t={t} />
      ))}

      {neuerToken && (
        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={laeuft}
          onClick={() => starte(async () => { await neuerToken(); })}
        >
          {laeuft ? 'Moment…' : '+ Neuen Token erzeugen'}
        </Button>
      )}
    </div>
  );
}

function TokenZeile({ t }: { t: TokenAnzeige }) {
  const [kopiert, setKopiert] = useState(false);
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(t.link);
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
        await nav.share({ title: 'Gründ dein eigenen Stammtisch', text: 'A Ehren-Einladung: Mit dem Link gründst du euren eigenen Stammtisch in der Wirtschaftln-App.', url: t.link });
        return;
      } catch {
        /* abgebrochen → nix */
      }
    }
    void kopieren();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--pergament)', border: '1px solid var(--pergament-edge)' }}>
      <div
        className="wn-tnum"
        style={{
          fontSize: 15, fontWeight: 800, letterSpacing: '0.06em', textAlign: 'center',
          color: t.eingeloest ? 'var(--ink-300)' : 'var(--navy)',
          textDecoration: t.eingeloest ? 'line-through' : 'none',
        }}
      >
        {t.token}
      </div>
      {t.eingeloest ? (
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textAlign: 'center' }}>
          ✓ Eingelöst: <b>{t.eingeloest.gruppeName}</b> wurde am {t.eingeloest.am} gegründet.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="button" variant="gold" onClick={teilen} style={{ flex: 1 }}>
              Link teilen
            </Button>
            <Button type="button" variant="secondary" onClick={kopieren} style={{ flex: 1 }}>
              {kopiert ? '✓ Kopiert' : 'Kopieren'}
            </Button>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-300)', textAlign: 'center', wordBreak: 'break-all' }}>{t.link}</div>
        </>
      )}
    </div>
  );
}

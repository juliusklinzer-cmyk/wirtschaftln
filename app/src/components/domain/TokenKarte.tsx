'use client';

import { useState, useTransition } from 'react';
import { Copy } from '@phosphor-icons/react/dist/ssr/Copy';
import { ShareNetwork } from '@phosphor-icons/react/dist/ssr/ShareNetwork';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { goldKnopfStil } from '@/components/domain/hero-stil';

export type TokenAnzeige = {
  token: string;
  link: string;
  /** null = no offen; sonst wer/wann eingelöst */
  eingeloest: { gruppeName: string; am: string } | null;
};

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 };

/**
 * Gründungs-Tokens (Profil-Redesign 2c, nur Gründer-Mitglieder): a Karte je
 * Token mit Link zum Teilen/Kopieren, eingelöste als grüne Zeile. Der
 * Gründer-Admin kriegt an Knopf für neue.
 */
export function TokenKarte({ tokens, neuerToken }: { tokens: TokenAnzeige[]; /** Server Action: frischen Token münzen (nur Admin, sonst weglassen) */ neuerToken?: () => Promise<void> }) {
  const [laeuft, starte] = useTransition();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tokens.map((t) => <TokenZeile key={t.token} t={t} admin={!!neuerToken} />)}
      {neuerToken && (
        <button type="button" className="wn-press" disabled={laeuft} onClick={() => starte(async () => { await neuerToken(); })} style={{ height: 46, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          {laeuft ? 'Moment …' : '+ Neuen Token erzeugen'}
        </button>
      )}
    </div>
  );
}

function TokenZeile({ t, admin }: { t: TokenAnzeige; admin: boolean }) {
  const [kopiert, setKopiert] = useState(false);
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(t.link);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1800);
    } catch { /* koa Clipboard, der Link steht ja lesbar da */ }
  };
  const teilen = async () => {
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: 'Gründ deinen eigenen Stammtisch', text: 'Eine Ehren-Einladung: Mit dem Link gründest du euren eigenen Stammtisch in der Wirtschaftln-App.', url: t.link });
        return;
      } catch { /* abgebrochen */ }
    }
    void kopieren();
  };
  if (t.eingeloest) {
    return (
      <div style={karteStil}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle size={24} weight="fill" color="var(--erfolg)" style={{ flex: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Eingelöst</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{t.eingeloest.gruppeName} · {t.eingeloest.am}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={karteStil}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 24, lineHeight: 1, color: 'var(--navy)' }}>{admin ? 'Gründungs-Token' : 'Dein Gründungs-Token'}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>Damit kann genau ein neuer Stammtisch starten, komplett getrennt von unserem.</span>
      </div>
      <button type="button" onClick={kopieren} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 14, background: 'var(--pergament)', border: '1px dashed var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--navy)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.link.replace(/^https?:\/\//, '')}</span>
        <Copy size={18} color="var(--gold-700)" style={{ flex: 'none' }} />
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button type="button" onClick={teilen} className="wn-press" style={{ ...goldKnopfStil, minHeight: 46, fontSize: 14 }}>
          <ShareNetwork size={17} weight="fill" />
          Teilen
        </button>
        <button type="button" onClick={kopieren} className="wn-press" style={{ height: 46, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          {kopiert ? '✓ Kopiert' : 'Kopieren'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Ticket } from '@phosphor-icons/react/dist/ssr/Ticket';
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { EinstellungZeile } from '@/components/domain/EinstellungZeile';
import { PushEinstellung } from '@/components/domain/PushEinstellung';
import { DaniModusSchalter } from '@/components/domain/DaniModus';
import { TokenKarte, type TokenAnzeige } from '@/components/domain/TokenKarte';

/**
 * Einstellungen (Profil-Redesign 1a): Benachrichtigungen, Gründungs-Token
 * (klappt die Token-Karten drunter auf), Gaudi-Modus, Abmelden.
 */
export function Einstellungen({ tokens, neuerToken, gaudi, logout }: { tokens: TokenAnzeige[]; neuerToken?: () => Promise<void>; gaudi: boolean; logout: () => Promise<void> }) {
  const [tokenOffen, setTokenOffen] = useState(false);
  const offen = tokens.filter((t) => !t.eingeloest).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '2px 16px' }}>
        <span id="push" aria-hidden style={{ display: 'block', scrollMarginTop: 12 }} />
        <PushEinstellung />
        {tokens.length > 0 && (
          <EinstellungZeile
            icon={<Ticket size={19} weight="fill" />}
            titel="Gründungs-Token"
            unter={offen > 0 ? 'einen Stammtisch in die Welt setzen' : 'alle eingelöst'}
            rechts={tokenOffen ? <CaretDown size={18} color="var(--ink-300)" /> : <CaretRight size={18} color="var(--ink-300)" />}
            onClick={() => setTokenOffen((o) => !o)}
          />
        )}
        {gaudi && <DaniModusSchalter />}
        <form action={logout}>
          <button type="submit" style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}>
            <EinstellungZeile icon={<SignOut size={19} weight="fill" />} iconFarbe="var(--strafe)" titel="Abmelden" letzte />
          </button>
        </form>
      </div>
      {tokenOffen && tokens.length > 0 && <TokenKarte tokens={tokens} neuerToken={neuerToken} />}
    </div>
  );
}

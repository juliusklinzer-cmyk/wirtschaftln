'use client';

import { useState } from 'react';
import { Ticket } from '@phosphor-icons/react/dist/ssr/Ticket';
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { EinstellungZeile } from '@/components/domain/EinstellungZeile';
import { PushEinstellung } from '@/components/domain/PushEinstellung';
import { DaniModusSchalter } from '@/components/domain/DaniModus';
import { TokenKarte, type TokenAnzeige, type FristAnzeige, type AnfrageAnzeige } from '@/components/domain/TokenKarte';

/**
 * Einstellungen (Profil-Redesign 1a): Benachrichtigungen, Gründungs-Token
 * (klappt die Token-Karten drunter auf), Gaudi-Modus, Abmelden.
 */
export type TokenBereich = {
  tokens: TokenAnzeige[];
  fristen: FristAnzeige[];
  gruendung: string;
  anfragen: AnfrageAnzeige[];
  darfAnfragen: boolean;
  eigene: boolean;
  widmen: (token: string, widmung: string) => Promise<{ fehler?: string }>;
  anfrageSchicken?: (grund: string) => Promise<{ fehler?: string }>;
  neuerToken?: () => Promise<void>;
};

export function Einstellungen({ token, gaudi, logout }: { token: TokenBereich | null; gaudi: boolean; logout: () => Promise<void> }) {
  const [tokenOffen, setTokenOffen] = useState(false);
  const frei = token ? token.tokens.filter((t) => !t.eingeloest).length : 0;
  const naechste = token?.fristen.find((f) => f.offen) ?? null;
  const anfrageLaeuft = token?.anfragen.some((a) => a.status === 'offen') ?? false;
  const zeigen = !!token && (token.tokens.length > 0 || token.fristen.length > 0 || token.anfragen.length > 0 || !!token.neuerToken || token.darfAnfragen);
  const unter = frei > 0 ? `${frei} Token frei` : anfrageLaeuft ? 'Anfrage läuft' : naechste ? `nächster am ${naechste.abKurz}` : token && token.tokens.length > 0 ? 'alle eingelöst' : 'einen Stammtisch in die Welt setzen';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '2px 16px' }}>
        <span id="push" aria-hidden style={{ display: 'block', scrollMarginTop: 12 }} />
        <PushEinstellung />
        {zeigen && (
          <EinstellungZeile
            icon={<Ticket size={19} weight="fill" />}
            titel="Gründungs-Token"
            unter={unter}
            rechts={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {frei > 0 && <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: 'var(--grad-gold)', color: 'var(--navy-900)' }}>{frei}</span>}
                {tokenOffen ? <CaretDown size={18} color="var(--ink-300)" /> : <CaretRight size={18} color="var(--ink-300)" />}
              </span>
            }
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
      {tokenOffen && token && zeigen && <TokenKarte {...token} />}
    </div>
  );
}

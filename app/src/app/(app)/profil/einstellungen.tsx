'use client';

import { useState } from 'react';
import { Ticket } from '@phosphor-icons/react/dist/ssr/Ticket';
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut';
import { ChatCircleText } from '@phosphor-icons/react/dist/ssr/ChatCircleText';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { EinstellungZeile } from '@/components/domain/EinstellungZeile';
import { PushEinstellung } from '@/components/domain/PushEinstellung';
import { AppInstallieren } from '@/components/domain/AppInstallieren';
import { DaniModusSchalter } from '@/components/domain/DaniModus';
import { FeedbackKarte } from '@/components/domain/FeedbackKarte';
import { TokenKarte, type TokenAnzeige, type FristAnzeige, type AnfrageAnzeige } from '@/components/domain/TokenKarte';

/**
 * Einstellungen (Profil-Redesign 1a): Benachrichtigungen, Gründungs-Token
 * (klappt die Token-Karten drunter auf), Feedback zur App (nur neue
 * Stammtische), Gaudi-Modus, Abmelden.
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

export function Einstellungen({ token, gaudi, logout, feedback }: { token: TokenBereich | null; gaudi: boolean; logout: () => Promise<void>; feedback?: (text: string) => Promise<{ fehler?: string }> }) {
  const [tokenOffen, setTokenOffen] = useState(false);
  const [feedbackOffen, setFeedbackOffen] = useState(false);
  const frei = token ? token.tokens.filter((t) => !t.eingeloest).length : 0;
  const naechste = token?.fristen.find((f) => f.offen) ?? null;
  const anfrageLaeuft = token?.anfragen.some((a) => a.status === 'offen') ?? false;
  const zeigen = !!token && (token.tokens.length > 0 || token.fristen.length > 0 || token.anfragen.length > 0 || !!token.neuerToken || token.darfAnfragen);
  const unter = frei > 0 ? `${frei} Token frei` : anfrageLaeuft ? 'Anfrage läuft' : naechste ? `nächster am ${naechste.abKurz}` : token && token.tokens.length > 0 ? 'alle eingelöst' : 'einen Stammtisch in die Welt setzen';
  // Zeilen der Reihe nach; klappt eine auf (Tokens, Feedback), teilt sich die
  // Karte genau dort und der Inhalt steht direkt drunter, ned erst ganz unten.
  const zeilen: Array<{ key: string; zeile: (letzte: boolean) => React.ReactNode; auf?: React.ReactNode }> = [
    {
      key: 'push',
      zeile: () => (
        <>
          <span id="push" aria-hidden style={{ display: 'block', scrollMarginTop: 12 }} />
          <PushEinstellung />
          {/* Nur im Browser sichtbar (2b): Anleitung zum Home-Bildschirm */}
          <AppInstallieren variante="profil" />
        </>
      ),
    },
  ];
  if (zeigen && token) {
    zeilen.push({
      key: 'token',
      zeile: (letzte) => (
        <EinstellungZeile
          icon={<Ticket size={19} weight="fill" />}
          titel="Gründungs-Token"
          unter={unter}
          letzte={letzte}
          rechts={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {frei > 0 && <span className="wn-tnum" style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: 'var(--grad-gold)', color: 'var(--navy-900)' }}>{frei}</span>}
              {tokenOffen ? <CaretDown size={18} color="var(--ink-300)" /> : <CaretRight size={18} color="var(--ink-300)" />}
            </span>
          }
          onClick={() => setTokenOffen((o) => !o)}
        />
      ),
      auf: tokenOffen ? <TokenKarte {...token} /> : undefined,
    });
  }
  if (feedback) {
    zeilen.push({
      key: 'feedback',
      zeile: (letzte) => (
        <EinstellungZeile
          icon={<ChatCircleText size={19} weight="fill" />}
          titel="Feedback zur App"
          unter="Wünsche und Verbesserungen"
          letzte={letzte}
          rechts={feedbackOffen ? <CaretDown size={18} color="var(--ink-300)" /> : <CaretRight size={18} color="var(--ink-300)" />}
          onClick={() => setFeedbackOffen((o) => !o)}
        />
      ),
      auf: feedbackOffen ? <FeedbackKarte schicken={feedback} fertig={() => setFeedbackOffen(false)} /> : undefined,
    });
  }
  if (gaudi) zeilen.push({ key: 'gaudi', zeile: () => <DaniModusSchalter /> });
  zeilen.push({
    key: 'abmelden',
    zeile: () => (
      <form action={logout}>
        <button type="submit" style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}>
          <EinstellungZeile icon={<SignOut size={19} weight="fill" />} iconFarbe="var(--strafe)" titel="Abmelden" letzte />
        </button>
      </form>
    ),
  });

  // In Karten-Gruppen aufteilen: nach jeder aufgeklappten Zeile beginnt a neue Karte
  const gruppen: Array<{ zeilen: typeof zeilen; auf?: React.ReactNode }> = [{ zeilen: [] }];
  for (const z of zeilen) {
    gruppen[gruppen.length - 1].zeilen.push(z);
    if (z.auf) {
      gruppen[gruppen.length - 1].auf = z.auf;
      gruppen.push({ zeilen: [] });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {gruppen.filter((g) => g.zeilen.length > 0).map((g, gi) => (
        <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '2px 16px' }}>
            {g.zeilen.map((z, i) => <div key={z.key}>{z.zeile(i === g.zeilen.length - 1)}</div>)}
          </div>
          {g.auf}
        </div>
      ))}
    </div>
  );
}

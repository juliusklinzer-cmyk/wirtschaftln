import React from 'react';
export type KasseStatus = 'offen' | 'beglichen' | 'aufgehoben' | 'einzahlung';
export interface KasseEntryProps {
  name: string;
  photo?: string;
  /** Reason / Vorwurf, e.g. "Zugesagt & nicht erschienen". */
  grund: string;
  /** Euro amount; negative = Strafe/Forderung (penalty owed). */
  betrag: number;
  datum?: string;
  /** Penalty settled (legacy boolean; prefer `status`). @default false */
  paid?: boolean;
  /** Forderung state — drives the status pill. Falls back to `paid`. */
  status?: KasseStatus;
  /** Marks a reported (gemeldet) entry with a ⚖️ glyph. @default false */
  gemeldet?: boolean;
  /** 'strafe' (member penalty) or 'ausgabe' (club expenditure). @default 'strafe' */
  kind?: 'strafe' | 'ausgabe';
  /** Emoji/icon shown in the tile when kind is 'ausgabe'. @default '🧾' */
  icon?: React.ReactNode;
  /** Make the row tappable (e.g. to open the Forderung manager). */
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function KasseEntry(props: KasseEntryProps): JSX.Element;

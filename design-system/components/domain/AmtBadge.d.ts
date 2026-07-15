import React from 'react';
export interface AmtBadgeProps {
  /** Office name, rendered in Fraktur, e.g. "Bierwart". */
  title: string;
  /** Current holder's name. */
  holder?: string;
  /** Emoji or node icon. @default '🏅' */
  icon?: React.ReactNode;
  /** @default 'md' */
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}
/**
 * Honorary year-end office seal (Spaßamt).
 * @startingPoint section="Domain" subtitle="Honorary office seal" viewport="700x220"
 */
export function AmtBadge(props: AmtBadgeProps): JSX.Element;

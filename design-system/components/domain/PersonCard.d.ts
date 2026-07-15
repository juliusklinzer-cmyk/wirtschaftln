import React from 'react';
export interface PersonCardProps {
  name: string;
  photo?: string;
  /** Honorary office / Spaßamt, e.g. "Bierwart". */
  amt?: string;
  /** Member-since year, shown when no Amt. */
  since?: string | number;
  abende?: number;
  mass?: number;
  wirtshaeuser?: number;
  /** Gold avatar ring for office holders. @default false */
  ring?: boolean;
  /** @default 'tile' */
  layout?: 'tile' | 'row';
  onClick?: () => void;
  style?: React.CSSProperties;
}
/**
 * Member card with photo + core club stats.
 * @startingPoint section="Domain" subtitle="Member cards with photo & stats" viewport="700x320"
 */
export function PersonCard(props: PersonCardProps): JSX.Element;

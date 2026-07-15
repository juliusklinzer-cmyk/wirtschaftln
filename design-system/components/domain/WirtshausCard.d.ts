import React from 'react';
export interface StarRatingProps {
  value?: number;
  max?: number;
  size?: number;
  /** Pass a handler to make it interactive. */
  onChange?: ((value: number) => void) | null;
  showValue?: boolean;
  style?: React.CSSProperties;
}
export function StarRating(props: StarRatingProps): JSX.Element;

export interface WirtshausCardProps {
  name: string;
  photo?: string;
  /** Munich district, e.g. "Haidhausen". */
  bezirk?: string;
  rating?: number;
  /** Visit date string; presence flips status to "Besucht". */
  besuchtAm?: string;
  /** Marks the upcoming venue with a gold frame. @default false */
  naechstes?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/**
 * Tavern collectible card with rating & visit status.
 * @startingPoint section="Domain" subtitle="Tavern cards — rating & visit status" viewport="700x260"
 */
export function WirtshausCard(props: WirtshausCardProps): JSX.Element;

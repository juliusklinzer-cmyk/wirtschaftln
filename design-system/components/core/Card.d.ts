import React from 'react';
export type CardTone = 'white' | 'parchment' | 'brand' | 'dark';
export interface CardProps {
  children?: React.ReactNode;
  /** @default 'white' */
  tone?: CardTone;
  /** Gold hairline frame for ceremonial content. @default false */
  framed?: boolean;
  /** Padding in px. @default 20 */
  pad?: number;
  /** Hover-lift + pointer. @default false */
  interactive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
}
export function Card(props: CardProps): JSX.Element;

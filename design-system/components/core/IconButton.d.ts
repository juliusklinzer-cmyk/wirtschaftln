import React from 'react';
export type IconButtonVariant = 'soft' | 'blau' | 'gold' | 'ghost' | 'outline';
export interface IconButtonProps {
  children?: React.ReactNode;
  /** Accessible label (also the tooltip). */
  label: string;
  /** @default 'soft' */
  variant?: IconButtonVariant;
  /** Pixel square. @default 40 */
  size?: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}
export function IconButton(props: IconButtonProps): JSX.Element;

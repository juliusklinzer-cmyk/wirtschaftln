import React from 'react';
export type BadgeTone = 'neutral' | 'blau' | 'gold' | 'erfolg' | 'warnung' | 'strafe';
export interface BadgeProps {
  children?: React.ReactNode;
  /** @default 'neutral' */
  tone?: BadgeTone;
  /** Filled instead of soft-tinted. @default false */
  solid?: boolean;
  iconLeft?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Badge(props: BadgeProps): JSX.Element;

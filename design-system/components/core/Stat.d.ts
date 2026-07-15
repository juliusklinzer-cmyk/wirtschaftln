import React from 'react';
export type StatTone = 'blau' | 'gold' | 'dark' | 'light' | 'ink';
export interface StatProps {
  value: React.ReactNode;
  label: string;
  unit?: React.ReactNode;
  icon?: React.ReactNode;
  /** @default 'blau' */
  tone?: StatTone;
  /** @default 'left' */
  align?: 'left' | 'center';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}
export function Stat(props: StatProps): JSX.Element;

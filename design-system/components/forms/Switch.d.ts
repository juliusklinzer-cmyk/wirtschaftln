import React from 'react';
export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  /** @default 'blau' */
  tone?: 'blau' | 'gold';
  label?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Switch(props: SwitchProps): JSX.Element;

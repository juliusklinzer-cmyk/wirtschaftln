import React from 'react';

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. `gold` = ceremonial CTA, `danger` = Kasse/penalty. @default 'primary' */
  variant?: ButtonVariant;
  /** @default 'md' */
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

/**
 * Primary action button for Wirtschaftln.
 * @startingPoint section="Core" subtitle="Buttons in every variant & size" viewport="700x200"
 */
export function Button(props: ButtonProps): JSX.Element;

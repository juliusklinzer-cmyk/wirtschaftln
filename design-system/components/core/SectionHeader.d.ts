import React from 'react';
export interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  /** Render the title in Fraktur. @default false */
  fraktur?: boolean;
  /** Trailing action node (button, link). */
  action?: React.ReactNode;
  style?: React.CSSProperties;
}
export function SectionHeader(props: SectionHeaderProps): JSX.Element;

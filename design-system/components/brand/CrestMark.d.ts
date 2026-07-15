import React from 'react';
export interface CrestMarkProps {
  /** Optional shield image URL prepended above the wordmark. */
  crest?: string;
  /** @default 'gold' */
  tone?: 'gold' | 'navy' | 'mono';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Show "München · seit 2019" line. @default true */
  motto?: boolean;
  /** @default 'center' */
  align?: 'center' | 'left';
  style?: React.CSSProperties;
}
/**
 * Club wordmark lockup in Fraktur.
 * @startingPoint section="Brand" subtitle="Wordmark lockup" viewport="700x200"
 */
export function CrestMark(props: CrestMarkProps): JSX.Element;

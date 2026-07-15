import React from 'react';
export interface BeerCounterProps {
  value?: number;
  onChange?: (next: number) => void;
  /** @default 'Hoibe heut’' */
  label?: string;
  /** @default 20 */
  max?: number;
  style?: React.CSSProperties;
}
/**
 * Gamified stepper for counting Hoibe during an evening.
 * @startingPoint section="Domain" subtitle="Hoibe tally stepper" viewport="700x150"
 */
export function BeerCounter(props: BeerCounterProps): JSX.Element;

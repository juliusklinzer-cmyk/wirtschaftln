import React from 'react';
export interface RankRowProps {
  rank: number;
  name: string;
  photo?: string;
  value: React.ReactNode;
  /** @default 'Hoibe' */
  unit?: string;
  /** Highlights this row as the current member. @default false */
  me?: boolean;
  /** Optional office line under the name. */
  amt?: string;
  style?: React.CSSProperties;
}
export function RankRow(props: RankRowProps): JSX.Element;

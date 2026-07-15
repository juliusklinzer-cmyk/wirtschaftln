import React from 'react';
export type VoteValue = 'zu' | 'vielleicht' | 'ab' | null;
export interface VotePillProps {
  value?: VoteValue;
  onChange?: (value: 'zu' | 'vielleicht' | 'ab') => void;
  style?: React.CSSProperties;
}
export function VotePill(props: VotePillProps): JSX.Element;

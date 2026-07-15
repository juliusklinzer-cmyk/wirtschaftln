import React from 'react';
export interface TabItem { label: string; value: string; }
export interface SegmentedTabsProps {
  /** Array of strings or {label,value} objects. */
  tabs: (string | TabItem)[];
  value: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
export function SegmentedTabs(props: SegmentedTabsProps): JSX.Element;

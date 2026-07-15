import React from 'react';
export interface AvatarProps {
  src?: string;
  /** Used for initials fallback + alt text. */
  name?: string;
  /** Pixel diameter. @default 48 */
  size?: number;
  /** Gold ring — marks office holders / featured members. @default false */
  ring?: boolean;
  /** Corner badge content (e.g. rank number). */
  badge?: React.ReactNode;
  /** Green present/online dot. @default false */
  present?: boolean;
  style?: React.CSSProperties;
}
export function Avatar(props: AvatarProps): JSX.Element;

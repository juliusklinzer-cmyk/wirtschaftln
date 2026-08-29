// Wirtschaftln, Inline-Icon-Set (Lucide-Stil, 24px Stroke-Pfade).
// Substitut laut Design-System; bei Bedarf gegen echtes Lucide tauschen.

const ICON_PATHS: Record<string, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>',
  map: '<path d="m9 4-6 2.5v15L9 19l6 2.5 6-2.5v-15L15 6.5 9 4z"/><path d="M9 4v15M15 6.5v15"/>',
  trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 16h6M10 16l-.5 4h5l-.5-4"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9h18M16.5 13.5h.01"/>',
  beer: '<path d="M6 11h9v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8z"/><path d="M15 13h2.5a2.5 2.5 0 0 1 0 5H15M6 11V8a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  star: '<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.4 6.2 21.4l1.1-6.5L2.6 9.8l6.5-.9L12 3z"/>',
  pin: '<path d="M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M17 20a5.5 5.5 0 0 0-3-4.9"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  flame: '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.5.7-2.8 1.5-3.5C9 10 9.5 11 10 11.5 10 9 11 5 12 3z"/>',
  daumen:
    '<path d="M7 10.5V21"/><path d="M14.9 5.9 14 10h5.6a2 2 0 0 1 1.94 2.5l-2.1 7A2 2 0 0 1 17.5 21H4.5A1.5 1.5 0 0 1 3 19.5v-7A1.5 1.5 0 0 1 4.5 11h2.3a2 2 0 0 0 1.8-1.1L11.9 3a3 3 0 0 1 3 2.9Z"/>',
  // Google-Maps-Wegbeschreibung: aufgestellte Raute mit rechtwinklig abknickendem Pfeil
  richtung:
    '<path d="M12 2.6 21.4 12 12 21.4 2.6 12 12 2.6z"/><path d="M9.5 15.5v-2.5a1.8 1.8 0 0 1 1.8-1.8h3.4"/><path d="m12.6 9.1 2.4 2.1-2.4 2.1"/>',
};

export type IconName = keyof typeof ICON_PATHS;

export function Icon({
  name,
  size = 22,
  color = 'currentColor',
  stroke = 2,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] ?? '' }}
    />
  );
}

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
  // Hoam-Redesign (13.10.2026): Glocke mit Schallwellen, Warndreieck, Pin mit Plus, Lupe, Kreuz,
  // Medaille, Person(+), Info, Abmelden, Pfeil rechts, Kalender mit Plus, Navigationspfeil, Münzen, Zahnrad
  'bell-ring': '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/><path d="M3.5 8a8 8 0 0 1 2.3-4.5M20.5 8a8 8 0 0 0-2.3-4.5"/>',
  warning: '<path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4M12 17.3h.01"/>',
  'pin-plus': '<path d="M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z"/><path d="M12 7.5v5M9.5 10h5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  medal: '<circle cx="12" cy="15" r="5"/><path d="M8.6 10.6 6 3h5l1 3 1-3h5l-2.6 7.6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  'user-plus': '<circle cx="10" cy="8" r="4"/><path d="M2.5 21a7.5 7.5 0 0 1 15 0"/><path d="M19 8v6M16 11h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'calendar-plus': '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4M12 12v5M9.5 14.5h5"/>',
  navigation: '<path d="m3 11 18-8-8 18-2-8-8-2z"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.3 18"/><path d="M7 6h1v4"/>',
  // Termin-Redesign (13.10.2026): Schloss, Tausch, Stift, Taxi, Vollbild, Hand, Haken im Kreis, Pfeil links, Stamperl, Schüssel, Schmarrn
  lock: '<rect x="4" y="10.5" width="16" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  swap: '<path d="M4 8h13M14 4.5 17.5 8 14 11.5"/><path d="M20 16H7M10 12.5 6.5 16l3.5 3.5"/>',
  pencil: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m13.5 8.5 3 3"/>',
  taxi: '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><rect x="3" y="11" width="18" height="7" rx="2"/><path d="M7 18v2M17 18v2M7 14.5h.01M17 14.5h.01M10 5V3h4v2"/>',
  'arrows-out': '<path d="M15 4h5v5M9 20H4v-5M20 4l-6 6M4 20l6-6"/>',
  hand: '<path d="M7 11V7.5a1.5 1.5 0 0 1 3 0V11M10 10V5.5a1.5 1.5 0 0 1 3 0V11M13 10.5V6.5a1.5 1.5 0 0 1 3 0V12M16 11a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.3-3.2L4 15.5a1.4 1.4 0 0 1 2.3-1.6L7 15"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  'arrow-left': '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  wine: '<path d="M8 3h8l-1 7a3 3 0 0 1-6 0L8 3z"/><path d="M12 13v7M8.5 21h7"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 11c0-3 2-5 4-6M12 11c0-2.5 1.5-4 3-5"/>',
  cookie: '<path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3z"/><path d="M8.5 9.5h.01M8 15h.01M13 16h.01M16 13h.01"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
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

/**
 * Wirtschaftln, CrestMark
 * Typografisches Lockup: Wortmarke in Fraktur + Motto-Zeile („Stadt · seit Jahr").
 * `crest` (img src) stellt das Wappen voran. `tone`:
 * 'gold' (auf dunkel) | 'navy' (auf hell) | 'mono'.
 * Name/Stadt/Gründungsjahr kommen aus der Tenant-Config des Stammtischs,
 * Defaults = der Gründer.
 */
export function CrestMark({
  crest = null,
  tone = 'gold',
  size = 'md',
  motto = true,
  align = 'center',
  name = 'Wirtschaftln',
  stadt = 'München',
  gruendungsjahr = 2019,
  style = {},
}: {
  crest?: string | null;
  tone?: 'gold' | 'navy' | 'mono';
  size?: 'sm' | 'md' | 'lg';
  motto?: boolean;
  align?: 'center' | 'left';
  name?: string;
  stadt?: string | null;
  gruendungsjahr?: number | null;
  style?: React.CSSProperties;
}) {
  const sizes = {
    sm: { word: 26, crest: 34, motto: 11 },
    md: { word: 40, crest: 52, motto: 13 },
    lg: { word: 60, crest: 78, motto: 15 },
  };
  const s = sizes[size] ?? sizes.md;
  const tones = {
    gold: { word: 'var(--gold-bright)', sub: 'var(--pergament)', motto: 'var(--gold)' },
    navy: { word: 'var(--navy)', sub: 'var(--ink-700)', motto: 'var(--gold-700)' },
    mono: { word: 'currentColor', sub: 'currentColor', motto: 'currentColor' },
  };
  const t = tones[tone] ?? tones.gold;
  const mottoText = [stadt, gruendungsjahr ? `seit ${gruendungsjahr}` : null].filter(Boolean).join(' · ');
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align, fontFamily: 'var(--font-ui)', gap: 2, ...style,
      }}
    >
      {crest && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={crest} alt={`${name} Wappen`} style={{ height: s.crest, marginBottom: 8 }} />
      )}
      <div style={{ fontFamily: 'var(--font-fraktur)', fontSize: s.word, color: t.word, lineHeight: 1, letterSpacing: '0.01em' }}>
        {name}
      </div>
      {motto && mottoText && (
        <div style={{ fontSize: s.motto, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.motto, marginTop: 6 }}>
          {mottoText}
        </div>
      )}
    </div>
  );
}

/**
 * Wirtschaftln, Avatar
 * Mitgliederfoto mit optionalem Gold-Ring (Amtsträger), Vereins-Ring
 * (Bayern rot / Sechzig blau / neutral Biergarten-grün, Gold sticht),
 * Rang-Badge und Anwesenheits-Punkt. Fallback: Initialen.
 *
 * verein: null = neutraler Münchner (🥨 Koa Fuaßboi → grüner Ring);
 * Prop weglassen = ohne Vereins-Kontext (koa Ring).
 */
export const VEREIN_NEUTRAL_GRUEN = '#4C7C43';

export function Avatar({
  src,
  name = '',
  size = 48,
  ring = false,
  verein,
  badge = null,
  present = false,
  style = {},
}: {
  src?: string | null;
  name?: string;
  size?: number;
  ring?: boolean;
  verein?: string | null;
  badge?: React.ReactNode;
  present?: boolean;
  style?: React.CSSProperties;
}) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const ringWidth = Math.max(2, Math.round(size * 0.05));
  const vereinsFarbe =
    verein === 'bayern' ? '#DC052D' : verein === 'sechzig' ? '#1E9CD7' : verein === null ? VEREIN_NEUTRAL_GRUEN : null;
  const border = ring
    ? `${ringWidth}px solid var(--gold)`
    : vereinsFarbe
      ? `${ringWidth}px solid ${vereinsFarbe}`
      : '1px solid var(--ink-100)';
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none', ...style }}>
      <div
        style={{
          width: size, height: size, borderRadius: 'var(--r-pill)',
          overflow: 'hidden', background: 'var(--ink-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border,
          boxShadow: ring ? 'var(--sh-gold)' : 'var(--sh-xs)',
          boxSizing: 'border-box',
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: size * 0.36, color: 'var(--ink-500)' }}>
            {initials}
          </span>
        )}
      </div>
      {present && (
        <span
          style={{
            position: 'absolute', right: 0, bottom: 0, width: size * 0.28, height: size * 0.28,
            borderRadius: 'var(--r-pill)', background: 'var(--erfolg)',
            border: '2px solid var(--weiss)', boxSizing: 'border-box',
          }}
        />
      )}
      {badge != null && (
        <span
          style={{
            position: 'absolute', right: -2, top: -2, minWidth: size * 0.4, height: size * 0.4,
            padding: '0 4px', borderRadius: 'var(--r-pill)', background: 'var(--gold)',
            color: 'var(--navy-900)', fontFamily: 'var(--font-ui)', fontWeight: 800,
            fontSize: size * 0.24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--weiss)', boxSizing: 'border-box',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

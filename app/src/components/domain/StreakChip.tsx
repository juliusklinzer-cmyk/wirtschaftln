/**
 * Serien-Anzeige wie im Design-Prototyp (RanglisteScreen.jsx):
 * 🔥 positive Serie · 🥶 negative Serie (ab 2 Fehltagen in Folge) ·
 * ⚠️ „wackelt" — entscheidet der Aufrufer (V2: ab 3 unentschuldigten
 * Fehlterminen in Folge, siehe WACKELT_AB_UNENTSCHULDIGT).
 */
export function StreakChip({
  streak,
  bestStreak,
  wackelt = false,
  size = 'md',
}: {
  streak: number;
  bestStreak?: number;
  wackelt?: boolean;
  size?: 'sm' | 'md';
}) {
  if (streak === 0 || (streak === -1 && !wackelt)) return null;
  const positiv = streak > 0;
  const icon = wackelt ? '⚠️' : positiv ? '🔥' : '🥶';
  const label = wackelt ? `${streak} · wackelt` : positiv ? `+${streak} Serie` : `${streak} Serie`;
  const farbe = wackelt ? 'var(--strafe)' : positiv ? 'var(--gold-700)' : 'var(--ink-500)';
  const hintergrund = wackelt ? 'var(--strafe-bg)' : positiv ? 'var(--pergament)' : 'var(--ink-50)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: size === 'sm' ? '3px 8px' : '4px 10px',
        borderRadius: 999,
        background: hintergrund,
        border: `1px solid ${wackelt ? 'var(--strafe)' : positiv ? 'var(--pergament-edge)' : 'var(--ink-100)'}`,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 800,
        color: farbe,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{icon}</span>
      {label}
      {bestStreak != null && bestStreak > 0 && (
        <span style={{ fontWeight: 600, color: 'var(--ink-300)' }}>· Rekord {bestStreak}</span>
      )}
    </span>
  );
}

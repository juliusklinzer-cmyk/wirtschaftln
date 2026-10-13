/**
 * Bereichs-Überschrift auf Hoam (Redesign 13.10.2026): nur noch EINE Zeile
 * pro Bereich, Fraktur in Navy, optional rechts eine kleine Aktion („+ Neue“).
 */
export function HoamTitel({ children, action = null }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '0 4px' }}>
      <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, lineHeight: 1, color: 'var(--navy)' }}>{children}</span>
      {action}
    </div>
  );
}

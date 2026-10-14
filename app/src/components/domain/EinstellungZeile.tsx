/**
 * Eine Zeile in der Einstellungs-Karte (Profil-Redesign 1a): Icon-Kachel in
 * Info-Blau, Titel, Untertitel, rechts a Schalter oder Pfeil.
 */
export function EinstellungZeile({ icon, iconFarbe = 'var(--navy)', titel, unter, rechts, onClick, letzte = false }: { icon: React.ReactNode; iconFarbe?: string; titel: string; unter?: string; rechts?: React.ReactNode; onClick?: () => void; letzte?: boolean }) {
  return (
    <div onClick={onClick} role={onClick ? 'button' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: letzte ? 'none' : '1px solid var(--ink-50)', cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--info-bg)', color: iconFarbe, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{titel}</span>
        {unter && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{unter}</span>}
      </div>
      {rechts}
    </div>
  );
}

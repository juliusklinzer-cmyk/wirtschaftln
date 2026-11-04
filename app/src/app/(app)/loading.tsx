/**
 * Ladezustand beim Tab-Wechsel (04.11.2026): ohne den passierte nach dem
 * Antippen sichtbar nix, bis der Server die ganze Seite fertig hatte, am
 * iPhone wirkte das Menü dann wia tot. Jetzt kommt sofort ein Gerüst.
 */
export default function Laden() {
  const block = (hoehe: number, radius = 20): React.CSSProperties => ({ height: hoehe, borderRadius: radius, background: 'var(--ink-100)', animation: 'wnLaden 1.1s ease-in-out infinite alternate' });
  return (
    <div aria-busy="true" aria-label="Wird geladen" style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{'@keyframes wnLaden { from { opacity: 0.55 } to { opacity: 1 } } @media (prefers-reduced-motion: reduce) { [aria-busy] * { animation: none !important } }'}</style>
      <div style={{ ...block(170, 24), background: 'var(--navy)' }} />
      <div style={block(22, 8)} />
      <div style={block(120)} />
      <div style={block(90)} />
    </div>
  );
}

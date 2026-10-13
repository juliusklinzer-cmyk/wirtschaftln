/**
 * Stil-Bausteine der Navy-Gold-Karte („Hero“) auf Hoam und Termin (Redesign
 * 13.10.2026): Eyebrow in Gold, Fraktur-Titel, Zeile in Pergament, goldene
 * Hauptaktion, runde Icon-Knöpfe, halbtransparente Blöcke.
 */
export const eyebrowStil: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' };
export const titelStil: React.CSSProperties = { fontFamily: 'var(--font-fraktur)', fontWeight: 400, lineHeight: 1, margin: 0, color: 'var(--pergament)' };
export const zeileStil: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'rgba(246,240,226,0.75)' };
export const hinweisStil: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'rgba(246,240,226,0.6)', lineHeight: 1.5 };
export const goldKnopfStil: React.CSSProperties = {
  minHeight: 50, borderRadius: 'var(--r-md)', background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)',
  color: 'var(--navy-900)', fontSize: 16, fontWeight: 800, textDecoration: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
};
export const rundKnopfStil: React.CSSProperties = {
  width: 40, height: 40, flex: 'none', borderRadius: '50%', padding: 0, cursor: 'pointer',
  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
  color: 'var(--pergament)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
};
export const blockStil: React.CSSProperties = {
  padding: 14, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
  display: 'flex', flexDirection: 'column', gap: 10,
};
/** Kleiner Hinweis rechts neben einer Bereichs-Überschrift („du bist dabei“, „alle im Archiv“). */
export const bereichHinweisStil: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textDecoration: 'none', whiteSpace: 'nowrap' };
/** Eingabefeld im Redesign: 48 hoch, Radius 14, Haarlinie. */
export const feldStil: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', height: 48, padding: '0 14px', borderRadius: 14,
  border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', fontFamily: 'var(--font-ui)',
  fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', outline: 'none',
};
export const feldLabelStil: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--ink-700)' };

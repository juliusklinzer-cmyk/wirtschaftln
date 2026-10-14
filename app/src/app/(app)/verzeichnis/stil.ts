/** Kleine Status-Chips im Verzeichnis (blau Zahlen, grau inaktiv, gold Tokens, rot gesperrt, amber Anfragen). */
export function chipStil(ton: 'blau' | 'grau' | 'gold' | 'strafe' | 'amber'): React.CSSProperties {
  const f = {
    blau: { bg: 'var(--info-bg)', fg: 'var(--muc-blau)' },
    grau: { bg: '#EEF1F5', fg: 'var(--ink-500)' },
    gold: { bg: 'var(--pergament)', fg: 'var(--gold-700)' },
    strafe: { bg: 'var(--strafe-bg)', fg: 'var(--strafe)' },
    amber: { bg: '#FBF1D6', fg: '#B7791F' },
  }[ton];
  return { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: f.bg, color: f.fg, whiteSpace: 'nowrap', flex: 'none' };
}

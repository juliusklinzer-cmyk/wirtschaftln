'use client';

/**
 * Fehler-Grenze für den Gründungs-Wizard: passiert typisch, wenn die Seite
 * über einen Deploy hinweg offen war (Server Action gibt's nimmer). Statt
 * Zurückwerfen: freundlich sagen, was zu tun is — neu laden, Eingaben
 * sind zwei Minuten Arbeit.
 */
export default function GruendenFehler({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--grad-navy)' }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'var(--weiss)', borderRadius: 24, padding: '24px 22px', boxShadow: '0 10px 40px rgba(7,25,58,0.35)', textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>🍺</div>
        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 6 }}>Da is was schiefglaufen.</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-500)', lineHeight: 1.5, marginBottom: 18 }}>
          Meistens war die Seite nur z’lang offen (in der Zwischenzeit gab’s a Update). Einmal neu laden, dann geht’s.
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            window.location.reload();
          }}
          style={{
            width: '100%', minHeight: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'var(--grad-gold)', boxShadow: 'var(--sh-gold)', fontFamily: 'var(--font-ui)',
            fontSize: 16, fontWeight: 800, color: 'var(--navy-900)',
          }}
        >
          Seite neu laden
        </button>
      </div>
    </div>
  );
}

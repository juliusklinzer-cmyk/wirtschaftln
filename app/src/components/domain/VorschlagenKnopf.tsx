'use client';

/**
 * „Vorschlagen“ in der Planungs-Karte (Zustand 2b): klappt weiter unten die
 * „Wirtshaus gefunden?“-Klappe auf und scrollt hin. Koa eigenes Formular,
 * die Suche gibt’s nur einmal auf der Seite.
 */
export function VorschlagenKnopf({ ziel = 'wirtshaus-gfunden' }: { ziel?: string }) {
  return (
    <button
      type="button"
      className="wn-press"
      onClick={() => {
        const el = document.getElementById(ziel) as HTMLDetailsElement | null;
        if (!el) return;
        el.open = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}
      style={{
        flex: 'none', border: '1px solid rgba(255,255,255,0.35)', background: 'transparent',
        borderRadius: 'var(--r-pill)', padding: '7px 12px', fontFamily: 'var(--font-ui)',
        fontSize: 12, fontWeight: 800, color: 'var(--pergament)', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      Vorschlagen
    </button>
  );
}

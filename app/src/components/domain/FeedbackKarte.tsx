'use client';

import { useState, useTransition } from 'react';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { goldKnopfStil } from '@/components/domain/hero-stil';

const feldStil: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 120, padding: '12px 14px', borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-900)', outline: 'none', resize: 'vertical' };

/**
 * Feedback zur App (nur in den neuen Stammtischen): freier Text an die
 * Wirtschaftln-Macher. Nach dem Schicken Erfolgsmeldung, dann klappt's zu.
 */
export function FeedbackKarte({ schicken, fertig }: { schicken: (text: string) => Promise<{ fehler?: string }>; fertig: () => void }) {
  const [text, setText] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [gschickt, setGschickt] = useState(false);
  const [laeuft, starte] = useTransition();

  const abschicken = (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(null);
    starte(async () => {
      const r = await schicken(text);
      if (r.fehler) return setFehler(r.fehler);
      setGschickt(true);
      setText('');
      setTimeout(fertig, 2500);
    });
  };

  if (gschickt) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'var(--erfolg-bg)' }}>
        <CheckCircle size={24} weight="fill" color="var(--erfolg)" />
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--erfolg)' }}>Vergelt’s Gott! Dein Feedback ist angekommen.</span>
      </div>
    );
  }

  return (
    <form onSubmit={abschicken} style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-700)' }}>
        Was fehlt dir, was nervt, was wünschst du dir? Schreib’s frei raus, das lesen die Macher vom Wirtschaftln direkt.
      </span>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={2000} required placeholder="z. B. Ich hätte gern eine Erinnerung am Tag vom Stammtisch." style={feldStil} />
      {fehler && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)' }}>{fehler}</span>}
      <button type="submit" className="wn-press" disabled={laeuft || text.trim().length < 3} style={{ ...goldKnopfStil, minHeight: 48, fontSize: 15, opacity: laeuft || text.trim().length < 3 ? 0.6 : 1 }}>
        <PaperPlaneTilt size={18} weight="fill" />{laeuft ? 'Wird geschickt …' : 'Feedback schicken'}
      </button>
    </form>
  );
}

import { notFound } from 'next/navigation';
import { HELLE, WEISSBIERE } from '@/lib/biersorten';
import { deckelFuer } from '@/lib/bierdeckel';
import { DeckelGrafik } from '@/components/domain/DeckelGrafik';

/**
 * Dev-Vorschau: alle Bierdeckel auf einen Blick (nur lokal, in Produktion 404).
 * http://localhost:3010/dev/bierdeckel
 */
export default function BierdeckelVorschau() {
  if (process.env.NODE_ENV === 'production') notFound();
  const sorten = [...HELLE, ...WEISSBIERE].map((b) => b.name);
  const gesehen = new Set<string>();
  const beispiele = ['Augustiner', ...sorten, 'Unbekanntes Bräu'].filter((s) => {
    const d = deckelFuer(s);
    const key = d.art === 'marke' ? d.slug : d.art === 'neutral' ? `neutral:${d.name}` : d.art;
    if (gesehen.has(key)) return false;
    gesehen.add(key);
    return true;
  });
  return (
    <div style={{ padding: 24, background: 'var(--bg-app)', minHeight: '100dvh', display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {beispiele.map((s) => (
        <div key={s} style={{ width: 264, textAlign: 'center' }}>
          <div style={{ width: 264, height: 264, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '2.5%', borderRadius: '50%', boxShadow: '0 10px 22px rgba(30,28,24,0.28), 0 2px 5px rgba(30,28,24,0.16)' }} />
            <DeckelGrafik deckel={deckelFuer(s)} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', marginTop: 8 }}>{s}</div>
        </div>
      ))}
    </div>
  );
}

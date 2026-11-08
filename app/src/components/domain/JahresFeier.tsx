'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { Scroll } from '@phosphor-icons/react/dist/ssr/Scroll';
import { ShareNetwork } from '@phosphor-icons/react/dist/ssr/ShareNetwork';
import { BadgeBild } from '@/components/domain/BadgeBild';
import { Urkunde, urkundeAlsBild, type UrkundeDaten } from '@/components/domain/Urkunde';

export type JahresFeierEintrag = {
  key: string;
  /** „Präsident“, „Maximator“ */
  name: string;
  slug: string | null;
  icon: string;
  jahr: number;
  spruch: string;
  urkunde: UrkundeDaten | null;
};

const GOLD = ['#E6C684', '#D0AD66', '#FFD700', '#F6F0E2', '#E6C684', '#FFF3C4'];
const GRAD_GOLD = 'linear-gradient(180deg,#E6C684 0%,#D0AD66 45%,#A6843E 100%)';
const cl = (x: number) => Math.max(0, Math.min(1, x));
const io = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * Silvester-Feier „Der des Jahres“ (Weihnachten & Silvester Redesign 2a/2b):
 * goldenes Feuerwerk, die Jahreszahl groß hinter dem Badge, Gravur-Band mit
 * Name und Jahr, „Gratuliere!“, dazu Urkunde und Teilen. Einmal pro Gerät,
 * bei mehreren Titeln nacheinander.
 */
export function JahresFeier({ jahr, vorname, feiern }: { jahr: number; vorname: string; feiern: JahresFeierEintrag[] }) {
  const [offen, setOffen] = useState<JahresFeierEintrag[]>([]);
  const [index, setIndex] = useState(0);
  const [t, setT] = useState(0);
  const [urkunde, setUrkunde] = useState(false);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [ruhig, setRuhig] = useState(false);

  useEffect(() => {
    const key = `wn_gfeiert_jahr-${jahr}`;
    let gfeiert: string[] = [];
    try { gfeiert = JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { gfeiert = []; }
    const neue = feiern.filter((f) => !gfeiert.includes(f.key));
    if (neue.length === 0) return;
    setOffen(neue);
    try { localStorage.setItem(key, JSON.stringify([...gfeiert, ...neue.map((f) => f.key)])); } catch { /* egal */ }
    setRuhig(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, [jahr, feiern]);

  // Uhr für Feuerwerk (8-s-Schleife wie im Entwurf) und Einblenden, startet je Titel neu
  useEffect(() => {
    if (offen.length === 0) return;
    let raf = 0;
    const t0 = performance.now();
    const lauf = (n: number) => { setT((n - t0) / 1000); raf = requestAnimationFrame(lauf); };
    if (ruhig) setT(8);
    else raf = requestAnimationFrame(lauf);
    return () => cancelAnimationFrame(raf);
  }, [offen.length, index, ruhig]);

  useEffect(() => {
    if (!hinweis) return;
    const h = setTimeout(() => setHinweis(null), 2200);
    return () => clearTimeout(h);
  }, [hinweis]);

  const f = offen[index];
  if (!f) return null;
  const zu = () => (index < offen.length - 1 ? (setIndex(index + 1), setUrkunde(false)) : setOffen([]));

  // Einblenden läuft einmal, das Feuerwerk in Schleife weiter
  const einmal = Math.min(t, 8);
  const tx = (d: number) => { const q = io(cl((einmal - d) / 0.5)); return { opacity: q, transform: `translateY(${14 * (1 - q)}px)` }; };
  const p = cl((einmal - 0.3) / 0.9);

  const funken: React.ReactNode[] = [];
  if (!ruhig) {
    const tf = t % 8;
    for (let r = 0; r < 8; r++) {
      const x = 10 + ((r * 41) % 80), y = 6 + ((r * 59) % 45), d = 0.1 + r * 0.5;
      const ph = tf > d ? ((tf - d) % 2) / 2 : -1;
      if (ph < 0) continue;
      for (let k = 0; k < 16; k++) {
        const w = (k / 16) * Math.PI * 2, rad = (60 + ((r * 7 + k * 13) % 45)) * io(ph), col = GOLD[r % 6];
        funken.push(<span key={`${r}-${k}`} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 4, height: 4, borderRadius: 99, background: col, boxShadow: `0 0 8px ${col}`, transform: `translate(${Math.cos(w) * rad}px,${Math.sin(w) * rad + ph * 30}px) scale(${1 - 0.8 * ph})`, opacity: ph < 0.7 ? 1 : 1 - (ph - 0.7) / 0.3 }} />);
      }
    }
  }

  const teilen = async () => {
    if (!f.urkunde) return;
    try {
      const blob = await urkundeAlsBild(f.urkunde);
      const datei = new File([blob], `${f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${f.jahr}.png`, { type: 'image/png' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [datei] })) {
        await navigator.share({ files: [datei], title: `${f.name} des Jahres ${f.jahr}` });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = datei.name;
        a.click();
        setHinweis('Bild gespeichert, zum Teilen aus der Galerie schicken.');
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) setHinweis('Des hat ned klappt, probier’s nochmal.');
    }
  };

  const nebenKnopf: React.CSSProperties = { height: 48, padding: '0 20px', borderRadius: 14, background: 'rgba(246,240,226,0.1)', border: '1px solid rgba(230,198,132,0.5)', color: '#E6C684', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, cursor: 'pointer' };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${f.name} des Jahres ${f.jahr}`} style={{ position: 'fixed', inset: 0, zIndex: 95, maxWidth: 'var(--container-app)', margin: '0 auto', overflow: 'hidden', background: 'radial-gradient(circle at 50% 30%,#123E78 0%,#07193A 70%)', fontFamily: 'var(--font-ui)' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{funken}</div>
      <span aria-hidden style={{ position: 'absolute', left: '50%', top: 'calc(110px + var(--wn-oben))', transform: 'translateX(-50%)', fontFamily: 'var(--font-fraktur)', fontSize: 260, lineHeight: 1, color: '#E6C684', opacity: cl((einmal - 0.1) / 0.8) * 0.14, letterSpacing: '-0.04em', pointerEvents: 'none' }}>{f.jahr}</span>
      <button type="button" onClick={zu} aria-label="Schließen" style={{ position: 'absolute', right: 16, top: 'calc(14px + var(--wn-oben))', zIndex: 2, width: 36, height: 36, borderRadius: 99, border: 'none', background: 'rgba(246,240,226,0.12)', color: '#F6F0E2', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={17} /></button>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(30px + var(--wn-oben)) 28px calc(24px + env(safe-area-inset-bottom))', textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D0AD66', marginBottom: 14 }}>Silvester · Saisonende</span>
        <div style={{ transform: `scale(${0.6 + 0.4 * io(p)})`, opacity: cl(p * 2), filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.5))' }}>
          <BadgeBild slug={f.slug} icon={f.icon} name={f.name} size={190} />
        </div>
        <div style={{ ...tx(0.9), marginTop: -10, padding: '8px 22px', borderRadius: 99, background: GRAD_GOLD, color: '#07193A', fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }}>{f.name} · {f.jahr}</div>
        <span style={{ ...tx(1.1), fontFamily: 'var(--font-fraktur)', fontSize: 38, lineHeight: 1, color: '#E6C684', marginTop: 20, textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>Gratuliere, {vorname}!</span>
        <span style={{ ...tx(1.3), fontSize: 18, fontWeight: 800, lineHeight: 1.3, color: '#F6F0E2', marginTop: 6 }}>Du bist {f.name.startsWith('Die ') ? f.name : `der ${f.name}`} des Jahres {f.jahr}</span>
        <span style={{ ...tx(1.5), fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'rgba(246,240,226,0.85)', maxWidth: 300, marginTop: 10 }}>{f.spruch}</span>
        <span style={{ ...tx(1.8), fontSize: 12, fontWeight: 700, lineHeight: 1.5, color: '#D0AD66', maxWidth: 290, marginTop: 14 }}>Damit gehst du in die Geschichte des Stammtischs ein. Name und Jahr bleiben für immer im Badge.</span>
        <div style={{ ...tx(2.1), display: 'flex', gap: 10, marginTop: 26 }}>
          {f.urkunde && <button type="button" onClick={() => setUrkunde(true)} style={nebenKnopf}><Scroll size={18} />Urkunde</button>}
          {f.urkunde && <button type="button" onClick={teilen} style={nebenKnopf}><ShareNetwork size={18} />Teilen</button>}
        </div>
        {offen.length > 1 && (
          <button type="button" onClick={zu} style={{ ...tx(2.3), marginTop: 18, border: 'none', background: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, color: 'rgba(246,240,226,0.75)', cursor: 'pointer' }}>
            {index < offen.length - 1 ? `Weiter (${index + 1}/${offen.length})` : 'Fertig'}
          </button>
        )}
        {hinweis && <span role="status" style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: '#E6C684' }}>{hinweis}</span>}
      </div>
      {urkunde && f.urkunde && <Urkunde daten={f.urkunde} onClose={() => setUrkunde(false)} />}
    </div>,
    document.body,
  );
}

'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Gift } from '@phosphor-icons/react/dist/ssr/Gift';
import { ShareNetwork } from '@phosphor-icons/react/dist/ssr/ShareNetwork';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { goldKnopfStil } from '@/components/domain/hero-stil';
import { tokenWidmen } from '@/app/(app)/profil/actions';

/** „Sepp aus Regensburg“ → „Sepp“ (wie beim Teilen im Profil) */
const anredeAus = (widmung: string) => widmung.split(/\s+(?:aus|von|vom)\s+|,/)[0].trim() || widmung;

/**
 * Weihnachtsgeschenk (Jahresabschluss 2026): Popup auf Hoam, solang der
 * Geschenk-Token no ned gewidmet is und das Gerät’s no ned gsehn hat.
 * Für wen? eintragen, „Personalisieren und teilen“ widmet den Token und
 * macht das Teilen-Blatt auf. Der Token bleibt aa im Profil.
 */
export function WeihnachtsGeschenk({ vorname, token, link, jahr, gewidmet, danach }: { vorname: string; token: string; link: string; jahr: number; /** Scho gewidmet (z. B. im Profil) → koa Popup */ gewidmet: boolean; /** Erst nach dem Popup zeigen (z. B. die Jahressieger-Feier), damit sich nix überlagert */ danach?: React.ReactNode }) {
  const schluessel = `wn_weihnachten_${jahr}`;
  const [zustand, setZustand] = useState<'pruefen' | 'auf' | 'zu'>('pruefen');
  const auf = zustand === 'auf';
  const [widmung, setWidmung] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [fertig, setFertig] = useState(false);
  const [laeuft, starte] = useTransition();

  useEffect(() => {
    let gsehn = false;
    try {
      gsehn = gewidmet || !!localStorage.getItem(schluessel);
    } catch { /* koa Speicher → trotzdem zeigen */ }
    setZustand(gsehn ? 'zu' : 'auf');
    // Nur beim ersten Öffnen entscheiden: nach dem Widmen bleibt’s offen für „Fertig“
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel]);

  const zu = () => {
    try { localStorage.setItem(schluessel, '1'); } catch { /* egal */ }
    setZustand('zu');
  };

  const teilen = () =>
    starte(async () => {
      setFehler(null);
      const r = await tokenWidmen(token, widmung);
      if (r.fehler) { setFehler(r.fehler); return; }
      const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
      const text = `${anredeAus(widmung.trim())}, den Token schenk i dir zu Weihnachten. Gründ’s euren Stammtisch:`;
      try {
        if (nav.share) await nav.share({ title: 'Gründe deinen eigenen Stammtisch', text, url: link });
        else await navigator.clipboard.writeText(`${text} ${link}`);
      } catch { /* abgebrochen, gewidmet is er trotzdem */ }
      setFertig(true);
    });

  if (zustand === 'zu') return <>{danach}</>;
  if (!auf) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Frohe Weihnachten" style={{ position: 'fixed', inset: 0, zIndex: 90, maxWidth: 'var(--container-app)', margin: '0 auto', overflowY: 'auto', background: 'radial-gradient(120% 80% at 50% 0%, #1B4C8A 0%, #0C2B5A 50%, #07193A 100%)', color: 'var(--pergament)' }}>
      <style>{`
        @keyframes wnSchnee { from { transform: translateY(-10vh); } to { transform: translateY(110vh); } }
        @keyframes wnGeschenk { 0% { transform: scale(0.6) rotate(-8deg); opacity: 0; } 60% { transform: scale(1.08) rotate(3deg); opacity: 1; } 100% { transform: scale(1) rotate(0); } }
        @media (prefers-reduced-motion: reduce) { .wn-flocke { display: none; } .wn-geschenk { animation: none !important; } }
      `}</style>
      {/* Schnee, dezent */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 22 }, (_, i) => (
          <span key={i} className="wn-flocke" style={{ position: 'absolute', left: `${(i * 47) % 100}%`, top: 0, width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: '50%', background: 'rgba(246,240,226,0.7)', animation: `wnSchnee ${9 + (i % 5) * 2}s linear ${-(i * 1.3)}s infinite` }} />
        ))}
      </div>
      <div style={{ position: 'relative', minHeight: '100%', boxSizing: 'border-box', padding: 'calc(40px + var(--wn-oben)) 24px calc(32px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
        <span className="wn-geschenk" style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--grad-gold)', color: 'var(--navy-900)', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 8px rgba(208,173,102,0.18), 0 14px 40px rgba(0,0,0,0.35)', animation: 'wnGeschenk 700ms cubic-bezier(0.32, 0.72, 0, 1) both' }}>
          <Gift size={48} weight="fill" />
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-bright)' }}>Weihnachten {jahr}</span>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-fraktur)', fontSize: 40, lineHeight: 1.05, color: 'var(--pergament)' }}>Frohe Weihnachten, {vorname}!</h2>
        <p style={{ margin: 0, maxWidth: 320, fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: 'rgba(246,240,226,0.85)' }}>
          Unterm Christbaum liegt dein persönlicher Einladungstoken. Du kannst jetzt einen Stammtisch einladen.
        </p>

        {/* Der Token als Ticket */}
        <div style={{ width: '100%', maxWidth: 340, borderRadius: 18, background: 'var(--pergament)', color: 'var(--navy)', padding: '16px 18px', border: '2px dashed var(--gold)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>Dein Einladungstoken</span>
          <span className="wn-tnum" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em' }}>{token}</span>
        </div>

        {fertig ? (
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: 'var(--gold-bright)' }}>
              <CheckCircle size={22} weight="fill" />Gewidmet für {widmung.trim()}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'rgba(246,240,226,0.75)' }}>Den Token findest du jederzeit im Menü unter Profil.</span>
            <button type="button" className="wn-press" onClick={zu} style={{ ...goldKnopfStil, width: '100%' }}>Frohe Weihnachten!</button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            <label htmlFor="wn-widmung" style={{ fontSize: 13, fontWeight: 800, color: 'var(--pergament)' }}>Für wen ist er?</label>
            <input
              id="wn-widmung"
              value={widmung}
              onChange={(e) => setWidmung(e.target.value)}
              placeholder="z. B. Sepp aus Regensburg"
              maxLength={60}
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 50, padding: '12px 14px', borderRadius: 14, border: '1.5px solid rgba(230,198,132,0.6)', background: 'rgba(255,255,255,0.08)', color: 'var(--pergament)', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 600, outline: 'none' }}
            />
            {fehler && <span style={{ fontSize: 12, fontWeight: 700, color: '#F2A7A0' }}>{fehler}</span>}
            <button type="button" className="wn-press" disabled={laeuft || widmung.trim().length < 2} onClick={teilen} style={{ ...goldKnopfStil, width: '100%', opacity: laeuft || widmung.trim().length < 2 ? 0.6 : 1 }}>
              <ShareNetwork size={18} weight="bold" />{laeuft ? 'Moment …' : 'Personalisieren und teilen'}
            </button>
            <button type="button" onClick={zu} style={{ alignSelf: 'center', border: 'none', background: 'none', padding: 8, fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: 'rgba(246,240,226,0.7)', cursor: 'pointer' }}>
              Später, er liegt im Profil
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

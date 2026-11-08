'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Gift } from '@phosphor-icons/react/dist/ssr/Gift';
import { Ticket } from '@phosphor-icons/react/dist/ssr/Ticket';
import { Copy } from '@phosphor-icons/react/dist/ssr/Copy';
import { Check } from '@phosphor-icons/react/dist/ssr/Check';
import { ShareNetwork } from '@phosphor-icons/react/dist/ssr/ShareNetwork';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { tokenWidmen } from '@/app/(app)/profil/actions';

const GRAD_GOLD = 'linear-gradient(180deg,#E6C684 0%,#D0AD66 45%,#A6843E 100%)';
const LICHTER = ['#E6C684', '#DC052D', '#1E9CD7', '#F6F0E2', '#2E8B57'];
const cl = (x: number) => Math.max(0, Math.min(1, x));
const io = (x: number) => 1 - Math.pow(1 - x, 3);

/** „Sepp aus Regensburg“ → „Sepp“ (wie beim Teilen im Profil) */
const anredeAus = (widmung: string) => widmung.split(/\s+(?:aus|von|vom)\s+|,/)[0].trim() || widmung;

/**
 * Weihnachten (Weihnachten & Silvester Redesign 1a–1c): Beim ersten Öffnen
 * in der Weihnachtszeit geht das Packerl auf, Tannengrün, Lichterkette und
 * Schnee. „Auspacken“ hebt den Deckel, der Token steigt raus, Link zum
 * Kopieren und „Per WhatsApp verschenken“ (vorher sagt man, für wen er is).
 * Bis zum 6.1. steht oben auf Hoam die Hinweiszeile, solang er ned verschenkt is.
 */
export function WeihnachtsGeschenk({
  vorname,
  token,
  link,
  jahr,
  gewidmet,
  weihnachtszeit,
  danach,
}: {
  vorname: string;
  token: string;
  link: string;
  jahr: number;
  /** Scho gewidmet (z. B. im Profil) → koa Popup, koa Hinweis */
  gewidmet: boolean;
  /** 24.12. bis 6.1.: Popup und Hinweiszeile */
  weihnachtszeit: boolean;
  /** Erst nach dem Popup zeigen (z. B. die Silvester-Feier), damit sich nix überlagert */
  danach?: React.ReactNode;
}) {
  const schluessel = `wn_weihnachten_${jahr}`;
  const [zustand, setZustand] = useState<'pruefen' | 'auf' | 'zu'>('pruefen');
  const [ausgepackt, setAusgepackt] = useState(false);
  const [verschenkt, setVerschenkt] = useState<string | null>(null);
  const [widmung, setWidmung] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [kopiert, setKopiert] = useState(false);
  const [laeuft, starte] = useTransition();
  const [t, setT] = useState(0);
  const [t0, setT0] = useState(0);
  const [ruhig, setRuhig] = useState(false);

  useEffect(() => {
    let gsehn = gewidmet || !weihnachtszeit;
    try {
      gsehn = gsehn || !!localStorage.getItem(schluessel);
    } catch { /* koa Speicher → trotzdem zeigen */ }
    setRuhig(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    setZustand(gsehn ? 'zu' : 'auf');
    // Nur beim ersten Öffnen entscheiden: nach dem Widmen bleibt’s offen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel]);

  // Uhr für Schnee, Lichter und das Auspacken (nur solang das Popup offen is)
  useEffect(() => {
    if (zustand !== 'auf') return;
    let raf = 0;
    const start = performance.now();
    const lauf = (n: number) => { setT((n - start) / 1000); raf = requestAnimationFrame(lauf); };
    raf = requestAnimationFrame(lauf);
    return () => cancelAnimationFrame(raf);
  }, [zustand]);

  const zu = () => {
    try { localStorage.setItem(schluessel, '1'); } catch { /* egal */ }
    setZustand('zu');
  };
  const aufmachen = () => {
    // Von der Hinweiszeile: gleich ausgepackt, Paket schon offen
    setAusgepackt(true);
    setT0(-10);
    setZustand('auf');
  };
  const auspacken = () => { setT0(t); setAusgepackt(true); };

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1800);
    } catch { /* koa Clipboard, der Link steht ja lesbar da */ }
  };

  const verschenken = () =>
    starte(async () => {
      setFehler(null);
      const fuer = widmung.trim();
      const r = await tokenWidmen(token, fuer);
      if (r.fehler) { setFehler(r.fehler); return; }
      const text = `${anredeAus(fuer)}, den Token schenk i dir zu Weihnachten. Gründ’s euren Stammtisch:`;
      const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
      try {
        if (nav.share) await nav.share({ title: 'Gründe deinen eigenen Stammtisch', text, url: link });
        else window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`, '_blank');
      } catch { /* abgebrochen, gewidmet is er trotzdem */ }
      setVerschenkt(fuer);
    });

  // Hinweiszeile oben auf Hoam (1c), solang er ned verschenkt is
  const hinweisZeile = weihnachtszeit && !gewidmet && !verschenkt && zustand === 'zu' ? (
    <button type="button" onClick={aufmachen} className="wn-press" style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', borderRadius: 16, background: 'linear-gradient(135deg,#0B2A1F,#14432F)', border: '1.5px solid #D0AD66', color: '#F6F0E2', textAlign: 'left', fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(230,198,132,0.15)', display: 'grid', placeItems: 'center', flex: 'none' }}><Gift size={22} weight="fill" color="#E6C684" /></span>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#E6C684' }}>Dein Weihnachts-Token wartet</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(246,240,226,0.8)' }}>Verschenk einen Stammtisch an wen du magst.</span>
      </span>
      <CaretRight size={18} color="#E6C684" />
    </button>
  ) : null;

  if (zustand === 'pruefen') return null;
  if (zustand === 'zu') return <>{hinweisZeile}{danach}</>;

  // ── Popup (1a zu, 1b offen) ──
  const zeit = ruhig ? 0 : t;
  const tAuf = ausgepackt ? (ruhig ? 9 : t - t0) : 0;
  const op = ausgepackt ? io(cl((tAuf - 0.2) / 0.7)) : 0;
  const wackeln = ausgepackt || ruhig ? 0 : Math.sin(zeit * 6) * (Math.sin(zeit * 0.9) > 0.6 ? 3 : 0);
  const rein = (d: number) => { const q = io(cl((tAuf - d) / 0.5)); return { opacity: q, transform: `translateY(${12 * (1 - q)}px)` }; };

  const schnee = ruhig ? null : Array.from({ length: 40 }, (_, i) => {
    const sp = 14 + (i * 7) % 12, x = (i * 37) % 100, sz = 3 + (i % 3) * 1.5;
    const y = ((zeit * sp) + i * 53) % 900 - 20, sway = Math.sin(zeit * 1.3 + i) * 10;
    return <span key={i} style={{ position: 'absolute', left: `calc(${x}% + ${sway}px)`, top: y, width: sz, height: sz, borderRadius: 99, background: '#fff', opacity: 0.55 + (i % 3) * 0.15, boxShadow: '0 0 4px rgba(255,255,255,0.6)' }} />;
  });

  const lichter = (
    <svg aria-hidden width="100%" height={70} viewBox="0 0 390 70" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 'calc(8px + var(--wn-oben))' }}>
      <path d="M-10 10 Q 195 70 400 10" fill="none" stroke="#1F5A42" strokeWidth={2.5} />
      {Array.from({ length: 11 }, (_, i) => {
        const x = 10 + i * 37, u = (x + 10) / 410, y = 10 + 2 * (1 - u) * u * 60;
        const an = ruhig || Math.sin(zeit * 3 + i * 1.1) > -0.3, f = LICHTER[i % 5];
        return (
          <g key={i}>
            <rect x={x - 2} y={y} width={4} height={6} fill="#0A3A2A" />
            <ellipse cx={x} cy={y + 13} rx={5} ry={7} fill={f} opacity={an ? 1 : 0.35} style={{ filter: an ? `drop-shadow(0 0 6px ${f})` : 'none' }} />
          </g>
        );
      })}
    </svg>
  );

  const goldBand = (links: number) => <div style={{ position: 'absolute', left: links, top: 0, width: 28, height: '100%', background: 'linear-gradient(90deg,#D0AD66,#E6C684,#D0AD66)' }} />;
  const packerl = (
    <div style={{ position: 'relative', width: 220, height: 220, marginTop: 10, flex: 'none' }}>
      <div style={{ position: 'absolute', left: 20, bottom: 0, width: 180, height: 150, borderRadius: 14, background: 'linear-gradient(180deg,#C8102E,#9B0A22)', boxShadow: '0 20px 40px rgba(0,0,0,0.45)' }}>{goldBand(76)}</div>
      <div style={{ position: 'absolute', left: 8, bottom: 140 - op * 120, width: 204, height: 40, borderRadius: 12, background: 'linear-gradient(180deg,#DC2B47,#B5122E)', boxShadow: '0 8px 20px rgba(0,0,0,0.35)', transform: `rotate(${-op * 22}deg) translateX(${-op * 60}px)`, transformOrigin: 'left bottom' }}>
        {goldBand(88)}
        {op < 0.3 && (
          <div style={{ position: 'absolute', left: 70, top: -26, width: 64, height: 34 }}>
            <span style={{ position: 'absolute', left: 0, top: 6, width: 30, height: 24, borderRadius: '99px 99px 99px 4px', border: '7px solid #E6C684', transform: 'rotate(-20deg)' }} />
            <span style={{ position: 'absolute', right: 0, top: 6, width: 30, height: 24, borderRadius: '99px 99px 4px 99px', border: '7px solid #E6C684', transform: 'rotate(20deg)' }} />
          </div>
        )}
      </div>
      {ausgepackt && (
        <div style={{ position: 'absolute', left: 40, bottom: 60 + op * 110, width: 140, height: 90, borderRadius: 16, background: GRAD_GOLD, boxShadow: '0 0 0 3px #07193A, 0 0 0 5px #E6C684, 0 18px 40px rgba(230,198,132,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: cl(op * 2), transform: `scale(${0.6 + 0.4 * op})` }}>
          <Ticket size={30} weight="fill" color="#07193A" />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#07193A' }}>Gründungs-Token</span>
        </div>
      )}
    </div>
  );

  const goldKnopf: React.CSSProperties = { height: 52, width: '100%', maxWidth: 320, borderRadius: 14, border: 'none', background: GRAD_GOLD, color: '#07193A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, boxShadow: '0 6px 18px rgba(0,0,0,0.3)', cursor: 'pointer' };
  const leiseKnopf: React.CSSProperties = { border: 'none', background: 'none', padding: 6, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.6)', cursor: 'pointer' };
  const knopfAus = laeuft || widmung.trim().length < 2;

  const inhalt = !ausgepackt ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 26 }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D0AD66' }}>A Packerl für di</span>
      <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 40, lineHeight: 1, color: '#E6C684', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>Frohe Weihnachten!</span>
      <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'rgba(246,240,226,0.85)', maxWidth: 260 }}>Der Stammtisch hat dir was unter den Baum gelegt.</span>
      <button type="button" onClick={auspacken} className="wn-press" style={{ ...goldKnopf, width: 'auto', padding: '0 28px', marginTop: 10 }}><Gift size={18} weight="fill" />Auspacken</button>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 14, width: '100%' }}>
      <span style={{ ...rein(0.6), fontFamily: 'var(--font-fraktur)', fontSize: 34, lineHeight: 1, color: '#E6C684', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>Frohe Weihnachten, {vorname}!</span>
      <span style={{ ...rein(0.9), fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'rgba(246,240,226,0.9)', maxWidth: 300 }}>Dein eigener Gründungs-Token. Verschenk ihn an wen du magst, der darf damit einen eigenen Stammtisch starten.</span>
      <button type="button" onClick={kopieren} style={{ ...rein(1.2), display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 14, background: 'rgba(246,240,226,0.08)', border: '1px dashed rgba(230,198,132,0.6)', width: '100%', maxWidth: 320, marginTop: 6, cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#F6F0E2', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.replace(/^https?:\/\/[^/]+\//, '')}</span>
        {kopiert ? <Check size={18} color="#E6C684" weight="bold" /> : <Copy size={18} color="#E6C684" />}
      </button>
      {verschenkt ? (
        <>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#E6C684', marginTop: 6 }}>Verschenkt an {verschenkt}</span>
          <button type="button" onClick={zu} className="wn-press" style={goldKnopf}>Frohe Weihnachten!</button>
        </>
      ) : (
        <>
          <input
            value={widmung}
            onChange={(e) => setWidmung(e.target.value)}
            aria-label="Für wen ist der Token?"
            placeholder="Für wen? z. B. Sepp aus Regensburg"
            maxLength={60}
            style={{ ...rein(1.3), width: '100%', maxWidth: 320, boxSizing: 'border-box', minHeight: 48, padding: '12px 14px', borderRadius: 14, border: '1.5px solid rgba(230,198,132,0.5)', background: 'rgba(255,255,255,0.06)', color: '#F6F0E2', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 600, outline: 'none' }}
          />
          {fehler && <span style={{ fontSize: 12, fontWeight: 700, color: '#F2A7A0' }}>{fehler}</span>}
          <button type="button" onClick={verschenken} disabled={knopfAus} className="wn-press" style={{ ...goldKnopf, ...rein(1.4), opacity: (knopfAus ? 0.6 : 1) * rein(1.4).opacity }}>
            <ShareNetwork size={18} weight="fill" />{laeuft ? 'Moment …' : 'Per WhatsApp verschenken'}
          </button>
          <button type="button" onClick={zu} style={{ ...leiseKnopf, ...rein(1.6) }}>Später im Profil unter Gründungs-Token</button>
        </>
      )}
    </div>
  );

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Frohe Weihnachten" style={{ position: 'fixed', inset: 0, zIndex: 90, maxWidth: 'var(--container-app)', margin: '0 auto', overflow: 'hidden', background: 'radial-gradient(circle at 50% 30%,#14432F 0%,#0B2A1F 60%,#06181A 100%)', fontFamily: 'var(--font-ui)' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{schnee}</div>
      {lichter}
      {ausgepackt && <div aria-hidden style={{ position: 'absolute', left: '50%', top: '22%', width: 320, height: 320, marginLeft: -160, borderRadius: 999, background: 'radial-gradient(circle,rgba(230,198,132,0.5),transparent 65%)', opacity: op, pointerEvents: 'none' }} />}
      <button type="button" onClick={zu} aria-label="Schließen" style={{ position: 'absolute', right: 16, top: 'calc(14px + var(--wn-oben))', zIndex: 2, width: 36, height: 36, borderRadius: 99, border: 'none', background: 'rgba(246,240,226,0.12)', color: '#F6F0E2', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={17} /></button>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(70px + var(--wn-oben)) 28px calc(24px + env(safe-area-inset-bottom))', textAlign: 'center' }}>
        {/* Ausgepackt rückt das Packerl a bissl zamm, damit Ticket und Text unter der Lichterkette Platz haben */}
        <div style={{ transform: `rotate(${wackeln}deg) scale(${1 - 0.22 * op})`, marginTop: ausgepackt ? 40 * op : 0, marginBottom: -30 * op }}>{packerl}</div>
        {inhalt}
      </div>
    </div>,
    document.body,
  );
}

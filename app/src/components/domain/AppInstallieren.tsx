'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { Export } from '@phosphor-icons/react/dist/ssr/Export';
import { PlusSquare } from '@phosphor-icons/react/dist/ssr/PlusSquare';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import { DeviceMobileCamera } from '@phosphor-icons/react/dist/ssr/DeviceMobileCamera';
import { DeviceMobile } from '@phosphor-icons/react/dist/ssr/DeviceMobile';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { Compass } from '@phosphor-icons/react/dist/ssr/Compass';
import { Copy } from '@phosphor-icons/react/dist/ssr/Copy';
import { ArrowDown } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { goldKnopfStil } from '@/components/domain/hero-stil';
import { EinstellungZeile } from '@/components/domain/EinstellungZeile';

type Geraet = 'ios-safari' | 'ios-anderer' | 'android' | 'sonst';
type InstallPrompt = Event & { prompt: () => Promise<void> };

const HINWEIS_KEY = 'wn_install_hinweis'; // { mal, bis }
const KARTE_KEY = 'wn_install_karte'; // '1' = große Karte scho gsehen
const WIEDER_NACH_TAGEN = 14;
const MAX_WEGKLICKEN = 3;

/** Schon als App installiert (Home-Bildschirm)? Dann gibt's koan Hinweis. */
function istInstalliert(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function geraetErkennen(): Geraet {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) {
    // Chrome, Firefox, Edge, Opera und In-App-Browser (WhatsApp, Instagram, Facebook) können am iPhone ned installieren
    const anderer = /CriOS|FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|WhatsApp|Line\//.test(ua);
    return anderer ? 'ios-anderer' : 'ios-safari';
  }
  if (/Android/.test(ua)) return 'android';
  return 'sonst';
}

const LOGO_KACHEL: React.CSSProperties = { borderRadius: 11, background: 'radial-gradient(120% 90% at 50% 20%, #1B4C8A 0%, #0C2B5A 55%, #07193A 100%)', border: '1.5px solid var(--gold)', display: 'grid', placeItems: 'center', flex: 'none', boxShadow: '0 6px 14px rgba(12,43,90,0.25)' };

function Logo({ groesse }: { groesse: number }) {
  return (
    <span style={{ ...LOGO_KACHEL, width: groesse, height: groesse, borderRadius: Math.round(groesse / 4) }}>
      <Image src="/brand/rauten-app.svg" alt="" width={groesse} height={groesse} style={{ height: Math.round(groesse * 0.72), width: 'auto' }} />
    </span>
  );
}

/**
 * „App aufs Handy“ (App-installieren-Redesign 14.10.2026): nur im Browser,
 * nie in der installierten App. Auf Hoam beim ersten Mal die große Karte (2c),
 * danach der schmale Hinweis (1a) mit X: kommt nach 14 Tagen wieder, nach
 * dreimal Wegklicken nimmer. Die Anleitung is a Blatt je Gerät (1b/1c/2d).
 */
export function AppInstallieren({ variante }: { variante: 'hoam' | 'profil' }) {
  const [geraet, setGeraet] = useState<Geraet | null>(null);
  const [modus, setModus] = useState<'karte' | 'hinweis' | 'nix'>('nix');
  const [blatt, setBlatt] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    if (istInstalliert()) return;
    const g = geraetErkennen();
    if (g === 'sonst') return;
    setGeraet(g);
    const fang = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt); };
    window.addEventListener('beforeinstallprompt', fang);
    if (variante === 'hoam') {
      try {
        if (!localStorage.getItem(KARTE_KEY)) setModus('karte');
        else {
          const h = JSON.parse(localStorage.getItem(HINWEIS_KEY) ?? 'null') as { mal: number; bis: number } | null;
          if (!h || (h.mal < MAX_WEGKLICKEN && Date.now() > h.bis)) setModus('hinweis');
        }
      } catch { setModus('hinweis'); }
    }
    return () => window.removeEventListener('beforeinstallprompt', fang);
  }, [variante]);

  if (!geraet) return null;

  const karteWeg = () => { try { localStorage.setItem(KARTE_KEY, '1'); } catch { /* egal */ } setModus('nix'); };
  const hinweisWeg = () => {
    try {
      const h = JSON.parse(localStorage.getItem(HINWEIS_KEY) ?? 'null') as { mal: number } | null;
      localStorage.setItem(HINWEIS_KEY, JSON.stringify({ mal: (h?.mal ?? 0) + 1, bis: Date.now() + WIEDER_NACH_TAGEN * 864e5 }));
    } catch { /* egal */ }
    setModus('nix');
  };
  const zeigen = () => { if (modus === 'karte') karteWeg(); setBlatt(true); };

  const blattElement = blatt && <AnleitungBlatt geraet={geraet} prompt={prompt} zu={() => setBlatt(false)} />;

  if (variante === 'profil') {
    return (
      <>
        <EinstellungZeile icon={<DeviceMobile size={19} weight="fill" />} titel="App aufs Handy" unter="Zum Home-Bildschirm hinzufügen" rechts={<CaretRight size={18} color="var(--ink-300)" />} onClick={() => setBlatt(true)} />
        {blattElement}
      </>
    );
  }

  if (modus === 'karte') {
    /* 2c: einmal als ganze Karte */
    return (
      <>
        <div style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', padding: '6px 0' }}>
            <Logo groesse={72} />
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1, color: 'var(--navy)' }}>Hol dir Wirtschaftln aufs Handy</span>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)' }}>Dann ist die App mit einem Tipp da und kann dir sagen, wenn’s einen neuen Termin gibt.</span>
          </div>
          <button type="button" className="wn-press" onClick={zeigen} style={{ ...goldKnopfStil, minHeight: 52 }}>
            <DeviceMobile size={19} weight="fill" />Zeig mir wie
          </button>
          <button type="button" onClick={karteWeg} style={{ alignSelf: 'center', border: 'none', background: 'transparent', padding: '4px 8px', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 800, color: 'var(--ink-500)', cursor: 'pointer' }}>Später</button>
        </div>
        {blattElement}
      </>
    );
  }

  if (modus === 'hinweis') {
    /* 1a / 2a: schmaler Hinweis mit X */
    return (
      <>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 12px 12px', borderRadius: 16, background: 'var(--weiss)', border: '1.5px solid var(--gold)', boxShadow: '0 6px 18px rgba(166,132,62,0.18)' }}>
            <Logo groesse={44} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>Wirtschaftln aufs Handy holen</span>
              <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink-500)' }}>{geraet.startsWith('ios') ? 'Am iPhone gehen Benachrichtigungen nur so.' : 'Als App auf dem Home-Bildschirm, ohne App Store.'}</span>
            </div>
            <button type="button" className="wn-press" onClick={zeigen} style={{ height: 34, padding: '0 14px', borderRadius: 10, border: 'none', background: 'var(--navy)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800, cursor: 'pointer', flex: 'none' }}>Zeigen</button>
          </div>
          <button type="button" onClick={hinweisWeg} aria-label="Hinweis ausblenden" style={{ position: 'absolute', right: -8, top: -8, width: 26, height: 26, borderRadius: 99, border: '2px solid var(--ink-50)', background: 'var(--ink-500)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}>
            <X size={12} weight="bold" />
          </button>
        </div>
        {blattElement}
      </>
    );
  }

  return blattElement || null;
}

/** Schritt in der Anleitung: Nummer-Kreis, Titel, Text, optional a Beispiel-Kachel. */
function Schritt({ nr, titel, text, beispiel }: { nr: number; titel: string; text?: string; beispiel?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <span style={{ width: 30, height: 30, borderRadius: 99, background: 'var(--navy)', color: 'var(--gold-bright)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, flex: 'none' }}>{nr}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{titel}</span>
          {text && <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>{text}</span>}
        </div>
        {beispiel}
      </div>
    </div>
  );
}

const kachelStil: React.CSSProperties = { alignSelf: 'flex-start', width: 44, height: 44, borderRadius: 12, background: 'var(--weiss)', border: '1.5px solid var(--gold)', display: 'grid', placeItems: 'center', color: 'var(--muc-blau)' };
const pilleStil: React.CSSProperties = { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 12, background: 'var(--weiss)', border: '1.5px solid var(--gold)', fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', boxShadow: '0 4px 12px rgba(166,132,62,0.18)' };

/** Das Blatt von unten: iPhone-Safari (1b), Android (1c) oder „bitte in Safari“ (2d). */
function AnleitungBlatt({ geraet, prompt, zu }: { geraet: Geraet; prompt: InstallPrompt | null; zu: () => void }) {
  const [kopiert, setKopiert] = useState(false);
  const kopieren = async () => {
    try { await navigator.clipboard.writeText(window.location.origin); setKopiert(true); setTimeout(() => setKopiert(false), 1800); } catch { /* steht lesbar da */ }
  };
  const kopf = (titel: string, unter: string) => (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <Logo groesse={52} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 26, lineHeight: 1, color: 'var(--navy)' }}>{titel}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)' }}>{unter}</span>
      </div>
      <button type="button" onClick={zu} aria-label="Schließen" style={{ width: 34, height: 34, borderRadius: 99, border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'grid', placeItems: 'center', cursor: 'pointer', flex: 'none', padding: 0 }}><X size={16} /></button>
    </div>
  );
  return (
    <div role="dialog" aria-modal="true" onClick={zu} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(7,25,58,0.45)', display: 'flex', alignItems: 'flex-end', maxWidth: 'var(--container-app)', margin: '0 auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '88dvh', overflowY: 'auto', background: 'var(--ink-50)', borderRadius: '28px 28px 0 0', padding: '10px 20px calc(22px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 -14px 36px rgba(7,25,58,0.3)', fontFamily: 'var(--font-ui)' }}>
        <span style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 99, background: 'var(--ink-200)', flex: 'none' }} />
        {geraet === 'ios-safari' && (
          <>
            {kopf('So geht’s am iPhone', 'In drei Schritten, dauert 10 Sekunden.')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Schritt nr={1} titel="Unten auf Teilen tippen" text="Das Viereck mit dem Pfeil nach oben." beispiel={<span style={kachelStil}><Export size={24} /></span>} />
              <Schritt nr={2} titel="„Zum Home-Bildschirm“ wählen" text="Etwas nach unten scrollen, falls es nicht gleich da ist." beispiel={<span style={pilleStil}>Zum Home-Bildschirm<PlusSquare size={18} /></span>} />
              <Schritt nr={3} titel="Oben rechts „Hinzufügen“" text="Fertig. Ab jetzt Wirtschaftln über das Icon öffnen." />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--gold-700)' }}><ArrowDown size={16} weight="bold" />Teilen ist unten in der Leiste</div>
          </>
        )}
        {geraet === 'android' && (
          <>
            {kopf('Wirtschaftln installieren', 'Als App auf dem Home-Bildschirm.')}
            {prompt && (
              <button type="button" className="wn-press" onClick={async () => { try { await prompt.prompt(); } catch { /* abgebrochen */ } zu(); }} style={{ ...goldKnopfStil, minHeight: 52 }}>
                <DownloadSimple size={19} weight="fill" />Jetzt installieren
              </button>
            )}
            {prompt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--ink-100)' }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-300)' }}>oder von Hand</span>
                <span style={{ flex: 1, height: 1, background: 'var(--ink-100)' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Schritt nr={1} titel="Oben rechts die drei Punkte" beispiel={<span style={{ ...kachelStil, color: 'var(--ink-900)' }}><DotsThreeVertical size={22} weight="bold" /></span>} />
              <Schritt nr={2} titel="„App installieren“ oder „Zum Startbildschirm hinzufügen“" beispiel={<span style={pilleStil}>App installieren<DeviceMobileCamera size={18} /></span>} />
            </div>
          </>
        )}
        {geraet === 'ios-anderer' && (
          <>
            {kopf('App aufs Handy', 'Am iPhone nur über Safari.')}
            <div style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: '#FBF1D6', color: '#B7791F', display: 'grid', placeItems: 'center', flex: 'none' }}><Compass size={20} weight="fill" /></span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>Bitte in Safari öffnen</span>
                  <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)' }}>Am iPhone klappt das nur in Safari. Link kopieren und dort einfügen.</span>
                </div>
              </div>
              <button type="button" onClick={kopieren} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 14, background: 'var(--pergament)', border: '1px dashed var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--navy)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>wirtschaftln.de</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold-700)', display: 'flex', alignItems: 'center', gap: 4 }}><Copy size={14} />{kopiert ? 'Kopiert' : 'Kopieren'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { ShareNetwork } from '@phosphor-icons/react/dist/ssr/ShareNetwork';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { BadgeBild } from '@/components/domain/BadgeBild';

export type UrkundeDaten = {
  /** Kopfzeile, z. B. „Stammtisch Wirtschaftln“ */
  stammtisch: string;
  /** Zeremonielle Namensform („Da Bauer Sebastian“) oder Anzeigename */
  name: string;
  badgeName: string;
  slug: string | null;
  icon: string;
  /** „Herbst-Saison 2026“ */
  saison: string;
  /** „Für die meisten Hoibe der Saison.“ */
  grund: string;
  praesident: string | null;
  /** „2. Juli 2026“ */
  datum: string;
  ort: string | null;
};

/** „zum Maximator“, „zum Präsidenten“, „zur Sau“ */
function anrede(badgeName: string): { praep: string; titel: string } {
  if (badgeName.startsWith('Die ')) return { praep: 'zur', titel: badgeName.slice(4) };
  if (badgeName === 'Präsident') return { praep: 'zum', titel: 'Präsidenten' };
  return { praep: 'zum', titel: badgeName };
}

const FARBE = { navy: '#0C2B5A', gold: '#D0AD66', gold700: '#A6843E', pergament: '#F6F0E2', kante: '#E2D5B8', grau: '#5A6B7E', ink: '#2C3A4B', blau: '#006AB3' };

/**
 * Urkunde (Badge-Feier-Redesign 2a): Pergament-Karte mit Rautenband, Name in
 * Urkunden-Form, Badge groß, Unterschrift vom Präsidenten. Teilen schickt sie
 * als Bild in die Gruppe, Speichern legt das Bild aufs Handy.
 */
export function Urkunde({ daten, onClose }: { daten: UrkundeDaten; onClose: () => void }) {
  const [laeuft, setLaeuft] = useState<'teilen' | 'speichern' | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const { praep, titel } = anrede(daten.badgeName);

  useEffect(() => {
    if (!hinweis) return;
    const t = setTimeout(() => setHinweis(null), 2200);
    return () => clearTimeout(t);
  }, [hinweis]);

  const dateiName = `urkunde-${daten.badgeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;

  const teilen = async () => {
    setLaeuft('teilen');
    try {
      const blob = await urkundeAlsBild(daten);
      const datei = new File([blob], dateiName, { type: 'image/png' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [datei] })) {
        await navigator.share({ files: [datei], title: `Urkunde: ${daten.badgeName}` });
      } else {
        herunterladen(blob, dateiName);
        setHinweis('Bild gespeichert, zum Teilen aus der Galerie schicken.');
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) setHinweis('Des hat ned klappt, probier’s nochmal.');
    } finally {
      setLaeuft(null);
    }
  };

  const speichern = async () => {
    setLaeuft('speichern');
    try {
      const blob = await urkundeAlsBild(daten);
      // iOS (auch als App am Homescreen) kann koa Download: dort übers Teilen-Blatt („Bild sichern“)
      const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const datei = new File([blob], dateiName, { type: 'image/png' });
      if (ios && typeof navigator.canShare === 'function' && navigator.canShare({ files: [datei] })) {
        await navigator.share({ files: [datei] });
      } else {
        herunterladen(blob, dateiName);
        setHinweis('Urkunde gespeichert.');
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) setHinweis('Des hat ned klappt, probier’s nochmal.');
    } finally {
      setLaeuft(null);
    }
  };

  return (
    <div className="wn-scroll-still" style={{ position: 'fixed', inset: 0, zIndex: 95, maxWidth: 'var(--container-app)', margin: '0 auto', background: 'var(--ink-50)', overflowY: 'auto', overscrollBehavior: 'contain', animation: 'wnUrkundeAuf 260ms cubic-bezier(0.32, 0.72, 0, 1) both', fontFamily: 'var(--font-ui)' }}>
      <style>{`@keyframes wnUrkundeAuf { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div style={{ padding: 'calc(60px + env(safe-area-inset-top)) 16px calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', minHeight: '100%' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="wn-press"
          style={{ position: 'absolute', right: 16, top: 'calc(16px + env(safe-area-inset-top))', width: 36, height: 36, borderRadius: 999, border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}
        >
          <X size={17} weight="bold" />
        </button>

        {/* Die Karte, 1:1 wia das Bild, das rausgeht */}
        <div style={{ borderRadius: 18, overflow: 'hidden', background: FARBE.pergament, border: `2px solid ${FARBE.gold}`, boxShadow: '0 14px 36px rgba(12,43,90,0.18)' }}>
          <div className="wn-raute wn-raute--sm" style={{ height: 10 }} />
          <div style={{ margin: 10, border: `1px solid ${FARBE.kante}`, borderRadius: 10, padding: '26px 20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: FARBE.gold700 }}>{daten.stammtisch}</span>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 52, lineHeight: 1, color: FARBE.navy }}>Urkunde</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: FARBE.grau, marginTop: 8 }}>Hiermit wird</span>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 32, lineHeight: 1.1, color: FARBE.navy }}>{daten.name}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: FARBE.grau }}>{praep}</span>
            <div style={{ margin: '4px 0' }}>
              <BadgeBild slug={daten.slug} icon={daten.icon} name={daten.badgeName} size={150} />
            </div>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 30, lineHeight: 1, color: FARBE.gold700 }}>{titel}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: FARBE.grau }}>der {daten.saison} ernannt.</span>
            <span style={{ fontSize: 13, fontStyle: 'italic', fontWeight: 600, lineHeight: 1.5, color: FARBE.ink, marginTop: 8, maxWidth: 260 }}>{daten.grund}</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignSelf: 'stretch', marginTop: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 20, lineHeight: 1.2, color: FARBE.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{daten.praesident ?? ' '}</span>
                <span style={{ alignSelf: 'stretch', height: 1, background: FARBE.gold700 }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: FARBE.gold700 }}>Präsident</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, color: FARBE.navy, paddingTop: 3, whiteSpace: 'nowrap' }}>{daten.datum}</span>
                <span style={{ alignSelf: 'stretch', height: 1, background: FARBE.gold700 }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: FARBE.gold700 }}>{daten.ort ?? 'Stammtisch'}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button type="button" onClick={teilen} disabled={laeuft !== null} className="wn-press" style={{ height: 52, borderRadius: 14, border: 'none', background: 'var(--grad-gold)', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: laeuft ? 0.7 : 1 }}>
            <ShareNetwork size={18} weight="fill" />
            {laeuft === 'teilen' ? 'Moment …' : 'Teilen'}
          </button>
          <button type="button" onClick={speichern} disabled={laeuft !== null} className="wn-press" style={{ height: 52, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: laeuft ? 0.7 : 1 }}>
            <DownloadSimple size={18} />
            {laeuft === 'speichern' ? 'Moment …' : 'Speichern'}
          </button>
        </div>
        {hinweis && (
          <div role="status" style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--ink-500)' }}>{hinweis}</div>
        )}
      </div>
    </div>
  );
}

function herunterladen(blob: Blob, dateiName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* ── Bild-Export: die Karte nochmal auf Canvas gemalt (3-fach, scharf) ───── */

const W = 358; // Kartenbreite in CSS-px wia am Handy (390 − 2·16)
const SKALA = 3;

function bildLaden(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

/** Zeilenumbruch nach Breite (Canvas kennt koan Umbruch). */
function umbrechen(ctx: CanvasRenderingContext2D, text: string, maxBreite: number): string[] {
  const woerter = text.split(' ');
  const zeilen: string[] = [];
  let aktuell = '';
  for (const w of woerter) {
    const probe = aktuell ? `${aktuell} ${w}` : w;
    if (ctx.measureText(probe).width > maxBreite && aktuell) {
      zeilen.push(aktuell);
      aktuell = w;
    } else {
      aktuell = probe;
    }
  }
  if (aktuell) zeilen.push(aktuell);
  return zeilen;
}

/** Zentrierter Text mit Buchstabenabstand (Safari kennt ctx.letterSpacing erst spät). */
function gesperrt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, abstand: number) {
  const breiten = [...text].map((z) => ctx.measureText(z).width);
  const gesamt = breiten.reduce((a, b) => a + b, 0) + abstand * (text.length - 1);
  let cx = x - gesamt / 2;
  ctx.textAlign = 'left';
  [...text].forEach((z, i) => {
    ctx.fillText(z, cx, y);
    cx += breiten[i] + abstand;
  });
  ctx.textAlign = 'center';
}

function rundRect(ctx: CanvasRenderingContext2D, x: number, y: number, b: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + b, y, x + b, y + h, r);
  ctx.arcTo(x + b, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + b, y, r);
  ctx.closePath();
}

export async function urkundeAlsBild(d: UrkundeDaten): Promise<Blob> {
  const fraktur = "'Pirata One', serif";
  const ui = "Manrope, sans-serif";
  if (typeof document !== 'undefined' && document.fonts?.load) {
    await Promise.all([
      document.fonts.load(`52px ${fraktur}`),
      document.fonts.load(`600 13px ${ui}`),
      document.fonts.load(`700 15px ${ui}`),
      document.fonts.load(`800 11px ${ui}`),
    ]).catch(() => undefined);
  }
  const badge = d.slug ? await bildLaden(`/brand/badges/${d.slug}.png`) : null;
  const { praep, titel } = anrede(d.badgeName);

  // Erst messen (Höhe hängt vom Umbruch ab), dann malen
  const mess = document.createElement('canvas').getContext('2d')!;
  mess.font = `italic 600 13px ${ui}`;
  const grundZeilen = umbrechen(mess, d.grund, 260);
  mess.font = `32px ${fraktur}`;
  let nameGroesse = 32;
  while (nameGroesse > 20 && mess.measureText(d.name).width > W - 2 * 30 - 40) {
    nameGroesse -= 2;
    mess.font = `${nameGroesse}px ${fraktur}`;
  }

  // Layout (CSS-px): Band 10, Innenrahmen bei 10, Padding 26/20/22, gap 6 wia im DOM
  const innenX = 10, innenY = 10 + 10, innenB = W - 20;
  const links = innenX + 20, rechts = innenX + innenB - 20, mitte = W / 2;
  let y = innenY + 26;
  const zeilen: Array<() => void> = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const text = (t: string, font: string, farbe: string, hoehe: number, extra: Partial<{ sperrung: number; oben: number }> = {}) => {
    y += extra.oben ?? 0;
    const yy = y;
    zeilen.push(() => {
      ctx.font = font;
      ctx.fillStyle = farbe;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';
      // Grundlinie ~78 % der Zeilenhöhe
      if (extra.sperrung) gesperrt(ctx, t, mitte, yy + hoehe * 0.78, extra.sperrung);
      else ctx.fillText(t, mitte, yy + hoehe * 0.78);
    });
    y += hoehe + 6;
  };

  text(d.stammtisch.toUpperCase(), `800 11px ${ui}`, FARBE.gold700, 15, { sperrung: 2.2 });
  text('Urkunde', `52px ${fraktur}`, FARBE.navy, 52);
  text('Hiermit wird', `600 13px ${ui}`, FARBE.grau, 18, { oben: 8 });
  text(d.name, `${nameGroesse}px ${fraktur}`, FARBE.navy, Math.round(nameGroesse * 1.1));
  text(praep, `600 13px ${ui}`, FARBE.grau, 18);
  // Badge 150, Rand 4 oben/unten
  y += 4;
  const badgeY = y;
  zeilen.push(() => {
    if (badge) {
      ctx.save();
      ctx.shadowColor = 'rgba(12,43,90,0.18)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      // objectFit: contain
      const s = Math.min(150 / badge.naturalWidth, 150 / badge.naturalHeight);
      const bw = badge.naturalWidth * s, bh = badge.naturalHeight * s;
      ctx.drawImage(badge, mitte - bw / 2, badgeY + (150 - bh) / 2, bw, bh);
      ctx.restore();
    } else {
      const grad = ctx.createLinearGradient(0, badgeY, 0, badgeY + 150);
      grad.addColorStop(0, '#E6C684'); grad.addColorStop(0.45, '#D0AD66'); grad.addColorStop(1, '#A6843E');
      ctx.beginPath(); ctx.arc(mitte, badgeY + 75, 72, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#E6C684'; ctx.stroke();
      ctx.font = `80px ${ui}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      ctx.fillText(d.icon, mitte, badgeY + 80);
    }
  });
  y += 150 + 4 + 6;
  text(titel, `30px ${fraktur}`, FARBE.gold700, 30);
  text(`der ${d.saison} ernannt.`, `600 13px ${ui}`, FARBE.grau, 18);
  y += 8;
  for (const z of grundZeilen) text(z, `italic 600 13px ${ui}`, FARBE.ink, 19.5);
  y -= 6;

  // Unterschriften-Raster
  y += 20;
  const spalteB = (rechts - links - 20) / 2;
  const sigY = y;
  zeilen.push(() => {
    const spalten: Array<{ x: number; oben: () => void; unten: string }> = [
      {
        x: links,
        oben: () => { ctx.font = `20px ${fraktur}`; ctx.fillStyle = FARBE.navy; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(d.praesident ?? '', links + spalteB / 2, sigY + 19, spalteB); },
        unten: 'PRÄSIDENT',
      },
      {
        x: rechts - spalteB,
        oben: () => { ctx.font = `700 15px ${ui}`; ctx.fillStyle = FARBE.navy; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(d.datum, rechts - spalteB / 2, sigY + 18, spalteB); },
        unten: (d.ort ?? 'Stammtisch').toUpperCase(),
      },
    ];
    for (const s of spalten) {
      s.oben();
      ctx.fillStyle = FARBE.gold700;
      ctx.fillRect(s.x, sigY + 24 + 4, spalteB, 1);
      ctx.font = `800 10px ${ui}`;
      ctx.fillStyle = FARBE.gold700;
      gesperrt(ctx, s.unten, s.x + spalteB / 2, sigY + 24 + 4 + 1 + 4 + 10, 1);
    }
  });
  y += 24 + 4 + 1 + 4 + 14;
  y += 22; // Padding unten
  const innenH = y - innenY;
  const H = y + 10; // Außenrand unten

  canvas.width = W * SKALA;
  canvas.height = H * SKALA;
  ctx.scale(SKALA, SKALA);

  // Karte: Pergament mit Goldrand, alles drin geclippt
  rundRect(ctx, 0, 0, W, H, 18);
  ctx.fillStyle = FARBE.pergament;
  ctx.fill();
  ctx.save();
  rundRect(ctx, 0, 0, W, H, 18);
  ctx.clip();
  // Rautenband oben (10 hoch, Kachel 22): Blau mit weißen Spitzen nach oben, wia .wn-raute--sm
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, 10);
  ctx.clip();
  ctx.fillStyle = FARBE.blau;
  ctx.fillRect(0, 0, W, 10);
  ctx.fillStyle = '#FFFFFF';
  for (let x = -11; x < W + 22; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 10); ctx.lineTo(x + 22, 10); ctx.lineTo(x + 11, 0);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
  // Innenrahmen
  rundRect(ctx, innenX + 0.5, innenY + 0.5, innenB - 1, innenH - 1, 10);
  ctx.lineWidth = 1;
  ctx.strokeStyle = FARBE.kante;
  ctx.stroke();
  // Inhalt
  for (const z of zeilen) z();
  // Goldrand zuletzt, damit er sauber über allem liegt
  rundRect(ctx, 1, 1, W - 2, H - 2, 17);
  ctx.lineWidth = 2;
  ctx.strokeStyle = FARBE.gold;
  ctx.stroke();

  return new Promise((ok, nein) => canvas.toBlob((b) => (b ? ok(b) : nein(new Error('Bild konnte ned erzeugt werden'))), 'image/png'));
}

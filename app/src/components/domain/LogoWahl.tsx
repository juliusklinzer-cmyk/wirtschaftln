'use client';

import { useEffect, useMemo, useState } from 'react';
import { FotoZuschnitt } from '@/components/domain/FotoZuschnitt';

/**
 * Logo-Wähler für an Stammtisch: entweder a Vorlage (Initialen oder Symbol
 * in Vereinsfarbe, im Browser per Canvas gemalt) oder a eigenes Bild
 * (Zuschnitt wie beim Profilbild). Ergebnis landet als Data-URL im
 * Hidden-Field `name`; leer = koa Logo (Wirtschaftln-Wappen bleibt).
 */
const FARBEN = [
  { name: 'Navy', bg: '#0C2B5A', fg: '#E6C684' },
  { name: 'Grün', bg: '#1E6B3A', fg: '#F6F0E2' },
  { name: 'Rot', bg: '#B0202A', fg: '#F6F0E2' },
  { name: 'Gold', bg: '#B8860B', fg: '#0C2B5A' },
  { name: 'Braun', bg: '#5A3A1E', fg: '#F6F0E2' },
  { name: 'Blau', bg: '#1E56A0', fg: '#FFFFFF' },
];
const SYMBOLE = ['🍺', '🍻', '🥨', '🦌', '🦁', '🐻', '⛪', '🏔️', '🎯', '🃏'];

function initialen(name: string): string {
  const w = name.trim().split(/[\s-]+/).filter(Boolean);
  const s = (w.length >= 2 ? w[0][0] + w[1][0] : (w[0] ?? 'S').slice(0, 2)).toUpperCase();
  return s || 'S';
}

function malen(text: string, bg: string, fg: string, emoji: boolean): string {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 512);
  // Dezenter Ring wia auf am Wappen
  ctx.strokeStyle = fg;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(256, 256, 214, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = emoji ? '250px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' : 'bold 230px "Manrope","Helvetica Neue",Arial,sans-serif';
  ctx.fillText(text, 256, emoji ? 276 : 268);
  return c.toDataURL('image/png');
}

export function LogoWahl({ name, stammtischName, aktuell = null }: { name: string; stammtischName: string; aktuell?: string | null }) {
  const [modus, setModus] = useState<'vorlage' | 'eigen'>('vorlage');
  const [wahl, setWahl] = useState<string>(aktuell ? 'aktuell' : '');
  const [gemalt, setGemalt] = useState<Record<string, string>>({});
  const ini = useMemo(() => initialen(stammtischName), [stammtischName]);

  // Vorlagen im Browser malen (Initialen hängen am Namen → neu malen, wenn er sich ändert)
  useEffect(() => {
    const m: Record<string, string> = {};
    FARBEN.forEach((f, i) => { m[`ini-${i}`] = malen(ini, f.bg, f.fg, false); });
    SYMBOLE.forEach((s, i) => { const f = FARBEN[i % FARBEN.length]; m[`sym-${i}`] = malen(s, f.bg, f.fg, true); });
    setGemalt(m);
  }, [ini]);

  const wert = wahl === 'aktuell' ? (aktuell ?? '') : wahl.startsWith('eigen:') ? wahl.slice(6) : (gemalt[wahl] ?? '');

  const kachel = (key: string, src: string, titel: string) => (
    <button
      key={key}
      type="button"
      title={titel}
      onClick={() => setWahl(key)}
      style={{
        width: 56, height: 56, padding: 0, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', flex: 'none',
        border: wahl === key ? '3px solid var(--muc-blau)' : '2px solid var(--ink-100)',
        boxShadow: wahl === key ? 'var(--ring)' : 'none', background: 'var(--weiss)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="hidden" name={name} value={wert} />
      <div style={{ display: 'flex', gap: 8 }}>
        {(['vorlage', 'eigen'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModus(m)}
            style={{
              flex: 1, padding: '9px 6px', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800,
              border: modus === m ? '1.5px solid var(--muc-blau)' : '1.5px solid var(--ink-200)',
              background: modus === m ? 'var(--info-bg)' : 'var(--weiss)', color: modus === m ? 'var(--muc-blau)' : 'var(--ink-500)',
            }}
          >
            {m === 'vorlage' ? 'Vorlage' : 'Eigenes Bild'}
          </button>
        ))}
      </div>

      {modus === 'vorlage' ? (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>Initialen „{ini}“</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {aktuell && kachel('aktuell', aktuell, 'Aktuelles Logo')}
            {FARBEN.map((f, i) => kachel(`ini-${i}`, gemalt[`ini-${i}`] ?? '', f.name))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>Symbol</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SYMBOLE.map((s, i) => kachel(`sym-${i}`, gemalt[`sym-${i}`] ?? '', s))}
          </div>
        </>
      ) : (
        <EigenesBild onErgebnis={(d) => setWahl(d ? `eigen:${d}` : '')} />
      )}

      {wert && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wert} alt="" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover' }} />
          So schaut’s oben in der App und als App-Icon aus.
        </div>
      )}
    </div>
  );
}

/** Eigenes Bild über den Kreis-Zuschnitt, Ergebnis wandert per Hidden-Field-Beobachtung raus. */
function EigenesBild({ onErgebnis }: { onErgebnis: (dataUrl: string) => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // FotoZuschnitt schreibt in ein Hidden-Field namens _logoRoh → abgreifen
    const el = document.querySelector<HTMLInputElement>('input[name="_logoRoh"]');
    if (el && el.value) onErgebnis(el.value);
    const t = setTimeout(() => setTick((x) => x + 1), 500);
    return () => clearTimeout(t);
  }, [tick, onErgebnis]);
  return (
    <div>
      <FotoZuschnitt name="_logoRoh" aktuellesFoto={null} />
    </div>
  );
}

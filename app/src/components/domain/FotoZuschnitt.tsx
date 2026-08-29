'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const VORSCHAU = 240; // Durchmesser des Kreis-Editors (px)
const EXPORT = 512; // Kantenlänge des exportierten Quadrats

/**
 * Profilbild-Zuschnitt: Handy-Foto auswählen (Größe wurscht), im Kreis
 * zurechtschieben und zoomen, exportiert wird ein kleines Quadrat als
 * Data-URL im Hidden-Field `name`, der Server verkleinert final auf 256px.
 */
export function FotoZuschnitt({ name, aktuellesFoto }: { name: string; aktuellesFoto: string | null }) {
  const [bild, setBild] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ergebnis, setErgebnis] = useState('');
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const basisSkala = bild ? Math.max(VORSCHAU / bild.naturalWidth, VORSCHAU / bild.naturalHeight) : 1;
  const breite = bild ? bild.naturalWidth * basisSkala * zoom : 0;
  const hoehe = bild ? bild.naturalHeight * basisSkala * zoom : 0;

  const klemmen = useCallback(
    (o: { x: number; y: number }, z = zoom) => {
      if (!bild) return o;
      const b = bild.naturalWidth * basisSkala * z;
      const h = bild.naturalHeight * basisSkala * z;
      const maxX = Math.max(0, (b - VORSCHAU) / 2);
      const maxY = Math.max(0, (h - VORSCHAU) / 2);
      return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) };
    },
    [bild, basisSkala, zoom],
  );

  // Nach jeder Änderung das Quadrat exportieren (klein & schnell)
  useEffect(() => {
    if (!bild) return;
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT;
    canvas.height = EXPORT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = EXPORT / VORSCHAU;
    ctx.fillStyle = '#F6F0E2';
    ctx.fillRect(0, 0, EXPORT, EXPORT);
    ctx.drawImage(bild, ((VORSCHAU - breite) / 2 + offset.x) * s, ((VORSCHAU - hoehe) / 2 + offset.y) * s, breite * s, hoehe * s);
    setErgebnis(canvas.toDataURL('image/jpeg', 0.85));
  }, [bild, breite, hoehe, offset]);

  const dateiWaehlen = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setBild(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Profilbild, zeig dei Gsicht</span>
      <input type="hidden" name={name} value={ergebnis} />

      {!bild && (
        <label
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', cursor: 'pointer',
            border: '1.5px dashed var(--ink-200)', borderRadius: 'var(--r-md)', background: 'var(--weiss)',
          }}
        >
          {aktuellesFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={aktuellesFoto} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flex: 'none', border: '2px solid var(--gold)' }} />
          ) : (
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ink-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: 'none' }}>
              📷
            </span>
          )}
          <span>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--muc-blau)' }}>Foto auswählen…</span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
              Handy-Foto passt, wird automatisch klein gerechnet.
            </span>
          </span>
          <input type="file" accept="image/*" onChange={(e) => dateiWaehlen(e.target.files?.[0])} style={{ display: 'none' }} />
        </label>
      )}

      {bild && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '14px 12px', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-md)', background: 'var(--pergament)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>Schieb’s zurecht, bis’s im Kreis passt</div>
          <div
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              setOffset(klemmen({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) }));
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            style={{
              width: VORSCHAU, height: VORSCHAU, borderRadius: '50%', overflow: 'hidden', position: 'relative',
              border: '3px solid var(--gold)', boxShadow: 'var(--sh-gold)', cursor: 'grab', touchAction: 'none',
              flex: 'none', background: 'var(--ink-100)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bild.src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute', left: '50%', top: '50%', width: breite, height: hoehe, maxWidth: 'none',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                userSelect: 'none', pointerEvents: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 280 }}>
            <span style={{ fontSize: 13 }}>🔍</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => {
                const z = Number(e.target.value);
                setZoom(z);
                setOffset((o) => klemmen(o, z));
              }}
              style={{ flex: 1, accentColor: 'var(--muc-blau)' }}
            />
            <span style={{ fontSize: 17 }}>🔍</span>
          </div>
          <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer' }}>
            Anderes Foto wählen
            <input type="file" accept="image/*" onChange={(e) => dateiWaehlen(e.target.files?.[0])} style={{ display: 'none' }} />
          </label>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  naechstes?: boolean;
};

/** Münchner Karte mit Wirtshaus-Pins (OSM-Raster über MapLibre). */
export function MunichMap({ pins }: { pins: MapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [11.576, 48.137], // Marienplatz
      zoom: 11.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    for (const pin of pins) {
      const el = document.createElement('div');
      el.style.cssText = `
        width:26px;height:26px;border-radius:999px;display:flex;align-items:center;justify-content:center;
        background:${pin.naechstes ? 'var(--grad-gold)' : 'var(--muc-blau)'};
        border:2px solid #fff;box-shadow:0 2px 8px rgba(12,43,90,0.35);
        font-size:12px;cursor:pointer;`;
      el.textContent = pin.naechstes ? '★' : '🍺';
      new maplibregl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .setPopup(new maplibregl.Popup({ offset: 18, closeButton: false }).setText(pin.name))
        .addTo(map);
    }

    if (pins.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      pins.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 13 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [pins]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 260,
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        border: '1px solid var(--ink-100)',
        boxShadow: 'var(--sh-sm)',
      }}
    />
  );
}

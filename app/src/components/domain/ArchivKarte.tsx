'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { wirtshausFotoSetzen, wirtshausOrtSetzen } from '@/app/(app)/termin/actions';
import { loadGoogleMaps } from '@/lib/google-maps';
import { useTenantConfig } from '@/components/shell/TenantProvider';
import { mitOrt } from '@/lib/tenant-config-public';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type KartenPin = {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  naechstes?: boolean;
  top3?: boolean;
  /** Entdeckt, aber no ned besucht: weißer, gestrichelter Pin. */
  offen?: boolean;
  /** Entdeckt und von Spezln bewertet (no koa Stammtisch dort): gestrichelt mit Stern. */
  vorbewertet?: boolean;
  /** S’Stammhaus: immer golden und groß. */
  stammhaus?: boolean;
};

export type Standort = { lat: number; lng: number };

const BIER_PFAD = '<path d="M6 11h9v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8z"/><path d="M15 13h2.5a2.5 2.5 0 0 1 0 5H15M6 11V8a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v3"/>';
const HAUS_PFAD = '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>';
const STERN_PFAD = '<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.4 6.2 21.4l1.1-6.5L2.6 9.8l6.5-.9L12 3z"/>';

/**
 * Bierkrug-Tropfen-Pin (Archiv-Redesign 13.10.2026): Gold = Top 3, nächstes
 * Ziel und Stammhaus · Navy = besucht (auch vor der App) · Blau und größer
 * mit Namensschild = ausgewählt · weiß gestrichelt = Vorschlag.
 */
function pinElement(pin: KartenPin, aktiv: boolean, onClick: () => void): HTMLButtonElement {
  const vorschlag = !!pin.offen || !!pin.vorbewertet;
  const gold = !aktiv && (pin.naechstes || pin.top3 || pin.stammhaus);
  const size = aktiv ? 44 : 34;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.title = pin.offen ? `${pin.name} (Vorschlag)` : pin.vorbewertet ? `${pin.name} (von Spezln bewertet)` : pin.name;
  btn.style.cssText = `border:none;background:transparent;cursor:pointer;padding:0;
    transform:translate(-50%,-100%);position:absolute;display:flex;flex-direction:column;align-items:center;gap:3px;
    z-index:${aktiv ? 7 : pin.naechstes || pin.stammhaus ? 6 : vorschlag ? 1 : 2};`;
  const tropfen = document.createElement('span');
  const hintergrund = aktiv ? '#006AB3' : gold ? '#D0AD66' : vorschlag ? '#FFFFFF' : '#0C2B5A';
  const rand = !aktiv && vorschlag ? '2px dashed #94A3B4' : '2.5px solid #fff';
  tropfen.style.cssText = `display:flex;align-items:center;justify-content:center;
    width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    transition:all .2s ease;box-shadow:0 4px 10px rgba(7,25,58,.35);border:${rand};background:${hintergrund};`;
  const iconFarbe = aktiv ? '#fff' : gold ? '#07193A' : vorschlag ? '#5A6B7E' : '#F6F0E2';
  const iconGroesse = aktiv ? 20 : 16;
  const pfad = pin.stammhaus ? HAUS_PFAD : pin.vorbewertet && !pin.naechstes ? STERN_PFAD : BIER_PFAD;
  tropfen.innerHTML = `<svg width="${iconGroesse}" height="${iconGroesse}" viewBox="0 0 24 24" fill="none" stroke="${iconFarbe}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)">${pfad}</svg>`;
  btn.appendChild(tropfen);
  if (aktiv) {
    const schild = document.createElement('span');
    schild.textContent = pin.name;
    schild.style.cssText = 'font-family:var(--font-ui),sans-serif;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;background:#fff;color:#0C2B5A;box-shadow:0 1px 3px rgba(0,0,0,.2);white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;';
    btn.appendChild(schild);
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

/**
 * Vollflächige Google-Karte mit allen Wirtshäusern. Nebenbei: Wirtshäuser ohne Foto
 * bekommen einmalig ein Bild aus der Places-Textsuche (ToS-konform über die JS-Library).
 * `standort` = eigener Standort (blauer Punkt, Karte springt hin).
 */
export function ArchivKarte({
  pins,
  activeIdx,
  onPick,
  standort = null,
}: {
  pins: KartenPin[];
  activeIdx: number;
  onPick: (idx: number) => void;
  standort?: Standort | null;
}) {
  const router = useRouter();
  // Geo-Config des Stammtischs (Kartenmitte, Umkreis, Such-Suffix); null = die ganze Welt
  const { geo, features } = useTenantConfig();
  const geoRef = useRef(geo);
  geoRef.current = geo;
  // Google-Fotos nachladen nur mit Feature wirtshausFotos (Gründer)
  const fotosRef = useRef(features.wirtshausFotos);
  fotosRef.current = features.wirtshausFotos;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const stateRef = useRef({ pins, activeIdx, onPick, standort });
  stateRef.current = { pins, activeIdx, onPick, standort };
  const backfillDone = useRef(false);

  useEffect(() => {
    let aufgeraeumt = false;
    loadGoogleMaps()
      .then((google) => {
        if (aufgeraeumt || !containerRef.current || mapRef.current) return;
        const geo = geoRef.current;
        const MITTE = geo?.center ?? { lat: 48.137, lng: 11.575 };
        // Ohne Geo-Config (Stammtisch ohne Stadt) derf die Karte frei zoomen
        const MIN_ZOOM = geo ? 9 : 3;
        const map = new google.maps.Map(containerRef.current, {
          center: MITTE,
          zoom: geo ? 12 : 6,
          // minZoom: näher als „Stadt & Umland" raus geht's nicht, verhindert
          // den Bug, bei dem die Karte plötzlich auf die ganze Welt rausspringt
          // (fitBounds/Resize bei noch unvermessenem Container → Zoom 0).
          minZoom: MIN_ZOOM,
          disableDefaultUI: true,
          zoomControl: false, // cleaner, gezoomt wird mit zwei Fingern
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        mapRef.current = map;

        // Rettungsanker: springt der Kartenstand trotzdem weg (Safari/PWA nach
        // dem Aufwachen), letzten guten Stand merken und zurückspringen.
        const guterStand = { center: MITTE as { lat: number; lng: number }, zoom: geo ? 12 : 6 };
        map.addListener('idle', () => {
          const c = map.getCenter();
          const z = map.getZoom();
          if (c == null || z == null) return;
          const plausibel = z >= MIN_ZOOM && (!geo || (Math.abs(c.lat() - MITTE.lat) < 1.5 && Math.abs(c.lng() - MITTE.lng) < 2.5));
          if (plausibel) {
            guterStand.center = { lat: c.lat(), lng: c.lng() };
            guterStand.zoom = z;
          } else {
            map.setZoom(guterStand.zoom);
            map.setCenter(guterStand.center);
          }
        });

        // Eigene Pins als OverlayView (funktioniert ohne mapId, volle Design-Freiheit)
        const overlay = new google.maps.OverlayView();
        overlay.onAdd = function () {
          this.container = document.createElement('div');
          this.container.style.cssText = 'position:absolute;left:0;top:0;';
          this.getPanes().overlayMouseTarget.appendChild(this.container);
        };
        overlay.draw = function () {
          const { pins: p, activeIdx: aktiv, onPick: pick, standort: ich } = stateRef.current;
          const projection = this.getProjection();
          if (!projection || !this.container) return;
          this.container.innerHTML = '';
          p.forEach((pin, i) => {
            if (pin.lat == null || pin.lng == null) return;
            const punkt = projection.fromLatLngToDivPixel(new google.maps.LatLng(pin.lat, pin.lng));
            if (!punkt) return;
            const el = pinElement(pin, i === aktiv, () => pick(i));
            el.style.left = `${punkt.x}px`;
            el.style.top = `${punkt.y}px`;
            this.container.appendChild(el);
          });
          // Eigener Standort: blauer Punkt mit weißem Rand
          if (ich) {
            const punkt = projection.fromLatLngToDivPixel(new google.maps.LatLng(ich.lat, ich.lng));
            if (punkt) {
              const dot = document.createElement('span');
              dot.style.cssText = `position:absolute;left:${punkt.x}px;top:${punkt.y}px;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:50%;background:#006AB3;border:3px solid #fff;box-shadow:0 0 0 6px rgba(0,106,179,.2),0 2px 6px rgba(7,25,58,.35);pointer-events:none;z-index:8;`;
              this.container.appendChild(dot);
            }
          }
        };
        overlay.onRemove = function () {
          this.container?.remove();
          this.container = null;
        };
        overlay.setMap(map);
        overlayRef.current = overlay;

        // Alle Pins ins Bild
        const mitKoordinaten = pins.filter((p) => p.lat != null && p.lng != null);
        if (mitKoordinaten.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          mitKoordinaten.forEach((p) => bounds.extend({ lat: p.lat!, lng: p.lng! }));
          map.fitBounds(bounds, 60);
        }

        // Backfill über Places (einmal pro Wirtshaus, wird in der DB gespeichert):
        // Foto UND, für Altbestand-Einträge ohne Ortsdaten, Koordinaten/Adresse.
        if (!backfillDone.current && google.maps.places) {
          backfillDone.current = true;
          const service = new google.maps.places.PlacesService(map);
          const unvollstaendig = pins.filter((p) => (!p.photoUrl || p.lat == null) && p.name && p.id !== 'naechstes');
          let i = 0;
          let ergaenzt = false;
          const naechster = () => {
            const pin = unvollstaendig[i++];
            if (!pin) {
              // Neue Ortsdaten da → Seite einmal frisch laden, damit die Pins erscheinen
              if (ergaenzt) router.refresh();
              return;
            }
            service.textSearch({ query: mitOrt(pin.name, geo) }, (results: any[], status: string) => {
              const treffer = status === 'OK' ? results?.[0] : null;
              if (treffer) {
                if (!pin.photoUrl && fotosRef.current) {
                  const url = treffer.photos?.[0]?.getUrl({ maxWidth: 640, maxHeight: 480 });
                  if (url) void wirtshausFotoSetzen(pin.id, url);
                }
                const ort = treffer.geometry?.location;
                if (pin.lat == null && ort) {
                  ergaenzt = true;
                  void wirtshausOrtSetzen(pin.id, { lat: ort.lat(), lng: ort.lng(), adresse: treffer.formatted_address ?? null });
                }
              }
              setTimeout(naechster, 400);
            });
          };
          naechster();
        }
      })
      .catch(() => {
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:24px;text-align:center;font-family:var(--font-ui);font-size:13px;font-weight:600;color:var(--ink-500)">Karte konnte nicht geladen werden, Google-Maps-Key prüfen (Cloud Console → Freischaltung für diese Domain).</div>';
        }
      });
    return () => {
      aufgeraeumt = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pins neu zeichnen, wenn sich Auswahl oder Daten ändern
  useEffect(() => {
    overlayRef.current?.draw?.();
    const pin = pins[activeIdx];
    if (pin && pin.lat != null && pin.lng != null && mapRef.current) {
      mapRef.current.panTo({ lat: pin.lat, lng: pin.lng });
    }
  }, [activeIdx, pins]);

  // Eigener Standort: hinspringen und den Punkt zeichnen
  useEffect(() => {
    overlayRef.current?.draw?.();
    if (standort && mapRef.current) {
      mapRef.current.panTo(standort);
      if ((mapRef.current.getZoom?.() ?? 0) < 14) mapRef.current.setZoom(14);
    }
  }, [standort]);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}

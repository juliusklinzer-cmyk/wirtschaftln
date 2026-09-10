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
  /** „Gfunden", aber no ned besucht, hellgrauer Pin mit ❓ statt Bierkrug. */
  offen?: boolean;
};

/**
 * Bierkrug-Teardrop-Pin wie im Design-Prototyp (WirtshausScreen.jsx).
 * Offene („gfundene") Pins sind bewusst klein und dezent, heller
 * Pergament-Tropfen mit grauem ?, damit die blauen Krüge und die goldenen
 * Top-Pins die Karte dominieren.
 */
function pinElement(pin: KartenPin, aktiv: boolean, onClick: () => void): HTMLButtonElement {
  const ruhig = !!pin.offen && !aktiv; // gfunden & gerade nicht ausgewählt
  const size = aktiv ? 36 : ruhig ? 21 : 28;
  const gold = pin.naechstes || pin.top3;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.title = pin.offen ? `${pin.name} (no ned besucht)` : pin.name;
  btn.style.cssText = `border:none;background:transparent;cursor:pointer;padding:0;
    transform:translate(-50%,-100%);position:absolute;
    filter:drop-shadow(0 ${aktiv ? 4 : 1}px ${aktiv ? 6 : 2}px rgba(12,43,90,.${ruhig ? 15 : aktiv ? 4 : 3}));
    z-index:${pin.naechstes ? 6 : aktiv ? 5 : pin.offen ? 0 : 1};`;
  const tropfen = document.createElement('span');
  const hintergrund = gold
    ? 'linear-gradient(180deg,#E6C684 0%,#D0AD66 45%,#A6843E 100%)'
    : ruhig
      ? '#F3EEE1' // Pergament: zurückhaltend, klar als „no ned besucht" lesbar
      : aktiv
        ? '#006AB3'
        : '#0C2B5A';
  tropfen.style.cssText = `display:flex;align-items:center;justify-content:center;
    width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    transition:all .2s ease;
    box-shadow:0 ${ruhig ? 1 : 2}px ${ruhig ? 4 : 8}px rgba(12,43,90,.${ruhig ? 12 : 25});
    border:${ruhig ? '1.5px solid rgba(12,43,90,0.28)' : '2px solid #fff'};
    background:${hintergrund};`;
  const icon = document.createElement('span');
  if (pin.offen) {
    // schlichtes graues ? statt rotem Emoji, deutlich leiser als die Bierkrüge
    icon.style.cssText = `transform:rotate(45deg);font-family:var(--font-ui),sans-serif;
      font-size:${aktiv ? 15 : 11}px;font-weight:800;line-height:1;
      color:${aktiv ? '#fff' : '#9AA6B5'};`;
    icon.textContent = '?';
  } else {
    icon.style.cssText = `transform:rotate(45deg);font-size:${aktiv ? 16 : 13}px;line-height:1;`;
    icon.textContent = pin.naechstes ? '📍' : '🍺';
  }
  tropfen.appendChild(icon);
  btn.appendChild(tropfen);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

/**
 * Vollflächige Google-Karte mit allen Wirtshäusern. Nebenbei: Wirtshäuser ohne Foto
 * bekommen einmalig ein Bild aus der Places-Textsuche (ToS-konform über die JS-Library).
 */
export function ArchivKarte({
  pins,
  activeIdx,
  onPick,
}: {
  pins: KartenPin[];
  activeIdx: number;
  onPick: (idx: number) => void;
}) {
  const router = useRouter();
  // Geo-Config des Stammtischs (Kartenmitte, Umkreis, Such-Suffix); null = die ganze Welt
  const { geo } = useTenantConfig();
  const geoRef = useRef(geo);
  geoRef.current = geo;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const stateRef = useRef({ pins, activeIdx, onPick });
  stateRef.current = { pins, activeIdx, onPick };
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
          const { pins: p, activeIdx: aktiv, onPick: pick } = stateRef.current;
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
                if (!pin.photoUrl) {
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

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}

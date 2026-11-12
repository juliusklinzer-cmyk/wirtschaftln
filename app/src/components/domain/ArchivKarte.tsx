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
  /** Platz in der Sterne-Rangliste (Responsive 3a: nummerierte Pins ab Tablet), null = ohne Wertung */
  rang?: number | null;
};

export type Standort = { lat: number; lng: number };

/** Steuerung von außen (Zoom-Knöpfe, Responsive 3a; am Handy Ersatz für die Pinch-Geste) */
export type KartenSteuerung = { zoom: (delta: number) => void };

const BIER_PFAD = '<path d="M6 11h9v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8z"/><path d="M15 13h2.5a2.5 2.5 0 0 1 0 5H15M6 11V8a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v3"/>';
const HAUS_PFAD = '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>';
const STERN_PFAD = '<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.4 6.2 21.4l1.1-6.5L2.6 9.8l6.5-.9L12 3z"/>';
const KRONE_PFAD = '<path d="M3 18h18l-2-10-4.5 4L12 5l-2.5 7L5 8l-2 10z"/>';
const GOLD = 'linear-gradient(180deg,#E6C684 0%,#D0AD66 45%,#A6843E 100%)';

/**
 * Bierkrug-Tropfen-Pin (Archiv-Redesign 13.10.2026): Gold = Top 3, nächstes
 * Ziel und Stammhaus · Navy = besucht (auch vor der App) · Blau und größer
 * = ausgewählt · weiß gestrichelt = Vorschlag.
 */
function tropfenPin(pin: KartenPin, aktiv: boolean): HTMLElement {
  const vorschlag = !!pin.offen || !!pin.vorbewertet;
  const gold = !aktiv && (pin.naechstes || pin.top3 || pin.stammhaus);
  const size = aktiv ? 44 : 34;
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
  return tropfen;
}

/**
 * Rang-Pin (Responsive Redesign 3a, ab Tablet): runde Marke mit dem Platz in
 * der Sterne-Rangliste, Gold für die Top 3, Navy für den Rest, Vorschläge weiß
 * gestrichelt ohne Zahl. Der ausgewählte Pin is groß, golden mit Krone und
 * trägt den Namen als Schild daneben.
 */
function rangPin(pin: KartenPin, aktiv: boolean): HTMLElement {
  const vorschlag = !!pin.offen || !!pin.vorbewertet;
  const top3 = !!pin.top3 || !!pin.stammhaus || !!pin.naechstes;
  const huelle = document.createElement('span');
  huelle.style.cssText = 'display:flex;align-items:center;gap:8px;';
  const marke = document.createElement('span');
  const size = aktiv ? 44 : top3 ? 32 : 28;
  const hintergrund = aktiv || top3 ? GOLD : vorschlag ? '#FFFFFF' : '#0C2B5A';
  const farbe = aktiv || top3 ? '#07193A' : vorschlag ? '#5A6B7E' : '#FFFFFF';
  const rand = vorschlag && !aktiv ? '2px dashed #94A3B4' : '2px solid #fff';
  marke.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:99px;background:${hintergrund};color:${farbe};
    border:${rand};box-shadow:0 4px 12px rgba(7,25,58,.3);font-family:var(--font-ui);font-size:${aktiv ? 15 : 12}px;font-weight:800;transition:all .2s ease;`;
  if (aktiv) {
    marke.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">${pin.stammhaus ? HAUS_PFAD : KRONE_PFAD}</svg>`;
  } else if (pin.stammhaus) {
    marke.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${HAUS_PFAD}</svg>`;
  } else if (pin.rang) {
    marke.textContent = String(pin.rang);
  } else if (pin.vorbewertet) {
    marke.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round">${STERN_PFAD}</svg>`;
  } else {
    marke.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${BIER_PFAD}</svg>`;
  }
  huelle.appendChild(marke);
  if (aktiv) {
    const schild = document.createElement('span');
    schild.textContent = pin.name;
    schild.style.cssText = 'background:#0C2B5A;color:#F6F0E2;font-family:var(--font-ui);font-size:12px;font-weight:800;padding:6px 10px;border-radius:10px;white-space:nowrap;box-shadow:0 4px 12px rgba(7,25,58,.3);';
    huelle.appendChild(schild);
  }
  return huelle;
}

function pinElement(pin: KartenPin, aktiv: boolean, stil: 'tropfen' | 'rang', onClick: () => void): HTMLButtonElement {
  const vorschlag = !!pin.offen || !!pin.vorbewertet;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.title = pin.offen ? `${pin.name} (Vorschlag)` : pin.vorbewertet ? `${pin.name} (von Spezln bewertet)` : pin.rang ? `${pin.rang}. ${pin.name}` : pin.name;
  // Tropfen: Spitze zeigt auf den Ort; Rang-Marke: Mitte liegt am Ort
  const versatz = stil === 'rang' ? 'translate(-14px,-50%)' : 'translate(-50%,-100%)';
  btn.style.cssText = `border:none;background:transparent;cursor:pointer;padding:0;
    transform:${versatz};position:absolute;display:flex;flex-direction:column;align-items:flex-start;gap:3px;
    z-index:${aktiv ? 7 : pin.naechstes || pin.stammhaus ? 6 : vorschlag ? 1 : 2};`;
  btn.appendChild(stil === 'rang' ? rangPin(pin, aktiv) : tropfenPin(pin, aktiv));
  // Koa Namensschild unterm Pin mehr (Julius, 14.10.2026): der Name steht eh in der Karte drunter,
  // und das Schild hat den Knopf bis 160px breit gemacht, sodass Nachbar-Pins ned mehr antippbar waren.
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

/** Alles, was das Aussehen eines Pins bestimmt: ändert sich das ned, bleibt das Element stehen. */
const pinSchluessel = (pin: KartenPin, aktiv: boolean, stil: string) =>
  [stil, aktiv, pin.name, pin.naechstes, pin.top3, pin.offen, pin.vorbewertet, pin.stammhaus, pin.rang ?? ''].map(String).join('|');

/**
 * Vollflächige Google-Karte mit allen Wirtshäusern. Nebenbei: Wirtshäuser ohne Foto
 * bekommen einmalig ein Bild aus der Places-Textsuche (ToS-konform über die JS-Library).
 * `standort` = eigener Standort (blauer Punkt, Karte springt hin).
 *
 * iPhone-Zoom (WIR-037, 12.11.2026): die Pins werden ned mehr bei jedem Zeichnen
 * neu gebaut, sondern nur verschoben; alle Pins einpassen erst, wenn der Container
 * vermessen is (sonst sprang die Karte auf die Mindest-Zoomstufe raus); Zoom-Knöpfe
 * über `onSteuerung`.
 */
export function ArchivKarte({
  pins,
  activeIdx,
  onPick,
  standort = null,
  stil = 'tropfen',
  onSteuerung,
}: {
  pins: KartenPin[];
  activeIdx: number;
  onPick: (idx: number) => void;
  standort?: Standort | null;
  /** `rang` = nummerierte Marken wia im Design 3a (ab Tablet), `tropfen` = die Bierkrug-Pins am Handy */
  stil?: 'tropfen' | 'rang';
  /** Bekommt einmal die Zoom-Steuerung, sobald die Karte steht */
  onSteuerung?: (s: KartenSteuerung) => void;
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
  const stateRef = useRef({ pins, activeIdx, onPick, standort, stil });
  stateRef.current = { pins, activeIdx, onPick, standort, stil };
  const steuerungRef = useRef(onSteuerung);
  steuerungRef.current = onSteuerung;
  const backfillDone = useRef(false);
  // Gebaute Pin-Elemente je Wirtshaus (Schlüssel = Aussehen), damit Zoomen und Schieben nur verschiebt
  const elementeRef = useRef(new Map<string, { schluessel: string; el: HTMLButtonElement }>());
  const standortElRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let aufgeraeumt = false;
    let beobachter: ResizeObserver | null = null;
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
          zoomControl: false, // eigene Knöpfe (ArchivScreen), dazu zwei Finger
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        mapRef.current = map;
        steuerungRef.current?.({
          zoom: (delta) => {
            const z = map.getZoom() ?? 12;
            map.setZoom(Math.max(MIN_ZOOM, Math.min(20, z + delta)));
          },
        });

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
          // Ohne Panes (Karte hat ned geladen, z. B. Key ned freigeschaltet) gibt's nix zum Zeichnen
          const panes = this.getPanes();
          if (!panes) return;
          this.container = document.createElement('div');
          this.container.style.cssText = 'position:absolute;left:0;top:0;';
          panes.overlayMouseTarget.appendChild(this.container);
        };
        overlay.draw = function () {
          const { pins: p, activeIdx: aktiv, onPick: pick, standort: ich, stil: s } = stateRef.current;
          const projection = this.getProjection();
          if (!projection || !this.container) return;
          const elemente = elementeRef.current;
          const gesehen = new Set<string>();
          p.forEach((pin, i) => {
            if (pin.lat == null || pin.lng == null) return;
            const punkt = projection.fromLatLngToDivPixel(new google.maps.LatLng(pin.lat, pin.lng));
            if (!punkt) return;
            gesehen.add(pin.id);
            const schluessel = pinSchluessel(pin, i === aktiv, s);
            let eintrag = elemente.get(pin.id);
            if (!eintrag || eintrag.schluessel !== schluessel) {
              eintrag?.el.remove();
              // onPick über den Index zum Zeitpunkt des Klicks, ned zum Zeitpunkt des Bauens
              const el = pinElement(pin, i === aktiv, s, () => {
                const jetzt = stateRef.current.pins.findIndex((x) => x.id === pin.id);
                if (jetzt >= 0) stateRef.current.onPick(jetzt);
              });
              eintrag = { schluessel, el };
              elemente.set(pin.id, eintrag);
              this.container.appendChild(el);
            }
            eintrag.el.style.left = `${punkt.x}px`;
            eintrag.el.style.top = `${punkt.y}px`;
          });
          for (const [id, eintrag] of elemente) {
            if (!gesehen.has(id)) {
              eintrag.el.remove();
              elemente.delete(id);
            }
          }
          void pick;
          // Eigener Standort: blauer Punkt mit weißem Rand
          if (ich) {
            const punkt = projection.fromLatLngToDivPixel(new google.maps.LatLng(ich.lat, ich.lng));
            if (punkt) {
              let dot = standortElRef.current;
              if (!dot) {
                dot = document.createElement('span');
                dot.style.cssText = 'position:absolute;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:50%;background:#006AB3;border:3px solid #fff;box-shadow:0 0 0 6px rgba(0,106,179,.2),0 2px 6px rgba(7,25,58,.35);pointer-events:none;z-index:8;';
                this.container.appendChild(dot);
                standortElRef.current = dot;
              }
              dot.style.left = `${punkt.x}px`;
              dot.style.top = `${punkt.y}px`;
            }
          } else if (standortElRef.current) {
            standortElRef.current.remove();
            standortElRef.current = null;
          }
        };
        overlay.onRemove = function () {
          this.container?.remove();
          this.container = null;
          elementeRef.current.clear();
          standortElRef.current = null;
        };
        overlay.setMap(map);
        overlayRef.current = overlay;

        // Alle Pins ins Bild, aber erst, wenn der Container a Größe hat (sonst Zoom 0 → Mindest-Zoom,
        // „die Karte springt ganz raus“). Danach ned näher als Stadtteil-Ebene.
        const mitKoordinaten = pins.filter((p) => p.lat != null && p.lng != null);
        if (mitKoordinaten.length > 1 && containerRef.current) {
          const bounds = new google.maps.LatLngBounds();
          mitKoordinaten.forEach((p) => bounds.extend({ lat: p.lat!, lng: p.lng! }));
          const einpassen = () => {
            map.fitBounds(bounds, 60);
            google.maps.event.addListenerOnce(map, 'idle', () => {
              if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
            });
          };
          const el = containerRef.current;
          if (el.clientWidth > 0 && el.clientHeight > 0) {
            einpassen();
          } else if (typeof ResizeObserver !== 'undefined') {
            beobachter = new ResizeObserver(() => {
              if (el.clientWidth > 0 && el.clientHeight > 0) {
                beobachter?.disconnect();
                beobachter = null;
                google.maps.event.trigger(map, 'resize');
                einpassen();
              }
            });
            beobachter.observe(el);
          }
        }

        // Backfill über Places (einmal pro Wirtshaus, wird in der DB gespeichert):
        // Foto UND, für Altbestand-Einträge ohne Ortsdaten, Koordinaten/Adresse.
        if (!backfillDone.current && google.maps.places) {
          backfillDone.current = true;
          const service = new google.maps.places.PlacesService(map);
          const unvollstaendig = pins.filter((p) => ((!p.photoUrl && fotosRef.current) || p.lat == null) && p.name && p.id !== 'naechstes');
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
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:24px;text-align:center;font-family:var(--font-ui);font-size:13px;font-weight:600;color:var(--ink-500)">Karte grad ned verfügbar.</div>';
        }
      });
    return () => {
      aufgeraeumt = true;
      beobachter?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pins neu zeichnen, wenn sich Auswahl, Daten oder Stil ändern (nur verschieben, siehe draw)
  useEffect(() => {
    overlayRef.current?.draw?.();
  }, [activeIdx, pins, stil]);

  // Zum ausgewählten Pin fahren, aber nur bei echter Auswahl-Änderung, ned bei jedem frischen pins-Array
  const letzteWahl = useRef<string | null>(null);
  useEffect(() => {
    const pin = pins[activeIdx];
    const id = pin?.id ?? null;
    if (id === letzteWahl.current) return;
    letzteWahl.current = id;
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

  // touch-action none: iOS soll die Zwei-Finger-Geste komplett der Karte lassen, ned der Seite
  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, touchAction: 'none', overscrollBehavior: 'none' }} />;
}

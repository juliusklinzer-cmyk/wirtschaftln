/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Maps-JS-Script nur einmal laden (nur im Browser aufrufen).
 * Der API-Key ist referrer-beschränkt → alle Google-Aufrufe laufen clientseitig.
 */
let mapsPromise: Promise<any> | null = null;

/**
 * Universeller Google-Maps-Navigationslink (öffnet am Handy direkt die
 * Maps-App im Routen-Modus). Adresse schlägt Koordinaten — dann steht in
 * Google Maps das Wirtshaus mit Namen statt einem nackten Punkt.
 */
export function navigationsUrl(ziel: {
  name: string;
  adresse?: string | null;
  lat?: number | null;
  lng?: number | null;
}): string {
  const destination = ziel.adresse
    ? `${ziel.name}, ${ziel.adresse}`
    : ziel.lat != null && ziel.lng != null
      ? `${ziel.lat},${ziel.lng}`
      : `${ziel.name}, München`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') return new Promise(() => {});
  const w = window as any;
  if (w.google?.maps) return Promise.resolve(w.google);
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const key = process.env.NEXT_PUBLIC_GMAPS_KEY;
      if (!key) {
        reject(new Error('NEXT_PUBLIC_GMAPS_KEY fehlt'));
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&libraries=places&language=de&region=DE`;
      script.async = true;
      script.onload = () => resolve(w.google);
      script.onerror = () => reject(new Error('Google Maps konnte nicht geladen werden'));
      document.head.appendChild(script);
    });
  }
  return mapsPromise;
}

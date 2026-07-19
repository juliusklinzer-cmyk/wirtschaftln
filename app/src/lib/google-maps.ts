/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Maps-JS-Script nur einmal laden (nur im Browser aufrufen).
 * Der API-Key ist referrer-beschränkt → alle Google-Aufrufe laufen clientseitig.
 */
let mapsPromise: Promise<any> | null = null;

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

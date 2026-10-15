import type { TenantGeo } from '@/lib/tenant-config-public';

/**
 * Best-effort-Geocoding (Nominatim/OSM). Zwei Versuche mit je 8 s, weil der
 * Dienst unter Last gern mal hängt (Passau-Gründung 15.10.2026 lief so ohne
 * Koordinaten durch). Scheitert leise → null.
 */
export async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  for (let versuch = 0; versuch < 2; versuch += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'wirtschaftln (Stammtisch-App)' }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data[0]) return null;
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    } catch {
      /* Timeout/Netz → nomoi probieren */
    }
  }
  return null;
}

/** Geo-Config eines Stammtischs aus der Stadt (Kartenmitte, 40 km Umkreis, Such-Suffix). */
export function geoFuerStadt(center: { lat: number; lng: number }, stadt: string): TenantGeo {
  return { center, boundsKm: 40, suchSuffix: stadt };
}

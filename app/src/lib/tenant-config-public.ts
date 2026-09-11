/**
 * Tenant-Config, der Teil, der auch im Client landen darf (via TenantProvider
 * als Props aus dem Server-Layout — NIE über NEXT_PUBLIC_*, das ist build-time
 * und plattform-global). Keine Imports: wird von Client- und Server-Code geteilt.
 */

export type TenantGeo = {
  /** Kartenmitte (z. B. Marienplatz) */
  center: { lat: number; lng: number };
  /** Radius in km um die Mitte: Places-Bias, Karten-Plausibilität, Server-Bounding-Box */
  boundsKm: number;
  /** Suffix für Textsuchen/Geocoding, z. B. „München" → „Hofbräuhaus München" */
  suchSuffix: string;
};

export type TenantFeatures = {
  /** 🤳 Der weiße Streifen vom Dani seim Handy (Gaudi-Ecke im Profil) */
  daniModus: boolean;
  /** Bayern/Sechzig-Picker mit Wappen statt freiem Vereinsfeld */
  vereinsWahl: boolean;
  /** Münchner Badge-Set (Moshammer, Alter Peter, … mit PNG-Art) statt generisch */
  muenchenBadges: boolean;
  /** „Bsucht vor da App"-Chronik (Altbestand-Import) */
  altbestand: boolean;
  /** Archiv als Karte (wandernd) — stammhaus kriegt eine Listen-Chronik (Welle 3) */
  archivKarte: boolean;
  /** Regel „koa Wirtshaus zweimal" (Welle 3: stammhaus überspringt sie) */
  nieZweimal: boolean;
  /** Brauerei-Logos (public/brand/biersorten, Quelle Wikipedia) statt Text/Emoji */
  brauereiLogos: boolean;
  /** Google-Places-Fotos der Wirtshäuser in die DB holen (Gründer-Bestand bleibt) */
  wirtshausFotos: boolean;
  /** Münchner Kindl als App-Icon, Alpen-Panorama am Desktop */
  muenchenBranding: boolean;
};

export type PublicTenantConfig = {
  id: string;
  name: string;
  motto: string | null;
  stadt: string | null;
  gruendungsjahr: number | null;
  typ: 'wandernd' | 'stammhaus';
  stammhausWirtshausId: string | null;
  /** Anzeigename vom Standard-Bier („Augustiner Hell") */
  bierName: string;
  /** Preis für a Hoibe in Cent, Grundlage aller Hoibe-Strafen */
  hoibePreisCents: number;
  geo: TenantGeo | null;
  features: TenantFeatures;
  istGruender: boolean;
  /** Eigenes Logo: /logo/<slug>-<hash>.png (?s=Größe), null = Wirtschaftln-Wappen */
  logoUrl: string | null;
};

/** Der eigene Stammtisch: alles an, wie's immer war. */
export const GRUENDER_FEATURES: TenantFeatures = {
  daniModus: true,
  vereinsWahl: true,
  muenchenBadges: true,
  altbestand: true,
  archivKarte: true,
  nieZweimal: true,
  brauereiLogos: true,
  wirtshausFotos: true,
  muenchenBranding: true,
};

/** Neue Stammtische: die Münchner Sonderlocken bleiben aus. */
export const GENERISCHE_FEATURES: TenantFeatures = {
  daniModus: false,
  vereinsWahl: false,
  // Badges mit Original-Bildern und -Namen für alle (Julius 11.09.2026)
  muenchenBadges: true,
  altbestand: false,
  archivKarte: true,
  nieZweimal: true,
  // Brauerei-Logos bleiben für alle an (nicht-kommerziell, Julius 11.09.2026)
  brauereiLogos: true,
  wirtshausFotos: false,
  muenchenBranding: false,
};

export const MUENCHEN_GEO: TenantGeo = {
  center: { lat: 48.137, lng: 11.575 },
  boundsKm: 60,
  suchSuffix: 'München',
};

/** Liegt der Punkt im erlaubten Umkreis? Ohne Geo-Config gibt's keine Einschränkung. */
export function imUmkreis(geo: TenantGeo | null, lat: number, lng: number): boolean {
  if (!geo) return true;
  const dLat = (lat - geo.center.lat) * 111;
  const dLng = (lng - geo.center.lng) * 111 * Math.cos((geo.center.lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng) <= geo.boundsKm;
}

/** Rechteck um die Mitte (für Places-Bias), Ecken als {lat,lng}. */
export function umkreisBounds(geo: TenantGeo): { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } {
  const dLat = geo.boundsKm / 111;
  const dLng = geo.boundsKm / (111 * Math.cos((geo.center.lat * Math.PI) / 180));
  return {
    sw: { lat: geo.center.lat - dLat, lng: geo.center.lng - dLng },
    ne: { lat: geo.center.lat + dLat, lng: geo.center.lng + dLng },
  };
}

/** „Hofbräuhaus München" — oder nur der Name, wenn der Stammtisch koa Geo-Config hat. */
export function mitOrt(name: string, geo: TenantGeo | null): string {
  return geo?.suchSuffix ? `${name}, ${geo.suchSuffix}` : name;
}

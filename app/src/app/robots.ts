import type { MetadataRoute } from 'next';

// Geschlossene Stammtisch-App, Suchmaschinen haben hier nix verloren.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } };
}

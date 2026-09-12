import type { MetadataRoute } from 'next';
import { tenantConfigAusCookie } from '@/lib/session';

/**
 * Manifest pro Mandant (aus dem Session-Cookie): Name/Beschreibung des
 * Stammtischs, das Münchner Kindl nur mit München-Branding (Gründer),
 * sonst das neutrale Wirtschaftln-Wappen.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const c = await tenantConfigAusCookie();
  const name = c?.name ?? 'Wirtschaftln';
  const muenchen = c?.features.muenchenBranding ?? false;
  const wo = c ? [c.stadt, c.gruendungsjahr ? `seit ${c.gruendungsjahr}` : null].filter(Boolean).join(' · ') : '';
  const description = c
    ? `${c.motto ? `${c.motto} ` : ''}Der Stammtisch${wo ? `, ${wo}` : ''}`
    : 'Die Stammtisch-App: Termine, Abstimmung, Kasse, Rangliste und Chronik für eure Runde.';
  return {
    // id + scope: stabile App-Identität für Chrome/WebAPK, hilft gegen
    // Play-Protect-Zicken bei der Installation
    id: '/',
    scope: '/',
    name,
    short_name: name.length <= 12 ? name : name.slice(0, 12),
    description,
    start_url: '/',
    display: 'standalone',
    background_color: '#07193A',
    theme_color: '#FFFFFF',
    lang: 'de',
    // App-Icon: beim Gründer das Münchner Kindl mit der Hoibe (seit 09.08.2026),
    // sonst das Wirtschaftln-Wappen (eigenes Design, lizenzfrei)
    icons: c?.logoUrl
      ? [
          { src: `${c.logoUrl}?s=192`, sizes: '192x192', type: 'image/png' },
          { src: `${c.logoUrl}?s=256`, sizes: '256x256', type: 'image/png' },
          { src: `${c.logoUrl}?s=512`, sizes: '512x512', type: 'image/png' },
          { src: `${c.logoUrl}?s=512`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
      : muenchen
      ? [
          { src: '/brand/kindl-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/brand/kindl-256.png', sizes: '256x256', type: 'image/png' },
          { src: '/brand/kindl-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/brand/kindl-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
      : [
          { src: '/brand/rauten-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/brand/rauten-256.png', sizes: '256x256', type: 'image/png' },
          { src: '/brand/rauten-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/brand/rauten-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
  };
}

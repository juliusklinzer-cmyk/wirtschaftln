import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // id + scope: stabile App-Identität für Chrome/WebAPK, hilft gegen
    // Play-Protect-Zicken bei der Installation
    id: '/',
    scope: '/',
    name: 'Wirtschaftln',
    short_name: 'Wirtschaftln',
    description: 'Oiwei anders. Oiwei dahoam. Der Stammtisch, München · seit 2019',
    start_url: '/',
    display: 'standalone',
    background_color: '#07193A',
    theme_color: '#FFFFFF',
    lang: 'de',
    // App-Icon: das Münchner Kindl mit der Hoibe (seit 09.08.2026)
    icons: [
      { src: '/brand/kindl-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/kindl-256.png', sizes: '256x256', type: 'image/png' },
      { src: '/brand/kindl-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/kindl-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

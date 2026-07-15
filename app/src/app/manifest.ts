import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wirtschaftln',
    short_name: 'Wirtschaftln',
    description: 'Oiwei anders. Oiwei dahoam. — Der Stammtisch, München · seit 2019',
    start_url: '/',
    display: 'standalone',
    background_color: '#07193A',
    theme_color: '#07193A',
    lang: 'de',
    icons: [
      { src: '/brand/shield-256.png', sizes: '256x256', type: 'image/png' },
      { src: '/brand/shield-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/shield-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

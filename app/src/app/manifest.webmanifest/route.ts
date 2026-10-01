import type { MetadataRoute } from 'next';
import { cookies } from 'next/headers';
import { tenantConfigAusCookie, GRUPPE_COOKIE, gruppeCookieOptionen } from '@/lib/session';
import { currentTenantOrNull } from '@/lib/db';

/**
 * Manifest pro Mandant (aus dem Session-Cookie): Name/Beschreibung des
 * Stammtischs, das Münchner Kindl nur mit München-Branding (Gründer),
 * sonst das neutrale Wirtschaftln-Wappen.
 *
 * Bewusst a Route-Handler statt manifest.ts: Next hängt beim Datei-Manifest
 * koa crossorigin="use-credentials" an den <link>, Chrome holt's dann OHNE
 * Cookie, kennt den Stammtisch ned und tauscht beim nächsten WebAPK-Update
 * des App-Icon gegen die Rauten (passiert am 01.10.2026). Den <link> setzt
 * jetzt das Root-Layout selber, mit Credentials.
 */
export async function GET() {
  const daten = await manifest();
  const res = new Response(JSON.stringify(daten), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'private, no-cache',
    },
  });
  // Alte Sessions (vor dem Merk-Cookie) nachrüsten, damit's Icon a nach'm Logout passt
  const jar = await cookies();
  const tenant = currentTenantOrNull();
  if (tenant && jar.get(GRUPPE_COOKIE)?.value !== tenant.id) jar.set(GRUPPE_COOKIE, tenant.id, gruppeCookieOptionen);
  return res;
}

async function manifest(): Promise<MetadataRoute.Manifest> {
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
    // Nur Hochformat (Android/Chrome halten sich dran; iOS ignoriert's, dort greift der Dreh-Hinweis in globals.css)
    orientation: 'portrait',
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

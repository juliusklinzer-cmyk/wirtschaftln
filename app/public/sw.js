// Wirtschaftln Service Worker — minimal: macht die App installierbar
// und hält Brand-Assets offline vor. Daten bleiben network-first.
// v4: Precache ohne München-Assets (Kindl, Panorama laufen beim Gründer über
// stale-while-revalidate), Push-Icon kommt pro Stammtisch im Payload mit.
const CACHE = 'wirtschaftln-v4';
const ASSETS = ['/brand/shield-256.png', '/brand/shield-512.png', '/brand/willi-256.png', '/brand/willi-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Web-Push: Notification anzeigen und beim Antippen die App öffnen
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Wirtschaftln', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Wirtschaftln', {
      body: data.body || '',
      icon: data.icon || '/brand/willi-256.png',
      badge: data.icon || '/brand/willi-256.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  // /_next/static/ ist content-gehasht → cache-first, ändert sich nie unter gleicher URL.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ??
          fetch(event.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
            return res;
          })
      )
    );
  }
  // /brand/ (Logos, Wappen) können sich unter gleicher URL ändern → stale-while-revalidate:
  // sofort aus'm Cache liefern, aber im Hintergrund frisch nachladen für's nächste Mal.
  else if (url.pathname.startsWith('/brand/')) {
    event.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(event.request).then((hit) => {
          const frisch = fetch(event.request)
            .then((res) => {
              if (res.ok) c.put(event.request, res.clone());
              return res;
            })
            .catch(() => hit);
          return hit ?? frisch;
        })
      )
    );
  }
});

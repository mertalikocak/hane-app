const CACHE_NAME = 'hane-app-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/logo.png'
];

// Timeout helper so hung mobile cellular sockets fall back to cache promptly
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Network timeout'));
    }, timeoutMs);

    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Ignore individual asset pre-cache errors during install
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Do not intercept external origins (e.g. Firebase, Google Fonts) or API routes
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  // Do not cache Next.js RSC flight queries as full HTML pages
  if (url.searchParams.has('_rsc')) return;

  // Do not intercept Next.js HMR / Turbopack dev server requests on localhost
  const isLocalhost =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (isLocalhost && url.pathname.startsWith('/_next/')) return;

  const isImmutableStatic =
    (!isLocalhost && url.pathname.startsWith('/_next/static/')) ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2');

  if (isImmutableStatic) {
    // Cache-First for immutable build chunks, fonts, and icons
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetchWithTimeout(event.request, 8000)
          .then((response) => {
            if (response && response.status === 200) {
              const resClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, resClone);
              });
            }
            return response;
          })
          .catch(() => {
            return new Response('', { status: 504, statusText: 'Gateway Timeout' });
          });
      })
    );
    return;
  }

  // Network-First with 4s cellular timeout for HTML navigations & other same-origin GETs
  event.respondWith(
    fetchWithTimeout(event.request, 4000)
      .then((response) => {
        if (response && response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/').then((rootCached) => {
              return (
                rootCached ||
                new Response(
                  '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hane App — Çevrimdışı</title></head><body style="background:#F5F0E8;color:#30263A;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;"><div><h1 style="font-size:20px;margin-bottom:8px;">Bağlantı Kurulamadı</h1><p style="font-size:14px;color:#544663;margin-bottom:16px;">İnternet bağlantınızı kontrol edip sayfayı yenileyin.</p><button onclick="location.reload()" style="background:#76548F;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-weight:600;cursor:pointer;">Yeniden Dene</button></div></body></html>',
                  {
                    status: 200,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                  }
                )
              );
            });
          }
          // Always return a valid Response object — never null (fixes WebKit TypeError)
          return new Response('', { status: 504, statusText: 'Offline' });
        });
      })
  );
});

// Push notification listener
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Hane Hatırlatıcı';
  const options = {
    body: data.body || 'Takviminizde planlanmış bir etkinlik var.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [150, 80, 150],
    data: {
      url: data.url || '/calendar',
      dateOfArrival: Date.now()
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click: focus existing window or open target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/calendar';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

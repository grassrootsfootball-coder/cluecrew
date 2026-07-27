/**
 * Session-asset service worker (BUILD-PHASE-4 §1): caches the app shell and
 * static assets so a mid-session connection drop never loses the screen the
 * child is on. Answers retry from the client; full offline is a non-goal.
 */
const CACHE = 'crew-shell-v1';
const SHELL = ['/crew', '/crew/play', '/cluecrew-logo.svg', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  // Static assets: cache-first. Pages/API: network-first with cache fallback.
  if (url.pathname.startsWith('/_next/static') || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ??
          fetch(event.request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            return response;
          }),
      ),
    );
    return;
  }
  if (url.pathname.startsWith('/crew')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached ?? caches.match('/crew'))),
    );
  }
});

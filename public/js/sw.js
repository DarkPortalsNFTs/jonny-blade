const CACHE_NAME = 'jonny-blades-v4';
const ASSETS = [
  '/',
  '/offline.html',
  '/css/style.css',
  '/js/main.js',
  '/images/logo-192.png',
  '/images/logo-512.png',
  '/images/logo-180.png',
  '/images/logo-32.png',
  '/images/hero.svg',
  '/images/product-razor.svg',
  '/images/product-cream.svg',
  '/images/product-oil.svg',
  '/images/product-pomade.svg',
  '/images/service-cut.svg',
  '/images/service-beard.svg',
  '/images/service-shave.svg',
  '/images/franchise-setup.svg',
  '/images/franchise-support.svg',
  '/images/franchise-growth.svg',
  '/images/location-morriston.svg',
  '/images/location-gorseinon.svg',
  '/images/location-skewen.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isNavigate = event.request.mode === 'navigate';
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => (isNavigate ? caches.match('/offline.html') : cached));
    })
  );
});

/* Lorefy service worker — same-origin app assets only. */
const CACHE = 'lorefy-v170-reader-discovery-v3';
const freshAssetPaths = [
  '/modules/',
  '/styles/',
  '/uploads/files/',
  '/config/',
  '/backend/',
  '/auth/',
  '/monitoring/'
];
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './privacy-policy.html',
  './terms.html',
  './support.html',
  './styles/lorefy-legal.css?v=20260715-v1',
  './styles/lorefy-ui.css?v=20260619-v2',
  './styles/lorefy-system.css?v=20260716-full-audit-v2',
  './styles/lorefy-redesign.css?v=20260711-ui-layout-v2',
  './styles/lorefy-apple-ui.css?v=20260714-profile-dark-v16',
  './styles/lorefy-share-studio.css?v=20260714-profile-dark-v16',
  './styles/lorefy-product-tools.css?v=20260716-community-unify-v3',
  './styles/lorefy-cinema-ui.css?v=20260805-cinema-v1',
  './modules/lorefy-cover-api.js?v=20260728-cover-proxy-v2',
  './modules/lorefy-catalog-plan.js?v=20260716-catalog-resilience-v2',
  './modules/lorefy-catalog-loader.js?v=20260726-full-catalog-v9',
  './modules/lorefy-catalog-identity.js?v=20260722-catalog-identity-security-v2',
  './modules/lorefy-product-core.js?v=20260715-product-core-v1',
  './modules/lorefy-product-tools.js?v=20260715-product-tools-v2',
  './modules/lorefy-user-discovery.js?v=20260810-reader-discovery-v3',
  './uploads/lorefy-catalog-map.js?v=20260715-progressive-v1',
  './uploads/lorefy-character-catalog.js?v=20260722-character-images-v2',
  './uploads/lorefy-literary-character-catalog.js?v=20260722-character-images-v2',
  './modules/lorefy-character-system.js?v=20260726-character-cast-v17',
  './modules/lorefy-v2.js?v=20260716-premium-stats-v1',
  './modules/lorefy-ui-runtime.js?v=20260620-skills-v1',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/lucide.js',
  './launch/brand/lorefy-feather.png',
  './monitoring/lorefy-sentry.js',
  './config/lorefy-runtime.js?v=20260805-apple-v1',
  './config/lorefy-config.js?v=20260805-local-demo-v3',
  './backend/lorefy-secure-storage.js?v=20260813-keychain-v1',
  './backend/lorefy-backend.js?v=20260813-security-v1',
  './modules/lorefy-subscriptions.js?v=20260722-billing-guard-v1',
  './backend/lorefy-ios-bridge.js',
  './backend/lorefy-ios-oauth.js?v=20260805-google-oauth-v1',
  './auth/lorefy-auth.js?v=20260703-oauth-v37',
  './modules/lorefy-catalog-updater.js?v=20260726-catalog-safety-v4',
  './uploads/lorefy-chapter-overrides.js?v=20260616-v23',
  './uploads/lorefy-catalog-aliases.js?v=20260622-audit1',
  './uploads/files/lorefy-app.js?v=20260728-cover-proxy-v2',
  './uploads/lorefy-data-part05.js?v=20260715-progressive-v1',
  './modules/lorefy-growth-features.js?v=20260726-character-cast-v3',
  './modules/lorefy-share-studio.js?v=20260715-share-images-v17',
  './uploads/files/lorefy-enrich.js',
  './launch/icons/icon-180.png',
  './launch/icons/icon-192.png',
  './launch/icons/icon-512.png',
  './launch/icons/maskable-512.png',
  './launch/icons/favicon-32.png'
];

const CATALOG = [
  './uploads/lorefy-data-part01.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part02.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part03.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part04.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part05.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part06.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part07.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part08.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part09.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part10.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part11.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part12.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part13.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part14.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part15.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part16.js?v=20260703-dataclean-v1',
  './uploads/lorefy-data-part17.js?v=20260703-dataclean-v1'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'LOREFY_CACHE_CATALOG') return;
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.allSettled(CATALOG.map((url) => cache.add(url))))
      .then((results) => self.clients.matchAll({ type: 'window' }).then((clients) => {
        const cached = results.filter((result) => result.status === 'fulfilled').length;
        clients.forEach((client) => client.postMessage({
          type: 'LOREFY_CATALOG_CACHE_READY',
          cached,
          total: CATALOG.length,
          complete: cached === CATALOG.length
        }));
      }))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put('./index.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (
    url.pathname.endsWith('/uploads/lorefy-catalog-manifest.json') ||
    url.pathname.includes('/uploads/catalog-deltas/')
  ) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  if (
    /\.(js|css)$/i.test(url.pathname) ||
    freshAssetPaths.some((path) => url.pathname.includes(path))
  ) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Do not cache arbitrary same-origin GETs: future authenticated/API routes
  // must never become cross-session service-worker entries by accident.
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

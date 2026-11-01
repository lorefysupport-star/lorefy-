/* Lorefy service worker — same-origin app assets only. */
const CACHE = 'lorefy-v657-community-routing';
const freshAssetPaths = [
  '/launch/decorations/refined/',
  '/modules/',
  '/styles/',
  '/uploads/files/',
  '/config/',
  '/backend/',
  '/auth/',
  '/monitoring/'
];
const CORE = [
 './styles/lorefy-share-composer.css?v=20261028-share-composer-v3',
 './modules/lorefy-share-composer.js?v=20261028-share-composer-v3',
 './styles/lorefy-notification-center.css?v=20261027-inbox-durable-v1',
 './styles/lorefy-profile-refined.css?v=20261029-shelf-acceptance-v1',
 './styles/lorefy-library-refined.css?v=20261028-reading-type-v1',
 './assets/home/berserk-home-v1.webp',
 './styles/lorefy-home-cinema.css?v=20261026-work-cinema-v1',
 './styles/lorefy-work-cinema.css?v=20261028-byline-type-v1',
 './styles/lorefy-home-immersive.css?v=20261101-home-reading-v1',
 './styles/lorefy-glass-materials.css?v=20261028-trust-studio-v2',
 './styles/lorefy-data-studio.css?v=20261028-trust-studio-v2',
 './styles/lorefy-trust-studio.css?v=20261028-report-studio-v1',
 './styles/lorefy-settings-studio.css?v=20261028-settings-studio-v1',
 './styles/lorefy-import-studio.css?v=20261030-import-reviews-v1',
 './styles/lorefy-custom-glass.css?v=20261027-theme-unity-v2',
 './styles/lorefy-profile-apple.css?v=20261027-profile-colors-v1',
 './styles/lorefy-work-studio.css?v=20261029-cover-editions-v1',
 './modules/lorefy-work-panels.js?v=20261029-cover-editions-v1',
 './modules/lorefy-home-cinema.js?v=20261101-home-reading-v1',
 './styles/lorefy-library-cinema.css?v=20261026-library-plain-v3',
 './modules/lorefy-library-cinema.js?v=20261101-home-reading-v1',
  './styles/lorefy-explore-cinema.css?v=20261029-search-editions-v1',
  './assets/shelves/wall-walnut-v1.png',
 './modules/lorefy-local-redesign.js?v=20261022-profile-1',
 './styles/lorefy-customize.css?v=20261021-local-review',
 './styles/lorefy-work-layout.css?v=20261013-final',
 './styles/lorefy-work-experience.css?v=20261021-chapter-title-hierarchy-v1',
  './uploads/lorefy-editorial-picks.js?v=20261017-editorial-comics-v1',
  './styles/lorefy-user-experience.css?v=20261015-connection-avatar-v1',
  './modules/lorefy-user-experience.js?v=20261015-connection-avatar-v1',
  './modules/lorefy-friend-activity.js?v=20261101-friend-logic-v1',
  './modules/lorefy-original-illustrated.js?v=20261013-all-profile-frames-v6',
  './modules/lorefy-original-autumn.js?v=20261013-all-profile-frames-v6',
  './modules/lorefy-original-original.js?v=20261013-all-profile-frames-v6',
  './modules/lorefy-decoration-billing.js?v=20261011-shop',
  './modules/lorefy-preview-readers.js?v=20261011-profile-sections-v1',
  './styles/lorefy-profile-sections.css?v=20261018-list-removal-v1',
  './modules/lorefy-profile-sections.js?v=20261029-profile-list-media-v1',
  './modules/lorefy-i18n.js?v=20261028-reading-terms-v1',
  './',
  './index.html',
  './manifest.webmanifest',
  './launch/decorations/originals/catalog.json',
  './privacy-policy.html',
  './terms.html',
  './support.html',
  './community-guidelines.html',
  './modules/lorefy-legal.js?v=20261028-legal-studio-v1',
  './styles/lorefy-legal.css?v=20261028-legal-studio-v1',
  './styles/lorefy-ui.css?v=20260619-v2',
  './styles/lorefy-system.css?v=20261021-sticky-home-tabs',
  './styles/lorefy-redesign.css?v=20260925-ui-coherence-v1',
  './styles/lorefy-apple-ui.css?v=20260925-ui-coherence-v1',
  './styles/lorefy-share-studio.css?v=20261024-banner-repairs-v1',
  './styles/lorefy-product-tools.css?v=20261004-reading-author-v1',
  './styles/lorefy-reading-diary.css?v=20261018-runtime-cleanup-v1',
  './styles/lorefy-chapter-detail.css?v=20261015-live-spoiler-v1',
  './styles/lorefy-cinema-ui.css?v=20261003-appearance-feather-v2',
  './styles/lorefy-native-layout-fix.css?v=20260921-product-remediation-v1',
  './styles/lorefy-review-social.css?v=20261021-stable-rendering',
  './styles/lorefy-community.css?v=20261028-community-copy-v1',
  './styles/lorefy-comics-search.css?v=20260923-comics-identity-v2',
  './styles/lorefy-auth-flow.css?v=20261018-minimal-entry-v1',
  './styles/lorefy-page-refresh.css?v=20261027-ui-refinement-v1',
  './styles/lorefy-design-system.css?v=20261018-social-profile-v1',
  './modules/lorefy-design-system.js?v=20261027-glass-depth-v3',
  './modules/lorefy-data-proxy.js?v=20260909-full-catalog-v1-tenrai-v1',
  './modules/lorefy-cover-api.js?v=20261029-cover-editions-v1-tenrai-v1',
  './modules/lorefy-catalog-policy.js?v=20261101-policy-v1',
  './modules/lorefy-catalog-plan.js?v=20261019-search-authors-v1-search-audit-v2',
  './modules/lorefy-catalog-loader.js?v=20261021-search-audit-fast-search-v1-search-audit-v2-policy-v1-identity-v1',
  './modules/lorefy-catalog-search-worker.js?v=20261019-search-authors-v1-fast-search-v1-search-audit-v2-policy-v1-identity-v1',
  './modules/lorefy-catalog-identity.js?v=20261101-identity-memo-v1',
  './modules/lorefy-comics-search.js?v=20260924-catalog-v1',
  './modules/lorefy-catalog-worker.js?v=20261019-search-authors-v1-fast-search-v1-search-audit-v2-policy-v1-identity-v1',
  './modules/lorefy-catalog-data.js?v=20261017-search-alias-v1-fast-search-v1-search-audit-v2',
  './modules/lorefy-reading-metrics.js?v=20261027-durable-inbox-v1',
  './modules/lorefy-reading-diary-core.js?v=20261101-diary-units-v1',
  './modules/lorefy-reading-diary.js?v=20261101-diary-retry-v1',
  './modules/lorefy-chapter-detail-core.js?v=20261015-reading-owner-v1',
  './modules/lorefy-chapter-metadata.js?v=20261003-beta-final-v1-tenrai-v1',
  './modules/lorefy-chapter-detail.js?v=20261026-work-studio-v1',
  './modules/lorefy-product-core.js?v=20261028-report-studio-v1',
  './modules/lorefy-catalog-requests.js?v=20261025-open-catalog',
  './modules/lorefy-product-tools.js?v=20261028-report-studio-v1',
  './modules/lorefy-user-discovery.js?v=20261026-explore-search-v1-search-audit-v2',
  './modules/lorefy-preview-cleanup.js?v=20261001-prebuild-v1',
  './uploads/lorefy-catalog-map.js?v=20261008-arabic-breadth-v4',
  './uploads/lorefy-catalog-summary.js?v=20261018-runtime-cleanup-v1',
  './modules/lorefy-catalog-map-loader.js?v=20261018-runtime-cleanup-v1',
  './uploads/lorefy-arabic-library.js?v=20261008-arabic-breadth-v4',
  './uploads/lorefy-booktok-library.js?v=20260830-booktok-library-v1',
  './modules/lorefy-comics-taxonomy.js?v=20261008-arabic-library-v2',
  './uploads/lorefy-catalog-quality.js?v=20261011-explore-v2',
  './modules/lorefy-bibliographic-overrides.js?v=20261020-publisher-synopsis-v2',
  './modules/lorefy-character-system.js?v=20261028-image-picker-lifecycle-v2-tenrai-v1-search-audit-v2',
  './modules/lorefy-v2.js?v=20261016-statistics-activity-v1',
  './modules/lorefy-ui-runtime.js?v=20261019-render-recovery-v1',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/lucide.js',
  './launch/brand/lorefy-feather.png',
  './launch/brand/lorefy-reading-scene.jpg',
  './monitoring/lorefy-sentry.js',
  './config/lorefy-runtime.js?v=20260930-character-share-v1',
  './config/lorefy-config.js?v=20260924-catalog-v1',
  './backend/lorefy-secure-storage.js?v=20260824-keychain-v2',
  './modules/lorefy-storage-budget.js?v=20261021-save-quota',
  './backend/lorefy-backend.js?v=20261101-friend-logic-v1',
  './backend/lorefy-custom-artwork.js?v=20261019-artwork-quota-v1',
  './backend/lorefy-native-crypto.js?v=20261001-auth-recovery-v1',
  './modules/lorefy-subscriptions.js?v=20260722-billing-guard-v1',
  './backend/lorefy-ios-bridge.js?v=20261001-auth-recovery-v1',
  './backend/lorefy-ios-oauth.js?v=20261003-beta-final-v1',
  './backend/lorefy-native-runtime.js?v=20261030-inbox-receipt-scope-v1',
  './backend/lorefy-native-photos.js?v=20261001-build33',
'./auth/lorefy-auth.js?v=20261007-review-identity-v1',
  './modules/lorefy-catalog-updater.js?v=20260726-catalog-safety-v4',
  './uploads/lorefy-chapter-overrides.js?v=20260616-v23',
  './uploads/lorefy-catalog-aliases.js?v=20260622-audit1',
  './styles/lorefy-public-profile.css?v=20261011-public-profile-layout-v4',
  './styles/lorefy-visual-polish.css?v=20260930-reference-v2',
  './modules/lorefy-public-appearance.js?v=20261024-book-showcase-v1',
  './modules/lorefy-public-profile.js?v=20261101-profile-count-v1',
  './modules/lorefy-community.js?v=20261101-home-reactions-v1',
  './modules/lorefy-page-refresh.js?v=20261027-ui-refinement-v1',
  './modules/lorefy-library-view.js?v=20261029-library-media-v1',
  './modules/lorefy-interface-settings.js?v=20261028-settings-studio-v1',
  './modules/lorefy-profile-shop.js?v=20261025-frame-unity-v2',
  './styles/lorefy-decoration-store.css?v=20261025-store-v2',
  './styles/lorefy-profile-shop.css?v=20261013-all-profile-frames-v6',
  './modules/lorefy-frame-motion.js?v=20261025-frame-unity-v2',
  './modules/lorefy-bitmap-rig.js?v=20261025-frame-unity-v2',
  './modules/lorefy-frame-restoration.js?v=20261025-frame-unity-v2',
  './launch/decorations/refined/manifest.json',
  './modules/lorefy-avatar-rig.js?v=20261025-pfp-actions-v1',
  './modules/lorefy-motion-atelier.js?v=20261025-frame-unity-v2',
  './modules/lorefy-elven-motion.js?v=20261025-frame-unity-v2',
  './styles/lorefy-frame-motion.css?v=20261025-frame-unity-v2',
  './styles/lorefy-interface-settings.css?v=20261009-custom-appearance-v1',
  './modules/lorefy-scroll-memory.js?v=20261003-home-social-v2',
  './modules/lorefy-cover-media.js?v=20261101-slow-media-v1',
  './modules/lorefy-library-media.js?v=20261029-home-media-v1',
  './styles/lorefy-cover-media.css?v=20261029-shelf-acceptance-v1',
  './modules/lorefy-review-editor.js?v=20261101-recommendation-logic-v1',
  './styles/lorefy-review-editor.css?v=20261004-work-surface-v3',
  './styles/lorefy-work-surface.css?v=20261011-work-lists-v1',
  './styles/lorefy-character-atlas.css?v=20261007-character-atlas-v1',
  './modules/lorefy-work-relations.js?v=20261007-work-relations-v3',
  './styles/lorefy-work-relations.css?v=20261007-work-relations-v3',
  './modules/lorefy-photo-framer.js?v=20261024-banner-repairs-v1',
  './modules/lorefy-explore-studio.js?v=20261029-search-editions-v1-search-audit-v2',
  './styles/lorefy-explore-studio.css?v=20261021-explore-refine-v2',
  './styles/lorefy-profile-layout.css?v=20261009-panoramic-identity-v3',
  './modules/lorefy-profile-layout.js?v=20261023-reader-layout-v1',
  './modules/lorefy-reader-layout.js?v=20261029-library-media-v1',
  './styles/lorefy-reader-layout.css?v=20261024-banner-repairs-v2',
  './styles/lorefy-book-showcase.css?v=20261028-reading-type-v1',
  './styles/lorefy-profile-header.css?v=20261024-banner-repairs-v4',
  './modules/lorefy-profile-header.js?v=20261025-restored-v1',
  './uploads/files/lorefy-app.js?v=20261101-community-routing-v1',
  './modules/lorefy-catalog-detail-cache.js?v=20260924-catalog-search-v1',
  './modules/lorefy-open-catalog.js?v=20261025-open-catalog-search-audit-v2',
  './modules/lorefy-api-catalog.js?v=20261029-search-editions-v1-fast-search-v1-search-audit-v2',
  './uploads/lorefy-data-part05.js?v=20261013-discover-reviewed-v2',
  './modules/lorefy-growth-features.js?v=20261101-home-reactions-v1',
  './modules/lorefy-share-studio.js?v=20261028-share-composer-v3',
  './uploads/files/lorefy-enrich.js?v=20260908-beta-audit-v1',
  './launch/icons/icon-180.png',
  './launch/icons/icon-192.png',
  './launch/icons/icon-512.png',
  './launch/icons/maskable-512.png',
  './launch/icons/favicon-32.png'
];

const CATALOG = [
  './output/api-catalog/manifest.json',
  './output/api-catalog/manga.json',
  './output/api-catalog/manhwa.json',
  './output/api-catalog/manhua.json',
  './output/api-catalog/comics.json',
  './output/api-catalog/novel.json',
  './output/api-catalog/book.json',
  './output/api-catalog/light-novel.json',
  './output/api-catalog/web-novel.json',
  './uploads/lorefy-character-catalog.js?v=20260722-character-images-v2',
  './uploads/lorefy-literary-character-catalog.js?v=20260722-character-images-v2',
  './uploads/lorefy-comics-character-catalog.js?v=20260831-comic-images-v2',
  './uploads/lorefy-data-part01.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part02.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part03.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part04.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part05.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part06.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part07.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part08.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part09.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part10.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part11.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part12.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part13.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part14.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part15.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part16.js?v=20261013-discover-reviewed-v2',
  './uploads/lorefy-data-part17.js?v=20261013-discover-reviewed-v2'
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
    url.pathname.endsWith('/uploads/catalog-search-index.json') ||
    url.pathname.includes('/uploads/catalog-runtime/') ||
    url.pathname.includes('/uploads/catalog-deltas/') ||
    url.pathname.includes('/output/api-catalog/')
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

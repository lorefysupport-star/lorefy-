# Lorefy Remote API Catalog

The bundled catalog stays as the offline baseline. New and missing works are
loaded through `modules/lorefy-api-catalog.js` and cached in
`localStorage["lorefy.api.catalog.cache.v1"]`.

## Sources

- `MangaDex`: manga, manhwa, manhua, and comics metadata.
- `Open Library`: books, novels, web novels, light novels, and comics metadata.
- `AniList`: enabled as a provider, but the module treats temporary 403/5xx
  failures as partial results and falls back to the other sources.
- `Google Books`: disabled by default because production use should provide an
  API key. Enable it with `googleBooks: true` and `googleBooksApiKey`.

## Runtime Config

```js
window.LOREFY_REMOTE_CATALOG = {
  enabled: true,
  autoSearch: true,
  autoWarmCurrentType: true,
  warmAllTypes: true,
  pagesPerWarmType: 1,
  perPage: 36,
  maxCachedWorks: 2500,
  proxyBaseUrl: "api/catalog",
  googleBooksApiKey: "optional-key",
  providers: {
    anilist: true,
    mangaDex: true,
    openLibrary: true,
    googleBooks: false
  }
};
```

## Manual Calls

```js
await LorefyApiCatalog.search("solo leveling", "Manhwa");
await LorefyApiCatalog.loadType("Book", { pages: 2 });
await LorefyApiCatalog.loadAllTypes({ pages: 1 });
```

The module only adds works that do not already exist by exact ID or title/type,
so local originals remain unchanged.

For local preview, run `node work/lorefy-api-server.js 8792` instead of a pure
static server. The same `/api/catalog/...` shape should be mirrored by the
production Edge Function.

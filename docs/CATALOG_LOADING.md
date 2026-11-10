# Catalog loading

Arabic synopsis data is independent from the title/alias search index. The
canonical `uploads/lorefy-ar-enrichment.js` is now a build input, not a timed
homepage download. `node tools/build-arabic-enrichment.js` generates256 bounded
JSON shards and their manifest; work details fetch only their matching shard.
Native preparation runs this generator and omits the redundant original runtime
map. See [the measured repair](DEMAND_SYNOPSIS_PERFORMANCE_2026-11-10.md) for
exact parity, cache/failure behavior and performance limits.

Chapter totals remain synchronous. `node tools/build-chapter-runtime.js` factors
repeated metadata constants into `uploads/lorefy-chapter-runtime.js` without
changing any source record. Native preparation runs it automatically. The original
`lorefy-chapter-overrides.js` stays canonical but is no longer a runtime download.
See [the chapter performance receipt](CHAPTER_RUNTIME_PERFORMANCE_2026-11-10.md).

The catalog has 163 numbered data parts. `index.html` starts with one useful
part, chosen from the current work link or format. The app can show that part
immediately. It does not download the remaining parts at startup.

When a reader searches, `modules/lorefy-catalog-search-worker.js` loads the
smaller `uploads/catalog-search-index.json` and finds which parts contain
matches. `modules/lorefy-catalog-loader.js` then loads the best matching parts
first. The **Show more** button loads another batch. Browsing without a query
also loads more parts only when requested. Direct work links and saved library
items load their mapped parts without searching.

The index is generated from `uploads/catalog-runtime/` by
`node tools/build-catalog-search-index.mjs`. Run that command after catalog
data changes. `node tools/prepare-ios-web.mjs` rebuilds the runtime catalog,
regenerates the index, and copies both into `ios-web/`. The native build sync
copies `ios-web/` into the Xcode public bundle.

Check the behavior with:

```sh
node --test --test-concurrency=1 tests/*.test.js
```

The search index contains only discovery fields. Full descriptions, chapters,
and other work data remain in the numbered parts. A first search downloads
the index; later searches in the same session reuse it in the worker. If the
index is unavailable, the app reports that search could not complete.

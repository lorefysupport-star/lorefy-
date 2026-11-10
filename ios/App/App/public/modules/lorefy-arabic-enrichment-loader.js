(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.LorefyArabicEnrichmentLoader = factory(root, root.LorefyArabicEnrichmentRuntime);
})(typeof window !== 'undefined' ? window : globalThis, function (root, manifest) {
  'use strict';
  var cache = new Map(), pending = new Map(), queue = [], active = 0;
  var entries = root.LorefyArabicEnrichment || (root.LorefyArabicEnrichment = {});
  var own = function (object, key) { return Object.prototype.hasOwnProperty.call(object, key); };
  function bucketForId(id) {
    var hash = 2166136261;
    for (var i = 0; i < String(id).length; i++) hash = Math.imul(hash ^ String(id).charCodeAt(i), 16777619);
    return (hash & 255).toString(16).padStart(2, '0');
  }
  function pump() {
    while (active < 2 && queue.length) { active++; queue.shift()(); }
  }
  function load(bucket) {
    if (cache.has(bucket)) {
      var cached = cache.get(bucket); cache.delete(bucket); cache.set(bucket, cached);
      return Promise.resolve(cached);
    }
    if (pending.has(bucket)) return pending.get(bucket);
    var job = new Promise(function (resolve) {
      queue.push(function () {
        var controller = root.AbortController ? new root.AbortController() : null;
        var timer, settled = false;
        function finish(value) {
          if (settled) return;
          settled = true; root.clearTimeout(timer);
          if (value) {
            cache.set(bucket, value);
            while (cache.size > 8) cache.delete(cache.keys().next().value);
          }
          pending.delete(bucket); active--; resolve(value); pump();
        }
        timer = root.setTimeout(function () {
          if (controller) controller.abort();
          finish(null);
        }, 8000);
        Promise.resolve().then(function () {
          return root.fetch('uploads/arabic-enrichment/' + bucket + '.json?v=' + manifest.contentHash,
            {cache: 'default', signal: controller ? controller.signal : undefined});
        }).then(function (response) {
          if (!response.ok) throw new Error('Arabic synopsis shard unavailable');
          return response.json();
        }).then(function (data) {
          if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid synopsis shard');
          finish(data);
        }).catch(function () { finish(null); });
      });
    });
    pending.set(bucket, job); pump();
    return job;
  }
  async function ensure(value) {
    var id = typeof value === 'string' ? value : '';
    if (!id || id.length > 300 || ['__proto__', 'constructor', 'prototype'].includes(id)) return null;
    if (own(entries, id)) return entries[id];
    if (!manifest || manifest.schema !== 1 || manifest.buckets !== 256 || !/^[a-f0-9]+$/.test(manifest.contentHash || '') || typeof root.fetch !== 'function') return null;
    var data = await load(bucketForId(id));
    if (!data || !own(data, id)) return null;
    var entry = data[id];
    if (!entry || typeof entry !== 'object' || typeof entry.synopsisAr !== 'string') return null;
    entries[id] = entry;
    return entry;
  }
  function selectedId() {
    var params = new root.URLSearchParams(root.location.search || '');
    return params.get('route') === 'detail' ? params.get('novel') || params.get('work') || '' : '';
  }
  async function selected() {
    var route = selectedId();
    if (!route) return;
    var id = String((root.LorefyCatalogAliases || {})[route] || route);
    if (!(await ensure(id)) || selectedId() !== route || String((root.LorefyCatalogAliases || {})[route] || route) !== id) return;
    var work = (root.LorefyMangaData || []).find(function (record) { return String(record.id) === id; });
    if (work && root.LorefyEnrich && root.LorefyEnrich.applyCachedAll([work]) && typeof root.__lorefyRefresh === 'function') root.__lorefyRefresh();
  }
  if (root.document && root.location && root.URLSearchParams) {
    root.addEventListener('lorefy:routechange', selected);
    root.addEventListener('lorefy:catalog-ingested', selected);
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', selected);
    else selected();
  }
  return {ensure: ensure, bucketForId: bucketForId};
});

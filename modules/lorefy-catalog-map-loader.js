(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.LorefyCatalogMapLoader = factory(root);
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  var inFlight = null;
  var ASSET = 'uploads/lorefy-catalog-map.js?v=20261008-arabic-breadth-v4';
  function ensure() {
    var manifest = root.LorefyCatalogManifest || {};
    if (manifest.workParts) return Promise.resolve(manifest);
    if (inFlight) return inFlight;
    var script = root.document.createElement('script');
    var settled = false, timer, resolve;
    var promise = new Promise(function (done) { resolve = done; });
    inFlight = promise;
    function finish(success) {
      if (settled) return;
      settled = true;
      root.clearTimeout(timer);
      script.onload = script.onerror = null;
      if (!success) { root.LorefyCatalogManifest = manifest; if (script.remove) script.remove(); }
      if (inFlight === promise) inFlight = null;
      resolve(success ? manifest : null);
    }
    script.src = ASSET;
    script.async = true;
    script.onload = function () {
      if (settled) return;
      var full = root.LorefyCatalogManifest;
      if (!full || !full.workParts || typeof full.workParts !== 'object' || Array.isArray(full.workParts)) { finish(false); return; }
      // Keep the summary object captured by the catalog loader alive.
      Object.assign(manifest, full);
      root.LorefyCatalogManifest = manifest;
      finish(true);
    };
    script.onerror = function () { finish(false); };
    timer = root.setTimeout(function () { finish(false); }, 20000);
    try { root.document.head.appendChild(script); } catch (error) { finish(false); }
    return promise;
  }
  return { ensure: ensure };
});

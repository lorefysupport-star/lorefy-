(function (global) {
  "use strict";

  var CACHE_KEY = "lorefy.catalog.deltaCache.v1";
  var STATE_KEY = "lorefy.catalog.updateState.v1";
  var DEFAULT_MANIFEST_URL = "uploads/lorefy-catalog-manifest.json";
  var WEEK_MS = 1000 * 60 * 60 * 24 * 7;
  var MAX_DELTA_ROWS = 5000;
  var MAX_ALIAS_ROWS = 2000;
  var MAX_DELTA_TEXT_LENGTH = 12 * 1024 * 1024;
  var MAX_DELTA_OBJECTS = 20000;

  function config() {
    return global.LOREFY_CATALOG_UPDATES || {};
  }

  function safeJson(value, fallback) {
    try {
      return JSON.parse(value || "null") || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function read(key, fallback) {
    try {
      return safeJson(global.localStorage && global.localStorage.getItem(key), fallback);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      if (global.localStorage) global.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function unsafeDeltaError(code, message) {
    var error = new Error(message);
    error.code = code;
    return error;
  }

  function assertSafeDeltaKeys(value) {
    if (!value || typeof value !== "object") return;
    var pending = [value];
    var seen = typeof WeakSet === "function" ? new WeakSet() : null;
    var visited = 0;
    while (pending.length) {
      var current = pending.pop();
      if (!current || typeof current !== "object") continue;
      if (seen) {
        if (seen.has(current)) continue;
        seen.add(current);
      }
      visited += 1;
      if (visited > MAX_DELTA_OBJECTS) {
        throw unsafeDeltaError("LOREFY_CATALOG_DELTA_UNSAFE_STRUCTURE", "catalog delta has too many nested objects");
      }
      if (Array.isArray(current)) {
        current.forEach(function (item) { pending.push(item); });
        continue;
      }
      Object.keys(current).forEach(function (key) {
        if (key === "__proto__" || key === "prototype" || key === "constructor") {
          throw unsafeDeltaError("LOREFY_CATALOG_DELTA_UNSAFE_KEY", "catalog delta contains a reserved object key");
        }
        pending.push(current[key]);
      });
    }
  }

  function validateDelta(delta) {
    delta = delta || {};
    assertSafeDeltaKeys(delta);
    var upserts = asArray(delta.upserts || delta.items);
    var patches = asArray(delta.patches);
    var removeIds = asArray(delta.removeIds || delta.removedIds || delta.deletes);
    var aliases = delta.aliases && typeof delta.aliases === "object" ? Object.keys(delta.aliases) : [];
    var rowCount = upserts.length + patches.length + removeIds.length;
    if (rowCount > MAX_DELTA_ROWS || aliases.length > MAX_ALIAS_ROWS) {
      var rowError = new Error("catalog delta exceeds the safety limits");
      rowError.code = "LOREFY_CATALOG_DELTA_TOO_LARGE";
      throw rowError;
    }
    var serializedLength = 0;
    try { serializedLength = JSON.stringify(delta).length; } catch (e) { serializedLength = MAX_DELTA_TEXT_LENGTH + 1; }
    if (serializedLength > MAX_DELTA_TEXT_LENGTH) {
      var sizeError = new Error("catalog delta payload is too large");
      sizeError.code = "LOREFY_CATALOG_DELTA_TOO_LARGE";
      throw sizeError;
    }
    return { upserts: upserts, patches: patches, removeIds: removeIds };
  }

  function clone(value) {
    return safeJson(JSON.stringify(value || {}), {});
  }

  function data() {
    if (!Array.isArray(global.LorefyMangaData)) global.LorefyMangaData = [];
    return global.LorefyMangaData;
  }

  function indexById(items, id) {
    id = String(id || "");
    for (var i = 0; i < items.length; i++) {
      if (String(items[i] && items[i].id) === id) return i;
    }
    return -1;
  }

  function markNeedsIndex(work) {
    if (!work || typeof work !== "object") return;
    if (work._indexed) work._indexed = false;
    work._catalogUpdatedAt = new Date().toISOString();
  }

  function mergeWork(existing, incoming) {
    var patch = clone(incoming);
    if (!patch.id) return false;
    if (existing) {
      Object.keys(patch).forEach(function (key) {
        if (key !== "id" && patch[key] !== undefined) existing[key] = patch[key];
      });
      markNeedsIndex(existing);
      return "updated";
    }
    patch.id = String(patch.id);
    patch._catalogAddedAt = new Date().toISOString();
    data().push(patch);
    return "added";
  }

  function applyAliases(aliases) {
    if (!aliases || typeof aliases !== "object") return 0;
    if (!global.LorefyCatalogAliases || typeof global.LorefyCatalogAliases !== "object") {
      global.LorefyCatalogAliases = {};
    }
    var count = 0;
    Object.keys(aliases).forEach(function (key) {
      if (aliases[key]) {
        global.LorefyCatalogAliases[key] = aliases[key];
        count++;
      }
    });
    return count;
  }

  function applyDelta(delta, options) {
    options = options || {};
    delta = delta || {};
    var validated = validateDelta(delta);
    var items = data();
    var added = 0, updated = 0, removed = 0;
    var removeIds = validated.removeIds;

    var removeSet = new Set(removeIds.map(function (id) { return String(id); }));
    if (removeSet.size) {
      var kept = items.filter(function (work) { return !removeSet.has(String(work && work.id)); });
      removed = items.length - kept.length;
      items.length = 0;
      Array.prototype.push.apply(items, kept);
    }

    var positions = new Map();
    items.forEach(function (work, index) {
      if (work && work.id != null) positions.set(String(work.id), index);
    });

    validated.upserts.concat(validated.patches).forEach(function (work) {
      if (!work || !work.id) return;
      var id = String(work.id);
      var at = positions.has(id) ? positions.get(id) : -1;
      var result = mergeWork(at >= 0 ? items[at] : null, work);
      if (result === "added") {
        added++;
        positions.set(id, items.length - 1);
      }
      else if (result === "updated") updated++;
    });

    var aliases = applyAliases(delta.aliases);
    if (options.cache !== false && delta.version) write(CACHE_KEY, delta);

    if (options.canonicalize !== false && global.LorefyCatalogIdentity && typeof global.LorefyCatalogIdentity.organizeCatalog === "function") {
      global.LorefyCatalogIdentity.organizeCatalog(items, {
        aliases: global.LorefyCatalogAliases || (global.LorefyCatalogAliases = {})
      });
    }

    if (options.refresh !== false) {
      try {
        if (typeof global.__lorefyIngest === "function") global.__lorefyIngest();
        if (!global.__lorefyIngestAsync && typeof global.__lorefyRefresh === "function") global.__lorefyRefresh();
      } catch (e) {}
    }

    return {
      version: delta.version || "",
      added: added,
      updatedWorks: updated,
      removed: removed,
      aliases: aliases
    };
  }

  function versionRank(version) {
    version = String(version || "");
    var weekly = version.match(/^(\d{4})-W(\d{1,2})(?:\D|$)/);
    if (weekly) return Number(weekly[1]) * 100 + Number(weekly[2]);
    var digits = version.match(/(\d{6,})/);
    return digits ? Number(digits[1]) : null;
  }

  function isNewerVersion(next, current) {
    if (!next) return false;
    if (!current) return true;
    var a = versionRank(next);
    var b = versionRank(current);
    if (a != null && b != null) return a > b;
    return String(next) > String(current);
  }

  function resolveUrl(url, baseUrl) {
    try {
      return new URL(url, new URL(baseUrl || global.location.href, global.location.href)).toString();
    } catch (e) {
      return url;
    }
  }

  function readResponseText(response, maxBytes) {
    var reader = response.body && response.body.getReader && response.body.getReader();
    if (!reader) {
      return response.text().then(function (text) {
        if (text.length > maxBytes) {
          var fallbackError = new Error("catalog response is too large");
          fallbackError.code = "LOREFY_CATALOG_DELTA_TOO_LARGE";
          throw fallbackError;
        }
        return text;
      });
    }
    var decoder = new TextDecoder();
    var chunks = [];
    var total = 0;
    function next() {
      return reader.read().then(function (result) {
        if (result.done) return chunks.join("") + decoder.decode();
        total += result.value.byteLength || result.value.length || 0;
        if (total > maxBytes) {
          try { reader.cancel(); } catch (error) {}
          var sizeError = new Error("catalog response is too large");
          sizeError.code = "LOREFY_CATALOG_DELTA_TOO_LARGE";
          throw sizeError;
        }
        chunks.push(decoder.decode(result.value, { stream: true }));
        return next();
      });
    }
    return next();
  }

  function fetchJson(url) {
    return global.fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    }).then(function (response) {
      if (!response.ok) throw new Error("catalog fetch " + response.status);
      var declared = Number(response.headers && response.headers.get && response.headers.get("content-length"));
      if (declared && declared > MAX_DELTA_TEXT_LENGTH) {
        var sizeError = new Error("catalog response is too large");
        sizeError.code = "LOREFY_CATALOG_DELTA_TOO_LARGE";
        throw sizeError;
      }
      return readResponseText(response, MAX_DELTA_TEXT_LENGTH).then(function (text) {
        if (text.length > MAX_DELTA_TEXT_LENGTH) {
          var bodyError = new Error("catalog response is too large");
          bodyError.code = "LOREFY_CATALOG_DELTA_TOO_LARGE";
          throw bodyError;
        }
        try { return JSON.parse(text); } catch (error) {
          error.code = "LOREFY_CATALOG_INVALID_JSON";
          throw error;
        }
      });
    });
  }

  function state() {
    return read(STATE_KEY, {});
  }

  function setState(value) {
    var next = Object.assign({}, state(), value || {});
    if (next.status === "ready" && !(value && value.error)) delete next.error;
    write(STATE_KEY, next);
    return next;
  }

  function checkNow(options) {
    options = options || {};
    var cfg = config();
    if (cfg.enabled === false) return Promise.resolve({ updated: false, skipped: "disabled" });
    var manifestUrl = options.manifestUrl || cfg.manifestUrl || global.LOREFY_CATALOG_MANIFEST_URL || DEFAULT_MANIFEST_URL;
    setState({ status: "checking", checkedAt: new Date().toISOString() });
    return fetchJson(manifestUrl).then(function (manifest) {
      manifest = manifest || {};
      var current = state().version;
      if (!options.force && !isNewerVersion(manifest.version, current)) {
        setState({ status: "ready", version: current || manifest.version || "", checkedAt: new Date().toISOString() });
        return { updated: false, version: current || manifest.version || "" };
      }
      if (!manifest.deltaUrl) {
        setState({ status: "ready", version: manifest.version || current || "", checkedAt: new Date().toISOString() });
        return { updated: false, version: manifest.version || current || "" };
      }
      var deltaUrl = resolveUrl(manifest.deltaUrl, manifestUrl);
      return fetchJson(deltaUrl).then(function (delta) {
        delta = delta || {};
        if (!delta.version) delta.version = manifest.version;
        var summary = applyDelta(delta, { cache: true, refresh: true });
        setState(Object.assign({}, summary, {
          status: "ready",
          version: delta.version || manifest.version || "",
          checkedAt: new Date().toISOString(),
          appliedAt: new Date().toISOString(),
          manifestUrl: manifestUrl,
          deltaUrl: deltaUrl
        }));
        return Object.assign({}, summary, { updated: true });
      });
    }).catch(function (error) {
      setState({ status: "error", checkedAt: new Date().toISOString(), error: error && error.message || String(error) });
      return { updated: false, error: error && error.message || String(error) };
    });
  }

  function maybeCheck() {
    var cfg = config();
    if (cfg.enabled === false) return Promise.resolve({ updated: false, skipped: "disabled" });
    var last = Date.parse(state().checkedAt || "0") || 0;
    var interval = Number(cfg.checkIntervalMs) || WEEK_MS;
    if (Date.now() - last < interval) return Promise.resolve({ updated: false, skipped: "fresh" });
    return checkNow();
  }

  try {
    var cached = read(CACHE_KEY, null);
    if (cached && cached.version) applyDelta(cached, { cache: false, refresh: true });
  } catch (e) {}

  global.LorefyCatalogUpdater = {
    CACHE_KEY: CACHE_KEY,
    STATE_KEY: STATE_KEY,
    applyDelta: applyDelta,
    checkNow: checkNow,
    maybeCheck: maybeCheck,
    state: state
  };

  if (global.document && typeof global.document.addEventListener === "function") {
    global.document.addEventListener("DOMContentLoaded", function () {
      var cfg = config();
      if (cfg.autoCheck === false) return;
      setTimeout(function () { maybeCheck(); }, Number(cfg.startDelayMs) || 2500);
    });
  }
})(typeof window !== "undefined" ? window : this);

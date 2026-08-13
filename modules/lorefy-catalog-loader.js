(function (global) {
  "use strict";

  var doc = global.document;
  var manifest = global.LorefyCatalogManifest || {};
  var planner = global.LorefyCatalogPlan;
  if (!doc || !planner) return;

  var loaded = new Set((global.LOREFY_INITIAL_CATALOG_PARTS || []).map(Number));
  var loading = new Map();
  var activeQueue = Promise.resolve();
  var version = "20260726-full-catalog-v9";
  var refreshTimer = 0;
  var pendingProgressPart = 0;
  var REFRESH_DEBOUNCE_MS = 700;
  var FULL_CATALOG_START_DELAY_MS = 850;
  var PART_LOAD_GAP_MS = 1600;
  var WORKER_BATCH_ACK_DELAY_MS = 12;
  var fullCatalogTimer = 0;
  var fullCatalogRequested = false;
  var backgroundLoadInFlight = false;
  var deferredRefresh = false;
  var catalogWorker = null;
  var workerCatalogReady = false;
  var workerStagedRecords = [];
  Array.prototype.forEach.call(doc.scripts || [], function (script) {
    var match = String(script.src || "").match(/lorefy-data-part(\d+)\.js/i);
    if (match) loaded.add(Number(match[1]));
  });

  function routeState() {
    var params = new URLSearchParams(global.location.search || "");
    return {
      type: planner.normalizeRouteType(params.get("type")),
      workId: params.get("novel") || params.get("work") || ""
    };
  }

  function notify(part) {
    try {
      if (!workerCatalogReady && global.LorefyCatalogIdentity && typeof global.LorefyCatalogIdentity.organizeCatalog === "function") {
        global.LorefyCatalogIdentity.organizeCatalog(global.LorefyMangaData, {
          aliases: global.LorefyCatalogAliases || (global.LorefyCatalogAliases = {})
        });
      }
    } catch (error) {}
    try { if (typeof global.__lorefyIngest === "function") global.__lorefyIngest(); } catch (error) {}
    try {
      if (!global.__lorefyIngestAsync && typeof global.__lorefyRefresh === "function") global.__lorefyRefresh();
    } catch (error) {}
    try {
      global.dispatchEvent(new CustomEvent("lorefy:catalog-progress", {
        detail: { part: part, loaded: Array.from(loaded), total: Number(manifest.partCount || 17) }
      }));
    } catch (error) {}
  }

  function scheduleNotify(part, urgent) {
    pendingProgressPart = part || pendingProgressPart;
    if (backgroundLoadInFlight && !urgent) {
      deferredRefresh = true;
      return;
    }
    if (refreshTimer) global.clearTimeout(refreshTimer);
    refreshTimer = global.setTimeout(function () {
      refreshTimer = 0;
      idle(function () { notify(pendingProgressPart); });
    }, REFRESH_DEBOUNCE_MS);
  }

  function loadPart(part) {
    part = Number(part);
    if (!Number.isInteger(part) || part < 1) return Promise.resolve(false);
    if (loaded.has(part)) return Promise.resolve(true);
    if (loading.has(part)) return loading.get(part);
    var promise = new Promise(function (resolve) {
      var script = doc.createElement("script");
      script.src = "uploads/lorefy-data-part" + String(part).padStart(2, "0") + ".js?v=" + version;
      script.async = true;
      script.dataset.lorefyCatalogPart = String(part);
      script.onload = function () {
        loaded.add(part);
        loading.delete(part);
        // Coalesce re-indexing work so loading all catalog parts does not freeze the UI.
        scheduleNotify(part, true);
        resolve(true);
      };
      script.onerror = function () {
        loading.delete(part);
        resolve(false);
      };
      doc.head.appendChild(script);
    });
    loading.set(part, promise);
    return promise;
  }

  function loadAllInWorker(parts) {
    if (typeof global.Worker !== "function" || !parts.length) return null;
    return new Promise(function (resolve, reject) {
      var worker;
      try {
        worker = new global.Worker("modules/lorefy-catalog-worker.js?v=" + version);
      } catch (error) {
        reject(error);
        return;
      }
      catalogWorker = worker;
      workerStagedRecords = [];
      function closeWorker() {
        if (catalogWorker === worker) catalogWorker = null;
        try { worker.terminate(); } catch (error) {}
      }
      worker.addEventListener("message", function (event) {
        var message = event.data || {};
        if (message.type === "records") {
          idle(function () {
            try {
              if (Array.isArray(message.records) && message.records.length) {
                Array.prototype.push.apply(workerStagedRecords, message.records);
              }
            } finally {
              global.setTimeout(function () {
                try { worker.postMessage({ type: "ack" }); } catch (error) {}
              }, WORKER_BATCH_ACK_DELAY_MS);
            }
          });
          return;
        }
        if (message.type === "complete") {
          if (!Array.isArray(global.LorefyMangaData)) global.LorefyMangaData = [];
          var dynamicRecords = keepDynamicRecords(workerStagedRecords, global.LorefyMangaData);
          global.LorefyMangaData.length = 0;
          for (var offset = 0; offset < workerStagedRecords.length; offset += 1000) {
            Array.prototype.push.apply(global.LorefyMangaData, workerStagedRecords.slice(offset, offset + 1000));
          }
          for (var dynamicOffset = 0; dynamicOffset < dynamicRecords.length; dynamicOffset += 500) {
            Array.prototype.push.apply(global.LorefyMangaData, dynamicRecords.slice(dynamicOffset, dynamicOffset + 500));
          }
          workerStagedRecords = [];
          (Array.isArray(message.parts) ? message.parts : []).forEach(function (part) { loaded.add(Number(part)); });
          if (message.aliases && typeof message.aliases === "object") {
            global.LorefyCatalogAliases = Object.assign(global.LorefyCatalogAliases || {}, message.aliases);
          }
          workerCatalogReady = true;
          global.__lorefyCatalogReady = true;
          deferredRefresh = true;
          pendingProgressPart = Number((message.parts || []).slice(-1)[0]) || pendingProgressPart;
          try {
            global.dispatchEvent(new CustomEvent("lorefy:catalog-ready", {
              detail: { total: global.LorefyMangaData.length, dynamic: dynamicRecords.length }
            }));
          } catch (error) {}
          closeWorker();
          resolve(true);
          return;
        }
        if (message.type === "error") {
          closeWorker();
          reject(new Error(message.message || "catalog worker failed"));
        }
      });
      worker.addEventListener("error", function (event) {
        closeWorker();
        reject(event && event.error || new Error("catalog worker failed"));
      });
      worker.postMessage({ type: "load", parts: parts, version: version });
    });
  }

  function keepDynamicRecords(canonicalRecords, currentRecords) {
    var identity = global.LorefyCatalogIdentity;
    var aliases = global.LorefyCatalogAliases || {};
    var canonicalIds = new Set();
    var canonicalByTitle = new Map();
    var dynamicIds = new Set();

    function titleKey(work) {
      var title = identity && typeof identity.canonicalWorkKey === "function"
        ? identity.canonicalWorkKey(work && work.title)
        : String(work && work.title || "").trim().toLowerCase();
      return String(work && work.type || "") + "|" + title;
    }

    (canonicalRecords || []).forEach(function (work) {
      if (!work || !work.id) return;
      canonicalIds.add(String(work.id));
      var key = titleKey(work);
      if (!canonicalByTitle.has(key)) canonicalByTitle.set(key, []);
      canonicalByTitle.get(key).push(work);
    });

    return (currentRecords || []).filter(function (work) {
      if (!work || !work.id || !work._apiDynamic || canonicalIds.has(String(work.id))) return false;
      if (dynamicIds.has(String(work.id))) return false;
      var matches = canonicalByTitle.get(titleKey(work)) || [];
      var duplicate = matches.some(function (candidate) {
        return identity && typeof identity.sameWork === "function"
          ? identity.sameWork(candidate, work, aliases)
          : String(candidate && candidate.id) === String(work.id);
      });
      if (duplicate) return false;
      dynamicIds.add(String(work.id));
      return true;
    });
  }

  function idle(callback) {
    // Always yield to the browser, but never wait for an uninterrupted pause.
    // Continuous scrolling used to prevent the full catalog from ever finishing.
    if ("requestIdleCallback" in global) global.requestIdleCallback(callback, { timeout: 700 });
    else global.setTimeout(callback, 0);
  }

  function enqueue(parts, options) {
    options = options || {};
    var gapMs = Number(options.gapMs) || 180;
    var queue = planner.uniqueParts(parts).filter(function (part) { return !loaded.has(part); });
    activeQueue = activeQueue.then(function () {
      return new Promise(function (resolve) {
        function next() {
          var part = queue.shift();
          if (!part) { resolve(); return; }
          idle(function () { loadPart(part).finally(function () { global.setTimeout(next, gapMs); }); });
        }
        next();
      });
    });
    return activeQueue;
  }

  function loadRoute() {
    var route = routeState();
    var directPart = manifest.workParts && manifest.workParts[String(route.workId || "")];
    var first = directPart && !loaded.has(Number(directPart)) ? [Number(directPart)] : [];
    return enqueue(first);
  }

  function loadAll() {
    if (backgroundLoadInFlight) return activeQueue;
    backgroundLoadInFlight = true;
    workerCatalogReady = false;
    if (refreshTimer) {
      global.clearTimeout(refreshTimer);
      refreshTimer = 0;
    }
    // Rebuild from every part in one worker pass. Skipping the bootstrap part
    // previously meant the worker could erase it while replacing the catalog.
    var parts = planner.allCatalogParts(manifest);
    var background = loadAllInWorker(parts);
    if (!background) background = enqueue(parts, { gapMs: PART_LOAD_GAP_MS });
    return background.catch(function () {
      return enqueue(parts.filter(function (part) { return !loaded.has(part); }), { gapMs: PART_LOAD_GAP_MS });
    }).finally(function () {
      backgroundLoadInFlight = false;
      if (deferredRefresh) {
        deferredRefresh = false;
        scheduleNotify(pendingProgressPart);
      }
    });
  }

  function scheduleFullCatalog() {
    if (fullCatalogRequested || fullCatalogTimer) return;
    function startInBackground() {
      fullCatalogTimer = 0;
      fullCatalogRequested = true;
      loadAll();
    }
    fullCatalogTimer = global.setTimeout(startInBackground, FULL_CATALOG_START_DELAY_MS);
  }

  function emitRouteChange() {
    try { global.dispatchEvent(new CustomEvent("lorefy:routechange")); } catch (error) {}
  }

  if (!global.__lorefyCatalogHistoryPatched) {
    global.__lorefyCatalogHistoryPatched = true;
    ["pushState", "replaceState"].forEach(function (name) {
      var original = global.history && global.history[name];
      if (typeof original !== "function") return;
      global.history[name] = function () {
        var result = original.apply(this, arguments);
        global.setTimeout(emitRouteChange, 0);
        return result;
      };
    });
  }

  global.addEventListener("popstate", emitRouteChange);
  global.addEventListener("lorefy:routechange", function () { global.setTimeout(loadRoute, 80); });
  (doc.readyState === "loading" ? doc.addEventListener.bind(doc, "DOMContentLoaded") : function (fn) { fn(); })(function () {
    // index.html inserts the first route part. The rest is parsed in a worker
    // immediately after first paint, even while the reader scrolls.
    global.setTimeout(scheduleFullCatalog, 300);
  });

  global.LorefyCatalogLoader = {
    loadPart: loadPart,
    loadType: function (type) { return enqueue(planner.remainingCatalogPlan(manifest, type, loaded)); },
    loadAll: loadAll,
    refreshRoute: loadRoute,
    state: function () {
      return {
        loaded: Array.from(loaded),
        loading: Array.from(loading.keys()),
        total: Number(manifest.partCount || 0),
        backgroundQueued: fullCatalogRequested,
        backgroundLoading: backgroundLoadInFlight,
        ready: workerCatalogReady
      };
    }
  };
})(window);

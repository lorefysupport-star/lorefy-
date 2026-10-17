(function (global) {
  "use strict";

  var doc = global.document;
  var manifest = global.LorefyCatalogManifest || {};
  var planner = global.LorefyCatalogPlan;
  if (!doc || !planner) return;

  var loaded = new Set((global.LOREFY_INITIAL_CATALOG_PARTS || []).map(Number));
  var loading = new Map();
  var activeQueue = Promise.resolve();
  var version = "20261013-discover-reviewed-v2";
  var workerVersion = "20261017-editorial-comics-v1";
  var refreshTimer = 0;
  var pendingProgressPart = 0;
  var REFRESH_DEBOUNCE_MS = 700;
  var PART_LOAD_GAP_MS = 1600;
  var WORKER_BATCH_ACK_DELAY_MS = 12;
  var backgroundLoadInFlight = false;
  var deferredRefresh = false;
  var catalogWorker = null;
  var workerCatalogReady = false;
  var workerStagedRecords = [];
  var hydration = new Map();
  var searchWorker = null;
  var searchRequests = new Map();
  var searchRequestId = 0;
  var searchGeneration = 0;
  var searchTimer = 0;
  var searchMatches = [];
  var searchCursor = 0;
  var searchQuery = "";
  var searchType = "";
  var searchBusy = false;
  var searchError = false;
  var SEARCH_REQUEST_TIMEOUT_MS = 20000;
  var browseParts = [];
  var browseCursor = 0;
  var queryWarmCursor=0,queryWarmPending=false;
  function warmQueryIndexes(){
    if(queryWarmPending || !global.LorefyCatalogData?.prepareSearchIndexes)return;
    queryWarmPending=true;
    idle(function step(){
      var records=global.LorefyMangaData||[],end=Math.min(queryWarmCursor+100,records.length);
      global.LorefyCatalogData.prepareSearchIndexes(records.slice(queryWarmCursor,end));queryWarmCursor=end;
      if(queryWarmCursor<records.length)global.setTimeout(function(){idle(step);},0);else queryWarmPending=false;
    });
  }
  function ensureSearchFields(start) {
    var records = global.LorefyMangaData || [];
    for (var index = start || 0; index < records.length; index += 1) {
      var work = records[index];
      if (!work || typeof work !== "object") continue;
      if (typeof work._tl !== "string") work._tl = String(work.title || "").toLowerCase();
      if (typeof work._al !== "string") work._al = String(work.auth || work.author || "").toLowerCase();
      if (typeof work.ar !== "string") work.ar = String(work.ar || "");
    }
  }
  ensureSearchFields();
  warmQueryIndexes();
  Array.prototype.forEach.call(doc.scripts || [], function (script) {
    var match = String(script.src || "").match(/lorefy-data-part(\d+)\.js/i);
    if (match) loaded.add(Number(match[1]));
  });

  function routeState() {
    var params = new URLSearchParams(global.location.search || "");
    return {
      type: planner.normalizeRouteType(params.get("type")),
      rawType: params.get("type") || "All",
      workId: params.get("novel") || params.get("work") || "",
      query: params.get("search") || ""
    };
  }

  function notify(part) {
    try {
      if (!workerCatalogReady && global.LorefyCatalogQuality && typeof global.LorefyCatalogQuality.apply === "function") {
        global.LorefyCatalogQuality.apply(global.LorefyMangaData);
      }
    } catch (error) {}
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
      var previousLength = (global.LorefyMangaData || []).length;
      var script = doc.createElement("script");
      script.src = "uploads/lorefy-data-part" + String(part).padStart(2, "0") + ".js?v=" + version;
      script.async = true;
      script.dataset.lorefyCatalogPart = String(part);
      script.onload = function () {
        ensureSearchFields(previousLength);
        warmQueryIndexes();
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
        worker = new global.Worker("modules/lorefy-catalog-worker.js?v=" + workerVersion);
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
          if (global.LorefyCatalogQuality) global.LorefyCatalogQuality.apply(global.LorefyMangaData.filter(function (work) {
            return work && work._apiDynamic;
          }));
          if (message.aliases && typeof message.aliases === "object") {
            global.LorefyCatalogAliases = Object.assign(global.LorefyCatalogAliases || {}, message.aliases);
          }
          planner.preserveReadingTotals(workerStagedRecords, global.LorefyMangaData, global.LorefyCatalogAliases);
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
          workerCatalogReady = true;
          global.__lorefyCatalogReady = true;
          hydrateWork(new URLSearchParams(global.location.search).get("novel"));
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
    var aliases = global.LorefyCatalogAliases || (global.LorefyCatalogAliases = {});
    var canonicalIds = new Map();
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
      canonicalIds.set(String(work.id), work);
      var key = titleKey(work);
      if (!canonicalByTitle.has(key)) canonicalByTitle.set(key, []);
      canonicalByTitle.get(key).push(work);
    });

    var retained = (currentRecords || []).filter(function (work) {
      if (!work || !work.id || !work._apiDynamic) return false;
      if (dynamicIds.has(String(work.id))) return false;
      var matches = canonicalByTitle.get(titleKey(work)) || [];
      var duplicate = canonicalIds.get(String(work.id)) || matches.find(function (candidate) {
        return identity && typeof identity.sameWork === "function"
          ? identity.sameWork(candidate, work, aliases)
          : String(candidate && candidate.id) === String(work.id);
      });
      if (duplicate) {
        if (identity && typeof identity.mergeRecord === 'function') identity.mergeRecord(duplicate, work);
        delete aliases[String(duplicate.id)];
        [String(work.id)].concat(work._catalogMergedIds || []).forEach(function (id) {
          if (id !== String(duplicate.id)) aliases[id] = String(duplicate.id);
        });
        delete duplicate._queryIndex;
        duplicate._indexed = false;
        if (global.LorefyCatalogData) global.LorefyCatalogData.prepareCatalogRecords([duplicate]);
        return false;
      }
      dynamicIds.add(String(work.id));
      return true;
    });
    // Bootstrap may have picked an editorial ID before the worker chose a
    // provider ID. Flatten old references after reconciliation, without cycles.
    Object.keys(aliases).forEach(function (id) {
      var current = String(aliases[id]);
      var visited = new Set([id]);
      while (aliases[current] && !visited.has(current)) {
        visited.add(current);
        current = String(aliases[current]);
      }
      if (current === id) delete aliases[id];
      else aliases[id] = current;
    });
    return retained;
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
    var shouldContinue = options.shouldContinue || function () { return true; };
    var queue = planner.uniqueParts(parts).filter(function (part) { return !loaded.has(part); });
    activeQueue = activeQueue.then(function () {
      return new Promise(function (resolve) {
        function next() {
          if (!shouldContinue()) { resolve(); return; }
          var part = queue.shift();
          if (!part) { resolve(); return; }
          idle(function () { loadPart(part).finally(function () { global.setTimeout(next, gapMs); }); });
        }
        next();
      });
    });
    return activeQueue;
  }

  function searchIndexFallback(query, type) {
    var controller = typeof global.AbortController === "function" ? new global.AbortController() : null;
    var timer, expired = false;
    return new Promise(function (resolve, reject) {
      timer = global.setTimeout(function () {
        expired = true;
        try { if (controller) controller.abort(); } catch (error) {}
        reject(new Error("Catalog search index timed out"));
      }, SEARCH_REQUEST_TIMEOUT_MS);
      global.fetch("uploads/catalog-search-index.json?v=" + version, controller ? {signal: controller.signal} : undefined).then(function (response) {
        if (expired) throw new Error("Catalog search index timed out");
        if (!response.ok) throw new Error("Search index returned " + response.status);
        return response.json();
      }).then(function (index) {
        if (expired) throw new Error("Catalog search index timed out");
        if (!index || index.schema !== 1 || !Array.isArray(index.records)) throw new Error("Invalid catalog search index");
        var entries = index.records.map(function (row) {
          return { part: Number(row[0]), work: {
            id: row[1], title: row[2], ar: row[3], auth: row[4], type: row[5],
            altTitles: row[6], aliases: row[7], authorAliases: row[8]
          } };
        });
        return planner.searchIndexParts(entries, query, type, global.LorefyCatalogData);
      }).then(resolve, reject);
    }).finally(function () { global.clearTimeout(timer); });
  }

  function failSearchWorker(worker, error) {
    if (searchWorker !== worker) return;
    searchWorker = null;
    searchRequests.forEach(function (pending, requestId) {
      if (pending.worker !== worker) return;
      global.clearTimeout(pending.timer);
      searchRequests.delete(requestId);
      pending.reject(error);
    });
    try { worker.terminate(); } catch (ignore) {}
  }

  function requestSearchParts(query, type) {
    if (typeof global.Worker !== "function") return searchIndexFallback(query, type);
    if (!searchWorker) {
      try { searchWorker = new global.Worker("modules/lorefy-catalog-search-worker.js?v=" + workerVersion); }
      catch (error) { return searchIndexFallback(query, type); }
      var activeWorker = searchWorker;
      searchWorker.addEventListener("message", function (event) {
        var message = event.data || {};
        var pending = searchRequests.get(message.requestId);
        if (!pending || pending.worker !== activeWorker) return;
        global.clearTimeout(pending.timer);
        searchRequests.delete(message.requestId);
        if (message.type === "result") pending.resolve(message.matches || []);
        else pending.reject(new Error(message.message || "Catalog search failed"));
      });
      searchWorker.addEventListener("error", function (error) {
        failSearchWorker(activeWorker, error);
      });
    }
    return new Promise(function (resolve, reject) {
      var requestId = ++searchRequestId;
      var worker = searchWorker;
      var timer = global.setTimeout(function () {
        failSearchWorker(worker, new Error("Catalog search worker timed out"));
      }, SEARCH_REQUEST_TIMEOUT_MS);
      searchRequests.set(requestId, { resolve: resolve, reject: reject, worker: worker, timer: timer });
      try { worker.postMessage({type: "search", requestId: requestId, query: query, catalogType: type}); }
      catch (error) { failSearchWorker(worker, error); }
    }).catch(function () { return searchIndexFallback(query, type); });
  }

  function refreshSearchStatus() {
    try { if (typeof global.__lorefyRefresh === "function") global.__lorefyRefresh(); } catch (error) {}
  }

  function loadSearchBatch(generation, first) {
    var batchStart = searchCursor;
    var parts = [], expected = 0;
    var target = first ? 160 : 120;
    var limit = first ? 12 : 8;
    while (searchCursor < searchMatches.length && parts.length < limit && expected < target) {
      var match = searchMatches[searchCursor++];
      if (loaded.has(match.part)) continue;
      parts.push(match.part);
      expected += match.count;
    }
    if (!parts.length) { searchBusy = false; refreshSearchStatus(); return Promise.resolve(); }
    searchBusy = true;
    searchError = false;
    refreshSearchStatus();
    return enqueue(parts, {
      gapMs: 80,
      shouldContinue: function () { return generation === searchGeneration; }
    }).then(function () {
      if (generation !== searchGeneration) return;
      if (parts.some(function (part) { return !loaded.has(part); })) {
        // Keep the failed page reachable; successful shards remain loaded.
        searchCursor = batchStart;
        searchError = true;
      }
    }).finally(function () {
      if (generation === searchGeneration) { searchBusy = false; refreshSearchStatus(); }
    });
  }

  function scheduleSearch(query, type, retry) {
    query = String(query || "").trim();
    type = String(type || "All");
    if (query === searchQuery && type === searchType && (searchBusy || !retry && !searchError)) return;
    searchQuery = query;
    searchType = type;
    searchGeneration += 1;
    var generation = searchGeneration;
    global.clearTimeout(searchTimer);
    searchMatches = [];
    searchCursor = 0;
    searchBusy = !!query;
    searchError = false;
    refreshSearchStatus();
    if (!query) return;
    searchTimer = global.setTimeout(function () {
      requestSearchParts(query, type).then(function (matches) {
        if (generation !== searchGeneration) return;
        searchMatches = matches;
        return loadSearchBatch(generation, true);
      }).catch(function (error) {
        if (generation !== searchGeneration) return;
        searchBusy = false;
        searchError = true;
        console.warn("[Lorefy] local catalog search:", error);
        refreshSearchStatus();
      });
    }, 450);
  }

  function loadMore() {
    if (searchBusy) return Promise.resolve();
    if (searchQuery) return loadSearchBatch(searchGeneration, false);
    var next = 0;
    while (browseCursor < browseParts.length && (!next || loaded.has(next))) {
      next = browseParts[browseCursor++];
    }
    return next && !loaded.has(next) ? enqueue([next], {gapMs: 40}) : Promise.resolve();
  }

  function loadRoute() {
    var route = routeState();
    if (route.workId) hydrateWork(route.workId);
    browseParts = route.rawType === "All" ? planner.allCatalogParts(manifest) : planner.typeParts(manifest, route.type);
    browseCursor = 0;
    scheduleSearch(route.query, route.rawType);
    return enqueue(planner.initialCatalogPlan(manifest, route), { gapMs: 40 });
  }

  function hydrateWork(workId) {
    var aliases = global.LorefyCatalogAliases || {};
    var id = String(workId || "");
    var canonicalId = String(aliases[id] || id);
    var work = (global.LorefyMangaData || []).find(function (record) {
      return record && (String(record.id) === canonicalId || String(record.id) === id);
    });
    if (!work || !work._catalogCompact) return Promise.resolve(work);
    if (hydration.has(canonicalId)) return hydration.get(canonicalId);
    var part = manifest.workParts && (manifest.workParts[id] || manifest.workParts[canonicalId]);
    if (!part || !global.LorefyCatalogData) return Promise.resolve(work);
    var promise = global.fetch("uploads/lorefy-data-part" + String(part).padStart(2,"0") + ".js?v=" + version)
      .then(function (response) { if (!response.ok) throw new Error("description unavailable"); return response.text(); })
      .then(function (source) {
        var records = global.LorefyCatalogData.extractCatalogRecords(source);
        var full = records.find(function (record) { return String(record.id) === canonicalId || String(record.id) === id; });
        if (!full) return work;
        if (global.LorefyCatalogQuality) global.LorefyCatalogQuality.apply([full]);
        var copiedSynopsis = false;
        ["synopsis","synopsisAr","synopsisEn","description","sourceSynopsis","originalSynopsis"].forEach(function (key) {
          if (typeof full[key] === "string" && full[key].length > String(work[key] || "").length) {
            work[key] = full[key];
            copiedSynopsis = true;
          }
        });
        if (copiedSynopsis && full.synopsisAttribution) work.synopsisAttribution = full.synopsisAttribution;
        work._catalogCompact = false;
        work._indexed = false;
        scheduleNotify(part, true);
        return work;
      }).catch(function () { return work; }).finally(function () { hydration.delete(canonicalId); });
    hydration.set(canonicalId,promise);
    return promise;
  }

  function loadWorks(workIds) {
    var workParts = manifest.workParts || {};
    var aliases = global.LorefyCatalogAliases || {};
    var parts = (Array.isArray(workIds) ? workIds : []).map(function (workId) {
      var id = String(workId || "");
      var canonicalId = String(aliases[id] || id);
      return Number(workParts[id] || workParts[canonicalId] || 0);
    }).filter(function (part) {
      return Number.isInteger(part) && part > 0;
    });
    return enqueue(parts, { gapMs: 40 });
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
  doc.addEventListener("input", function (event) {
    var target = event && event.target;
    if (!target || target.tagName !== "INPUT" || !target.closest || !target.closest(".lf-search-box")) return;
    scheduleSearch(target.value, routeState().rawType);
  }, true);
  (doc.readyState === "loading" ? doc.addEventListener.bind(doc, "DOMContentLoaded") : function (fn) { fn(); })(function () {
    // index.html has already inserted the first route part. Announce that the
    // initial catalog is usable without downloading every other part.
    loadRoute();
    global.setTimeout(function () {
      if (global.__lorefyCatalogReady) return;
      global.__lorefyCatalogReady = true;
      try {
        global.dispatchEvent(new CustomEvent("lorefy:catalog-ready", {
          detail: { total: (global.LorefyMangaData || []).length, partial: true }
        }));
      } catch (error) {}
    }, 0);
  });

  global.LorefyCatalogLoader = {
    loadPart: loadPart,
    loadWorks: loadWorks,
    loadExplore: function (type) { return enqueue(planner.initialCatalogPlan(manifest,{type:type}), {gapMs:40}); },
    loadAuthor: function (author, active) {
      var query=String(author || '').replace(/[,،]/g,' ').trim();
      if (!query) return Promise.resolve();
      return requestSearchParts(query,'').then(function (matches) {
        return enqueue(matches.map(function (match) { return match.part; }),{gapMs:40,shouldContinue:active});
      });
    },
    loadMore: loadMore,
    retrySearch: function () {
      if (searchQuery && !searchBusy) scheduleSearch(searchQuery, searchType, true);
    },
    // Explore's format page uses the same shard/search pipeline without
    // leaving Explore or adding redundant global format controls.
    loadFormat: function (type, query) {
      var normalizedType = planner.normalizeRouteType(type);
      browseParts = planner.typeParts(manifest, normalizedType);
      browseCursor = 0;
      scheduleSearch(query, type);
      return enqueue(planner.initialCatalogPlan(manifest, {type: normalizedType}), {gapMs: 40});
    },
    loadType: function (type) { return enqueue(planner.remainingCatalogPlan(manifest, type, loaded)); },
    loadAll: loadAll,
    refreshRoute: loadRoute,
    hydrateWork: hydrateWork,
    state: function () {
      return {
        loaded: Array.from(loaded),
        loading: Array.from(loading.keys()),
        total: Number(manifest.partCount || 0),
        backgroundQueued: false,
        backgroundLoading: backgroundLoadInFlight,
        ready: workerCatalogReady || !!global.__lorefyCatalogReady,
        partial: loaded.size < Number(manifest.partCount || 0),
        searching: searchBusy,
        searchError: searchError,
        hasMore: searchQuery ? searchCursor < searchMatches.length : browseParts.slice(browseCursor).some(function (part) { return !loaded.has(part); })
      };
    }
  };
})(window);

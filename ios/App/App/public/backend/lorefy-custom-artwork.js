/* Owner-specific artwork: persist references, renew private display URLs. */
(function (global) {
  "use strict";
  var PREFIX = "lorefy-artwork:";
  var KEYS = { covers:"lorefy.user.customCovers.v2", characters:"lorefy.characterCustomImages.v1" };
  var cache = new Map(), requests = new Map(), queue = Promise.resolve();
  var TTL = 7200;

  function map(key) {
    var value = JSON.parse(global.localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }
  function path(value) {
    value = String(value || "");
    return value.indexOf(PREFIX) === 0 ? value.slice(PREFIX.length) : "";
  }
  function notify(key) {
    global.dispatchEvent(new CustomEvent("lorefy:stored-state", { detail:{key:key} }));
  }
  function current(owner, generation) {
    var backend = global.LorefyBackend;
    return global.localStorage.getItem("lorefy.activeUser.v1") === owner && backend._pullGeneration === generation;
  }
  function resolve(value) {
    var objectPath = path(value);
    if (!objectPath) return Promise.resolve(value || "");
    var cached = cache.get(objectPath);
    if (cached && cached.until > Date.now()) return Promise.resolve(cached.url);
    if (requests.has(objectPath)) return requests.get(objectPath);
    var request = global.LorefyBackend._storageMediaUrl("custom-covers", objectPath, TTL).then(function (url) {
      if (!url) throw new Error("Artwork URL is unavailable.");
      cache.set(objectPath, {url:url, until:Date.now() + (TTL - 300) * 1000});
      return url;
    }).finally(function () { requests.delete(objectPath); });
    requests.set(objectPath, request);
    return request;
  }
  function display(value, kind) {
    var objectPath = path(value);
    if (!objectPath) return kind === "covers" && global.LorefyCoverAPI ? global.LorefyCoverAPI.displayUrl(value) : value || "";
    var cached = cache.get(objectPath);
    if (cached && cached.until > Date.now()) return cached.url;
    resolve(value).then(function () {
      notify(KEYS.covers); notify(KEYS.characters);
      global.dispatchEvent(new CustomEvent("lorefy:artwork-ready", {detail:{}}));
    }).catch(function (error) { console.warn("[Lorefy] artwork load:", error); });
    return cached && cached.url || "";
  }
  async function hydrate(owner) {
    var backend = global.LorefyBackend;
    if (!backend || backend.mode !== "live") return;
    var generation = backend._pullGeneration;
    var values = [];
    Object.keys(KEYS).forEach(function (kind) {
      var entries = map(KEYS[kind]);
      Object.keys(entries).forEach(function (id) { if (path(entries[id])) values.push(entries[id]); });
    });
    var failures = await Promise.allSettled(Array.from(new Set(values)).map(resolve));
    if (!current(owner, generation)) return;
    failures.forEach(function (result) { if (result.status === "rejected") console.warn("[Lorefy] artwork hydrate:", result.reason); });
    notify(KEYS.covers); notify(KEYS.characters);
    global.dispatchEvent(new CustomEvent("lorefy:artwork-ready", {detail:{}}));
  }
  function save(kind, id, value) {
    id = String(id || "").trim(); value = String(value || "");
    if (value.indexOf("/api/media?") === 0) value = new URL(value, "http://localhost").searchParams.get("url") || "";
    if (!id || !KEYS[kind]) return Promise.reject(new Error("Invalid artwork selection."));
    if (value && !/^https?:\/\//i.test(value) && !/^data:image\/(?:jpeg|png|webp);base64,/i.test(value) && !path(value)) {
      return Promise.reject(new Error("اختر صورة صالحة وليست رابطًا مؤقتًا من الجهاز."));
    }
    var owner = global.localStorage.getItem("lorefy.activeUser.v1");
    var backend = global.LorefyBackend, generation = backend && backend._pullGeneration;
    var operation = queue.catch(function () {}).then(async function () {
      var durable = value;
      if (backend && backend.mode === "live") {
        var session = await backend.getSession();
        if (!session || session.userId !== owner || !current(owner, generation)) throw new Error("Artwork account changed. Reopen the picker.");
        if (path(value) && path(value).indexOf(owner + "/") !== 0) throw new Error("Artwork belongs to another account.");
        if (/^data:image\//i.test(value)) {
          var objectPath = await backend._uploadCustomArtwork(owner, kind, value);
          if (!current(owner, generation)) throw new Error("Artwork account changed. Reopen the picker.");
          durable = PREFIX + objectPath;
          await resolve(durable);
        }
        if (!current(owner, generation)) throw new Error("Artwork account changed. Reopen the picker.");
      }
      var entries = map(KEYS[kind]);
      if (durable) entries[id] = durable; else delete entries[id];
      // Synchronous durable local write comes before any success or UI update.
      global.localStorage.setItem(KEYS[kind], JSON.stringify(entries));
      notify(KEYS[kind]);
      if (backend && backend.mode === "live") {
        try {
          var synced = await backend.push();
          if (!synced || !current(owner, generation)) throw new Error("Artwork account changed or sync was interrupted.");
        } catch (error) {
          throw new Error("حُفظ اختيارك على الجهاز، لكن لم تكتمل مزامنته. أعد المحاولة: " + error.message);
        }
      }
      return entries;
    });
    queue = operation;
    return operation;
  }
  global.LorefyArtwork = {
    display:display, resolve:resolve, hydrate:hydrate,
    saveCover:function (id, value) { return save("covers", id, value); },
    saveCharacter:function (id, value) { return save("characters", id, value); }
  };
  global.addEventListener("visibilitychange", function () {
    if (global.document && global.document.visibilityState === "visible") {
      hydrate(global.localStorage.getItem("lorefy.activeUser.v1")).catch(function (error) { console.warn("[Lorefy] artwork resume:", error); });
    }
  });
})(window);

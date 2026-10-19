(function (global) {
  "use strict";

  var BOOK_AR = "\u0643\u062A\u0627\u0628";
  var ROLE_MAIN = "\u0631\u0626\u064a\u0633\u064a\u0629";
  var ROLE_SUPPORT = "\u0645\u0633\u0627\u0639\u062f\u0629";
  // v3 invalidates cached literary casts that were saved without images.
  // v6 invalidates casts resolved before Unicode-native title verification.
  // v7 invalidates legacy 25-row entries that were incorrectly marked complete.
  // v9 invalidates casts written before native Jikan requests used the same
  // public gateway as AniList, including legacy 25-row preview fallbacks.
  // v18 invalidates casts whose completeness was inferred from a row count.
  // v19 invalidates complete tracker-only casts saved before work-scoped
  // character communities were discovered for every visual-work category.
  // v20 requires a completed work-scoped community traversal; a short tracker
  // response must remain retryable when that traversal is temporarily down.
  // Completion v3 also requires every AniList page for MAL/AniList works.
  var CACHE_KEY = "lorefy.characterCastCache.v20";
  var CACHE_COMPLETION_VERSION = 3;
  var CACHE_TTL = 1000 * 60 * 60 * 24 * 30;
  // Keep the complete literary cast discoverable, while hydrating images with
  // bounded concurrency so a large work does not freeze the first paint.
  var MAX_LITERARY_CAST = 1000;
  var IMAGE_OPTIONS_LIMIT = 36;
  // AniList rate limits clients aggressively. A serial 50-item paginator is
  // slower than a burst, but it completes reliably without starving the UI.
  var ANILIST_CHARACTER_PAGE_SIZE = 50;
  var ANILIST_CHARACTER_PAGE_CONCURRENCY = 1;
  var ANILIST_RETRY_LIMIT = 2;
  var ANILIST_PAGE_PACE_MS = 600;

  function slug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}\u0600-\u06FF-]/gu, "");
  }

  function addUnique(out, value) {
    value = String(value || "").replace(/\s+/g, " ").trim();
    if (value && out.indexOf(value) < 0) out.push(value);
  }

  function titleCatalogKey(title) {
    return "title:" + slug(title);
  }

  function titleParts(value) {
    var text = String(value || "").replace(/\s+/g, " ").trim();
    var out = [];
    if (!text) return out;
    addUnique(out, text);
    var parens = text.match(/\(([^)]+)\)/g) || [];
    parens.forEach(function (part) {
      part = part.replace(/[()]/g, "");
      part.split(/\s*[/;|]\s*/).forEach(function (piece) { addUnique(out, piece); });
    });
    var outside = text.replace(/\([^)]*\)/g, "").trim();
    addUnique(out, outside);
    return out.filter(function (part) { return part.length >= 3; });
  }

  function workTitleCandidates(work) {
    work = work || {};
    var out = [];
    [
      work.searchTitle,
      work.routeSearchTitle,
      work.queryTitle,
      work.originalTitle,
      work.englishTitle
    ].forEach(function (value) { addUnique(out, value); });
    asArray(work.titleCandidates).forEach(function (value) { addUnique(out, value); });
    asArray(work.aliases).forEach(function (value) { addUnique(out, value); });
    [work.title, work.ar].forEach(function (value) {
      titleParts(value).forEach(function (part) { addUnique(out, part); });
    });
    return out;
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function safeJson(value, fallback) {
    try {
      return JSON.parse(value || "null") || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function readCache() {
    try {
      return safeJson(global.localStorage && global.localStorage.getItem(CACHE_KEY), {});
    } catch (e) {
      return {};
    }
  }

  function writeCache(cache) {
    try {
      if (global.localStorage) global.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
  }

  function cacheGet(workId) {
    var entry = readCache()[workId];
    if (!entry || !Array.isArray(entry.cast)) return null;
    if (entry.ts && Date.now() - entry.ts > CACHE_TTL) return null;
    return entry.cast;
  }

  function cacheGetEntry(workId) {
    var entry = readCache()[workId];
    if (!entry || !Array.isArray(entry.cast)) return null;
    if (entry.ts && Date.now() - entry.ts > CACHE_TTL) return null;
    return entry;
  }

  function cacheSet(workId, cast, source, complete) {
    if (!workId || !cast || !cast.length) return;
    var cache = readCache();
    cache[workId] = {
      cast: cast,
      source: source || "remote",
      complete: complete === true,
      completionVersion: complete === true ? CACHE_COMPLETION_VERSION : 0,
      ts: Date.now()
    };
    writeCache(cache);
  }

  function isNormalBook(work) {
    var type = String((work && work.type) || "");
    return type === BOOK_AR || /^book$/i.test(type);
  }

  function isTextWork(work) {
    var type = String((work && work.type) || "");
    var id = String((work && work.id) || "");
    return !isNormalBook(work) && (
      type === "\u0631\u0648\u0627\u064a\u0629" ||
      type === "\u0648\u064a\u0628 \u0646\u0648\u0641\u0644" ||
      type === "\u0644\u0627\u064a\u062a \u0646\u0648\u0641\u0644" ||
      /novel/i.test(type) ||
      /^n-/i.test(id) ||
      /^ol-novel-/i.test(id) ||
      /^mal-lightnovel-/i.test(id)
    );
  }

  function isComicWork(work) {
    var type = String((work && work.type) || "");
    return type === "\u0643\u0648\u0645\u064a\u0643\u0633" || /^comics?$/i.test(type);
  }

  function sourceKeysForWork(work) {
    if (typeof work === "string") work = { id: work };
    work = work || {};
    var id = String(work.id || "");
    var titles = workTitleCandidates(work);
    var explicitMal = work.mal || work.malId || work.mal_id || null;
    var explicitAnilist = work.anilist || work.anilistId || work.anilist_id || null;
    var malMatch = id.match(/^mal-(?:manga|novel|anime|manhwa|manhua|lightnovel)?-?(\d+)(?:-|$)/i);
    var anilistMatch = id.match(/^anilist-(\d+)(?:-|$)/i);
    return {
      workId: id,
      excluded: isNormalBook(work),
      malId: explicitMal ? String(explicitMal) : (malMatch ? malMatch[1] : null),
      anilistId: explicitAnilist ? String(explicitAnilist) : (anilistMatch ? anilistMatch[1] : null),
      title: work.title || work.ar || titles[0] || "",
      titleCandidates: titles,
      author: work.auth || work.author || "",
      type: work.type || "",
      textWork: isTextWork(work),
      comicWork: isComicWork(work)
    };
  }

  function roleLabel(role) {
    return /main/i.test(String(role || "")) ? ROLE_MAIN : ROLE_SUPPORT;
  }

  function normalizeJikanRows(rows) {
    return asArray(rows)
      .map(function (row) {
        var ch = row && row.character || {};
        var latin = ch.name || "";
        var image = "";
        if (ch.images) {
          image = (ch.images.webp && ch.images.webp.image_url) ||
            (ch.images.jpg && ch.images.jpg.image_url) ||
            "";
        }
        return {
          id: "mal-" + (ch.mal_id || slug(latin)),
          key: slug(latin),
          name: latin,
          latin: latin,
          role: roleLabel(row && row.role),
          note: row && row.favorites ? String(row.favorites) + " favorites" : "",
          image: image,
          source: "Jikan"
        };
      })
      .filter(function (c) { return c.latin || c.name; });
  }

  function normalizeAniListEdges(edges) {
    return asArray(edges)
      .map(function (edge) {
        var node = edge && edge.node || {};
        var latin = node.name && (node.name.full || node.name.native || node.name.userPreferred) || "";
        return {
          id: "anilist-character-" + (node.id || slug(latin)),
          key: slug(latin),
          name: latin,
          latin: latin,
          role: roleLabel(edge && edge.role),
          note: "",
          image: node.image && (node.image.large || node.image.medium) || "",
          source: "AniList"
        };
      })
      .filter(function (c) { return c.latin || c.name; });
  }

  function imageUrlFromJikanNode(node) {
    node = node || {};
    return (node.webp && node.webp.image_url) ||
      (node.jpg && node.jpg.image_url) ||
      (node.images && node.images.webp && node.images.webp.image_url) ||
      (node.images && node.images.jpg && node.images.jpg.image_url) ||
      "";
  }

  function normalizeJikanPictureRows(rows) {
    return asArray(rows)
      .map(imageUrlFromJikanNode)
      .filter(Boolean);
  }

  function normalizeJikanCharacterImageRows(rows) {
    return asArray(rows)
      .map(function (row) { return imageUrlFromJikanNode(row); })
      .filter(Boolean);
  }

  function normalizeCharacterName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^\w\u0600-\u06FF]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function compactCharacterName(value) {
    return normalizeCharacterName(value).replace(/\s+/g, "");
  }

  function characterNameTokens(value) {
    var normalized = normalizeCharacterName(value);
    return normalized ? normalized.split(" ").filter(Boolean) : [];
  }

  function characterNameVariants(value) {
    var raw = String(value || "");
    var variants = [];
    function add(name) {
      var compact = compactCharacterName(name);
      if (compact && variants.indexOf(compact) < 0) variants.push(compact);
    }
    add(raw);
    if (raw.indexOf(",") >= 0) {
      var parts = raw.split(",").map(normalizeCharacterName).filter(Boolean);
      if (parts.length > 1) add(parts.slice().reverse().join(" "));
    }
    return variants;
  }

  function jikanCharacterMatchScore(row, query) {
    var queryVariants = characterNameVariants(query);
    var rowVariants = characterNameVariants(row && row.name);
    if (asArray(row && row.nicknames).length) {
      asArray(row.nicknames).forEach(function (nickname) {
        rowVariants = rowVariants.concat(characterNameVariants(nickname));
      });
    }
    for (var i = 0; i < queryVariants.length; i++) {
      if (rowVariants.indexOf(queryVariants[i]) >= 0) return 1000;
    }
    var queryTokens = characterNameTokens(query);
    var rowTokens = characterNameTokens((row && row.name) || "");
    if (!queryTokens.length || !rowTokens.length) return 0;
    var matched = queryTokens.filter(function (token) { return rowTokens.indexOf(token) >= 0; }).length;
    return matched === queryTokens.length ? 800 + matched : matched;
  }

  function bestJikanCharacterMatch(rows, query) {
    rows = asArray(rows);
    if (!rows.length) return null;
    var best = rows[0], bestScore = jikanCharacterMatchScore(best, query);
    rows.slice(1).forEach(function (row) {
      var score = jikanCharacterMatchScore(row, query);
      if (score > bestScore) {
        best = row;
        bestScore = score;
      }
    });
    return best;
  }

  function dedupeUrls(urls) {
    var seen = Object.create(null);
    return asArray(urls).filter(function (url) {
      url = String(url || "").trim();
      if (!url || seen[url]) return false;
      seen[url] = true;
      return true;
    });
  }

  function characterMalId(character) {
    character = character || {};
    var explicit = character.mal || character.malId || character.mal_id;
    if (explicit) return String(explicit);
    var match = String(character.id || "").match(/^mal-(\d+)(?:-|$)/i);
    return match ? match[1] : null;
  }

  function dedupeCast(cast) {
    var seen = Object.create(null);
    var output = [];
    asArray(cast).forEach(function (c) {
      function canonicalNameKey(value) {
        var name = String(value || "")
        .replace(/\b(mr|mrs|ms|miss|dr|professor|lord|lady|sir|dame|king|queen|prince|princess)\.?\s+/ig, "")
        .replace(/^the\s+/i, "")
          .replace(/\s+(?:i|ii|iii|iv|v|vi|vii|viii|ix|x)\s*$/i, "")
          .replace(/["']/g, "");
        var normalized = slug(name);
        return /^[a-z0-9-]+$/.test(normalized) ? normalized.replace(/ou/g, "o") : normalized;
      }
      var canonicalName = canonicalNameKey(c.latin || c.name || "");
      var key = c.key || slug(canonicalName || c.id);
      var canonical = canonicalName || slug(key);
      var aliasKeys = asArray(c.aliases).map(canonicalNameKey).filter(Boolean);
      var identityKeys = [key, canonical].concat(aliasKeys).filter(Boolean);
      var existing = null;
      identityKeys.some(function (identity) {
        if (!seen[identity]) return false;
        existing = seen[identity];
        return true;
      });
      if (!key) return;
      if (existing) {
        ["image", "img", "cover", "wikiTitle", "fandomApi", "mal", "malId", "mal_id"].forEach(function (field) {
          if (!existing[field] && c[field]) existing[field] = c[field];
        });
        if (existing.role !== ROLE_MAIN && c.role === ROLE_MAIN) existing.role = ROLE_MAIN;
        var mergedAliases = dedupeUrls(asArray(existing.aliases).concat(asArray(c.aliases)));
        if (mergedAliases.length) existing.aliases = mergedAliases;
        identityKeys.forEach(function (identity) { seen[identity] = existing; });
        return;
      }
      c.key = key;
      output.push(c);
      identityKeys.forEach(function (identity) { seen[identity] = c; });
    });
    return output;
  }

  function castLooksFullForMal(cast) {
    cast = asArray(cast);
    return cast.length >= 100;
  }

  function needsRemoteRefresh(work, cast) {
    var keys = sourceKeysForWork(work);
    var current = asArray(cast).length ? asArray(cast) : catalogCast(work);
    if (cast && cast.complete === true) return false;
    // Dynamic catalogs are not complete because they crossed an arbitrary row
    // count. Only a cache written after a provider reached its last page is
    // allowed to suppress another remote refresh.
    if (keys.comicWork || keys.malId || keys.anilistId || !keys.textWork) {
      var entry = cacheGetEntry(keys.workId);
      return !(entry && entry.complete === true && entry.completionVersion === CACHE_COMPLETION_VERSION);
    }
    if (keys.textWork) return current.length < MAX_LITERARY_CAST;
    return !current.length;
  }

  function aliasCandidates(workId) {
    var id = String(workId || "");
    var aliases = global.LorefyCatalogAliases || {};
    var out = [];
    function add(value) {
      value = String(value || "");
      if (value && out.indexOf(value) < 0) out.push(value);
    }
    add(id);
    add(aliases[id]);
    Object.keys(aliases).forEach(function (key) {
      if (String(aliases[key]) === id) add(key);
    });
    return out;
  }

  function catalogLookup(catalog, ids) {
    catalog = catalog || {};
    ids = asArray(ids);
    for (var i = 0; i < ids.length; i++) {
      if (catalog[ids[i]] && catalog[ids[i]].length) return catalog[ids[i]];
    }
    return [];
  }

  function catalogCast(work) {
    var keys = sourceKeysForWork(work);
    var ids = aliasCandidates(keys.workId);
    var catalog = global.LorefyCharacterCatalog || {};
    var literary = global.LorefyLiteraryCharacterCatalog || {};
    var comics = global.LorefyComicsCharacterCatalog || {};
    if (keys.malId) ids.push("mal:" + keys.malId);
    if (keys.anilistId) ids.push("anilist:" + keys.anilistId);
    asArray(keys.titleCandidates).forEach(function (title) {
      ids.push(titleCatalogKey(title));
    });
    if (work && work.comicUniverse) ids.push(String(work.comicUniverse));
    return dedupeCast(
      catalogLookup(catalog, ids)
        .concat(catalogLookup(literary, ids))
        .concat(catalogLookup(comics, ids))
    );
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error("timeout")); }, ms);
      promise.then(function (value) {
        clearTimeout(timer);
        resolve(value);
      }, function (err) {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function readResponseJson(response, ms) {
    return withTimeout(Promise.resolve().then(function () {
      return response.json();
    }), ms || 9000);
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function fetchJsonWithRetry(url, label, timeoutMs, retries) {
    var attempt = 0;
    function request() {
      return withTimeout(fetch(url, { headers: { Accept: "application/json" } }), timeoutMs)
        .then(function (response) {
          if (!response.ok) {
            var error = new Error(label + " " + response.status);
            error.retryable = response.status === 429 || response.status >= 500;
            throw error;
          }
          return readResponseJson(response, timeoutMs);
        })
        .catch(function (error) {
          if (attempt >= retries || error.retryable === false) throw error;
          attempt += 1;
          return wait(250 * attempt).then(request);
        });
    }
    return request();
  }

  function retryDelay(response, attempt) {
    var retryAfter = 0;
    try { retryAfter = Number(response && response.headers && response.headers.get("retry-after")) * 1000; } catch (e) {}
    if (retryAfter > 0) return Math.min(retryAfter, 10000);
    return 1400 * Math.pow(2, attempt);
  }

  function anilistEndpoint() {
    try {
      if (global.LorefyDataProxy && typeof global.LorefyDataProxy.catalogUrl === "function") {
        return global.LorefyDataProxy.catalogUrl("anilist", "https://graphql.anilist.co");
      }
      var config = global && global.LOREFY_REMOTE_CATALOG;
      var base = String(config && config.proxyBaseUrl || "").replace(/^\/+|\/+$/g, "");
      var origin = global && global.location && global.location.origin;
      var capacitor = global && global.Capacitor;
      var nativeRuntime = !!(capacitor && (
        (typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform()) ||
        (typeof capacitor.getPlatform === "function" && capacitor.getPlatform() !== "web")
      ));
      if (nativeRuntime) {
        var release = global && global.LOREFY_RELEASE || {};
        var supabase = release.supabase || global.LOREFY_SUPABASE || {};
        var publicBase = String(supabase.url || "").replace(/\/+$/, "");
        if (publicBase) return publicBase + "/functions/v1/lorefy-public/catalog-anilist";
      }
      if (base && origin && origin !== "null") return "/" + base + "/anilist";
    } catch (e) {}
    return "https://graphql.anilist.co";
  }

  function anilistRequest(payload, attempt) {
    attempt = Number(attempt) || 0;
    return withTimeout(fetch(anilistEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    }), 9000).then(function (response) {
      var retryable = response && (response.status === 429 || response.status >= 500);
      if (retryable && attempt < ANILIST_RETRY_LIMIT) {
        return wait(retryDelay(response, attempt)).then(function () { return anilistRequest(payload, attempt + 1); });
      }
      return response;
    });
  }

  function jikanEndpoint(path) {
    var direct = "https://api.jikan.moe/v4/" + String(path || "").replace(/^\/+/, "");
    try {
      if (global.LorefyDataProxy && typeof global.LorefyDataProxy.catalogUrl === "function") {
        return global.LorefyDataProxy.catalogUrl("jikan", direct);
      }
    } catch (e) {}
    return direct;
  }

  function catalogEndpoint(provider, direct) {
    try {
      if (global.LorefyDataProxy && typeof global.LorefyDataProxy.catalogUrl === "function") {
        return global.LorefyDataProxy.catalogUrl(provider, direct);
      }
    } catch (e) {}
    return direct;
  }

  function jikanCast(malId) {
    if (!malId) return Promise.reject(new Error("no mal id"));
    return withTimeout(fetch(jikanEndpoint("manga/" + encodeURIComponent(malId) + "/characters"), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("jikan " + response.status);
        return readResponseJson(response, 9000);
      })
      .then(function (json) {
        var cast = normalizeJikanRows(json && json.data);
        if (!cast.length) throw new Error("empty jikan cast");
        return cast;
      });
  }

  function kitsuTitleCandidates(attributes) {
    attributes = attributes || {};
    var titles = attributes.titles || {};
    return [attributes.canonicalTitle, titles.en, titles.en_jp, titles.ja_jp].filter(Boolean);
  }

  function kitsuMediaMatches(attributes, expectedTitles) {
    var expected = asArray(expectedTitles).map(titleKey).filter(Boolean);
    var actual = kitsuTitleCandidates(attributes).map(titleKey).filter(Boolean);
    if (!expected.length || !actual.length) return true;
    return actual.some(function (candidate) {
      return expected.some(function (title) { return candidate === title; });
    });
  }

  function normalizeKitsuPage(json) {
    var included = Object.create(null);
    asArray(json && json.included).forEach(function (row) {
      if (row && row.type === "characters" && row.id) included[String(row.id)] = row;
    });
    return asArray(json && json.data).map(function (row) {
      var relation = row && row.relationships && row.relationships.character;
      var characterId = relation && relation.data && relation.data.id;
      var character = included[String(characterId || "")];
      var attributes = character && character.attributes || {};
      var latin = attributes.canonicalName || attributes.name || attributes.names && attributes.names.en || "";
      var image = attributes.image && (attributes.image.original || attributes.image.large || attributes.image.medium) || "";
      if (!latin) return null;
      return {
        id: "kitsu-character-" + (character && character.id || slug(latin)),
        key: slug(latin),
        name: latin,
        latin: latin,
        role: roleLabel(row && row.attributes && row.attributes.role),
        note: "",
        image: image,
        source: "Kitsu"
      };
    }).filter(Boolean);
  }

  function kitsuCastById(mediaId, mediaType) {
    mediaType = mediaType === "anime" ? "anime" : "manga";
    var nextUrl = "https://kitsu.io/api/edge/" + mediaType + "/" + encodeURIComponent(mediaId) + "/characters?include=character&page%5Blimit%5D=20";
    var pages = [];
    var pageCount = 0;
    function next() {
      if (!nextUrl || pageCount >= 50) return Promise.resolve(dedupeCast([].concat.apply([], pages)));
      var requestUrl = nextUrl;
      pageCount += 1;
      return withTimeout(fetch(requestUrl, { headers: { Accept: "application/vnd.api+json" } }), 9000)
        .then(function (response) {
          if (!response.ok) throw new Error("kitsu " + response.status);
          return readResponseJson(response, 9000);
        })
        .then(function (json) {
          pages.push(normalizeKitsuPage(json));
          nextUrl = json && json.links && json.links.next || "";
          return next();
        });
    }
    return next().then(function (cast) {
      if (!cast.length) throw new Error("empty kitsu cast");
      return cast;
    });
  }

  function kitsuCastForWork(keys) {
    return kitsuSearchCast(keys, "manga").catch(function () { return []; }).then(function (manga) {
      if (manga.length > 25) return manga;
      return kitsuSearchCast(keys, "anime").then(function (anime) {
        return dedupeCast(manga.concat(anime));
      }).catch(function (error) {
        if (manga.length) return manga;
        throw error;
      });
    });
  }

  function kitsuSearchCast(keys, mediaType) {
    var candidates = asArray(keys && keys.titleCandidates).length ? keys.titleCandidates : [keys && keys.title];
    var title = candidates.filter(Boolean)[0];
    if (!title) return Promise.reject(new Error("no kitsu title"));
    var url = "https://kitsu.io/api/edge/" + mediaType + "?filter%5Btext%5D=" + encodeURIComponent(title) + "&page%5Blimit%5D=10";
    return withTimeout(fetch(url, { headers: { Accept: "application/vnd.api+json" } }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("kitsu " + response.status);
        return readResponseJson(response, 9000);
      })
      .then(function (json) {
        var rows = asArray(json && json.data);
        var match = rows.find(function (row) { return kitsuMediaMatches(row && row.attributes, candidates); });
        if (!match || !match.id) throw new Error("no kitsu media match");
        return kitsuCastById(match.id, mediaType);
      });
  }

  function anilistErrorStatus(json) {
    var first = json && Array.isArray(json.errors) && json.errors[0];
    var status = Number(first && (first.status || first.extensions && first.extensions.status));
    if (status) return status;
    return /too many requests|rate limit/i.test(String(first && first.message || "")) ? 429 : 0;
  }

  function anilistCastPage(query, variables, attempt) {
    attempt = Number(attempt) || 0;
    return anilistRequest({ query: query, variables: variables })
      .then(function (response) {
        if (!response.ok) throw new Error("anilist " + response.status);
        return readResponseJson(response, 9000);
      })
      .then(function (json) {
        var errorStatus = anilistErrorStatus(json);
        if (errorStatus) {
          if ((errorStatus === 429 || errorStatus >= 500) && attempt < ANILIST_RETRY_LIMIT) {
            return wait(retryDelay(null, attempt)).then(function () {
              return anilistCastPage(query, variables, attempt + 1);
            });
          }
          throw new Error("anilist " + errorStatus);
        }
        var media = ((json.data || {}).Media || {});
        var characters = media.characters || {};
        var edges = characters.edges || [];
        return { cast: normalizeAniListEdges(edges), pageInfo: characters.pageInfo || {}, title: media.title || {} };
      });
  }

  function titleKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\u0600-\u06FF]+/gu, "")
      .trim();
  }

  function mediaMatchesTitles(mediaTitle, expectedTitles) {
    var expected = asArray(expectedTitles).map(titleKey).filter(Boolean);
    var actual = [
      mediaTitle && mediaTitle.romaji,
      mediaTitle && mediaTitle.english,
      mediaTitle && mediaTitle.native
    ].map(titleKey).filter(Boolean);
    if (!expected.length || !actual.length) return true;
    return actual.some(function (candidate) {
      return expected.some(function (title) {
        return candidate === title;
      });
    });
  }

  function anilistCastByQuery(query, variables, expectedTitles) {
    var firstVariables = Object.assign({}, variables || {}, { page: 1, perPage: ANILIST_CHARACTER_PAGE_SIZE });
    return anilistCastPage(query, firstVariables).then(function (first) {
      if (!mediaMatchesTitles(first.title, expectedTitles)) throw new Error("anilist title mismatch");
      if (!first.cast.length) throw new Error("empty anilist cast");
      var pages = [first.cast];
      var currentPage = Math.max(1, Number(first.pageInfo && first.pageInfo.currentPage) || 1);
      var pageInfo = first.pageInfo || {};
      var MAX_PAGES = 250;
      function hasNext(info, page) {
        if (typeof info.hasNextPage === "boolean") return info.hasNextPage;
        var lastPage = Math.max(1, Number(info.lastPage) || 1);
        return page < lastPage;
      }
      function next() {
        if (!hasNext(pageInfo, currentPage)) {
          return Promise.resolve(dedupeCast([].concat.apply([], pages)));
        }
        if (currentPage >= MAX_PAGES) throw new Error("incomplete anilist cast: page limit");
        var requestedPage = currentPage + 1;
        return wait(ANILIST_PAGE_PACE_MS)
          .then(function () {
            return anilistCastPage(query, Object.assign({}, variables || {}, { page: requestedPage, perPage: ANILIST_CHARACTER_PAGE_SIZE }));
          })
          .then(function (result) {
            // AniList can revise its character total while pages are fetched.
            // Treat the newest pageInfo as authoritative and keep completed rows.
            if (!result.cast.length) throw new Error("incomplete anilist cast: empty continuation page");
            pages.push(result.cast);
            currentPage = Math.max(requestedPage, Number(result.pageInfo && result.pageInfo.currentPage) || requestedPage);
            pageInfo = result.pageInfo || {};
            return next();
          });
      }
      return next();
    });
  }

  function anilistCastByMal(malId, expectedTitles) {
    if (!malId) return Promise.reject(new Error("no mal id"));
    var query = "query($id:Int,$page:Int,$perPage:Int){Media(idMal:$id,type:MANGA){title{romaji english native} characters(page:$page,perPage:$perPage,sort:[ROLE,FAVOURITES_DESC]){pageInfo{currentPage lastPage hasNextPage total} edges{role node{id name{full native userPreferred} image{large medium}}}}}}";
    return anilistCastByQuery(query, { id: parseInt(malId, 10) }, expectedTitles);
  }

  function anilistCastById(anilistId, expectedTitles) {
    if (!anilistId) return Promise.reject(new Error("no anilist id"));
    var query = "query($id:Int,$page:Int,$perPage:Int){Media(id:$id,type:MANGA){title{romaji english native} characters(page:$page,perPage:$perPage,sort:[ROLE,FAVOURITES_DESC]){pageInfo{currentPage lastPage hasNextPage total} edges{role node{id name{full native userPreferred} image{large medium}}}}}}";
    return anilistCastByQuery(query, { id: parseInt(anilistId, 10) }, expectedTitles);
  }

  function anilistCastByTitle(title) {
    if (!title) return Promise.reject(new Error("no title"));
    var query = "query($search:String,$page:Int,$perPage:Int){Media(search:$search,type:MANGA){title{romaji english native} characters(page:$page,perPage:$perPage,sort:[ROLE,FAVOURITES_DESC]){pageInfo{currentPage lastPage hasNextPage total} edges{role node{id name{full native userPreferred} image{large medium}}}}}}";
    return anilistCastByQuery(query, { search: String(title).slice(0, 120) }, [title]);
  }

  function anilistCastForWork(keys) {
    var attempts = [];
    if (keys.anilistId) attempts.push(function () { return anilistCastById(keys.anilistId, keys.titleCandidates); });
    if (keys.malId) attempts.push(function () { return anilistCastByMal(keys.malId, keys.titleCandidates); });
    asArray(keys.titleCandidates).forEach(function (title) {
      attempts.push(function () { return anilistCastByTitle(title); });
    });
    function next(index) {
      if (index >= attempts.length) return Promise.reject(new Error("no anilist character source"));
      return attempts[index]().catch(function (error) {
        // Do not hammer the same source with title fallbacks when it is
        // unavailable. A later UI retry is safer and preserves the preview.
        if (/anilist (?:403|429|5\d\d)|timeout/i.test(String(error && error.message || error))) throw error;
        return next(index + 1);
      });
    }
    return next(0);
  }

  var FANDOM_CHARACTER_SOURCES = {
    "n-percy-jackson-lightning": {
      api: "https://riordan.fandom.com/api.php",
      page: "The_Lightning_Thief",
      source: "Riordan Wiki",
      sections: ["Characters?"]
    },
    "n-lord-of-the-rings": {
      api: "https://lotr.fandom.com/api.php",
      page: "List_of_the_Lord_of_the_Rings_film_trilogy_characters_and_cast_members",
      source: "LOTR Wiki",
      mode: "character-table",
      sections: ["List"]
    },
    "n-hobbit": {
      api: "https://lotr.fandom.com/api.php",
      page: "List_of_the_Hobbit_film_trilogy_characters_and_cast_members",
      source: "LOTR Wiki",
      mode: "character-table",
      sections: ["List"]
    },
    "n-game-of-thrones": {
      api: "https://gameofthrones.fandom.com/api.php",
      page: "Game_of_Thrones:_Season_1/Cast",
      source: "Game of Thrones Wiki",
      mode: "cast-lines",
      sections: ["Starring", "Guest starring", "Also starring"]
    }
  };

  var FANDOM_CATEGORY_SOURCES = [
    {
      malIds: ["96792"],
      titles: ["Demon Slayer: Kimetsu no Yaiba", "Kimetsu no Yaiba", "\u9b3c\u6ec5\u306e\u5203"],
      api: "https://kimetsu-no-yaiba.fandom.com/api.php",
      category: "Category:Characters",
      source: "Demon Slayer Wiki"
    },
    {
      malIds: ["103897"],
      titles: ["Dr. Stone", "Dr Stone"],
      api: "https://dr-stone.fandom.com/api.php",
      category: "Category:Characters",
      source: "Dr. Stone Wiki"
    }
  ];

  var fandomCategoryDiscoveryCache = new Map();

  function fandomCategorySourceForWork(work) {
    var keys = sourceKeysForWork(work);
    var expectedTitles = asArray(keys.titleCandidates).map(titleKey).filter(Boolean);
    return FANDOM_CATEGORY_SOURCES.find(function (source) {
      if (keys.malId && asArray(source.malIds).indexOf(String(keys.malId)) >= 0) return true;
      var sourceTitles = asArray(source.titles).map(titleKey).filter(Boolean);
      return expectedTitles.some(function (title) { return sourceTitles.indexOf(title) >= 0; });
    }) || null;
  }

  function fandomDomainCandidates(work) {
    var candidates = [];
    function add(value) {
      value = String(value || "").replace(/^-+|-+$/g, "");
      if (value && candidates.indexOf(value) < 0) candidates.push(value);
    }
    workTitleCandidates(work).forEach(function (title) {
      var ascii = String(title || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
      var words = ascii.toLowerCase().match(/[a-z0-9]+/g) || [];
      if (words.length === 1) {
        if (words[0].length >= 4) add(words[0]);
        return;
      }
      if (words.length < 2) return;
      add(words.join("-"));
      var withoutArticle = /^(?:the|a|an)$/.test(words[0]) ? words.slice(1) : words;
      add(withoutArticle.join(""));
      add(words.join(""));
      add(withoutArticle.join("-"));
    });
    return candidates.slice(0, 3);
  }

  function fandomSiteMatchesWork(siteName, work, requestedDomain) {
    var raw = String(siteName || "");
    if (!raw || /fanon/i.test(raw)) return false;
    var site = titleKey(raw.replace(/\b(?:wiki|fandom|community)\b/ig, " "));
    if (!site) return false;
    return workTitleCandidates(work).some(function (title) {
      var ascii = String(title || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
      var words = ascii.match(/[a-z0-9]+/ig) || [];
      if (!words.length) return false;
      var domain = String(requestedDomain || "").replace(/-/g, "").toLowerCase();
      var withoutArticle = /^(?:the|a|an)$/i.test(words[0]) ? words.slice(1) : words;
      if (domain && (domain === words.join("").toLowerCase() || domain === withoutArticle.join("").toLowerCase())) return true;
      var expected = titleKey(ascii);
      return expected === site || expected.length >= 10 && (site.indexOf(expected) >= 0 || expected.indexOf(site) >= 0);
    });
  }

  function discoverFandomCategorySource(work) {
    var configured = fandomCategorySourceForWork(work);
    if (configured) return Promise.resolve(configured);
    var keys = sourceKeysForWork(work);
    if (keys.excluded || keys.textWork) return Promise.reject(new Error("no fandom category source"));
    var cacheKey = keys.workId || titleKey(keys.title);
    if (fandomCategoryDiscoveryCache.has(cacheKey)) return fandomCategoryDiscoveryCache.get(cacheKey);
    var domains = fandomDomainCandidates(work);
    function next(index) {
      if (index >= domains.length) return Promise.reject(new Error("no matching fandom community"));
      var api = "https://" + domains[index] + ".fandom.com/api.php";
      var params = new URLSearchParams();
      params.set("action", "query");
      params.set("meta", "siteinfo");
      params.set("siprop", "general");
      params.set("format", "json");
      params.set("origin", "*");
      return withTimeout(fetch(api + "?" + params.toString(), { headers: { Accept: "application/json" } }), 3500)
        .then(function (response) {
          if (!response.ok) throw new Error("fandom discovery " + response.status);
          return readResponseJson(response, 3500);
        })
        .then(function (json) {
          var siteName = json && json.query && json.query.general && json.query.general.sitename || "";
          if (!fandomSiteMatchesWork(siteName, work, domains[index])) throw new Error("fandom title mismatch");
          return { api: api, category: "Category:Characters", source: siteName || "Fandom Wiki" };
        })
        .catch(function () { return next(index + 1); });
    }
    var request = domains.length ? next(0) : Promise.reject(new Error("no fandom domain candidates"));
    var pending = request.catch(function (error) {
      if (fandomCategoryDiscoveryCache.get(cacheKey) === pending) fandomCategoryDiscoveryCache.delete(cacheKey);
      throw error;
    });
    fandomCategoryDiscoveryCache.set(cacheKey, pending);
    return pending;
  }

  function fandomCategoryRoots(source, work) {
    if (!sourceKeysForWork(work).comicWork) return Promise.resolve([source.category]);
    var params = new URLSearchParams();
    params.set("action", "query");
    params.set("list", "categorymembers");
    params.set("cmtitle", source.category);
    params.set("cmtype", "subcat");
    params.set("cmlimit", "500");
    params.set("format", "json");
    params.set("origin", "*");
    return withTimeout(fetch(source.api + "?" + params.toString(), {
      headers: { Accept: "application/json" }
    }), 7000).then(function (response) {
      if (!response.ok) throw new Error("fandom subcategories " + response.status);
      return readResponseJson(response, 7000);
    }).then(function (json) {
      var titles = asArray(json && json.query && json.query.categorymembers)
        .map(function (row) { return String(row && row.title || ""); })
        .filter(function (title) { return /^Category:/i.test(title); });
      var exact = titles.filter(function (title) {
        return /^Category:(?:Comic|Comics|Comic Series|Comic Universe) Characters$/i.test(title);
      });
      if (exact.length) return exact;
      var scoped = titles.filter(function (title) {
        return /(?:Comic|Comics|Comic Series|Comic Universe).*Characters|Characters.*(?:Comic|Comics|Comic Series|Comic Universe)/i.test(title);
      }).slice(0, 12);
      return scoped.length ? scoped : [source.category];
    }).catch(function () {
      return [source.category];
    });
  }

  function fandomCharacterDisplayTitle(title, work) {
    title = normalizedPlain(title);
    if (!sourceKeysForWork(work).comicWork) return title;
    return title.replace(/\s*\((?:Comic|Comics|Comic Series|Comic Universe)\)\s*$/i, "").trim();
  }

  function fandomCategoryCast(work) {
    return discoverFandomCategorySource(work).then(function (source) {
      return fandomCategoryRoots(source, work).then(function (categoryRoots) {
      var pages = [];
      var categoryQueue = categoryRoots.slice();
      var visitedCategories = Object.create(null);
      var requestCount = 0;
      var MAX_CATEGORY_REQUESTS = 250;
      var DESCENDANT_DISCOVERY_THRESHOLD = 50;
      var hadCategoryError = false;

      function visitNextCategory() {
        if (!categoryQueue.length || requestCount >= MAX_CATEGORY_REQUESTS) return Promise.resolve();
        var category = categoryQueue.shift();
        if (!category || visitedCategories[category]) return visitNextCategory();
        visitedCategories[category] = true;
        var continuation = null;
        var directCharacterCount = 0;
        var discoveredSubcategories = [];

        function requestCategoryPage(params, attempt) {
          return withTimeout(fetch(source.api + "?" + params.toString(), {
            headers: { Accept: "application/json" }
          }), 12000).then(function (response) {
            if (!response.ok) throw new Error("fandom category " + response.status);
            return readResponseJson(response, 12000);
          }).catch(function (error) {
            if ((Number(attempt) || 0) < 1) {
              return wait(500).then(function () { return requestCategoryPage(params, 1); });
            }
            throw error;
          });
        }

        function visitCategoryPage() {
          if (requestCount >= MAX_CATEGORY_REQUESTS) return Promise.resolve();
          var params = new URLSearchParams();
          params.set("action", "query");
          params.set("generator", "categorymembers");
          params.set("gcmtitle", category);
          params.set("gcmtype", "page|subcat");
          params.set("gcmlimit", "500");
          params.set("prop", "pageimages");
          params.set("piprop", "thumbnail");
          params.set("pithumbsize", "320");
          params.set("format", "json");
          params.set("origin", "*");
          Object.keys(continuation || {}).forEach(function (key) {
            params.set(key, continuation[key]);
          });
          requestCount += 1;
          return requestCategoryPage(params, 0)
            .then(function (json) {
              var rows = Object.keys(json && json.query && json.query.pages || {}).map(function (key) {
                return json.query.pages[key];
              });
              rows.filter(function (row) {
                return row && Number(row.ns) === 14 && /^Category:/i.test(String(row.title || ""));
              }).forEach(function (row) {
                if (discoveredSubcategories.indexOf(row.title) < 0) discoveredSubcategories.push(row.title);
              });
              var characters = rows.map(function (row) {
                return { row: row, title: fandomCharacterDisplayTitle(row && row.title, work) };
              }).filter(function (candidate) {
                var row = candidate.row;
                return row && (row.ns == null || Number(row.ns) === 0) &&
                  looksLikeLiteraryCharacter(candidate.title, candidate.title, work);
              }).map(function (candidate) {
                var row = candidate.row;
                var latin = candidate.title;
                return {
                  id: "fandom-character-" + (row.pageid || slug(latin)),
                  key: slug(latin),
                  name: latin,
                  latin: latin,
                  role: ROLE_SUPPORT,
                  note: "",
                  image: row.thumbnail && row.thumbnail.source || "",
                  source: source.source || "Fandom Wiki",
                  fandomApi: source.api,
                  wikiTitle: row.title
                };
              });
              pages.push(characters);
              directCharacterCount += characters.length;
              continuation = json && json.continue || null;
              if (continuation) return visitCategoryPage();
              if (directCharacterCount < DESCENDANT_DISCOVERY_THRESHOLD) {
                var partition = discoveredSubcategories.filter(function (subcategory) {
                  return /^Category:Characters by (?:Gender|Sex)$/i.test(subcategory);
                });
                var descendants = partition.length ? partition : discoveredSubcategories;
                descendants.forEach(function (subcategory) {
                  if (!visitedCategories[subcategory] && categoryQueue.indexOf(subcategory) < 0) categoryQueue.push(subcategory);
                });
              }
              return visitNextCategory();
            }).catch(function () {
              hadCategoryError = true;
              return visitNextCategory();
            });
        }

        return visitCategoryPage();
      }

      return visitNextCategory().then(function () {
        var cast = dedupeCast([].concat.apply([], pages));
        if (!cast.length) throw new Error("empty fandom category cast");
        return markCast(cast, !hadCategoryError && requestCount < MAX_CATEGORY_REQUESTS);
      });
      });
    });
  }

  var WIKI_CHARACTER_BLACKLIST = [
    "united states", "new york city", "long island", "los angeles", "nevada",
    "king's landing", "winterfell", "wall", "hardcover", "paperback", "disney+",
    "novel", "fiction", "literature", "fantasy", "adaptation", "film", "series",
    "publisher", "school", "academy", "summer camp", "camp half-blood", "metropolitan museum of art",
    "dyslexia", "adhd", "book", "books", "award", "reviews", "television", "video game",
    "press", "university", "college", "publishing", "company", "journal", "magazine",
    "newspaper", "edition", "translator", "illustrator", "isbn", "copyright"
  ];

  function normalizedPlain(value) {
    return String(value || "")
      .replace(/&amp;/g, "&")
      .replace(/''+/g, "")
      .replace(/\{\{[^}]+\}\}/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function stripWikiQualifier(value) {
    return normalizedPlain(value)
      .replace(/\s*\([^)]*\)\s*$/g, "")
      .replace(/^the\s+/i, "")
      .trim();
  }

  function looksLikeLiteraryCharacter(target, label, work) {
    var raw = normalizedPlain(label || target);
    var normalized = normalizeCharacterName(raw);
    if (!raw || raw.length < 3 || raw.length > 64) return false;
    if (!normalized || WIKI_CHARACTER_BLACKLIST.indexOf(normalized) >= 0) return false;
    if (/^(file|image|category|help|template|wikipedia|portal):/i.test(target || "")) return false;
    if (/[{}<>]/.test(raw)) return false;
    if (/\b(fiction|novel|series|book|film|adaptation|publisher|literature|school|academy|camp|city|kingdom|museum|press|university|college|publishing|company|journal|magazine|newspaper|edition|translator|illustrator|isbn|copyright)\b/i.test(raw)) return false;
    if (work && work.author && compactCharacterName(raw) === compactCharacterName(work.author)) return false;
    if (work && work.title && compactCharacterName(raw) === compactCharacterName(work.title)) return false;
    if (/^[a-z]/.test(raw)) return false;
    return true;
  }

  function looksLikeComicCharacter(target, label, work) {
    if (!looksLikeLiteraryCharacter(target, label, work)) return false;
    var raw = normalizedPlain(label || target);
    return !/\b(?:comics?|publisher|universe|disambiguation|copyright|issue|volume|rogues? gallery|character list|list of|credits?|creator)\b/i.test(raw);
  }

  function extractWikiSection(text, heading) {
    var re = new RegExp("^==+\\s*" + heading + "\\s*==+\\s*$", "im");
    var match = text.match(re);
    if (!match) return "";
    var start = match.index + match[0].length;
    var rest = text.slice(start);
    var next = rest.search(/^==[^=]/m);
    return next >= 0 ? rest.slice(0, next) : rest;
  }

  function linkCandidatesFromWikitext(text, work, limit) {
    var seen = Object.create(null);
    var rows = [];
    var re = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;
    var match;
    while ((match = re.exec(text)) && rows.length < (limit || MAX_LITERARY_CAST)) {
      var target = normalizedPlain(match[1]);
      var label = normalizedPlain(match[2] || match[1]);
      var name = stripWikiQualifier(label);
      var key = slug(name);
      var valid = sourceKeysForWork(work).comicWork
        ? looksLikeComicCharacter(target, name, work)
        : looksLikeLiteraryCharacter(target, name, work);
      if (!key || seen[key] || !valid) continue;
      seen[key] = true;
      rows.push({
        id: "wiki-" + slug(target),
        key: key,
        name: name,
        latin: name,
        role: rows.length < 6 ? ROLE_MAIN : ROLE_SUPPORT,
        note: "",
        image: "",
        source: "Wikipedia",
        wikiTitle: target
      });
    }
    return rows;
  }

  function definitionCharacterCandidatesFromWikitext(text, work, limit) {
    var seen = Object.create(null);
    var rows = [];
    String(text || "").split(/\r?\n/).forEach(function (line) {
      if (rows.length >= (limit || MAX_LITERARY_CAST) || !/^\s*;/.test(line)) return;
      var match = line.match(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/);
      if (!match) return;
      var target = normalizedPlain(match[1]);
      var label = normalizedPlain(match[2] || match[1]);
      var aliases = label.split(/\s*\/\s*/).filter(Boolean);
      var name = stripWikiQualifier(aliases[aliases.length - 1] || label);
      var key = slug(name);
      if (!key || seen[key] || !looksLikeComicCharacter(target, name, work)) return;
      seen[key] = true;
      rows.push({
        id: "wiki-" + slug(target),
        key: key,
        name: name,
        latin: name,
        role: rows.length < 6 ? ROLE_MAIN : ROLE_SUPPORT,
        note: "",
        image: "",
        source: "Wikipedia",
        wikiTitle: target,
        aliases: aliases
      });
    });
    return rows;
  }

  function characterListPageFromWikitext(text) {
    var lines = String(text || "").split(/\r?\n/);
    for (var i = 0; i < lines.length; i += 1) {
      if (!/^\s*\{\{\s*Main\s*\|/i.test(lines[i]) || !/characters?/i.test(lines[i])) continue;
      var title = lines[i]
        .replace(/^\s*\{\{\s*Main\s*\|/i, "")
        .split(/\{\{!\}\}|\|/)[0]
        .replace(/\}\}\s*$/, "")
        .replace(/''+/g, "")
        .trim();
      if (/^(?:list of .+ characters|characters of .+)$/i.test(title)) return title;
    }
    return "";
  }

  function headingCharacterCandidatesFromWikitext(text, work, limit) {
    var headings = [];
    String(text || "").split(/\r?\n/).forEach(function (line) {
      var match = line.match(/^(={3,5})\s*(.*?)\s*\1\s*$/);
      if (!match) return;
      headings.push({ level: match[1].length, raw: match[2] });
    });
    var seen = Object.create(null);
    var rows = [];
    headings.forEach(function (heading, index) {
      if (rows.length >= (limit || MAX_LITERARY_CAST)) return;
      var next = headings[index + 1];
      if (next && next.level > heading.level) return;
      var name = normalizedPlain(String(heading.raw || "").replace(/\{\{.*?\}\}/g, ""))
        .replace(/\s*\([^)]*\)\s*$/g, "")
        .trim();
      var key = slug(name);
      if (!key || seen[key] || !looksLikeComicCharacter(name, name, work)) return;
      seen[key] = true;
      rows.push({
        id: "wiki-" + key,
        key: key,
        name: name,
        latin: name,
        role: rows.length < 6 ? ROLE_MAIN : ROLE_SUPPORT,
        note: "",
        image: "",
        source: "Wikipedia",
        wikiTitle: name
      });
    });
    return rows;
  }

  function primaryComicCharacterWikitext(text) {
    var source = String(text || "");
    var adaptation = source.search(/^==\s*(?:television series|films?|other media|adaptations?|in other media)\s*==\s*$/im);
    return adaptation >= 0 ? source.slice(0, adaptation) : source;
  }

  function tableCharacterCandidatesFromWikitext(text, work, limit) {
    var seen = Object.create(null);
    var rows = [];
    String(text || "").split(/\r?\n/).forEach(function (line) {
      if (rows.length >= (limit || MAX_LITERARY_CAST) || !/^!\s*/.test(line)) return;
      var cell = line.replace(/^!\s*/, "").split("|")[0];
      var match = cell.match(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/);
      if (!match) return;
      var target = normalizedPlain(match[1]);
      var label = normalizedPlain(match[2] || match[1]);
      var name = stripWikiQualifier(label);
      var key = slug(name);
      if (!key || seen[key] || !looksLikeLiteraryCharacter(target, name, work)) return;
      seen[key] = true;
      rows.push({
        id: "wiki-" + slug(target),
        key: key,
        name: name,
        latin: name,
        role: rows.length < 6 ? ROLE_MAIN : ROLE_SUPPORT,
        note: "",
        image: "",
        source: "Wikipedia",
        wikiTitle: target
      });
    });
    return rows;
  }

  function castLineCandidatesFromWikitext(text, work, limit) {
    var seen = Object.create(null);
    var rows = [];
    String(text || "").split(/\r?\n/).forEach(function (line) {
      if (rows.length >= (limit || MAX_LITERARY_CAST) || !/^\s*#/.test(line)) return;
      var parts = line.split(/\bas\b/i);
      if (parts.length < 2) return;
      var castCell = parts.slice(1).join(" as ").split("{{")[0];
      var match = castCell.match(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/);
      if (!match) return;
      var target = normalizedPlain(match[1]);
      var label = normalizedPlain(match[2] || match[1]);
      var name = stripWikiQualifier(label);
      var key = slug(name);
      if (!key || seen[key] || !looksLikeLiteraryCharacter(target, name, work)) return;
      seen[key] = true;
      rows.push({
        id: "wiki-" + slug(target),
        key: key,
        name: name,
        latin: name,
        role: rows.length < 6 ? ROLE_MAIN : ROLE_SUPPORT,
        note: "",
        image: "",
        source: "Wikipedia",
        wikiTitle: target
      });
    });
    return rows;
  }

  function wikiTitleKey(value) {
    var plain = normalizedPlain(value);
    try { plain = plain.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (ignore) {}
    return plain
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function applyWikipediaImages(cast) {
    cast = asArray(cast);
    var titles = cast.filter(function (c) { return !c.image && !c.img && !c.cover; })
      .map(function (c) { return c.wikiTitle; }).filter(Boolean).slice(0, MAX_LITERARY_CAST);
    if (!titles.length) {
      cast.forEach(function (row) { delete row.wikiTitle; });
      return Promise.resolve(cast);
    }
    var batches = [];
    for (var start = 0; start < titles.length; start += 50) batches.push(titles.slice(start, start + 50));
    return Promise.all(batches.map(function (batch) {
      var params = new URLSearchParams();
      params.set("action", "query");
      params.set("prop", "pageimages|pageprops");
      params.set("ppprop", "wikibase_item");
      params.set("format", "json");
      params.set("origin", "*");
      params.set("pithumbsize", "240");
      params.set("redirects", "1");
      params.set("titles", batch.join("|"));
      return fetchJsonWithRetry(
        catalogEndpoint("wikipedia", "https://en.wikipedia.org/w/api.php?" + params.toString()),
        "wikipedia images",
        9000,
        1
      );
    })).then(function (responses) {
        var byTitle = {};
        var entityByTitle = {};
        responses.forEach(function (json) {
          var pages = ((json.query || {}).pages) || {};
          Object.keys(pages).forEach(function (key) {
            var page = pages[key] || {};
            if (page.title && page.thumbnail && page.thumbnail.source) byTitle[wikiTitleKey(page.title)] = page.thumbnail.source;
            if (page.title && page.pageprops && page.pageprops.wikibase_item) {
              entityByTitle[wikiTitleKey(page.title)] = page.pageprops.wikibase_item;
            }
          });
          var redirects = asArray((json.query || {}).redirects);
          redirects.forEach(function (row) {
            var from = wikiTitleKey(row && row.from);
            var to = wikiTitleKey(row && row.to);
            if (from && to && byTitle[to] && !byTitle[from]) byTitle[from] = byTitle[to];
          });
          var normalized = asArray((json.query || {}).normalized);
          normalized.forEach(function (row) {
            var from = wikiTitleKey(row && row.from);
            var to = wikiTitleKey(row && row.to);
            if (from && to && byTitle[to] && !byTitle[from]) byTitle[from] = byTitle[to];
          });
        });
        var entityIds = Object.keys(entityByTitle).map(function (title) { return entityByTitle[title]; });
        entityIds = entityIds.filter(function (id, index) { return id && entityIds.indexOf(id) === index; });
        var entitiesPromise = entityIds.length
          ? wikidataEntities(entityIds).catch(function () { return {}; })
          : Promise.resolve({});
        return entitiesPromise.then(function (entities) {
          var rejectedTitles = {};
          Object.keys(entityByTitle).forEach(function (title) {
            var entity = entities[entityByTitle[title]] || {};
            var description = entity.descriptions && entity.descriptions.en && entity.descriptions.en.value || "";
            var image = commonsFileUrl(wikidataClaimString(entity, "P18"));
            if (description && !/character|fictional|protagonist|antagonist|legendary|mythical|literary|demigod/i.test(description)) {
              rejectedTitles[title] = true;
            }
            if (image && (!description || /character|fictional|protagonist|antagonist|legendary|mythical|literary|demigod/i.test(description))) {
              byTitle[title] = byTitle[title] || image;
            }
          });
          cast = cast.filter(function (row) {
            return row.source !== "Wikipedia" || !row.wikiTitle || !rejectedTitles[wikiTitleKey(row.wikiTitle)];
          });
          cast.forEach(function (row) {
            if (row.wikiTitle && byTitle[wikiTitleKey(row.wikiTitle)]) row.image = byTitle[wikiTitleKey(row.wikiTitle)];
            delete row.wikiTitle;
          });
          return cast;
        });
      })
      .catch(function () {
        cast.forEach(function (row) { delete row.wikiTitle; });
        return cast;
      });
  }

  function applyFandomImages(api, cast) {
    cast = asArray(cast);
    if (!api || !cast.length) return Promise.resolve(cast);
    var titles = cast.map(function (row) { return row.wikiTitle || row.latin || row.name; }).filter(Boolean).slice(0, MAX_LITERARY_CAST);
    var batches = [];
    for (var start = 0; start < titles.length; start += 50) batches.push(titles.slice(start, start + 50));
    return Promise.all(batches.map(function (batch) {
      var params = new URLSearchParams();
      params.set("action", "query");
      params.set("prop", "pageimages");
      params.set("format", "json");
      params.set("origin", "*");
      params.set("pithumbsize", "240");
      params.set("titles", batch.join("|"));
      return withTimeout(fetch(api + "?" + params.toString(), {
        headers: { Accept: "application/json" }
      }), 9000)
        .then(function (response) {
          if (!response.ok) throw new Error("fandom images " + response.status);
          return readResponseJson(response, 9000);
        });
    })).then(function (responses) {
      var byTitle = {};
      responses.forEach(function (json) {
        var pages = ((json.query || {}).pages) || {};
        Object.keys(pages).forEach(function (key) {
          var page = pages[key] || {};
          if (page.title && page.thumbnail && page.thumbnail.source) byTitle[wikiTitleKey(page.title)] = page.thumbnail.source;
        });
      });
      cast.forEach(function (row) {
        var title = row.wikiTitle || row.latin || row.name;
        if (!row.image && title && byTitle[wikiTitleKey(title)]) row.image = byTitle[wikiTitleKey(title)];
      });
      return cast;
    }).catch(function () { return cast; });
  }

  function fandomCharacterImageSearch(api, character) {
    var name = character && (character.latin || character.name);
    if (!api || !name) return Promise.resolve("");
    var params = new URLSearchParams();
    params.set("action", "query");
    params.set("generator", "search");
    params.set("gsrsearch", String(name).slice(0, 100));
    params.set("gsrnamespace", "0");
    params.set("gsrlimit", "6");
    params.set("prop", "pageimages");
    params.set("pithumbsize", "240");
    params.set("format", "json");
    params.set("origin", "*");
    var expected = normalizeCharacterName(name);
    var expectedTokens = characterNameTokens(name).filter(function (token) { return token.length > 1; });
    return withTimeout(fetch(api + "?" + params.toString(), { headers: { Accept: "application/json" } }), 7000)
      .then(function (response) {
        if (!response.ok) throw new Error("fandom image search " + response.status);
        return readResponseJson(response, 7000);
      })
      .then(function (json) {
        var pages = ((json.query || {}).pages) || {};
        var candidates = Object.keys(pages).map(function (key) { return pages[key] || {}; })
          .filter(function (page) {
            var title = normalizeCharacterName(page.title || "");
            var firstToken = expectedTokens[0] || "";
            var scopedAlias = firstToken.length >= 4 &&
              title.indexOf(firstToken + " ") === 0 && /\bwatchmen\b/.test(title) &&
              !/\b(?:movie|tv series|television)\b/.test(title);
            return page.thumbnail && page.thumbnail.source && (
              title === expected || title.indexOf(expected) === 0 ||
              (title.length >= 5 && expected.indexOf(title) === 0) || scopedAlias ||
              expectedTokens.every(function (token) { return title.indexOf(token) >= 0; })
            );
          });
        return candidates[0] && candidates[0].thumbnail && candidates[0].thumbnail.source || "";
      }).catch(function () { return ""; });
  }

  function commonsCharacterPictures(character) {
    var name = character && (character.latin || character.name);
    if (!name) return Promise.resolve([]);
    var params = new URLSearchParams();
    params.set("action", "query");
    params.set("generator", "search");
    params.set("gsrsearch", "intitle:" + String(name).slice(0, 100));
    params.set("gsrnamespace", "6");
    params.set("gsrlimit", "8");
    params.set("prop", "imageinfo");
    params.set("iiprop", "url");
    params.set("iiurlwidth", "320");
    params.set("format", "json");
    params.set("origin", "*");
    var tokens = characterNameTokens(name).filter(function (token) { return token.length > 2; });
    return withTimeout(fetch(catalogEndpoint("commons", "https://commons.wikimedia.org/w/api.php?" + params.toString()), {
      headers: { Accept: "application/json" }
    }), 7000)
      .then(function (response) {
        if (!response.ok) throw new Error("commons images " + response.status);
        return readResponseJson(response, 7000);
      })
      .then(function (json) {
        var pages = ((json.query || {}).pages) || {};
        return Object.keys(pages).map(function (key) {
          var page = pages[key] || {};
          var info = page.imageinfo && page.imageinfo[0] || {};
          return { title: page.title || "", url: info.thumburl || info.url || "" };
        }).filter(function (row) {
          var title = row.title.toLowerCase();
          return row.url && /\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(row.url) &&
            tokens.every(function (token) { return title.indexOf(token) >= 0; });
        }).map(function (row) { return row.url; });
      });
  }

  function fandomImageSource(character, work) {
    if (character && character.fandomApi) return { api: character.fandomApi };
    return fandomSourceForWork(work);
  }

  function safeFandomImageTitle(title, character, aliases) {
    var normalized = normalizeCharacterName(title);
    if (!normalized || /\b(?:actor|actress|cosplay|cosplayer|convention|live action|film|movie|television|tv series|portrait|headshot|costume player)\b/.test(normalized)) return false;
    var names = [character && (character.latin || character.name)].concat(asArray(aliases));
    return names.some(function (candidate) {
      var tokens = characterNameTokens(candidate).filter(function (token) { return token.length > 2 && token !== "the"; });
      return tokens.length && tokens.every(function (token) { return normalized.indexOf(token) >= 0; });
    });
  }

  function fandomPreferredTitles(api, name) {
    if (/dc\.fandom\.com/i.test(api)) return [name + " (Prime Earth)", name + " (New Earth)", name];
    if (/marvel\.fandom\.com/i.test(api)) return [name + " (Earth-616)", name + " (Earth-1610)", name];
    return [name];
  }

  function fandomFetchJson(api, params, label) {
    var direct = api + "?" + params.toString();
    var provider = /dc\.fandom\.com/i.test(api) ? "dc-fandom" : /marvel\.fandom\.com/i.test(api) ? "marvel-fandom" : "";
    var endpoint = provider ? catalogEndpoint(provider, direct) : direct;
    return fetchJsonWithRetry(endpoint, label, 9000, 1).catch(function (error) {
      if (endpoint === direct) throw error;
      return fetchJsonWithRetry(direct, label + " direct", 9000, 1);
    });
  }

  function fandomDirectPage(api, name) {
    var preferred = fandomPreferredTitles(api, name);
    var params = new URLSearchParams();
    params.set("action", "query");
    params.set("titles", preferred.join("|"));
    params.set("redirects", "1");
    params.set("prop", "pageimages");
    params.set("piprop", "thumbnail");
    params.set("pithumbsize", "320");
    params.set("format", "json");
    params.set("origin", "*");
    return fandomFetchJson(api, params, "fandom character page")
      .then(function (json) {
        var query = json.query || {};
        var pages = Object.keys(query.pages || {}).map(function (key) { return query.pages[key] || {}; })
          .filter(function (page) { return page.pageid && page.title; });
        var redirects = {};
        asArray(query.redirects).forEach(function (row) {
          if (row && row.from && row.to) redirects[normalizeCharacterName(row.from)] = row.to;
        });
        for (var index = 0; index < preferred.length; index += 1) {
          var normalizedPreferred = normalizeCharacterName(preferred[index]);
          var target = normalizeCharacterName(redirects[normalizedPreferred] || preferred[index]);
          var page = pages.find(function (candidate) {
            return normalizeCharacterName(candidate.title) === target;
          });
          if (page) return page;
        }
        return null;
      });
  }

  function fandomSearchPage(api, name) {
    var search = new URLSearchParams();
    search.set("action", "query");
    search.set("generator", "search");
    search.set("gsrsearch", String(name).slice(0, 100));
    search.set("gsrnamespace", "0");
    search.set("gsrlimit", "8");
    search.set("prop", "pageimages");
    search.set("piprop", "thumbnail");
    search.set("pithumbsize", "320");
    search.set("format", "json");
    search.set("origin", "*");
    var expected = normalizeCharacterName(name);
    var tokens = characterNameTokens(name).filter(function (token) { return token.length > 2 && token !== "the"; });
    return fandomFetchJson(api, search, "fandom character search")
      .then(function (json) {
        return Object.keys(((json.query || {}).pages) || {}).map(function (key) { return json.query.pages[key] || {}; })
          .filter(function (page) {
            var title = normalizeCharacterName(page.title || "");
            return page.pageid && title && !/\b(?:actor|actress|film|movie|television|tv series|disambiguation)\b/.test(title) &&
              (title === expected || title.indexOf(expected + " ") === 0 || tokens.every(function (token) { return title.indexOf(token) >= 0; }));
          })
          .sort(function (a, b) {
            function score(page) {
              var title = normalizeCharacterName(page.title || "");
              if (title === expected) return 100;
              if (title.indexOf(expected + " earth 616") === 0 || title.indexOf(expected + " earth 1610") === 0) return 90;
              if (title.indexOf(expected + " ") === 0) return 80;
              return 50;
            }
            return score(b) - score(a);
          })[0] || null;
      });
  }

  function fandomCharacterPictures(api, character) {
    var name = character && (character.latin || character.name);
    if (!api || !name) return Promise.resolve([]);
    return fandomDirectPage(api, name)
      .catch(function () { return null; })
      .then(function (page) { return page || fandomSearchPage(api, name); })
      .then(function (page) {
        if (!page) return [];
        var seed = page.thumbnail && page.thumbnail.source ? [page.thumbnail.source] : [];
        var pageAlias = String(page.title || "").replace(/\s*\([^)]*\)\s*/g, " ").trim();
        var imageAliases = pageAlias ? [pageAlias] : [];
        var images = new URLSearchParams();
        images.set("action", "query");
        images.set("pageids", String(page.pageid));
        images.set("prop", "images");
        images.set("imlimit", "50");
        images.set("format", "json");
        images.set("origin", "*");
        return fandomFetchJson(api, images, "fandom character images")
          .then(function (imageJson) {
            var imagePage = (((imageJson.query || {}).pages) || {})[String(page.pageid)] || {};
            var titles = asArray(imagePage.images).map(function (row) { return row && row.title || ""; })
              .filter(function (title) { return safeFandomImageTitle(title, character, imageAliases); })
              .slice(0, 24);
            if (!titles.length) return seed;
            var batches = [];
            for (var start = 0; start < titles.length; start += 12) batches.push(titles.slice(start, start + 12));
            return Promise.all(batches.map(function (batch) {
              var info = new URLSearchParams();
              info.set("action", "query");
              info.set("titles", batch.join("|"));
              info.set("prop", "imageinfo");
              info.set("iiprop", "url");
              info.set("iiurlwidth", "480");
              info.set("format", "json");
              info.set("origin", "*");
              return fandomFetchJson(api, info, "fandom image info").catch(function () { return null; });
            })).then(function (responses) {
              var urls = seed.slice();
              responses.forEach(function (response) {
                if (!response) return;
                var infoPages = ((response.query || {}).pages) || {};
                Object.keys(infoPages).forEach(function (key) {
                  var infoPage = infoPages[key] || {};
                  if (!safeFandomImageTitle(infoPage.title || "", character, imageAliases)) return;
                  var imageInfo = infoPage.imageinfo && infoPage.imageinfo[0] || {};
                  var url = imageInfo.thumburl || imageInfo.url || "";
                  if (url && /\.(?:jpe?g|png|webp)(?:[?#/]|$)/i.test(url)) urls.push(url);
                });
              });
              return dedupeUrls(urls);
            });
          }).catch(function () { return seed; });
      });
  }

  function mapWithConcurrency(rows, limit, task) {
    rows = asArray(rows);
    limit = Math.max(1, Number(limit) || 1);
    if (!rows.length) return Promise.resolve([]);
    var output = new Array(rows.length);
    var cursor = 0;
    function worker() {
      var index = cursor++;
      if (index >= rows.length) return Promise.resolve();
      return Promise.resolve(task(rows[index], index))
        .then(function (value) { output[index] = value; })
        .catch(function () { output[index] = rows[index]; })
        .then(worker);
    }
    return Promise.all(Array.from({ length: Math.min(limit, rows.length) }, worker)).then(function () { return output; });
  }

  function fandomSourceForWork(work) {
    var keys = sourceKeysForWork(work);
    var source = FANDOM_CHARACTER_SOURCES[keys.workId];
    if (source) return source;
    if (!keys.comicWork) return null;
    var publisher = String(work && work.comicPublisher || "").toLowerCase();
    var universe = String(work && work.comicUniverse || "").toLowerCase();
    if (publisher === "dc" || universe.indexOf("comic:dc-") === 0) {
      return { api: "https://dc.fandom.com/api.php", source: "DC Wiki" };
    }
    if (publisher === "marvel" || universe.indexOf("comic:marvel-") === 0) {
      return { api: "https://marvel.fandom.com/api.php", source: "Marvel Wiki" };
    }
    return null;
  }

  function hydrateCatalogImages(cast, options) {
    options = options || {};
    cast = asArray(cast);
    if (!cast.some(function (row) { return !row.image && !row.img && !row.cover; })) {
      return Promise.resolve(cast);
    }
    var prepared = cast.map(function (row) {
      return Object.assign({}, row, {
        wikiTitle: row.wikiTitle || row.latin || row.name || ""
      });
    });
    var imagePhase = options.fandomSource
      ? applyFandomImages(options.fandomSource.api, prepared).then(function (rows) {
          var pending = rows.filter(function (row) { return !row.image && !row.img && !row.cover; });
          return mapWithConcurrency(pending.slice(0, MAX_LITERARY_CAST), 3, function (row) {
            return fandomCharacterImageSearch(options.fandomSource.api, row).then(function (url) {
              if (url) row.image = url;
              return row;
            });
          }).then(function () { return rows; });
        })
      : Promise.resolve(prepared);
    imagePhase = imagePhase.then(function (rows) {
      return options.skipWikipedia ? rows : applyWikipediaImages(rows);
    });
    return imagePhase.then(function (rows) {
      var pending = rows.filter(function (row) { return !row.image && !row.img && !row.cover; });
      if (!pending.length) return rows;
      return mapWithConcurrency(pending.slice(0, MAX_LITERARY_CAST), 4, function (row) {
        return commonsCharacterPictures(row).then(function (urls) {
          if (urls[0]) row.image = urls[0];
          return row;
        });
      }).then(function () { return rows; });
    });
  }

  function wikidataApi(params) {
    params.set("format", "json");
    params.set("origin", "*");
    return withTimeout(fetch(catalogEndpoint("wikidata", "https://www.wikidata.org/w/api.php?" + params.toString()), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("wikidata " + response.status);
        return readResponseJson(response, 9000);
      });
  }

  function wikidataEntityLabel(entity) {
    entity = entity || {};
    return entity.labels && entity.labels.en && entity.labels.en.value || "";
  }

  function wikidataClaimEntityIds(entity, property) {
    var claims = ((entity || {}).claims || {})[property] || [];
    return asArray(claims)
      .map(function (claim) {
        var value = (((claim || {}).mainsnak || {}).datavalue || {}).value || {};
        return value.id || (value["entity-type"] === "item" && value["numeric-id"] ? "Q" + value["numeric-id"] : "");
      })
      .filter(Boolean);
  }

  function wikidataClaimString(entity, property) {
    var claims = ((entity || {}).claims || {})[property] || [];
    var first = claims[0] || {};
    var value = (((first.mainsnak || {}).datavalue || {}).value);
    return typeof value === "string" ? value : "";
  }

  function commonsFileUrl(filename) {
    if (!filename) return "";
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(filename).replace(/%20/g, "_") + "?width=240";
  }

  function wikidataWorkEntity(work) {
    var keys = sourceKeysForWork(work);
    if (!keys.title) return Promise.reject(new Error("no title"));
    var params = new URLSearchParams();
    params.set("action", "wbsearchentities");
    params.set("language", "en");
    params.set("uselang", "en");
    params.set("limit", "8");
    params.set("search", [keys.title, keys.author].filter(Boolean).join(" "));
    return wikidataApi(params).then(function (json) {
      var rows = asArray(json.search);
      if (!rows.length) throw new Error("empty wikidata search");
      var titleKey = compactCharacterName(keys.title);
      var best = rows.find(function (row) {
        return compactCharacterName(row.label) === titleKey;
      }) || rows.find(function (row) {
        return /novel|book|literary|fiction|web novel|light novel/i.test(row.description || "");
      }) || rows[0];
      if (!best || !best.id) throw new Error("no wikidata work entity");
      return best.id;
    });
  }

  function wikidataEntities(ids) {
    ids = asArray(ids).filter(Boolean).slice(0, MAX_LITERARY_CAST);
    if (!ids.length) return Promise.resolve({});
    var batches = [];
    for (var start = 0; start < ids.length; start += 50) batches.push(ids.slice(start, start + 50));
    return Promise.all(batches.map(function (batch) {
      var params = new URLSearchParams();
      params.set("action", "wbgetentities");
      params.set("ids", batch.join("|"));
      params.set("props", "labels|claims|descriptions");
      params.set("languages", "en");
      return wikidataApi(params).then(function (json) { return json.entities || {}; });
    })).then(function (parts) {
      var entities = {};
      parts.forEach(function (part) { Object.keys(part).forEach(function (id) { entities[id] = part[id]; }); });
      return entities;
    });
  }

  function tryTitleCandidates(keys, task) {
    var candidates = asArray(keys.titleCandidates).length ? keys.titleCandidates : [keys.title];
    var index = 0;
    function next(lastError) {
      if (index >= candidates.length) return Promise.reject(lastError || new Error("no title candidates"));
      return Promise.resolve(task(candidates[index++])).catch(next);
    }
    return next();
  }

  function wikidataWorkEntityForTitle(keys, title) {
    var params = new URLSearchParams();
    params.set("action", "wbsearchentities");
    params.set("language", "en");
    params.set("uselang", "en");
    params.set("limit", "8");
    params.set("search", [title, keys.author].filter(Boolean).join(" "));
    return wikidataApi(params).then(function (json) {
      var rows = asArray(json.search);
      if (!rows.length) throw new Error("empty wikidata search");
      var titleKey = compactCharacterName(title);
      var best = rows.find(function (row) {
        return compactCharacterName(row.label) === titleKey;
      });
      if (!best || !best.id) throw new Error("no wikidata work entity");
      return best.id;
    });
  }

  function wikidataCastForTitle(keys, title) {
    return wikidataWorkEntityForTitle(keys, title)
      .then(function (workId) {
        return wikidataEntities([workId]);
      })
      .then(function (entities) {
        var workEntity = entities[Object.keys(entities)[0]] || {};
        var characterIds = wikidataClaimEntityIds(workEntity, "P674");
        if (!characterIds.length) throw new Error("empty wikidata P674");
        return wikidataEntities(characterIds);
      })
      .then(function (entities) {
        var rows = Object.keys(entities).map(function (id, index) {
          var entity = entities[id] || {};
          var label = wikidataEntityLabel(entity);
          if (!label) return null;
          return {
            id: "wikidata-" + id,
            key: slug(label),
            name: label,
            latin: label,
            role: index < 6 ? ROLE_MAIN : ROLE_SUPPORT,
            note: id,
            image: commonsFileUrl(wikidataClaimString(entity, "P18")),
            source: "Wikidata"
          };
        }).filter(Boolean);
        rows = dedupeCast(rows).slice(0, MAX_LITERARY_CAST);
        if (!rows.length) throw new Error("empty wikidata cast");
        return rows;
      });
  }

  function wikidataCast(work) {
    var keys = sourceKeysForWork(work);
    return tryTitleCandidates(keys, function (title) {
      return wikidataCastForTitle(keys, title);
    });
  }

  function wikipediaPageForTitle(keys, title) {
    var query = [title, keys.author, keys.comicWork ? "comic" : "novel"].filter(Boolean).join(" ");
    if (!title) return Promise.reject(new Error("no title"));
    var params = new URLSearchParams();
    params.set("action", "query");
    params.set("list", "search");
    params.set("format", "json");
    params.set("origin", "*");
    params.set("srlimit", "6");
    params.set("srsearch", query);
    return withTimeout(fetch(catalogEndpoint("wikipedia", "https://en.wikipedia.org/w/api.php?" + params.toString()), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("wikipedia search " + response.status);
        return readResponseJson(response, 9000);
      })
      .then(function (json) {
        var rows = ((json.query || {}).search) || [];
        if (!rows.length) throw new Error("empty wikipedia search");
        var titleKey = compactCharacterName(title);
        var best = rows.find(function (row) {
          return compactCharacterName(row.title) === titleKey;
        });
        if (!best || !best.title) throw new Error("no exact wikipedia work match");
        return best.title;
      });
  }

  function wikipediaCharacterPageForTitle(keys, title) {
    if (!title) return Promise.reject(new Error("no title"));
    var params = new URLSearchParams();
    params.set("action", "query");
    params.set("list", "search");
    params.set("format", "json");
    params.set("origin", "*");
    params.set("srlimit", "10");
    params.set("srsearch", [title, "characters", keys.author].filter(Boolean).join(" "));
    return withTimeout(fetch(catalogEndpoint("wikipedia", "https://en.wikipedia.org/w/api.php?" + params.toString()), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("wikipedia character search " + response.status);
        return readResponseJson(response, 9000);
      })
      .then(function (json) {
        var rows = ((json.query || {}).search) || [];
        var titleKey = compactCharacterName(title);
        var best = rows.find(function (row) {
          return compactCharacterName(row && row.title) !== titleKey && /characters?/i.test((row && row.title) || "");
        }) || rows.find(function (row) {
          return compactCharacterName(row && row.title) !== titleKey;
        });
        if (!best || !best.title) throw new Error("empty wikipedia character search");
        return best.title;
      });
  }

  function wikipediaPageWikitext(page) {
    var params = new URLSearchParams();
    params.set("action", "parse");
    params.set("page", page);
    params.set("prop", "wikitext");
    params.set("format", "json");
    params.set("origin", "*");
    return withTimeout(fetch(catalogEndpoint("wikipedia", "https://en.wikipedia.org/w/api.php?" + params.toString()), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("wikipedia parse " + response.status);
        return readResponseJson(response, 9000);
      })
      .then(function (json) {
        return (((json.parse || {}).wikitext || {})["*"]) || "";
      });
  }

  function wikipediaCastPage(page, work, allowWholePage) {
    return wikipediaPageWikitext(page)
      .then(function (text) {
        var characterSection = extractWikiSection(text, "Characters?(?:\\s+and\\s+[^=]+)?");
        var plotSection = extractWikiSection(text, "Plot(?: summary)?") || extractWikiSection(text, "Synopsis");
        var source = characterSection + "\n" + plotSection;
        if (!source.trim() && allowWholePage) source = text;
        return dedupeCast(linkCandidatesFromWikitext(source, work, MAX_LITERARY_CAST)).slice(0, MAX_LITERARY_CAST);
      });
  }

  function wikipediaComicCastPage(page, work) {
    return wikipediaPageWikitext(page).then(function (text) {
      var characterSection = extractWikiSection(text, "Characters?(?:\\s+and\\s+[^=]+)?");
      if (!characterSection.trim()) return [];
      var definitions = definitionCharacterCandidatesFromWikitext(characterSection, work, MAX_LITERARY_CAST);
      var cast = definitions.length
        ? definitions
        : linkCandidatesFromWikitext(characterSection, work, MAX_LITERARY_CAST);
      var characterListPage = characterListPageFromWikitext(characterSection);
      if (!characterListPage) return dedupeCast(cast).slice(0, MAX_LITERARY_CAST);
      return wikipediaPageWikitext(characterListPage).then(function (listText) {
        listText = primaryComicCharacterWikitext(listText);
        var listDefinitions = definitionCharacterCandidatesFromWikitext(listText, work, MAX_LITERARY_CAST);
        var listHeadings = headingCharacterCandidatesFromWikitext(listText, work, MAX_LITERARY_CAST);
        return dedupeCast(cast.concat(listDefinitions, listHeadings)).slice(0, MAX_LITERARY_CAST);
      }).catch(function () {
        return dedupeCast(cast).slice(0, MAX_LITERARY_CAST);
      });
    });
  }

  function wikipediaCastForTitle(keys, work, title) {
    return wikipediaPageForTitle(keys, title)
      .then(function (page) { return wikipediaCastPage(page, work, false); })
      .then(function (cast) {
        if (cast.length) return applyWikipediaImages(cast);
        return wikipediaCharacterPageForTitle(keys, title)
          .then(function (page) { return wikipediaCastPage(page, work, true); })
          .then(function (characterCast) {
            if (!characterCast.length) throw new Error("empty wikipedia cast");
            return applyWikipediaImages(characterCast);
          });
      });
  }

  function wikipediaComicCastForTitle(keys, work, title) {
    return wikipediaPageForTitle(keys, title)
      .then(function (page) { return wikipediaComicCastPage(page, work); })
      .then(function (cast) {
        if (!cast.length) throw new Error("empty wikipedia comic cast");
        return applyWikipediaImages(cast);
      });
  }

  function wikipediaCast(work) {
    var keys = sourceKeysForWork(work);
    return tryTitleCandidates(keys, function (title) {
      return wikipediaCastForTitle(keys, work, title);
    });
  }

  function fandomCharacters(work) {
    var keys = sourceKeysForWork(work);
    var source = FANDOM_CHARACTER_SOURCES[keys.workId];
    if (!source) return Promise.reject(new Error("no fandom source"));
    var params = new URLSearchParams();
    params.set("action", "parse");
    params.set("page", source.page);
    params.set("prop", "wikitext");
    params.set("format", "json");
    params.set("origin", "*");
    return withTimeout(fetch(source.api + "?" + params.toString(), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("fandom " + response.status);
        return readResponseJson(response, 9000);
      })
      .then(function (json) {
        var text = (((json.parse || {}).wikitext || {})["*"]) || "";
        var sections = asArray(source.sections).map(function (heading) { return extractWikiSection(text, heading); });
        var section = sections.join("\n");
        var cast = source.mode === "character-table"
          ? tableCharacterCandidatesFromWikitext(section, work, MAX_LITERARY_CAST)
          : source.mode === "cast-lines"
            ? castLineCandidatesFromWikitext(section, work, MAX_LITERARY_CAST)
            : linkCandidatesFromWikitext(section, work, MAX_LITERARY_CAST).slice(0, MAX_LITERARY_CAST);
        if (!cast.length) throw new Error("empty fandom cast");
        cast.forEach(function (row) {
          row.source = source.source || "Fandom Wiki";
          row.fandomApi = source.api;
        });
        return applyFandomImages(source.api, cast);
      });
  }

  function literaryRemoteCast(work) {
    if (!sourceKeysForWork(work).textWork) return Promise.reject(new Error("not text work"));
    return fandomCharacters(work).catch(function () {
      return wikidataCast(work);
    }).catch(function () {
      return wikipediaCast(work);
    }).then(function (cast) {
      var allWikipedia = cast.length && cast.every(function (row) { return row && row.source === "Wikipedia"; });
      var allFandom = cast.length && cast.every(function (row) { return row && row.fandomApi; });
      return hydrateCatalogImages(cast, { skipWikipedia: allWikipedia });
    });
  }

  function comicRemoteCast(work) {
    if (!sourceKeysForWork(work).comicWork) return Promise.reject(new Error("not comic work"));
    var keys = sourceKeysForWork(work);
    return tryTitleCandidates(keys, function (title) {
      return wikipediaComicCastForTitle(keys, work, title);
    }).catch(function () {
      return wikidataCast(work);
    }).then(function (cast) {
      var allWikipedia = cast.length && cast.every(function (row) { return row && row.source === "Wikipedia"; });
      return hydrateCatalogImages(cast, { fandomSource: fandomSourceForWork(work), skipWikipedia: allWikipedia });
    });
  }

  function jikanCharacterPictures(character) {
    var malId = characterMalId(character);
    if (!malId) return Promise.reject(new Error("no character mal id"));
    return withTimeout(fetch(jikanEndpoint("characters/" + encodeURIComponent(malId) + "/pictures"), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("jikan pictures " + response.status);
        return readResponseJson(response, 9000);
      })
      .then(function (json) { return normalizeJikanPictureRows(json && json.data); });
  }

  function jikanCharacterImageSearch(character) {
    var name = character && (character.latin || character.name);
    if (!name) return Promise.resolve([]);
    return withTimeout(fetch(jikanEndpoint("characters?q=" + encodeURIComponent(name) + "&limit=8&order_by=favorites&sort=desc"), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
      if (!response.ok) throw new Error("jikan character search " + response.status);
      return readResponseJson(response, 9000);
    })
      .then(function (json) {
        var match = bestJikanCharacterMatch(json && json.data, name);
        if (!match) return [];
        var seed = normalizeJikanCharacterImageRows([match]);
        if (!match.mal_id) return seed;
        return jikanCharacterPictures({ mal: match.mal_id }).then(function (urls) {
          return dedupeUrls(seed.concat(urls));
        }).catch(function () {
          return seed;
        });
      });
  }

  function loadImageOptions(character, work) {
    character = character || {};
    var seed = dedupeUrls([character.image, character.img, character.cover]);
    var fandom = fandomImageSource(character, work);
    var chain = characterMalId(character)
      ? jikanCharacterPictures(character).catch(function () { return []; })
      : fandom && fandom.api
        ? fandomCharacterPictures(fandom.api, character)
        : Promise.resolve([]);
    return chain
      .catch(function () { return []; })
      .then(function (urls) { return dedupeUrls(seed.concat(urls)).slice(0, IMAGE_OPTIONS_LIMIT); });
  }

  var bundledCharacterCatalogPromises = {};
  function ensureBundledCharacterCatalogs(work) {
    if (isNormalBook(work)) return Promise.resolve();
    var assets = global.LOREFY_CHARACTER_ASSETS || {};
    var assetKey = isComicWork(work)
      ? "comics"
      : isTextWork(work) ? "literary" : "visual";
    var src = Array.isArray(assets)
      ? assets[assetKey === "visual" ? 0 : assetKey === "literary" ? 1 : 2]
      : assets[assetKey];
    if (!global.document || !src) return Promise.resolve();
    if (bundledCharacterCatalogPromises[src]) return bundledCharacterCatalogPromises[src];
    var resolveAttempt;
    var attempt = new Promise(function (resolve) { resolveAttempt = resolve; });
    bundledCharacterCatalogPromises[src] = attempt;
    var script = null, timer = null, settled = false;
    function finish(failed) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (script) { script.onload = null; script.onerror = null; }
      if (failed) {
        if (bundledCharacterCatalogPromises[src] === attempt) delete bundledCharacterCatalogPromises[src];
        if (script) { try { script.remove(); } catch (e) {} }
      }
      resolveAttempt();
    }
    try {
      var selector = 'script[data-lorefy-character-asset="' + src + '"]';
      if (global.document.querySelector(selector)) { finish(false); return attempt; }
      script = global.document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.lorefyCharacterAsset = src;
      script.onload = function () { finish(false); };
      script.onerror = function () { finish(true); };
      timer = setTimeout(function () { finish(true); }, 10000);
      global.document.head.appendChild(script);
    } catch (e) { finish(true); }
    return attempt;
  }

  function loadCast(work, options) {
    return ensureBundledCharacterCatalogs(work).then(function () {
      return loadCastReady(work, options);
    });
  }

  function loadCastReady(work, options) {
    options = options || {};
    var keys = sourceKeysForWork(work);
    if (keys.excluded) return Promise.resolve([]);
    var fromCatalog = catalogCast(work);
    if (fromCatalog.length && !keys.malId && !keys.anilistId && !keys.comicWork) {
      return keys.textWork || keys.comicWork
        ? hydrateCatalogImages(fromCatalog, { fandomSource: fandomSourceForWork(work) })
          .then(function (cast) { return markCast(cast, true); })
      : Promise.resolve(markCast(fromCatalog, true));
    }
    var cacheEntry = cacheGetEntry(keys.workId);
    var fromCache = cacheEntry && cacheEntry.cast;
    var dynamicCast = keys.malId || keys.anilistId || keys.comicWork;
    var cacheIsComplete = cacheEntry && cacheEntry.complete === true && cacheEntry.completionVersion === CACHE_COMPLETION_VERSION;
    if (fromCache && fromCache.length && (
      !dynamicCast || cacheIsComplete
    )) return keys.textWork || keys.comicWork
      ? hydrateCatalogImages(fromCache, { fandomSource: fandomSourceForWork(work) })
        .then(function (cast) { return markCast(cast, cacheEntry.complete === true); })
      : Promise.resolve(markCast(fromCache, cacheEntry.complete === true));

    var chain;
    var complete = false;
    if (keys.malId) {
      chain = Promise.allSettled([
        anilistCastForWork(keys),
        jikanCast(keys.malId),
        kitsuCastForWork(keys),
        fandomCategoryCast(work)
      ]).then(function (results) {
        var cast = dedupeCast(fromCatalog.concat(fromCache || []).concat(results.reduce(function (all, result) {
          return result.status === "fulfilled" ? all.concat(result.value) : all;
        }, [])));
        if (!cast.length) throw new Error("no character source available");
        complete = results[0].status === "fulfilled" &&
          results[3].status === "fulfilled" && results[3].value.complete === true;
        return cast;
      });
    } else if (keys.anilistId) {
      chain = Promise.allSettled([
        anilistCastForWork(keys),
        kitsuCastForWork(keys),
        fandomCategoryCast(work)
      ]).then(function (results) {
        var cast = dedupeCast(fromCatalog.concat(fromCache || []).concat(results.reduce(function (all, result) {
          return result.status === "fulfilled" ? all.concat(result.value) : all;
        }, [])));
        if (!cast.length) throw new Error("no character source available");
        complete = results[0].status === "fulfilled" &&
          results[2].status === "fulfilled" && results[2].value.complete === true;
        return cast;
      });
    } else if (keys.textWork) {
      chain = literaryRemoteCast(work);
    } else if (keys.comicWork) {
      var comicSeed = dedupeCast(fromCatalog.concat(fromCache || []));
      var hydratedComicSeed = hydrateCatalogImages(comicSeed, { fandomSource: fandomSourceForWork(work) });
      chain = Promise.allSettled([comicRemoteCast(work), fandomCategoryCast(work)]).then(function (results) {
        var remoteCast = dedupeCast(results.reduce(function (all, result) {
          return result.status === "fulfilled" ? all.concat(result.value) : all;
        }, []));
        if (!remoteCast.length) throw new Error("no complete comic character source");
        complete = results[1].status === "fulfilled" && results[1].value.complete === true;
        return hydratedComicSeed.then(function (seedCast) {
          return dedupeCast(seedCast.concat(remoteCast));
        });
      }).catch(function (error) {
        if (!comicSeed.length) throw error;
        complete = false;
        return hydratedComicSeed;
      });
    } else if ((options.allowTitleSearch || !keys.textWork) && keys.title) {
      chain = Promise.allSettled([
        anilistCastForWork(keys),
        kitsuCastForWork(keys),
        fandomCategoryCast(work)
      ]).then(function (results) {
        var cast = dedupeCast(results.reduce(function (all, result) {
          return result.status === "fulfilled" ? all.concat(result.value) : all;
        }, []));
        if (!cast.length) throw new Error("no character source available");
        complete = results[0].status === "fulfilled" &&
          results[2].status === "fulfilled" && results[2].value.complete === true;
        return cast;
      });
    } else {
      chain = Promise.reject(new Error("no supported character source"));
    }

    return chain.then(function (cast) {
      cast = dedupeCast(cast);
      cacheSet(keys.workId, cast, cast[0] && cast[0].source || "remote", complete);
      return markCast(cast, complete);
    });
  }

  function markCast(cast, complete) {
    try {
      Object.defineProperty(cast, "complete", {
        value: complete === true,
        configurable: true,
        enumerable: false
      });
    } catch (e) { cast.complete = complete === true; }
    return cast;
  }

  var nameSearchCache = new Map();
  function characterSearchRows(json) {
    function record(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    var page=json && json.data && json.data.Page;
    if(!record(json) || json.errors && (!Array.isArray(json.errors) || json.errors.length) || !page || !Array.isArray(page.characters))throw new Error('Character search unavailable');
    var rows=page.characters;
    if(rows.some(function(character){
      return !record(character) || !record(character.name) || character.media!=null && (
        !record(character.media) || !Array.isArray(character.media.nodes) || character.media.nodes.some(function(media){return !record(media);})
      );
    }))throw new Error('Character search unavailable');
    return rows;
  }
  function characterMatches(character, query) {
    var normalize=global.LorefyCatalogData && global.LorefyCatalogData.normalizeQuery || function(v){return String(v||'').toLowerCase().trim();};
    return normalize([character.name,character.latin].concat(character.aliases||[]).join(' ')).indexOf(normalize(query))!==-1;
  }
  function cachedCharacterMatches(query, works) {
    var result=[],cache=readCache(),byId=new Map((works||[]).filter(function(w){return !isNormalBook(w);}).map(function(w){return [String(w.id),w];}));
    Object.keys(cache).forEach(function(id){if(!byId.has(id))return;var entry=cache[id],cast=entry&&(!entry.ts||Date.now()-entry.ts<=CACHE_TTL)&&entry.cast;if(cast && cast.some(function(c){return characterMatches(c,query);}))result.push({workId:id,cast:cast});});
    return result;
  }
  async function searchCharacters(query, works, options) {
    options=options||{};
    query=String(query||'').trim().slice(0,100);if(query.length<2)return [];
    var cached=cachedCharacterMatches(query,works),key=query.toLowerCase(),remote=nameSearchCache.get(key);
    if(!remote){
      var request='query($search:String){Page(perPage:50){characters(search:$search,sort:FAVOURITES_DESC){id name{full native alternative} image{large medium} media(type:MANGA,perPage:10){nodes{id idMal title{romaji english native}}}}}}';
      var json=await withTimeout(fetch(catalogEndpoint('anilist','https://graphql.anilist.co'),{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query:request,variables:{search:query}})}).then(function(response){
        if(!response.ok)throw new Error('Character search unavailable');
        return response.json();
      }),10000);
      remote=characterSearchRows(json);nameSearchCache.set(key,remote);
      if(nameSearchCache.size>40)nameSearchCache.delete(nameSearchCache.keys().next().value);
    }
    if(options.active && !options.active())return [];
    var found=new Map(cached.map(function(row){return [row.workId,row];}));
    var byMal=new Map(),byAni=new Map(),byTitle=new Map(),cache=readCache(),changed=false;
    function indexUnique(index,key,work){
      if(!key)return;
      if(!index.has(key))index.set(key,work);
      else if(!index.get(key)||String(index.get(key).id)!==String(work.id))index.set(key,null);
    }
    (works||[]).forEach(function(w){
      var keys=sourceKeysForWork(w);if(keys.excluded)return;
      if(keys.malId)indexUnique(byMal,keys.malId,w);
      if(keys.anilistId)indexUnique(byAni,keys.anilistId,w);
      workTitleCandidates(w).forEach(function(t){indexUnique(byTitle,String(t).toLowerCase(),w);});
    });
    remote.forEach(function(character){(character.media && character.media.nodes || []).forEach(function(media){
      var title=media.title||{},malWork=byMal.get(String(media.idMal)),aniWork=byAni.get(String(media.id));
      if(malWork&&aniWork&&String(malWork.id)!==String(aniWork.id))return;
      var work=malWork||aniWork;
      if(work){
        var keys=sourceKeysForWork(work);
        if(keys.malId&&media.idMal&&keys.malId!==String(media.idMal))return;
        if(keys.anilistId&&media.id&&keys.anilistId!==String(media.id))return;
      }else{
        // A title is only a fallback when it identifies one work without provider IDs.
        var titles=[title.english,title.romaji,title.native],matches=new Map(),ambiguous=false;
        titles.forEach(function(t){
          if(!t)return;var key=String(t).toLowerCase(),candidate=byTitle.get(key);
          if(byTitle.has(key)&&!candidate)ambiguous=true;
          if(candidate)matches.set(String(candidate.id),candidate);
        });
        if(ambiguous||matches.size!==1)return;
        work=matches.values().next().value;
        var fallbackKeys=sourceKeysForWork(work);
        if(fallbackKeys.malId||fallbackKeys.anilistId)return;
      }
      if(!work)return;
      var normalized=normalizeAniListEdges([{node:character}]);normalized.forEach(function(c){c.aliases=[character.name.native].concat(character.name.alternative||[]).filter(Boolean);});
      var id=String(work.id),old=cache[id],cast=dedupeCast((old && old.cast || catalogCast(work)).concat(normalized));
      cache[id]={cast:cast,source:'AniList',complete:!!(old&&old.complete),completionVersion:old&&old.complete?CACHE_COMPLETION_VERSION:0,ts:Date.now()};changed=true;
      found.set(id,{workId:id,cast:cast});
    });});
    if(changed)writeCache(cache);
    return Array.from(found.values());
  }
  global.LorefyCharacterSystem = {
    sourceKeysForWork: sourceKeysForWork,
    characterMatches:characterMatches,
    cachedCharacterMatches:cachedCharacterMatches,
    searchCharacters:searchCharacters,
    normalizeJikanRows: normalizeJikanRows,
    normalizeJikanPictureRows: normalizeJikanPictureRows,
    normalizeJikanCharacterImageRows: normalizeJikanCharacterImageRows,
    normalizeAniListEdges: normalizeAniListEdges,
    dedupeCast: dedupeCast,
    characterMalId: characterMalId,
    loadImageOptions: loadImageOptions,
    fandomCharacterPictures: fandomCharacterPictures,
    commonsCharacterPictures: commonsCharacterPictures,
    castLooksFullForMal: castLooksFullForMal,
    needsRemoteRefresh: needsRemoteRefresh,
    catalogCast: catalogCast,
    loadCast: loadCast,
    jikanCast: jikanCast,
    anilistCastByMal: anilistCastByMal,
    kitsuCastForWork: kitsuCastForWork,
    fandomCategoryCast: fandomCategoryCast,
    anilistCastById: anilistCastById,
    anilistCastByTitle: anilistCastByTitle,
    wikidataCast: wikidataCast,
    wikipediaCast: wikipediaCast,
    literaryRemoteCast: literaryRemoteCast,
    comicRemoteCast: comicRemoteCast,
    isNormalBook: isNormalBook,
    isTextWork: isTextWork,
    isComicWork: isComicWork
  };
})(window);

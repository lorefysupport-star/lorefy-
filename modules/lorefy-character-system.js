(function (global) {
  "use strict";

  var BOOK_AR = "\u0643\u062A\u0627\u0628";
  var ROLE_MAIN = "\u0631\u0626\u064a\u0633\u064a\u0629";
  var ROLE_SUPPORT = "\u0645\u0633\u0627\u0639\u062f\u0629";
  // v3 invalidates cached literary casts that were saved without images.
  // v6 invalidates casts resolved before Unicode-native title verification.
  // v7 invalidates legacy 25-row entries that were incorrectly marked complete.
  var CACHE_KEY = "lorefy.characterCastCache.v7";
  var CACHE_TTL = 1000 * 60 * 60 * 24 * 30;
  // Keep the complete literary cast discoverable, while hydrating images with
  // bounded concurrency so a large work does not freeze the first paint.
  var MAX_LITERARY_CAST = 300;
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
      textWork: isTextWork(work)
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
    return asArray(cast).filter(function (c) {
      var canonicalName = String(c.latin || c.name || "")
        .replace(/\b(mr|mrs|ms|miss|dr|professor|lord|lady|sir|dame|king|queen|prince|princess)\.?\s+/ig, "")
        .replace(/["']/g, "");
      var key = c.key || slug(canonicalName || c.id);
      var canonical = slug(canonicalName || key);
      if (!key || seen[key]) return false;
      if (canonical && seen[canonical]) return false;
      seen[key] = true;
      if (canonical) seen[canonical] = true;
      c.key = key;
      return true;
    });
  }

  function castLooksFullForMal(cast) {
    cast = asArray(cast);
    return cast.length >= 100;
  }

  function needsRemoteRefresh(work, cast) {
    var keys = sourceKeysForWork(work);
    var cached = cacheGetEntry(keys.workId);
    var current = asArray(cast).length ? asArray(cast) : catalogCast(work);
    // The bundled catalog stores 25-row previews for several source families.
    // A complete cached cast is the only local signal that a 25-row result is final.
    if (keys.malId || keys.anilistId || !keys.textWork) {
      return current.length <= 25 && !(cached && cached.complete === true);
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
    if (keys.malId) ids.push("mal:" + keys.malId);
    if (keys.anilistId) ids.push("anilist:" + keys.anilistId);
    asArray(keys.titleCandidates).forEach(function (title) {
      ids.push(titleCatalogKey(title));
    });
    return dedupeCast(
      catalogLookup(catalog, ids)
        .concat(catalogLookup(literary, ids))
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

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function retryDelay(response, attempt) {
    var retryAfter = 0;
    try { retryAfter = Number(response && response.headers && response.headers.get("retry-after")) * 1000; } catch (e) {}
    if (retryAfter > 0) return Math.min(retryAfter, 10000);
    return 1400 * Math.pow(2, attempt);
  }

  function anilistEndpoint() {
    try {
      var config = global && global.LOREFY_REMOTE_CATALOG;
      var base = String(config && config.proxyBaseUrl || "").replace(/^\/+|\/+$/g, "");
      var origin = global && global.location && global.location.origin;
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

  function jikanCast(malId) {
    if (!malId) return Promise.reject(new Error("no mal id"));
    return withTimeout(fetch("https://api.jikan.moe/v4/manga/" + encodeURIComponent(malId) + "/characters", {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("jikan " + response.status);
        return response.json();
      })
      .then(function (json) {
        var cast = normalizeJikanRows(json && json.data);
        if (!cast.length) throw new Error("empty jikan cast");
        return cast;
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
        return response.json();
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
        if (!hasNext(pageInfo, currentPage) || currentPage >= MAX_PAGES) {
          return Promise.resolve(dedupeCast([].concat.apply([], pages)));
        }
        var requestedPage = currentPage + 1;
        return wait(ANILIST_PAGE_PACE_MS)
          .then(function () {
            return anilistCastPage(query, Object.assign({}, variables || {}, { page: requestedPage, perPage: ANILIST_CHARACTER_PAGE_SIZE }));
          })
          .then(function (result) {
            // AniList can revise its character total while pages are fetched.
            // Treat the newest pageInfo as authoritative and keep completed rows.
            if (!result.cast.length) return dedupeCast([].concat.apply([], pages));
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
        if (/anilist (?:429|5\d\d)|timeout/i.test(String(error && error.message || error))) throw error;
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
      if (!key || seen[key] || !looksLikeLiteraryCharacter(target, name, work)) continue;
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
    var titles = cast.map(function (c) { return c.wikiTitle; }).filter(Boolean).slice(0, MAX_LITERARY_CAST);
    if (!titles.length) return Promise.resolve(cast);
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
      return withTimeout(fetch("https://en.wikipedia.org/w/api.php?" + params.toString(), {
        headers: { Accept: "application/json" }
      }), 9000)
        .then(function (response) {
          if (!response.ok) throw new Error("wikipedia images " + response.status);
          return response.json();
        });
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
          Object.keys(entityByTitle).forEach(function (title) {
            var entity = entities[entityByTitle[title]] || {};
            var description = entity.descriptions && entity.descriptions.en && entity.descriptions.en.value || "";
            var image = commonsFileUrl(wikidataClaimString(entity, "P18"));
            if (image && (!description || /character|fictional|protagonist|antagonist|legendary|mythical|literary|demigod/i.test(description))) {
              byTitle[title] = byTitle[title] || image;
            }
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
          return response.json();
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
    return withTimeout(fetch("https://commons.wikimedia.org/w/api.php?" + params.toString(), {
      headers: { Accept: "application/json" }
    }), 7000)
      .then(function (response) {
        if (!response.ok) throw new Error("commons images " + response.status);
        return response.json();
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
      ? applyFandomImages(options.fandomSource.api, prepared)
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
    return withTimeout(fetch("https://www.wikidata.org/w/api.php?" + params.toString(), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("wikidata " + response.status);
        return response.json();
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
    var query = [title, keys.author, "novel"].filter(Boolean).join(" ");
    if (!title) return Promise.reject(new Error("no title"));
    var params = new URLSearchParams();
    params.set("action", "query");
    params.set("list", "search");
    params.set("format", "json");
    params.set("origin", "*");
    params.set("srlimit", "6");
    params.set("srsearch", query);
    return withTimeout(fetch("https://en.wikipedia.org/w/api.php?" + params.toString(), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("wikipedia search " + response.status);
        return response.json();
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
    return withTimeout(fetch("https://en.wikipedia.org/w/api.php?" + params.toString(), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("wikipedia character search " + response.status);
        return response.json();
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

  function wikipediaCastPage(page, work, allowWholePage) {
    var params = new URLSearchParams();
    params.set("action", "parse");
    params.set("page", page);
    params.set("prop", "wikitext");
    params.set("format", "json");
    params.set("origin", "*");
    return withTimeout(fetch("https://en.wikipedia.org/w/api.php?" + params.toString(), {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("wikipedia parse " + response.status);
        return response.json();
      })
      .then(function (json) {
        var text = (((json.parse || {}).wikitext || {})["*"]) || "";
        var characterSection = extractWikiSection(text, "Characters?");
        var plotSection = extractWikiSection(text, "Plot(?: summary)?") || extractWikiSection(text, "Synopsis");
        var source = characterSection + "\n" + plotSection;
        if (!source.trim() && allowWholePage) source = text;
        return dedupeCast(linkCandidatesFromWikitext(source, work, MAX_LITERARY_CAST)).slice(0, MAX_LITERARY_CAST);
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
        return response.json();
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

  function jikanCharacterPictures(character) {
    var malId = characterMalId(character);
    if (!malId) return Promise.reject(new Error("no character mal id"));
    return withTimeout(fetch("https://api.jikan.moe/v4/characters/" + encodeURIComponent(malId) + "/pictures", {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
        if (!response.ok) throw new Error("jikan pictures " + response.status);
        return response.json();
      })
      .then(function (json) { return normalizeJikanPictureRows(json && json.data); });
  }

  function jikanCharacterImageSearch(character) {
    var name = character && (character.latin || character.name);
    if (!name) return Promise.resolve([]);
    return withTimeout(fetch("https://api.jikan.moe/v4/characters?q=" + encodeURIComponent(name) + "&limit=8&order_by=favorites&sort=desc", {
      headers: { Accept: "application/json" }
    }), 9000)
      .then(function (response) {
      if (!response.ok) throw new Error("jikan character search " + response.status);
      return response.json();
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

  function loadImageOptions(character) {
    character = character || {};
    var seed = dedupeUrls([character.image, character.img, character.cover]);
    var chain = characterMalId(character)
      ? jikanCharacterPictures(character).catch(function () { return jikanCharacterImageSearch(character); })
      : commonsCharacterPictures(character);
    return chain
      .catch(function () { return []; })
      .then(function (urls) { return dedupeUrls(seed.concat(urls)).slice(0, IMAGE_OPTIONS_LIMIT); });
  }

  function loadCast(work, options) {
    options = options || {};
    var keys = sourceKeysForWork(work);
    if (keys.excluded) return Promise.resolve([]);
    var fromCatalog = catalogCast(work);
    if ((keys.malId || keys.anilistId) && castLooksFullForMal(fromCatalog)) return Promise.resolve(markCast(fromCatalog, true));
    if (fromCatalog.length && !keys.malId && !keys.anilistId) {
      return keys.textWork
        ? hydrateCatalogImages(fromCatalog, { fandomSource: FANDOM_CHARACTER_SOURCES[keys.workId] })
      : Promise.resolve(markCast(fromCatalog, true));
    }
    var cacheEntry = cacheGetEntry(keys.workId);
    var fromCache = cacheEntry && cacheEntry.cast;
    if (fromCache && fromCache.length && (
      (!keys.malId && !keys.anilistId) || cacheEntry.complete === true
    )) return keys.textWork
      ? hydrateCatalogImages(fromCache, { fandomSource: FANDOM_CHARACTER_SOURCES[keys.workId] })
      : Promise.resolve(markCast(fromCache, cacheEntry.complete === true));

    var chain;
    var complete = false;
    if (keys.malId) {
      chain = anilistCastForWork(keys).then(function (cast) {
        complete = true;
        return cast;
      }).catch(function () {
        return jikanCast(keys.malId).then(function (cast) {
          complete = true;
          return cast;
        }).catch(function () {
          if (fromCatalog.length) return fromCatalog;
          if (fromCache && fromCache.length) return fromCache;
          throw new Error("no character source available");
        });
      });
    } else if (keys.anilistId) {
      chain = anilistCastForWork(keys).then(function (cast) { complete = true; return cast; });
    } else if (keys.textWork) {
      chain = literaryRemoteCast(work);
    } else if ((options.allowTitleSearch || !keys.textWork) && keys.title) {
      chain = anilistCastForWork(keys).then(function (cast) { complete = true; return cast; });
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

  global.LorefyCharacterSystem = {
    sourceKeysForWork: sourceKeysForWork,
    normalizeJikanRows: normalizeJikanRows,
    normalizeJikanPictureRows: normalizeJikanPictureRows,
    normalizeJikanCharacterImageRows: normalizeJikanCharacterImageRows,
    normalizeAniListEdges: normalizeAniListEdges,
    dedupeCast: dedupeCast,
    characterMalId: characterMalId,
    loadImageOptions: loadImageOptions,
    commonsCharacterPictures: commonsCharacterPictures,
    castLooksFullForMal: castLooksFullForMal,
    needsRemoteRefresh: needsRemoteRefresh,
    catalogCast: catalogCast,
    loadCast: loadCast,
    jikanCast: jikanCast,
    anilistCastByMal: anilistCastByMal,
    anilistCastById: anilistCastById,
    anilistCastByTitle: anilistCastByTitle,
    wikidataCast: wikidataCast,
    wikipediaCast: wikipediaCast,
    literaryRemoteCast: literaryRemoteCast,
    isNormalBook: isNormalBook,
    isTextWork: isTextWork
  };
})(window);

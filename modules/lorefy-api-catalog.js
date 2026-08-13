(function (global) {
  "use strict";

  var CACHE_KEY = "lorefy.api.catalog.cache.v2";
  var STATE_KEY = "lorefy.api.catalog.state.v2";
  var DAY_MS = 1000 * 60 * 60 * 24;
  var DEFAULT_TTL_MS = DAY_MS * 14;
  var DEFAULT_PER_PAGE = 50;
  var DEFAULT_EXPANSION_TARGET = 500;
  var DEFAULT_EXPANSION_PAGE_SIZE = 100;
  var MAX_CACHED_WORKS = 6000;
  var SEARCH_DEBOUNCE_MS = 650;

  var TYPES = {
    manga: "مانجا",
    manhwa: "مانهوا",
    manhua: "مانهوا صينية",
    webNovel: "ويب نوفل",
    novel: "رواية",
    lightNovel: "لايت نوفل",
    book: "كتاب",
    comics: "كوميكس"
  };

  var TYPE_ALIASES = {
    "manga": TYPES.manga,
    "مانجا": TYPES.manga,
    "manhwa": TYPES.manhwa,
    "مانهوا": TYPES.manhwa,
    "manhua": TYPES.manhua,
    "مانهوا صينية": TYPES.manhua,
    "مانهوا صيني": TYPES.manhua,
    "chinese manhua": TYPES.manhua,
    "web novel": TYPES.webNovel,
    "web novels": TYPES.webNovel,
    "ويب نوفل": TYPES.webNovel,
    "رواية ويب": TYPES.webNovel,
    "novel": TYPES.novel,
    "novels": TYPES.novel,
    "رواية": TYPES.novel,
    "روايات": TYPES.novel,
    "light novel": TYPES.lightNovel,
    "light novels": TYPES.lightNovel,
    "لايت نوفل": TYPES.lightNovel,
    "روايات خفيفة": TYPES.lightNovel,
    "book": TYPES.book,
    "books": TYPES.book,
    "كتاب": TYPES.book,
    "كتب": TYPES.book,
    "comic": TYPES.comics,
    "comics": TYPES.comics,
    "كوميكس": TYPES.comics
  };

  var TYPE_CONFIG = {};
  TYPE_CONFIG[TYPES.manga] = {
    providers: ["anilist", "mangaDex"],
    anilist: { country: "JP", formats: ["MANGA"] },
    mangaDex: { originalLanguages: ["ja"] },
    seeds: ["manga", "shounen manga", "seinen manga"]
  };
  TYPE_CONFIG[TYPES.manhwa] = {
    providers: ["anilist", "mangaDex"],
    anilist: { country: "KR", formats: ["MANGA"] },
    mangaDex: { originalLanguages: ["ko"] },
    seeds: ["manhwa", "webtoon", "korean comic"]
  };
  TYPE_CONFIG[TYPES.manhua] = {
    providers: ["anilist", "mangaDex"],
    anilist: { country: "CN", formats: ["MANGA"] },
    mangaDex: { originalLanguages: ["zh", "zh-hk"] },
    seeds: ["manhua", "chinese comic"]
  };
  TYPE_CONFIG[TYPES.lightNovel] = {
    providers: ["anilist", "openLibrary", "googleBooks"],
    anilist: { country: "JP", formats: ["NOVEL"] },
    seeds: ["light novel", "japanese light novel"]
  };
  TYPE_CONFIG[TYPES.webNovel] = {
    providers: ["anilist", "openLibrary", "googleBooks"],
    anilist: { formats: ["NOVEL"] },
    seeds: ["web novel", "web fiction", "online fiction"]
  };
  TYPE_CONFIG[TYPES.novel] = {
    providers: ["openLibrary", "googleBooks"],
    seeds: ["fiction novel", "literary fiction", "fantasy novel"]
  };
  TYPE_CONFIG[TYPES.book] = {
    providers: ["openLibrary", "googleBooks"],
    seeds: ["nonfiction", "science history philosophy", "popular books"]
  };
  TYPE_CONFIG[TYPES.comics] = {
    providers: ["openLibrary", "googleBooks", "mangaDex"],
    mangaDex: { originalLanguages: ["en"] },
    seeds: ["comics", "comic books", "graphic novel"]
  };

  function config() {
    return Object.assign({
      enabled: true,
      autoSearch: true,
      autoWarmCurrentType: true,
      warmAllTypes: false,
      warmDelayMs: 900,
      cacheTtlMs: DEFAULT_TTL_MS,
      perPage: DEFAULT_PER_PAGE,
      minimumNewWorksPerType: DEFAULT_EXPANSION_TARGET,
      expandedPageSize: DEFAULT_EXPANSION_PAGE_SIZE,
      pagesPerWarmType: 1,
      maxCachedWorks: MAX_CACHED_WORKS,
      providers: {}
    }, global.LOREFY_REMOTE_CATALOG || {});
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

  function nowIso() {
    return new Date().toISOString();
  }

  function data() {
    if (!Array.isArray(global.LorefyMangaData)) global.LorefyMangaData = [];
    return global.LorefyMangaData;
  }

  var duplicateIndex = null;
  var duplicateIndexSize = -1;

  function catalogTitleKey(work) {
    return canonical(work && work.title) + "|" + normalizeType(work && work.type);
  }

  function rebuildDuplicateIndex() {
    var ids = new Set();
    var titles = new Map();
    var items = data();
    items.forEach(function (work) {
      if (!work || !work.id) return;
      ids.add(String(work.id));
      var key = catalogTitleKey(work);
      if (!titles.has(key)) titles.set(key, []);
      titles.get(key).push(work);
    });
    duplicateIndex = { ids: ids, titles: titles };
    duplicateIndexSize = items.length;
    return duplicateIndex;
  }

  function currentDuplicateIndex() {
    if (!duplicateIndex || duplicateIndexSize !== data().length) return rebuildDuplicateIndex();
    return duplicateIndex;
  }

  function rememberDuplicateWorks(works) {
    if (!duplicateIndex) return;
    (works || []).forEach(function (work) {
      if (!work || !work.id) return;
      duplicateIndex.ids.add(String(work.id));
      var key = catalogTitleKey(work);
      if (!duplicateIndex.titles.has(key)) duplicateIndex.titles.set(key, []);
      duplicateIndex.titles.get(key).push(work);
    });
    duplicateIndexSize = data().length;
  }

  function normalizeSpaces(value) {
    return String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  }

  function canonical(value) {
    return normalizeSpaces(value).toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
  }

  function slug(value) {
    var text = canonical(value).replace(/[\u0600-\u06ff]+/g, "").trim();
    return (text || "work").replace(/\s+/g, "-").slice(0, 64);
  }

  function normalizeType(value) {
    var key = canonical(value);
    return TYPE_ALIASES[key] || TYPE_ALIASES[String(value || "").trim()] || TYPES.manga;
  }

  function typeConfig(type) {
    return TYPE_CONFIG[normalizeType(type)] || TYPE_CONFIG[TYPES.manga];
  }

  function ensureHttps(url) {
    url = String(url || "").trim();
    return /^http:\/\//i.test(url) ? url.replace(/^http:\/\//i, "https://") : url;
  }

  function clampRating(value) {
    value = Number(value);
    if (!Number.isFinite(value) || value <= 0) return 3.8;
    if (value > 10) value = value / 20;
    else if (value > 5) value = value / 2;
    return Math.max(1, Math.min(5, Math.round(value * 10) / 10));
  }

  function scoreFields(rating, type) {
    var r = clampRating(rating);
    var textType = [TYPES.webNovel, TYPES.novel, TYPES.lightNovel, TYPES.book].includes(type);
    return {
      story: Math.min(5, Math.round((r + 0.1) * 10) / 10),
      art: textType ? Math.min(5, Math.round((r + 0.05) * 10) / 10) : r,
      trans: r,
      chars: r,
      world: Math.min(5, Math.round((r + 0.1) * 10) / 10)
    };
  }

  function statusFromAniList(status) {
    status = String(status || "").toUpperCase();
    if (status === "FINISHED") return "مكتملة";
    if (status === "RELEASING") return "مستمرة";
    if (status === "NOT_YET_RELEASED") return "قادمة";
    if (status === "HIATUS" || status === "CANCELLED") return "متوقفة";
    return "مستوردة";
  }

  function statusFromMangaDex(status) {
    status = String(status || "").toLowerCase();
    if (status === "completed") return "مكتملة";
    if (status === "ongoing") return "مستمرة";
    if (status === "hiatus" || status === "cancelled") return "متوقفة";
    return "مستوردة";
  }

  function typeFromAniList(media, requestedType) {
    var requested = normalizeType(requestedType);
    var format = String(media && media.format || "").toUpperCase();
    var country = String(media && media.countryOfOrigin || "").toUpperCase();
    if (format === "NOVEL") return requested === TYPES.lightNovel || requested === TYPES.webNovel || requested === TYPES.novel ? requested : TYPES.lightNovel;
    if (country === "KR") return TYPES.manhwa;
    if (country === "CN" || country === "TW" || country === "HK") return TYPES.manhua;
    return requested === TYPES.comics ? TYPES.comics : TYPES.manga;
  }

  function typeFromMangaDex(item, requestedType) {
    var requested = normalizeType(requestedType);
    var lang = String(item && item.attributes && item.attributes.originalLanguage || "").toLowerCase();
    if (lang === "ko") return TYPES.manhwa;
    if (lang === "zh" || lang === "zh-hk") return TYPES.manhua;
    if (lang === "en" && requested === TYPES.comics) return TYPES.comics;
    return requested === TYPES.comics ? TYPES.comics : TYPES.manga;
  }

  function firstTitle(title) {
    if (!title || typeof title !== "object") return normalizeSpaces(title);
    return normalizeSpaces(title.english || title.romaji || title.en || title.ja_ro || title.native || Object.values(title)[0]);
  }

  function altTitle(altTitles) {
    if (!Array.isArray(altTitles)) return "";
    for (var i = 0; i < altTitles.length; i++) {
      var title = firstTitle(altTitles[i]);
      if (title) return title;
    }
    return "";
  }

  function sourceLine(source, title, type) {
    return "عمل مستورد من " + source + " ضمن مكتبة " + type + ": " + title + ".";
  }

  function finishWork(work, source, sourceId) {
    var type = normalizeType(work.type);
    var rating = clampRating(work.r);
    var pop = Math.max(1, Number(work.pop) || Number(work.baseRatings) || Number(work.listAdds) || 100);
    return Object.assign({
      ar: work.title,
      cover: "",
      coverMode: "external",
      sourceCoverUrl: "",
      r: rating,
      rSrc: source,
      st: "مستوردة",
      ch: 0,
      vol: 0,
      pl: source,
      type: type,
      synopsis: sourceLine(source, work.title, type),
      rec: false,
      sc: scoreFields(rating, type),
      prog: { ch: 0 },
      mySt: null,
      pop: pop,
      related: [],
      banner: "",
      baseRatings: Math.max(1, Number(work.baseRatings) || Math.round(pop / 4)),
      baseReviews: Math.max(0, Number(work.baseReviews) || Math.round(pop / 40)),
      weeklyReads: Math.max(0, Number(work.weeklyReads) || Math.round(pop / 10)),
      listAdds: Math.max(0, Number(work.listAdds) || Math.round(pop / 20)),
      genres: [],
      coverImage: "",
      _apiDynamic: true,
      _apiSource: source,
      _apiSourceId: String(sourceId || ""),
      _apiFetchedAt: nowIso()
    }, work);
  }

  function mapAniList(media, requestedType) {
    if (!media || !media.id) return null;
    var title = firstTitle(media.title);
    if (!title) return null;
    var type = typeFromAniList(media, requestedType);
    if (requestedType && normalizeType(requestedType) !== type && normalizeType(requestedType) !== TYPES.manga) return null;
    var author = "";
    try {
      author = media.staff && media.staff.nodes && media.staff.nodes[0] && media.staff.nodes[0].name && media.staff.nodes[0].name.full || "";
    } catch (e) {}
    var rating = clampRating(media.averageScore || 76);
    var pop = Number(media.popularity) || Number(media.favourites) || 100;
    return finishWork({
      id: "api-anilist-" + media.id + "-" + slug(title),
      malId: media.idMal || null,
      anilistId: media.id,
      title: title,
      ar: firstTitle({ english: media.title && media.title.native }) || title,
      auth: author,
      yr: media.startDate && media.startDate.year || 0,
      sourceCoverUrl: ensureHttps(media.coverImage && (media.coverImage.large || media.coverImage.medium)),
      r: rating,
      st: statusFromAniList(media.status),
      ch: Number(media.chapters) || 0,
      vol: Number(media.volumes) || 0,
      type: type,
      synopsis: normalizeSpaces(media.description) || sourceLine("AniList", title, type),
      pop: pop,
      baseRatings: Number(media.popularity) || pop,
      baseReviews: Number(media.favourites) || Math.round(pop / 30),
      genres: Array.isArray(media.genres) ? media.genres.slice(0, 8) : []
    }, "AniList", media.id);
  }

  function mapOpenLibrary(doc, requestedType) {
    if (!doc || !doc.key || !doc.title) return null;
    var olid = String(doc.key).split("/").pop();
    var type = normalizeType(requestedType || TYPES.book);
    var cover = doc.cover_i ? "https://covers.openlibrary.org/b/id/" + doc.cover_i + "-L.jpg" : "";
    var subjects = Array.isArray(doc.subject) ? doc.subject.slice(0, 8) : [];
    var rating = clampRating(doc.ratings_average || 3.8);
    var pop = Number(doc.want_to_read_count) || Number(doc.ratings_count) || Number(doc.edition_count) || 100;
    return finishWork({
      id: "ol-" + olid,
      title: normalizeSpaces(doc.title),
      ar: normalizeSpaces(doc.title),
      auth: Array.isArray(doc.author_name) ? doc.author_name.slice(0, 2).join(", ") : "",
      yr: Number(doc.first_publish_year) || 0,
      sourceCoverUrl: cover,
      r: rating,
      st: "مكتملة",
      ch: 0,
      vol: Number(doc.edition_count) || 0,
      pages: Number(doc.number_of_pages_median) || 0,
      type: type,
      synopsis: "«" + normalizeSpaces(doc.title) + "» من Open Library" + (subjects.length ? " ضمن: " + subjects.slice(0, 3).join("، ") : "") + ".",
      pop: pop,
      baseRatings: Number(doc.ratings_count) || Math.max(1, Math.round(pop / 4)),
      genres: subjects
    }, "Open Library", olid);
  }

  function mapGoogleBook(item, requestedType) {
    if (!item || !item.id || !item.volumeInfo || !item.volumeInfo.title) return null;
    var info = item.volumeInfo;
    var type = normalizeType(requestedType || TYPES.book);
    var image = info.imageLinks && (info.imageLinks.extraLarge || info.imageLinks.large || info.imageLinks.medium || info.imageLinks.thumbnail || info.imageLinks.smallThumbnail);
    var year = String(info.publishedDate || "").match(/\d{4}/);
    var rating = clampRating(info.averageRating || 3.8);
    var pop = Number(info.ratingsCount) || 100;
    return finishWork({
      id: "gb-" + item.id,
      title: normalizeSpaces(info.title),
      ar: normalizeSpaces(info.title),
      auth: Array.isArray(info.authors) ? info.authors.slice(0, 2).join(", ") : "",
      yr: year ? Number(year[0]) : 0,
      sourceCoverUrl: ensureHttps(image),
      r: rating,
      st: "مكتملة",
      ch: 0,
      vol: 0,
      pages: Number(info.pageCount) || 0,
      type: type,
      synopsis: normalizeSpaces(info.description) || sourceLine("Google Books", info.title, type),
      pop: pop,
      baseRatings: Number(info.ratingsCount) || Math.max(1, Math.round(pop / 4)),
      genres: Array.isArray(info.categories) ? info.categories.slice(0, 8) : []
    }, "Google Books", item.id);
  }

  function mapMangaDex(item, requestedType) {
    if (!item || !item.id || !item.attributes) return null;
    var attrs = item.attributes;
    var title = firstTitle(attrs.title) || altTitle(attrs.altTitles);
    if (!title) return null;
    var type = typeFromMangaDex(item, requestedType);
    var coverRel = Array.isArray(item.relationships) ? item.relationships.find(function (rel) { return rel.type === "cover_art" && rel.attributes && rel.attributes.fileName; }) : null;
    var cover = coverRel ? "https://uploads.mangadex.org/covers/" + item.id + "/" + coverRel.attributes.fileName + ".512.jpg" : "";
    var tags = Array.isArray(attrs.tags) ? attrs.tags.map(function (tag) {
      return tag && tag.attributes && firstTitle(tag.attributes.name);
    }).filter(Boolean).slice(0, 8) : [];
    return finishWork({
      id: "md-" + item.id,
      title: title,
      ar: altTitle(attrs.altTitles) || title,
      auth: "",
      yr: Number(attrs.year) || 0,
      sourceCoverUrl: cover,
      r: 3.9,
      st: statusFromMangaDex(attrs.status),
      ch: Number(attrs.lastChapter) || 0,
      vol: Number(attrs.lastVolume) || 0,
      type: type,
      synopsis: firstTitle(attrs.description) || sourceLine("MangaDex", title, type),
      pop: 800,
      genres: tags
    }, "MangaDex", item.id);
  }

  function isDuplicate(work) {
    if (!work || !work.id) return true;
    var index = currentDuplicateIndex();
    var id = String(work.id);
    if (index.ids.has(id)) return true;
    var matches = index.titles.get(catalogTitleKey(work)) || [];
    return matches.some(function (item) {
      if (global.LorefyCatalogIdentity && typeof global.LorefyCatalogIdentity.sameWork === "function") {
        return global.LorefyCatalogIdentity.sameWork(item, work, global.LorefyCatalogAliases || {});
      }
      return String(item && item.id) === id;
    });
  }

  function uniqueWorks(works) {
    if (global.LorefyCatalogIdentity && typeof global.LorefyCatalogIdentity.uniqueWorks === "function") {
      return global.LorefyCatalogIdentity.uniqueWorks(works, {
        aliases: global.LorefyCatalogAliases || (global.LorefyCatalogAliases = {})
      });
    }
    var seenIds = new Set();
    var seenTitles = new Set();
    return (Array.isArray(works) ? works : []).filter(function (work) {
      if (!work || !work.id || !work.title) return false;
      var id = String(work.id);
      var titleKey = canonical(work.title) + "|" + normalizeType(work.type);
      if (seenIds.has(id) || seenTitles.has(titleKey)) return false;
      seenIds.add(id);
      seenTitles.add(titleKey);
      return true;
    });
  }

  function cache() {
    var cached = read(CACHE_KEY, null);
    if (!cached || typeof cached !== "object" || Array.isArray(cached)) cached = {};
    cached.version = 1;
    cached.works = Array.isArray(cached.works) ? cached.works : [];
    cached.batches = cached.batches && typeof cached.batches === "object" ? cached.batches : {};
    return cached;
  }

  function saveCache(cached) {
    var cfg = config();
    var max = Number(cfg.maxCachedWorks) || MAX_CACHED_WORKS;
    cached.works = uniqueWorks(cached.works).slice(-max);
    cached.updatedAt = nowIso();
    write(CACHE_KEY, cached);
  }

  function batchKey(kind, type, query, providers, page) {
    return [kind, normalizeType(type), canonical(query || ""), (providers || []).join("+"), page || 1].join("|");
  }

  function cachedBatch(key) {
    var cfg = config();
    var ttl = Number(cfg.cacheTtlMs) || DEFAULT_TTL_MS;
    var cached = cache();
    var batch = cached.batches[key];
    if (!batch || !Array.isArray(batch.ids) || Date.now() - Date.parse(batch.at || "0") > ttl) return null;
    var byId = new Map(cached.works.map(function (work) { return [String(work.id), work]; }));
    return batch.ids.map(function (id) { return byId.get(String(id)); }).filter(Boolean);
  }

  function rememberBatch(key, works) {
    var cached = cache();
    var byId = new Map(cached.works.map(function (work) { return [String(work.id), work]; }));
    uniqueWorks(works).forEach(function (work) { byId.set(String(work.id), work); });
    cached.works = Array.from(byId.values());
    cached.batches[key] = { at: nowIso(), ids: uniqueWorks(works).map(function (work) { return String(work.id); }) };
    saveCache(cached);
  }

  function applyWorks(works, meta) {
    var candidates = uniqueWorks(works).filter(function (work) { return !isDuplicate(work); });
    var summary;
    if (global.LorefyCatalogUpdater && typeof global.LorefyCatalogUpdater.applyDelta === "function") {
      summary = global.LorefyCatalogUpdater.applyDelta({
        schema: 1,
        version: "api-" + Date.now(),
        generatedAt: nowIso(),
        upserts: candidates
      }, { cache: false, refresh: true, canonicalize: false });
    } else {
      Array.prototype.push.apply(data(), candidates);
      try { if (typeof global.__lorefyIngest === "function") global.__lorefyIngest(); } catch (e) {}
      try { if (typeof global.__lorefyRefresh === "function") global.__lorefyRefresh(); } catch (e) {}
      summary = { added: candidates.length, updatedWorks: 0, removed: 0, aliases: 0 };
    }
    rememberDuplicateWorks(candidates);
    write(STATE_KEY, Object.assign({}, state(), {
      status: "ready",
      checkedAt: nowIso(),
      lastType: meta && meta.type || "",
      lastQuery: meta && meta.query || "",
      lastAdded: candidates.length,
      cachedWorks: cache().works.length
    }));
    return Object.assign({ added: candidates.length, works: candidates }, summary || {});
  }

  function headers() {
    return { Accept: "application/json" };
  }

  function fetchJson(url, options) {
    return global.fetch(url, Object.assign({ cache: "no-store", headers: headers() }, options || {})).then(function (response) {
      if (!response.ok) throw new Error("api catalog fetch " + response.status);
      return response.json();
    });
  }

  function enabledProvider(name) {
    var providerConfig = config().providers || {};
    return providerConfig[name] !== false;
  }

  function proxyBase() {
    var base = String(config().proxyBaseUrl || "").trim();
    return base ? base.replace(/\/+$/, "") : "";
  }

  function providerUrl(provider, directBase, params) {
    var query = params ? params.toString() : "";
    var base = proxyBase();
    if (base) return base + "/" + provider + (query ? "?" + query : "");
    return directBase + (query ? "?" + query : "");
  }

  function providerPostUrl(provider, directUrl) {
    var base = proxyBase();
    return base ? base + "/" + provider : directUrl;
  }

  function fetchAniList(query, type, page, perPage) {
    if (!enabledProvider("anilist")) return Promise.resolve([]);
    var cfg = typeConfig(type).anilist || {};
    var variables = {
      page: page || 1,
      perPage: perPage || config().perPage || DEFAULT_PER_PAGE,
      search: query || null,
      country: cfg.country || null,
      formats: cfg.formats || ["MANGA"],
      sort: query ? ["SEARCH_MATCH", "POPULARITY_DESC"] : ["POPULARITY_DESC", "SCORE_DESC"]
    };
    var queryText = [
      "query LorefyCatalog($page:Int,$perPage:Int,$search:String,$country:CountryCode,$formats:[MediaFormat],$sort:[MediaSort]){",
      "Page(page:$page,perPage:$perPage){media(type:MANGA,search:$search,countryOfOrigin:$country,format_in:$formats,sort:$sort){",
      "id idMal title{romaji english native} coverImage{large medium} averageScore popularity favourites chapters volumes status format countryOfOrigin genres description(asHtml:false) startDate{year}",
      "staff(sort:RELEVANCE,perPage:2){nodes{name{full}}}",
      "}}}"
    ].join("");
    return fetchJson(providerPostUrl("anilist", "https://graphql.anilist.co"), {
      method: "POST",
      headers: Object.assign(headers(), { "Content-Type": "application/json" }),
      body: JSON.stringify({ query: queryText, variables: variables })
    }).then(function (json) {
      var media = json && json.data && json.data.Page && json.data.Page.media || [];
      return media.map(function (item) { return mapAniList(item, type); }).filter(Boolean);
    });
  }

  function fetchOpenLibrary(query, type, page, perPage) {
    if (!enabledProvider("openLibrary")) return Promise.resolve([]);
    var q = query || (typeConfig(type).seeds || ["fiction"])[0];
    var params = new URLSearchParams();
    params.set("q", q);
    params.set("page", String(page || 1));
    params.set("limit", String(Math.min(100, perPage || config().perPage || DEFAULT_PER_PAGE)));
    params.set("fields", "key,title,author_name,first_publish_year,cover_i,subject,ratings_average,ratings_count,want_to_read_count,edition_count,number_of_pages_median");
    return fetchJson(providerUrl("openlibrary", "https://openlibrary.org/search.json", params)).then(function (json) {
      return (json && json.docs || []).map(function (doc) { return mapOpenLibrary(doc, type); }).filter(Boolean);
    });
  }

  function fetchGoogleBooks(query, type, page, perPage) {
    if (!enabledProvider("googleBooks")) return Promise.resolve([]);
    var cfg = config();
    var q = query || (typeConfig(type).seeds || ["books"])[0];
    var params = new URLSearchParams();
    params.set("q", q);
    params.set("maxResults", String(Math.min(40, perPage || cfg.perPage || DEFAULT_PER_PAGE)));
    params.set("startIndex", String(((page || 1) - 1) * Math.min(40, perPage || cfg.perPage || DEFAULT_PER_PAGE)));
    params.set("printType", type === TYPES.comics ? "magazines" : "books");
    params.set("projection", "lite");
    if (cfg.googleBooksApiKey) params.set("key", cfg.googleBooksApiKey);
    return fetchJson(providerUrl("googlebooks", "https://www.googleapis.com/books/v1/volumes", params)).then(function (json) {
      return (json && json.items || []).map(function (item) { return mapGoogleBook(item, type); }).filter(Boolean);
    });
  }

  function fetchMangaDex(query, type, page, perPage) {
    if (!enabledProvider("mangaDex")) return Promise.resolve([]);
    var cfg = typeConfig(type).mangaDex || {};
    var limit = Math.min(50, perPage || config().perPage || DEFAULT_PER_PAGE);
    var params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(((page || 1) - 1) * limit));
    params.append("includes[]", "cover_art");
    params.append("contentRating[]", "safe");
    params.append("contentRating[]", "suggestive");
    if (query) params.set("title", query);
    else params.set("order[followedCount]", "desc");
    (cfg.originalLanguages || []).forEach(function (lang) { params.append("originalLanguage[]", lang); });
    return fetchJson(providerUrl("mangadex", "https://api.mangadex.org/manga", params)).then(function (json) {
      return (json && json.data || []).map(function (item) { return mapMangaDex(item, type); }).filter(Boolean);
    });
  }

  var PROVIDERS = {
    anilist: fetchAniList,
    openLibrary: fetchOpenLibrary,
    googleBooks: fetchGoogleBooks,
    mangaDex: fetchMangaDex
  };

  function chooseProviders(type, requestedProviders) {
    var providers = requestedProviders && requestedProviders.length ? requestedProviders : typeConfig(type).providers;
    return providers.filter(function (name) { return PROVIDERS[name] && enabledProvider(name); });
  }

  function runProviders(kind, query, type, options) {
    options = options || {};
    var cfg = config();
    if (cfg.enabled === false || !global.fetch) return Promise.resolve({ added: 0, works: [], skipped: "disabled" });
    type = normalizeType(type || readRouteType() || TYPES.manga);
    var providers = chooseProviders(type, options.providers);
    var page = Number(options.page) || 1;
    var key = batchKey(kind, type, query, providers, page);
    var cached = options.force ? null : cachedBatch(key);
    if (cached) {
      var cachedSummary = applyWorks(cached, { type: type, query: query });
      return Promise.resolve(Object.assign(cachedSummary, { cached: true, providers: providers, type: type }));
    }
    write(STATE_KEY, Object.assign({}, state(), { status: "checking", checkedAt: nowIso(), lastType: type, lastQuery: query || "" }));
    return Promise.all(providers.map(function (provider) {
      return PROVIDERS[provider](query, type, page, options.perPage).catch(function (error) {
        return [{ _providerError: provider, error: error && error.message || String(error) }];
      });
    })).then(function (groups) {
      var errors = [];
      var works = [];
      groups.forEach(function (group) {
        group.forEach(function (item) {
          if (item && item._providerError) errors.push(item);
          else works.push(item);
        });
      });
      works = uniqueWorks(works);
      if (works.length || !errors.length) rememberBatch(key, works);
      var summary = applyWorks(works, { type: type, query: query });
      if (errors.length) {
        write(STATE_KEY, Object.assign({}, state(), { status: "partial", errors: errors }));
      }
      return Object.assign(summary, { providers: providers, providerErrors: errors, type: type, fetched: true });
    }).catch(function (error) {
      write(STATE_KEY, Object.assign({}, state(), { status: "error", checkedAt: nowIso(), error: error && error.message || String(error) }));
      return { added: 0, works: [], error: error && error.message || String(error), type: type };
    });
  }

  function search(query, type, options) {
    query = normalizeSpaces(query);
    if (!query || query.length < 2) return Promise.resolve({ added: 0, works: [], skipped: "short-query" });
    return runProviders("search", query, type, options);
  }

  function fetchExpandedPage(type, page, limit) {
    var params = new URLSearchParams();
    params.set("type", normalizeType(type));
    params.set("page", String(page || 1));
    params.set("limit", String(limit || DEFAULT_EXPANSION_PAGE_SIZE));
    return fetchJson(providerUrl("expanded", "output/api-catalog/" + encodeURIComponent(normalizeType(type)) + ".json", params));
  }

  function loadExpandedType(type, options) {
    options = options || {};
    type = normalizeType(type || readRouteType() || TYPES.manga);
    if (!enabledProvider("expanded")) return Promise.resolve({ added: 0, works: [], skipped: "expanded-disabled", type: type });
    var cfg = config();
    var target = Math.max(1, Number(options.target) || Number(cfg.minimumNewWorksPerType) || DEFAULT_EXPANSION_TARGET);
    var pageSize = Math.max(1, Math.min(100, Number(options.expandedPageSize) || Number(cfg.expandedPageSize) || DEFAULT_EXPANSION_PAGE_SIZE));
    var key = batchKey("expanded", type, "", ["expanded"], 1);
    var cached = options.force ? null : cachedBatch(key);
    if (cached && cached.length >= target) {
      var cachedSummary = applyWorks(cached.slice(0, target), { type: type, query: "" });
      return Promise.resolve(Object.assign(cachedSummary, {
        cached: true,
        type: type,
        catalogWorks: cached.slice(0, target),
        target: target,
        coverage: cached.length
      }));
    }

    write(STATE_KEY, Object.assign({}, state(), { status: "expanding", checkedAt: nowIso(), lastType: type }));
    var collected = [];
    var page = 1;
    var hasNext = true;
    var totalAvailable = 0;
    var chain = Promise.resolve();
    var maxPages = Math.ceil(target / pageSize) + 1;
    for (var index = 0; index < maxPages; index++) {
      chain = chain.then(function () {
        if (!hasNext || uniqueWorks(collected).length >= target) return null;
        var currentPage = page++;
        return fetchExpandedPage(type, currentPage, pageSize).then(function (payload) {
          var rows = payload && payload.works || [];
          totalAvailable = Number(payload && payload.total) || totalAvailable;
          hasNext = Boolean(payload && payload.hasNext);
          Array.prototype.push.apply(collected, rows);
        });
      });
    }
    return chain.then(function () {
      var works = uniqueWorks(collected).slice(0, target);
      if (works.length) rememberBatch(key, works);
      var summary = applyWorks(works, { type: type, query: "" });
      return Object.assign(summary, {
        fetched: true,
        type: type,
        catalogWorks: works,
        target: target,
        coverage: works.length,
        totalAvailable: totalAvailable
      });
    }).catch(function (error) {
      write(STATE_KEY, Object.assign({}, state(), { status: "partial", checkedAt: nowIso(), lastType: type, error: error && error.message || String(error) }));
      return { added: 0, works: [], catalogWorks: [], type: type, error: error && error.message || String(error) };
    });
  }

  function loadRemoteType(type, options) {
    options = options || {};
    type = normalizeType(type || readRouteType() || TYPES.manga);
    var seeds = options.query ? [options.query] : (typeConfig(type).seeds || [type]);
    var pages = Math.max(1, Number(options.pages) || 1);
    var chain = Promise.resolve({ added: 0, works: [] });
    seeds.slice(0, Number(options.seedCount) || 1).forEach(function (seed) {
      for (var page = 1; page <= pages; page++) {
        (function (q, p) {
          chain = chain.then(function (summary) {
            return runProviders("type", q, type, Object.assign({}, options, { page: p })).then(function (next) {
              return Object.assign({}, next, { added: (summary.added || 0) + (next.added || 0), works: (summary.works || []).concat(next.works || []) });
            });
          });
        })(seed, page);
      }
    });
    return chain;
  }

  function loadType(type, options) {
    options = options || {};
    type = normalizeType(type || readRouteType() || TYPES.manga);
    return loadExpandedType(type, options).then(function (expanded) {
      var target = Math.max(1, Number(options.target) || Number(config().minimumNewWorksPerType) || DEFAULT_EXPANSION_TARGET);
      if ((expanded.catalogWorks || []).length >= target || expanded.cached || options.expandedOnly) return expanded;
      return loadRemoteType(type, options).then(function (remote) {
        return Object.assign({}, remote, {
          added: (expanded.added || 0) + (remote.added || 0),
          works: (expanded.works || []).concat(remote.works || []),
          expanded: expanded
        });
      });
    });
  }

  function loadAllTypes(options) {
    options = options || {};
    var cfg = config();
    var types = options.types || Object.values(TYPES);
    var delay = Number(options.delayMs != null ? options.delayMs : cfg.warmDelayMs) || 0;
    var chain = Promise.resolve({ added: 0, works: [] });
    types.forEach(function (type) {
      chain = chain.then(function (summary) {
        return wait(delay).then(function () {
          return loadType(type, Object.assign({}, options, { pages: options.pages || cfg.pagesPerWarmType || 1 })).then(function (next) {
            return Object.assign({}, next, { added: (summary.added || 0) + (next.added || 0), works: (summary.works || []).concat(next.works || []) });
          });
        });
      });
    });
    return chain;
  }

  function wait(ms) {
    return new Promise(function (resolve) { global.setTimeout(resolve, ms); });
  }

  function readRouteType() {
    try {
      return normalizeType(new URLSearchParams(global.location && global.location.search || "").get("type") || "");
    } catch (e) {
      return TYPES.manga;
    }
  }

  function readRouteSearch() {
    try {
      return normalizeSpaces(new URLSearchParams(global.location && global.location.search || "").get("search") || "");
    } catch (e) {
      return "";
    }
  }

  var inputTimer = null;
  function bindSearchInputs() {
    if (!global.document || !global.document.addEventListener) return;
    global.document.addEventListener("input", function (event) {
      if (!config().autoSearch) return;
      var target = event && event.target;
      if (!target || !/^(INPUT|TEXTAREA)$/i.test(target.tagName || "")) return;
      var value = normalizeSpaces(target.value || "");
      if (value.length < 3) return;
      global.clearTimeout(inputTimer);
      inputTimer = global.setTimeout(function () { search(value, readRouteType()).catch(function () {}); }, SEARCH_DEBOUNCE_MS);
    }, true);
  }

  function hookHistory() {
    if (!global.history || global.history.__lorefyApiHooked) return;
    ["pushState", "replaceState"].forEach(function (method) {
      var original = global.history[method];
      if (typeof original !== "function") return;
      global.history[method] = function () {
        var result = original.apply(this, arguments);
        scheduleRouteLoad();
        return result;
      };
    });
    global.history.__lorefyApiHooked = true;
  }

  var routeTimer = null;
  function scheduleRouteLoad() {
    var cfg = config();
    if (!cfg.autoWarmCurrentType) return;
    global.clearTimeout(routeTimer);
    routeTimer = global.setTimeout(function () {
      var q = readRouteSearch();
      var type = readRouteType();
      loadType(type, { expandedOnly: true }).then(function () {
        if (q) return search(q, type);
        return null;
      }).catch(function () {});
    }, 800);
  }

  function applyCached(type) {
    var cached = cache();
    type = normalizeType(type || readRouteType() || TYPES.manga);
    var works = cached.works.filter(function (work) { return normalizeType(work && work.type) === type; });
    if (works.length) applyWorks(works, { type: type, query: "" });
    return works.length;
  }

  function state() {
    var cached = cache();
    return Object.assign({
      status: "idle"
    }, read(STATE_KEY, {}), {
      cachedWorks: cached.works.length,
      batches: Object.keys(cached.batches).length,
      types: Object.values(TYPES)
    });
  }

  var bootstrapStarted = false;
  var bootstrapTimer = null;

  function startAfterCatalog() {
    if (bootstrapStarted || config().enabled === false) return;
    bootstrapStarted = true;
    if (bootstrapTimer) {
      global.clearTimeout(bootstrapTimer);
      bootstrapTimer = null;
    }
    scheduleRouteLoad();
    if (config().warmAllTypes) {
      var cfg = config();
      var target = Math.max(1, Number(cfg.baselineWarmTarget) || 100);
      wait(Number(cfg.warmDelayMs) || 1000).then(function () {
        return loadAllTypes({
          target: target,
          pages: cfg.pagesPerWarmType || 1,
          seedCount: 1,
          delayMs: cfg.baselineWarmDelayMs || 220
        });
      }).catch(function () {});
    }
  }

  function start() {
    if (config().enabled === false) return;
    try { applyCached(readRouteType()); } catch (e) {}
    bindSearchInputs();
    hookHistory();
    global.addEventListener("lorefy:catalog-ready", function () {
      duplicateIndex = null;
      duplicateIndexSize = -1;
      startAfterCatalog();
    });
    if (global.__lorefyCatalogReady) startAfterCatalog();
    else {
      // Older browsers that cannot create a worker still get their API
      // additions after the fallback loader has had time to run.
      bootstrapTimer = global.setTimeout(startAfterCatalog, 15000);
    }
  }

  global.LorefyApiCatalog = {
    CACHE_KEY: CACHE_KEY,
    STATE_KEY: STATE_KEY,
    TYPES: TYPES,
    normalizeType: normalizeType,
    search: search,
    loadExpandedType: loadExpandedType,
    loadType: loadType,
    loadAllTypes: loadAllTypes,
    applyCached: applyCached,
    state: state
  };

  if (global.document && global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(typeof window !== "undefined" ? window : this);

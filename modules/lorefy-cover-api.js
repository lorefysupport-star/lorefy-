/* modules/lorefy-cover-api.js
   Public-source cover lookup used by the detail cover picker and profile boards. */
;(function () {
  "use strict";

  var root = typeof window !== "undefined" ? window : globalThis;
  var MAX_COVERS = 1000;
  var FETCH_TIMEOUT_MS = 6000;
  var PAGE_LIMIT = 100;
  var MAX_PAGES = 10;
  var GOOGLE_BOOKS_PAGE_SIZE = 40;
  var MAX_GOOGLE_BOOKS_PAGES = 10;
  var cache = new Map();
  var normalizedUrls = new Map(), editionKeys = new Map();
  var IMAGE_HOSTS = new Set([
    "s3.anilist.co",
    "s4.anilist.co",
    "cdn.myanimelist.net",
    "myanimelist.net",
    "media.kitsu.app",
    "covers.openlibrary.org",
    "images.ranobedb.org",
    "ak-asset.jarir.com",
    "freewebnovel.com",
    "uploads.mangadex.org",
    "books.google.com",
    "books.googleusercontent.com",
    "lh3.googleusercontent.com",
    "m.media-amazon.com",
    "images-na.ssl-images-amazon.com",
    "commons.wikimedia.org",
    "upload.wikimedia.org",
    "images.weserv.nl",
    "wsrv.nl",
    "picsum.photos"
  ]);

  function isAllowedImageHost(host) {
    return IMAGE_HOSTS.has(host) ||
      host === "archive.org" || host.endsWith(".archive.org") ||
      host.endsWith(".fandom.com") || host.endsWith(".fandom.wikia.com") ||
      host.endsWith(".wikia.nocookie.net") || host.endsWith(".wikimedia.org");
  }

  function asText(value) {
    return String(value == null ? "" : value).trim();
  }

  function isPublisherCover(parsed) {
    return parsed.protocol === 'https:' && parsed.hostname === 'downloads.hindawi.org' &&
      !parsed.username && !parsed.password && !parsed.port &&
      /^\/covers\/svg\/270x360\/\d+\.svg$/.test(parsed.pathname);
  }

  // Cache only pure text work, never rights decisions, proxy routes or image data.
  function memoUrlText(store, value, compute) {
    if (value.length > 2048 || /^data:/i.test(value)) return compute(value);
    if (store.has(value)) return store.get(value);
    var result = compute(value);
    if (store.size >= 1024) store.delete(store.keys().next().value);
    store.set(value, result);
    return result;
  }

  function normalizeUrl(value) {
    return memoUrlText(normalizedUrls, asText(value), parseCoverUrl);
  }

  function parseCoverUrl(url) {
    if (!url) return "";
    if (/^\/\//.test(url)) url = "https:" + url;
    if (/^http:\/\//i.test(url)) url = url.replace(/^http:\/\//i, "https://");
    if (/^data:image\//i.test(url)) return url;
    if (!/^https?:\/\//i.test(url)) return "";
    try {
      var parsed = new URL(url);
      if (isPublisherCover(parsed)) return url;
      var host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
      if (!isAllowedImageHost(host)) return "";
      // Google Books and Wikimedia image endpoints intentionally do not always
      // expose an image extension. All other providers need an image-shaped URL.
      var knownEndpoint =
        (host === "books.google.com" && parsed.pathname === "/books/content") ||
        host === "commons.wikimedia.org" ||
        host === "upload.wikimedia.org";
      if (!knownEndpoint && !/\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(parsed.pathname + parsed.search)) return "";
      return url;
    } catch (_) {
      return "";
    }
  }

  function displayUrl(value) {
    var raw = asText(value);
    try {
      var safeMedia = root && root.LorefyRightsSafeMedia;
      if (safeMedia && typeof safeMedia.coverUrl === "function") {
        var protectedUrl = safeMedia.coverUrl(raw, "Lorefy");
        if (protectedUrl !== raw) return protectedUrl;
      }
    } catch (_) {}
    if (/\/functions\/v1\/lorefy-public\/media\?url=/i.test(raw)) return raw;
    var url = normalizeUrl(raw);
    if (!url || /^data:image\//i.test(url)) return url;
    // This publisher's static cover SVGs are displayed in img elements; the
    // raster media gateway cannot transcode them. Arbitrary SVGs stay rejected.
    if (isPublisherCover(new URL(url))) return url;
    var location = root && root.location;
    if (location && /^(?:127\.0\.0\.1|localhost)$/i.test(asText(location.hostname)) &&
        /(?:^|[?&])preview=demo(?:&|$)/.test(asText(location.search))) {
      // MangaDex returns a successful white hotlink notice when sent a referrer.
      return new URL(url).hostname === "uploads.mangadex.org"
        ? "/api/media?url=" + encodeURIComponent(url) : url;
    }
    var capacitor = root && root.Capacitor;
    var nativeRuntime = false;
    try {
      nativeRuntime = !!(capacitor && (
        (typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform()) ||
        (typeof capacitor.getPlatform === "function" && capacitor.getPlatform() !== "web")
      ));
    } catch (_) {}
    try {
      if (root && root.LorefyDataProxy && typeof root.LorefyDataProxy.mediaUrl === "function") return root.LorefyDataProxy.mediaUrl(url);
    } catch (_) {}
    var localOrigin = !nativeRuntime && location && /^(?:127\.0\.0\.1|localhost)$/i.test(asText(location.hostname));
    return localOrigin ? "/api/media?url=" + encodeURIComponent(url) : url;
  }

  function coverDedupeKey(url) {
    return memoUrlText(editionKeys, asText(url), parseCoverKey);
  }

  function parseCoverKey(url) {
    var normalized = normalizeUrl(url);
    if (!normalized) return "";
    if (/^data:image\//i.test(normalized)) return normalized.slice(0, 128);
    try {
      var parsed = new URL(normalized);
      var host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
      var path = decodeURIComponent(parsed.pathname || "").toLowerCase();
      var mal = path.match(/\/images\/(manga|anime|characters)\/\d+\/([0-9]+)l?\.(?:jpg|jpeg|png|webp)$/i);
      if (host === "cdn.myanimelist.net" && mal) return "mal:" + mal[1] + ":" + mal[2];
      var anilist = path.match(/\/file\/anilistcdn\/media\/([^/]+)\/cover\/(?:large|medium|small)\/([^/]+)\.(?:jpg|jpeg|png|webp)$/i);
      if (host === "s4.anilist.co" && anilist) return "anilist:" + anilist[1] + ":" + anilist[2];
      var openLibrary = path.match(/\/b\/(id|isbn|olid)\/([^/]+?)(?:-[sml])?\.(?:jpg|jpeg|png|webp)$/i);
      if (host === "covers.openlibrary.org" && openLibrary) {
        return "openlibrary:" + openLibrary[1] + ":" + openLibrary[2].replace(/-[sml]$/i, "");
      }
      if (host === "uploads.mangadex.org") {
        var mdx = path.replace(/\.(?:256|512)\.(jpg|jpeg|png|webp)$/i, ".$1");
        return "mangadex:" + mdx.replace(/\.(jpg|jpeg|png|webp)$/i, "");
      }
      if (host === "books.google.com" && path === "/books/content") {
        var googleId = parsed.searchParams.get("id");
        if (googleId) return "googlebooks:" + googleId.toLowerCase();
      }
      ["w", "h", "width", "height", "fit", "output", "img", "zoom", "edge", "source", "printsec"].forEach(function (param) {
        parsed.searchParams.delete(param);
      });
      return host + parsed.pathname.toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/i, "") + "?" + parsed.searchParams.toString().toLowerCase();
    } catch (_) {
      return normalized.toLowerCase().replace(/\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i, "");
    }
  }

  function mergeDetails(target, details) {
    Object.keys(details || {}).forEach(function (key) {
      var value = asText(details[key]).slice(0, 240);
      if (!value || target[key] === null) return;
      target[key] = target[key] && target[key] !== value ? null : value;
    });
    return target;
  }

  function describe(value) {
    var url = normalizeUrl(value);
    if (!url) return {};
    if (/^data:image\//i.test(url)) return { source: 'local' };
    var host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
    var names = {'covers.openlibrary.org':'Open Library','books.google.com':'Google Books','books.googleusercontent.com':'Google Books','uploads.mangadex.org':'MangaDex','cdn.myanimelist.net':'MyAnimeList','myanimelist.net':'MyAnimeList','s3.anilist.co':'AniList','s4.anilist.co':'AniList'};
    return { source: names[host] || host };
  }

  function addUrl(list, url, details) {
    url = normalizeUrl(url);
    if (!url) return;
    var key = coverDedupeKey(url);
    if (details) {
      if (!list._details) list._details = new Map();
      list._details.set(key, mergeDetails(list._details.get(key) || {}, details));
    }
    if (list._seen && list._seen.has(key)) return;
    if (!list._seen) list._seen = new Set();
    list._seen.add(key);
    list.push(url);
  }

  function uniqueChoices(values) {
    var list = [];
    values = Array.isArray(values) ? values : [];
    values.forEach(function (value) {
      var url = typeof value === "string" ? value : value && (value.img || value.url || value.src || value.cover || value.image);
      try {
        var parsed = new URL(String(url || ""), root.location && root.location.href);
        if (parsed.pathname === "/api/media" || /\/functions\/v1\/lorefy-public\/media$/i.test(parsed.pathname)) {
          url = parsed.searchParams.get("url") || url;
        }
      } catch (_) {}
      addUrl(list, url);
    });
    delete list._seen;
    return list;
  }

  function addImageObject(list, image, details) {
    if (!image || typeof image !== "object") return;
    [
      image.extraLarge,
      image.large,
      image.medium,
      image.thumbnail,
      image.smallThumbnail,
      image.image_url,
      image.large_image_url,
      image.medium_image_url
    ].forEach(function (url) { addUrl(list, url, details); });
    if (image.jpg) addImageObject(list, image.jpg, details);
    if (image.webp) addImageObject(list, image.webp, details);
  }

  function addDirectCovers(list, work) {
    if (!work) return;
    [
      work.sourceCoverUrl,
      work.cover,
      work.sourceCover,
      work.coverUrl,
      work.coverImage,
      work.image,
      work.poster,
      work.thumbnail
    ].forEach(function (value) {
      if (typeof value === "string") addUrl(list, value);
      else addImageObject(list, value);
    });
    (Array.isArray(work.covers) ? work.covers : []).forEach(function (cover) {
      if (typeof cover === "string") addUrl(list, cover);
      else if (cover && typeof cover === "object") {
        [cover.img, cover.url, cover.src, cover.cover, cover.image].forEach(function (value) {
          if (typeof value === "string") addUrl(list, value);
          else addImageObject(list, value);
        });
      }
    });
    (Array.isArray(work.alternateCovers) ? work.alternateCovers : []).forEach(function (cover) {
      if (typeof cover === "string") addUrl(list, cover);
      else if (cover && typeof cover === "object") {
        [cover.img, cover.url, cover.src, cover.cover, cover.image].forEach(function (value) {
          if (typeof value === "string") addUrl(list, value);
          else addImageObject(list, value);
        });
      }
    });
  }

  function typeText(work) {
    return [
      work && work.type,
      work && work.format,
      work && work.category,
      work && work.pl
    ].map(asText).join(" ").toLowerCase();
  }

  function isVisualWork(work) {
    var text = typeText(work);
    return /(manga|manhwa|manhua|comic|comics|\u0645\u0627\u0646\u062c\u0627|\u0645\u0627\u0646\u0647\u0648\u0627|\u0645\u0627\u0646\u0647\u0627|\u0643\u0648\u0645\u064a\u0643\u0633)/i.test(text);
  }

  function isTextWork(work) {
    var text = typeText(work);
    return /(novel|book|literary|\u0631\u0648\u0627\u064a\u0629|\u0648\u064a\u0628\s*\u0646\u0648\u0641\u0644|\u0644\u0627\u064a\u062a\s*\u0646\u0648\u0641\u0644|\u0643\u062a\u0627\u0628)/i.test(text);
  }

  function cleanTitle(value) {
    return asText(value)
      .replace(/\s*\([^)]{1,80}\)\s*/g, " ")
      .replace(/\s*\[[^\]]{1,80}\]\s*/g, " ")
      .replace(/\b(vol(?:ume)?|book|chapter)\s*\d+\b/ig, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  var TITLE_STOPWORDS = {
    a: 1, an: 1, and: 1, the: 1, of: 1, to: 1, in: 1, on: 1,
    vol: 1, volume: 1, book: 1, chapter: 1, edition: 1, omnibus: 1,
    manga: 1, manhwa: 1, manhua: 1, comic: 1, comics: 1, novel: 1,
    x: 1
  };

  function normalizeTitleForMatch(value) {
    var text = cleanTitle(value).toLowerCase();
    try { text = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); } catch (_) {}
    return text
      .replace(/[×✕✖]/g, " x ")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function titleTokens(value) {
    return normalizeTitleForMatch(value).split(/\s+/).filter(function (token) {
      return token && !TITLE_STOPWORDS[token] && !/^\d+$/.test(token);
    });
  }

  function compactTitle(value) {
    return normalizeTitleForMatch(value).replace(/\s+/g, "");
  }

  function strictTitleIdentity(value) {
    var text = asText(value).toLowerCase();
    try { text = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); } catch (_) {}
    return text
      .replace(/&/g, " and ")
      .replace(/[^\p{L}\p{N}\u0600-\u06ff]+/gu, "");
  }

  function hasTokenMultiset(haystack, needle) {
    if (!needle.length) return false;
    var counts = Object.create(null);
    haystack.forEach(function (token) { counts[token] = (counts[token] || 0) + 1; });
    for (var i = 0; i < needle.length; i++) {
      var token = needle[i];
      if (!counts[token]) return false;
      counts[token] -= 1;
    }
    return true;
  }

  function sameWorkTitle(work, candidateTitle) {
    var candidate = normalizeTitleForMatch(candidateTitle);
    if (!candidate) return false;
    var candidateCompact = compactTitle(candidateTitle);
    var candidateTokens = titleTokens(candidateTitle);
    var titles = titleCandidates(work);
    for (var i = 0; i < titles.length; i++) {
      var title = normalizeTitleForMatch(titles[i]);
      if (!title) continue;
      var titleCompact = compactTitle(titles[i]);
      if (candidateCompact && titleCompact && (candidateCompact === titleCompact || candidateCompact.indexOf(titleCompact) >= 0)) return true;
      if (hasTokenMultiset(candidateTokens, titleTokens(titles[i]))) return true;
    }
    return false;
  }

  function addTitle(out, value) {
    if (!value) return;
    if (typeof value === "string") {
      var cleaned = cleanTitle(value);
      if (cleaned) out.push(cleaned);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function (item) { addTitle(out, item); });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) { addTitle(out, value[key]); });
    }
  }

  function addRawTitle(out, value) {
    if (!value) return;
    if (typeof value === "string") {
      var raw = asText(value);
      if (raw) out.push(raw);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function (item) { addRawTitle(out, item); });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) { addRawTitle(out, value[key]); });
    }
  }

  function sourceMatchesWorkTitle(work, titles) {
    titles = (titles || []).map(cleanTitle).filter(Boolean);
    if (!titles.length) return true;
    return titles.some(function (title) { return sameWorkTitle(work, title); });
  }

  function googleBooksMatchesWork(work, candidateTitle) {
    var candidate = normalizeTitleForMatch(candidateTitle);
    if (!candidate) return false;
    return titleCandidates(work).some(function (title) {
      var expected = normalizeTitleForMatch(title);
      if (!expected) return false;
      if (candidate === expected) return true;
      if (candidate.indexOf(expected + " ") !== 0) return false;
      // Retain numbered volumes and omnibuses, but reject spin-offs and
      // unrelated books that only begin with the same franchise title.
      var remainder = candidate.slice(expected.length).trim();
      return /^(?:vol(?:ume)?|book|part|edition|omnibus|complete|\d)/i.test(remainder);
    });
  }

  function jikanRowTitles(row) {
    var titles = [];
    addTitle(titles, row && row.title);
    addTitle(titles, row && row.title_english);
    addTitle(titles, row && row.title_japanese);
    addTitle(titles, row && row.titles && row.titles.map(function (entry) { return entry && entry.title; }));
    return titles;
  }

  function aniListMediaTitles(media) {
    var titles = [];
    addTitle(titles, media && media.title);
    return titles;
  }

  function mangaDexRowTitles(row) {
    var attrs = (row && row.attributes) || {};
    var titles = [];
    addRawTitle(titles, attrs.title);
    addRawTitle(titles, attrs.altTitles);
    return titles;
  }

  function mangaDexMatchesWork(work, row) {
    var attrs = (row && row.attributes) || {};
    var linkedMalId = asText(attrs.links && attrs.links.mal);
    var expectedMalId = malMangaId(work);
    var workTitles = titleCandidates(work);
    var canonicalTitles = [];
    addRawTitle(canonicalTitles, attrs.title);
    var canonicalMatch = canonicalTitles.some(function (candidate) {
      var candidateIdentity = strictTitleIdentity(candidate);
      return candidateIdentity && workTitles.some(function (title) {
        return candidateIdentity === strictTitleIdentity(title);
      });
    });
    if (canonicalMatch) return true;
    // MangaDex preserves the MAL source id for canonical records. Prefer it
    // over aliases: many fan editions and unrelated parody entries include a
    // bare franchise title in their alternate-title list.
    if (expectedMalId) return linkedMalId === expectedMalId;
    var rowTitles = mangaDexRowTitles(row);
    if (!rowTitles.length || !workTitles.length) return false;
    // Without a stable source id, trust only a record's canonical title. Its
    // aliases are useful for searching but are not safe identity evidence.
    return canonicalTitles.some(function (candidate) {
      var candidateIdentity = strictTitleIdentity(candidate);
      if (!candidateIdentity) return false;
      return workTitles.some(function (title) {
        return candidateIdentity === strictTitleIdentity(title);
      });
    });
  }

  function mangaDexCanonicalMatch(work, row) {
    var canonicalTitles = [];
    addRawTitle(canonicalTitles, row && row.attributes && row.attributes.title);
    var expected = titleCandidates(work).map(strictTitleIdentity).filter(Boolean);
    return canonicalTitles.some(function (title) {
      return expected.indexOf(strictTitleIdentity(title)) >= 0;
    });
  }

  function titleCandidates(work) {
    var titles = [];
    [
      work && work.searchTitle,
      work && work.title,
      work && work.englishTitle,
      work && work.romaji,
      work && work.originalTitle,
      work && work.ar
    ].forEach(function (title) {
      title = cleanTitle(title);
      if (!title) return;
      titles.push(title);
      if (title.indexOf(":") > -1) {
        title.split(":").map(cleanTitle).forEach(function (part) {
          if (part.length > 2) titles.push(part);
        });
      }
    });
    var seen = new Set();
    return titles.filter(function (title) {
      var key = title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 3);
  }

  function authorOf(work) {
    return cleanTitle((work && (work.auth || work.author || work.authorName || work.writer)) || "");
  }

  function malMangaId(work) {
    var raw = [
      work && work.id,
      work && work.mal,
      work && work.malId,
      work && work.sourceId
    ].map(asText).join(" ");
    var match = raw.match(/\bmal-manga-(\d+)\b/i) || raw.match(/\bmanga-(\d+)\b/i);
    if (match) return match[1];
    return /^\d+$/.test(asText(work && (work.mal || work.malId))) ? asText(work.mal || work.malId) : "";
  }

  function anilistMangaId(work) {
    var raw = [
      work && work.id,
      work && work.anilist,
      work && work.anilistId,
      work && work.sourceId
    ].map(asText).join(" ");
    var match = raw.match(/\b(?:api-)?anilist-(\d+)\b/i) || raw.match(/\banilist-(\d+)\b/i);
    if (match) return match[1];
    return /^\d+$/.test(asText(work && (work.anilist || work.anilistId))) ? asText(work.anilist || work.anilistId) : "";
  }

  function openLibraryWorkId(work) {
    var raw = [
      work && work.id,
      work && work.openLibraryId,
      work && work.sourceId,
      work && work.key
    ].map(asText).join(" ");
    var match = raw.match(/\bOL\d+W\b/i);
    if (match) return match[0].toUpperCase();
    match = raw.match(/\bol(\d+)w\b/i);
    return match ? ("OL" + match[1] + "W") : "";
  }

  function withTimeout(options) {
    options = options || {};
    if (typeof AbortController === "undefined") return options;
    var controller = new AbortController();
    var timer = setTimeout(function () {
      try { controller.abort(); } catch (_) {}
    }, FETCH_TIMEOUT_MS);
    return Object.assign({}, options, {
      signal: controller.signal,
      _timer: timer
    });
  }

  async function fetchJson(url, options) {
    if (!root.fetch) return null;
    var request = withTimeout(options);
    var timer = request._timer;
    delete request._timer;
    try {
      var response = await root.fetch(url, request);
      if (!response || !response.ok) return null;
      return await response.json();
    } catch (_) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function paramsUrl(base, entries) {
    var params = new URLSearchParams();
    entries.forEach(function (entry) {
      if (entry[1] != null && String(entry[1]).trim() !== "") params.append(entry[0], entry[1]);
    });
    return base + "?" + params.toString();
  }

  function catalogProxyUrl(provider, targetUrl) {
    try {
      if (root && root.LorefyDataProxy && typeof root.LorefyDataProxy.catalogUrl === "function") {
        return root.LorefyDataProxy.catalogUrl(provider, targetUrl);
      }
      var config = root && root.LOREFY_REMOTE_CATALOG;
      var base = asText(config && config.proxyBaseUrl).replace(/^\/+|\/+$/g, "");
      var origin = root && root.location && root.location.origin;
      var capacitor = root && root.Capacitor;
      var nativeRuntime = !!(capacitor && (
        (typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform()) ||
        (typeof capacitor.getPlatform === "function" && capacitor.getPlatform() !== "web")
      ));
      if (!base || !origin || origin === "null") return targetUrl;
      var parsed = new URL(targetUrl);
      if (nativeRuntime) {
        var release = root && root.LOREFY_RELEASE || {};
        var supabase = release.supabase || root.LOREFY_SUPABASE || {};
        var publicBase = asText(supabase.url).replace(/\/+$/, "");
        if (publicBase) return publicBase + "/functions/v1/lorefy-public/catalog-" + encodeURIComponent(provider) + parsed.search;
      }
      return "/" + base + "/" + provider + parsed.search;
    } catch (_) {
      return targetUrl;
    }
  }

  async function jikanCovers(work) {
    var list = [];
    var q = titleCandidates(work)[0];
    if (!q) return list;
    var data = await fetchJson(catalogProxyUrl("jikan", paramsUrl("https://api.tenrai.org/v1/manga", [
      ["q", q],
      ["limit", "8"],
      ["sfw", "true"]
    ])));
    ((data && data.data) || []).forEach(function (row) {
      if (!sourceMatchesWorkTitle(work, jikanRowTitles(row))) return;
      addImageObject(list, row && row.images);
    });
    return list;
  }

  async function jikanCoverById(work) {
    var list = [];
    var id = malMangaId(work);
    if (!id) return list;
    var data = await fetchJson(catalogProxyUrl("jikan", "https://api.tenrai.org/v1/manga/" + encodeURIComponent(id)));
    addImageObject(list, data && data.data && data.data.images);
    return list;
  }

  async function jikanPictureCovers(work) {
    var list = [];
    var id = malMangaId(work);
    if (!id) return list;
    var data = await fetchJson(catalogProxyUrl("jikan", "https://api.tenrai.org/v1/manga/" + encodeURIComponent(id) + "/pictures"));
    ((data && data.data) || []).forEach(function (row) {
      addImageObject(list, row);
    });
    return list;
  }

  async function aniListCovers(work) {
    var list = [];
    var q = titleCandidates(work)[0];
    if (!q) return list;
    var query = "query ($search: String) { Page(page: 1, perPage: 8) { media(search: $search, type: MANGA, sort: SEARCH_MATCH, isAdult: false) { coverImage { extraLarge large medium } title { romaji english native } } } }";
    var data = await fetchJson(catalogProxyUrl("anilist", "https://graphql.anilist.co"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: query, variables: { search: q } })
    });
    (((data && data.data && data.data.Page && data.data.Page.media) || [])).forEach(function (media) {
      if (!sourceMatchesWorkTitle(work, aniListMediaTitles(media))) return;
      addImageObject(list, media && media.coverImage);
    });
    return list;
  }

  async function aniListCoverById(work) {
    var list = [];
    var id = anilistMangaId(work);
    if (!id) return list;
    var query = "query ($id: Int) { Media(id: $id, type: MANGA) { coverImage { extraLarge large medium } } }";
    var data = await fetchJson(catalogProxyUrl("anilist", "https://graphql.anilist.co"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: query, variables: { id: Number(id) } })
    });
    addImageObject(list, data && data.data && data.data.Media && data.data.Media.coverImage);
    return list;
  }

  async function mangaDexCovers(work) {
    var list = [];
    var queries = titleCandidates(work);
    if (!queries.length) return list;
    var rows = [];
    var rowIds = new Set();
    // MangaDex's relevance endpoint is language-sensitive. A catalog work can
    // carry Japanese, English and romanized titles, so try each verified title
    // and only retain an exact title identity match.
    for (var queryIndex = 0; queryIndex < queries.length; queryIndex += 1) {
      var data = await fetchJson(catalogProxyUrl("mangadex", paramsUrl("https://api.mangadex.org/manga", [
        ["title", queries[queryIndex]],
        ["limit", "8"],
        ["includes[]", "cover_art"],
        ["order[relevance]", "desc"]
      ])));
      ((data && data.data) || []).forEach(function (row) {
        if (!mangaDexMatchesWork(work, row) || !row || !row.id || rowIds.has(row.id)) return;
        rowIds.add(row.id);
        rows.push(row);
      });
    }
    rows.forEach(function (row) {
      var cover = ((row.relationships || []).find(function (rel) {
        return rel && rel.type === "cover_art" && rel.attributes && rel.attributes.fileName;
      }) || {}).attributes;
      if (row.id && cover && cover.fileName) {
        addUrl(list, "https://uploads.mangadex.org/covers/" + row.id + "/" + cover.fileName + ".512.jpg", {source:'MangaDex',volume:cover.volume,language:cover.locale});
      }
    });
    var first = rows.find(function (row) { return mangaDexCanonicalMatch(work, row); }) || rows[0];
    if (first && first.id) {
      for (var offset = 0, page = 0; page < MAX_PAGES; page += 1, offset += PAGE_LIMIT) {
        var coverData = await fetchJson(catalogProxyUrl("mangadex-covers", paramsUrl("https://api.mangadex.org/cover", [
          ["manga[]", first.id],
          ["limit", String(PAGE_LIMIT)],
          ["offset", String(offset)],
          ["order[volume]", "asc"],
          ["order[createdAt]", "asc"]
        ])));
        var rows = (coverData && coverData.data) || [];
        rows.forEach(function (coverRow) {
          var fileName = coverRow && coverRow.attributes && coverRow.attributes.fileName;
          if (fileName) addUrl(list, "https://uploads.mangadex.org/covers/" + first.id + "/" + fileName + ".512.jpg", {source:'MangaDex',volume:coverRow.attributes.volume,language:coverRow.attributes.locale});
        });
        if (rows.length < PAGE_LIMIT) break;
      }
    }
    return list;
  }

  async function openLibraryWorkCovers(work) {
    var list = [];
    var workId = openLibraryWorkId(work);
    if (!workId) return list;
    for (var offset = 0, page = 0; page < MAX_PAGES; page += 1, offset += PAGE_LIMIT) {
      var data = await fetchJson(catalogProxyUrl("openlibrary-editions", "https://openlibrary.org/works/" + encodeURIComponent(workId) + "/editions.json?limit=" + PAGE_LIMIT + "&offset=" + offset));
      var entries = (data && data.entries) || [];
      entries.forEach(function (entry) {
        var details = {source:'Open Library',edition:asText(entry.key).replace(/^\/books\//,''),publisher:(entry.publishers||[]).join(', '),published:entry.publish_date,language:(entry.languages||[]).map(function(language){return asText(language.key).replace(/^\/languages\//,'');}).join(', '),isbn:(entry.isbn_13||entry.isbn_10||[])[0]};
        (entry.covers || []).forEach(function (coverId) {
          if (coverId && Number(coverId) > 0) {
            addUrl(list, "https://covers.openlibrary.org/b/id/" + coverId + "-L.jpg", details);
          }
        });
        (entry.isbn_13 || entry.isbn_10 || []).forEach(function (isbn) {
          addUrl(list, "https://covers.openlibrary.org/b/isbn/" + encodeURIComponent(isbn) + "-L.jpg", details);
        });
      });
      if (entries.length < PAGE_LIMIT) break;
    }
    return list;
  }

  async function openLibrarySearchCovers(work) {
    var list = [];
    /* A work id already has an exact editions endpoint; never mix title-search results into it. */
    if (openLibraryWorkId(work)) return list;
    var q = titleCandidates(work)[0];
    if (!q) return list;
    for (var offset = 0, page = 0; page < MAX_PAGES; page += 1, offset += PAGE_LIMIT) {
      var data = await fetchJson(catalogProxyUrl("openlibrary", paramsUrl("https://openlibrary.org/search.json", [
        ["title", q],
        ["author", authorOf(work)],
        ["limit", String(PAGE_LIMIT)],
        ["offset", String(offset)],
        ["fields", "cover_i,cover_edition_key,isbn,title,author_name"]
      ])));
      var docs = (data && data.docs) || [];
      docs.forEach(function (doc) {
        if (!sourceMatchesWorkTitle(work, [doc && doc.title])) return;
        var details = {source:'Open Library',edition:doc.cover_edition_key};
        if (doc.cover_i) addUrl(list, "https://covers.openlibrary.org/b/id/" + doc.cover_i + "-L.jpg", details);
        if (doc.cover_edition_key) addUrl(list, "https://covers.openlibrary.org/b/olid/" + doc.cover_edition_key + "-L.jpg", details);
        (doc.isbn || []).slice(0, 2).forEach(function (isbn) {
          addUrl(list, "https://covers.openlibrary.org/b/isbn/" + encodeURIComponent(isbn) + "-L.jpg", {source:'Open Library',isbn:isbn});
        });
      });
      if (docs.length < PAGE_LIMIT) break;
    }
    return list;
  }

  async function googleBooksCovers(work) {
    var list = [];
    var q = titleCandidates(work)[0];
    if (!q) return list;
    var author = authorOf(work);
    var search = "intitle:" + q + (author ? " inauthor:" + author : "");
    for (var offset = 0, page = 0; page < MAX_GOOGLE_BOOKS_PAGES; page += 1, offset += GOOGLE_BOOKS_PAGE_SIZE) {
      var entries = [
        ["q", search],
        ["maxResults", String(GOOGLE_BOOKS_PAGE_SIZE)],
        ["printType", "books"]
      ];
      if (offset) entries.push(["startIndex", String(offset)]);
      var data = await fetchJson(catalogProxyUrl("googlebooks", paramsUrl("https://www.googleapis.com/books/v1/volumes", entries)));
      var items = (data && data.items) || [];
      items.forEach(function (item) {
        var info = (item && item.volumeInfo) || {};
        if (!googleBooksMatchesWork(work, info.title)) return;
        var isbn=(info.industryIdentifiers||[]).find(function(identifier){return identifier.type==='ISBN_13';})||(info.industryIdentifiers||[]).find(function(identifier){return identifier.type==='ISBN_10';});
        addImageObject(list, info.imageLinks, {source:'Google Books',edition:item.id,publisher:info.publisher,published:info.publishedDate,language:info.language,isbn:isbn&&isbn.identifier});
      });
      if (items.length < GOOGLE_BOOKS_PAGE_SIZE || offset + items.length >= Number(data && data.totalItems || 0)) break;
    }
    return list;
  }

  function providerList(work) {
    var visual = isVisualWork(work);
    var stableMalId = malMangaId(work);
    var stableAniListId = anilistMangaId(work);
    var text = isTextWork(work);
    var stableOpenLibraryWorkId = openLibraryWorkId(work);
    if (!visual && !text) {
      visual = true;
      text = true;
    }
    if (/comic|comics|\u0643\u0648\u0645\u064a\u0643\u0633/i.test(typeText(work))) text = true;
    var providers = [];
    function addProvider(provider) {
      if (providers.indexOf(provider) < 0) providers.push(provider);
    }
    // An Open Library work id identifies one canonical work and all of its
    // editions. Broad title providers mix franchise names such as Batman with
    // adaptations, manga and unrelated volumes.
    if (stableOpenLibraryWorkId) {
      addProvider(openLibraryWorkCovers);
      return providers;
    }
    if (visual) {
      if (stableMalId) {
        [aniListCoverById, jikanPictureCovers, jikanCoverById, mangaDexCovers, googleBooksCovers].forEach(addProvider);
      } else if (stableAniListId) {
        [aniListCoverById, mangaDexCovers, googleBooksCovers].forEach(addProvider);
      } else {
        [jikanCovers, aniListCovers, openLibrarySearchCovers, googleBooksCovers, mangaDexCovers].forEach(addProvider);
      }
    }
    if (text && !visual) {
      if (openLibraryWorkId(work)) addProvider(openLibraryWorkCovers);
      else [openLibrarySearchCovers, googleBooksCovers].forEach(addProvider);
    }
    return providers;
  }

  function cacheKey(work) {
    return [
      work && work.id,
      titleCandidates(work).join("|"),
      authorOf(work),
      typeText(work)
    ].map(asText).join("::").toLowerCase();
  }

  async function lookup(work) {
    if (!work) return {urls:[],details:new Map()};
    var key = cacheKey(work);
    if (cache.has(key)) return await cache.get(key);
    var promise = (async function () {
      var list = [];
      addDirectCovers(list, work);
      var providers = providerList(work);
      var results = await Promise.allSettled(providers.map(function (provider) {
        return provider(work);
      }));
      results.forEach(function (result) {
        if (result.status !== "fulfilled") return;
        (Array.isArray(result.value) ? result.value : []).forEach(function (url) {
          addUrl(list, url, result.value._details && result.value._details.get(coverDedupeKey(url)));
        });
      });
      delete list._seen;
      return {urls:list.slice(0, MAX_COVERS),details:list._details||new Map()};
    })();
    cache.set(key, promise);
    return await promise;
  }

  async function alternates(work) {
    return (await lookup(work)).urls.slice();
  }

  async function choices(work) {
    var result = await lookup(work);
    return result.urls.map(function (url) {
      var details=Object.assign({},describe(url),result.details.get(coverDedupeKey(url))||{});
      Object.keys(details).forEach(function(key){if(details[key]===null)delete details[key];});
      return {img:url,details:details};
    });
  }

  async function resolve(work) {
    if(work&&work.metadataOnly)return primary(work);
    var urls = await alternates(work);
    return urls[0] || "";
  }

  function primary(work) {
    var list = [];
    addDirectCovers(list, work);
    return list[0] || "";
  }

  root.LorefyCoverAPI = {
    primary: primary,
    resolve: resolve,
    alternates: alternates,
    choices: choices,
    describe: describe,
    displayUrl: displayUrl,
    dedupeKey: coverDedupeKey,
    uniqueChoices: uniqueChoices,
    sameWorkTitle: sameWorkTitle
  };
})();

(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.LorefyCatalogIdentity = api;
    if (!root.LorefyCatalogAliases || typeof root.LorefyCatalogAliases !== "object") root.LorefyCatalogAliases = {};
    if (Array.isArray(root.LorefyMangaData)) {
      api.organizeCatalog(root.LorefyMangaData, { aliases: root.LorefyCatalogAliases });
    }
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var VOLUME_WORDS = /\b(?:vol(?:ume)?|book|part|edition|ed)\.?\s*#?\s*[0-9\u0660-\u0669]+\b/gi;
  var ISSUE_WORDS = /(?:\b(?:issue|number|no)\.?\s*#?\s*[0-9\u0660-\u0669]+\b|#\s*[0-9\u0660-\u0669]+\b)/gi;
  var SERIES_YEAR = /\(\s*(?:19|20)[0-9]{2}\s*(?:[-\u2013\u2014]\s*(?:(?:19|20)[0-9]{2})?)?\s*\)/g;
  var ARABIC_VOLUME_WORDS = new RegExp(
    "(?:\\u0627\\u0644\\u0645\\u062c\\u0644\\u062f|\\u0645\\u062c\\u0644\\u062f|" +
    "\\u0627\\u0644\\u062c\\u0632\\u0621|\\u062c\\u0632\\u0621|" +
    "\\u0627\\u0644\\u0637\\u0628\\u0639\\u0629|\\u0637\\u0628\\u0639\\u0629)\\s*[0-9\\u0660-\\u0669]+",
    "gu"
  );
  var NUMERIC_MAX_FIELDS = [
    "ch", "chapters", "chapterCount", "vol", "volumes", "volumeCount", "pages", "pageCount",
    "pop", "baseRatings", "baseReviews", "weeklyReads", "listAdds"
  ];
  var ARRAY_FIELDS = ["genres", "tags", "related", "alternateTitles", "altTitles", "aliases", "authorAliases", "authors"];
  var LONG_TEXT_FIELDS = ["synopsis", "synopsisAr", "synopsisEn", "description"];
  var MAX_INDEX_CANDIDATES_PER_KEY = 32;
  var MAX_AUTHOR_TOKENS = 24;
  var MAX_AUTHOR_PAIRS = 96;
  var ALIAS_CACHE = new WeakMap();
  var TEXT_CACHE = new Map();

  function normalizeText(value) {
    var text = String(value || "");
    var input = text;
    var cacheable = text.length <= 256;
    var cached = cacheable ? TEXT_CACHE.get(input) : undefined;
    if (cached !== undefined) return cached;
    try { text = text.normalize("NFKC"); } catch (error) { cacheable = false; }
    var result = text
      .toLowerCase()
      .replace(/[\u2018\u2019'`]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cacheable && result.length <= 256) {
      // Bound both entry count and input size while reusing common catalog text.
      if (TEXT_CACHE.size >= 512) TEXT_CACHE.delete(TEXT_CACHE.keys().next().value);
      TEXT_CACHE.set(input, result);
    }
    return result;
  }

  function canonicalWorkKey(title) {
    return normalizeText(String(title || "")
      .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
      .replace(/[،,]\s*(?:كتاب\s+إلكتروني|e-?book)\s*$/i, "")
      .replace(VOLUME_WORDS, " ")
      .replace(ISSUE_WORDS, " ")
      .replace(SERIES_YEAR, " ")
      .replace(ARABIC_VOLUME_WORDS, " "));
  }

  function validWorkTitle(title, work) {
    var key = normalizeText(title);
    if (!key || !/[\p{L}\p{N}]/u.test(key)) return false;
    if (!/^\d{1,2}$/.test(key)) return true;
    var id = String(work && work.id || "");
    return !!work && !/^ol(?:-|_)/i.test(id);
  }

  function normalizeType(value) {
    var key = normalizeText(value);
    var aliases = {
      comic: "comics", comics: "comics", "graphic novel": "comics", "\u0643\u0648\u0645\u064a\u0643\u0633": "comics",
      manga: "manga", "\u0645\u0627\u0646\u062c\u0627": "manga",
      manhwa: "manhwa", "\u0645\u0627\u0646\u0647\u0648\u0627": "manhwa",
      manhua: "manhua", "\u0645\u0627\u0646\u0647\u0648\u0627 \u0635\u064a\u0646\u064a\u0629": "manhua", "مانهوا صيني": "manhua",
      novel: "novel", "\u0631\u0648\u0627\u064a\u0629": "novel",
      book: "book", "\u0643\u062a\u0627\u0628": "book",
      "light novel": "light novel", "\u0644\u0627\u064a\u062a \u0646\u0648\u0641\u0644": "light novel",
      "web novel": "web novel", "\u0648\u064a\u0628 \u0646\u0648\u0641\u0644": "web novel"
    };
    return aliases[key] || key;
  }

  function isComicType(value) {
    return normalizeType(value) === "comics";
  }

  function comicRunYear(title) {
    var match = String(title || "").match(/\(\s*((?:19|20)[0-9]{2})\s*(?:[-\u2013\u2014][^)]*)?\)/);
    return match ? Number(match[1]) : 0;
  }

  function sourceFamily(work) {
    var id = String(work && work.id || "").toLowerCase();
    var source = String(work && (work._apiSource || work.rSrc || work.pl) || "").toLowerCase();
    if (/^(?:api-)?anilist-/.test(id) || source.indexOf("anilist") >= 0) return "anilist";
    if (/^mal-/.test(id) || source.indexOf("myanimelist") >= 0) return "mal";
    if (/^(?:api-)?(?:mangadex|md)-/.test(id) || source.indexOf("mangadex") >= 0) return "mangadex";
    if (/^(?:ol-|ol_)/.test(id) || source.indexOf("open library") >= 0) return "openlibrary";
    if (/^(?:gb-|googlebooks-)/.test(id) || source.indexOf("google") >= 0) return "googlebooks";
    return source || "local";
  }

  function canonicalAuthor(value) {
    return normalizeText(String(value || "").slice(0, 2048)
      .replace(/[\u064b-\u065f\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي"))
      .split(" ")
      .filter(function (token) { return token && token !== "unknown" && token !== "various"; })
      .map(function (token) { return token.replace(/ou$/g, "o"); })
      .sort()
      .join(" ");
  }

  function authorsMatch(a, b) {
    var left = canonicalAuthor(a);
    var right = canonicalAuthor(b);
    if (!left || !right) return false;
    if (left === right) return true;
    var leftTokens = new Set(left.split(" "));
    var rightTokens = new Set(right.split(" "));
    var common = 0;
    leftTokens.forEach(function (token) { if (rightTokens.has(token)) common += 1; });
    return common >= 2 || common / Math.max(leftTokens.size, rightTokens.size) >= 0.75;
  }

  function canonicalCover(value) {
    var cover = String(value || "").trim();
    if (!/^https?:\/\//i.test(cover)) return "";
    try {
      var url = new URL(cover);
      var path = url.pathname
        .replace(/-[LMS](?=\.[a-z]+$)/i, "-SIZE")
        .replace(/\/(?:large|medium)(?=\/)/i, "/SIZE");
      return (url.hostname + path).toLowerCase();
    } catch (error) {
      return cover.replace(/[?#].*$/, "").replace(/-[LMS](?=\.[a-z]+$)/i, "-SIZE").toLowerCase();
    }
  }

  function coverKey(work) {
    var fields = [work && work.sourceCoverUrl, work && work.cover, work && work.coverImage, work && work.sourceCover];
    for (var i = 0; i < fields.length; i += 1) {
      var key = canonicalCover(fields[i]);
      if (key) return key;
    }
    return "";
  }

  function canonicalId(id, aliases) {
    var start = String(id || "");
    if (!aliases || typeof aliases !== "object") return start;
    var cache = ALIAS_CACHE.get(aliases);
    if (!cache) {
      cache = new Map();
      ALIAS_CACHE.set(aliases, cache);
    }
    if (cache.has(start)) return cache.get(start);
    var current = start;
    var path = [];
    var seen = new Set();
    while (aliases && aliases[current] && !seen.has(current)) {
      seen.add(current);
      path.push(current);
      if (cache.has(current)) {
        current = cache.get(current);
        break;
      }
      current = String(aliases[current]);
    }
    path.forEach(function (key) { cache.set(key, current); });
    cache.set(start, current);
    return current;
  }

  function externalKeys(work) {
    var keys = [];
    [
      ["mal", work && (work.malId || work.idMal)],
      ["anilist", work && (work.anilistId || work.idAniList)],
      ["openlibrary", work && (work.openLibraryId || work.olid)],
      ["googlebooks", work && work.googleBooksId],
      ["wikidata", work && work.wikidataId],
      ["bookbrainz", work && work.bookBrainzId],
      ["gcd-series", work && work.gcdSeriesId && work.catalogLevel !== 'issue' ? work.gcdSeriesId : null],
      ["gcd-issue", work && work.gcdIssueId],
      ["isbn", work && (work.isbn13 || work.isbn)]
    ].forEach(function (entry) {
      if (entry[1] !== undefined && entry[1] !== null && String(entry[1]).trim()) {
        keys.push(entry[0] + ":" + String(entry[1]).trim().toLowerCase());
      }
    });
    return keys;
  }

  function yearsClose(a, b, range) {
    var left = Number(a && a.yr) || 0;
    var right = Number(b && b.yr) || 0;
    if (!left || !right) return true;
    return Math.abs(left - right) <= (range || 3);
  }

  function hasSharedExternalId(a, b) {
    var right = new Set(externalKeys(b));
    return externalKeys(a).some(function (key) { return right.has(key); });
  }

  function sameWork(a, b, aliases) {
    if (!a || !b || !a.id || !b.id) return false;
    var leftId = String(a.id);
    var rightId = String(b.id);
    if (leftId === rightId) return true;
    var canonicalLeft = canonicalId(leftId, aliases || {});
    var canonicalRight = canonicalId(rightId, aliases || {});
    if (canonicalLeft === canonicalRight) return true;
    if(a.catalogLevel&&b.catalogLevel&&a.catalogLevel!==b.catalogLevel)return false;
    for(var field of ['isbn13','issueNumber','volumeNumber'])if(a[field]&&b[field]&&String(a[field])!==String(b[field]))return false;
    // A provider's explicit edition/issue ID remains authoritative; a title is not an edition key.
    if(a.catalogLevel==='edition'&&b.catalogLevel==='edition'&&sourceFamily(a)===sourceFamily(b))return false;
    if (hasSharedExternalId(a, b)) return true;
    if (normalizeType(a.type) !== normalizeType(b.type)) return false;
    if (!canonicalWorkKey(a.title) || canonicalWorkKey(a.title) !== canonicalWorkKey(b.title)) return false;
    // Editorial Arabic novel anchors describe a work, while providers may
    // date a later print edition. Require an exact author and title here.
    var arabicAnchor = /^lorefy-ar-curated-/.test(leftId) || /^lorefy-ar-curated-/.test(rightId);
    var providerEdition = sourceFamily(a) === 'openlibrary' || sourceFamily(b) === 'openlibrary';
    if (arabicAnchor && providerEdition && normalizeType(a.type) === 'novel' &&
      canonicalAuthor(a.auth) && canonicalAuthor(a.auth) === canonicalAuthor(b.auth)) return true;
    if (isComicType(a.type)) {
      var leftRun = comicRunYear(a.title);
      var rightRun = comicRunYear(b.title);
      if (leftRun && rightRun && leftRun !== rightRun) return false;
      if (leftRun && rightRun && leftRun === rightRun) return true;
    }
    var leftCover = coverKey(a);
    var rightCover = coverKey(b);
    if (leftCover && leftCover === rightCover) return true;
    if (authorsMatch(a.auth, b.auth) && yearsClose(a, b, 3)) return true;
    var pair = [sourceFamily(a), sourceFamily(b)].sort().join("|");
    return pair === "anilist|mal" && yearsClose(a, b, 3);
  }

  function providerRank(work) {
    var ranks = { mal: 90, anilist: 80, mangadex: 75, openlibrary: 70, googlebooks: 65, local: 85 };
    return ranks[sourceFamily(work)] || 60;
  }

  function completenessScore(work) {
    var score = providerRank(work) * 1000;
    if (coverKey(work)) score += 220;
    if (String(work && work.synopsis || "").length > 120) score += 180;
    if (Number(work && work.ch) > 0) score += 120;
    if (Number(work && work.vol) > 0) score += 100;
    if (work && Array.isArray(work.genres)) score += Math.min(80, work.genres.length * 10);
    score += Math.min(90, Math.log10(Math.max(1, Number(work && work.pop) || 1)) * 18);
    return score;
  }

  function uniqueValues(values) {
    var seen = new Set();
    return values.filter(function (value) {
      if (value === undefined || value === null || value === "") return false;
      var key = typeof value === "object" ? JSON.stringify(value) : String(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function mergeRecord(primary, incoming, deferMergedIds) {
    if (!primary || !incoming || primary === incoming) return primary;
    var attributionRows=[];
    [primary,incoming].forEach(function(row){
      attributionRows=attributionRows.concat(Array.isArray(row.catalogAttributions)?row.catalogAttributions:[]);
      if(row.sourceUrl)attributionRows.push({source:row.source||row._apiSource||row.pl||'',url:row.sourceUrl,license:row.sourceLicense||''});
    });
    if(attributionRows.length){var seenAttributions=new Set();primary.catalogAttributions=attributionRows.filter(function(row){if(!row||!row.url||seenAttributions.has(row.url))return false;seenAttributions.add(row.url);return true;}).slice(0,20);}
    var comicEditions = null;
    if (isComicType(primary.type) && isComicType(incoming.type) && canonicalWorkKey(primary.title) === canonicalWorkKey(incoming.title)) {
      comicEditions = [];
      function rememberEdition(work) {
        var existing = Array.isArray(work && work._catalogEditions) ? work._catalogEditions : [];
        if (existing.length) {
          existing.forEach(function (edition) { comicEditions.push(edition); });
          return;
        }
        comicEditions.push({
          id: String(work && work.id || ""),
          title: String(work && work.title || ""),
          auth: String(work && work.auth || ""),
          yr: Number(work && work.yr) || 0,
          cover: String(work && (work.sourceCoverUrl || work.cover || work.coverImage) || ""),
          source: sourceFamily(work)
        });
      }
      rememberEdition(primary);
      rememberEdition(incoming);
    }
    Object.keys(incoming).forEach(function (key) {
      if (key === "id" || incoming[key] === undefined || incoming[key] === null) return;
      if (primary[key] === undefined || primary[key] === null || primary[key] === "") primary[key] = incoming[key];
    });
    NUMERIC_MAX_FIELDS.forEach(function (key) {
      var left = Number(primary[key]) || 0;
      var right = Number(incoming[key]) || 0;
      if (right > left) primary[key] = incoming[key];
    });
    ARRAY_FIELDS.forEach(function (key) {
      var left = Array.isArray(primary[key]) ? primary[key] : [];
      var right = Array.isArray(incoming[key]) ? incoming[key] : [];
      if (left.length || right.length) primary[key] = uniqueValues(left.concat(right));
    });
    LONG_TEXT_FIELDS.forEach(function (key) {
      var left = String(primary[key] || "");
      var right = String(incoming[key] || "");
      if (right.length > left.length) primary[key] = incoming[key];
    });
    if ((!primary.ar || normalizeText(primary.ar) === normalizeText(primary.title)) && incoming.ar) primary.ar = incoming.ar;
    if (incoming.sc && typeof incoming.sc === "object") primary.sc = Object.assign({}, incoming.sc, primary.sc || {});
    var covers = [
      primary.sourceCoverUrl, primary.cover, primary.coverImage,
      incoming.sourceCoverUrl, incoming.cover, incoming.coverImage
    ].concat(Array.isArray(primary.alternateCovers) ? primary.alternateCovers : [])
      .concat(Array.isArray(incoming.alternateCovers) ? incoming.alternateCovers : []);
    primary.alternateCovers = uniqueValues(covers);
    primary._catalogSources = uniqueValues(
      (Array.isArray(primary._catalogSources) ? primary._catalogSources : [sourceFamily(primary)])
        .concat(Array.isArray(incoming._catalogSources) ? incoming._catalogSources : [sourceFamily(incoming)])
    );
    if (!deferMergedIds) primary._catalogMergedIds = uniqueValues(
      (Array.isArray(primary._catalogMergedIds) ? primary._catalogMergedIds : [String(primary.id)])
        .concat(Array.isArray(incoming._catalogMergedIds) ? incoming._catalogMergedIds : [String(incoming.id)])
    );
    // Keep the serialized field order stable when a group fills the IDs later.
    else if (!Array.isArray(primary._catalogMergedIds)) primary._catalogMergedIds = [];
    if (comicEditions) {
      var seenEditions = new Set();
      primary._catalogEditions = comicEditions.filter(function (edition) {
        var id = String(edition && edition.id || "");
        if (!id || seenEditions.has(id)) return false;
        seenEditions.add(id);
        return true;
      });
    }
    primary._indexed = false;
    return primary;
  }

  function organizeCatalog(items, options) {
    options = options || {};
    if (!Array.isArray(items)) return { items: [], before: 0, after: 0, duplicatesRemoved: 0, invalidRemoved: 0 };
    var aliases = options.aliases && typeof options.aliases === "object" ? options.aliases : {};
    ALIAS_CACHE.delete(aliases);
    var before = items.length;
    var valid = items.filter(function (work) { return work && work.id && validWorkTitle(work.title, work); });
    var invalidRemoved = before - valid.length;
    var parent = valid.map(function (_, index) { return index; });

    function find(index) {
      while (parent[index] !== index) {
        parent[index] = parent[parent[index]];
        index = parent[index];
      }
      return index;
    }

    function union(a, b) {
      var left = find(a);
      var right = find(b);
      if (left !== right) parent[right] = left;
    }

    var byId = new Map();
    valid.forEach(function (work, index) { byId.set(String(work.id), index); });
    Object.keys(aliases).forEach(function (aliasId) {
      var targetId = canonicalId(aliases[aliasId], aliases);
      if (byId.has(String(aliasId)) && byId.has(String(targetId))) union(byId.get(String(aliasId)), byId.get(String(targetId)));
    });

    var byExternal = new Map();
    valid.forEach(function (work, index) {
      externalKeys(work).forEach(function (key) {
        if (byExternal.has(key)) union(index, byExternal.get(key));
        else byExternal.set(key, index);
      });
    });

    var byTitle = new Map();
    valid.forEach(function (work, index) {
      var key = normalizeType(work.type) + "|" + canonicalWorkKey(work.title);
      if (!byTitle.has(key)) byTitle.set(key, []);
      byTitle.get(key).push(index);
    });

    function yearKeys(work) {
      var year = Number(work && work.yr) || 0;
      if (!year) return ["*"];
      var keys = [];
      for (var offset = -3; offset <= 3; offset += 1) keys.push(String(year + offset));
      return keys;
    }

    function probeIndex(indexMap, key, index) {
      var candidates = indexMap.get(key);
      if (!candidates) return false;
      for (var candidate = 0; candidate < candidates.length; candidate += 1) {
        if (sameWork(valid[index], valid[candidates[candidate]], aliases)) {
          union(index, candidates[candidate]);
          return true;
        }
      }
      return false;
    }

    function rememberIndex(indexMap, key, index) {
      var candidates = indexMap.get(key);
      if (!candidates) {
        indexMap.set(key, [index]);
        return;
      }
      for (var candidate = 0; candidate < candidates.length; candidate += 1) {
        if (sameWork(valid[index], valid[candidates[candidate]], aliases)) {
          union(index, candidates[candidate]);
          return true;
        }
      }
      if (candidates.length < MAX_INDEX_CANDIDATES_PER_KEY) candidates.push(index);
      return false;
    }

    function rememberFirst(indexMap, key, index) {
      if (!indexMap.has(key)) indexMap.set(key, [index]);
    }

    function probeMany(indexMap, keys, index) {
      keys.forEach(function (key) { probeIndex(indexMap, key, index); });
    }

    function authorPairKeys(work) {
      var tokens = uniqueValues(normalizeText(work && work.auth).split(" ")
        .filter(function (token) { return token && token !== "unknown" && token !== "various"; })
        .map(function (token) { return token.replace(/ou$/g, "o"); })).slice(0, MAX_AUTHOR_TOKENS);
      var pairs = [];
      for (var left = 0; left < tokens.length; left += 1) {
        for (var right = left + 1; right < tokens.length; right += 1) {
          pairs.push(tokens[left] + "\u0001" + tokens[right]);
          if (pairs.length >= MAX_AUTHOR_PAIRS) return pairs;
        }
      }
      return pairs;
    }

    byTitle.forEach(function (indexes) {
      // Small title groups need full comparisons, including long coauthor lists.
      if (indexes.length <= MAX_INDEX_CANDIDATES_PER_KEY) {
        for (var left = 0; left < indexes.length; left += 1) {
          for (var right = left + 1; right < indexes.length; right += 1) {
            if (sameWork(valid[indexes[left]], valid[indexes[right]], aliases)) union(indexes[left], indexes[right]);
          }
        }
        return;
      }
      /* Index only signals that can make sameWork true. This keeps hostile
         same-title groups near-linear instead of comparing every pair. */
      var covers = new Map();
      var authors = new Map();
      var authorPairs = new Map();
      var authorPairAny = new Map();
      var authorAny = new Map();
      var providers = new Map();
      var providerAny = new Map();
      indexes.forEach(function (index) {
        var work = valid[index];
        var years = yearKeys(work);
        var knownYear = years[0] !== "*";
        var cover = coverKey(work);
        if (cover) {
          probeIndex(covers, cover, index);
          rememberIndex(covers, cover, index);
        }

        var author = canonicalAuthor(work.auth);
        if (author) {
          if (knownYear) {
            probeMany(authors, years.concat(["*"]).map(function (year) { return author + "|" + year; }), index);
          } else {
            probeIndex(authorAny, author, index);
          }
          rememberFirst(authorAny, author, index);
          rememberIndex(authors, author + "|" + (knownYear ? String(Number(work.yr)) : "*"), index);
          authorPairKeys(work).forEach(function (pair) {
            if (knownYear) {
              probeMany(authorPairs, years.concat(["*"]).map(function (year) { return pair + "|" + year; }), index);
            } else {
              probeIndex(authorPairAny, pair, index);
            }
            rememberIndex(authorPairAny, pair, index);
            rememberIndex(authorPairs, pair + "|" + (knownYear ? String(Number(work.yr)) : "*"), index);
          });
        }

        var family = sourceFamily(work);
        if (family === "mal" || family === "anilist") {
          var opposite = family === "mal" ? "anilist" : "mal";
          if (knownYear) {
            probeMany(providers, years.concat(["*"]).map(function (year) { return opposite + "|" + year; }), index);
          } else {
            probeIndex(providerAny, opposite, index);
          }
          rememberFirst(providerAny, family, index);
          rememberIndex(providers, family + "|" + (knownYear ? String(Number(work.yr)) : "*"), index);
        }
      });
    });

    var groups = new Map();
    valid.forEach(function (work, index) {
      var root = find(index);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(work);
    });

    var aliasTargets = new Set(Object.keys(aliases).map(function (key) { return canonicalId(aliases[key], aliases); }));
    var organized = [];
    var duplicatesRemoved = 0;
    groups.forEach(function (group) {
      group.sort(function (a, b) {
        var aTarget = aliasTargets.has(String(a.id)) ? 1 : 0;
        var bTarget = aliasTargets.has(String(b.id)) ? 1 : 0;
        if (aTarget !== bTarget) return bTarget - aTarget;
        return completenessScore(b) - completenessScore(a);
      });
      var primary = group[0];
      // Deduplicate merged references once per group. Rebuilding this growing
      // array for every duplicate made large same-title groups quadratic.
      var mergedIds = [];
      var initialIds = primary._catalogMergedIds;
      if (group.length > 1 && (initialIds === undefined || initialIds === null || initialIds === "") && Array.isArray(group[1]._catalogMergedIds)) initialIds = group[1]._catalogMergedIds;
      if (group.length > 1) (Array.isArray(initialIds) ? initialIds : [String(primary.id)]).forEach(function(id) { mergedIds.push(id); });
      if (group.length > 1) group.slice(1).forEach(function(work) {
        var ids = Array.isArray(work._catalogMergedIds) ? work._catalogMergedIds : [String(work.id)];
        ids.forEach(function(id) { mergedIds.push(id); });
      });
      for (var i = 1; i < group.length; i += 1) {
        var duplicate = group[i];
        aliases[String(duplicate.id)] = String(primary.id);
        mergeRecord(primary, duplicate, true);
        duplicatesRemoved += 1;
      }
      if (group.length > 1) primary._catalogMergedIds = uniqueValues(mergedIds);
      primary._catalogIdentityKey = normalizeType(primary.type) + "|" + canonicalWorkKey(primary.title);
      organized.push(primary);
    });

    Object.keys(aliases).forEach(function (aliasId) {
      aliases[aliasId] = canonicalId(aliases[aliasId], aliases);
    });
    // Mobile engines have lower function argument limits than desktop Node.
    items.length = organized.length;
    for (var outputIndex = 0; outputIndex < organized.length; outputIndex += 1) {
      items[outputIndex] = organized[outputIndex];
    }
    return {
      items: items,
      before: before,
      after: items.length,
      duplicatesRemoved: duplicatesRemoved,
      invalidRemoved: invalidRemoved,
      aliasesAdded: duplicatesRemoved
    };
  }

  function uniqueWorks(items, options) {
    var copy = Array.isArray(items) ? items.slice() : [];
    organizeCatalog(copy, options || {});
    return copy;
  }

  function relatedWorks(current, items, aliases) {
    return uniqueWorks((items || []).filter(function (work) {
      if (!work || sameWork(current,work,aliases)) return false;
      return !(canonicalWorkKey(current.title) === canonicalWorkKey(work.title) && authorsMatch(current.auth,work.auth));
    }), {aliases:aliases || {}});
  }

  return {
    normalizeText: normalizeText,
    canonicalWorkKey: canonicalWorkKey,
    validWorkTitle: validWorkTitle,
    sameWork: sameWork,
    relatedWorks: relatedWorks,
    mergeRecord: mergeRecord,
    organizeCatalog: organizeCatalog,
    uniqueWorks: uniqueWorks,
    sourceFamily: sourceFamily
  };
});

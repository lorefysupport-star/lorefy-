(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LorefyCatalogPlan = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var TYPE_ALIASES = {
    Manga: "Manga",
    "مانجا": "Manga",
    Manhwa: "Manhwa",
    "مانهوا": "Manhwa",
    Manhua: "Manhua",
    "\u0645\u0627\u0646\u0647\u0648\u0627 \u0635\u064a\u0646\u064a": "Manhua",
    "مانهوا صيني": "Manhua",
    "مانهوا صينية": "Manhua",
    Comics: "Comics",
    "كوميكس": "Comics",
    Novel: "Novel",
    "رواية": "Novel",
    Book: "Book",
    "كتاب": "Book",
    "Light Novel": "Light Novel",
    "لايت نوفل": "Light Novel",
    "Web Novel": "Web Novel",
    "ويب نوفل": "Web Novel"
  };

  function normalizeRouteType(value) {
    var text = String(value || "").replace(/\+/g, " ").trim();
    try { text = decodeURIComponent(text); } catch (error) {}
    return TYPE_ALIASES[text] || "Manga";
  }

  function uniqueParts(parts) {
    var seen = new Set();
    return (Array.isArray(parts) ? parts : []).map(Number).filter(function (part) {
      if (!Number.isInteger(part) || part < 1 || seen.has(part)) return false;
      seen.add(part);
      return true;
    });
  }

  function typeParts(manifest, type) {
    var normalized = normalizeRouteType(type);
    var configured = manifest && manifest.types && manifest.types[normalized];
    return uniqueParts(configured && configured.length ? configured : manifest && manifest.featuredParts);
  }

  function initialCatalogPlan(manifest, route) {
    route = route || {};
    var directPart = manifest && manifest.workParts && manifest.workParts[String(route.workId || "")];
    if (directPart) return uniqueParts([directPart]);
    return typeParts(manifest, route.type).slice(0, 1);
  }

  function remainingCatalogPlan(manifest, type, loadedParts) {
    loadedParts = loadedParts instanceof Set ? loadedParts : new Set(loadedParts || []);
    return typeParts(manifest, type).filter(function (part) { return !loadedParts.has(part); });
  }

  function allCatalogParts(manifest) {
    manifest = manifest || {};
    var count = Number(manifest.partCount) || 0;
    if (count > 0) {
      var numbered = [];
      for (var part = 1; part <= count; part += 1) numbered.push(part);
      return numbered;
    }
    var configured = [];
    Object.keys(manifest.types || {}).forEach(function (type) {
      configured = configured.concat(manifest.types[type] || []);
    });
    return uniqueParts(configured.concat(manifest.featuredParts || [])).sort(function (a, b) { return a - b; });
  }

  function searchIndexParts(entries, query, type, searchApi) {
    var normalized = searchApi.normalizeQuery(query);
    if (!normalized) return [];
    var selectedType = type && type !== "All" ? normalizeRouteType(type) : "";
    var found = new Map();
    (entries || []).forEach(function (entry) {
      var work = entry.work;
      if (selectedType && normalizeRouteType(work.type) !== selectedType) return;
      if (!searchApi.matchesCatalogQuery(work, query)) return;
      var title = searchApi.normalizeQuery(work.title);
      var arabic = searchApi.normalizeQuery(work.ar);
      var score = title === normalized || arabic === normalized ? 100
        : title.startsWith(normalized) || arabic.startsWith(normalized) ? 70
        : title.includes(normalized) || arabic.includes(normalized) ? 40 : 10;
      var current = found.get(entry.part) || { part: entry.part, count: 0, score: 0 };
      current.count += 1;
      current.score = Math.max(current.score, score);
      found.set(entry.part, current);
    });
    return Array.from(found.values()).sort(function (a, b) {
      return b.score - a.score || b.count - a.count || a.part - b.part;
    });
  }

  // Conservative recovery: one insertion, omission, substitution or adjacent
  // transposition in a full title/alias. Suggestions are queries, never works
  // or edition IDs; the exact matcher remains the authority for results.
  function oneEditApart(a, b) {
    if (Math.abs(a.length - b.length) > 1 || a === b) return false;
    var i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (a.length !== b.length) {
      return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
    }
    return a.slice(i + 1) === b.slice(i + 1)
      || a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }

  function suggestCatalogQueries(entries, query, type, searchApi) {
    var normalized = searchApi.normalizeQuery(query);
    // Avoid guessing from very short text or spending unbounded work on a draft.
    if (normalized.length < 5 || normalized.length > 80) return [];
    var selectedType = type && type !== 'All' ? normalizeRouteType(type) : '';
    var candidates = new Map();
    (entries || []).forEach(function (entry) {
      var work = entry && entry.work;
      if (!work || !work.id || selectedType && normalizeRouteType(work.type) !== selectedType) return;
      var titles = [work.title, work.ar];
      // Only textual title aliases; do not turn arbitrary metadata into a query.
      [work.altTitles, work.aliases].forEach(function (aliases) {
        if (typeof aliases === 'string') titles.push(aliases);
        else if (Array.isArray(aliases)) aliases.forEach(function (alias) { if (typeof alias === 'string') titles.push(alias); });
      });
      titles.forEach(function (title) {
        if (typeof title !== 'string') return;
        var text = searchApi.normalizeQuery(title);
        if (!oneEditApart(normalized, text) || candidates.has(text)) return;
        candidates.set(text, title.trim());
      });
    });
    return Array.from(candidates.keys()).sort().slice(0, 3).map(function (key) { return candidates.get(key); });
  }

  function searchIndexResult(entries, query, type, searchApi, withSuggestions) {
    var matches = searchIndexParts(entries, query, type, searchApi);
    return { matches: matches, suggestions: !matches.length && withSuggestions !== false
      ? suggestCatalogQueries(entries, query, type, searchApi) : [] };
  }

  function shouldWaitForInteraction(lastInteractionAt, now, quietWindowMs) {
    var last = Number(lastInteractionAt) || 0;
    var current = Number(now) || 0;
    var quietWindow = Math.max(0, Number(quietWindowMs) || 0);
    return last > 0 && current - last < quietWindow;
  }

  function pickFeaturedWork(personalized, topRated, newReleases, filtered, catalog) {
    var groups = [personalized, topRated, newReleases, filtered, catalog];
    var fallback = null;
    for (var index = 0; index < groups.length; index += 1) {
      if (!Array.isArray(groups[index])) continue;
      if (!fallback && groups[index][0]) fallback = groups[index][0];
      var sourced = groups[index].find(function (work) { return work && !work._catalogEstimated; });
      if (sourced) return sourced;
    }
    return fallback;
  }

  function preserveReadingTotals(incoming, existing, aliases) {
    aliases = aliases || {};
    var byId = new Map((incoming || []).map(function (work) { return [String(work.id), work]; }));
    (existing || []).forEach(function (work) {
      if (!work) return;
      var target = byId.get(String(aliases[work.id] || work.id));
      if (!target) return;
      [['ch','chapters','chapterCount','chapter_count','totalChapters','total_chapters','numChapters','latestChapter','lastChapter'],
        ['pages','pageCount','page_count','totalPages','total_pages','numPages'],
        ['vol','volumes','volumeCount','volume_count','totalVolumes','total_volumes']].forEach(function (keys) {
        if (keys.some(function (key) { return Number.isFinite(Number(target[key])) && Number(target[key]) > 0; })) return;
        keys.forEach(function (key) {
          var value = Number(work[key]);
          if (Number.isFinite(value) && value > 0) target[key] = value;
        });
      });
    });
    return incoming;
  }

  return {
    preserveReadingTotals: preserveReadingTotals,
    normalizeRouteType: normalizeRouteType,
    initialCatalogPlan: initialCatalogPlan,
    remainingCatalogPlan: remainingCatalogPlan,
    allCatalogParts: allCatalogParts,
    searchIndexParts: searchIndexParts,
    searchIndexResult: searchIndexResult,
    shouldWaitForInteraction: shouldWaitForInteraction,
    pickFeaturedWork: pickFeaturedWork,
    typeParts: typeParts,
    uniqueParts: uniqueParts
  };
});

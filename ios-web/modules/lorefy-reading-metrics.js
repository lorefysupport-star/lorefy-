(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LorefyReadingMetrics = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function normalizeProgress(value) {
    if (typeof value === "number") {
      return { chapter: Math.max(0, value || 0), volume: 0, page: 0, note: "" };
    }
    value = value && typeof value === "object" ? value : {};
    return {
      chapter: Math.max(0, Number(value.chapter !== undefined ? value.chapter : value.ch) || 0),
      volume: Math.max(0, Number(value.volume !== undefined ? value.volume : value.vol) || 0),
      page: Math.max(0, Number(value.page) || 0),
      note: String(value.note || "")
    };
  }

  function effectiveProgress(work, value, status, metadata) {
    var progress = normalizeProgress(value);
    if (/^(تم(?:ت)? القراءة|completed|done)$/i.test(String(status || '').trim())) {
      metadata = metadata || work;
      progress.chapter = positiveNumber(metadata, ['ch', 'chapters', 'chapterCount', 'chapter_count', 'totalChapters', 'latestChapter']) || progress.chapter;
      progress.page = positiveNumber(metadata, ['pages', 'pageCount', 'page_count', 'totalPages']) || progress.page;
      progress.volume = positiveNumber(metadata, ['vol', 'volumes', 'volumeCount', 'totalVolumes']) || progress.volume;
    }
    return progress;
  }

  function calculateReadingMetrics(options) {
    options = options || {};
    var library = options.library && typeof options.library === "object" ? options.library : {};
    var progressById = options.progressById && typeof options.progressById === "object" ? options.progressById : {};
    var getWork = typeof options.getWork === "function" ? options.getWork : function () { return null; };
    var totals = { chapters: 0, pages: 0, volumes: 0 };
    var minutes = 0;

    Object.keys(library).forEach(function (id) {
      var work = getWork(id);
      var metadata = work && typeof options.getTotals === 'function' ? options.getTotals(work) : work;
      var progress = effectiveProgress(work, progressById[id], library[id], metadata);
      totals.chapters += progress.chapter;
      totals.pages += progress.page;
      totals.volumes += progress.volume;
      // These are alternate representations of one work, not additional reading.
      minutes += progress.chapter ? progress.chapter * 12 : progress.page ? progress.page * 1.5 : progress.volume * 90;
    });

    minutes = Math.round(minutes);
    return {
      chapters: totals.chapters,
      pages: totals.pages,
      volumes: totals.volumes,
      minutes: minutes,
      hours: minutes > 0 ? Math.max(1, Math.round(minutes / 60)) : 0
    };
  }

  function checkpointChapterDelta(previous, next) {
    return Math.max(0, normalizeProgress(next).chapter - normalizeProgress(previous).chapter);
  }

  function positiveNumber(value, keys) {
    for (var index = 0; index < keys.length; index += 1) {
      var number = Number(value && value[keys[index]]);
      if (Number.isFinite(number) && number > 0) return number;
    }
    return 0;
  }

  function sanitizeLegacyProgress(options) {
    options = options || {};
    var library = options.library && typeof options.library === "object" ? options.library : {};
    var progressById = options.progressById && typeof options.progressById === "object" ? options.progressById : {};
    var getWork = typeof options.getWork === "function" ? options.getWork : function () { return null; };
    var completedStatus = String(options.completedStatus || "");
    var cleaned = Object.assign({}, progressById);
    var removedIds = [];
    var pendingIds = [];

    Object.keys(progressById).forEach(function (id) {
      if (String(library[id] || "") !== completedStatus) return;
      var raw = progressById[id];
      var progress = normalizeProgress(raw);
      if (progress.note.trim()) return;
      var work = getWork(id);
      if (!work) {
        pendingIds.push(id);
        return;
      }
      var totals = {
        chapter: positiveNumber(work, ["ch", "chapters", "chapterCount", "totalChapters"]),
        volume: positiveNumber(work, ["vol", "volumes", "volumeCount", "totalVolumes"]),
        page: positiveNumber(work, ["pages", "pageCount", "totalPages"])
      };
      var compared = 0;
      var mismatch = false;
      ["chapter", "volume", "page"].forEach(function (key) {
        if (!totals[key]) return;
        compared += 1;
        if (progress[key] !== totals[key]) mismatch = true;
      });
      if (!compared) {
        if (progress.chapter || progress.volume || progress.page) pendingIds.push(id);
        return;
      }
      if (mismatch || !(progress.chapter || progress.volume || progress.page)) return;
      delete cleaned[id];
      removedIds.push(id);
    });

    return { progressById: cleaned, removedIds: removedIds, pendingIds: pendingIds };
  }

  return {
    normalizeProgress: normalizeProgress,
    checkpointChapterDelta: checkpointChapterDelta,
    effectiveProgress: effectiveProgress,
    calculateReadingMetrics: calculateReadingMetrics,
    sanitizeLegacyProgress: sanitizeLegacyProgress
  };
});

(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LorefyReadingMetrics = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function finiteCount(value) {
    var number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  }

  function normalizeProgress(value) {
    if (typeof value === "number") {
      return { chapter: finiteCount(value), volume: 0, page: 0, note: "" };
    }
    value = value && typeof value === "object" ? value : {};
    return {
      chapter: finiteCount(value.chapter !== undefined ? value.chapter : value.ch),
      volume: finiteCount(value.volume !== undefined ? value.volume : value.vol),
      page: finiteCount(value.page),
      note: String(value.note || "")
    };
  }

  function effectiveProgress(work, value, status, metadata) {
    return normalizeProgress(value);
  }

  // Catalog totals are captured on completion, never inferred during rendering.
  function completionCheckpoint(work, value, metadata) {
    var progress = normalizeProgress(value);
    metadata = metadata || work;
    progress.chapter = Math.max(progress.chapter, positiveNumber(metadata, ['ch', 'chapters', 'chapterCount', 'chapter_count', 'totalChapters', 'latestChapter']));
    progress.page = Math.max(progress.page, positiveNumber(metadata, ['pages', 'pageCount', 'page_count', 'totalPages']));
    progress.volume = Math.max(progress.volume, positiveNumber(metadata, ['vol', 'volumes', 'volumeCount', 'totalVolumes']));
    return progress;
  }

  function initializeCompletedProgress(options) {
    options = options || {};
    var library = options.library || {}, saved = options.progressById || {};
    var next = saved, changedIds = [], pendingIds = [];
    Object.keys(library).forEach(function (id) {
      if (!/^(تم(?:ت)? القراءة|completed|done)$/i.test(String(library[id] || '').trim())) return;
      if (Object.prototype.hasOwnProperty.call(saved, id)) return;
      var work = typeof options.getWork === 'function' ? options.getWork(id) : null;
      var totals = work && typeof options.getTotals === 'function' ? options.getTotals(work) : work;
      var progress = completionCheckpoint(work, null, totals);
      if (!(progress.chapter || progress.page || progress.volume)) { pendingIds.push(id); return; }
      if (next === saved) next = Object.assign({}, saved);
      next[id] = progress;
      changedIds.push(id);
    });
    return {progressById:next, changedIds:changedIds, pendingIds:pendingIds};
  }

  function calculateReadingMetrics(options) {
    options = options || {};
    var library = options.library && typeof options.library === "object" ? options.library : {};
    var progressById = options.progressById && typeof options.progressById === "object" ? options.progressById : {};
    var totals = { chapters: 0, pages: 0, volumes: 0 };
    var minutes = 0;

    Object.keys(library).forEach(function (id) {
      var progress = normalizeProgress(progressById[id]);
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
    // Compatibility for older callers: matching a catalog total is not proof of fabricated progress.
    return {progressById:options && options.progressById || {}, removedIds:[], pendingIds:[]};
  }

  // A review can fill a missing legacy library entry, but must never overwrite a reader's choice.
  function seedReviewedWorks(library, reviewIds, removed, completedStatus) {
    var next = library, owns = Object.prototype.hasOwnProperty;
    (reviewIds || []).forEach(function (id) {
      id=String(id || '');
      if (!id || removed && removed[id] || owns.call(next,id)) return;
      if (next===library) next=Object.assign({},library);
      next[id]=completedStatus;
    });
    return next;
  }

  return {
    seedReviewedWorks: seedReviewedWorks,
    normalizeProgress: normalizeProgress,
    checkpointChapterDelta: checkpointChapterDelta,
    effectiveProgress: effectiveProgress,
    completionCheckpoint: completionCheckpoint,
    initializeCompletedProgress: initializeCompletedProgress,
    calculateReadingMetrics: calculateReadingMetrics,
    sanitizeLegacyProgress: sanitizeLegacyProgress
  };
});

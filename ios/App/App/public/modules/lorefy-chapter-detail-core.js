(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyChapterDetailCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function positive(value) {
    var number = Number(value);
    return Number.isSafeInteger(number) && number > 0 && number <= 100000 ? number : 0;
  }

  function total(work, metadata) {
    var text = String(metadata || '').replace(/[٠-٩]/g, function (digit) { return String(digit.charCodeAt(0) - 0x660); })
      .replace(/[۰-۹]/g, function (digit) { return String(digit.charCodeAt(0) - 0x6f0); });
    var match = text.match(/(?:^|[^\d])([\d,]+)\s*فصل(?:\s|$)/);
    var displayed = match ? positive(Number(match[1].replace(/,/g, ''))) : 0;
    return displayed || positive(work && (work.chapters || work.chapterCount || work.totalChapters || work.ch)) || 0;
  }

  function validChapter(chapter, count) {
    var number = positive(chapter);
    return !!number && (!positive(count) || number <= count);
  }

  function range(count, selected) {
    var limit = positive(count);
    if (!limit) return { start: 0, end: 0 };
    var chapter = validChapter(selected, limit) ? Number(selected) : 1;
    var start = Math.floor((chapter - 1) / 10) * 10 + 1;
    return { start: start, end: Math.min(limit, start + 9) };
  }

  function knownChapters(reviews) {
    return Object.keys(reviews || {}).map(Number).filter(function (chapter) { return validChapter(chapter, 0); }).sort(function (a, b) { return a - b; });
  }

  function visibleChapters(count, selected, numbers, reviews) {
    if (!positive(count)) return knownChapters(reviews);
    var span = range(count, selected);
    if (Array.isArray(numbers)) return numbers.filter(function (number) {
      return validChapter(number, count) && number >= span.start && number <= span.end;
    });
    return Array.from({ length: span.end - span.start + 1 }, function (_, index) { return span.start + index; });
  }

  function latestReviewChapter(reviews, count) {
    return Object.keys(reviews || {}).map(Number).filter(function (chapter) {
      return validChapter(chapter, count) && reviews[chapter] &&
        (reviews[chapter].rating || reviews[chapter].comment);
    }).sort(function (a, b) {
      return (Number(reviews[b].updatedAt) || 0) - (Number(reviews[a].updatedAt) || 0) || b - a;
    })[0] || 0;
  }

  function save(existing, workId, chapter, rating, comment, spoiler, at, count) {
    var id = String(workId || '').trim();
    var score = Number(rating);
    var body = String(comment || '').trim();
    if (!id || !validChapter(chapter, count) || !Number.isFinite(score) || !Number.isInteger(score * 4) || score < 0 || score > 5 || (!score && !body) || body.length > 1000) return null;
    var result = Object.assign({}, existing || {});
    result[id] = Object.assign({}, result[id] || {});
    result[id][String(Number(chapter))] = { rating: score, comment: body, spoiler: !!spoiler, updatedAt: Number(at) || Date.now() };
    return result;
  }

  function updateReading(state, workId, chapter, count, finished) {
    var id = String(workId || '').trim();
    if (!id || !positive(count) || !validChapter(chapter, count)) return null;
    var library = Object.assign({}, state && state.library || {});
    var progress = Object.assign({}, state && state.progress || {});
    progress[id] = Object.assign({}, progress[id] || {}, {chapter:Number(chapter)});
    library[id] = finished && Number(chapter) === Number(count) ? 'تم القراءة' : 'أقرأ حالياً';
    return {library:library, progress:progress};
  }
  function isFinished(work, verifiedSource) {
    return /^(completed|finished|مكتملة|مكتمل)$/i.test(String(verifiedSource && verifiedSource.status || work && (work.st || work.status) || '').trim());
  }
  function nextUnread(progress, count) {
    if (!positive(count)) return 0;
    var read = positive(typeof progress === 'number' ? progress : progress && (progress.chapter || progress.ch)) || 0;
    return read >= count ? 0 : read + 1;
  }
  function persistReading(storage, state) {
    var keys = ['lorefy.user.progress.v2','lorefy.user.library.v2'];
    var old = keys.map(function (key) { return storage.getItem(key); });
    try {
      storage.setItem(keys[0],JSON.stringify(state.progress));
      storage.setItem(keys[1],JSON.stringify(state.library));
    } catch (error) {
      keys.forEach(function (key,index) {
        if (old[index] === null) storage.removeItem(key); else storage.setItem(key,old[index]);
      });
      throw error;
    }
  }
  return { total: total, validChapter: validChapter, range: range, knownChapters: knownChapters, visibleChapters: visibleChapters, latestReviewChapter: latestReviewChapter, save: save, updateReading:updateReading, nextUnread:nextUnread, persistReading:persistReading, isFinished:isFinished };
});

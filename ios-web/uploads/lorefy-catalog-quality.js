(function (global) {
  'use strict';

  function apply(records) {
    records = Array.isArray(records) ? records : [];
    if (global.LorefyCatalogPolicy) global.LorefyCatalogPolicy.filterInPlace(records);
    var corrected = 0;
    var comics = global.LorefyComicsTaxonomy;
    if (comics && typeof comics.apply === 'function') comics.apply(records);
    records.forEach(function (work) {
      if (!work || typeof work !== 'object') return;
      if (work.type === 'مانهوا صينية' || /^manhua$/i.test(String(work.type || ''))) {
        work.type = 'مانهوا صيني';
        work._indexed = false;
        corrected += 1;
      }
      var mangaDex = /^md-/i.test(String(work.id || '')) || /mangadex/i.test(String(work._apiSource || work.pl || ''));
      var unattributedWebNovel = /^fwn-novel-/i.test(String(work.id || '')) && !String(work.rSrc || '').trim();
      if (mangaDex || unattributedWebNovel) {
        ['r', 'pop', 'baseRatings', 'baseReviews', 'weeklyReads', 'listAdds'].forEach(function (field) { work[field] = 0; });
        work.rSrc = '';
        work.sc = {};
        work.rec = false;
        work._catalogEstimated = true;
        work._catalogEstimatedEngagement = true;
      }
      var openLibrary = /^(?:ol-|ol_)/i.test(String(work.id || '')) || /open library/i.test(String(work.pl || ''));
      var declaredEstimate = /^(?:تقدير(?: Lorefy)?|estimate(?:d)?(?: Lorefy)?|synthetic)$/i.test(String(work.rSrc || '').trim());
      var estimated = declaredEstimate || (openLibrary && !work.rSrc);
      if (openLibrary) {
        ['pop', 'baseRatings', 'baseReviews', 'weeklyReads', 'listAdds'].forEach(function (field) { work[field] = 0; });
        if (work.sc && typeof work.sc === 'object') {
          Object.keys(work.sc).forEach(function (field) { work.sc[field] = 0; });
        }
        work.rec = false;
        work._catalogEstimatedEngagement = true;
      }
      if (estimated) {
        ['r', 'pop', 'baseRatings', 'baseReviews', 'weeklyReads', 'listAdds'].forEach(function (field) { work[field] = 0; });
        work.rSrc = '';
        work.sc = {};
        work.rec = false;
        work._catalogEstimated = true;
        work._catalogEstimatedEngagement = true;
        corrected += 1;
      }
      if (openLibrary && (/This Lorefy entry includes source rating, reading progress, lists, reviews, and community discovery\./i.test(String(work.synopsis || '')) ||
        /^«[^»]+» (?:عمل مصوّر|رواية|كتاب|مانجا|مانهوا)/.test(String(work.synopsis || '')))) {
        work.synopsis = '';
      }
      if (/\.\s*متاح ضمن فهرس مكتبة جرير في تصنيف [^.]+\.$/.test(String(work.synopsis || ''))) work.synopsis = '';
      if (global.LorefyBibliographicOverrides && global.LorefyBibliographicOverrides.apply(work)) corrected += 1;
    });
    return corrected;
  }

  var corrected = apply(global.LorefyMangaData);

  global.LorefyCatalogQuality = {
    schema: 1,
    version: '2026-10-08-library-quality-v5',
    correctedSyntheticRatings: corrected,
    apply: apply
  };
})(window);

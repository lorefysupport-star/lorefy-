(function (global) {
  'use strict';

  var COMICS = '\u0643\u0648\u0645\u064a\u0643\u0633';
  var MANGA = '\u0645\u0627\u0646\u062c\u0627';
  var NOVEL = '\u0631\u0648\u0627\u064a\u0629';
  var BOOK = '\u0643\u062a\u0627\u0628';
  var adaptationYears = Object.create(null);

  function titleKey(title, author) {
    return String(title || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + '|' +
      String(author || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  function openLibrarySource(work) {
    return /open library/i.test([work && work.pl, work && work.source, work && work.sourceName].filter(Boolean).join(' '));
  }

  function originalWithLaterGraphicEdition(work) {
    if (!openLibrarySource(work) || publisherFor(work).publisher !== 'Other') return false;
    if (/\bgraphic novel\b/i.test(String(work.title || ''))) return false;
    var year = Number(work.yr || work.year) || 0;
    var adaptationYear = adaptationYears[titleKey(work.title, work.auth || work.author)];
    return year > 0 && adaptationYear > year;
  }

  function eastAsianManga(work) {
    if (!openLibrarySource(work)) return false;
    var author = String(work.auth || work.author || '');
    var title = String(work.title || '');
    return /[\u3040-\u30ff]/u.test(author + title) ||
      /^(?:CLAMP|Kazuki Takahashi|高田\s*裕三)$/i.test(author.trim()) ||
      /^(?:Yoshihiro\s+Togashi|Togashi,?\s+Yoshihiro)$/i.test(author.trim()) &&
        /^(?:Hunter\s*[x×]\s*Hunter|Yu\s*Yu\s*Hakusho|Yuyu\s*Hakusho)(?:\b|\s)/i.test(title);
  }

  function text(work) {
    work = work || {};
    return [work.title, work.ar, work.originalTitle, work.auth, work.author,
      work.synopsis, work.description,
      Array.isArray(work.gen) ? work.gen.join(' ') : work.gen,
      Array.isArray(work.genres) ? work.genres.join(' ') : work.genres,
      Array.isArray(work.tags) ? work.tags.join(' ') : work.tags,
      Array.isArray(work.subjects) ? work.subjects.join(' ') : work.subjects]
      .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  function normalized(work) { return text(work).toLowerCase(); }

  function isComics(work) {
    var type = String((work && work.type) || '');
    return type === COMICS || /^comics?$/i.test(type);
  }

  var MARVEL_UNIVERSES = [
    ['spider-man', /\b(?:spider[- ]?man|spiderman|miles morales|gwen stacy)\b/i],
    ['x-men', /\b(?:x[- ]?men|wolverine|cyclops|magneto|mutants?)\b/i],
    ['avengers', /\b(?:avengers?|black widow|hawkeye)\b/i],
    ['iron-man', /\biron man\b/i], ['thor', /\bthor\b/i], ['hulk', /\b(?:hulk|she-hulk)\b/i],
    ['captain-america', /\bcaptain america\b/i], ['daredevil', /\b(?:daredevil|elektra)\b/i],
    ['fantastic-four', /\bfantastic four\b/i], ['guardians', /\bguardians? of the galaxy\b/i],
    ['deadpool', /\bdeadpool\b/i], ['black-panther', /\bblack panther\b/i],
    ['doctor-strange', /\bdoctor strange\b/i], ['captain-marvel', /\b(?:captain marvel|ms\. marvel)\b/i],
    ['loki', /\bloki\b/i]
  ];
  var DC_UNIVERSES = [
    ['batman', /\b(?:batman|bruce wayne|gotham|nightwing|catwoman|joker|harley quinn|robin)\b/i],
    ['superman', /\b(?:superman|clark kent|kryptonian)\b/i], ['wonder-woman', /\b(?:wonder woman|diana prince)\b/i],
    ['justice-league', /\bjustice league\b/i], ['green-lantern', /\bgreen lantern\b/i],
    ['flash', /\b(?:the )?flash\b/i], ['aquaman', /\baquaman\b/i], ['shazam', /\bshazam\b/i],
    ['teen-titans', /\bteen titans?\b/i], ['suicide-squad', /\bsuicide squad\b/i],
    ['watchmen', /\bwatchmen\b/i], ['sandman', /\bthe sandman\b/i], ['swamp-thing', /\bswamp thing\b/i]
  ];
  var OTHER_UNIVERSES = [
    ['walking-dead', /\bthe walking dead\b/i], ['invincible', /\binvincible\b/i],
    ['teenage-mutant-ninja-turtles', /\b(?:teenage mutant ninja turtles|tmnt)\b/i], ['hellboy', /\bhellboy\b/i],
    ['saga', /^saga(?:\b|,)/i], ['spawn', /\bspawn\b/i], ['the-boys', /\bthe boys\b/i],
    ['v-for-vendetta', /\bv for vendetta\b/i], ['archies', /\barchie(?:s)?\b/i], ['peanuts', /\bpeanuts\b/i],
    ['calvin-and-hobbes', /\bcalvin (?:and|&) hobbes\b/i], ['asterix', /\basterix\b/i], ['tintin', /\btintin\b/i]
  ];

  function universeFor(value, groups) {
    for (var i = 0; i < groups.length; i += 1) if (groups[i][1].test(value)) return groups[i][0];
    return '';
  }

  function publisherFor(work) {
    var value = normalized(work);
    var marvel = universeFor(value, MARVEL_UNIVERSES);
    if (marvel || /\bmarvel(?: comics)?\b/i.test(value)) return { publisher: 'Marvel', universe: marvel };
    var dc = universeFor(value, DC_UNIVERSES);
    if (dc || /\b(?:dc comics|vertigo)\b/i.test(value)) return { publisher: 'DC', universe: dc };
    return { publisher: 'Other', universe: universeFor(value, OTHER_UNIVERSES) };
  }

  function explicitReferenceBook(value) {
    return /\b(?:how to (?:draw|write)|guide to|guide for|price guide|encyclopedia|history of|history and criticism|readers?'? advisory|cambridge (?:history|companion)|what is a graphic novel|art of (?:the )?|drawing (?:comics|manga)|creating a graphic novel)\b/i.test(value);
  }
  function explicitTextNovel(value) {
    var comicMarkers = /\b(?:graphic novel|comic book|comics|cartoon|manga|manhwa|manhua)\b/i;
    return !comicMarkers.test(value) && /\b(?:movie novel|official .* novel|novelization|light novel)\b/i.test(value);
  }
  function explicitMangaGuide(value) {
    return /\bmanga\b/i.test(value) && /\b(?:guide|how to|history|drawing|art of|representation|vision|in america|de yomu)\b/i.test(value);
  }
  function explicitManga(value) {
    return /\bmanga\b/i.test(value) && !explicitMangaGuide(value) && !/\b(?:guide|how to|history|drawing|art of)\b/i.test(value);
  }

  function mangaDexSource(work) {
    return /mangadex/i.test([work && work.pl, work && work.source, work && work.sourceName, work && work.sourceCoverUrl]
      .filter(Boolean).join(' '));
  }

  var CLASSIC_ORIGINALS = [
    [/^robinson crusoe$/i, /\bdaniel defoe\b/i],
    [/^the adventures of tom sawyer$/i, /\bmark twain\b/i],
    [/^(?:william shakespeare'?s )?a midsummer night'?s dream$/i, /\bwilliam shakespeare\b/i],
    [/^romeo and juliet(?:,\s*\d{4})?$/i, /\bwilliam shakespeare\b/i],
    [/^(?:the )?tempest$/i, /\bwilliam shakespeare\b/i],
    [/^hamlet(?:,\s*\d{4})?$/i, /\bwilliam shakespeare\b/i],
    [/^macbeth(?:,\s*\d{4})?$/i, /\bwilliam shakespeare\b/i],
    [/^othello(?:,\s*\d{4})?$/i, /\bwilliam shakespeare\b/i],
    [/^king lear(?:,\s*\d{4})?$/i, /\bwilliam shakespeare\b/i],
    [/^pride and prejudice$/i, /\bjane austen\b/i],
    [/^sense and sensibility$/i, /\bjane austen\b/i],
    [/^emma$/i, /\bjane austen\b/i],
    [/^frankenstein(?:;|,|$)/i, /\bmary shelley\b/i],
    [/^dracula$/i, /\bbram stoker\b/i],
    [/^moby[- ]dick(?:;|,|$)/i, /\bherman melville\b/i],
    [/^the picture of dorian gray$/i, /\boscar wilde\b/i],
    [/^alice'?s adventures in wonderland$/i, /\blewis carroll\b/i],
    [/^the adventures of huckleberry finn$/i, /\bmark twain\b/i]
  ];

  function classicOriginalText(work) {
    var source = [work && work.pl, work && work.source, work && work.sourceName].filter(Boolean).join(' ').toLowerCase();
    var title = String(work && work.title || '').trim();
    var author = String(work && (work.auth || work.author) || '').trim();
    var year = Number(work && (work.yr || work.year)) || 0;
    if (!/open library/i.test(source) || !title || !author || (year && year >= 1920)) return false;
    return CLASSIC_ORIGINALS.some(function (entry) { return entry[0].test(title) && entry[1].test(author); });
  }

  function earlyOpenLibraryText(work) {
    var source = [work && work.pl, work && work.source, work && work.sourceName].filter(Boolean).join(' ').toLowerCase();
    var year = Number(work && (work.yr || work.year)) || 0;
    var genres = [work && work.genres, work && work.gen, work && work.subjects].map(function (value) {
      return Array.isArray(value) ? value.join(' ') : value || '';
    }).join(' ').toLowerCase();
    var publisher = publisherFor(work || {}).publisher;
    var explicitVisualEdition = /\b(?:comic books?|comic strips?|cartoons?|adaptations?)\b/i.test(genres);
    return /open library/i.test(source) && year > 0 && year < 1930 && publisher === 'Other' && !explicitVisualEdition;
  }

  function classify(work) {
    // The publisher identifies this as a novel; a sparse provider record
    // previously excluded it from the Arabic novel filter.
    if (work && openLibrarySource(work) && work.type === BOOK &&
      String(work.title || '').trim() === 'ليالي ألف ليلة' &&
      /نجيب محفوظ/.test(String(work.auth || work.author || ''))) {
      work.type = NOVEL;
      work.catalogCorrection = 'verified-arabic-novel';
      work.catalogClassification = 'reclassified';
      return { changed: true, reclassified: true, reason: work.catalogCorrection };
    }
    if (!work || typeof work !== 'object' || !isComics(work)) return { changed: false, reclassified: false };
    var value = normalized(work);
    var before = work.type;
    var reason = '';
    var classicText = classicOriginalText(work) || earlyOpenLibraryText(work);
    if (mangaDexSource(work)) { work.type = MANGA; reason = 'mangadex-manga'; }
    else if (explicitReferenceBook(value) || explicitMangaGuide(value) || classicText) { work.type = BOOK; reason = classicText ? 'classic-original-text' : 'reference-book'; }
    else if (explicitTextNovel(value) || originalWithLaterGraphicEdition(work) || mahfouzProse(work)) { work.type = NOVEL; reason = 'text-novel'; }
    else if (explicitManga(value) || eastAsianManga(work)) { work.type = MANGA; reason = 'manga'; }
    if (work.type !== before) {
      work.catalogCorrection = reason;
      work.catalogClassification = 'reclassified';
      return { changed: true, reclassified: true, reason: reason };
    }
    var publisher = publisherFor(work);
    var universe = publisher.universe ? 'comic:' + publisher.publisher.toLowerCase() + '-' + publisher.universe : '';
    var changed = work.comicPublisher !== publisher.publisher || work.comicUniverse !== universe;
    work.comicPublisher = publisher.publisher;
    work.comicUniverse = universe;
    work.comicClassification = 'comic';
    return { changed: changed, reclassified: false, publisher: publisher.publisher };
  }

  function mahfouzProse(work) {
    if (!openLibrarySource(work)) return false;
    var title = String(work.title || '').trim();
    var author = String(work.auth || work.author || '');
    if (!/نجيب محفوظ|(?:naguib|najib|najīb)\s+(?:mahfouz|mahfuz|maḥfūẓ)/i.test(author)) return false;
    if (!/^(?:قصر الشوق|السكرية|بين القصرين|palace walk|palace of desire|sugar street)$/i.test(title)) return false;
    var tags = [work.genres,work.subjects].map(function (v) { return Array.isArray(v) ? v.join(' ') : v || ''; }).join(' ');
    return !/comic books?|comic strips?|adaptations?|illustrated edition/i.test(tags);
  }

  function apply(records) {
    var output = { classified: 0, reclassified: 0, Marvel: 0, DC: 0, Other: 0 };
    adaptationYears = Object.create(null);
    (Array.isArray(records) ? records : []).forEach(function (work) {
      if (!work || !openLibrarySource(work)) return;
      var title = String(work.title || '');
      var original = title.replace(/\s*[-.(]?\s*(?:the\s+)?graphic novel\b.*$/i, '').trim();
      var year = Number(work.yr || work.year) || 0;
      if (original && original !== title && year) {
        var key = titleKey(original, work.auth || work.author);
        adaptationYears[key] = Math.min(adaptationYears[key] || year, year);
      }
    });
    (Array.isArray(records) ? records : []).forEach(function (work) {
      var result = classify(work);
      if (!work || typeof work !== 'object') return;
      if (result.changed) output.classified += 1;
      if (result.reclassified) output.reclassified += 1;
      if (isComics(work) && output[work.comicPublisher] !== undefined) output[work.comicPublisher] += 1;
    });
    return output;
  }

  function partition(records) {
    var output = { Marvel: [], DC: [], Other: [] };
    (Array.isArray(records) ? records : []).forEach(function (work) {
      if (!isComics(work)) return;
      var publisher = work.comicPublisher || publisherFor(work).publisher;
      output[output[publisher] ? publisher : 'Other'].push(work);
    });
    return output;
  }
  function report(records) {
    var groups = partition(records);
    return { total: groups.Marvel.length + groups.DC.length + groups.Other.length, Marvel: groups.Marvel.length, DC: groups.DC.length, Other: groups.Other.length,
      reclassified: (Array.isArray(records) ? records : []).filter(function (work) { return work && work.catalogClassification === 'reclassified'; }).length };
  }

  var initial = apply(global.LorefyMangaData);
  global.LorefyComicsTaxonomy = { schema: 1, version: '2026-09-01-comics-v3', classify: classify, apply: apply, partition: partition, report: report, publisherFor: publisherFor, initial: initial };
})(window);

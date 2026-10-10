(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyChapterMetadata = api;
  if (root && root.document) api.seedCatalog(root);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var sources = {
    'mal-manga-96792-kimetsu-no-yaiba': { domain: 'kimetsu-no-yaiba', label: 'Kimetsu no Yaiba Wiki' },
    'mal-manga-13-one-piece': { domain: 'onepiece', label: 'One Piece Wiki' },
    'mal-manga-116778-chainsaw-man': { domain: 'chainsaw-man', label: 'Chainsaw Man Wiki' },
    'mal-manga-113138-jujutsu-kaisen': { domain: 'jujutsu-kaisen', label: 'Jujutsu Kaisen Wiki', count: 271 },
    'mal-manga-26-hunter-x-hunter': { domain: 'hunterxhunter', label: 'Hunterpedia', count: 420,
      countSourceUrl: 'https://www.viz.com/shonenjump/chapters/hunter-x-hunter?locale=en', checkedAt: '2026-10-01', status: 'مستمرة' },
    'mal-manga-16765-kingdom': { domain: 'kingdom', label: 'Kingdom Wiki', imageDomain: 'kingdom-anime' },
    'mal-manga-135496-dandadan': { domain: 'dandadan', label: 'Dandadan Wiki' },
    'mal-manga-131334-sakamoto-days': { domain: 'sakamoto-days', label: 'Sakamoto Days Wiki' },
    'mal-manga-44347-one-punch-man': { domain: 'onepunchman', label: 'One-Punch Man Wiki', onlineEdition: true }
  };
  var aliases = {
    'anilist-30026': 'mal-manga-26-hunter-x-hunter',
    'anilist-46765': 'mal-manga-16765-kingdom',
    'anilist-132029': 'mal-manga-135496-dandadan',
    'anilist-125828': 'mal-manga-131334-sakamoto-days',
    'anilist-74347': 'mal-manga-44347-one-punch-man'
  };
  var cache = new Map();
  var catalogs = new Map();
  var pendingCatalogs = new Map();

  function identity(workId) { return aliases[String(workId || '')] || String(workId || ''); }

  function sourceFor(workId) {
    return sources[identity(workId)] || null;
  }

  function seedCatalog(target) {
    var records = target.LorefyChapterData = target.LorefyChapterData || {};
    Object.keys(sources).concat(Object.keys(aliases)).forEach(function (id) {
      var source = sourceFor(id);
      if (!source.count || !source.countSourceUrl) return;
      var previous = records[id] || {};
      var previousCount = Number(previous.latestChapter || previous.chapters);
      var count = Math.max(source.count, Number.isSafeInteger(previousCount) && previousCount <= 100000 ? previousCount : 0);
      records[id] = Object.assign({}, previous, { chapters: count, latestChapter: count,
        source: 'Publisher chapter list', sourceUrl: source.countSourceUrl, updatedAt: source.checkedAt, status: source.status });
    });
    (target.LorefyMangaData || []).forEach(function (work) {
      var source = work && sourceFor(work.id);
      if (source && source.countSourceUrl && source.status) work.st = source.status;
    });
  }

  function trustedSource(source) {
    return !!source && Object.keys(sources).some(function (key) { return sources[key].domain === source.domain; });
  }

  function chapterNumber(title, source) {
    var match = String(title || '').match(source.onlineEdition ? /^Chapter (\d+)(?: \(Online\))?$/ : /^Chapter (\d+)$/);
    return match ? Number(match[1]) : 0;
  }

  function catalogFor(workId) { return catalogs.get(identity(workId)) || null; }

  function canLoadCatalog(workId) { return !!sourceFor(workId) || /^mal-(?:manga|manhwa|manhua|lightnovel)-\d+-/.test(String(workId || '')); }

  function requestJson(url, fetcher) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 12000);
    return Promise.resolve().then(function () {
      return (fetcher || fetch)(url, { signal: controller.signal });
    }).then(function (response) {
      if (!response.ok) throw new Error('Chapter metadata unavailable');
      return response.json();
    }).then(function (body) {
      if (!body || body.error) throw new Error('Chapter metadata unavailable');
      return body;
    }).finally(function () { clearTimeout(timer); });
  }

  function loadCatalog(workId, fetcher, retry) {
    var id = identity(workId);
    if (catalogs.has(id)) return Promise.resolve(catalogs.get(id));
    if (pendingCatalogs.has(id) && !retry) return pendingCatalogs.get(id);
    var source = sourceFor(id);
    var malId = id.match(/^mal-(?:manga|manhwa|manhua|lightnovel)-(\d+)-/);
    if (!source && !malId) return Promise.resolve({ total: 0, numbers: null });
    var task;
    if (source) {
      var numbers = new Set();
      var tokens = new Set();
      var pages = 0;
      function page(continuation) {
        var url = new URL('https://' + source.domain + '.fandom.com/api.php');
        url.searchParams.set('action', 'query'); url.searchParams.set('list', 'allpages');
        url.searchParams.set('apprefix', 'Chapter '); url.searchParams.set('apnamespace', '0');
        url.searchParams.set('aplimit', '500'); url.searchParams.set('format', 'json'); url.searchParams.set('origin', '*');
        if (continuation) url.searchParams.set('apcontinue', continuation);
        return requestJson(url.toString(), fetcher).then(function (body) {
          var rows = body.query && body.query.allpages;
          if (!Array.isArray(rows)) throw new Error('Chapter catalog unavailable');
          rows.forEach(function (row) {
            var number = row.ns === 0 ? chapterNumber(row.title, source) : 0;
            if (Number.isSafeInteger(number) && number > 0 && number <= 100000) numbers.add(number);
          });
          var next = body.continue && body.continue.apcontinue;
          pages++;
          if (next) {
            if (pages >= 20 || typeof next !== 'string' || tokens.has(next)) throw new Error('Incomplete chapter catalog');
            tokens.add(next); return page(next);
          }
          var sorted = Array.from(numbers).sort(function (a, b) { return a - b; });
          return { total: sorted[sorted.length - 1] || 0, numbers: sorted,
            sourceUrl: 'https://' + source.domain + '.fandom.com/wiki/Category:Chapters' };
        });
      }
      task = page('');
    } else {
      task = requestJson('https://api.jikan.moe/v4/manga/' + malId[1], fetcher).then(function (body) {
        var data = body.data;
        var count = data && Number(data.mal_id) === Number(malId[1]) ? Number(data.chapters) : 0;
        return { total: Number.isSafeInteger(count) && count > 0 && count <= 100000 ? count : 0,
          numbers: null, sourceUrl: 'https://myanimelist.net/manga/' + malId[1] };
      });
    }
    task = task.then(function (result) { catalogs.set(id, result); return result; });
    pendingCatalogs.set(id, task);
    return task;
  }

  function requestUrl(source, chapters) {
    if (!trustedSource(source)) return '';
    var numbers = (chapters || []).map(Number).filter(function (value) {
      return Number.isSafeInteger(value) && value > 0 && value <= 100000;
    }).slice(0, source.onlineEdition ? 10 : 20);
    if (!numbers.length) return '';
    var url = new URL('https://' + source.domain + '.fandom.com/api.php');
    url.searchParams.set('action', 'query');
    var titles = numbers.map(function (value) { return 'Chapter ' + value; });
    if (source.onlineEdition) titles = titles.concat(numbers.map(function (value) { return 'Chapter ' + value + ' (Online)'; }));
    url.searchParams.set('titles', titles.join('|'));
    url.searchParams.set('prop', 'pageimages|revisions');
    url.searchParams.set('rvprop', 'content');
    url.searchParams.set('rvslots', 'main');
    url.searchParams.set('rvsection', '0');
    url.searchParams.set('pithumbsize', '280');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    return url.toString();
  }

  function cleanField(value) {
    var text = String(value || '').trim()
      .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/'{2,}/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();
    if (!text || /[{}\u3040-\u30ff\u3400-\u9fff]/.test(text)) return '';
    return text.slice(0, 140);
  }

  function fields(wikitext) {
    var result = {};
    String(wikitext || '').split('\n').forEach(function (line) {
      var match = line.match(/^\s*\|\s*([a-z ]+)\s*=\s*(.*?)\s*$/i);
      if (match) result[match[1].trim().toLowerCase()] = match[2].replace(/\}\}\s*$/, '');
    });
    return result;
  }

  function displayDate(value, language) {
    var raw = String(value || '').trim();
    var normalized = raw.replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, '$1');
    var match = normalized.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (!match) return raw;
    var months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    var month = months.indexOf(match[1].toLowerCase());
    if (month < 0) return raw;
    var timestamp = Date.UTC(Number(match[3]), month, Number(match[2]));
    var checked = new Date(timestamp);
    if (checked.getUTCMonth() !== month || checked.getUTCDate() !== Number(match[2])) return raw;
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ar-SA-u-ca-gregory', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    }).format(new Date(timestamp));
  }

  function trustedImage(source, page, number) {
    var filename = String(page.pageimage || '');
    var marker = new RegExp('(?:^|[^a-z0-9])(?:chapter|ch)[_ .-]*0*' + number + '(?!\\d)', 'i');
    if (!marker.test(filename)) return '';
    try {
      var url = new URL(page.thumbnail && page.thumbnail.source || '');
      if (url.protocol !== 'https:' || url.hostname !== 'static.wikia.nocookie.net' ||
          !url.pathname.startsWith('/' + (source.imageDomain || source.domain) + '/images/')) return '';
      url.searchParams.set('format', 'original');
      return url.toString();
    } catch (error) { return ''; }
  }

  function parsePages(response, source, chapters) {
    var output = {};
    if (!source) return output;
    var allowed = new Set((chapters || []).map(Number));
    var online = new Set();
    var pages = response && response.query && response.query.pages || {};
    Object.keys(pages).forEach(function (key) {
      var page = pages[key];
      var number = page && chapterNumber(page.title, source);
      if (!number || !allowed.has(number) || page.missing !== undefined) return;
      var isOnline = / \(Online\)$/.test(page.title);
      if (!isOnline && online.has(number)) return;
      if (isOnline) online.add(number);
      var content = page.revisions && page.revisions[0] && page.revisions[0].slots && page.revisions[0].slots.main;
      var info = fields(content && content['*']);
      var title = cleanField(info['chapter title']) || cleanField(info.title) || cleanField(info.ename) || cleanField(info.name);
      var volume = cleanField(info.volume || info['volume number']);
      var pagesCount = Number(info.pages || info.page || info['page length']);
      var date = cleanField(String(info.date || info['release date'] || '').split(/<br\s*\/?\s*>/i)[0]);
      var firstDate = date.match(/^[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/);
      output[number] = {
        number: number,
        title: title,
        image: trustedImage(source, page, number),
        volume: volume,
        pages: Number.isSafeInteger(pagesCount) && pagesCount > 0 ? pagesCount : 0,
        date: firstDate ? firstDate[0] : date,
        sourceUrl: 'https://' + source.domain + '.fandom.com/wiki/' + page.title.replace(/ /g, '_')
      };
    });
    return output;
  }

  function load(workId, chapters, fetcher) {
    workId = identity(workId);
    var source = sourceFor(workId);
    if (!source) return Promise.resolve({});
    var numbers = (chapters || []).map(Number).filter(function (number) {
      return Number.isSafeInteger(number) && number > 0 && number <= 100000;
    }).slice(0, 20);
    var missing = numbers.filter(function (number) { return !cache.has(workId + ':' + number); });
    if (!missing.length) return Promise.resolve(pick());
    var url = requestUrl(source, missing);
    if (!url) return Promise.resolve({});
    return requestJson(url, fetcher).then(function (body) {
      var found = parsePages(body, source, missing);
      missing.forEach(function (number) { cache.set(workId + ':' + number, found[number] || null); });
      return pick();
    });

    function pick() {
      var output = {};
      numbers.forEach(function (number) {
        var value = cache.get(workId + ':' + number);
        if (value) output[number] = value;
      });
      return output;
    }
  }

  return { sourceFor: sourceFor, requestUrl: requestUrl, parsePages: parsePages, displayDate: displayDate, load: load,
    catalogFor: catalogFor, canLoadCatalog: canLoadCatalog, loadCatalog: loadCatalog, seedCatalog: seedCatalog };
});

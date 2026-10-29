const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadTaxonomy(records) {
  const source = fs.readFileSync(path.join(root, 'modules', 'lorefy-comics-taxonomy.js'), 'utf8');
  const sandbox = { window: { LorefyMangaData: records } };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(source, sandbox, { filename: 'lorefy-comics-taxonomy.js' });
  return sandbox.window.LorefyComicsTaxonomy;
}

test('Mahfouz prose translations are not comics because of one generic subject tag', () => {
  const work = {type:'كوميكس',title:'قصر الشوق',auth:'نجيب محفوظ',yr:1991,pl:'Open Library',genres:['Fiction','Comics & graphic novels, general','Arabic fiction']};
  const adaptation = {...work,title:'قصر الشوق - Graphic Novel'};
  loadTaxonomy([work,adaptation]);
  assert.equal(work.type,'رواية');
  assert.equal(adaptation.type,'كوميكس');
});

function loadCharacterSystem(comicsCatalog, fetchImpl) {
  const source = fs.readFileSync(path.join(root, 'modules', 'lorefy-character-system.js'), 'utf8');
  const storage = new Map();
  const sandbox = {
    URLSearchParams,
    Promise,
    Date,
    setTimeout,
    clearTimeout,
    fetch: fetchImpl,
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    LorefyCharacterCatalog: {},
    LorefyLiteraryCharacterCatalog: {},
    LorefyComicsCharacterCatalog: comicsCatalog,
    LorefyCatalogAliases: {}
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'lorefy-character-system.js' });
  return sandbox.LorefyCharacterSystem;
}

test('comic taxonomy separates Marvel, DC, and other comics without discarding graphic novels', () => {
  const records = [
    { id: 'spider', title: 'The Amazing Spider-Man', type: 'كوميكس' },
    { id: 'batman', title: 'Batman: Year One', type: 'كوميكس' },
    { id: 'saga', title: 'Saga, Vol. 1', type: 'كوميكس' },
    { id: 'time-machine', title: 'The Time Machine', type: 'كوميكس', gen: ['Graphic Novels'] }
  ];
  const taxonomy = loadTaxonomy(records);

  assert.equal(records[0].comicPublisher, 'Marvel');
  assert.equal(records[1].comicPublisher, 'DC');
  assert.equal(records[2].comicPublisher, 'Other');
  assert.equal(records[3].type, 'كوميكس');
  assert.equal(records[3].comicPublisher, 'Other');
  assert.deepEqual(Array.from(taxonomy.partition(records).Marvel, (work) => work.id), ['spider']);
  assert.deepEqual(Array.from(taxonomy.partition(records).DC, (work) => work.id), ['batman']);
});

test('comic taxonomy only reclassifies explicit non-comic material', () => {
  const records = [
    { id: 'guide', title: 'The DC Comics Guide to Digitally Drawing Comics', type: 'كوميكس' },
    { id: 'movie-novel', title: 'The Official Rocky Horror Picture Show Movie Novel', type: 'كوميكس' },
    { id: 'manga-guide', title: 'The Manga Guide to Physics', type: 'كوميكس' },
    { id: 'graphic-adaptation', title: 'Artemis Fowl: The Graphic Novel', type: 'كوميكس' }
  ];
  const taxonomy = loadTaxonomy(records);

  assert.equal(records[0].type, 'كتاب');
  assert.equal(records[1].type, 'رواية');
  assert.equal(records[2].type, 'كتاب');
  assert.equal(records[3].type, 'كوميكس');
  assert.equal(taxonomy.report(records).reclassified, 3);
});

test('Open Library manga creators and original prose are not filed as comics', () => {
  const records = [
    { id: 'eyes', title: '3x3 eyes', auth: '高田 裕三', yr: 1995, pl: 'Open Library Comics', type: 'كوميكس', genres: ['Graphic Novels'] },
    { id: 'sakura', title: 'Cardcaptor Sakura 1', auth: 'CLAMP', yr: 1996, pl: 'Open Library Comics', type: 'كوميكس', genres: ['Comic Books, Strips'] },
    { id: 'original', title: 'The Graveyard Book', auth: 'Neil Gaiman', yr: 2008, pl: 'Open Library Comics', type: 'كوميكس', genres: ['Graphic Novels'] },
    { id: 'adaptation', title: 'The Graveyard Book (Graphic Novel), Volume 1', auth: 'Neil Gaiman', yr: 2014, pl: 'Open Library Comics', type: 'كوميكس', genres: ['Graphic Novels'] }
  ];
  loadTaxonomy(records);
  assert.deepEqual(records.map((work) => work.type), ['مانجا', 'مانجا', 'رواية', 'كوميكس']);
});

test('comic histories and criticism are reference books, not comic stories', () => {
  const records = [
    { id: 'history', title: 'Origins of Marvel Comics', auth: 'Stan Lee', type: 'كوميكس', pl: 'Open Library', genres: ['Comic Books, Strips, Etc., History and Criticism'] },
    { id: 'story', title: 'The Amazing Spider-Man', type: 'كوميكس', pl: 'Open Library', genres: ['Comic Books, Strips'] }
  ];
  loadTaxonomy(records);
  assert.deepEqual(records.map((work) => work.type), ['كتاب', 'كوميكس']);
});

test('comic taxonomy removes original classic prose while retaining later graphic adaptations', () => {
  const records = [
    { id: 'crusoe-original', title: 'Robinson Crusoe', auth: 'Daniel Defoe', yr: 1686, pl: 'Open Library Comics', type: 'كوميكس', genres: ['Fiction', 'Graphic Novels'] },
    { id: 'tom-original', title: 'The Adventures of Tom Sawyer', auth: 'Mark Twain', yr: 1817, pl: 'Open Library Comics', type: 'كوميكس', genres: ['19th Century', 'Graphic Novels'] },
    { id: 'romeo-original', title: 'Romeo and Juliet, 1750', auth: 'William Shakespeare', yr: 1750, pl: 'Open Library Comics', type: 'كوميكس', genres: ['Drama', 'Comic Books'] },
    { id: 'treasure-original', title: 'Treasure Island', auth: 'Robert Louis Stevenson', yr: 1880, pl: 'Open Library Comics', type: 'كوميكس', genres: ['Fiction', 'Graphic Novels'] },
    { id: 'tom-adaptation', title: 'The Adventures of Tom Sawyer', auth: 'Margaret Hall', yr: 2007, pl: 'Open Library Comics', type: 'كوميكس', genres: ['Comic Strips', 'Graphic Novels'] }
  ];
  const taxonomy = loadTaxonomy(records);

  assert.equal(records[0].type, 'كتاب');
  assert.equal(records[1].type, 'كتاب');
  assert.equal(records[2].type, 'كتاب');
  assert.equal(records[3].type, 'كتاب');
  assert.equal(records[4].type, 'كوميكس');
  assert.deepEqual(Array.from(taxonomy.partition(records).Other, (work) => work.id), ['tom-adaptation']);
});

test('the comics remote catalog excludes MangaDex, which is reserved for manga formats', () => {
  const catalog = fs.readFileSync(path.join(root, 'modules', 'lorefy-api-catalog.js'), 'utf8');
  const comicsConfig = catalog.match(/TYPE_CONFIG\[TYPES\.comics\]\s*=\s*\{([\s\S]*?)\n  \};/);

  assert.ok(comicsConfig, 'missing Comics catalog configuration');
  assert.doesNotMatch(comicsConfig[1], /mangaDex/);
  assert.match(comicsConfig[1], /providers:\s*\["openLibrary", "googleBooks", "bookBrainz", "wikidata", "gcd"\]/);
});

test('persisted MangaDex rows are moved out of Comics when the catalog is normalized', () => {
  const records = [
    { id: 'md-old-comic', title: 'Battle/UMA', pl: 'MangaDex', type: 'كوميكس', sourceCoverUrl: 'https://uploads.mangadex.org/covers/a/b.jpg.512.jpg' }
  ];
  loadTaxonomy(records);

  assert.equal(records[0].type, 'مانجا');
  assert.equal(records[0].catalogCorrection, 'mangadex-manga');
});

test('short bundled comic rosters are seeds and are enriched with the verified remote cast', async () => {
  const requested = [];
  const seed = ['Alana', 'Marko', 'Hazel', 'The Will'].map((name) => ({
    id: `comic-saga-${name.toLowerCase().replace(/\s+/g, '-')}`,
    key: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    latin: name,
    role: 'رئيسية',
    source: 'Lorefy comics catalog'
  }));
  const system = loadCharacterSystem({ 'comic:other-saga': seed }, async (request) => {
    const url = String(request);
    requested.push(url);
    if (url.includes('wikidata.org')) throw new Error('no Wikidata match');
    if (url.includes('list=search')) {
      return { ok: true, json: async () => ({ query: { search: [{ title: 'Saga' }] } }) };
    }
    if (url.includes('action=parse')) {
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': '== Characters ==\n[[Alana]]\n[[Marko]]\n[[Hazel]]\n[[The Will]]\n[[Prince Robot IV]]\n[[Gwendolyn]]\n[[Lying Cat]]' } } }) };
    }
    if (url.includes('prop=pageimages')) {
      const titles = new URL(url).searchParams.get('titles').split('|');
      const pages = {};
      titles.forEach((title, index) => { pages[String(index + 1)] = { title, thumbnail: { source: `https://images.example/${encodeURIComponent(title)}.jpg` } }; });
      return { ok: true, json: async () => ({ query: { pages } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  });

  const cast = await system.loadCast({ id: 'saga-work', title: 'Saga', type: 'كوميكس', comicUniverse: 'comic:other-saga', comicPublisher: 'Other' });

  assert.deepEqual(Array.from(cast, (row) => row.name), ['Alana', 'Marko', 'Hazel', 'The Will', 'Prince Robot IV', 'Gwendolyn', 'Lying Cat']);
  assert.equal(cast.complete, false);
  assert.equal(requested.some((url) => url.includes('list=search')), true);
});

test('a short comic catalog cast remains available when remote enrichment fails', async () => {
  let requested = false;
  const system = loadCharacterSystem({
    'title:batman': [
      { id: 'comic-dc-bruce-wayne', key: 'bruce-wayne', name: 'Bruce Wayne', latin: 'Bruce Wayne', role: 'رئيسية', source: 'Lorefy comics catalog' },
      { id: 'comic-dc-selina-kyle', key: 'selina-kyle', name: 'Selina Kyle', latin: 'Selina Kyle', role: 'مساعدة', source: 'Lorefy comics catalog' }
    ]
  }, async (request) => {
    requested = true;
    assert.match(String(request), /en\.wikipedia\.org/);
    return {
      ok: true,
      json: async () => ({ query: { pages: {
        '1': { title: 'Bruce Wayne', thumbnail: { source: 'https://images.example/bruce.jpg' } },
        '2': { title: 'Selina Kyle', thumbnail: { source: 'https://images.example/selina.jpg' } }
      } } })
    };
  });

  const cast = await system.loadCast({ id: 'ol-comics-batman', title: 'Batman', type: 'كوميكس' });

  assert.equal(cast.length, 2);
  assert.equal(cast.complete, false);
  assert.equal(requested, true);
  assert.deepEqual(Array.from(cast, (row) => row.image), [
    'https://images.example/bruce.jpg',
    'https://images.example/selina.jpg'
  ]);
});

test('an incomplete cached comic roster is retried instead of becoming permanently final', async () => {
  let remoteAvailable = false;
  let searches = 0;
  const system = loadCharacterSystem({
    'title:watchmen': [
      { id: 'rorschach', key: 'rorschach', name: 'Rorschach', latin: 'Rorschach', role: 'رئيسية', source: 'Lorefy comics catalog' }
    ]
  }, async (request) => {
    const url = String(request);
    if (url.includes('prop=pageimages')) {
      return { ok: true, json: async () => ({ query: { pages: {} } }) };
    }
    if (!remoteAvailable) throw new Error('temporary source outage');
    if (url.includes('list=search')) {
      searches += 1;
      return { ok: true, json: async () => ({ query: { search: [{ title: 'Watchmen' }] } }) };
    }
    if (url.includes('action=parse')) {
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': '== Characters ==\n[[Rorschach]]\n[[Doctor Manhattan]]\n[[Silk Spectre]]' } } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  });

  const first = await system.loadCast({ id: 'watchmen', title: 'Watchmen', type: 'كوميكس' });
  assert.equal(first.length, 1);
  assert.equal(first.complete, false);

  remoteAvailable = true;
  const second = await system.loadCast({ id: 'watchmen', title: 'Watchmen', type: 'كوميكس' });
  assert.deepEqual(Array.from(second, (row) => row.name), ['Rorschach', 'Doctor Manhattan', 'Silk Spectre']);
  assert.equal(second.complete, false);
  assert.equal(searches, 1);
  assert.equal(system.needsRemoteRefresh(
    { id: 'watchmen', title: 'Watchmen', type: 'كوميكس' },
    [{ id: 'rorschach', name: 'Rorschach' }]
  ), true);
});

test('comic catalog portrait hydration retries one transient Wikipedia failure', async () => {
  let attempts = 0;
  const system = loadCharacterSystem({
    'title:batman': [
      { id: 'comic-dc-bruce-wayne', key: 'bruce-wayne', name: 'Bruce Wayne', latin: 'Bruce Wayne', role: 'رئيسية', source: 'Lorefy comics catalog' }
    ]
  }, async (request) => {
    const url = String(request);
    if (!url.includes('prop=pageimages')) throw new Error('remote cast unavailable');
    attempts += 1;
    if (attempts === 1) throw new Error('temporary Wikipedia outage');
    return {
      ok: true,
      json: async () => ({ query: { pages: {
        '1': { title: 'Bruce Wayne', thumbnail: { source: 'https://images.example/retried-bruce.jpg' } }
      } } })
    };
  });

  const cast = await system.loadCast({ id: 'ol-comics-batman', title: 'Batman', type: 'كوميكس' });
  assert.equal(attempts, 2);
  assert.equal(cast[0].image, 'https://images.example/retried-bruce.jpg');
});

test('DC comic catalog portraits use the DC wiki before Wikipedia', async () => {
  const requested = [];
  const system = loadCharacterSystem({
    'comic:dc-batman': [
      { id: 'comic-dc-alfred', key: 'alfred-pennyworth', name: 'Alfred Pennyworth', latin: 'Alfred Pennyworth', role: 'مساعدة', source: 'Lorefy comics catalog' }
    ]
  }, async (request) => {
    const url = String(request);
    requested.push(url);
    if (!url.includes('dc.fandom.com') || !url.includes('prop=pageimages')) throw new Error('remote cast unavailable');
    assert.match(url, /dc\.fandom\.com/);
    return {
      ok: true,
      json: async () => ({ query: { pages: {
        '1': { title: 'Alfred Pennyworth', thumbnail: { source: 'https://static.wikia.nocookie.net/example/alfred.jpg' } }
      } } })
    };
  });

  const cast = await system.loadCast({ id: 'dc-batman', title: 'Batman', type: 'كوميكس', comicUniverse: 'comic:dc-batman', comicPublisher: 'DC' });
  assert.equal(cast[0].image, 'https://static.wikia.nocookie.net/example/alfred.jpg');
  assert.match(requested[0], /dc\.fandom\.com/);
});

test('DC comic portraits search the scoped wiki when the exact page title has no image', async () => {
  const requested = [];
  const system = loadCharacterSystem({
    'comic:dc-watchmen': [
      { id: 'comic-dc-hollis-mason', key: 'hollis-mason', name: 'Hollis Mason', latin: 'Hollis Mason', role: 'مساعدة', source: 'Lorefy comics catalog' }
    ]
  }, async (request) => {
    const url = String(request);
    requested.push(url);
    if (url.includes('dc.fandom.com') && url.includes('generator=search')) {
      return { ok: true, json: async () => ({ query: { pages: {
        '1': { title: 'Hollis Mason (Watchmen)', thumbnail: { source: 'https://static.wikia.nocookie.net/example/hollis.jpg' } }
      } } }) };
    }
    if (url.includes('prop=pageimages')) {
      return { ok: true, json: async () => ({ query: { pages: { '1': { title: 'Hollis Mason' } } } }) };
    }
    throw new Error('remote cast unavailable');
  });

  const cast = await system.loadCast({
    id: 'dc-watchmen', title: 'Watchmen', type: 'كوميكس', comicUniverse: 'comic:dc-watchmen', comicPublisher: 'DC'
  });

  assert.equal(cast[0].image, 'https://static.wikia.nocookie.net/example/hollis.jpg');
  assert.equal(requested.some((url) => url.includes('dc.fandom.com') && url.includes('generator=search')), true);
});

test('unmapped comics use a comic-specific verified title fallback', async () => {
  const requested = [];
  const system = loadCharacterSystem({}, async (request) => {
    const url = String(request);
    requested.push(url);
    if (url.includes('wikidata.org')) throw new Error('no Wikidata match');
    if (url.includes('list=search')) {
      assert.match(new URL(url).searchParams.get('srsearch'), /Saga comic/);
      return { ok: true, json: async () => ({ query: { search: [{ title: 'Saga' }] } }) };
    }
    if (url.includes('action=parse')) {
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': '== Characters and cast ==\n[[Alana]]\n[[Marko]]' } } }) };
    }
    if (url.includes('prop=pageimages')) {
      const titles = new URL(url).searchParams.get('titles').split('|');
      const pages = {};
      titles.forEach((title, index) => { pages[String(index + 1)] = { title, thumbnail: { source: `https://images.example/${index}.jpg` } }; });
      return { ok: true, json: async () => ({ query: { pages } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  });

  const cast = await system.comicRemoteCast({ id: 'indie-saga', type: 'كوميكس', title: 'Saga' });

  assert.deepEqual(Array.from(cast, (row) => row.name), ['Alana', 'Marko']);
  assert.equal(cast.filter((row) => row.image).length, 2);
  assert.equal(requested[0].includes('wikipedia'), true);
  assert.equal(requested.some((url) => url.includes('list=search')), true);
});

test('comic character sections prefer definition entries over incidental links', async () => {
  const system = loadCharacterSystem({}, async (request) => {
    const url = String(request);
    if (url.includes('list=search')) {
      return { ok: true, json: async () => ({ query: { search: [{ title: 'Example Comic' }] } }) };
    }
    if (url.includes('action=parse')) {
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': [
        '== Characters ==',
        '; [[Alana (character)|Alana]]',
        ': The lead character inspired by [[Batman]] and portrayed by [[Jane Actor]].',
        '; [[Marko (character)|Marko]]',
        ': A supporting character compared with [[Spock]].'
      ].join('\n') } } }) };
    }
    if (url.includes('prop=pageimages')) {
      return { ok: true, json: async () => ({ query: { pages: {
        '1': { title: 'Alana (character)', thumbnail: { source: 'https://images.example/alana.jpg' } },
        '2': { title: 'Marko (character)', thumbnail: { source: 'https://images.example/marko.jpg' } }
      } } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  });

  const cast = await system.comicRemoteCast({ id: 'example-comic', type: 'كوميكس', title: 'Example Comic' });
  assert.deepEqual(Array.from(cast, (row) => row.name), ['Alana', 'Marko']);
});

test('comic cast deduplication joins civilian aliases and legacy numeral variants', () => {
  const system = loadCharacterSystem({}, async () => { throw new Error('unused'); });
  const cast = system.dedupeCast([
    { id: 'local-ozymandias', name: 'Ozymandias', latin: 'Ozymandias' },
    { id: 'wiki-ozymandias', name: 'Ozymandias', latin: 'Ozymandias', aliases: ['Adrian Veidt', 'Ozymandias'] },
    { id: 'wiki-adrian-veidt', name: 'Adrian Veidt', latin: 'Adrian Veidt' },
    { id: 'local-nite-owl', name: 'Nite Owl', latin: 'Nite Owl' },
    { id: 'wiki-nite-owl-ii', name: 'Nite Owl II', latin: 'Nite Owl II', aliases: ['Daniel Dreiberg', 'Nite Owl II'] },
    { id: 'wiki-daniel-dreiberg', name: 'Daniel Dreiberg', latin: 'Daniel Dreiberg' }
  ]);

  assert.deepEqual(Array.from(cast, (row) => row.name), ['Ozymandias', 'Nite Owl']);
});

test('comic fallback follows a dedicated character-list page and merges its character headings', async () => {
  const requested = [];
  const system = loadCharacterSystem({}, async (request) => {
    const url = String(request);
    requested.push(url);
    if (url.includes('list=search')) {
      return { ok: true, json: async () => ({ query: { search: [{ title: 'Watchmen' }] } }) };
    }
    if (url.includes('action=parse')) {
      const page = new URL(url).searchParams.get('page');
      if (page === 'List of Watchmen characters') {
        return { ok: true, json: async () => ({ parse: { wikitext: { '*': [
          '== Crimebusters ==',
          '=== The Comedian {{Anchor|The Comedian}} ===',
          '=== Doctor Manhattan ===',
          '=== Nite Owl ===',
          '=== Rorschach ===',
          '=== Silk Spectre ===',
          '=== Adrian Veidt ===',
          '== Minor characters ==',
          '=== Minutemen ===',
          '==== Captain Metropolis ====',
          '==== Dollar Bill ====',
          '== Television series ==',
          '=== Sister Night ==='
        ].join('\n') } } }) };
      }
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': [
        '== Characters ==',
        '{{Main|List of Watchmen characters {{!}} List of Watchmen characters}}',
        '; [[Rorschach (character)|Walter Joseph Kovacs / Rorschach]]',
        ': Inspired by [[Batman]] and [[The Question]].'
      ].join('\n') } } }) };
    }
    if (url.includes('prop=pageimages')) {
      const titles = new URL(url).searchParams.get('titles').split('|');
      const pages = {};
      titles.forEach((title, index) => { pages[String(index + 1)] = { title, thumbnail: { source: `https://images.example/${index}.jpg` } }; });
      return { ok: true, json: async () => ({ query: { pages } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  });

  const cast = await system.comicRemoteCast({ id: 'watchmen', type: 'كوميكس', title: 'Watchmen', comicPublisher: 'Other' });
  assert.deepEqual(Array.from(cast, (row) => row.name), [
    'Rorschach', 'The Comedian', 'Doctor Manhattan', 'Nite Owl', 'Silk Spectre', 'Adrian Veidt', 'Captain Metropolis', 'Dollar Bill'
  ]);
  assert.equal(requested.some((url) => new URL(url).searchParams.get('page') === 'List of Watchmen characters'), true);
});

test('comic fallback excludes publishers and real-world credits from a character section', async () => {
  const system = loadCharacterSystem({}, async (request) => {
    const url = String(request);
    if (url.includes('wbsearchentities')) throw new Error('no Wikidata match');
    if (url.includes('wbgetentities')) {
      return { ok: true, json: async () => ({ entities: {
        Q1: { descriptions: { en: { value: 'fictional character' } }, claims: {} },
        Q2: { descriptions: { en: { value: 'American comic book publisher' } }, claims: {} },
        Q3: { descriptions: { en: { value: 'British comics artist' } }, claims: {} },
        Q4: { descriptions: { en: { value: 'fictional character' } }, claims: {} }
      } }) };
    }
    if (url.includes('list=search')) {
      return { ok: true, json: async () => ({ query: { search: [{ title: 'Example Comic' }] } }) };
    }
    if (url.includes('action=parse')) {
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': '== Characters ==\n[[Bruce Wayne]]\n[[DC Comics]]\n[[Brian Bolland]]\n[[Selina Kyle]]' } } }) };
    }
    if (url.includes('prop=pageimages')) {
      return { ok: true, json: async () => ({ query: { pages: {
        '1': { title: 'Bruce Wayne', pageprops: { wikibase_item: 'Q1' } },
        '2': { title: 'DC Comics', pageprops: { wikibase_item: 'Q2' } },
        '3': { title: 'Brian Bolland', pageprops: { wikibase_item: 'Q3' } },
        '4': { title: 'Selina Kyle', pageprops: { wikibase_item: 'Q4' } }
      } } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  });

  const cast = await system.comicRemoteCast({ id: 'example-comic', type: 'كوميكس', title: 'Example Comic' });
  assert.deepEqual(Array.from(cast, (row) => row.name), ['Bruce Wayne', 'Selina Kyle']);
});

test('comic fallback refuses a generic character-search page without an explicit character section', async () => {
  const requested = [];
  const system = loadCharacterSystem({}, async (request) => {
    const url = String(request);
    requested.push(url);
    if (url.includes('wikidata.org')) throw new Error('no Wikidata match');
    if (url.includes('list=search')) {
      return { ok: true, json: async () => ({ query: { search: [{ title: 'Example Comic' }] } }) };
    }
    if (url.includes('action=parse')) {
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': '== Publication ==\n[[DC Comics]]\n[[Brian Bolland]]' } } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  });

  await assert.rejects(
    () => system.comicRemoteCast({ id: 'generic-comic', type: 'كوميكس', title: 'Example Comic' }),
    /empty wikipedia comic cast|no Wikidata match/
  );
  assert.equal(requested.some((url) => /characters/i.test(new URL(url).searchParams.get('srsearch') || '')), false);
});

test('comic taxonomy and catalog load before character routes and the app', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const taxonomyAt = index.indexOf('modules/lorefy-comics-taxonomy.js');
  const qualityAt = index.indexOf('uploads/lorefy-catalog-quality.js');
  const comicsCatalogAt = index.indexOf('uploads/lorefy-comics-character-catalog.js');
  const systemAt = index.indexOf('modules/lorefy-character-system.js');
  const appAt = index.indexOf('uploads/files/lorefy-app.js');

  assert.ok(taxonomyAt > 0 && taxonomyAt < qualityAt);
  assert.ok(comicsCatalogAt > 0 && comicsCatalogAt < systemAt && systemAt < appAt);
});

test('the Batman universe ships a broad local roster before any remote enrichment', () => {
  const source = fs.readFileSync(path.join(root, 'uploads', 'lorefy-comics-character-catalog.js'), 'utf8');
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(source, sandbox, { filename: 'lorefy-comics-character-catalog.js' });
  const roster = sandbox.window.LorefyComicsCharacterCatalog['comic:dc-batman'];

  assert.ok(roster.length >= 20);
  for (const name of ['Bruce Wayne', 'Barbara Gordon', 'Harvey Dent', "Ra's al Ghul", 'Poison Ivy']) {
    assert.ok(roster.some((character) => character.name === name), `missing ${name}`);
  }
});

test('Comics and expanded works stay in the existing search page', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'uploads', 'files', 'lorefy-app.js'), 'utf8');
  const appAt = index.indexOf('uploads/files/lorefy-app.js');
  const cacheAt = index.indexOf('modules/lorefy-catalog-detail-cache.js');

  assert.ok(appAt > 0 && cacheAt > appAt, 'search navigation must attach after the app');
  assert.match(app, /lf-search-page/);
  assert.match(app, /lf-search-result/);
  assert.doesNotMatch(index, /lorefy-comics-hub/);
});

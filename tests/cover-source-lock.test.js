const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

test('metadata-only editions never auto-attach title-matched covers from another edition',async()=>{
  const requests=[],api=loadCoverApi(requests);
  assert.equal(await api.resolve({id:'gcd-series-21965',title:'Absolute Watchmen',type:'كوميكس',metadataOnly:true}),'');
  assert.equal(requests.length,0);
});

test('verified RanobeDB covers display and use the native gateway without allowing lookalike hosts', () => {
  const url = 'https://images.ranobedb.org/maAOIi8f73kFTkfV.jpg';
  const api = loadCoverApi([], null, { LorefyDataProxy: { mediaUrl: value => '/api/media?url=' + encodeURIComponent(value) } });
  assert.equal(api.primary({ sourceCoverUrl: url }), url);
  assert.equal(api.displayUrl(url), '/api/media?url=' + encodeURIComponent(url));
  assert.notEqual(api.primary({ sourceCoverUrl: 'https://images.ranobedb.org.evil.invalid/cover.jpg' }), 'https://images.ranobedb.org.evil.invalid/cover.jpg');
  const gateway = fs.readFileSync(path.join(root, 'supabase/functions/lorefy-public/index.ts'), 'utf8');
  assert.match(gateway, /"images\.ranobedb\.org"/);
});

function loadCoverApi(requests, responseFor, globals = {}) {
  const source = fs.readFileSync(path.join(root, 'modules', 'lorefy-cover-api.js'), 'utf8');
  const sandbox = {
    URL,
    URLSearchParams,
    Map,
    Set,
    Promise,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async (url, options) => {
      requests.push(String(url));
      const payload = responseFor ? await responseFor(String(url), options) : {};
      return { ok: true, json: async () => payload || {} };
    },
    ...globals
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'lorefy-cover-api.js' });
  return sandbox.LorefyCoverAPI;
}

test('verified publisher SVG covers render as images without accepting arbitrary SVG URLs',()=>{
  const url='https://downloads.hindawi.org/covers/svg/270x360/71628490.svg?v=5';
  const api=loadCoverApi([],null,{LorefyDataProxy:{mediaUrl:value=>'/api/media?url='+encodeURIComponent(value)}});
  assert.equal(api.primary({sourceCoverUrl:url}),url);
  assert.equal(api.displayUrl(url),url,'static publisher SVG uses an img source, not the raster-only gateway');
  for(const bad of ['https://downloads.hindawi.org.evil.invalid/covers/svg/270x360/71628490.svg',
    'https://downloads.hindawi.org/other.svg','https://downloads.hindawi.org:444/covers/svg/270x360/71628490.svg',
    'https://user:password@downloads.hindawi.org/covers/svg/270x360/71628490.svg']) {
    assert.notEqual(api.primary({sourceCoverUrl:bad}),bad);
  }
});

test('an inactive rights filter does not bypass the image gateway', () => {
  const api = loadCoverApi([], null, {
    LorefyRightsSafeMedia: {coverUrl: url => url},
    LorefyDataProxy: {mediaUrl: url => '/api/media?url=' + encodeURIComponent(url)}
  });
  const url = 'https://uploads.mangadex.org/covers/work/cover.jpg.512.jpg';
  assert.equal(api.displayUrl(url), '/api/media?url=' + encodeURIComponent(url));
});

test('static local demo displays allowed source covers without a missing media endpoint', () => {
  const api = loadCoverApi([], null, {
    location: { hostname: '127.0.0.1', search: '?preview=demo', href: 'http://127.0.0.1:8795/' },
    LorefyDataProxy: { mediaUrl: url => '/api/media?url=' + encodeURIComponent(url) }
  });
  const url = 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/example.jpg';
  assert.equal(api.displayUrl(url), url);
});

test('local demo routes MangaDex volumes through the referrer-free media gateway', () => {
  const url = 'https://uploads.mangadex.org/covers/work/cover.jpg.512.jpg';
  for (const hostname of ['127.0.0.1', 'localhost']) {
    const api = loadCoverApi([], null, {
      location: { hostname, search: '?preview=demo&demo=ready', href: `http://${hostname}:8795/` },
      LorefyRightsSafeMedia: { coverUrl: value => value }
    });
    assert.equal(api.displayUrl(url), '/api/media?url=' + encodeURIComponent(url));
  }
});

test('the local data gateway uses the implemented media route', () => {
  const sandbox = { URL, location: {href:'http://127.0.0.1:8794/'}, LOREFY_REMOTE_CATALOG:{proxyBaseUrl:'/api/catalog'} };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'modules/lorefy-data-proxy.js'), 'utf8'), sandbox);
  const url = 'https://uploads.mangadex.org/covers/work/cover.jpg';
  assert.equal(sandbox.LorefyDataProxy.mediaUrl(url), '/api/media?url=' + encodeURIComponent(url));
});

test('MAL works keep their exact source but also try a title-verified volume provider', async () => {
  const requests = [];
  const api = loadCoverApi(requests);
  await api.alternates({
    id: 'mal-manga-26-hunter-x-hunter',
    title: 'Hunter x Hunter',
    type: 'مانجا',
    sourceCoverUrl: 'https://cdn.myanimelist.net/images/manga/3/123.jpg'
  });
  assert.equal(requests.some((url) => url.includes('api.mangadex.org/manga')), true);
  assert.equal(requests.some((url) => url.includes('api.tenrai.org/v1/manga/26/pictures')), true);
  assert.equal(requests.some((url) => url.includes('api.tenrai.org/v1/manga?')), false);
  assert.equal(requests.some((url) => url.includes('api.tenrai.org/v1/manga/26')), true);
  assert.equal(requests.some((url) => url.includes('googleapis.com/books')), true);
});

test('Google Books paginates the exact series volume covers beyond its first forty results', async () => {
  const requests = [];
  const api = loadCoverApi(requests, (url) => {
    if (!url.includes('googleapis.com/books')) return {};
    const start = Number(new URL(url).searchParams.get('startIndex') || 0);
    const page = start === 0 ? 0 : 1;
    const count = page === 0 ? 40 : 2;
    return {
      totalItems: 42,
      items: Array.from({ length: count }, (_, index) => {
        const volume = start + index + 1;
        return {
          id: `my-hero-${volume}`,
          volumeInfo: {
            title: `My Hero Academia, Vol. ${volume}`,
            imageLinks: { thumbnail: `https://books.google.com/books/content?id=my-hero-${volume}&printsec=frontcover` }
          }
        };
      })
    };
  });

  const covers = await api.alternates({ id: 'mal-manga-30413-boku-no-hero-academia', title: 'My Hero Academia', type: 'Manga' });

  assert.equal(covers.filter((url) => url.includes('books.google.com/books/content?id=my-hero-')).length, 42);
  assert.equal(requests.filter((url) => url.includes('googleapis.com/books')).length, 2);
});

test('MangaDex retries verified alternate work titles when the primary title has no result', async () => {
  const requests = [];
  const api = loadCoverApi(requests, (url) => {
    if (url.includes('api.mangadex.org/manga')) {
      const title = new URL(url).searchParams.get('title');
      if (title !== 'My Hero Academia') return { data: [] };
      return {
        data: [{
          id: 'hero-academia-fan-colored',
          attributes: {
            title: { en: 'My Hero Academia (Fan Colored)' },
            altTitles: [{ ja: '僕のヒーローアカデミア カラー版' }],
            links: {}
          },
          relationships: []
        }, {
          id: 'hero-academia',
          attributes: {
            title: { en: 'My Hero Academia' },
            altTitles: [{ ja: '僕のヒーローアカデミア' }],
            links: { mal: '30413' }
          },
          relationships: []
        }]
      };
    }
    if (url.includes('api.mangadex.org/cover')) {
      assert.equal(new URL(url).searchParams.get('manga[]'), 'hero-academia');
      return {
        data: [{
          attributes: { fileName: 'volume-1.jpg' }
        }, {
          attributes: { fileName: 'volume-2.jpg' }
        }]
      };
    }
    return {};
  });

  const covers = await api.alternates({
    id: 'mal-manga-30413-boku-no-hero-academia',
    searchTitle: '僕のヒーローアカデミア',
    title: 'My Hero Academia',
    type: 'Manga'
  });

  assert.equal(requests.some((url) => url.includes('title=My+Hero+Academia')), true);
  assert.equal(covers.filter((url) => url.includes('uploads.mangadex.org/covers/hero-academia/')).length, 2);
});

test('MangaDex prefers the exact canonical work and loads every cover page', async () => {
  const requests = [];
  const api = loadCoverApi(requests, (url) => {
    if (url.includes('api.mangadex.org/manga')) {
      return { data: [
        { id: 'canonical-demon-slayer', attributes: { title: { en: 'Demon Slayer: Kimetsu no Yaiba' }, altTitles: [], links: {} }, relationships: [] },
        { id: 'colored-demon-slayer', attributes: { title: { en: 'Demon Slayer: Kimetsu no Yaiba (Official Colored)' }, altTitles: [], links: { mal: '96792' } }, relationships: [] }
      ] };
    }
    if (url.includes('api.mangadex.org/cover')) {
      const params = new URL(url).searchParams;
      assert.equal(params.get('manga[]'), 'canonical-demon-slayer');
      const offset = Number(params.get('offset') || 0);
      const count = offset === 0 ? 100 : 23;
      return {
        total: 123,
        data: Array.from({ length: count }, (_, index) => ({ attributes: { fileName: `volume-${offset + index + 1}.jpg` } }))
      };
    }
    return {};
  });

  const covers = await api.alternates({
    id: 'mal-manga-96792-kimetsu-no-yaiba',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    type: 'Manga'
  });

  assert.equal(covers.filter(url => url.includes('/canonical-demon-slayer/')).length, 123);
  assert.equal(covers.some(url => url.includes('/colored-demon-slayer/')), false);
});

test('browser cover requests use the same-origin catalog proxy for MangaDex metadata', async () => {
  const requests = [];
  const api = loadCoverApi(requests, (url) => {
    if (url.startsWith('/api/catalog/mangadex?')) {
      return {
        data: [{
          id: 'hero-academia',
          attributes: {
            title: { en: 'My Hero Academia' },
            altTitles: [],
            links: { mal: '30413' }
          },
          relationships: []
        }]
      };
    }
    if (url.startsWith('/api/catalog/mangadex-covers?')) {
      return { data: [{ attributes: { fileName: 'volume-1.jpg' } }] };
    }
    return {};
  }, {
    location: { origin: 'http://127.0.0.1:8793' },
    LOREFY_REMOTE_CATALOG: { proxyBaseUrl: 'api/catalog' }
  });

  const covers = await api.alternates({
    id: 'mal-manga-30413-boku-no-hero-academia',
    title: 'My Hero Academia',
    type: 'Manga'
  });

  assert.equal(requests.some((url) => url.startsWith('/api/catalog/mangadex?')), true);
  assert.equal(requests.some((url) => url.startsWith('/api/catalog/mangadex-covers?')), true);
  assert.equal(covers.some((url) => url.includes('uploads.mangadex.org/covers/hero-academia/')), true);
});

test('cover alternatives retain catalog alternates before remote retrieval', async () => {
  const api = loadCoverApi([]);
  const covers = await api.alternates({
    id: 'mal-manga-1-example',
    title: 'Example',
    type: 'Manga',
    sourceCoverUrl: 'https://cdn.myanimelist.net/images/manga/1/100.jpg',
    alternateCovers: [
      'https://cdn.myanimelist.net/images/manga/1/101.jpg',
      'https://cdn.myanimelist.net/images/manga/1/102.jpg'
    ]
  });
  assert.deepEqual(Array.from(covers).slice(0, 3), [
    'https://cdn.myanimelist.net/images/manga/1/100.jpg',
    'https://cdn.myanimelist.net/images/manga/1/101.jpg',
    'https://cdn.myanimelist.net/images/manga/1/102.jpg'
  ]);
});

test('page URLs are excluded from cover sources and image URLs use the validated media proxy', async () => {
  const api = loadCoverApi([], null, {
    location: { origin: 'http://127.0.0.1:8793', hostname: '127.0.0.1' }
  });
  const work = {
    id: 'mal-manga-25133-akame-ga-kill',
    title: 'Akame ga Kill!',
    type: 'Manga',
    sourceCoverUrl: 'https://mangadex.org/title/not-an-image',
    alternateCovers: [
      'https://uploads.mangadex.org/covers/akame-ga-kill/cover.jpg.512.jpg'
    ]
  };

  assert.equal(api.primary(work), 'https://uploads.mangadex.org/covers/akame-ga-kill/cover.jpg.512.jpg');
  const covers = await api.alternates(work);
  assert.equal(covers.some((url) => url.includes('mangadex.org/title/')), false);
  assert.equal(covers.some((url) => url.includes('uploads.mangadex.org/covers/akame-ga-kill/')), true);
  assert.equal(
    api.displayUrl('https://uploads.mangadex.org/covers/akame-ga-kill/cover.jpg.512.jpg'),
    '/api/media?url=' + encodeURIComponent('https://uploads.mangadex.org/covers/akame-ga-kill/cover.jpg.512.jpg')
  );
  assert.equal(
    api.displayUrl('https://ak-asset.jarir.com/example/cover.jpg'),
    '/api/media?url=' + encodeURIComponent('https://ak-asset.jarir.com/example/cover.jpg')
  );
});

test('Capacitor iOS keeps remote cover URLs instead of routing them to the unavailable localhost proxy', () => {
  const api = loadCoverApi([], null, {
    location: { origin: 'https://localhost', hostname: 'localhost' },
    Capacitor: {
      isNativePlatform: () => true,
      getPlatform: () => 'ios'
    }
  });
  const cover = 'https://cdn.myanimelist.net/images/manga/3/123.jpg';

  assert.equal(api.displayUrl(cover), cover);
});

test('Open Library work ids use exact editions and never title-search another work', async () => {
  const requests = [];
  const api = loadCoverApi(requests);
  await api.alternates({
    id: 'ol-novel-works-ol123456w',
    title: 'The Lord of the Rings',
    type: 'Novel',
    auth: 'J. R. R. Tolkien',
    sourceCoverUrl: 'https://covers.openlibrary.org/b/id/1-L.jpg'
  });
  assert.equal(requests.some((url) => url.includes('/works/OL123456W/editions.json')), true);
  assert.equal(requests.some((url) => url.includes('openlibrary.org/search.json')), false);
  assert.equal(requests.some((url) => url.includes('googleapis.com/books')), false);
});

test('Open Library comics use only exact-work editions instead of broad manga and book searches', async () => {
  const requests = [];
  const api = loadCoverApi(requests, (url) => {
    if (url.includes('/works/OL2897798W/editions.json')) {
      return { entries: [{ covers: [101, 102, 103] }] };
    }
    return {};
  });

  const covers = await api.alternates({
    id: 'ol-comics-works-ol2897798w',
    title: 'Batman',
    type: 'Comics',
    auth: 'Bob Kane'
  });

  assert.equal(requests.some((url) => url.includes('/works/OL2897798W/editions.json')), true);
  assert.equal(requests.some((url) => url.includes('api.mangadex.org')), false);
  assert.equal(requests.some((url) => url.includes('api.tenrai.org')), false);
  assert.equal(requests.some((url) => url.includes('googleapis.com/books')), false);
  assert.deepEqual(Array.from(covers), [101, 102, 103].map((id) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`));
});

test('cover title matching rejects a different work with overlapping metadata', () => {
  const api = loadCoverApi([]);
  assert.equal(api.sameWorkTitle({ title: 'Hunter x Hunter' }, 'Dragon Ball'), false);
  assert.equal(api.sameWorkTitle({ title: 'Hunter x Hunter' }, 'Hunter x Hunter Volume 4'), true);
});

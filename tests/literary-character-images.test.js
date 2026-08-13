const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadSystem(fetchImpl, literaryCatalog, characterCatalog, globals = {}) {
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
    LorefyLiteraryCharacterCatalog: literaryCatalog || {
      'ol-novel-test': [
        { id: 'lit-jon', key: 'jon-snow', name: 'Jon Snow', latin: 'Jon Snow', role: 'main', image: '', source: 'Wikipedia' },
        { id: 'lit-tyrion', key: 'tyrion-lannister', name: 'Tyrion Lannister', latin: 'Tyrion Lannister', role: 'support', image: '', source: 'Wikipedia' }
      ]
    },
    LorefyCharacterCatalog: characterCatalog || {},
    LorefyCatalogAliases: {},
    ...globals
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'lorefy-character-system.js' });
  return sandbox.LorefyCharacterSystem;
}

test('browser character requests use the same-origin AniList proxy when configured', async () => {
  const requests = [];
  const system = loadSystem(async (request) => {
    requests.push(String(request));
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          Media: {
            title: { romaji: 'My Hero Academia', english: 'My Hero Academia' },
            characters: {
              pageInfo: { currentPage: 1, lastPage: 1, hasNextPage: false, total: 2 },
              edges: [{ role: 'MAIN', node: { id: 1, name: { full: 'Izuku Midoriya' }, image: { large: '' } } }]
            }
          }
        }
      })
    };
  }, null, null, {
    location: { origin: 'http://127.0.0.1:8793' },
    LOREFY_REMOTE_CATALOG: { proxyBaseUrl: 'api/catalog' }
  });

  const cast = await system.anilistCastByMal(30413, ['My Hero Academia']);
  assert.equal(requests[0], '/api/catalog/anilist');
  assert.equal(cast.length, 1);
});

test('AniList retries a rate-limit error returned inside a GraphQL success response', async () => {
  let calls = 0;
  const system = loadSystem(async () => {
    calls += 1;
    if (calls === 1) {
      return { ok: true, status: 200, json: async () => ({ errors: [{ message: 'Too Many Requests.', status: 429 }] }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          Media: {
            title: { romaji: 'Example' },
            characters: {
              pageInfo: { currentPage: 1, lastPage: 1, hasNextPage: false, total: 1 },
              edges: [{ role: 'MAIN', node: { id: 1, name: { full: 'Example Hero' }, image: { large: '' } } }]
            }
          }
        }
      })
    };
  });

  const cast = await system.anilistCastByMal(1, ['Example']);
  assert.equal(calls, 2);
  assert.equal(cast.length, 1);
});

test('MAL works replace a 25-row bundled preview with the complete fallback cast', async () => {
  const preview = Array.from({ length: 25 }, (_, index) => ({
    id: `preview-${index + 1}`,
    key: `preview-${index + 1}`,
    name: `Preview ${index + 1}`,
    latin: `Preview ${index + 1}`
  }));
  const edges = Array.from({ length: 100 }, (_, index) => ({
    role: index < 5 ? 'MAIN' : 'SUPPORTING',
    node: {
      id: index + 1,
      name: { full: `Character ${index + 1}`, native: '', userPreferred: `Character ${index + 1}` },
      image: { large: `https://images.example/${index + 1}.jpg`, medium: '' }
    }
  }));
  const requests = [];
  const system = loadSystem(async (request) => {
    const url = String(request);
    requests.push(url);
    if (url.includes('api.jikan.moe')) return { ok: false, status: 429, json: async () => ({}) };
    if (url.includes('graphql.anilist.co')) {
      return { ok: true, json: async () => ({ data: { Media: { title: { romaji: 'Example' }, characters: { edges } } } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  }, {}, { 'mal-manga-1-example': preview });

  const cast = await system.loadCast({ id: 'mal-manga-1-example', mal: 1, type: 'Manga', title: 'Example' });

  assert.equal(cast.length, 100);
  assert.equal(requests.some((url) => url.includes('graphql.anilist.co')), true);
});

test('a legacy 25-row complete cache cannot suppress a fresh full cast request', async () => {
  const staleCast = Array.from({ length: 25 }, (_, index) => ({
    id: `stale-${index + 1}`,
    key: `stale-${index + 1}`,
    name: `Stale ${index + 1}`,
    latin: `Stale ${index + 1}`
  }));
  const storage = new Map([[
    'lorefy.characterCastCache.v6',
    JSON.stringify({
      'mal-manga-1-example': { cast: staleCast, complete: true, source: 'AniList', ts: Date.now() }
    })
  ]]);
  let requests = 0;
  const system = loadSystem(async (request) => {
    assert.match(String(request), /graphql\.anilist\.co/);
    requests += 1;
    return {
      ok: true,
      json: async () => ({ data: { Media: {
        title: { romaji: 'Example' },
        characters: {
          pageInfo: { currentPage: 1, lastPage: 1, hasNextPage: false, total: 26 },
          edges: Array.from({ length: 26 }, (_, index) => ({
            role: 'SUPPORTING',
            node: { id: index + 1, name: { full: `Fresh ${index + 1}` }, image: { large: '' } }
          }))
        }
      } } })
    };
  }, {}, {}, { localStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value)
  } });

  const cast = await system.loadCast({ id: 'mal-manga-1-example', mal: 1, type: 'Manga', title: 'Example' });
  assert.equal(requests, 1);
  assert.equal(cast.length, 26);
  assert.equal(cast.complete, true);
});

test('MAL fallback walks every AniList character page when Jikan is unavailable', async () => {
  const preview = Array.from({ length: 25 }, (_, index) => ({
    id: `preview-${index + 1}`,
    key: `preview-${index + 1}`,
    name: `Preview ${index + 1}`,
    latin: `Preview ${index + 1}`
  }));
  const requestedPages = [];
  const requestedPageSizes = [];
  const system = loadSystem(async (request, options) => {
    const url = String(request);
    if (url.includes('api.jikan.moe')) return { ok: false, status: 504, json: async () => ({}) };
    if (url.includes('graphql.anilist.co')) {
      const body = JSON.parse(options.body);
      const page = Number(body.variables.page || 1);
      requestedPages.push(page);
      requestedPageSizes.push(Number(body.variables.perPage || 0));
      const edges = Array.from({ length: 25 }, (_, index) => {
        const n = (page - 1) * 25 + index + 1;
        return {
          role: n < 6 ? 'MAIN' : 'SUPPORTING',
          node: { id: n, name: { full: `Character ${n}` }, image: { large: `https://images.example/${n}.jpg` } }
        };
      });
      return {
        ok: true,
        json: async () => ({ data: { Media: { title: { romaji: 'Boku no Hero Academia' }, characters: {
          pageInfo: { currentPage: page, lastPage: 2, hasNextPage: page < 2, total: 50 },
          edges
        } } } })
      };
    }
    throw new Error(`unexpected request: ${url}`);
  }, {}, { 'mal-manga-30413-boku-no-hero-academia': preview });

  const cast = await system.loadCast({
    id: 'mal-manga-30413-boku-no-hero-academia',
    mal: 30413,
    type: 'Manga',
    title: 'Boku no Hero Academia'
  });

  assert.equal(cast.length, 50);
  assert.deepEqual(Array.from(requestedPages), [1, 2]);
  assert.deepEqual(Array.from(requestedPageSizes), [50, 50]);
});

test('AniList follows the latest pageInfo instead of a stale first-page total', async () => {
  const requestedPages = [];
  const system = loadSystem(async (request, options) => {
    const body = JSON.parse(options.body);
    const page = Number(body.variables.page || 1);
    requestedPages.push(page);
    const edges = Array.from({ length: page === 3 ? 4 : 25 }, (_, index) => ({
      role: index === 0 ? 'MAIN' : 'SUPPORTING',
      node: { id: (page - 1) * 25 + index + 1, name: { full: `Character ${page}-${index + 1}` }, image: { large: '' } }
    }));
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: { Media: {
        title: { romaji: 'Example' },
        characters: {
          pageInfo: {
            currentPage: page,
            // The upstream source can correct this after its first response.
            lastPage: page === 1 ? 20 : 3,
            hasNextPage: page < 3,
            total: page === 1 ? 500 : 54
          },
          edges
        }
      } } })
    };
  }, {});

  const cast = await system.anilistCastByMal(1, ['Example']);

  assert.deepEqual(Array.from(requestedPages), [1, 2, 3]);
  assert.equal(cast.length, 54);
});

test('wrong AniList MAL mappings are rejected before title-verified pagination', async () => {
  const requestedSources = [];
  const system = loadSystem(async (request, options) => {
    const url = String(request);
    if (!url.includes('graphql.anilist.co')) throw new Error(`unexpected request: ${url}`);
    const body = JSON.parse(options.body);
    const variables = body.variables || {};
    const isMalLookup = Object.prototype.hasOwnProperty.call(variables, 'id');
    const page = Number(variables.page || 1);
    requestedSources.push(isMalLookup ? `mal:${page}` : `title:${page}`);
    const target = !isMalLookup;
    const edges = Array.from({ length: 25 }, (_, index) => {
      const n = (page - 1) * 25 + index + 1;
      return {
        role: n === 1 ? 'MAIN' : 'SUPPORTING',
        node: { id: n + (target ? 1000 : 0), name: { full: `${target ? 'Target' : 'Wrong'} ${n}` }, image: { large: '' } }
      };
    });
    return {
      ok: true,
      json: async () => ({ data: { Media: {
        title: { romaji: target ? 'Target Work' : 'Different Work' },
        characters: {
          pageInfo: { currentPage: page, lastPage: target ? 2 : 1, hasNextPage: target && page < 2, total: target ? 50 : 25 },
          edges
        }
      } } })
    };
  }, {});

  const cast = await system.loadCast({ id: 'mal-manga-999-target-work', mal: 999, type: 'Manga', title: 'Target Work' });

  assert.equal(cast.length, 50);
  assert.equal(cast.every((row) => row.name.startsWith('Target ')), true);
  assert.deepEqual(requestedSources, ['mal:1', 'title:1', 'title:2']);
});

test('AniList title fallback rejects a spin-off whose title only contains the requested work', async () => {
  const system = loadSystem(async () => ({
    ok: true,
    json: async () => ({ data: { Media: {
      title: { romaji: 'Target Work: Side Story' },
      characters: {
        pageInfo: { currentPage: 1, lastPage: 1, hasNextPage: false, total: 1 },
        edges: [{ role: 'MAIN', node: { id: 1, name: { full: 'Wrong Character' }, image: { large: '' } } }]
      }
    } } })
  }), {});

  await assert.rejects(() => system.anilistCastByTitle('Target Work'), /anilist title mismatch/);
});

test('AniList title fallback preserves Japanese titles when rejecting a spin-off', async () => {
  const system = loadSystem(async () => ({
    ok: true,
    json: async () => ({ data: { Media: {
      title: { native: '\u50d5\u306e\u30d2\u30fc\u30ed\u30fc\u30a2\u30ab\u30c7\u30df\u30a2 \u5916\u4f1d' },
      characters: {
        pageInfo: { currentPage: 1, lastPage: 1, hasNextPage: false, total: 1 },
        edges: [{ role: 'MAIN', node: { id: 1, name: { full: 'Wrong Character' }, image: { large: '' } } }]
      }
    } } })
  }), {});

  await assert.rejects(() => system.anilistCastByTitle('\u50d5\u306e\u30d2\u30fc\u30ed\u30fc\u30a2\u30ab\u30c7\u30df\u30a2'), /anilist title mismatch/);
});

test('complete bundled MAL casts render immediately without a network wait', async () => {
  const complete = Array.from({ length: 150 }, (_, index) => ({
    id: `complete-${index + 1}`,
    key: `complete-${index + 1}`,
    name: `Complete ${index + 1}`,
    latin: `Complete ${index + 1}`
  }));
  let requested = false;
  const system = loadSystem(async () => {
    requested = true;
    throw new Error('network should not be called');
  }, {}, { 'mal-manga-13-one-piece': complete });

  const cast = await system.loadCast({ id: 'mal-manga-13-one-piece', mal: 13, type: 'Manga', title: 'One Piece' });

  assert.equal(cast.length, 150);
  assert.equal(requested, false);
});

test('literary catalog casts hydrate missing images from a work-scoped source', async () => {
  const system = loadSystem(async (request) => {
    const url = String(request);
    if (url.includes('en.wikipedia.org') && url.includes('pageimages')) {
      return {
        ok: true,
        json: async () => ({ query: { pages: {
          '1': { title: 'Jon Snow', thumbnail: { source: 'https://images.example/jon.jpg' } },
          '2': { title: 'Tyrion Lannister', thumbnail: { source: 'https://images.example/tyrion.jpg' } }
        } } })
      };
    }
    throw new Error(`unexpected request: ${url}`);
  });

  const cast = await system.loadCast({ id: 'ol-novel-test', type: 'Novel', title: 'A Game of Thrones' });
  assert.equal(cast.length, 2);
  assert.deepEqual(Array.from(cast, (row) => row.image), [
    'https://images.example/jon.jpg',
    'https://images.example/tyrion.jpg'
  ]);
});

test('literary image options never fall back to an unrelated Jikan name search', async () => {
  let requested = '';
  const system = loadSystem(async (request) => {
    requested = String(request);
    throw new Error('network unavailable');
  });

  const options = await system.loadImageOptions({
    id: 'lit-jon',
    name: 'Jon Snow',
    latin: 'Jon Snow',
    image: 'https://images.example/jon.jpg'
  });
  assert.deepEqual(Array.from(options), ['https://images.example/jon.jpg']);
  assert.equal(requested.includes('api.jikan.moe'), false);
});

test('literary remote casts keep a broad work-scoped list and batch image hydration', async () => {
  const requests = [];
  const castRows = Array.from({ length: 75 }, (_, index) => `[[Person ${index + 1}]]`).join('\n');
  const system = loadSystem(async (request) => {
    const url = String(request);
    requests.push(url);
    if (url.includes('list=search')) {
      return { ok: true, json: async () => ({ query: { search: [{ title: 'A Game of Thrones' }] } }) };
    }
    if (url.includes('action=parse')) {
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': `== Characters ==\n${castRows}` } } }) };
    }
    if (url.includes('prop=pageimages')) {
      const params = new URL(url).searchParams;
      const pages = {};
      params.get('titles').split('|').forEach((title, index) => {
        pages[String(index + 1)] = { title, thumbnail: { source: `https://images.example/${encodeURIComponent(title)}.jpg` } };
      });
      return { ok: true, json: async () => ({ query: { pages } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  }, {});

  const cast = await system.loadCast({ id: 'ol-novel-no-catalog', type: 'Novel', title: 'A Game of Thrones', auth: 'George R. R. Martin' });
  assert.equal(cast.length, 75);
  assert.equal(cast.filter((row) => row.image).length, 75);
  assert.equal(requests.filter((url) => url.includes('prop=pageimages')).length, 2);
});

test('literary image hydration follows Wikipedia redirects and normalized titles', async () => {
  const system = loadSystem(async (request) => {
    const url = String(request);
    if (url.includes('prop=pageimages')) {
      return {
        ok: true,
        json: async () => ({
          query: {
            normalized: [{ from: 'Eddard "Ned" Stark', to: 'Eddard Ned Stark' }],
            redirects: [{ from: 'Eddard Ned Stark', to: 'Ned Stark' }],
            pages: {
              '1': { title: 'Ned Stark', thumbnail: { source: 'https://images.example/ned.jpg' } }
            }
          }
        })
      };
    }
    throw new Error(`unexpected request: ${url}`);
  }, {
    'ol-novel-test': [
      { id: 'lit-ned', key: 'ned-stark', name: 'Eddard Stark', latin: 'Eddard "Ned" Stark', role: 'main', image: '', source: 'Wikipedia', wikiTitle: 'Eddard "Ned" Stark' }
    ]
  });

  const cast = await system.loadCast({ id: 'ol-novel-test', type: 'Novel', title: 'A Game of Thrones' });
  assert.equal(cast[0].image, 'https://images.example/ned.jpg');
});

test('literary image hydration matches accented names to normalized Wikipedia titles', async () => {
  const system = loadSystem(async (request) => {
    const url = String(request);
    if (url.includes('prop=pageimages')) {
      return { ok: true, json: async () => ({ query: { pages: {
        '1': { title: 'Kili', pageprops: { wikibase_item: 'Q423759' } }
      } } }) };
    }
    if (url.includes('www.wikidata.org') && url.includes('action=wbgetentities')) {
      return { ok: true, json: async () => ({ entities: {
        Q423759: { descriptions: { en: { value: 'fictional character from Middle-earth' } }, claims: { P18: [{ mainsnak: { datavalue: { value: 'Kili.jpg' } } }] } }
      } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  }, {
    'ol-novel-test': [
      { id: 'lit-kili', key: 'kili', name: 'K\u00EDli', latin: 'K\u00EDli', role: 'main', image: '', source: 'LOTR Wiki', wikiTitle: 'K\u00EDli' }
    ]
  });

  const cast = await system.loadCast({ id: 'ol-novel-test', type: 'Novel', title: 'The Hobbit' });
  assert.match(cast[0].image, /commons\.wikimedia\.org\/wiki\/Special:FilePath\/Kili\.jpg/);
});

test('literary image hydration uses character-scoped Wikidata portraits when Wikipedia has no thumbnail', async () => {
  const system = loadSystem(async (request) => {
    const url = String(request);
    if (url.includes('prop=pageimages')) {
      return {
        ok: true,
        json: async () => ({ query: { pages: {
          '1': { title: 'Gandalf', pageprops: { wikibase_item: 'Q177499' } }
        } } })
      };
    }
    if (url.includes('www.wikidata.org') && url.includes('action=wbgetentities')) {
      return {
        ok: true,
        json: async () => ({ entities: {
          Q177499: {
            descriptions: { en: { value: 'fictional character from a fantasy legendarium' } },
            claims: { P18: [{ mainsnak: { datavalue: { value: 'GANDALF.jpg' } } }] }
          }
        } })
      };
    }
    throw new Error(`unexpected request: ${url}`);
  }, {
    'ol-novel-test': [
      { id: 'lit-gandalf', key: 'gandalf', name: 'Gandalf', latin: 'Gandalf', role: 'main', image: '', source: 'Wikipedia', wikiTitle: 'Gandalf' }
    ]
  });

  const cast = await system.loadCast({ id: 'ol-novel-test', type: 'Novel', title: 'The Hobbit' });
  assert.match(cast[0].image, /commons\.wikimedia\.org\/wiki\/Special:FilePath\/GANDALF\.jpg/);
});

test('Fandom literary casts use the same work-scoped image hydration', async () => {
  const system = loadSystem(async (request) => {
    const url = String(request);
    if (url.includes('riordan.fandom.com') && url.includes('action=parse')) {
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': '== Characters ==\n[[Percy Jackson]]\n[[Annabeth Chase]]' } } }) };
    }
    if (url.includes('prop=pageimages')) {
      const titles = new URL(url).searchParams.get('titles').split('|');
      const pages = {};
      titles.forEach((title, index) => { pages[String(index + 1)] = { title, thumbnail: { source: `https://images.example/${index + 1}.jpg` } }; });
      return { ok: true, json: async () => ({ query: { pages } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  }, {});

  const cast = await system.loadCast({ id: 'n-percy-jackson-lightning', type: 'Novel', title: 'The Lightning Thief' });
  assert.equal(cast.length, 2);
  assert.equal(cast.filter((row) => row.image).length, 2);
});

test('Fandom cast tables keep character rows and discard actors or locations', async () => {
  const system = loadSystem(async (request) => {
    const url = String(request);
    if (url.includes('gameofthrones.fandom.com') && url.includes('action=parse')) {
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': '== Starring ==\n#[[Actor One]] as Lord [[Jon Snow]]\n#[[Actor Two]] as [[Catelyn Stark]]\n== Guest starring ==\n#[[Actor Three]] as [[Winterfell]]' } } }) };
    }
    if (url.includes('prop=pageimages')) {
      const titles = new URL(url).searchParams.get('titles').split('|');
      const pages = {};
      titles.forEach((title, index) => { pages[String(index + 1)] = { title, thumbnail: { source: `https://images.example/${index + 1}.jpg` } }; });
      return { ok: true, json: async () => ({ query: { pages } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  }, {});

  const cast = await system.loadCast({ id: 'n-game-of-thrones', type: 'Novel', title: 'A Game of Thrones' });
  assert.deepEqual(Array.from(cast, (row) => row.name), ['Jon Snow', 'Catelyn Stark']);
  assert.equal(cast.filter((row) => row.image).length, 2);
});

test('literary works can fall back to a dedicated Wikipedia character page', async () => {
  const requests = [];
  const system = loadSystem(async (request) => {
    const url = String(request);
    requests.push(url);
    if (url.includes('list=search')) {
      const query = new URL(url).searchParams.get('srsearch') || '';
      return { ok: true, json: async () => ({ query: { search: [{ title: query.includes('characters') ? 'Characters of The Lord of the Rings' : 'The Lord of the Rings' }] } }) };
    }
    if (url.includes('action=parse')) {
      const page = new URL(url).searchParams.get('page');
      const text = page.includes('Characters') ? '== Characters ==\n[[Frodo Baggins]]\n[[Aragorn]]' : '== Publication ==\nNo cast here';
      return { ok: true, json: async () => ({ parse: { wikitext: { '*': text } } }) };
    }
    if (url.includes('prop=pageimages')) {
      const titles = new URL(url).searchParams.get('titles').split('|');
      const pages = {};
      titles.forEach((title, index) => { pages[String(index + 1)] = { title, thumbnail: { source: `https://images.example/${index + 1}.jpg` } }; });
      return { ok: true, json: async () => ({ query: { pages } }) };
    }
    throw new Error(`unexpected request: ${url}`);
  }, {});

  const cast = await system.loadCast({ id: 'ol-novel-no-catalog', type: 'Novel', title: 'The Lord of the Rings', auth: 'J. R. R. Tolkien' });
  assert.deepEqual(Array.from(cast, (row) => row.name), ['Frodo Baggins', 'Aragorn']);
  assert.equal(cast.filter((row) => row.image).length, 2);
  assert.equal(requests.filter((url) => url.includes('list=search')).length, 2);
});

test('the browser loads the image-scoped character system after the catalog', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /modules\/lorefy-character-system\.js\?v=20260726-character-cast-v17/);
  assert.match(index, /modules\/lorefy-catalog-updater\.js\?v=20260726-catalog-safety-v4/);
  const catalogAt = index.indexOf('uploads/lorefy-character-catalog.js?v=20260722-character-images-v2');
  const systemAt = index.indexOf('modules/lorefy-character-system.js?v=20260726-character-cast-v17');
  const appAt = index.indexOf('uploads/files/lorefy-app.js');
  assert.ok(catalogAt > 0 && catalogAt < systemAt && systemAt < appAt);
  assert.doesNotMatch(index.slice(index.indexOf('window.LOREFY_DEFERRED_ASSETS')), /lorefy-character/);
});

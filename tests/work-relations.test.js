const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sourcePath = path.join(__dirname, '../modules/lorefy-work-relations.js');
function api() {
  assert.ok(fs.existsSync(sourcePath), 'verified work relationships must be implemented');
  return require(sourcePath);
}
const work = { id: 'mal-manga-2-berserk', type: 'Manga' };
function node(id, overrides = {}) {
  return { id, idMal: id + 100, type: 'MANGA', format: 'MANGA', isAdult: false,
    title: { english: 'Part ' + id }, coverImage: { large: 'https://example.com/' + id + '.jpg' },
    countryOfOrigin: 'JP', status: 'FINISHED', chapters: 30, ...overrides };
}
function media(edges, overrides = {}) {
  return { id: 30002, idMal: 2, relations: { edges, pageInfo: { hasNextPage: false } }, ...overrides };
}
function response(data) { return { ok: true, json: async () => ({ data: { Media: data } }) }; }
const edge = (kind, data) => ({ relationType: kind, node: data });

test('relations use exact manga provider IDs, never title search or arbitrary digits', () => {
  const r = api();
  assert.deepEqual(r.identity(work), { idMal: 2, key: 'mal:2' });
  assert.deepEqual(r.identity({ id: 'api-anilist-30002-berserk' }), { id: 30002, key: 'anilist:30002' });
  for (const w of [{ id: 'ol-OL2W' }, { id: 'mal-anime-2' }, { id: 'random-2' }, { title: 'Berserk' }, { anilistId: -1 }, { anilistId: 2, type: 'Anime' }]) assert.equal(r.identity(w), null);
});

test('relations preserve source edge meaning and reject mismatched root identity', () => {
  const r = api();
  const result = r.parse(media([edge('SEQUEL', node(3)), edge('PREQUEL', node(4))]), r.identity(work));
  assert.deepEqual(result.items.map(x => x.kind), ['PREQUEL', 'SEQUEL']);
  assert.throws(() => r.parse(media([], { idMal: 200 }), r.identity(work)), /identity/i);
  assert.equal(r.label('SEQUEL', 'en'), 'Sequel');
  assert.equal(r.label('OTHER', 'en'), 'Related work');
});

test('relations exclude anime, explicit, AI, unknown adult status, self and duplicate edges', () => {
  const r = api();
  const edges = [edge('SEQUEL', node(3)), edge('SEQUEL', node(3)), edge('OTHER', node(30002)),
    edge('ADAPTATION', node(4, { type: 'ANIME' })), edge('SIDE_STORY', node(5, { isAdult: true })),
    edge('OTHER', node(6, { isAdult: null })), edge('OTHER', node(7, { isAiGenerated: true })),
    edge('OTHER', node(8, { genres: ['Hentai'] })), edge('INVENTED', node(9))];
  const policy = require('../modules/lorefy-catalog-policy.js');
  const result = r.parse(media(edges), r.identity(work), policy);
  assert.deepEqual(result.items.map(x => x.node.id), [3]);
});

test('catalog resolution cannot confuse same-titled works or MAL and AniList ID namespaces', () => {
  const r = api();
  const wrong = { id: 'api-anilist-103-other', title: 'Part 3' };
  const correct = { id: 'mal-manga-103-part', title: 'Part 3' };
  assert.equal(r.resolve(node(3), [wrong, correct]), correct);
  assert.equal(r.resolve(node(3), [wrong]), null);
  assert.equal(r.resolve(node(3), [{ type: 'Anime', malId: 103 }]), null);
});

test('unlisted related work retains real metadata without invented rating or description', () => {
  const r = api();
  const w = r.toWork(node(3, { format: 'NOVEL', countryOfOrigin: 'JP' }));
  assert.equal(w.anilistId, 3);
  assert.equal(w.malId, 103);
  assert.equal(w.r, 0);
  assert.equal(w.synopsis, '');
  assert.equal(w.type, 'لايت نوفل');
  assert.equal(w.ch, 30);
  assert.equal(w.sourceCoverUrl, 'https://example.com/3.jpg');
  assert.equal(r.toWork(node(3, { format: 'NOVEL', countryOfOrigin: 'CN' })).type, 'رواية');
});

test('related works credit the Story author, not the first illustrator or original creator', () => {
  const r = api();
  const staff = { edges: [
    { role: 'Original Creator', node: { name: { full: 'Kentarou Miura' } } },
    { role: 'Illustration', node: { name: { full: 'Kentarou Miura' } } },
    { role: 'Story', node: { name: { full: 'Makoto Fukami' } } }
  ] };
  assert.equal(r.toWork(node(100299, { staff, format: 'NOVEL' })).auth, 'Makoto Fukami');
  assert.equal(r.toWork(node(3, { staff: { nodes: [{ name: { full: 'Unclassified staff' } }] } })).auth, '');
});

test('verified writer correction preserves identity, artwork and unrelated editorial credits', () => {
  const r = api();
  const n = node(100299, { staff: { edges: [
    { role: 'Illustration', node: { name: { full: 'Kentarou Miura' } } },
    { role: 'Story', node: { name: { full: 'Makoto Fukami' } } }
  ] } });
  const w = { id: 'mal-manga-100399-novel', auth: 'Miura, Kentarou', sourceCoverUrl: 'custom.jpg' };
  const fixed = r.withVerifiedCredit(w, n);
  assert.equal(fixed.auth, 'Makoto Fukami');
  assert.equal(fixed.id, w.id);
  assert.equal(fixed.sourceCoverUrl, 'custom.jpg');
  const editorial = { ...w, auth: 'Editorial credit' };
  assert.equal(r.withVerifiedCredit(editorial, n), editorial);
  const wrong = { ...w, id: 'api-anilist-7-other' };
  assert.equal(r.withVerifiedCredit(wrong, n), wrong);
});

test('requests are exact, coalesced, cached and never background-load unrelated works', async () => {
  const r = api();
  let calls = 0, body;
  const client = r.createClient({ fetch: async (url, opts) => { calls++; body = JSON.parse(opts.body); return response(media([edge('SEQUEL', node(3))])); } });
  const [a, b] = await Promise.all([client.load(work), client.load(work)]);
  assert.equal(a, b);
  await client.load(work);
  assert.equal(calls, 1);
  assert.equal(body.variables.idMal, 2);
  assert.equal(Object.hasOwn(body.variables, 'id'), false);
  assert.doesNotMatch(body.query, /Media\(id:\$id,idMal:/);
  assert.doesNotMatch(body.query, /search:|relations\(/);
  const unsupported = await client.load({ id: 'ol-OL2W' });
  assert.equal(unsupported.status, 'unsupported');
  assert.equal(calls, 1);
});

test('network/GraphQL errors are retryable and never cached as an empty series', async () => {
  const r = api();
  let calls = 0;
  const client = r.createClient({ fetch: async () => (++calls === 1 ? { ok: true, json: async () => ({ errors: [{ message: 'Busy' }] }) } : response(media([]))) });
  await assert.rejects(client.load(work), /Busy/);
  assert.equal((await client.load(work)).items.length, 0);
  assert.equal(calls, 2);
});

test('a request that never resolves still releases pending state after its deadline', async () => {
  const r = api();
  let calls = 0;
  const client = r.createClient({ timeoutMs: 20, fetch: async () => { calls++; return new Promise(() => {}); } });
  await assert.rejects(client.load(work), /timeout/i);
  await assert.rejects(client.load(work), /timeout/i);
  assert.equal(calls, 2);
});

test('a timed-out response cannot overwrite a newer successful request cache', async () => {
  const r = api();
  let release, calls = 0;
  const client = r.createClient({ timeoutMs: 20, fetch: async () => {
    calls++; if (calls === 1) return new Promise(resolve => { release = resolve; });
    return response(media([edge('SEQUEL', node(4))]));
  } });
  await assert.rejects(client.load(work), /timeout/i);
  await client.load(work);
  release(response(media([edge('SEQUEL', node(3))])));
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal((await client.load(work)).items[0].node.id, 4);
});

test('persistent cache is bounded and stale entries do not suppress refresh', async () => {
  const r = api();
  let value = null, clock = 0, calls = 0;
  const storage = { getItem: () => value, setItem: (_, v) => { value = v; } };
  const options = { storage, now: () => clock, ttlMs: 100, fetch: async (_, opts) => {
    calls++; const id = JSON.parse(opts.body).variables.id;
    return response({ ...media([]), id });
  } };
  const client = r.createClient(options);
  for (let id = 1; id <= 45; id++) await client.load({ anilistId: id });
  assert.ok(JSON.parse(value).entries.length <= 40);
  await r.createClient(options).load({ anilistId: 45 });
  assert.equal(calls, 45);
  clock = 101;
  await r.createClient(options).load({ anilistId: 45 });
  assert.equal(calls, 46);
});

test('newly opened source works survive a cold client start independently of relation expiry', () => {
  const r = api(); let value = null;
  const storage = { getItem: () => value, setItem: (_, v) => { value = v; } };
  const client = r.createClient({ storage, fetch: async () => response(media([])) });
  client.rememberOpened(node(3));
  const cold = r.createClient({ storage, fetch: async () => response(media([])) });
  assert.equal(cold.openedWorks()[0].anilistId, 3);
  client.rememberOpened(node(4, { isAdult: true }));
  assert.equal(client.openedWorks().length, 1);
});

test('startup restores opened source records without overwriting a canonical catalog work', () => {
  api();
  const canonical = { id: 'mal-manga-103-original', title: 'Canonical title', custom: true };
  let ingests = 0;
  const root = { document: {}, addEventListener() {}, fetch: async () => response(media([])),
    localStorage: { getItem: () => JSON.stringify({ entries: [], opened: [node(3), node(4)] }) },
    LorefyMangaData: [canonical], __lorefyIngest: () => { ingests++; } };
  vm.runInNewContext(fs.readFileSync(sourcePath, 'utf8'), { window: root });
  assert.equal(root.LorefyMangaData.length, 2);
  assert.equal(root.LorefyMangaData[0], canonical);
  assert.equal(root.LorefyMangaData[1].anilistId, 4);
  assert.equal(ingests, 1);
});

test('relationships are integrated as a bilingual React section with themed stable rows', () => {
  api();
  const app = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../styles/lorefy-work-relations.css'), 'utf8');
  assert.match(app, /LorefyWorkRelations.Section,\{work:m,language:W,onOpen:T/);
  assert.ok(html.indexOf('modules/lorefy-work-relations.js') < html.indexOf('uploads/files/lorefy-app.js'));
  assert.match(css, /minmax\(0,\s*1fr\)/);
  assert.match(css, /var\(--ui-ink\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /text-align: match-parent/);
  const chapters = fs.readFileSync(path.join(__dirname, '../modules/lorefy-chapter-detail.js'), 'utf8');
  assert.match(chapters, /querySelector\('\.lf-work-relations'\)/);
});

test('work header localizes source and singular chapter metadata on the first render', () => {
  const app = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
  const start = app.indexOf('ratingSourceLabel='), end = app.indexOf(',GENRE_AR=', start);
  const fn = vm.runInNewContext('(' + app.slice(start + 'ratingSourceLabel='.length, end) + ')', { currentUILang: () => 'ar' });
  assert.equal(fn({ rSrc: 'AniList' }, 'en'), 'via AniList');
  assert.match(app, /ratingSource:ratingSourceLabel\(m,W\)/);
  assert.match(app, /m\.ch===1\?"1 chapter":m\.ch\+" chapters"/);
});

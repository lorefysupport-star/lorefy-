const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadShareStudio(overrides = {}) {
  const sandbox = {
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    location: { href: 'http://127.0.0.1:8795/index.html', origin: 'http://127.0.0.1:8795' },
    LOREFY_RELEASE: {
      catalogProxyUrl: 'https://example.supabase.co/functions/v1/lorefy-public'
    },
    document: { getElementById: () => null, body: {} },
    MutationObserver: class { observe() {} },
    requestAnimationFrame() {},
    addEventListener() {},
    ...overrides
  };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'modules/lorefy-data-proxy.js'), 'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'modules/lorefy-share-studio.js'), 'utf8'), sandbox);
  return sandbox.LorefyShareStudio;
}

test('shared character images use the public image gateway before the direct URL', () => {
  const studio = loadShareStudio();
  const portrait = 'https://s4.anilist.co/file/anilistcdn/character/large/example.png';
  const candidates = studio.imageSources(portrait);
  assert.equal(candidates[0], 'https://example.supabase.co/functions/v1/lorefy-public/media?url=' + encodeURIComponent(portrait));
  assert.equal(candidates[1], portrait);
  assert.equal(studio.imageSources('/api/media?url=' + encodeURIComponent(portrait))[0], candidates[0]);
});

test('old top lists recover missing portraits from the loaded cast', () => {
  const studio = loadShareStudio();
  const selected = [{ id: 'mal-1', name: 'Guts', img: '' }, { id: 'old-id', name: 'Casca', img: '' }];
  const cast = [
    { id: 'mal-1', name: 'Guts', image: 'https://images.example/guts.jpg' },
    { id: 'anilist-2', name: 'Casca', image: 'https://images.example/casca.jpg' }
  ];
  const items = studio.characterShareItems(selected, cast, character => character.image || character.img || '');
  assert.deepEqual(Array.from(items, item => item.img), [cast[0].image, cast[1].image]);
});

test('native sharing uses the configured media gateway without depending on the auth client', () => {
  const studio = loadShareStudio({ Capacitor: { isNativePlatform: () => true } });
  const portrait = 'https://s4.anilist.co/file/anilistcdn/character/large/example.png';
  assert.equal(studio.imageSources(portrait)[0], 'https://example.supabase.co/functions/v1/lorefy-public/media?url=' + encodeURIComponent(portrait));
});

test('the exported top-ten poster draws all available character portraits', async () => {
  const portrait = 'https://s4.anilist.co/file/anilistcdn/character/large/example.png';
  const gateway = 'https://example.supabase.co/functions/v1/lorefy-public/media?url=';
  const loaded = [];
  let drawn = 0;
  const gradient = { addColorStop() {} };
  const context = {
    createLinearGradient: () => gradient,
    fillRect() {}, beginPath() {}, moveTo() {}, arc() {}, arcTo() {}, closePath() {}, fill() {},
    save() {}, restore() {}, clip() {}, stroke() {}, fillText() {},
    measureText: text => ({ width: String(text).length * 10 }),
    drawImage() { drawn += 1; }
  };
  class FakeImage {
    set src(value) {
      loaded.push(value);
      this.naturalWidth = 230;
      this.naturalHeight = 350;
      queueMicrotask(() => value.startsWith(gateway) ? this.onload() : this.onerror());
    }
  }
  class FakeFile {
    constructor(parts, name) { this.parts = parts; this.name = name; }
  }
  const document = {
    getElementById: () => null,
    body: {},
    createElement: tag => tag === 'canvas' ? {
      getContext: () => context,
      toBlob: callback => callback(new Blob(['poster'], { type: 'image/png' }))
    } : {}
  };
  const studio = loadShareStudio({ document, Image: FakeImage, File: FakeFile });
  const rows = Array.from({ length: 10 }, (_, index) => ({
    querySelector: selector => selector === 'img' ? {
      getAttribute: () => portrait,
      src: portrait
    } : selector === '.lf-cb-poster-name' ? { textContent: `Character ${index + 1}` } : null
  }));
  const card = {
    textContent: 'أفضل 10 شخصيات',
    getAttribute: () => 'shelf',
    querySelector: selector => selector.includes('h3') ? { textContent: 'أفضل 10 شخصيات' } : null,
    querySelectorAll: () => rows
  };

  const file = await studio.buildShelfStoryFile(card);
  assert.equal(file.name, 'lorefy-story.png');
  assert.equal(drawn, 10);
  assert.equal(loaded.length, 10);
  assert.ok(loaded.every(url => url.startsWith(gateway)));
  const captions = [];
  context.fillText = value => captions.push(String(value));
  const smallerCard = { ...card, querySelectorAll: () => rows.slice(0, 3) };
  await studio.buildShelfStoryFile(smallerCard);
  assert.equal(drawn, 13);
  assert.ok(!captions.includes('4'), 'unselected ranks must not appear as filler');
  drawn = 10;
  await studio.buildCommunityPostFile({ kind: 'top', attachment: { items: Array.from({ length: 10 }, (_, index) => ({ name: 'Character ' + index, image: portrait })) } });
  assert.equal(drawn, 20, 'community share must include the entire top ten, not only its four-item preview');
});

test('local preview config exposes the same public gateway as the release manifest', () => {
  const runtime = fs.readFileSync(path.join(root, 'config/lorefy-runtime.js'), 'utf8');
  const gateway = JSON.parse(fs.readFileSync(path.join(root, 'config/lorefy-build-public.json'), 'utf8')).catalogProxyUrl;
  assert.ok(runtime.includes(gateway));
});

test('a failed portrait prevents exporting a misleading placeholder poster', async () => {
  class FailedImage {
    set src(value) { queueMicrotask(() => this.onerror()); }
  }
  const context = {
    createLinearGradient: () => ({ addColorStop() {} }),
    fillRect() {}, beginPath() {}, moveTo() {}, arcTo() {}, closePath() {}, fill() {},
    save() {}, restore() {}, clip() {}, stroke() {}, fillText() {},
    measureText: text => ({ width: String(text).length * 10 }), drawImage() {}
  };
  const studio = loadShareStudio({ Image: FailedImage, File: class {}, document: {
    getElementById: () => null, body: {},
    createElement: () => ({ getContext: () => context, toBlob: callback => callback(new Blob(['poster'])) })
  } });
  const row = { querySelector: selector => selector === 'img' ? { src: 'https://images.example/portrait.png', getAttribute: () => null } : { textContent: 'Guts' } };
  const card = {
    getAttribute: () => 'shelf',
    querySelector: selector => selector.includes('h3') ? { textContent: 'Top characters' } : null,
    querySelectorAll: () => [row], textContent: 'Top characters'
  };
  await assert.rejects(studio.buildShelfStoryFile(card), error => error.code === 'LOREFY_SHARE_MEDIA_UNAVAILABLE');
  await assert.rejects(studio.buildCommunityPostFile({ kind: 'top', attachment: { items: [{ name: 'Guts', image: 'https://images.example/portrait.png' }] } }), error => error.code === 'LOREFY_SHARE_MEDIA_UNAVAILABLE');
});

test('browser fallback downloads the image instead of sharing only a URL', async () => {
  let downloaded = 0;
  let textShares = 0;
  class TestURL extends URL {
    static createObjectURL() { return 'blob:poster'; }
    static revokeObjectURL() {}
  }
  const studio = loadShareStudio({
    URL: TestURL,
    navigator: { share: async () => { textShares++; }, canShare: () => false },
    document: { getElementById: () => null, body: { appendChild() {} }, createElement: () => ({ click() { downloaded++; }, remove() {} }) }
  });
  const shared = await studio.nativeFileShare({ name: 'poster.png' }, 'Top list', 'My list');
  assert.equal(shared, false);
  assert.equal(downloaded, 1);
  assert.equal(textShares, 0);
});

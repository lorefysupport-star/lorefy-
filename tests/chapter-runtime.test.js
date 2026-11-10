const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const builderPath = path.join(root, 'tools/build-chapter-runtime.js');
const builder = fs.existsSync(builderPath) ? require(builderPath) : {compact: () => ''};
const original = fs.readFileSync(path.join(root, 'uploads/lorefy-chapter-overrides.js'), 'utf8');
function execute(source, records) {
  const window = {LorefyChapterData: records || {}};
  vm.runInNewContext(source, {window}, {timeout: 10000});
  return window.LorefyChapterData;
}
const plain = value => JSON.parse(JSON.stringify(value));

test('startup uses a compact synchronous chapter map instead of the full metadata script', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /src="uploads\/lorefy-chapter-overrides\.js/);
  assert.match(html, /src="uploads\/lorefy-chapter-runtime\.js/);
  assert.ok(html.indexOf('uploads/lorefy-chapter-runtime.js') < html.indexOf('uploads/files/lorefy-app.js'));
});

test('compact metadata retains every chapter count, source, field and iteration order', () => {
  const expected = execute(original), actual = execute(builder.compact(expected));
  assert.deepEqual(plain(actual), plain(expected));
  assert.equal(Object.keys(actual).length, 3120);
  assert.deepEqual(Object.keys(actual), Object.keys(expected));
  for (const id of Object.keys(expected)) assert.deepEqual(Object.keys(actual[id]), Object.keys(expected[id]), id);
});

test('runtime preserves the map reference, unrelated updates and independent record objects', () => {
  const input = {a: {chapters: 3, latestChapter: 3, status: 'ongoing', sourceUrl: 'https://example.test/a'}, b: {chapters: 3, latestChapter: 3, status: 'ongoing', sourceUrl: 'https://example.test/b'}};
  const target = {unrelated: {chapters: 99}, a: {chapters: 1}};
  const actual = execute(builder.compact(input), target);
  assert.equal(actual, target);
  assert.equal(actual.unrelated.chapters, 99);
  assert.equal(actual.a.chapters, 3);
  assert.notEqual(actual.a, actual.b);
  actual.a.status = 'changed';
  assert.equal(actual.b.status, 'ongoing');
});

test('different latest counts, zero volumes, Unicode and unusual field sets survive factoring', () => {
  const records = {
    'work-ثاني': {chapters: 0, latestChapter: 2, volumes: 0, source: 'مؤلف "اسم"', sourceUrl: 'https://example.test/الفصل?x="a"'},
    'work-first': {chapters: 4, latestChapter: 4, volumes: 1, source: 'مؤلف "اسم"', sourceUrl: 'https://example.test/أخرى'},
    empty: {}, noCount: {sourceUrl: '', status: 'unknown'},
    textCounts: {chapters: '12', latestChapter: '12', sourceUrl: ''},
    signedZero: {chapters: -0, latestChapter: 0, sourceUrl: ''},
  };
  const actual = execute(builder.compact(records));
  assert.deepEqual(plain(actual), plain(records));
  assert.ok(Object.is(actual.signedZero.chapters, -0));
  assert.ok(Object.is(actual.signedZero.latestChapter, 0));
});

test('generator rejects unrecognized metadata shapes instead of dropping their values', () => {
  for (const value of [null, [], {nested: 1}, undefined, Infinity, NaN]) {
    assert.throws(() => builder.compact({work: {newField: value}}), /Unsupported chapter metadata/);
  }
});

test('checked-in runtime is deterministic and under a 240KiB startup budget', () => {
  const file = path.join(root, 'uploads/lorefy-chapter-runtime.js');
  assert.ok(fs.existsSync(file), 'generated runtime must ship in source');
  const runtime = fs.readFileSync(file, 'utf8');
  assert.equal(runtime, builder.compact(execute(original)));
  assert.ok(Buffer.byteLength(runtime) < 240 * 1024);
  assert.doesNotMatch(runtime, /\b(?:fetch|setTimeout|Promise|JSON\.parse)\s*\(/, 'chapter counts must be available synchronously, without a decoding job');
});

test('native preparation and offline startup use the same runtime while retaining canonical build input', () => {
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(worker, /\.\/uploads\/lorefy-chapter-runtime\.js\?v=20261110-factored-v1/);
  assert.doesNotMatch(worker, /\.\/uploads\/lorefy-chapter-overrides\.js/);
  const prepare = fs.readFileSync(path.join(root, 'tools/prepare-ios-web.mjs'), 'utf8');
  assert.match(prepare, /build-chapter-runtime\.js/);
  assert.match(prepare, /await rm\(path\.join\(output, "uploads", "lorefy-chapter-overrides\.js"\), \{ force: true \}\)/);
  for (const bundle of ['ios-web', 'ios/App/App/public']) {
    const file = path.join(root, bundle, 'uploads/lorefy-chapter-runtime.js');
    assert.ok(fs.existsSync(file));
    assert.equal(fs.readFileSync(file, 'utf8'), fs.readFileSync(path.join(root, 'uploads/lorefy-chapter-runtime.js'), 'utf8'));
    assert.equal(fs.existsSync(path.join(root, bundle, 'uploads/lorefy-chapter-overrides.js')), false);
  }
  assert.ok(fs.existsSync(path.join(root, 'uploads/lorefy-chapter-overrides.js')));
});

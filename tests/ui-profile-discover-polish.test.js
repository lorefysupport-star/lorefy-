const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles/lorefy-design-system.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
const growth = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');

test('rating glyphs share Lucide and selectable stars form a compact touch strip', () => {
  assert.match(app, /StarGlyph=.*?React\.createElement\(Feather,/);
  assert.match(app, /className:"lf-rating-pick"/);
  assert.match(app, /className:"lf-rating-display"/);
  assert.match(css, /\.lf-review-composer-metric > div\s*\{[^}]*width: max-content/);
  assert.match(css, /\.lf-rating-pick\.is-filled\s*\{[^}]*background: var\(--ui-selected\)/);
  assert.doesNotMatch(app.slice(app.indexOf('StarBtn='), app.indexOf('TBadge=')), /drop-shadow|scale\(0\.86\)/);
  assert.match(growth, /class: "lf-profile-rated-character-star-fill"/);
});

test('discover categories carry real representative covers and retain search navigation', () => {
  assert.match(app, /P\.map\(\(\{type:w,count:ge,rep:categoryWork\}\)/);
  assert.match(app, /DISCOVER_CACHE\.statics\.catalogSize!==MANGA\.length/);
  assert.match(app, /N\.type===w&&\/\^https\?:/);
  const start = app.indexOf('P.map(({type:w');
  const categories = app.slice(start, start + 1300);
  assert.match(categories, /className:"lf-discover-category-cover"/);
  assert.match(categories, /src:I\(categoryWork\)/);
  assert.match(categories, /onError:R/);
  assert.match(categories, /referrerPolicy:"no-referrer"/);
  assert.match(categories, /en\(w\).*S\("search"\),v\("search"\)/);
});

test('owner statistics stay in a single six-column row and profile scrollbar is hidden', () => {
  const rules = [...css.matchAll(/\.lf-owner-metrics-with-posts\s*\{([^}]+)\}/g)].map(match => match[1]);
  assert.ok(rules.some(rule => /repeat\(6,minmax\(0,1fr\)\)/.test(rule)));
  assert.ok(rules.every(rule => !/repeat\(3,/.test(rule)));
  assert.match(css, /\.lf-profile-page\s*\{[^}]*scrollbar-width: none/);
  assert.match(css, /\.lf-profile-page::-webkit-scrollbar\s*\{[^}]*display: none/);
  assert.doesNotMatch(css, /\.lf-profile-page\s*\{[^}]*overflow-y: hidden/);
});

test('profile launchers have distinct lightweight surfaces without an outer frame', () => {
  assert.match(css, /\.lf-extras-row\s*\{[^}]*grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.lf-extra-lists\s*\{[^}]*background: var\(--ui-selected\)/);
  assert.match(css, /\.lf-extra-import\s*\{[^}]*grid-column: 1 \/ -1/);
  assert.match(growth, /c1\.addEventListener\("click", openListsHub\)/);
  assert.match(growth, /c2\.addEventListener\("click", openWrapped\)/);
  assert.match(growth, /c3\.addEventListener\("click", openImport\)/);
});

test('restored rating controls report their exact fill without relying on animation', () => {
  const start = growth.indexOf('function reviewMetricScore(');
  const context = {};
  vm.runInNewContext(growth.slice(start, growth.indexOf('function reviewPickValue(', start)), context);
  const metric = {
    getAttribute: () => null,
    querySelectorAll: () => [1, 1, 1, 0.5, 0].map(fill => ({
      getAttribute: name => name === 'data-rating-fill' ? String(fill) : null,
      querySelector: () => null
    }))
  };
  assert.equal(context.reviewMetricScore(metric), 3.5);
  assert.match(app, /"aria-label":a/);
});

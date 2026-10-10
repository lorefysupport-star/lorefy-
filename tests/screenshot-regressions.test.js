const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/lorefy-design-system.css'), 'utf8');

test('review overall score is unavailable until every criterion has been rated', () => {
  const start = source.indexOf('function reviewOverallState(');
  assert.ok(start >= 0, 'a shared rating-state calculation is present');
  const context = {};
  vm.runInNewContext(source.slice(start, source.indexOf('function paintReviewOverallSummary(', start)), context);
  assert.equal(context.reviewOverallState([0, 0, 0, 0]).value, null);
  assert.equal(context.reviewOverallState([0, 5, 0, 0]).value, null);
  assert.equal(context.reviewOverallState([0, 5, 0, 0]).complete, 1);
  assert.equal(context.reviewOverallState([4, 5, 3, 4]).value, 4);
  assert.equal(context.reviewOverallState([4.5, 5, 3, 4]).value, 4.125);
});

test('review summary preserves half stars and keyboard selection chooses a whole star', () => {
  const start = source.indexOf('function reviewPickValue(');
  assert.ok(start >= 0);
  const context = {};
  vm.runInNewContext(source.slice(start, source.indexOf('function reviewOverallState(', start)), context);
  const button = { getBoundingClientRect: () => ({ left: 10, width: 44 }) };
  assert.equal(context.reviewPickValue({ detail: 1, clientX: 20 }, button, 4), 4.5);
  assert.equal(context.reviewPickValue({ detail: 1, clientX: 45 }, button, 4), 5);
  assert.equal(context.reviewPickValue({ detail: 0, clientX: 0 }, button, 4), 5);
  const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  assert.match(app, /l\(a\.detail===0\?1:/);
  assert.match(css, /path\[fill='none'\]\s*\{[^}]*stroke: var\(--ui-muted\)/);
});

test('review criteria and profile activity use the shared icon system', () => {
  const metrics = source.slice(source.indexOf('function reviewMetricMeta('), source.indexOf('function reviewMetricScore('));
  assert.match(metrics, /icon: "book-open"/);
  assert.doesNotMatch(metrics, /📖|✒|👥|🌐|⭐/u);
  assert.match(source, /classList\.add\("lf-profile-community-action-icon"\)/);
  assert.match(source, /if \(sheet\.querySelector\("i\[data-lucide\]"\)\) scheduleCharacterActionIcons\(\)/);
});

test('review stars have full-width touch rows and discover does not mask its content', () => {
  assert.match(css, /\.lf-review-composer-metrics-grid\s*\{[^}]*grid-template-columns: minmax\(0,1fr\)/);
  assert.match(css, /\.lf-review-composer-metric button\s*\{[^}]*min-width: 44px/);
  assert.match(css, /\.lf-discover-header\s*\{[^}]*position: relative !important/);
  assert.match(css, /\.lf-pref-launcher-copy strong\s*\{[^}]*white-space: normal/);
  assert.match(css, /\.lf-review-composer-overall > :not\(\.lf-review-composer-overall-summary\)\s*\{[^}]*display: none/);
});

test('cover choices never turn broken images into selectable blank covers', () => {
  const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  const picker = app.slice(app.indexOf('visibleCoverOptions.map('), app.indexOf('hasMoreCovers&&', app.indexOf('visibleCoverOptions.map(')));
  assert.match(picker, /referrerPolicy:"no-referrer"/);
  assert.match(picker, /className:"lf-cover-choice"/);
  assert.match(picker, /button\.disabled=true/);
  assert.match(picker, /button\.dataset\.coverState="error"/);
});

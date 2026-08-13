const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('privacy and safety tools are mounted in settings instead of the profile body', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-product-tools.js'), 'utf8');
  assert.match(source, /function enhanceSettings\(/);
  assert.doesNotMatch(source, /function enhanceProfile\(/);
  assert.match(source, /\.lf-product-hub[^\n]*remove/);
});

test('community enhancement never creates the promotional hero or feed label', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const start = source.indexOf('function enhanceCommunityPage()');
  const end = source.indexOf('function renderReviewDetailDislikeIcon()', start);
  const enhancement = source.slice(start, end);
  assert.doesNotMatch(enhancement, /buildCommunityHero\(/);
  assert.doesNotMatch(enhancement, /el\([^\n]*lf-community-feed-label/);
  assert.match(enhancement, /lf-community-feed-label[^\n]*remove/);
  assert.match(enhancement, /hero\.remove\(\)/);
});

test('community actions ignore the review options menu and enhance the real action row', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const start = source.indexOf('function enhanceCommunityCards(page)');
  const end = source.indexOf('function enhanceCommunityPage()', start);
  const enhancement = source.slice(start, end);
  assert.match(enhancement, /querySelector\("\.lf-product-review-menu"\)/);
  assert.match(enhancement, /button !== menu/);
  assert.match(enhancement, /Array\.prototype\.filter\.call\(card\.querySelectorAll\("button"\)/);
  assert.match(enhancement, /var row = buttons\[0\]\.parentElement/);
});

test('community cards use the compact review-detail visual treatment', () => {
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-product-tools.css'), 'utf8');
  assert.match(styles, /Unified community review feed/);
  assert.match(styles, /\.lf-community-card::before\s*\{\s*display:\s*none/);
  assert.match(styles, /\.lf-community-card \.lf-community-action-row/);
});

test('home screen renders a retry state instead of crashing with an empty catalog', () => {
  const source = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  assert.match(source, /LorefyCatalogPlan\.pickFeaturedWork/);
  assert.match(source, /if\(!P\)return/);
  assert.match(source, /\\u0625\\u0639\\u0627\\u062F\\u0629 \\u0627\\u0644\\u0645\\u062D\\u0627\\u0648\\u0644\\u0629/);
});

test('large image galleries keep the first paint bounded while retaining pagination', () => {
  const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  const characters = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  assert.match(app, /const COVER_PICKER_BATCH=18,PROFILE_LIBRARY_BATCH=60/);
  assert.match(app, /loading:"lazy",decoding:"async"/);
  assert.match(characters, /var INITIAL_CHARACTER_RENDER_LIMIT = 24;/);
  assert.match(characters, /var renderLimit = INITIAL_CHARACTER_RENDER_LIMIT;/);
  assert.match(characters, /renderLimit = INITIAL_CHARACTER_RENDER_LIMIT/);
  assert.match(characters, /renderLimit \+= 48/);
  assert.match(characters, /searchTimer = global\.setTimeout/);
});

test('share and review labels stay valid Arabic UTF-8', () => {
  const source = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  const reviewLabel = source.slice(source.indexOf('lf-rev-top4-label') - 80, source.indexOf('lf-rev-top4-label') + 260);
  const shareCanvas = source.slice(source.indexOf('const createProfileBoardShareImage'), source.indexOf('const isProfileBoard'));
  assert.match(reviewLabel, /أفضل الشخصيات/);
  assert.match(shareCanvas, /لوحة قابلة للمشاركة كصورة من تطبيق Lorefy/);
  assert.doesNotMatch(reviewLabel, /âک|ط£ط|ظ…ط/);
  assert.doesNotMatch(shareCanvas, /ط£ط|ظ…ط|ط®ط/);
});

test('interface motion avoids broad transition-all rules', () => {
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-system.css'), 'utf8');
  assert.doesNotMatch(styles, /transition:\s*all\b/);
});

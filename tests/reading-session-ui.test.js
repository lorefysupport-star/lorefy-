const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('reading-session controls persist their active state and completed events', () => {
  const diary = read('modules/lorefy-reading-diary.js');
  assert.match(diary, /lorefy\.user\.readingSession\.v1/);
  assert.match(diary, /core\.startSession\(/);
  assert.match(diary, /core\.pauseSession\(/);
  assert.match(diary, /core\.resumeSession\(/);
  assert.match(diary, /core\.finishSession\(/);
  assert.match(diary, /role', 'timer'/);
  assert.match(diary, /core\.sumSessionMs\(/);
  assert.match(diary, /جلسات القراءة/);
  assert.match(diary, /lf-diary-session-ready-art/);
  assert.match(diary, /select\.addEventListener\('change'/);
  assert.match(diary, /جلسة متوقفة مؤقتًا/);
  assert.match(diary, /بدء جلسة لهذا العمل/);
  assert.match(diary, /subtitle\.textContent !== nextSubtitle/);
  assert.match(diary, /حذف جلسة القراءة/);
  assert.match(diary, /item\.type === 'session' && item\.id === event\.id && item\.at === event\.at/);
  assert.match(diary, /if \(options && options\.session && runningSession\) workId = runningSession\.id/);
});

test('active session belongs to the account and has responsive accessible styling', () => {
  const backend = read('backend/lorefy-backend.js');
  const css = read('styles/lorefy-reading-diary.css');
  assert.match(backend, /"lorefy\.user\.readingSession\.v1"/);
  assert.match(css, /\.lf-diary-session-view/);
  assert.match(css, /\.lf-diary-session-time/);
  assert.match(css, /\.lf-diary-session-ready-art/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('profile characters follow favorite works while the diary stays below community activity', () => {
  const diary = read('modules/lorefy-reading-diary.js');
  const growth = read('modules/lorefy-growth-features.js');
  assert.match(diary, /var anchor = page\.querySelector\(':scope > \.lf-profile-community-summary'\)/);
  assert.match(diary, /page\.insertBefore\(entry, anchor\.nextSibling\)/);
  assert.match(growth, /favorites\.nextSibling !== topCharacters/);
  assert.match(growth, /page\.insertBefore\(topCharacters, favorites\.nextSibling\)/);
});

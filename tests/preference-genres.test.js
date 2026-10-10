const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const auth = fs.readFileSync(path.join(root, 'auth/lorefy-auth.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');

function genreChoices() {
  const start = auth.indexOf('ae=') + 3;
  const end = auth.indexOf(',A={ar:', start);
  assert.ok(start > 3 && end > start);
  return vm.runInNewContext(auth.slice(start, end));
}

test('taste preferences offer fiction and nonfiction genres in both languages', () => {
  const rows = genreChoices();
  for (const en of ['History', 'Self-help', 'Biography', 'Philosophy', 'Nonfiction', 'Adventure', 'Mystery', 'Drama', 'Historical', 'Psychological']) {
    const row = rows.find(value => value[2] === en);
    assert.ok(row, en);
    assert.match(row[0], /[\u0600-\u06ff]/);
    assert.match(row[1], /[\u0600-\u06ff]/);
  }
  assert.equal(new Set(rows.map(row => row[0])).size, rows.length);
});

test('nonfiction preferences boost matching catalog genres rather than only Arabic labels', () => {
  const start = app.indexOf('GENRE_TERMS=');
  const end = app.indexOf(',diversifyRankedWorks=', start);
  const scope = { workById: () => null, arGenreOf: () => '' };
  vm.runInNewContext('const ' + app.slice(start, end) + '; this.profile=buildTasteProfile({genres:["تاريخ","تطوير الذات","سيرة ذاتية","فلسفة","غير خيالي"]},{}); this.keys=workGenreKeys({title:"Atomic Habits",genres:["Self-help"]});', scope);
  for (const term of ['history', 'self help', 'biography', 'philosophy', 'nonfiction']) {
    assert.ok(scope.profile.genres[term] > 0, term);
  }
  assert.ok(scope.keys.includes('تطوير الذات'));
});

test('selected genre controls expose their state without relying on color', () => {
  assert.ok(auth.includes('"aria-pressed":y.includes(l)'));
  assert.ok(auth.includes('"aria-pressed":m.includes(l)'));
});

test('profile save feedback and biography placeholder follow the selected language', () => {
  const i18n = require('../modules/lorefy-i18n.js');
  assert.equal(i18n.translate('تم حفظ الملف الشخصي', 'en'), 'Profile saved');
  assert.equal(i18n.translate('نبذة قصيرة عنك...', 'en'), 'A little about you...');
});

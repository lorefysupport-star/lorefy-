const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18n = require('../modules/lorefy-i18n.js');

function timestamp(value, lang) {
  assert.equal(typeof i18n.reviewTimestamp, 'function', 'review timestamps need a localized formatter');
  return i18n.reviewTimestamp(value, lang);
}

for (const lang of ['en', 'ar']) test(`review timestamp formats both date and time in ${lang}`, () => {
  const value = Date.UTC(2026, 9, 9, 9, 0);
  const date = new Date(value);
  const expected = date.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })
    + ' \u00b7 ' + date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  assert.equal(timestamp(value, lang), expected);
  if (lang === 'en') assert.doesNotMatch(timestamp(value, lang), /[\u0600-\u06ff]/);
});

test('review timestamp preserves explicit epoch zero and valid ISO timestamps', () => {
  assert.match(timestamp(0, 'en'), /1970/);
  assert.equal(timestamp('2026-10-09T09:00:00.000Z', 'en'), timestamp(Date.UTC(2026, 9, 9, 9), 'en'));
});

test('unknown timestamp never fabricates epoch dates or exposes Invalid Date', () => {
  for (const value of [undefined, null, '', '   ', 'not-a-date', NaN, Infinity, false, true]) {
    assert.equal(timestamp(value, 'en'), 'Date unavailable');
    assert.equal(timestamp(value, 'ar'), '\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u063a\u064a\u0631 \u0645\u062a\u0627\u062d');
  }
});

test('language fallback remains Arabic and dates are stable over repeated renders', () => {
  const value = Date.UTC(2026, 9, 9, 9);
  assert.equal(timestamp(value), timestamp(value, 'ar'));
  assert.equal(timestamp(value, 'invalid'), timestamp(value, 'ar'));
  const before = timestamp(value, 'en');
  timestamp(value, 'ar');
  assert.equal(timestamp(value, 'en'), before);
});

test('review render passes its current language without reparsing translated date text', () => {
  const app = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
  assert.match(app, /LorefyI18n\.reviewTimestamp\(t\.ts,W\)/);
  assert.doesNotMatch(app, /new Date\(t\.ts\)\.toLocale(?:Date|Time)String\("ar"/);
});

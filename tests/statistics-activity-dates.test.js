const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../modules/lorefy-v2.js'), 'utf8');
const h = (type, props, ...children) => ({type, props:props || {}, children:children.flat(Infinity)});
const nodes = tree => tree && typeof tree === 'object' ? [tree, ...tree.children.flatMap(nodes)] : [];
const text = tree => tree && typeof tree === 'object' ? tree.children.map(text).join(' ') : String(tree ?? '');
function render(readLog, lang = 'en') {
  const window = {React:{createElement:h}, NenIcons:{}, LorefyI18n:require('../modules/lorefy-i18n.js')};
  vm.runInNewContext(source, {window});
  return window.LorefyV2.StatsScreen({ctx:{lang, readLog}});
}
const rows = tree => nodes(tree).filter(node => node.type === 'div' && typeof node.props.title === 'string');

test('a rolling Thursday window follows actual dates instead of starting on Saturday', () => {
  const log = Array.from({length:7}, (_, index) => ({key:'2026-10-' + (9 + index), value:index + 1}));
  const bars = rows(render(log));
  const weekdays = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  assert.equal(bars.length, 7);
  bars.forEach((bar, index) => assert.ok(bar.props.title.startsWith(weekdays[index]), bar.props.title));
  assert.match(bars[0].props.title, /October 9, 2026/);
});

test('padded and existing non-padded calendar keys produce the same date', () => {
  const bars = rows(render([{key:'2026-9-3', value:2}, {key:'2026-09-03', value:2}]));
  assert.equal(bars.length, 2);
  assert.equal(bars[0].props.title, bars[1].props.title);
  assert.equal(bars[0].props['data-reading-date'], '2026-09-03');
});

test('calendar dates do not shift with the host timezone', () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ['America/Los_Angeles', 'Pacific/Apia', 'Asia/Riyadh']) {
      process.env.TZ = zone;
      const title = rows(render([{key:'2026-10-1', value:1}]))[0].props.title;
      assert.ok(title.startsWith('Thursday'), zone + ': ' + title);
      assert.match(title, /October 1, 2026/);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('month and year boundaries keep dates, order and saved zero values', () => {
  const bars = rows(render([{key:'2026-12-31', value:0}, {key:'2027-1-1', value:4}]));
  assert.ok(bars[0].props.title.startsWith('Thursday'));
  assert.ok(bars[1].props.title.startsWith('Friday'));
  assert.match(bars[0].props.title, /: 0$/);
  assert.match(bars[1].props.title, /: 4$/);
});

test('invalid calendar keys do not normalize into invented dates or weekdays', () => {
  for (const key of ['2026-2-30', '2026-13-1', '2026-0-1', '2026-10-1T00:00:00Z', 'bad']) {
    const bars = rows(render([{key, value:2}]));
    assert.equal(bars.length, 1);
    assert.equal(bars[0].props['data-reading-date'], undefined);
    assert.equal(bars[0].props.title, '—: 2');
  }
});

test('an explicit zero is not replaced by a legacy minutes field', () => {
  const bar = rows(render([{key:'2026-10-16', value:0, minutes:99}]))[0];
  assert.match(bar.props.title, /: 0$/);
  assert.equal(bar.children[1].props.style.height, 5);
});

test('missing history is an honest localized empty state, not seven fabricated days', () => {
  assert.equal(rows(render([])).length, 0);
  assert.ok(text(render([])).includes('No reading data for this period.'));
  assert.ok(text(render([], 'ar')).includes('لا توجد بيانات قراءة لهذه الفترة.'));
});

test('Arabic labels follow the same Gregorian calendar date without clipped prefixes', () => {
  const bar = rows(render([{key:'2026-10-15', value:2}], 'ar'))[0];
  assert.ok(bar.props.title.startsWith('الخميس'));
  assert.ok(text(bar).includes('خميس'));
  assert.equal(bar.props['data-reading-date'], '2026-10-15');
});

test('bounded rendering preserves input records and never writes history', () => {
  const log = Object.freeze(Array.from({length:9}, (_, index) => Object.freeze({key:'2026-10-' + (index + 1), value:index})));
  const before = JSON.stringify(log);
  const bars = rows(render(log));
  assert.equal(bars.length, 7);
  assert.equal(bars[0].props['data-reading-date'], '2026-10-03');
  assert.equal(JSON.stringify(log), before);
});

test('invalid activity counts do not create positive-height reading bars', () => {
  for (const value of [-2, NaN, Infinity]) {
    const bar = rows(render([{key:'2026-10-16', value}]))[0];
    assert.match(bar.props.title, /: 0$/);
    assert.equal(bar.children[1].props.style.height, 5);
  }
});

test('each activity bar exposes its complete date and value to assistive technology', () => {
  const bar = rows(render([{key:'2026-10-15', value:3}]))[0];
  assert.equal(bar.props.role, 'img');
  assert.equal(bar.props['aria-label'], bar.props.title);
  assert.match(bar.props['aria-label'], /Thursday.*October 15, 2026: 3/);
});

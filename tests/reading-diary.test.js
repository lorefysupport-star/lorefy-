const test = require('node:test');
const assert = require('node:assert/strict');
const diary = require('../modules/lorefy-reading-diary-core.js');

test('records genuine library and progress transitions without backdating', () => {
  const before = { library: {}, progress: {} };
  const after = { library: { one: 'أقرأ حالياً' }, progress: { one: { chapter: 3 } } };
  assert.deepEqual(diary.transitions(before, after, 1000), [
    { id: 'one', type: 'started', chapter: 3, at: 1000 }
  ]);
  assert.deepEqual(diary.transitions(after, { library: after.library, progress: { one: { chapter: 5 } } }, 2000), [
    { id: 'one', type: 'progress', chapter: 5, at: 2000 }
  ]);
  assert.deepEqual(diary.transitions(after, { library: { one: 'تم القراءة' }, progress: after.progress }, 3000), [
    { id: 'one', type: 'completed', chapter: 3, at: 3000 }
  ]);
});

test('ignores non-reading lists, decreases, unchanged data and removed works', () => {
  const before = { library: { one: 'قائمة الأمنيات', two: 'أقرأ حالياً' }, progress: { two: { chapter: 5 } } };
  const after = { library: { one: 'قائمة الأمنيات' }, progress: { two: { chapter: 2 } } };
  assert.deepEqual(diary.transitions(before, after, 1000), []);
  assert.deepEqual(diary.transitions(after, after, 2000), []);
});

test('bounds and deduplicates stored events', () => {
  const entry = { id: 'one', type: 'started', at: 1000, chapter: 0 };
  assert.deepEqual(diary.merge([entry], [entry]), [entry]);
  assert.equal(diary.merge([], Array.from({length: 350}, (_, n) => ({...entry, at: n}))).length, 300);
});

test('spoiler notes stay hidden until the matching reading position is reached', () => {
  const note = { id: 'one', type: 'note', spoiler: true, anchorType: 'chapter', anchorValue: 12, note: 'secret' };
  assert.equal(diary.canReveal(note, { library: { one: 'أقرأ حالياً' }, progress: { one: { chapter: 11, page: 90 } } }), false);
  assert.equal(diary.canReveal(note, { library: { one: 'أقرأ حالياً' }, progress: { one: { chapter: 12 } } }), true);
  assert.equal(diary.canReveal(note, { library: { one: 'تم القراءة' }, progress: {} }), true);
  assert.equal(diary.canReveal({ ...note, anchorType: 'page', anchorValue: 80 }, { library: {}, progress: { one: { chapter: 100, page: 79 } } }), false);
  assert.equal(diary.canReveal({ ...note, spoiler: false }, { library: {}, progress: {} }), true);
});

test('unanchored spoilers never auto-reveal and shares omit spoiler text by default', () => {
  const note = { id: 'one', type: 'note', spoiler: true, anchorType: 'chapter', anchorValue: 0, note: 'secret' };
  assert.equal(diary.canReveal(note, { library: {}, progress: {} }), false);
  assert.doesNotMatch(diary.shareText(note, 'Berserk', false), /secret/);
  assert.match(diary.shareText(note, 'Berserk', true), /secret/);
  assert.match(diary.shareText({ ...note, spoiler: false }, 'Berserk', false), /secret/);
});

test('note identity allows multiple annotations at the same reading position', () => {
  const base = { id: 'one', type: 'note', at: 1000, chapter: 12 };
  assert.equal(diary.merge([], [{ ...base, entryId: 'a' }, { ...base, entryId: 'b' }]).length, 2);
});

test('quote drafts require a short passage and a valid reading position', () => {
  const draft = { id: 'one', quote: '  A quiet line.  ', note: '  My thought.  ', anchorType: 'page', anchorValue: 17, at: 1000, entryId: 'quote-1' };
  assert.deepEqual(diary.quoteEntry(draft), {
    id: 'one', type: 'quote', quote: 'A quiet line.', note: 'My thought.', anchorType: 'page', anchorValue: 17,
    chapter: 0, spoiler: false, at: 1000, entryId: 'quote-1'
  });
  assert.equal(diary.quoteEntry({ ...draft, quote: ' ' }), null);
  assert.equal(diary.quoteEntry({ ...draft, quote: 'x'.repeat(281) }), null);
  assert.equal(diary.quoteEntry({ ...draft, anchorValue: 0 }), null);
  assert.equal(diary.quoteEntry({ ...draft, anchorType: 'other' }), null);
});

test('quote sharing keeps attribution and does not leak spoiler content', () => {
  const quote = diary.quoteEntry({ id: 'one', quote: 'A secret line', note: 'A secret thought', anchorType: 'chapter', anchorValue: 4, spoiler: true, at: 1000, entryId: 'quote-1' });
  const safe = diary.shareText(quote, 'Berserk', false);
  assert.match(safe, /اقتباس قراءة.*Berserk.*الفصل 4/);
  assert.doesNotMatch(safe, /secret/);
  const full = diary.shareText(quote, 'Berserk', true);
  assert.match(full, /A secret line/);
  assert.match(full, /A secret thought/);
  assert.equal(diary.canReveal(quote, { library: {}, progress: { one: { chapter: 3 } } }), false);
  assert.equal(diary.canReveal(quote, { library: {}, progress: { one: { chapter: 4 } } }), true);
});

test('community quote attachments preserve the source and reject spoilers', () => {
  const quote = diary.quoteEntry({ id: 'one', quote: 'A short line', anchorType: 'chapter', anchorValue: 4, at: 1000, entryId: 'quote-1' });
  assert.deepEqual(diary.communityQuote(quote, { title: 'Berserk', cover: '/covers/berserk.jpg' }), {
    kind: 'quote', workId: 'one', title: 'Berserk', image: '/covers/berserk.jpg',
    quote: 'A short line', anchorType: 'chapter', anchorValue: 4
  });
  assert.equal(diary.communityQuote({ ...quote, spoiler: true }, { title: 'Berserk' }), null);
  assert.equal(diary.communityQuote({ ...quote, quote: '' }, { title: 'Berserk' }), null);
  assert.equal(diary.communityQuote({ ...quote, type: 'note' }, { title: 'Berserk' }), null);
});

test('reading sessions count only active time across pauses and resume', () => {
  const started = diary.startSession('one', 1000);
  assert.equal(diary.sessionElapsed(started, 61000), 60000);
  const paused = diary.pauseSession(started, 61000);
  assert.equal(diary.sessionElapsed(paused, 361000), 60000);
  const resumed = diary.resumeSession(paused, 361000);
  assert.deepEqual(diary.finishSession(resumed, 391000, 'session-1'), {
    id: 'one', type: 'session', durationMs: 90000, at: 391000, entryId: 'session-1'
  });
});

test('reading sessions reject invalid state and cap abandoned timers', () => {
  assert.equal(diary.startSession('', 1000), null);
  assert.equal(diary.finishSession(diary.startSession('one', 1000), 1000, 'empty'), null);
  const started = diary.startSession('one', 1000);
  assert.equal(diary.sessionElapsed(started, 1000 + 10 * 60 * 60 * 1000), 8 * 60 * 60 * 1000);
  assert.equal(diary.sessionElapsed(started, 0), 0);
  assert.equal(diary.resumeSession(started, 2000), null);
  assert.equal(diary.resumeSession(diary.pauseSession(started, 1000 + 10 * 60 * 60 * 1000), 1000 + 10 * 60 * 60 * 1000), null);
});

test('session totals ignore malformed entries and other works', () => {
  const events = [
    { id: 'one', type: 'session', durationMs: 60000 },
    { id: 'one', type: 'session', durationMs: 90000 },
    { id: 'two', type: 'session', durationMs: 100000 },
    { id: 'one', type: 'session', durationMs: -100 },
    { id: 'one', type: 'note', durationMs: 100000 }
  ];
  assert.equal(diary.sumSessionMs(events), 250000);
  assert.equal(diary.sumSessionMs(events, 'one'), 150000);
  assert.equal(diary.durationLabel(150000), 'دقيقتان');
  assert.equal(diary.clockTime(90000), '00:01:30');
  assert.equal(diary.durationLabel(11 * 60000), '11 دقيقة');
});

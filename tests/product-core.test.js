const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createMemoryStore,
  createProductCore,
  canonicalWorkKey,
  buildPortableExport
} = require('../modules/lorefy-product-core.js');

test('reports require a target and a supported reason', () => {
  const core = createProductCore(createMemoryStore());
  assert.throws(() => core.safety.report({ targetId: '', reason: 'spam' }), /target/i);
  assert.throws(() => core.safety.report({ targetId: 'review-1', reason: 'other' }), /reason/i);

  const report = core.safety.report({
    targetId: 'review-1',
    targetType: 'review',
    reason: 'spam',
    note: 'Repeated advertising'
  });

  assert.equal(report.status, 'pending');
  assert.equal(core.safety.getReports().length, 1);
});

test('blocked and muted readers are filtered from community content', () => {
  const core = createProductCore(createMemoryStore());
  core.safety.blockUser('reader-a');
  core.safety.muteUser('reader-b');

  const visible = core.safety.filterCommunity([
    { id: '1', userId: 'reader-a' },
    { id: '2', userId: 'reader-b' },
    { id: '3', userId: 'reader-c' }
  ]);

  assert.deepEqual(visible.map((item) => item.id), ['3']);
});

test('data corrections are queued without mutating the catalog record', () => {
  const store = createMemoryStore();
  const core = createProductCore(store);
  const work = { id: 'work-1', title: 'Original title', cover: 'old.jpg' };

  const correction = core.corrections.submit({
    workId: work.id,
    issue: 'cover',
    note: 'This cover belongs to another work',
    proposedValue: 'new.jpg'
  });

  assert.equal(correction.status, 'pending');
  assert.equal(work.cover, 'old.jpg');
  assert.equal(core.corrections.list().length, 1);
});

test('list visibility defaults to private and can be changed explicitly', () => {
  const core = createProductCore(createMemoryStore());
  assert.equal(core.privacy.getListVisibility('list-1'), 'private');
  core.privacy.setListVisibility('list-1', 'unlisted');
  assert.equal(core.privacy.getListVisibility('list-1'), 'unlisted');
  assert.throws(() => core.privacy.setListVisibility('list-1', 'friends'), /visibility/i);
});

test('recommendation feedback hides rejected works but keeps liked works', () => {
  const core = createProductCore(createMemoryStore());
  core.recommendations.setFeedback('work-1', 'not_interested');
  core.recommendations.setFeedback('work-2', 'more_like_this');

  const visible = core.recommendations.filter([
    { id: 'work-1' },
    { id: 'work-2' },
    { id: 'work-3' }
  ]);

  assert.deepEqual(visible.map((item) => item.id), ['work-2', 'work-3']);
});

test('portable export excludes sessions and premium state', () => {
  const snapshot = {
    'lorefy.identity.v1': JSON.stringify({ name: 'Reader' }),
    'lorefy.customLists.v1': JSON.stringify([{ id: 'list-1', name: 'Favorites' }]),
    'lorefy.characterRatings.v1': JSON.stringify({ a: { hero: 5 } }),
    'lorefy.user.library.v2': JSON.stringify({ a: 'أقرأ حالياً' }),
    'lorefy.session.v1': JSON.stringify({ token: 'secret' }),
    'lorefy.user.premium.v2': JSON.stringify(true)
  };

  const exported = buildPortableExport(snapshot, new Date('2026-07-15T00:00:00Z'));
  assert.equal(exported.schema, 1);
  assert.ok(exported.data['lorefy.user.library.v2']);
  assert.ok(exported.data['lorefy.customLists.v1']);
  assert.ok(exported.data['lorefy.characterRatings.v1']);
  assert.equal(exported.data['lorefy.session.v1'], undefined);
  assert.equal(exported.data['lorefy.user.premium.v2'], undefined);
});

test('canonical keys merge volume and edition labels without merging different titles', () => {
  assert.equal(canonicalWorkKey('One Piece Vol. 12'), canonicalWorkKey('One Piece Volume 2'));
  assert.equal(canonicalWorkKey('ون بيس - المجلد 12'), canonicalWorkKey('ون بيس المجلد 1'));
  assert.equal(canonicalWorkKey('Batman (2016-) #14'), canonicalWorkKey('Batman Issue 15'));
  assert.notEqual(canonicalWorkKey('One Piece'), canonicalWorkKey('One Punch Man'));
});

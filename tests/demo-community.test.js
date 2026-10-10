const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cleanup = require('../modules/lorefy-preview-cleanup.js');

function storageFor(values) {
  const data = new Map(Object.entries(values));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}

test('cleanup identifies only known preview identities and fixture records', () => {
  assert.equal(cleanup.isFixtureId('10000000-0000-4000-8000-00000000000c'), true);
  assert.equal(cleanup.isFixtureId('reader-noura'), true);
  assert.equal(cleanup.isFixtureId('demo-review-1'), true);
  assert.equal(cleanup.isFixtureId('10000000-0000-4000-8000-000000000099'), false);
  assert.equal(cleanup.isFixtureId('real-user'), false);
});

test('cleanup removes fake posts, their replies and reactions without touching real data', () => {
  const own = { id: 'own-post', userId: 'real-user', text: 'Keep this' };
  const library = '{"berserk":{"status":"reading"}}';
  const storage = storageFor({
    'lorefy.user.communityPosts.v1': JSON.stringify([own, { id: 'demo-post-1' }, { id: 'own-reply', parent_id: 'demo-post-1' }]),
    'lorefy.user.following.v1': JSON.stringify({ 'reader-noura': true, 'real-user': true }),
    'lorefy.review.saved.v1': JSON.stringify({ 'demo-review-1': true, 'real-review': true }),
    'lorefy.library.v1': library
  });
  assert.ok(cleanup.cleanStorage(storage) > 0);
  assert.deepEqual(JSON.parse(storage.getItem('lorefy.user.communityPosts.v1')), [own]);
  assert.deepEqual(JSON.parse(storage.getItem('lorefy.user.following.v1')), { 'real-user': true });
  assert.deepEqual(JSON.parse(storage.getItem('lorefy.review.saved.v1')), { 'real-review': true });
  assert.equal(storage.getItem('lorefy.library.v1'), library);
  assert.equal(cleanup.cleanStorage(storage), 0);
});

test('pending sync and its base cannot restore deleted preview reviews', () => {
  const reviews = JSON.stringify([{ id: 'demo-review-1' }, { id: 'my-review', userId: 'me' }]);
  const storage = storageFor({
    'lorefy.pendingState.v1': JSON.stringify({ 'lorefy.user.privateReviews.v2': reviews }),
    'lorefy.stateBase.v1': JSON.stringify({ version: 4, data: { 'lorefy.user.privateReviews.v2': reviews } })
  });
  cleanup.cleanStorage(storage);
  for (const key of ['lorefy.pendingState.v1', 'lorefy.stateBase.v1']) {
    const wrapper = JSON.parse(storage.getItem(key));
    const values = key === 'lorefy.stateBase.v1' ? wrapper.data : wrapper;
    assert.deepEqual(JSON.parse(values['lorefy.user.privateReviews.v2']), [{ id: 'my-review', userId: 'me' }]);
  }
  assert.equal(JSON.parse(storage.getItem('lorefy.stateBase.v1')).version, 4);
});

test('production loads cleanup before boot and ships no generated reader directory', () => {
  const root = path.resolve(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(index.indexOf('modules/lorefy-preview-cleanup.js') < index.indexOf('uploads/files/lorefy-app.js'));
  assert.doesNotMatch(index, /modules\/lorefy-demo-community\.js/);
  assert.equal(fs.existsSync(path.join(root, 'modules/lorefy-demo-community.js')), false);
  assert.deepEqual(require('../modules/lorefy-user-discovery.js').demoReaders, []);
});

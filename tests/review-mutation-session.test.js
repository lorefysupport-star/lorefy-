const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const reviewId = '11111111-1111-4111-8111-111111111111';
const parentId = '22222222-2222-4222-8222-222222222222';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a']]), calls = [];
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)) };
  const window = { localStorage: storage };
  vm.runInNewContext(source, { window, localStorage: storage, URL, console, setTimeout, clearTimeout });
  const api = window.LorefyBackend;
  const hooks = {
    session: async () => ({ userId: 'a' }),
    read: async () => ({ data: { image_urls: ['a/review/image.png'] } }),
    remove: async () => true, delete: async () => ({ error: null }),
    rpc: async () => ({ data: [{ id: 'comment' }] })
  };
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1,
    getSession: async () => { calls.push({ phase: 'session' }); return hooks.session(); },
    _removeReviewMedia: async paths => { calls.push({ phase: 'remove', paths }); return hooks.remove(); },
    client: {
      from: table => ({ select() { return this; }, eq() { return this; },
        maybeSingle: async () => { calls.push({ phase: 'read', table }); return hooks.read(); },
        delete: () => ({ eq: async (key, id) => { calls.push({ phase: 'delete', table, key, id }); return hooks.delete(); } }) }),
      rpc: async (name, args) => { calls.push({ phase: 'rpc', name, args }); return hooks.rpc(); }
    } });
  return { api, hooks, calls, values,
    transition(kind = 'account') {
      if (kind === 'account') { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); }
      if (kind === 'client') api.client = { ...api.client };
      if (kind === 'epoch') api._communityEpoch++;
      if (kind === 'local-owner') values.set('lorefy.activeUser.v1', 'b');
    } };
}
const actions = {
  comment: h => h.api.addReviewComment(reviewId, '  Reader reply  ', parentId),
  reaction: h => h.api.setReviewReaction(reviewId, 'heart', false),
  deletion: h => h.api.deleteReview(reviewId)
};
for (const name of ['comment', 'reaction']) {
  for (const phase of ['session', 'rpc']) {
    test(name + ': account switch during ' + phase + ' prevents the next request or stale success', async () => {
      const h = harness(), gate = deferred(), entered = deferred();
      h.hooks[phase] = async () => { entered.resolve(); return gate.promise; };
      const result = actions[name](h); await entered.promise; h.transition();
      gate.resolve(phase === 'session' ? { userId: 'b' } : { data: [{ id: 'old-comment' }] });
      await assert.rejects(result, stale);
      assert.equal(h.calls.filter(c => c.phase === 'rpc').length, phase === 'session' ? 0 : 1);
    });
  }
}
for (const phase of ['read', 'remove', 'delete']) {
  for (const transition of ['account', 'client', 'epoch', 'local-owner']) {
    test('deletion: ' + transition + ' change during ' + phase + ' stops the old chain', async () => {
      const h = harness(), gate = deferred(), entered = deferred();
      h.hooks[phase] = async () => { entered.resolve(); return gate.promise; };
      const result = actions.deletion(h); await entered.promise; h.transition(transition);
      gate.resolve(phase === 'read' ? { data: { image_urls: ['a/review/image.png'] } } : phase === 'delete' ? { error: null } : true);
      await assert.rejects(result, stale);
      assert.equal(h.calls.filter(c => c.phase === 'remove').length, phase === 'read' ? 0 : 1);
      assert.equal(h.calls.filter(c => c.phase === 'delete').length, phase === 'delete' ? 1 : 0);
    });
  }
}
for (const name of ['comment', 'reaction']) {
  test(name + ': a different auth owner cannot authorize the opening request', async () => {
    const h = harness(); h.hooks.session = async () => ({ userId: 'b' });
    await assert.rejects(actions[name](h), stale); assert.equal(h.calls.filter(c => c.phase === 'rpc').length, 0);
  });
}
test('same-account comment, reaction removal and deletion preserve their RPC and media contracts', async () => {
  const h = harness();
  assert.equal((await actions.comment(h)).id, 'comment');
  assert.equal(await actions.reaction(h), false);
  assert.equal(await actions.deletion(h), true);
  const rpc = h.calls.filter(c => c.phase === 'rpc');
  assert.equal(rpc[0].name, 'publish_review_comment');
  assert.equal(rpc[0].args.comment_body, 'Reader reply');
  assert.equal(rpc[0].args.parent_ref, parentId);
  assert.equal(rpc[1].name, 'set_review_reaction');
  assert.equal(rpc[1].args.reaction_active, false);
  assert.equal(h.calls.find(c => c.phase === 'remove').paths[0], 'a/review/image.png');
  assert.equal(h.calls.find(c => c.phase === 'delete').id, reviewId);
});
test('same-account request failures remain failures and stop the deletion chain', async () => {
  for (const phase of ['read', 'remove', 'delete']) {
    const h = harness(); h.hooks[phase] = async () => { throw Error('Offline'); };
    await assert.rejects(actions.deletion(h), /Offline/);
    if (phase !== 'delete') assert.equal(h.calls.filter(c => c.phase === 'delete').length, 0);
  }
  for (const name of ['comment', 'reaction']) {
    const h = harness(); h.hooks.rpc = async () => ({ error: Error('Denied') });
    await assert.rejects(actions[name](h), /Denied/);
  }
});

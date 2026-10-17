const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const reviewId = '11111111-1111-4111-8111-111111111111';
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a']]), calls = [];
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)) };
  const window = { localStorage: storage };
  vm.runInNewContext(source, { window, localStorage: storage, URL, console, setTimeout, clearTimeout });
  const api = window.LorefyBackend;
  const hooks = { session: async () => ({ userId: 'a' }),
    write: async kind => ({ data: kind === 'rpc' ? { id: reviewId } : [{ id: reviewId }] }) };
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1,
    getSession: () => hooks.session(), client: {
      rpc: async (name, args) => { calls.push({ kind: 'rpc', name, args }); return hooks.write('rpc'); },
      from: table => { const filters = {}; return { delete() { return this; }, eq(k, v) { filters[k] = v; return this; },
        select: async fields => { calls.push({ kind: 'delete', table, filters, fields }); return hooks.write('delete'); } }; }
    } });
  return { api, hooks, calls,
    transition(kind) {
      if (kind === 'account') { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); }
      if (kind === 'client') api.client = { ...api.client };
      if (kind === 'epoch') api._communityEpoch++;
      if (kind === 'local-owner') values.set('lorefy.activeUser.v1', 'b');
    } };
}
const actions = {
  publish: h => h.api.publishChapterReview('work', 9, 4.25, '  Reader chapter note  ', true),
  delete: h => h.api.deleteChapterReview(reviewId)
};
for (const [name, action] of Object.entries(actions)) {
  for (const phase of ['session', 'write']) for (const transition of ['account', 'client', 'epoch', 'local-owner']) {
    test(name + ': ' + transition + ' during ' + phase + ' cannot continue or report stale success', async () => {
      const h = harness(), gate = deferred(), entered = deferred();
      h.hooks[phase] = async () => { entered.resolve(); return gate.promise; };
      const result = action(h); await entered.promise; h.transition(transition);
      gate.resolve(phase === 'session' ? { userId: 'a' } : { data: name === 'publish' ? { id: reviewId } : [{ id: reviewId }] });
      await assert.rejects(result, stale); assert.equal(h.calls.length, phase === 'session' ? 0 : 1);
    });
  }
  test(name + ': auth response cannot authorize a different actor', async () => {
    const h = harness(); h.hooks.session = async () => ({ userId: 'b' });
    await assert.rejects(action(h), stale); assert.equal(h.calls.length, 0);
  });
  test(name + ': service rejection stays a failure', async () => {
    const h = harness(); h.hooks.write = async () => ({ error: Error('Denied') });
    await assert.rejects(action(h), /Denied/);
  });
}
test('same-account chapter publishing preserves exact quarter, chapter, text and spoiler flag', async () => {
  const h = harness(); assert.equal((await actions.publish(h)).id, reviewId);
  const call = h.calls[0]; assert.equal(call.name, 'publish_chapter_review');
  assert.equal(call.args.work_ref, 'work'); assert.equal(call.args.chapter_ref, 9);
  assert.equal(call.args.score, 4.25); assert.equal(call.args.comment_body, 'Reader chapter note');
  assert.equal(call.args.has_spoiler, true);
  await h.api.publishChapterReview('work', 9, 0, 'Comment only', false);
  assert.equal(h.calls[1].args.score, 0); assert.equal(h.calls[1].args.has_spoiler, false);
});
test('same-account deletion stays scoped to the authenticated owner and verifies the row was removed', async () => {
  const h = harness(); assert.equal(await actions.delete(h), true);
  assert.equal(h.calls[0].table, 'chapter_reviews');
  assert.equal(h.calls[0].filters.id, reviewId); assert.equal(h.calls[0].filters.user_id, 'a');
  h.hooks.write = async () => ({ data: [] });
  await assert.rejects(actions.delete(h), /unavailable/);
});
test('invalid chapter input remains rejected before any write', async () => {
  const h = harness();
  await assert.rejects(h.api.publishChapterReview('work', 0, 4, '', false), /Invalid chapter/);
  await assert.rejects(h.api.publishChapterReview('work', 1, 4.2, 'Note', false), /Invalid rating/);
  await assert.rejects(h.api.publishChapterReview('work', 1, 0, '', false), /Invalid chapter review/);
  assert.equal(h.calls.length, 0);
});

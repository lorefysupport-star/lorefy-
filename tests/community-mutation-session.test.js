const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const postId = '11111111-1111-4111-8111-111111111111';
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a']]), calls = [];
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)) };
  const window = { localStorage: storage };
  vm.runInNewContext(source, { window, localStorage: storage, URL, console, setTimeout, clearTimeout });
  const api = window.LorefyBackend;
  const hooks = { session: async () => ({ userId: 'a' }), rpc: async () => ({ data: [{ id: postId }] }) };
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1,
    getSession: () => hooks.session(), client: { rpc: async (name, args) => { calls.push({ name, args }); return hooks.rpc(); } } });
  return { api, hooks, calls,
    transition(kind = 'account') {
      if (kind === 'account') { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); }
      if (kind === 'client') api.client = { ...api.client };
      if (kind === 'epoch') api._communityEpoch++;
      if (kind === 'local-owner') values.set('lorefy.activeUser.v1', 'b');
    } };
}
const attachment = { kind: 'list', title: 'Reader list', items: [{ id: 'work', rating: 4.25 }] };
const actions = {
  publish: h => h.api.publishCommunityPost({ kind: 'list', body: '  First reader  ', attachment }),
  reply: h => h.api.replyCommunityPost(postId, 'Reply', attachment),
  edit: h => h.api.mutateCommunityPost(postId, { body: '  Edited  ' }),
  delete: h => h.api.mutateCommunityPost(postId, { is_deleted: true }),
  reaction: h => h.api.setCommunityPostReaction(postId, 'dislike', false)
};
async function staleAt(action, phase, transition) {
  const h = harness(), gate = deferred(), entered = deferred();
  h.hooks[phase] = async () => { entered.resolve(); return gate.promise; };
  const result = action(h); await entered.promise; h.transition(transition);
  gate.resolve(phase === 'session' ? { userId: 'b' } : { data: [{ id: postId }] });
  await assert.rejects(result, stale); assert.equal(h.calls.length, phase === 'session' ? 0 : 1);
}
for (const [name, action] of Object.entries(actions)) {
  for (const phase of ['session', 'rpc']) test(name + ': old ' + phase + ' cannot continue or succeed in another account', () => staleAt(action, phase, 'account'));
  test(name + ': returned auth identity must match the initiating owner', async () => {
    const h = harness(); h.hooks.session = async () => ({ userId: 'b' });
    await assert.rejects(action(h), stale); assert.equal(h.calls.length, 0);
  });
}
for (const transition of ['client', 'epoch', 'local-owner']) {
  for (const phase of ['session', 'rpc']) test('publish: ' + transition + ' during ' + phase + ' invalidates the request', () => staleAt(actions.publish, phase, transition));
}
for (const transition of ['account', 'client', 'epoch', 'local-owner']) {
  test('report: old response is rejected after ' + transition + ' changes', async () => {
    const h = harness(), gate = deferred(), entered = deferred();
    h.hooks.rpc = async () => { entered.resolve(); return gate.promise; };
    const result = h.api.submitReport({ targetType: 'post', targetId: postId, reason: 'spam', note: 'First reader report' });
    await entered.promise; h.transition(transition); gate.resolve({ data: 'report-id' });
    await assert.rejects(result, stale); assert.equal(h.calls.length, 1);
  });
}
test('same-session publishing, replies, edits, deletion, reaction removal and reports preserve their payloads', async () => {
  const h = harness();
  for (const name of ['publish', 'reply', 'edit', 'delete']) assert.equal((await actions[name](h)).id, postId);
  assert.equal(await actions.reaction(h), false);
  h.hooks.rpc = async () => ({ data: 'report-id' });
  assert.equal((await h.api.submitReport({ targetType: 'post', targetId: postId, note: '  Evidence  ' })).id, 'report-id');
  assert.equal(h.calls[0].name, 'publish_community_post');
  assert.equal(h.calls[0].args.post_body, 'First reader');
  assert.equal(h.calls[0].args.post_attachment.items[0].rating, 4.25);
  assert.equal(h.calls[1].args.parent_ref, postId);
  assert.equal(h.calls[2].args.post_body, 'Edited'); assert.equal(h.calls[2].args.removed, null);
  assert.equal(h.calls[3].args.removed, true); assert.equal(h.calls[3].args.post_body, null);
  assert.equal(h.calls[4].args.reaction_active, false); assert.equal(h.calls[4].args.reaction_kind, 'dislike');
  assert.equal(h.calls[5].name, 'submit_report'); assert.equal(h.calls[5].args.report_details, 'Evidence');
});
test('service errors stay failures for each community action', async () => {
  for (const action of [...Object.values(actions), h => h.api.submitReport({ targetId: postId })]) {
    const h = harness(); h.hooks.rpc = async () => ({ error: Error('Denied') });
    await assert.rejects(action(h), /Denied/);
  }
});

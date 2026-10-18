const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const owner = 'test-reader';
const activeKey = 'lorefy.activeUser.v1';
const baseKey = 'lorefy.stateBase.v1';
const pendingKey = 'lorefy.pendingState.v1';
const library = 'lorefy.user.library.v2';
const lists = 'lorefy.user.profileLists.v1';

function harness({local, remote, base = local, pending = {}, version = 2}) {
  const values = new Map(Object.entries({
    ...local, [activeKey]: owner, [pendingKey]: JSON.stringify(pending),
    ...(base === null ? {} : {[baseKey]: JSON.stringify({userId: owner, data: base, version: 1})})
  }));
  const storage = {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  let cloud = {...remote}, cloudVersion = version, offline = false, beforeRead;
  const calls = [];
  const scope = {localStorage: storage, console: {warn() {}}};
  scope.window = scope;
  vm.runInNewContext(source, scope);
  const api = scope.LorefyBackend;
  Object.assign(api, {
    mode: 'live', user: {id: owner}, _hydrateProfile: async () => {},
    getSession: async () => ({userId: owner}),
    client: {
      from(table) {
        assert.equal(table, 'user_state');
        return {select: () => ({eq: (_, id) => {
          assert.equal(id, owner);
          return {maybeSingle: async () => {
            if (beforeRead) await beforeRead();
            return offline ? {error: {message: 'offline'}} : {data: {data: {...cloud}, version: cloudVersion}};
          }};
        }})};
      },
      async rpc(name, args) {
        assert.equal(name, 'sync_user_state');
        calls.push(JSON.parse(JSON.stringify(args)));
        if (offline) return {error: {message: 'offline'}};
        if (args.expected_version !== cloudVersion) return {error: {message: 'state_conflict'}};
        cloud = {...cloud, ...args.state_patch};
        args.removed_keys.forEach(key => delete cloud[key]);
        return {data: [{state_data: {...cloud}, state_version: ++cloudVersion}]};
      }
    }
  });
  return {api, storage, values, calls, cloud: () => ({...cloud}),
    journal: () => JSON.parse(storage.getItem(pendingKey) || '{}'),
    offline: value => { offline = value; }, beforeRead: fn => { beforeRead = fn; }};
}

test('remote list deletion is adopted alongside an unrelated offline library edit', async () => {
  const h = harness({local: {[library]: 'offline-edit', [lists]: 'old-lists'},
    base: {[library]: 'old-library', [lists]: 'old-lists'},
    remote: {[library]: 'old-library'}, pending: {[library]: 'offline-edit'}});
  assert.equal(await h.api.pull(owner), true);
  assert.equal(h.storage.getItem(lists), null);
  assert.equal(h.storage.getItem(library), 'offline-edit');
  assert.deepEqual(h.journal(), {[library]: 'offline-edit'});
  assert.equal(await h.api.push(), true);
  assert.equal(h.cloud()[lists], undefined);
  assert.equal(h.cloud()[library], 'offline-edit');
  assert.equal(h.calls.some(call => Object.hasOwn(call.state_patch, lists)), false);
});

test('a remotely cleared snapshot does not resurrect unchanged fields on the next push', async () => {
  const h = harness({local: {[library]: 'old-library', [lists]: 'offline-lists'},
    base: {[library]: 'old-library', [lists]: 'old-lists'}, remote: {},
    pending: {[lists]: 'offline-lists'}});
  assert.equal(await h.api.pull(owner), true);
  assert.equal(h.storage.getItem(library), null);
  assert.equal(h.storage.getItem(lists), 'offline-lists');
  await h.api.push();
  assert.deepEqual(h.cloud(), {[lists]: 'offline-lists'});
});

test('remote nulls remove unchanged fields without overwriting a pending local edit', async () => {
  const h = harness({local: {[library]: 'offline-edit', [lists]: 'old-lists'},
    base: {[library]: 'old-library', [lists]: 'old-lists'},
    remote: {[library]: 'cloud-library', [lists]: null}, pending: {[library]: 'offline-edit'}});
  await h.api.pull(owner);
  assert.equal(h.storage.getItem(lists), null);
  assert.equal(h.storage.getItem(library), 'offline-edit');
});

test('remote absence cannot delete local-only fields before an acknowledged base exists', async () => {
  const h = harness({local: {[library]: 'local-library', [lists]: 'local-lists'},
    base: null, remote: {[library]: 'cloud-library'}, pending: {[library]: 'local-library'}});
  await h.api.pull(owner);
  assert.equal(h.storage.getItem(lists), 'local-lists');
  assert.equal(h.storage.getItem(library), 'local-library');
});

test('local edits made while pulling still win over a remote deletion', async () => {
  const h = harness({local: {[library]: 'old-library', [lists]: 'old-lists'},
    remote: {[library]: 'cloud-library'}});
  h.beforeRead(() => { h.storage.setItem(lists, 'new-local-lists'); });
  await h.api.pull(owner);
  assert.equal(h.storage.getItem(lists), 'new-local-lists');
  assert.equal(h.journal()[lists], 'new-local-lists');
});

test('failed pull leaves offline data and deletion journal intact', async () => {
  const h = harness({local: {[library]: 'offline-library'},
    base: {[library]: 'old-library', [lists]: 'old-lists'},
    remote: {[library]: 'cloud-library', [lists]: 'cloud-lists'}, pending: {[lists]: null}});
  h.offline(true);
  assert.equal(await h.api.pull(owner), false);
  assert.equal(h.storage.getItem(library), 'offline-library');
  assert.equal(h.storage.getItem(lists), null);
  assert.deepEqual(h.journal(), {[lists]: null});
});

test('an account switch during pull leaves the next account and its journal untouched', async () => {
  const h = harness({local: {[library]: 'old-library'}, remote: {}});
  h.beforeRead(() => {
    h.storage.setItem(activeKey, 'other-reader');
    h.storage.setItem(library, 'other-library');
    h.storage.setItem(pendingKey, JSON.stringify({[library]: 'other-library'}));
  });
  assert.equal(await h.api.pull(owner), false);
  assert.equal(h.storage.getItem(activeKey), 'other-reader');
  assert.equal(h.storage.getItem(library), 'other-library');
  assert.deepEqual(h.journal(), {[library]: 'other-library'});
});

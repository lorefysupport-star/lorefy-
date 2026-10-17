const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');

function harness() {
  const start = source.indexOf('    _stopCommunitySubscription:');
  const end = source.indexOf('    deleteReview:', start);
  const scope = {console: {warn() {}}};
  vm.runInNewContext('var backend = {' + source.slice(start, end) + '};', scope);
  const channels = [];
  const removed = [];
  let userId = 'reader-one';
  const client = {
    channel(topic) {
      const channel = {
        topic,
        handlers: [],
        on(_event, filter, callback) { this.handlers.push({filter, callback}); return this; },
        subscribe() { return this; },
        emit(payload) { this.handlers[0].callback(payload); }
      };
      channels.push(channel);
      return channel;
    },
    removeChannel(channel) { removed.push(channel); return Promise.resolve('ok'); }
  };
  const backend = scope.backend;
  Object.assign(backend, {
    mode: 'live', client, _communityEpoch: 0, _communitySubscription: null,
    getSession: async () => ({userId})
  });
  return {backend, channels, removed, setUser(id) { userId = id; }};
}

test('two screens receive live events through one channel until each unsubscribes', async () => {
  const app = harness();
  const first = [], second = [];
  const stopFirst = await app.backend.subscribeCommunity(payload => first.push(payload.id));
  const stopSecond = await app.backend.subscribeCommunity(payload => second.push(payload.id));
  assert.equal(app.channels.length, 1);
  assert.equal(app.channels[0].handlers.length, 6);

  app.channels[0].emit({id: 1});
  assert.deepEqual(first, [1]);
  assert.deepEqual(second, [1]);

  stopFirst();
  assert.equal(app.removed.length, 0);
  app.channels[0].emit({id: 2});
  assert.deepEqual(first, [1]);
  assert.deepEqual(second, [1, 2]);

  stopSecond();
  stopSecond();
  assert.equal(app.removed.length, 1);
  app.channels[0].emit({id: 3});
  assert.deepEqual(second, [1, 2]);
});

test('an account change closes the old channel and old cleanup cannot close the new one', async () => {
  const app = harness();
  const oldEvents = [], newEvents = [];
  const stopOld = await app.backend.subscribeCommunity(payload => oldEvents.push(payload.id));
  app.setUser('reader-two');
  const stopNew = await app.backend.subscribeCommunity(payload => newEvents.push(payload.id));
  assert.equal(app.channels.length, 2);
  assert.equal(app.removed[0], app.channels[0]);
  app.channels[0].emit({id: 1});
  app.channels[1].emit({id: 2});
  assert.deepEqual(oldEvents, []);
  assert.deepEqual(newEvents, [2]);
  stopOld();
  assert.equal(app.removed.length, 1);
  stopNew();
  assert.equal(app.removed.length, 2);
});

test('each registration owns its cleanup even when callbacks are the same function', async () => {
  const app = harness();
  const events = [];
  const callback = payload => events.push(payload.id);
  const stopOne = await app.backend.subscribeCommunity(callback);
  const stopTwo = await app.backend.subscribeCommunity(callback);
  stopOne();
  app.channels[0].emit({id: 5});
  assert.deepEqual(events, [5]);
  assert.equal(app.removed.length, 0);
  stopTwo();
  assert.equal(app.removed.length, 1);
});

test('a missing session closes a previously active community channel', async () => {
  const app = harness();
  await app.backend.subscribeCommunity(() => {});
  app.backend.getSession = async () => null;
  await app.backend.subscribeCommunity(() => {});
  assert.equal(app.removed.length, 1);
  assert.equal(app.backend._communitySubscription, null);
});

test('a quick resubscribe waits until the previous channel has finished closing', async () => {
  const app = harness();
  let finishRemoval;
  app.backend.client.removeChannel = channel => {
    app.removed.push(channel);
    return new Promise(resolve => { finishRemoval = resolve; });
  };
  const stop = await app.backend.subscribeCommunity(() => {});
  stop();
  const pending = app.backend.subscribeCommunity(() => {});
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(app.channels.length, 1);
  finishRemoval('ok');
  const stopAgain = await pending;
  assert.equal(app.channels.length, 2);
  assert.equal(app.channels[1].topic, app.channels[0].topic);
  stopAgain();
  finishRemoval('ok');
});

test('sign-out generation prevents a pending subscription from reopening a channel', async () => {
  const app = harness();
  let finishSession;
  app.backend.getSession = () => new Promise(resolve => { finishSession = resolve; });
  const pending = app.backend.subscribeCommunity(() => {});
  app.backend._communityEpoch += 1;
  await app.backend._stopCommunitySubscription();
  finishSession({userId: 'reader-one'});
  const unsubscribe = await pending;
  unsubscribe();
  assert.equal(app.channels.length, 0);
  const logout=source.slice(source.indexOf('    signOut:'),source.indexOf('    pull:'));
  assert.match(logout, /this\.stopSync\(\);[\s\S]*?this\._communityEpoch \+= 1;[\s\S]*?await this\._stopCommunitySubscription\(\)/);
  assert.match(source, /_clearInvalidSession: async function\(\)\{[\s\S]*?await this\._stopCommunitySubscription\(\)/);
});

test('one failing listener does not prevent delivery to another screen', async () => {
  const app = harness();
  const received = [];
  const stopBad = await app.backend.subscribeCommunity(() => { throw new Error('screen failed'); });
  const stopGood = await app.backend.subscribeCommunity(payload => received.push(payload.id));
  app.channels[0].emit({id: 4});
  assert.deepEqual(received, [4]);
  stopBad();
  stopGood();
});

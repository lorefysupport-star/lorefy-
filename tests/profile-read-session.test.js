const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const target = '11111111-1111-4111-8111-111111111111';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'viewer-a']]), calls = [];
  const storage = { getItem: k => values.get(k) || null, setItem: (k,v) => values.set(k,String(v)), removeItem: k => values.delete(k) };
  const window = { localStorage: storage };
  vm.runInNewContext(source, { window, localStorage: storage, URL, console, setTimeout, clearTimeout });
  const api = window.LorefyBackend, hooks = {};
  async function step(name, value) { calls.push(name); return hooks[name] ? hooks[name](value) : value; }
  function client() { return {
    rpc: async (name, args) => {
      let value;
      if (name === 'get_public_profile_social') value = [{ id: target, name: 'Target', avatar: 'target/avatar', banner: 'target/banner' }];
      if (name === 'get_public_profile_artwork') value = { custom_work_covers: { work: 'lorefy-artwork:target/cover' }, custom_character_images: { hero: 'lorefy-artwork:target/portrait' } };
      if (name === 'get_public_profile_appearance') value = { theme: 'full-color' };
      if (name === 'get_public_profile_lists') value = [{ id: 'public-list' }];
      if (name === 'search_public_readers' || name === 'list_profile_connections') value = [{ id: target, avatar: 'target/avatar' }];
      calls.push({ name, args });
      return step(name, { data: value, error: null });
    },
    from: table => {
      const query = { select() { return this; }, eq(key,value) { calls.push({ table,key,value }); return this; },
        is() { return this; }, limit(n) { calls.push({ limit: n }); return this; },
        then(resolve,reject) { return step(table, table === 'profile_follows' ? { data: [{ following_id: target }] } : { count: 3 }).then(resolve,reject); } };
      return query;
    }
  }; }
  Object.assign(api, { mode: 'live', user: { id: 'viewer-a' }, _communityEpoch: 1, client: client(),
    getSession: () => step('auth', { userId: 'viewer-a' }),
    _storageMediaUrl: (bucket,value) => step(String(value).split('/').pop(), 'signed:' + value) });
  return { api, hooks, calls, values, transition(kind='account') {
    if(kind==='account') { api.user = { id:'viewer-b' }; values.set('lorefy.activeUser.v1','viewer-b'); }
    if(kind==='client') api.client = client();
    if(kind==='epoch') api._communityEpoch++;
    if(kind==='local-owner') values.set('lorefy.activeUser.v1','viewer-b');
  }};
}
const actions = {
  profile: h => h.api.getPublicProfile(target),
  search: h => h.api.searchPublicProfiles('TaRgEt', 30),
  followed: h => h.api.getFollowedProfileIds(),
  connections: h => h.api.listProfileFollowers(target, 300, 20000)
};
const phases = {
  profile: ['auth','get_public_profile_social','get_public_profile_artwork','get_public_profile_appearance','get_public_profile_lists','cover','portrait','community_posts','avatar','banner'],
  search: ['search_public_readers','avatar'], followed: ['auth','profile_follows'],
  connections: ['auth','list_profile_connections','avatar']
};
for(const [action,steps] of Object.entries(phases)) for(const phase of steps) test(action + ': account change during ' + phase + ' rejects before another step', async () => {
  const h=harness(), gate=deferred(), entered=deferred();
  h.hooks[phase]=async value=> { entered.resolve(); await gate.promise; return value; };
  const pending=actions[action](h); await entered.promise; const count=h.calls.length;
  h.transition(); gate.resolve(); await assert.rejects(pending,stale);
  assert.equal(h.calls.length,count);
});
for(const kind of ['client','epoch','local-owner']) for(const action of ['profile','search','followed','connections']) test(action + ': ' + kind + ' invalidates pending response', async () => {
  const h=harness(), gate=deferred(), entered=deferred(), phase=phases[action][0];
  h.hooks[phase]=async value=> { entered.resolve(); await gate.promise; return value; };
  const pending=actions[action](h); await entered.promise; const count=h.calls.length;
  h.transition(kind); gate.resolve(); await assert.rejects(pending,stale); assert.equal(h.calls.length,count);
});
for(const action of ['profile','followed','connections']) test(action + ': mismatched SDK identity cannot make a query', async () => {
  const h=harness(); h.hooks.auth=async()=>({userId:'viewer-b'});
  await assert.rejects(actions[action](h),stale); assert.deepEqual(h.calls,['auth']);
});
test('a current viewer can read a different public profile and its own following list', async () => {
  const h=harness(), profile=await actions.profile(h);
  assert.equal(profile.id,target); assert.equal(profile.theme,'full-color'); assert.equal(profile.post_count,3);
  assert.equal(profile.custom_work_covers.work,'signed:target/cover'); assert.equal(profile.custom_character_images.hero,'signed:target/portrait');
  assert.equal(profile.avatar,'signed:target/avatar'); assert.equal(profile.banner,'signed:target/banner');
  assert.equal(profile.profile_lists[0].id,'public-list');
  assert.equal((await actions.search(h))[0].id,target); assert.equal((await actions.followed(h))[0],target);
  assert.equal((await actions.connections(h))[0].avatar,'signed:target/avatar');
  assert.ok(h.calls.some(c=>c.table==='profile_follows'&&c.key==='follower_id'&&c.value==='viewer-a'));
  const rpc=h.calls.find(c=>c.name==='list_profile_connections');
  assert.equal(rpc.args.profile_ref,target); assert.equal(rpc.args.result_limit,200); assert.equal(rpc.args.result_offset,10000);
});
test('optional list/count/media failures retain the current public profile fallback', async () => {
  const h=harness();
  for(const phase of ['get_public_profile_lists','community_posts','avatar','banner']) h.hooks[phase]=async()=>{throw Error('offline');};
  const p=await actions.profile(h); assert.equal(p.id,target); assert.equal(p.profile_lists_error,true);
  assert.equal(p.profile_lists.length,0); assert.equal(p.avatar,''); assert.equal(p.banner,''); assert.equal(p.post_count,0);
});
test('invalid profile IDs, short queries and demo reads keep their empty-result contracts', async () => {
  const h=harness(); assert.equal(await h.api.getPublicProfile('bad'),null);
  assert.equal((await h.api.listProfileFollowing('bad')).length,0); assert.equal((await h.api.searchPublicProfiles('a')).length,0);
  h.api.mode='demo'; h.values.set('lorefy.user.following.v1',JSON.stringify([target]));
  assert.equal(await actions.profile(h),null); assert.equal((await actions.search(h)).length,0);
  assert.equal((await actions.connections(h)).length,0); assert.equal((await actions.followed(h))[0],target); assert.equal(h.calls.length,0);
});

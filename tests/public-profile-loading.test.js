const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness() {
  const states = [], effects = [], requests = [], follows = [], handlers = new Map();
  let cursor = 0;
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useEffect(callback, deps) {
      const index = cursor++, previous = effects[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[index] = { deps, callback };
      }
    }
  };
  const window = { React, NenIcons: {}, LorefyPageRefresh:{register:(key,fn)=>{handlers.set(key,fn);return()=>{if(handlers.get(key)===fn)handlers.delete(key);};}}, LorefyBackend: {
    mode: 'live',
    getPublicProfile(id) { return new Promise((resolve, reject) => requests.push({ id, resolve, reject })); },
    listReviewCollection: async () => [],
    toggleProfileFollow: async (...args) => follows.push(args)
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../modules/lorefy-public-profile.js'), 'utf8'), { window, URL });
  return {
    requests, follows, handlers,
    render(id = 'reader-a') {
      cursor = 0;
      const tree = window.LorefyPublicProfile({ profile: { id, username: id }, workById: () => null });
      for (const effect of effects) {
        if (!effect?.callback) continue;
        const callback = effect.callback;
        effect.callback = null;
        effect.cleanup = callback();
      }
      return tree;
    }
  };
}
function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : [tree, ...tree.children.flatMap(nodes)]; }
const followButton = tree => nodes(tree).find(node => node.props['data-follow-action']);
const count = tree => nodes(tree).find(node => node.props['data-connection'] === 'followers').children[0].children[0];
const settle = () => new Promise(resolve => setImmediate(resolve));

test('a remote reader does not appear unfollowed with zero followers while loading', async () => {
  const app = harness(), tree = app.render();
  assert.equal(tree.props['aria-busy'], true);
  assert.equal(count(tree), '\u2014');
  assert.equal(followButton(tree).props.disabled, true);
  await followButton(tree).props.onClick();
  assert.equal(app.follows.length, 0);
  app.requests[0].resolve({ id:'reader-a', follower_count:4, is_following:true, completed_count:2 });
  await settle();
  const loaded = app.render();
  assert.equal(loaded.props['aria-busy'], false);
  assert.equal(count(loaded), 4);
  assert.equal(followButton(loaded).props.disabled, false);
  assert.equal(followButton(loaded).props['aria-pressed'], true);
});

test('a failed remote profile keeps unknown counts and follow disabled until a successful retry', async () => {
  const app = harness();
  app.render();
  app.requests[0].reject(new Error('offline'));
  await settle();
  const failed = app.render();
  assert.equal(failed.props['aria-busy'], false);
  assert.equal(count(failed), '\u2014');
  assert.equal(followButton(failed).props.disabled, true);
  const alert = nodes(failed).find(node => node.props.role === 'alert');
  nodes(alert).find(node => node.type === 'button').props.onClick();
  app.render();
  assert.equal(app.render().props['aria-busy'], true);
  app.requests[1].resolve({ id:'reader-a', follower_count:0 });
  await settle();
  assert.equal(count(app.render()), 0);
  assert.equal(followButton(app.render()).props.disabled, false);
});

test('switching readers immediately hides old counts and ignores a late response', async () => {
  const app = harness();
  app.render('reader-a');
  const second = app.render('reader-b');
  assert.equal(count(second), '\u2014');
  assert.equal(followButton(second).props.disabled, true);
  app.requests[0].resolve({ id:'reader-a', follower_count:99, is_following:true });
  await settle();
  assert.equal(count(app.render('reader-b')), '\u2014');
  app.requests[1].resolve({ id:'reader-b', follower_count:5, is_following:false });
  await settle();
  assert.equal(count(app.render('reader-b')), 5);
  assert.equal(followButton(app.render('reader-b')).props['aria-pressed'], false);
});

test('pull refresh reloads the visited reader without changing the viewer and ignores cancellation',async()=>{
  const app=harness();app.render();app.requests[0].resolve({id:'reader-a',follower_count:4});await settle();app.render();
  assert.equal(typeof app.handlers.get('profile-visitor'),'function');
  const job=app.handlers.get('profile-visitor')({active:()=>true});
  app.requests[1].resolve({id:'reader-a',follower_count:7});assert.equal(await job,true);assert.equal(count(app.render()),7);
  const cancelled=app.handlers.get('profile-visitor')({active:()=>false});
  assert.equal(await cancelled,false);assert.equal(app.requests.length,2);
});

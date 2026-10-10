const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('home renders community without the former catalog switch', () => {
  const app = read('uploads/files/lorefy-app.js');
  assert.ok(app.includes('Tn?$r():sr()'));
  assert.ok(!app.includes('Tn?$r():F==="main"?ir():sr()'));
  assert.ok(app.includes('className:"lf-social-header"'));
});

test('community has exactly two explicit audience tabs', () => {
  const app = read('uploads/files/lorefy-app.js');
  assert.ok(app.includes('[["community","For You"],["friends","Following"]]'));
  assert.ok(app.includes('"data-community-filter":t==="friends"?"friends":"all"'));
  assert.match(read('modules/lorefy-community.js'), /buttons.length === 2/);
});

test('explore owns the former home catalog and discovery categories', () => {
  const app = read('uploads/files/lorefy-app.js');
  assert.ok(app.includes('className:"lf-discover-catalog"},ir()'));
  assert.ok(app.includes('className:"lf-discover-category-grid"'));
});

test('social feed interleaves reviews and posts without moving React nodes', () => {
  assert.match(read('modules/lorefy-community.js'), /function orderCommunityFeed/);
  assert.ok(read('uploads/files/lorefy-app.js').includes('"data-review-timestamp":t.ts'));
  assert.match(read('styles/lorefy-community.css'), /\.lf-social-timeline/);
});

test('returning to home retains the React-selected audience', () => {
  assert.ok(read('uploads/files/lorefy-app.js').includes('"aria-selected":H===t'));
  assert.match(read('modules/lorefy-community.js'), /state.filter = selectedTab \? filterForCommunityTab\(selectedTab\)/);
});

test('owner delete action cannot be mistaken for the review interaction row', () => {
  assert.match(read('modules/lorefy-growth-features.js'), /button.parentElement !== card && communityActionType\(button\) === 'comment'/);
});

test('each audience has its own scroll memory key', () => {
  const {viewKey} = require('../modules/lorefy-scroll-memory.js');
  assert.notEqual(viewKey('main', {homeTab:'community',feedTab:'all'}), viewKey('main', {homeTab:'community',feedTab:'friends'}));
});

test('timeline orders a newer review before a post without relocating either node', () => {
  const source = read('modules/lorefy-community.js');
  const start = source.indexOf('  function orderCommunityFeed()');
  const end = source.indexOf('  function visibleCommunityPosts()', start);
  const post = {dataset:{postTimestamp:'100'}, style:{}};
  const review = {dataset:{reviewTimestamp:'200'}, style:{}};
  const empty = {hidden:false};
  const page = {isConnected:true,classList:{add(){}},querySelectorAll:()=>[post,review],querySelector:()=>empty};
  const context = {state:{page}};
  vm.runInNewContext(source.slice(start,end) + '\norderCommunityFeed();', context);
  assert.equal(review.style.order, '0');
  assert.equal(post.style.order, '1');
  assert.equal(empty.hidden, true);
});

test('Following excludes strangers and replies, while For You keeps public top-level posts', () => {
  const source = read('modules/lorefy-community.js');
  const start = source.indexOf('  function visibleCommunityPosts()');
  const end = source.indexOf('\n  function ', start + 20);
  const context = {identity:()=>({id:'me'}),state:{filter:'friends',followedIds:['reader-1'],posts:[{id:'a',user_id:'reader-1'},{id:'b',user_id:'stranger'},{id:'c',user_id:'reader-1',parent_id:'a'}]}};
  vm.runInNewContext(source.slice(start,end), context);
  assert.deepEqual(Array.from(context.visibleCommunityPosts(), p=>p.id), ['a']);
  context.state.filter = 'all';
  assert.deepEqual(Array.from(context.visibleCommunityPosts(), p=>p.id), ['a','b']);
});

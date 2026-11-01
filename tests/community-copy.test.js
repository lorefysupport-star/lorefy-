const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const RenderNode = require('./helpers/render-dom');
class Node extends RenderNode {
  constructor(tag, attrs, children) { super(tag, attrs || {}, Array.isArray(children) ? children : children ? [children] : []); }
  getAttribute(name) { return this.attrs[name] ?? null; }
}
const source = fs.readFileSync('modules/lorefy-community.js', 'utf8');
function helpers(lang = 'en') {
  const start = source.indexOf('  var communityNumbers =');
  assert.ok(start >= 0, 'community counter presentation helper exists');
  const scope = { Intl, Number, Math, String, doc: { documentElement: { lang } },
    uiText: (ar, en) => scope.doc.documentElement.lang === 'en' ? en : ar };
  vm.runInNewContext(source.slice(start, source.indexOf('  function avatar(', start)), scope);
  return scope;
}
for (const kind of ['like', 'dislike', 'reply']) test(kind + ' counters cover Arabic and English plural boundaries', () => {
  const h = helpers();
  for (const n of [0, 1, 2, 3, 10, 11, 100, 12345]) {
    const en = h.communityCount(kind, n, 'en'), ar = h.communityCount(kind, n, 'ar');
    assert.match(en.full, new RegExp(new Intl.NumberFormat('en-US').format(n)));
    assert.doesNotMatch(en.full, /[\u0600-\u06ff]/);
    assert.match(ar.full, /[\u0600-\u06ff]/);
    assert.equal(en.display, ar.display);
  }
  assert.equal(h.communityCount('reply', 2, 'ar').full, 'ردّان (2)');
  assert.equal(h.communityCount('like', 3, 'ar').full, '3 إعجابات');
  assert.equal(h.communityCount('like', 11, 'ar').full, '11 إعجابًا');
});
test('large counters compact only their display; invalid inputs remain finite and nonnegative', () => {
  const h = helpers();
  assert.equal(h.communityCount('like', 12345, 'en').display, '12.3K');
  assert.equal(h.communityCount('like', 12345, 'en').full, '12,345 likes');
  for (const n of [-4, NaN, Infinity, null, undefined, 'bad']) assert.equal(h.communityCount('like', n, 'en').display, '0');
  assert.equal(h.communityCount('reply', 2.9, 'en').full, '2 replies');
});
test('count updates refresh accessible name, tooltip and isolated visible number without replacing the control', () => {
  const h = helpers(); const span = new Node('span'), button = new Node('button', {}, [span]);
  h.updatePostCounter(button, 'like', 12345, false);
  assert.equal(button.attrs['aria-label'], 'Like · 12,345 likes');
  assert.equal(button.attrs.title, button.attrs['aria-label']);
  assert.equal(span.textContent, '12.3K');
  h.doc.documentElement.lang = 'ar'; h.updatePostCounter(button, 'reply', 2, true);
  assert.equal(button.attrs['aria-label'], 'الرد على الرد · ردّان (2)');
  assert.equal(button.children[0], span);
});
function card(lang, compact = false, kind = 'text') {
  const scope = helpers(lang), actions = [];
  Object.assign(scope, { el: (...args) => new Node(...args), avatar: () => new Node('span'), icon: () => new Node('i'),
    identity: () => ({ id: 'viewer' }), savedPosts: () => ({}), quoteAttachment: () => null,
    timeLabel: () => 'Now', hydrateIcons() {}, openProfile: p => actions.push(p),
    doc: { documentElement: { lang }, querySelectorAll: () => [] }, global: {},
    toggleSavedPost() {}, setPostReaction() {}, sharePost() {}, openThread() {} });
  vm.runInNewContext(source.slice(source.indexOf('  function postCard('), source.indexOf('  async function threadReplies(')), scope);
  const profile = { name: 'رحلة / Journey', username: 'reader' };
  const post = { id: 'p', user_id: 'other', profile, kind, body: 'توقف Review literal',
    created_at: '2026-10-28', replyCount: 2, reactions: { like: 12345, dislike: 1, mine: {} } };
  return { node: scope.postCard(post, compact), profile, post, actions };
}
test('English post cards localize types and all actions before a translation observer runs', () => {
  for (const [kind, label] of [['text','Post'],['list','List'],['top','Character ranking']]) {
    const {node} = card('en', false, kind);
    assert.equal(node.querySelector('.lf-community-post-kind').textContent, label);
    const actions = node.querySelector('footer').children;
    assert.equal(actions.length, 5);
    assert.ok(actions.every(n => n.attrs['aria-label'] && !/[\u0600-\u06ff]/.test(n.attrs['aria-label'])));
    assert.equal(actions[0].attrs['aria-label'], 'Open replies · 2 replies');
    assert.equal(actions[1].attrs['aria-label'], 'Like · 12,345 likes');
    assert.equal(actions[2].attrs['aria-label'], 'Dislike · 1 dislike');
  }
});
test('Arabic cards preserve author and body text and retain original profile callback', () => {
  const {node, profile, actions, post} = card('ar');
  const author = node.querySelector('.lf-community-post-author'), name = author.querySelector('strong');
  assert.equal(name.attrs.dir, 'auto'); assert.equal(name.attrs.title, profile.name);
  assert.equal(name.textContent, profile.name);
  assert.equal(author.querySelector('small').attrs.dir, 'ltr');
  assert.equal(node.querySelector('.lf-community-post-body').textContent, post.body);
  author.click(); assert.equal(actions[0], profile);
  assert.equal(node.querySelector('.lf-community-post-replies').attrs['aria-label'], 'فتح الردود · ردّان (2)');
});
test('compact cards keep reply-to-reply semantics and stable pressed state', () => {
  const {node} = card('en', true);
  assert.equal(node.querySelector('.lf-community-post-replies').attrs['aria-label'], 'Reply · 2 replies');
  assert.equal(node.querySelector('.lf-community-post-like').attrs['aria-pressed'], 'false');
});
test('all existing counter refresh paths use the same presentation contract', () => {
  const reaction = source.slice(source.indexOf('  function setPostReaction('), source.indexOf('  async function sharePost('));
  assert.match(reaction, /updatePostCounter\(button, kind,/);
  assert.match(reaction, /updatePostCounter\(peerButton, other,/);
  const feed = source.slice(source.indexOf('  function renderPostFeed('), source.indexOf('  function orderCommunityFeed('));
  assert.match(feed, /updatePostCounter\(button, entry\[0\],/);
  assert.match(feed, /updatePostCounter\(replyButton, 'reply',/);
  const thread = source.slice(source.indexOf('  async function openThread('), source.indexOf('  function renderPostFeed('));
  assert.match(thread, /updatePostCounter\(replyButton, 'reply', post.replyCount, true\)/);
  assert.match(thread, /uiText\('تعذر تحميل الردود · إعادة المحاولة', 'Could not load replies · Retry'\)/);
  assert.match(thread, /uiText\('كن أول من يرد', 'Be the first to reply'\)/);
});
test('reaction presentation follows exclusive toggles without changing payloads or persisted counts', () => {
  const h = helpers(), writes = new Map();
  Object.assign(h, { global: {}, isDemo: () => true, read: (key, fallback) => writes.get(key) || fallback,
    write: (key, value) => writes.set(key, value), LOCAL_REACTIONS_KEY: 'reactions', LOCAL_POSTS_KEY: 'posts' });
  vm.runInNewContext(source.slice(source.indexOf('  function setPostReaction('), source.indexOf('  async function sharePost(')), h);
  const like = new Node('button', {}, [new Node('span')]), dislike = new Node('button', {}, [new Node('span')]);
  const post = { id:'p', reactions:{like:1000,dislike:0,mine:{like:true,dislike:false}} };
  h.setPostReaction(post, 'dislike', dislike, like);
  assert.equal(post.reactions.like, 999); assert.equal(post.reactions.dislike, 1);
  assert.equal(like.attrs['aria-label'], 'Like · 999 likes');
  assert.equal(dislike.attrs['aria-label'], 'Dislike · 1 dislike');
  assert.equal(like.attrs['aria-pressed'], 'false'); assert.equal(dislike.attrs['aria-pressed'], 'true');
  h.setPostReaction(post, 'dislike', dislike, like);
  assert.equal(dislike.attrs['aria-label'], 'Dislike · 0 dislikes');
  assert.equal(writes.get('reactions').p.reactions, undefined);
  assert.equal(writes.get('reactions').p.dislike, 0);
});
test('author and number typography retain natural text direction and scalable readable metrics', () => {
  const css = fs.readFileSync('styles/lorefy-community.css', 'utf8');
  assert.match(css, /\.lf-community-post-author strong\s*\{[^}]*unicode-bidi:\s*isolate/s);
  assert.match(css, /\.lf-community-post-actions button > span\s*\{[^}]*font-variant-numeric:\s*tabular-nums/s);
});
test('community copy changes use matching entry and offline asset versions', () => {
  const entry = fs.readFileSync('index.html', 'utf8'), sw = fs.readFileSync('sw.js', 'utf8');
  for (const file of ['modules/lorefy-community.js', 'styles/lorefy-community.css']) {
    const version=file.endsWith('.css')?'20261028-community-copy-v1':'20261101-post-refresh-v1';
    assert.ok(entry.includes(file + '?v='+version));
    assert.ok(sw.includes(file + '?v='+version));
  }
  assert.match(sw, /lorefy-v659-post-refresh/);
});

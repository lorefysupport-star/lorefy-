const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('profile layout accepts only the two supported choices', () => {
  const api = require('../modules/lorefy-profile-layout.js');
  for (const value of [null, undefined, '', {}, [], 'pink', 'IMMERSIVE']) assert.equal(api.normalize(value), 'normal');
  assert.equal(api.normalize('immersive'), 'immersive');
  assert.equal(api.normalize('normal'), 'normal');
});

test('public layout belongs to the owner, not the viewer', () => {
  const api = require('../modules/lorefy-profile-layout.js');
  assert.equal(api.forProfile({profile_layout:'immersive'}), 'immersive');
  assert.equal(api.forProfile({}), 'normal');
  assert.equal(api.forProfile({profile_layout:'invalid'}), 'normal');
  assert.match(read('modules/lorefy-public-profile.js'), /root.LorefyProfileLayout.forProfile\(profile\)/);
});

test('layout sync is account scoped, and editor commits only after successful save', () => {
  const app = read('uploads/files/lorefy-app.js');
  assert.match(read('backend/lorefy-backend.js'), /"lorefy.user.profileLayout.v1"/);
  assert.match(app, /setProfileLayoutDraft\(window.LorefyProfileLayout.normalize\(profileLayout\)\)/);
  const start = app.indexOf('o=async()=>', app.indexOf('br=()=>'));
  const save = app.slice(start, app.indexOf(';return React.createElement', start));
  assert.ok(save.indexOf('await y.saveProfile') >= 0);
  assert.ok(save.indexOf('await y.saveProfile') < save.indexOf('commit(setProfileLayout,'));
  assert.match(save, /commit\(setProfileLayout,window.LorefyProfileLayout.normalize\(profileLayoutDraft\)\)/);
});

test('picker has translated choices and standard native radios', () => {
  const api = require('../modules/lorefy-profile-layout.js');
  assert.deepEqual(api.options('en').map(x => x.label), ['Normal', 'Panoramic']);
  assert.equal(api.options('ar').length, 2);
  assert.match(read('modules/lorefy-profile-layout.js'), /type:'radio'/);
  assert.match(read('index.html'), /modules\/lorefy-profile-layout.js/);
  assert.match(read('sw.js'), /modules\/lorefy-profile-layout.js/);
});

test('panoramic styles preserve the avatar and reserve space for wrapped names', () => {
  const css = read('styles/lorefy-profile-layout.css');
  assert.match(css, /data-profile-layout='immersive'/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /grid-template-areas/);
  assert.match(css, /mask-image: linear-gradient/);
  assert.doesNotMatch(css, /backdrop-filter/);
  assert.match(css, /\.lf-profile-avatar\s*\{[^}]*z-index: 6 !important/s);
});
test('panoramic identity starts with the name and handle and groups external accounts separately',()=>{
  const css=read('styles/lorefy-profile-layout.css'),app=read('uploads/files/lorefy-app.js');
  assert.match(css,/grid-template-areas:\s*'name' 'handle' 'bio' 'social' 'metrics' 'favorites'/);
  assert.match(css,/\.lf-profile-networks\s*\{\s*display:\s*contents/);
  assert.match(css,/\[data-profile-layout='immersive'\][^}]*\.lf-profile-networks\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/);
  assert.match(app,/className:"lf-profile-networks"/);
  assert.doesNotMatch(css,/padding-right:\s*138px/);
});
test('panoramic follower counts remain adjacent instead of stretching across the header',()=>{
  const css=read('styles/lorefy-profile-layout.css');
  assert.match(css,/\.lf-reader-social-summary\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,max-content\) minmax\(0,max-content\) minmax\(0,1fr\)/);
  assert.match(css,/\.lf-reader-social-summary\)\s*\{[^}]*gap:\s*4px 24px !important/);
});

test('picker selects a draft via callback without writing account data', () => {
  const changes = [];
  const window = {React:{createElement:(type, props, ...children) => ({type, props:props || {}, children:children.flat(Infinity)})}};
  vm.runInNewContext(read('modules/lorefy-profile-layout.js'), {window});
  const tree = window.LorefyProfileLayout.Picker({lang:'en', value:'normal', banner:'https://example.com/banner.jpg', avatar:'https://example.com/avatar.jpg', onChange:value => changes.push(value)});
  const flatten = tree => tree && typeof tree === 'object' ? [tree, ...tree.children.flatMap(flatten)] : [];
  const radios = flatten(tree).filter(node => node.type === 'input');
  assert.equal(radios.length, 2);
  assert.equal(radios[0].props.checked, true);
  assert.equal(radios[1].props.checked, false);
  radios[1].props.onChange();
  assert.deepEqual(changes, ['immersive']);
});

test('public SQL projects a whitelisted layout and preserves visibility guards', () => {
  const sql = read('supabase/migrations/20261008123812_profile_layout_projection.sql');
  assert.match(sql, /s.profile_layout = '"immersive"'::jsonb then 'immersive' else 'normal'/);
  for (const guard of ['auth.uid() is not null', 'not p.is_private', 'not private.author_has_blocked_viewer', 'not private.reader_has_blocked_author']) assert.ok(sql.includes(guard));
  assert.match(sql, /from public, anon/);
});

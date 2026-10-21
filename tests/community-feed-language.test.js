const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../modules/lorefy-community.js'),'utf8');
function render(lang, filter, options = {}) {
  const nodes = [], calls = [];
  const RenderNode=require('./helpers/render-dom');
  function el(tag,attrs={},children=[]){const n=new RenderNode(tag,attrs,children);nodes.push(n);return n;}
  const list = el('div'), status = {};
  const host = {querySelector:selector => selector.includes('post-list') ? list : status};
  const scope = {doc:{documentElement:{lang},querySelector:() => host},state:{filter,...options},
    identity:()=>({id:'owner'}),savedPosts:()=>({}),uiText:(ar,en) => lang === 'en' ? en : ar,el,icon:() => el('i'),visibleCommunityPosts:() => [],
    orderCommunityFeed(){},hydrateIcons(){},loadPosts:(...args) => calls.push(args),
    global:{dispatchEvent:() => calls.push('find-readers')},CustomEvent:class {}};
  const start = source.indexOf('  function renderPostFeed()'), end = source.indexOf('  function orderCommunityFeed()',start);
  vm.runInNewContext(source.slice(start,end) + '\nrenderPostFeed();',scope);
  return {nodes,calls,status};
}
test('Following empty feed renders entirely in English on creation and reader discovery works', () => {
  const {nodes,calls,status} = render('en','friends');
  const labels = nodes.map(n => n.attrs.text || '').join('|');
  assert.ok(labels.includes('Follow new readers to see their posts here.'));
  assert.doesNotMatch(labels,/[\u0600-\u06ff]/);
  assert.equal(status.textContent,'Following');
  nodes.find(n => n.attrs.text === 'Find readers').click();
  assert.deepEqual(calls,['find-readers']);
});
test('Arabic feed messages and stable filter keys remain unchanged', () => {
  const {nodes,status} = render('ar','friends');
  assert.ok(nodes.some(n => n.attrs.text === 'تابع قرّاء جدد لتظهر منشوراتهم هنا.'));
  assert.equal(status.textContent,'المتابَعون');
});
test('English retry and pagination retain disabled loading state and their actions', () => {
  const {nodes,calls} = render('en','all',{error:true,hasMore:true});
  const retry = nodes.find(n => n.attrs.text === 'Could not load posts · Retry');
  assert.ok(retry); retry.click();
  const more = nodes.find(n => n.attrs.text === 'Older posts');
  assert.ok(more); more.click();
  assert.deepEqual(calls,[[true],[true,true]]);
  const loading = render('en','all',{hasMore:true,loading:true}).nodes.find(n => n.attrs.text === 'Loading...');
  assert.equal(loading.disabled,true);
});

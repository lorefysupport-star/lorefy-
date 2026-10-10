const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const community = fs.readFileSync('modules/lorefy-community.js', 'utf8');
const share = fs.readFileSync('modules/lorefy-share-studio.js', 'utf8');

function extract(text, from, to, scope) {
  const start = text.indexOf(from), end = text.indexOf(to, start);
  assert.ok(start >= 0 && end > start);
  vm.runInNewContext(text.slice(start, end), scope);
  return scope;
}

function localCommunity(rows) {
  const scope = {read:(key, fallback) => key === 'posts' ? rows : fallback,
    global:{}, works:() => [], uuid:() => 'generated', LOCAL_POSTS_KEY:'posts',
    LOCAL_REACTIONS_KEY:'reactions', isDemo:() => true};
  extract(community, '  function normalizePost(', '  async function loadFollowedProfileIds(', scope);
  extract(community, '  async function threadReplies(', '  function replyContext(', scope);
  return scope;
}

test('deleted local roots hide their replies without deleting reply history, and undo restores them', () => {
  const root = {id:'root',user_id:'me',is_deleted:true};
  const rows = [root,{id:'reply',user_id:'me',parent_id:'root',body:'Kept'}];
  const api = localCommunity(rows);
  assert.equal(api.demoPosts().length,0);
  assert.equal(rows[1].body,'Kept');
  root.is_deleted = false;
  assert.equal(api.demoPosts().length,2);
  assert.equal(api.demoPosts().find(row => row.id === 'root').replyCount,1);
});

test('reply count combines inline and stored replies by identity and excludes deleted replies', () => {
  const inline = [{id:'shared',body:'Earlier'},{id:'inline',body:'Second'},
    {id:'deleted',is_deleted:true}];
  const rows = [{id:'root',demoReplies:inline},{id:'shared',parent_id:'root',body:'Updated'},
    {id:'stored',parent_id:'root',body:'Third'}];
  assert.equal(localCommunity(rows).demoPosts().find(row => row.id === 'root').replyCount,3);
});

test('thread shows each reply once, keeps its newest stored version and excludes deleted inline replies', async () => {
  const api = localCommunity([{id:'shared',parent_id:'root',body:'Updated'}]);
  const result = await api.threadReplies({id:'root',demoReplies:[{id:'shared',body:'Earlier'},
    {id:'deleted',is_deleted:true}]});
  assert.equal(result.length,1);
  assert.equal(result[0].body,'Updated');
});

function shareCanvas(lang) {
  const drawn = [];
  const ctx = new Proxy({fillText:value => drawn.push(String(value)),
    measureText:value => ({width:String(value).length * 8}),
    createLinearGradient:() => ({addColorStop(){}})},
    {get:(target,key) => key in target ? target[key] : () => {}});
  const scope = {doc:{documentElement:{lang,getAttribute:() => 'pink'},
    createElement:() => ({getContext:() => ctx})},
    SHARE_W:1080,SHARE_H:1920,cardTitle:() => 'My favorites',
    collectShelfItems:() => [{src:'cover',label:'Kurapika'}],
    collectImages:() => ['cover'],collectLabels:() => ['Kurapika'],
    loadImage:async src => src ? {width:400,height:600} : null,
    requireShareImages(){},roundRect(){},drawCover(){},drawShelf(){},drawRatingFeather(){},
    shelfHeadingLines:title => [title],fitHeading(){},trimText:(_,text) => String(text),
    canvasFile:async () => ({name:'story.png'})};
  extract(share,'  function sharePalette(', '  function previewFile(',scope);
  return {scope,drawn};
}

test('English shelf export localizes system captions without changing the chosen character name', async () => {
  const {scope,drawn} = shareCanvas('en');
  await scope.buildShelfStoryFile({querySelector:() => null,getAttribute:() => 'shelf'});
  assert.ok(drawn.includes('Kurapika'));
  assert.ok(drawn.includes('Discover · Rate · Share'));
  assert.ok(drawn.includes('A Lorefy reader\'s picks'));
  assert.ok(drawn.every(text => !/[\u0600-\u06ff]/.test(text)));
});

test('English community export localizes fallback title, byline and footer', async () => {
  const {scope,drawn} = shareCanvas('en');
  await scope.buildCommunityPostFile({kind:'top',attachment:{items:[]}});
  assert.ok(drawn.includes('Character ranking'));
  assert.ok(drawn.includes('Lorefy reader'));
  assert.ok(drawn.includes('Discover · Rate · Share'));
  assert.ok(drawn.every(text => !/[\u0600-\u06ff]/.test(text)));
});

test('Arabic community exports preserve user names and system captions', async () => {
  const {scope,drawn} = shareCanvas('ar');
  await scope.buildCommunityPostFile({kind:'top',profile:{name:'اسم القارئ'},
    attachment:{title:'اختياراتي الخاصة',items:[]}});
  assert.ok(drawn.includes('اسم القارئ'));
  assert.ok(drawn.includes('اختياراتي الخاصة'));
  assert.ok(drawn.includes('اكتشف · قيّم · شارك'));
});

test('dynamic English counters have singular, plural and decimal rating labels', () => {
  const t = require('../modules/lorefy-i18n.js').translate;
  for (const [ar,en] of [['1 عمل','1 work'],['2 أعمال','2 works'],['1 فصل','1 chapter'],
    ['2 فصول','2 chapters'],['1 مراجعة','1 review'],['0 مراجعات','0 reviews'],
    ['الشخصيات 4.5 من 5','Characters 4.5 out of 5']]) {
    assert.equal(t(ar,'en'),en);
    assert.equal(t(ar,'ar'),ar);
  }
});

test('split React counter nodes translate, follow count changes and restore Arabic', () => {
  const i18n = require('../modules/lorefy-i18n.js');
  const parent = {textContent:'1 عمل',closest:() => null};
  const node = {nodeValue:' عمل',parentElement:parent};
  i18n.textNode(node,'en');
  assert.equal(node.nodeValue,' work');
  parent.textContent = '2 work';
  i18n.textNode(node,'en');
  assert.equal(node.nodeValue,' works');
  i18n.textNode(node,'ar');
  assert.equal(node.nodeValue,' عمل');
});

test('share preview is not flex-shrunk into a cropped portrait', () => {
  const css = fs.readFileSync('styles/lorefy-share-studio.css','utf8');
  const rule = css.match(/\.lf-pref-share-sheet-preview,\s*\.lf-cb-share-preview\s*\{([^}]+)\}/);
  assert.ok(rule);
  assert.match(rule[1],/flex:\s*0 0 auto/);
});

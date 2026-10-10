const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
const growth = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');

test('favorite slots capture clicks before the legacy React editor', () => {
  assert.match(growth, /slot\.addEventListener\("click", openSlot, true\)/);
  assert.match(growth, /openProfileFavouriteWorksEditor\(index\)/);
});

test('a reused favorite slot opens its current position after catalog hydration', () => {
  const start = growth.indexOf('  function syncProfileFavouriteWorksControls()');
  const end = growth.indexOf('\n  function ', start + 10);
  const opened = [];
  function slot() {
    return { dataset: {}, handlers: {}, setAttribute() {},
      addEventListener(name, handler) { this.handlers[name] = handler; } };
  }
  const recycled = slot();
  const favorites = { dataset: {}, children: [recycled], classList: { toggle() {} },
    querySelector() { return {}; }, closest() { return page; } };
  const page = { querySelector() { return { querySelectorAll() { return []; } }; } };
  recycled.parentElement = favorites;
  const requested=[];
  const scope = { doc: { querySelector() { return favorites; } }, read:()=>['book'], uiText:ar=>ar,
    global:{LorefyCatalogLoader:{loadWorks(ids){requested.push(Array.from(ids));return Promise.resolve();}}},
    renameProfileFavouriteWorksHeading() {}, openProfileFavouriteWorksEditor(index) { opened.push(index); } };
  vm.runInNewContext(growth.slice(start, end), scope);
  scope.syncProfileFavouriteWorksControls();
  favorites.children = [slot(), slot(), recycled, slot()];
  favorites.children.forEach(node => { node.parentElement = favorites; });
  scope.syncProfileFavouriteWorksControls();
  recycled.handlers.click({ preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
  assert.deepEqual(opened, [2]);
  assert.deepEqual(requested, [['book']]);
});

test('favorite editor refreshes when the deferred catalog becomes ready', () => {
  const editor = growth.slice(growth.indexOf('  function openProfileFavouriteWorksEditor('), growth.indexOf('  function syncProfileFavouriteWorksControls('));
  assert.ok(editor.includes('global.addEventListener("lorefy:catalog-ready", refreshCatalog'));
  assert.ok(editor.includes('ov.page.isConnected'));
});

test('share heading fits a long work title without cutting its name', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-share-studio.js'), 'utf8');
  const start = source.indexOf('  function fitHeading(');
  const end = source.indexOf('  function canvasFile(', start);
  assert.ok(start >= 0);
  const ctx = {font:'', measureText(text) { return {width: text.length * parseInt(this.font.split(' ')[1]) * 0.55}; }};
  const context = {ctx, title:'Top 10 characters - HUNTER x HUNTER'};
  vm.runInNewContext(source.slice(start, end) + '\nfitHeading(ctx, title, 820);', context);
  assert.ok(ctx.measureText(context.title).width <= 820);
});

test('partial catalog boot preserves library and progress for unloaded works', () => {
  const values = new Map([
    ['lorefy.user.library.v2', JSON.stringify({late: 'reading'})],
    ['lorefy.user.progress.v2', JSON.stringify({late: {chapter: 42}})]
  ]);
  const start = app.indexOf('(function(){try{const i="lorefy.user.library.v2"');
  const end = app.indexOf(',SEED_FEED.forEach', start);
  assert.ok(start > 0 && end > start);
  vm.runInNewContext(app.slice(start, end), {
    localStorage: {getItem: k => values.get(k), setItem: (k,v) => values.set(k,v)},
    MANGA_BY_ID: new Map(), STATUS_OPTIONS: ['reading']
  });
  assert.deepEqual(JSON.parse(values.get('lorefy.user.library.v2')), {late: 'reading'});
  assert.deepEqual(JSON.parse(values.get('lorefy.user.progress.v2')), {late: {chapter: 42}});
});

test('work selection persists immediately and swaps duplicates without losing a slot', () => {
  const start = growth.indexOf('    function selectWork(id)');
  const end = growth.indexOf('    function render()', start);
  let saved;
  const context = {draft:['a','b','',''], activeSlot:0, render(){},
    write(key, value){ saved = JSON.parse(JSON.stringify(value)); },
    global: {dispatchEvent(){}}, CustomEvent: function(){}
  };
  vm.runInNewContext(growth.slice(start,end) + '\nselectWork("b");', context);
  assert.deepEqual(saved, ['b','a']);
});

test('character selection persists immediately before leaving the editor', () => {
  const start = growth.indexOf('    function chooseCandidate(ref)');
  const end = growth.indexOf('    function candidateMatches', start);
  let saved;
  const context = {draft:[null,null,null,null], activeSlot:0, selectionIndex:()=>-1,
    render(){}, syncProfileTopCharacters(){},
    setProfileTopCharacterSelection(value){ saved = JSON.parse(JSON.stringify(value)); }
  };
  vm.runInNewContext(growth.slice(start,end) + '\nchooseCandidate({workId:"hunter",characterKey:"gon"});', context);
  assert.deepEqual(saved, [{workId:'hunter',characterKey:'gon'},null,null,null]);
});

test('top-character search ranks matching work titles ahead of author matches', () => {
  const start = growth.indexOf('  function profileTopCharacterSearchWorks(');
  const end = growth.indexOf('  function profileRatedCharacterPortrait',start);
  const works = Array.from({length:20}, (_,i)=>({id:String(i),title:'Book '+i,author:'Erin Hunter'}));
  works.push({id:'hunter',title:'Hunter x Hunter',type:'Manga'});
  const context = {mlWorks:()=>works, profileTopCharacterSearchText:v=>String(v||'').toLowerCase().trim()};
  vm.runInNewContext(growth.slice(start,end)+'\nresult=profileTopCharacterSearchWorks("hunter");',context);
  assert.equal(context.result[0].id,'hunter');
});

test('favorite character searches normalize Arabic spelling and work author aliases', () => {
  const start=growth.indexOf('  function profileTopCharacterSearchText(');
  const end=growth.indexOf('  function profileRatedCharacterPortrait',start);
  const work={id:'arabic',title:'A work',auth:'Najib Mahfuz'};
  const window={LorefyCatalogData:require('../modules/lorefy-catalog-data.js')};
  const scope={window,global:window,mlWorks:()=>[work]};
  vm.runInNewContext(growth.slice(start,end),scope);
  assert.equal(scope.profileTopCharacterSearchText('إِبْن نـجيب'),'ابن نجيب');
  assert.equal(scope.profileTopCharacterSearchWorks('نجيب محفوظ')[0]?.id,'arabic');
});

test('background enrichment does not query manga APIs for books or western comics', async () => {
  const source = fs.readFileSync(path.join(root, 'uploads/files/lorefy-enrich.js'), 'utf8');
  const requests = [];
  const context = {localStorage:{getItem:()=>null,setItem(){}}, setTimeout:fn=>fn(),
    fetch:async (url,options)=>{requests.push(url);return {ok:true,json:async()=>({data:{Media:null}})};}
  };
  context.window = context;
  vm.runInNewContext(source,context);
  await context.LorefyEnrich.enrichVisible([
    {id:'book',title:'Pride and Prejudice',type:'Novel'},
    {id:'comic',title:'Batman',type:'Comics'}
  ]);
  assert.equal(requests.length,0);
});

test('enrichment uses the data gateway and pauses after provider throttling', async () => {
  const source = fs.readFileSync(path.join(root, 'uploads/files/lorefy-enrich.js'), 'utf8');
  const requests = [];
  const context = {localStorage:{getItem:()=>null,setItem(){}}, setTimeout:fn=>fn(), clearTimeout(){}, AbortController,
    LorefyDataProxy:{catalogUrl:()=> 'https://gateway.test/catalog-anilist'},
    fetch:async url=>{requests.push(url);return {ok:false,status:429};}
  };
  context.window = context;
  vm.runInNewContext(source,context);
  await context.LorefyEnrich.enrichVisible([
    {id:'1',title:'One Piece',type:'Manga'},
    {id:'2',title:'Naruto',type:'Manga'}
  ]);
  assert.deepEqual(requests,['https://gateway.test/catalog-anilist']);
});

test('native image sharing sends the file without an internal capacitor URL', async () => {
  const share = fs.readFileSync(path.join(root,'modules/lorefy-share-studio.js'),'utf8');
  const start = share.indexOf('  async function nativeFileShare(');
  const end = share.indexOf('  function icon(',start);
  let sent;
  const context = {isNativeRuntime:()=>true,
    getCapacitorPlugin:()=>({share:async value=>{sent=value;}}),
    persistNativeShareFile:async()=>({uri:'file:///documents/share.png'}),
    sanitizeUrl:()=> 'capacitor://localhost/index.html',navigator:{}};
  vm.runInNewContext(share.slice(start,end),context);
  await context.nativeFileShare({name:'share.png'},'Title','Text');
  assert.equal(sent.url,undefined);
  assert.deepEqual(Array.from(sent.files),['file:///documents/share.png']);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
const metrics = require('../modules/lorefy-reading-metrics');
const READING = 'أقرأ حالياً';
const homeStart = source.indexOf('ir=()=>');
const home = source.slice(homeStart, homeStart + 30000);
const selection = home.match(/pe=(Object\.entries\(b\).*?\.filter\(Boolean\)),w=pe\.slice\(0,4\)/);
assert.ok(selection, 'find the real Home continuation selection, not the prefetch helper');
const currentSelection = source.match(/Hn=(Object\.entries\(b\).*?\.slice\(0,6\)),Tr=/);
assert.ok(currentSelection, 'find the current Home owner-derived work set');
const helpers = source.slice(source.indexOf('normalizeProgress='), source.indexOf(',firstPositiveNumber='));
function select(library, progress, works) {
  const scope = {b:library, le:progress, STATUS_READING:READING,
    window:{LorefyReadingMetrics:metrics}, workById:id=>works.find(work=>work.id===id)};
  vm.runInNewContext('const '+helpers+';this.rows=('+selection[1]+').slice(0,4);', scope);
  const fallback = Array.from(scope.rows, row=>row.id);
  const current = {...scope};
  vm.runInNewContext('const '+helpers+';this.rows=('+currentSelection[1]+').slice(0,4);', current);
  assert.deepEqual(Array.from(current.rows, row=>row.id), fallback, 'current and fallback selectors agree');
  return fallback;
}

test('Home looks up each active work checkpoint by work id, preserving all saved units', () => {
  const works = ['serial','book','volume'].map(id=>({id}));
  assert.deepEqual(select({serial:READING,book:READING,volume:READING},
    {serial:{chapter:12},book:{page:38},volume:{volume:2}},works), ['serial','book','volume']);
});

test('Home excludes paused, completed, dropped and wishlist works even with saved progress', () => {
  const library = {active:READING,paused:'توقف',done:'تم القراءة',dropped:'توقف نهائي',later:'قائمة الأمنيات'};
  const works = Object.keys(library).map(id=>({id}));
  assert.deepEqual(select(library,Object.fromEntries(works.map(work=>[work.id,{chapter:5}])),works), ['active']);
});

test('missing and zero checkpoints cannot borrow progress stored under a status string', () => {
  const works = [{id:'missing'},{id:'zero'},{id:'active'}];
  assert.deepEqual(select({missing:READING,zero:READING,active:READING},
    {[READING]:{chapter:90},zero:{chapter:0,ch:55},active:{page:8}},works), ['active']);
});

test('Home bounds cards to four existing works without changing source data', () => {
  const works = Array.from({length:7}, (_,i)=>({id:'w'+i}));
  const library = {unavailable:READING,...Object.fromEntries(works.map(w=>[w.id,READING]))};
  const progress = {unavailable:{chapter:2},...Object.fromEntries(works.map(w=>[w.id,{chapter:2}]))};
  const before = JSON.stringify({works,library,progress});
  assert.deepEqual(select(library,progress,works), ['w0','w1','w2','w3']);
  assert.equal(JSON.stringify({works,library,progress}), before);
});

test('Home selection cannot reuse a different account progress map', () => {
  const library = {book:READING}, works = [{id:'book'}];
  assert.deepEqual(select(library,{book:{page:20}},works), ['book']);
  assert.deepEqual(select(library,{},works), []);
  assert.deepEqual(select(library,{book:{page:0}},works), []);
});

test('the current social Home calls the continuation section before its community feed', () => {
  const currentHome = source.slice(source.lastIndexOf('lf-home-screen'));
  assert.match(currentHome, /continueReadingSection\(\),Tn\?\$r\(\):sr\(\)/);
  assert.ok(source.includes('continueReadingSection=()=>'), 'shared section has a real renderer');
});

function renderSection(items, language = 'en') {
  const start = source.indexOf('continueReadingSection=()=>');
  const end = source.indexOf(',ir=()=>', start);
  assert.ok(start >= 0 && end > start);
  const opens = [], scope = {Hn:items, W:language, window:{}, C:{text:'black',accent:'teal'},
    React:{createElement:(tag, props, ...children)=>({tag,props:props || {},children})},
    uiText:(lang, ar, en)=>lang === 'en' ? en : ar, nt:route=>opens.push(route),
    T:work=>opens.push(work.id), je:work=>({page:work.page || 0}), progressPercent:()=>20,
    progressSummary:(work, progress)=>progress.page+' pages', legalCoverOf:()=>'', I:()=>'', R() {}, PBar() {}};
  vm.runInNewContext('const '+source.slice(start,end)+';this.tree=continueReadingSection();',scope);
  return {tree:scope.tree,opens};
}
const nodes = tree => tree && typeof tree === 'object' ? [tree,...tree.children.flat(Infinity).flatMap(nodes)] : [];

test('current Home continuation is bounded, keyboard accessible and opens the selected work', () => {
  for (const language of ['en','ar']) {
    const {tree,opens} = renderSection(Array.from({length:6},(_,i)=>({id:'w'+i,title:'Work '+i,page:38})),language);
    const cards = nodes(tree).filter(node=>node.props.className === 'lf-continue-card');
    assert.equal(cards.length,4);
    for (const card of cards) {
      assert.equal(card.tag,'button'); assert.equal(card.props.type,'button');
      assert.ok(card.props['aria-label'].includes('Work'));
    }
    cards[1].props.onClick(); assert.deepEqual(opens,['w1']);
    assert.ok(nodes(tree).some(node=>node.tag === 'small' && node.children.includes('38 pages')));
  }
});

test('no eligible continuation produces no empty or fabricated Home section', () => {
  assert.equal(renderSection([]).tree,false);
});

test('the continuation card reports its saved stop point without inventing a percentage', () => {
  const {tree} = renderSection([{id:'ongoing',title:'An ongoing work',page:38}]);
  assert.ok(nodes(tree).some(node=>node.tag === 'small' && node.children.includes('38 pages')));
  assert.ok(!JSON.stringify(tree).includes('%'));
});

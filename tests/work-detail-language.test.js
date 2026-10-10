const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync(require('node:path').join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
const i18n = require('../modules/lorefy-i18n.js');

function helper(name, next, scope) {
  const start = app.indexOf(name + '='), end = app.indexOf(',' + next + '=', start);
  assert.ok(start >= 0 && end > start, name);
  return vm.runInNewContext('(' + app.slice(start + name.length + 1, end) + ')', scope);
}
function render(lang, options = {}) {
  const calls = [];
  const scope = { W: lang, m: {id:'work', type:'مانجا', title:'عنوان عربي', auth:'كاتب عربي', ch:1},
    V: options.tab || 'friends', FRIENDS: [{id:'reader',name:'قارئ عربي'}], M:[], SEED_FEED:[],
    b: options.saved ? {work:'أقرأ حالياً'} : {}, SC:{}, C:{}, Ke:[], L:false,
    currentUILang:() => 'ar', uiText:(l,ar,en) => l === 'en' ? en : ar,
    getScoreFields:() => [{k:'story',l:'القصة'}], je:() => ({chapter:2,volume:1,page:3}),
    normalizeProgress:p => p, progressPercent:() => 0, progressTotal:() => 100,
    isOngoingWork:() => true, legalCoverOf:() => '', I:() => '', _:() => 4,
    ratingSourceLabel:() => '', synopsisFor:() => 'نص المصدر العربي', recommendationEligible:() => true,
    workById:() => null, T(){}, R(){}, er(){}, xe(){}, ot(){}, D(){}, we:key => calls.push(key),
    dt:value => calls.push(value), no(){}, ct:{}, pt:{}, ht(){}, ro(){}, io(){}, Se:value => calls.push(value),
    window:{LorefyI18n:i18n, LorefyCatalogIdentity:{relatedWorks:() => []},
      LorefyWorkRelations:{Section:() => null}, LorefyDesignSystem:{subtitle:() => ''},
      LorefyWorkIdentity:() => null, LorefySavedReviewDraft:() => ({rating:3,text:'keep',moment:'moment'})},
    React:{createElement:(type,props,...children) => ({type,props:props || {},children})}};
  for (const icon of ['ChevronRight','ChevronLeft','Share2','Bell','BookOpen','ImageIcon','Users','Globe','BookMarked','SBadge','PBar','Av','Stars']) scope[icon] = icon;
  scope.progressSummary = helper('progressSummary','completedProgressFor',scope);
  const start = app.indexOf('ar=()=>'), end = app.indexOf(',catalogSearchStatus=',start);
  vm.runInNewContext('const ' + app.slice(start,end) + ';this.render = ar;',scope);
  const nodes = [];
  function visit(node) { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== 'object') return;
    nodes.push(node); node.children.forEach(visit); }
  visit(scope.render());
  const text = nodes.flatMap(node => node.children.filter(child => typeof child === 'string')).join('|');
  return {nodes,text,calls,scope};
}
test('work commands and accessibility labels render in English without a DOM translation pass', () => {
  const {nodes,text} = render('en', {tab:'reviews'});
  assert.ok(text.includes('Write a review'),text);
  assert.ok(text.includes('Add to library'));
  assert.ok(text.includes('No reviews yet'));
  assert.ok(text.includes('Story'));
  assert.ok(nodes.some(node => node.props['aria-label'] === 'Share work'));
  assert.ok(nodes.some(node => node.props.title === 'Change cover'));
});
test('saved status and split progress units use the render language rather than the stale document language', () => {
  const {text} = render('en', {saved:true});
  assert.ok(text.includes('Reading'),text);
  assert.ok(text.includes('2 chapters') && text.includes('1 volume') && text.includes('3 pages'),text);
});
test('Arabic labels and source prose survive an English to Arabic render transition', () => {
  assert.ok(render('en').text.includes('نص المصدر العربي'));
  const {text,nodes} = render('ar');
  assert.ok(text.includes('اكتب مراجعة'));
  assert.ok(text.includes('قارئ عربي'));
  assert.ok(nodes.some(node => node.props['aria-label'] === 'مشاركة العمل'));
});
test('localized commands preserve the review draft action and reader tab keys', () => {
  const {nodes,calls,scope} = render('en');
  nodes.find(node => node.props['data-lorefy-action'] === 'write-review').props.onClick();
  assert.deepEqual(calls,[3,true]);
  assert.equal(scope.ct.current,'keep');
  const reviews = nodes.find(node => node.type === 'button' && node.children.includes('Reviews'));
  assert.ok(reviews);
  reviews.props.onClick();
  assert.equal(calls.at(-1),'reviews');
});

test('status badges render their provided language while retaining Arabic persistence keys', () => {
  const scope = {SC:{},C:{},W:'ar',window:{LorefyI18n:i18n},
    React:{createElement:(type,props,...children) => ({children})}};
  const badge = helper('SBadge','PBar',scope);
  for (const [status,label] of [['أقرأ حالياً','Reading'],['تم القراءة','Completed'],['قائمة الأمنيات','Wishlist'],['توقف','Paused'],['توقف نهائي','Dropped']]) {
    assert.equal(badge({status,language:'en'}).children[0],label);
    assert.equal(badge({status,language:'ar'}).children[0],status);
  }
});

test('shared status badges without a language prop use the document fallback, not App-local state', () => {
  const badge=helper('SBadge','PBar',{SC:{},C:{},currentUILang:()=> 'en',window:{LorefyI18n:i18n},
    React:{createElement:(type,props,...children)=>({children})}});
  assert.equal(badge({status:'تم القراءة'}).children[0],'Completed');
});

function search(lang, ready = true, count = 2) {
  const calls = [];
  const scope = {W:lang,currentUILang:() => 'ar',uiText:(l,ar,en) => l === 'en' ? en : ar,
    re:'',fe:'الكل',he:'rating',it:1,SEARCH_CACHE:{},C:{},TYPES:[],b:{},
    MANGA:Array.from({length:count},(_,i)=>({id:String(i),title:'عنوان عربي',auth:'كاتب عربي',type:'مانجا',_searchAlternates:[{},{}]})),
    ratingConfidenceScore:()=>4,metadataLine:() => 'كاتب عربي',legalCoverOf:()=>'',I:()=>'',_:()=>4,R(){},
    T(){},ot:work=>calls.push(work.id),Pe:value=>calls.push(value),STATUS_WISHLIST:'قائمة الأمنيات',
    Search:'Search',SearchBox:'SearchBox',TBadge:'TBadge',SBadge:'SBadge',Stars:'Stars',Check:'Check',Plus:'Plus',
    window:{LorefyCatalogLoader:{state:()=>({ready})},LorefyCatalogData:{sortRanked:items=>items}},
    React:{createElement:(type,props,...children)=>({type,props:props||{},children})}};
  const start = app.indexOf('catalogSearchStatus='),end = app.indexOf(',dr=()=>',start);
  vm.runInNewContext('const '+app.slice(start,end)+';this.render=lr;this.status=catalogSearchStatus;',scope);
  const nodes=[];
  function visit(node) { if(Array.isArray(node)) return node.forEach(visit);if(!node||typeof node!=='object')return;
    nodes.push(node);node.children.forEach(visit); }
  visit(scope.render());
  return {scope,nodes,calls,text:nodes.flatMap(node=>node.children.filter(c=>typeof c==='string')).join('|')};
}
test('search result counts localize explicit language and distinguish a partial index from a ready catalog', () => {
  const {scope}=search('en',false);
  assert.equal(scope.status(1,'en'),'1 result available now · Indexing the rest of the library');
  assert.equal(scope.status(2,'en'),'2 results available now · Indexing the rest of the library');
  assert.equal(search('en').scope.status(1,'en'),'1 result');
  assert.match(scope.status(2,'ar'),/جارٍ فهرسة/);
});
test('search controls and edition picker labels are English on the first render without translating titles', () => {
  const {nodes,text}=search('en');
  assert.ok(text.includes('Search') && text.includes('Show more'),text);
  assert.ok(text.includes('editions · Choose work'),text);
  assert.ok(text.includes('عنوان عربي') && text.includes('كاتب عربي'));
  assert.ok(nodes.some(n=>n.props.placeholder==='Search by title or author...'));
  assert.ok(nodes.some(n=>n.props['aria-label']==='Add عنوان عربي to library'));
});
test('localized search keeps library add and pagination actions intact', () => {
  const {nodes,calls}=search('en');
  const add = nodes.find(n=>n.props['aria-label']==='Add عنوان عربي to library');
  assert.ok(add,'Missing English library action');
  add.props.onClick({stopPropagation(){}});
  nodes.find(n=>n.type==='button'&&n.children.some(c=>typeof c==='string'&&c.includes('Show more'))).props.onClick();
  assert.equal(calls[0],'0');
  assert.equal(calls[1](1),121);
  assert.ok(search('ar',true,0).text.includes('لا توجد نتائج'));
});

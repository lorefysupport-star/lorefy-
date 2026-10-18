const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../modules/lorefy-profile-sections.js');
const api = fs.existsSync(file) ? require(file) : {};
function storage(owner = 'a') {
  const values = new Map([['lorefy.activeUser.v1', owner]]);
  return { getItem:key => values.get(key) || null, setItem:(key,value) => values.set(key,String(value)) };
}
test('ranked folders preserve order, deduplicate entries and sanitize artwork', () => {
  assert.equal(typeof api.normalizeFolders, 'function');
  const rows = api.normalizeFolders([{id:'best',name:' Best ten ',kind:'characters',isPublic:true,
    items:[{id:'zoro',name:'Zoro',workId:'one-piece',image:'https://example.com/z.jpg'},
      {id:'zoro',name:'Duplicate',workId:'one-piece'}, {id:'sanji',name:'Sanji',image:'javascript:bad'}]}]);
  assert.equal(rows[0].name,'Best ten');
  assert.deepEqual(rows[0].items.map(item=>item.name),['Zoro','Sanji']);
  assert.equal(rows[0].items[1].image,'');
  assert.equal(rows[0].kind,'characters');
  assert.equal(api.normalizeFolders(null).length,0);
  assert.equal(api.normalizeFolders([{name:''}]).length,0);
});
test('folder mutations are account scoped, durable and do not overwrite other folders', () => {
  assert.equal(typeof api.saveFolder, 'function');
  const store=storage();
  api.saveFolder(store,'a',{id:'best',name:'Best',kind:'characters',items:[{id:'z',name:'Zoro'}],isPublic:true});
  api.saveFolder(store,'a',{id:'worst',name:'Worst',kind:'characters',items:[{id:'s',name:'Spandam'}],isPublic:false});
  assert.equal(api.foldersFor({},true,store).length,2);
  assert.throws(()=>api.saveFolder(store,'b',{id:'bad',name:'Other account'}),/account/i);
  api.deleteFolder(store,'a','best');
  assert.deepEqual(api.foldersFor({},true,store).map(row=>row.id),['worst']);
});
test('visitor folders never borrow viewer data and filter private lists', () => {
  assert.equal(typeof api.foldersFor, 'function');
  const store=storage();
  api.saveFolder(store,'a',{id:'mine',name:'Viewer list',isPublic:true});
  assert.deepEqual(api.foldersFor({id:'b'},false,store),[]);
  assert.deepEqual(api.foldersFor({id:'b',profile_lists:[{id:'one',name:'Owner list',isPublic:true},{id:'hidden',name:'Private',isPublic:false}]},false,store).map(row=>row.id),['one']);
});
test('reordering is immutable, bounded and works for best and worst lists alike', () => {
  assert.equal(typeof api.moveItem, 'function');
  const items=[{id:'a'},{id:'b'},{id:'c'}];
  assert.deepEqual(api.moveItem(items,2,-1).map(row=>row.id),['a','c','b']);
  assert.deepEqual(api.moveItem(items,0,-1),items);
  assert.deepEqual(items.map(row=>row.id),['a','b','c']);
});
test('profile post selection uses owner id, excludes replies and deleted rows', () => {
  assert.equal(typeof api.postsFor, 'function');
  const rows=[{id:'1',user_id:'a',created_at:'2026-01-01'},
    {id:'2',user_id:'b',profile:{username:'same'},created_at:'2026-01-02'},
    {id:'3',user_id:'a',parent_id:'1'},{id:'4',user_id:'a',is_deleted:true},
    {id:'5',user_id:'a',created_at:'2026-01-03'}];
  assert.deepEqual(api.postsFor(rows,{id:'a',username:'same'}).map(row=>row.id),['5','1']);
});
test('tabs have complete Arabic and English labels', () => {
  assert.equal(typeof api.labels, 'function');
  assert.deepEqual(api.labels('ar').tabs,['الرئيسية','القوائم','التغريدات']);
  assert.deepEqual(api.labels('en').tabs,['Overview','Lists','Posts']);
  for(const value of Object.values(api.labels('en')).flat()) assert.doesNotMatch(value,/[\u0600-\u06ff]/);
});
test('public snapshot projects lists and degrades safely before database activation', async () => {
  const vm=require('node:vm'), window={};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../backend/lorefy-backend.js'),'utf8'),{window,console,URL,setTimeout,clearTimeout});
  const b=window.LorefyBackend, owner='11111111-1111-4111-8111-111111111111';
  b.mode='live'; b.user={id:owner}; b.getSession=async()=>({userId:owner}); b._storageMediaUrl=async()=> '';
  let missing=false;
  b.client={rpc:async(name,args)=>{
    assert.equal(args.profile_ref,owner);
    if(name==='get_public_profile_social')return {data:{id:owner}};
    if(name==='get_public_profile_lists')return missing?{error:{code:'PGRST202'}}:{data:[{id:'best',name:'Best',isPublic:true}]};
    return {data:{}};
  },from:()=>({select:()=>({eq:()=>({is:()=>({eq:async()=>({count:0})})})})})};
  assert.equal((await b.getPublicProfile(owner)).profile_lists[0].id,'best');
  missing=true;
  const result=await b.getPublicProfile(owner);
  assert.equal(result.id,owner);
  assert.equal(result.profile_lists_error,true);
});
test('profile posts fetch a reader-scoped page rather than the loaded community feed', () => {
  const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-community.js'),'utf8');
  assert.match(source,/readProfilePosts:readProfilePosts/);
  assert.match(source,/listCommunityPosts\(\{ userId:profile\.id, limit:50, before:before \|\| null \}\)/);
});
test('owner post metric finds translated statistics on a fresh English startup', () => {
  const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-community.js'),'utf8');
  const fn=require('node:vm').runInNewContext('('+source.slice(source.indexOf('function metricLeaf('),source.indexOf('function metricItem(')).trim()+')');
  const leaf={textContent:'Review'};
  const page={querySelectorAll:()=>[leaf]};
  assert.equal(fn(page,['مراجعة','Review']),leaf);
  assert.match(source,/metricLeaf\(page, \["مراجعة", "Review", "Reviews"\]\)/);
  assert.match(source,/metricLeaf\(page, \["مكتملة", "مكتمل", "Completed"\]\)/);
});
test('section headings use themed ink rather than legacy profile heading colors', () => {
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-profile-sections.css'),'utf8');
  assert.match(css,/\.lf-profile-section-panel \.lf-profile-section-head h2\s*\{\s*color:\s*var\(--ui-ink\) !important;/);
});
test('profile header keeps reading metrics and removes redundant social shortcuts in both languages', () => {
  const source=fs.readFileSync(file,'utf8');
  const start=source.indexOf('function compactMetrics(');
  assert.notEqual(start,-1);
  const fn=require('node:vm').runInNewContext('('+source.slice(start,source.indexOf('function sync()',start)).trim()+')');
  function metric(label,stat) {
    const classes=new Set();
    return {classes,getAttribute:()=>stat||null,querySelectorAll:()=>[{textContent:label}],
      classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}};
  }
  for(const names of [['مراجعة','منشور','مكتملة','فصل','ساعة قراءة','النوع المفضل'],['Review','Post','Completed','chapters','reading hours','Favorite type']]) {
    const rows=names.map(name=>metric(name));
    const properties=new Map(),classes=new Set();
    const grid={children:rows,classList:{add:name=>classes.add(name)},
      style:{getPropertyValue:key=>properties.get(key)||'',setProperty:(key,value)=>properties.set(key,value)}};
    fn({querySelectorAll:()=>[grid]});
    assert.deepEqual(rows.map(row=>row.classes.has('is-profile-social-stat')),[true,true,false,false,false,false]);
    assert.equal(properties.get('--profile-metric-count'),'4');
    assert.ok(classes.has('lf-profile-reading-metrics'));
  }
});
test('profile header keeps its adaptive metrics and the shared selected-tab surface', () => {
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-profile-sections.css'),'utf8');
  assert.match(css,/repeat\(var\(--profile-metric-count\),\s*minmax\(0,1fr\)\)/);
  assert.match(css,/\.is-profile-social-stat\s*\{\s*display:\s*none !important/);
  const shared=fs.readFileSync(path.join(__dirname,'../styles/lorefy-design-system.css'),'utf8');
  assert.match(shared,/\.lf-profile-section-tabs > button\[aria-selected='true'\]\s*\{[^}]*background:\s*var\(--ui-surface\)/s);
});

test('profile Posts combines reviews and posts chronologically without borrowing another reader or duplicating a review',()=>{
 const posts=[{id:'p',user_id:'a',created_at:'2026-10-13T10:00:00Z'},{id:'reply',user_id:'a',parent_id:'p'}];
 const reviews=[{id:'r',userId:'me',ts:Date.parse('2026-10-13T11:00:00Z')},{id:'r',userId:'me',ts:Date.now()},{id:'other',userId:'b',ts:Date.now()}];
 assert.deepEqual(api.profileEntries(posts,reviews,{id:'a'},true).map(e=>e.id),['review:r','post:p']);
 assert.deepEqual(api.profileEntries(posts,reviews,{id:'b'},false).map(e=>e.id),['review:other']);
 assert.deepEqual(api.profileEntries(posts,reviews,{id:'c'},false),[]);
});

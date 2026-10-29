const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-growth-features.js'),'utf8');
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return{promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r));};
function harness(){
  const nodes=[],values=new Map([['lorefy.activeUser.v1','a'],['lorefy.user.library.v2',JSON.stringify({keep:'paused'})]]),writes=[],events=[],notices=[],fileReads=[];
  const works=[{id:'first',title:'First'},{id:'second',title:'Second'}],hooks={};
  function el(tag,attrs={},children=[]){const n={tag,attrs,children:children.filter(Boolean),handlers:{},value:'',disabled:false,hidden:false,isConnected:true,inert:false,
    appendChild(c){if(c)this.children.push(c);},addEventListener(k,f){this.handlers[k]=f;},classList:{add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},focus(){},
    querySelectorAll(){return[];},click(){if(this.handlers.click&&!this.disabled)return this.handlers.click();}};
    let text=attrs.text||'';Object.defineProperty(n,'textContent',{get:()=>text,set:v=>{text=String(v);n.children=[];}});
    nodes.push(n);return n;}
  const page=el('div'),body=el('div'),storage={getItem:k=>values.get(k)||null,setItem(k,v){if(hooks.restore)hooks.restore(k,v);values.set(k,String(v));},removeItem:k=>values.delete(k)};
  const global={LorefyI18n:require('../modules/lorefy-i18n'),localStorage:storage,LorefyBackend:{mode:'live',user:{id:'a'},client:{},_communityEpoch:1},
    dispatchEvent:e=>events.push(e),CustomEvent:function(type,options){this.type=type;this.detail=options.detail;}};
  const scope={doc:{documentElement:{lang:'en'}},global,el,ovOpen:()=>({page,body,close(){page.inert=true;page.isConnected=false;}}),
    read:(k,fallback)=>values.has(k)?JSON.parse(values.get(k)):fallback,
    write:(k,v)=>{writes.push(k);if(hooks.write&&hooks.write(k,v)===false)return false;values.set(k,JSON.stringify(v));return true;},
    uiText:(ar,en)=>en,toastSafe:t=>notices.push(t),mlTitleOf:w=>w.title,mlResultCover:w=>el('img',{alt:w.title}),
    imBuildMaps:()=>({byTitle:new Map(works.map(w=>[w.title.toLowerCase(),[w]]))}),imNorm:s=>s.toLowerCase(),
    imFindByTitle:s=>works.find(w=>w.title===s),imReadFileText:(file,cb,fail)=>fileReads.push({file,cb,fail}),
    imParseMalXml:text=>({rows:[{work:works[text==='second'?1:0],status:'reading',chapters:4,score:4.25}],misses:0}),
    imParseGoodreads:text=>({rows:[{work:works[text==='second'?1:0],status:'reading',chapters:4,score:4.25}],misses:0}),
    imParseGenericCsv:text=>({rows:[{work:works[text==='second'?1:0],status:'reading',chapters:4,score:4.25}],misses:0}),
    imFetchAniList:name=>hooks.anilist(name),imFetchKitsu:name=>hooks.kitsu(name),
    IM_DONE:'done',IM_READING:'reading',IM_WISH:'wish',IM_PAUSED:'paused',IM_DROPPED:'dropped'};
  vm.runInNewContext(source.slice(source.indexOf('  function imApply('),source.indexOf('  function imStatusFromAL(')),scope);
  const start=source.indexOf('  function openImport()');
  vm.runInNewContext(source.slice(start,source.indexOf('  /* ── profile character taste',start)),scope);scope.openImport();
  function find(cls){return nodes.filter(n=>String(n.attrs.class||'').split(' ').includes(cls)).at(-1);}
  return{scope,global,page,nodes,values,writes,events,notices,fileReads,hooks,works,find,
    preview:()=>find('lf-im-preview'),confirm:()=>find('lf-im-confirm'),
    async network(service,index=0){const input=nodes.filter(n=>n.tag==='input'&&n.attrs.type==='text')[service==='anilist'?0:1];input.value='qa-reader';
      const button=nodes.find(n=>n.tag==='section'&&n.children.some(c=>c.tag==='div'&&c.children.some(x=>x===input||x.children.includes(input)))).children.find(c=>c.tag==='div').children[1];
      button.click();await flush();return button;},
    file(index=0){const n=nodes.filter(n=>n.tag==='input'&&n.attrs.type==='file')[index];n.files=[{name:'qa.csv'}];n.handlers.change();return fileReads.at(-1);},
    paste(title){find('lf-im-paste').value=title;find('lf-im-go-wide').click();},
    transition(kind='account'){const b=global.LorefyBackend;
      if(kind==='account'){b.user={id:'b'};values.set('lorefy.activeUser.v1','b');values.set('lorefy.user.library.v2',JSON.stringify({bKeep:'reading'}));}
      if(kind==='client')b.client={};
      if(kind==='epoch')b._communityEpoch++;
      if(kind==='local-owner')values.set('lorefy.activeUser.v1','b');
      if(kind==='mode')b.mode='demo';
      if(kind==='backend')global.LorefyBackend={...b};
      if(kind==='closed')page.isConnected=false;
    }};
}
const result=(h,index)=>({rows:[{work:h.works[index],status:'reading',chapters:4,score:4.25}],misses:0});
for(const kind of ['account','client','epoch','local-owner','mode','backend','closed'])test('import preview confirmation cannot write after '+kind,()=>{
  const h=harness();h.paste('First');const confirm=h.confirm();assert.ok(confirm);
  h.transition(kind);confirm.click();assert.equal(h.writes.length,0);assert.equal(h.events.length,0);assert.ok(!h.find('lf-im-summary'));
});
for(const service of ['anilist','kitsu'])test(service+': a response after account change cannot paint matches',async()=>{
  const h=harness(),gate=deferred();h.hooks[service]=()=>gate.promise;
  await h.network(service);h.transition();gate.resolve(result(h,0));await flush();
  assert.ok(!h.preview());assert.equal(h.writes.length,0);
});
for(const index of [0,1,2])test('file '+index+': delayed reading after account change cannot paint matches',async()=>{
  const h=harness(),read=h.file(index);h.transition();read.cb('first');await flush();assert.ok(!h.preview());assert.equal(h.writes.length,0);
});
test('a closed import ignores a late file error',()=>{const h=harness(),read=h.file();h.transition('closed');read.fail('old file error');assert.ok(!h.find('lf-im-error'));});
test('a response from an older provider cannot replace a newer provider preview',async()=>{
  const h=harness(),older=deferred(),newer=deferred();h.hooks.anilist=()=>older.promise;h.hooks.kitsu=()=>newer.promise;
  await h.network('anilist');await h.network('kitsu');newer.resolve(result(h,1));await flush();
  older.resolve(result(h,0));await flush();h.confirm().click();
  const lib=JSON.parse(h.values.get('lorefy.user.library.v2'));assert.equal(lib.second,'reading');assert.equal(lib.first,undefined);
});
test('an older file failure cannot erase a newer pasted preview',()=>{
  const h=harness(),read=h.file();h.paste('Second');read.fail('old file error');assert.ok(!h.find('lf-im-error'));
  h.confirm().click();assert.equal(JSON.parse(h.values.get('lorefy.user.library.v2')).second,'done');
});
test('an earlier preview confirmation is invalid as soon as a new request begins',async()=>{
  const h=harness(),gate=deferred();h.paste('First');const oldConfirm=h.confirm();h.hooks.anilist=()=>gate.promise;
  await h.network('anilist');oldConfirm.click();assert.equal(h.writes.length,0);
  gate.resolve(result(h,1));await flush();h.confirm().click();assert.equal(JSON.parse(h.values.get('lorefy.user.library.v2')).second,'reading');
});
test('failure permits retry; a current successful import is explicit and preserves existing progress and fractional ratings',async()=>{
  const h=harness();let attempts=0;h.hooks.anilist=async()=>{if(++attempts===1)throw Error('provider offline');return result(h,0);};
  const button=await h.network('anilist');assert.equal(button.disabled,false);assert.equal(h.writes.length,0);assert.ok(h.find('lf-im-error'));
  await h.network('anilist');assert.equal(h.writes.length,0);h.confirm().click();
  const lib=JSON.parse(h.values.get('lorefy.user.library.v2')),prog=JSON.parse(h.values.get('lorefy.user.progress.v2')),reviews=JSON.parse(h.values.get('lorefy.user.privateReviews.v2'));
  assert.equal(lib.keep,'paused');assert.equal(lib.first,'reading');assert.equal(prog.first.chapter,4);assert.equal(reviews[0].r,4.25);
  assert.equal(h.events.length,3);assert.ok(h.find('lf-im-summary'));h.confirm().click();assert.equal(h.events.length,3);
});

test('the newest file read wins even when an older successful read finishes last',()=>{
  const h=harness(),older=h.file(0),newer=h.file(1);newer.cb('second');older.cb('first');h.confirm().click();
  const lib=JSON.parse(h.values.get('lorefy.user.library.v2'));assert.equal(lib.second,'reading');assert.equal(lib.first,undefined);
});
test('an older success does not hide an error from the newest file attempt',()=>{
  const h=harness(),older=h.file(0),newer=h.file(1);newer.fail('newest failure');older.cb('first');
  assert.equal(h.find('lf-im-error').attrs.text,'newest failure');assert.ok(!h.preview());assert.equal(h.writes.length,0);
});
test('an old import window cannot start a provider request under the next account',async()=>{
  const h=harness();let calls=0;h.hooks.anilist=async()=>{calls++;return result(h,0);};h.transition();
  await h.network('anilist');assert.equal(calls,0);assert.equal(h.writes.length,0);assert.equal(h.page.isConnected,false);
});

test('a failed import save retains the preview, reports the failure and permits an explicit retry',()=>{
  const h=harness(),file=h.file(0);file.cb('first');let calls=0;h.hooks.write=()=>++calls!==2;
  const confirm=h.confirm();confirm.click();assert.equal(h.events.length,0);assert.ok(!h.find('lf-im-summary'));
  assert.equal(confirm.disabled,false);assert.equal(h.find('lf-im-save-error').attrs.role,'alert');
  assert.ok(h.find('lf-im-save-error').textContent.includes('Unable to save'));
  assert.deepEqual(JSON.parse(h.values.get('lorefy.user.library.v2')),{keep:'paused'});
  h.hooks.write=null;confirm.click();assert.ok(h.find('lf-im-summary'));assert.equal(h.events.length,3);
  assert.equal(JSON.parse(h.values.get('lorefy.user.library.v2')).first,'reading');
});
test('a partial storage rollback requires library review and cannot offer a misleading immediate retry',()=>{
  const h=harness(),original=h.values.get('lorefy.user.library.v2'),file=h.file(0);file.cb('first');let calls=0,failed=false;
  h.hooks.write=()=>{if(++calls===2){failed=true;return false;}return true;};
  h.hooks.restore=(k,v)=>{if(failed&&k==='lorefy.user.library.v2'&&v===original)throw Error('restore unavailable');};
  h.confirm().click();assert.equal(h.events.length,0);assert.ok(!h.find('lf-im-summary'));
  assert.equal(h.confirm().disabled,true);assert.ok(h.find('lf-im-save-error').textContent.includes('partly saved'));
});

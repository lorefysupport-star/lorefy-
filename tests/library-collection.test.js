const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

function harness(count=1000,owner='library-owner') {
  const state=[],memos=[],refs=[],effects=[],pending=new Map(),listeners=new Map();
  let si,mi,ri,ei,model,resolves=0,matches=0,progressReads=0;
  const catalog=Array.from({length:count},(_,i)=>({id:'work-'+i,title:'Story '+String(i).padStart(4,'0')}));
  const page={scrollTop:0};
  const React={createElement:(type,props,...children)=>({type,props:props||{},children}),
    useState(initial){const i=si++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],v=>state[i]=typeof v==='function'?v(state[i]):v];},
    useMemo(fn,deps){const i=mi++,old=memos[i];if(!old||deps.some((x,n)=>x!==old.deps[n]))memos[i]={deps,value:fn()};return memos[i].value;},
    useRef(value){const i=ri++;return refs[i]||(refs[i]={current:value});},
    useEffect(fn,deps){const i=ei++,old=effects[i];if(!old||deps.some((x,n)=>x!==old.deps[n])){pending.set(i,fn);effects[i]={deps,cleanup:old&&old.cleanup};}},
    useLayoutEffect(fn,deps){return this.useEffect(fn,deps);}};
  const root={React,addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);}};
  vm.runInNewContext(fs.readFileSync('modules/lorefy-library-cinema.js','utf8'),{window:root,module:{exports:{}},Map,Set});
  const props={owner,library:Object.fromEntries(catalog.map((work,i)=>[work.id,i%2?'read':'reading'])),progress:{},query:'',status:'all',order:'added',language:'en',done:'read',
    getWork(id){resolves++;return catalog.find(w=>w.id===id);},getProgress(work){progressReads++;return props.progress[work.id]||{};},percentage:(work,p)=>p.chapter||0,
    matches(work,query){matches++;return work.title.includes(query);},render(value){model=value;if(value.pageProps.ref)value.pageProps.ref.current=page;return value;}};
  function render(){si=mi=ri=ei=0;return root.LorefyLibraryCinema.Collection(props);}
  function flush(){const jobs=[...pending];pending.clear();jobs.forEach(([i,fn])=>{effects[i].cleanup?.();effects[i].cleanup=fn();});}
  return {root,props,catalog,page,render,flush,emit(name){listeners.get(name)?.();},unmount(){effects.forEach(e=>e.cleanup?.());},remount(){effects.forEach(e=>e.cleanup?.());state.length=memos.length=refs.length=effects.length=0;pending.clear();page.scrollTop=0;render();flush();return model;},counts:()=>({resolves,matches,progressReads})};
}

test('Library mounts one complete shelf batch, retains full counts, and reaches every saved work',()=>{
  const app=harness();let m=app.render();app.flush();
  assert.equal(m.rows.length,1000);assert.equal(m.counts.read,500);assert.equal(m.visible.length,42);assert.equal(m.results.length,1000);
  for(let i=0;i<24;i++){m.onMore();m=app.render();app.flush();}
  assert.equal(m.visible.length,1000);assert.equal(m.hasMore,false);assert.equal(new Set(m.visible.map(r=>r.id)).size,1000);
});
test('status-only parent renders and paging do not resolve or rematch the Library again',()=>{
  const app=harness();app.props.query='Story';let m=app.render();app.flush();const before=app.counts();
  for(let i=0;i<3;i++){app.props.getWork=id=>{throw Error('unchanged snapshot resolved');};app.props.matches=()=>{throw Error('unchanged snapshot matched');};m=app.render();app.flush();}
  m.onMore();app.render();assert.deepEqual(app.counts(),before);
});
test('typing stays inside the collection and restores its query after opening a work',()=>{
  const app=harness();let m=app.render();app.flush();m.onQuery('0999');m=app.render();app.flush();
  assert.equal(app.props.query,'');assert.equal(m.query,'0999');assert.equal(m.visible.length,1);
  m=app.remount();assert.equal(m.query,'0999');assert.equal(m.visible[0].id,'work-999');
  app.props.owner='another-reader';m=app.render();app.flush();assert.equal(m.query,'');assert.equal(m.visible.length,42);
});
test('query, status and stable title sorting apply to the full collection, not only mounted cards',()=>{
  const app=harness();app.render();app.flush();app.props.query='0999';let m=app.render();app.flush();
  assert.deepEqual(Array.from(m.visible,r=>r.id),['work-999']);
  app.props.query='';app.props.status='read';app.props.order='title';m=app.render();app.flush();
  assert.equal(m.results.length,500);assert.equal(m.visible[0].id,'work-1');assert.equal(m.visible.length,42);
});
test('progress sorting computes each checkpoint once and preserves insertion order for ties',()=>{
  const app=harness(100);app.props.order='progress';app.props.progress={'work-99':{chapter:10},'work-98':{chapter:10}};
  const m=app.render();assert.equal(app.counts().progressReads,100);assert.deepEqual(Array.from(m.visible.slice(0,3),r=>r.id),['work-98','work-99','work-0']);
});
test('new saved membership and in-place catalog hydration refresh the Library snapshot',()=>{
  const app=harness(3);app.render();app.flush();app.catalog.push({id:'late',title:'Late Story'});app.props.library={...app.props.library,late:'read'};
  let m=app.render();app.flush();assert.equal(m.rows.length,4);
  app.catalog[0].title='Changed Story';app.emit('lorefy:catalog-ingested');m=app.render();assert.equal(m.rows[0].m.title,'Changed Story');assert.equal(app.counts().resolves,11);
});
test('pending metadata remains pending without pretending that the saved Library is empty',()=>{
  const app=harness(0);app.props.library={missing:'read'};const m=app.render();assert.equal(m.pending,1);assert.equal(m.empty,false);
});
test('returning to the same Library restores revealed batch and scroll, without sharing another owner',()=>{
  const app=harness(100);let m=app.render();app.flush();m.onMore();m=app.render();app.flush();app.page.scrollTop=640;m.pageProps.onScroll({currentTarget:app.page});app.unmount();
  const same=harness(100);assert.equal(same.render().visible.length,42);
  m=app.remount();assert.equal(m.visible.length,84);assert.equal(app.page.scrollTop,640);
  app.props.owner='other-owner';m=app.render();app.flush();assert.equal(m.visible.length,42);assert.equal(app.page.scrollTop,0);
});
test('changing filters resets the batch and scroll and cannot invoke an obsolete more action',()=>{
  const app=harness(100);let m=app.render();app.flush();const old=m.onMore;app.props.status='read';m=app.render();app.flush();old();m=app.render();assert.equal(m.visible.length,42);assert.equal(app.page.scrollTop,0);
});
test('filter-empty and query-empty actions recover within the Library before navigating elsewhere',()=>{
  const app=harness(0);let cleared=0,reset=0;
  const filtered=app.root.LorefyLibraryCinema.Empty({language:'en',filtered:true,status:'read',onReset:()=>reset++});
  const button=filtered.children.find(n=>n&&n.type==='button');assert.ok(button.children.includes('Show all works'));button.props.onClick();assert.equal(reset,1);
  const searched=app.root.LorefyLibraryCinema.Empty({language:'en',query:'none',onClear:()=>cleared++});searched.children.find(n=>n&&n.type==='button').props.onClick();assert.equal(cleared,1);
});
test('Library render is wired to the bounded collection with accessible progress and recovery controls',()=>{
  const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8'),css=fs.readFileSync('styles/lorefy-library-cinema.css','utf8');
  assert.match(app,/LorefyLibraryCinema\.Collection/);assert.match(app,/libraryModel\.visible/);assert.match(app,/libraryModel\.pageProps/);assert.match(app,/libraryModel\.hasMore/);
  assert.match(css,/\.lf-library-more\{[^}]*min-height:44px/);
});
test('Library status badges do not reserve excess width at the expense of status words',()=>{
  const css=fs.readFileSync('styles/lorefy-library-cinema.css','utf8');
  assert.match(css,/\.lf-library-tabs button b\{[^}]*min-width:0!important/);
  assert.match(css,/@media\(max-width:350px\)[\s\S]*\.lf-library-tabs\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
});

test('the actual Library renderer mounts only the batch while the summary retains every result',()=>{
  const app=harness(),source=fs.readFileSync('uploads/files/lorefy-app.js','utf8'),start=source.indexOf(',dr=()=>{'),end=source.indexOf(',cr=()=>{',start);
  const context={React:app.root.React,window:{LorefyLibraryCinema:app.root.LorefyLibraryCinema,LorefyCatalogData:{matchesCatalogQuery:app.props.matches},LorefyLibraryMedia:{card:node=>node}},
    b:app.props.library,le:app.props.progress,q:'all',libraryQuery:'',libraryOrder:'added',W:'en',Y:app.props.owner,C:{},
    STATUS_DONE:'read',STATUS_READING:'reading',STATUS_WISHLIST:'wish',STATUS_PAUSED:'paused',STATUS_DROPPED:'dropped',
    workById:app.props.getWork,je:app.props.getProgress,progressPercent:app.props.percentage,uiText:(language,ar,en)=>en,lorefyReadingStatusLabel:value=>value,
    rt(){},setLibraryQuery(){},setLibraryOrder(){},nt(){},T(){},I:()=>'',R(){},legalCoverOf:()=>'',progressSummary:()=>'',Check:'Check',BookOpen:'BookOpen'};
  vm.runInNewContext('const '+source.slice(start+1,end).trim()+';result=dr();',context);
  Object.assign(app.props,context.result.props);const tree=app.render();
  const nodes=node=>node&&typeof node==='object'?[node,...node.children.flat(Infinity).flatMap(nodes)]:[];
  const all=nodes(tree),cards=all.filter(node=>node.props.className==='lf-library-card');
  assert.equal(cards.length,42);assert.equal(all.find(node=>node.type===app.root.LorefyLibraryCinema.Summary).props.count,1000);
  assert.equal(all.find(node=>node.type==='select').props['aria-label'],'Sort library');
  all.find(node=>node.props.className==='lf-library-more').props.onClick();assert.equal(nodes(app.render()).filter(node=>node.props.className==='lf-library-card').length,84);
  nodes(app.render()).find(node=>node.type===app.root.LorefyLibraryCinema.Search).props.onChange('0999');
  const searched=nodes(app.render());assert.equal(searched.filter(node=>node.props.className==='lf-library-card').length,1);
  assert.equal(searched.find(node=>node.type===app.root.LorefyLibraryCinema.Search).props.value,'0999');
});

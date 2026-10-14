const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
function setup(backend={mode:'demo',user:{id:'a'}}){
  const values={},events=[];
  const storage={getItem:key=>values[key] || null,setItem:(key,value)=>{values[key]=value;}};
  const root={LorefyBackend:backend,localStorage:storage,dispatchEvent:event=>events.push(event),CustomEvent:class {constructor(type,init){this.type=type;this.detail=init.detail;}}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window:root,URLSearchParams});
  return {api:root.LorefyProfileShop,root,values,events,storage};
}
test('free bundle application is durable and scoped to its account, never its media',async()=>{
  const s=setup();
  assert.equal(typeof s.api.applyDecoration,'function');
  s.values['lorefy.identity.v1']='{"avatar":"existing","banner":"my-header"}';
  const result=await s.api.applyDecoration('observatory','all','a');
  assert.equal(result.local,true);
  assert.equal(s.api.readDecoration(s.storage,'a').page,'observatory');
  assert.equal(s.api.readDecoration(s.storage,'b').page,null);
  const cold=setup();cold.values[s.api.DECORATION_KEY]=s.values[s.api.DECORATION_KEY];
  assert.equal(cold.api.readDecoration(cold.storage,'a').frame,'observatory');
  assert.equal(s.values['lorefy.identity.v1'],'{"avatar":"existing","banner":"my-header"}');
});
test('individual pieces merge and removing decorations does not delete user artwork',async()=>{
  const s=setup();
  assert.equal(typeof s.api.applyDecoration,'function');
  await s.api.applyDecoration('observatory','all','a');
  await s.api.applyDecoration('blossom','frame','a');
  assert.equal(s.api.readDecoration(s.storage,'a').frame,'blossom');
  assert.equal(s.api.readDecoration(s.storage,'a').page,'observatory');
  await s.api.applyDecoration(null,'all','a');
  assert.equal(s.api.readDecoration(s.storage,'a').page,null);
});
test('unknown IDs and stale account dialogs cannot save decorations',async()=>{
  const s=setup();
  assert.equal(typeof s.api.applyDecoration,'function');
  await assert.rejects(s.api.applyDecoration('evil','all','a'));
  await assert.rejects(s.api.applyDecoration('observatory','banner','a'));
  await assert.rejects(s.api.applyDecoration('observatory','all','b'));
  assert.equal(Object.keys(s.values).length,0);
});
test('failed storage never reports success or sends a cloud push',async()=>{
  let pushed=0;const s=setup({mode:'live',user:{id:'a'},push:async()=>{pushed++;return true;}});
  assert.equal(typeof s.api.applyDecoration,'function');
  s.storage.setItem=()=>{throw Error('blocked');};
  await assert.rejects(s.api.applyDecoration('blossom','all','a'));
  assert.equal(pushed,0);
});
test('offline cloud failure retains durable local choice and reports pending sync',async()=>{
  const s=setup({mode:'live',user:{id:'a'},push:async()=>{throw Error('offline');}});
  assert.equal(typeof s.api.applyDecoration,'function');
  const result=await s.api.applyDecoration('blossom','all','a');
  assert.equal(result.local,true);assert.equal(result.synced,false);
  assert.equal(s.api.readDecoration(s.storage,'a').page,'blossom');
});
test('account switch during push cannot update the new account UI',async()=>{
  let finish;const backend={mode:'live',user:{id:'a'},push:()=>new Promise(resolve=>{finish=resolve;})};
  const s=setup(backend);assert.equal(typeof s.api.applyDecoration,'function');
  const saving=s.api.applyDecoration('manuscript','all','a');
  backend.user={id:'b'};finish(true);
  const result=await saving;
  assert.equal(result.current,false);
  assert.equal(s.api.readDecoration(s.storage,'b').frame,null);
});
test('public decoration normalization whitelists IDs and never reads viewer storage',()=>{
  const s=setup();assert.equal(typeof s.api.normalizeDecoration,'function');
  const clean=s.api.normalizeDecoration({frame:'observatory',page:'evil',effect:'manuscript',banner:'https://evil.test'});
  assert.equal(clean.frame,'observatory');assert.equal(clean.page,null);assert.equal(clean.effect,'manuscript');
  assert.equal(clean.banner,undefined);
  assert.match(read('modules/lorefy-public-profile.js'),/profile\.profile_decoration/);
});
test('avatar geometry uses per-frame centers without changing the underlying photo dimensions',()=>{
  const s=setup();assert.equal(typeof s.api.frameGeometry,'function');
  const moon=s.api.frameGeometry('observatory'),spring=s.api.frameGeometry('blossom'),ink=s.api.frameGeometry('manuscript');
  assert.notEqual(moon.cy,ink.cy);assert.notEqual(moon.cx,spring.cx);
  for(const item of [moon,spring,ink])assert.ok(item.size >= .64 && item.size <= .69);
  const css=read('styles/lorefy-profile-shop.css');
  assert.match(css,/--shop-portrait-x/);assert.match(css,/--shop-portrait-y/);
  assert.match(css,/\.lf-profile-avatar\.has-decoration[^}]*overflow:\s*visible\s*!important/s);
  assert.match(css,/\.lf-decoration-page-border[^}]*pointer-events:\s*none/s);
});
test('page artwork resolves relative to the stylesheet and effects cannot match legacy div avatar selectors',()=>{
  const code=read('modules/lorefy-profile-shop.js');
  assert.match(code,/url\("\.\.\/launch\/shop\/lorefy-page-/);
  assert.match(code,/const effect = root\.document\.createElement\('span'\)/);
});
test('immersive avatars leave room for decoration overhang and apply buttons have inverse contrast',()=>{
  const css=read('styles/lorefy-profile-shop.css');
  assert.match(css,/\[data-profile-layout='immersive'\] \.lf-profile-avatar\.has-decoration\s*\{\s*right:\s*40px\s*!important/);
  assert.match(css,/\.lf-shop-apply\s*\{[^}]*color:\s*var\(--ui-bg\)/);
  assert.match(css,/\.lf-reader-avatar\.has-decoration\s*\{[^}]*margin-bottom:\s*30px/);
  assert.match(css,/\.lf-reader-identity > \.lf-reader-avatar\.has-decoration\s*\{\s*right:\s*40px\s*!important/);
  assert.match(css,/:not\(\[data-profile-layout='immersive'\]\):has\(\.lf-profile-avatar\.has-decoration\) \.lf-profile-identity\s*\{\s*padding-top:\s*72px\s*!important/);
  assert.doesNotMatch(read('modules/lorefy-profile-shop.js'),/Sync will resume when connected/);
});
test('decoration state participates in account hydration and sign-out cleanup',()=>{
  assert.match(read('backend/lorefy-backend.js'),/"lorefy\.user\.profileDecoration\.v1"/);
});
test('public projection exposes only allowed cosmetic IDs under existing visibility checks',()=>{
  const sql=read('supabase/migrations/20261008180126_free_profile_decorations.sql');
  assert.match(sql,/'profile_decoration'/);assert.match(sql,/decoration->>'ownerId' = profile_ref::text/);
  assert.match(sql,/not p\.is_private/);assert.match(sql,/private\.author_has_blocked_viewer/);
  assert.match(sql,/private\.reader_has_blocked_author/);assert.match(sql,/revoke all/);
  assert.match(sql,/'observatory','blossom','manuscript'/);
});

test('page frame sides are wider and bounded responsively without intercepting touches',()=>{
  const css=read('styles/lorefy-profile-shop.css');
  assert.match(css,/--profile-frame-side:\s*clamp\(24px,7vw,32px\)/);
  assert.match(css,/border-width:\s*clamp\(40px,10\.5vw,46px\) var\(--profile-frame-side,26px\)/);
  assert.match(css,/\.lf-shop-wishlist\s*\{[^}]*width:\s*44px;\s*height:\s*44px/);
  assert.match(css,/\.lf-decoration-page-border\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css,/:has\(\.lf-profile-avatar\.has-decoration\) \.lf-profile-name\s*\{\s*margin-top:\s*0\s*!important/);
  assert.match(css,/:has\(\.lf-reader-avatar\.has-decoration\) \.lf-reader-identity h1\s*\{\s*margin-top:\s*0\s*!important/);
});

test('page frames sit at the viewport edge and reserve a shared content safe area',()=>{
  const css=read('styles/lorefy-profile-shop.css');
  assert.match(css,/\.lf-decoration-page-border\s*\{[^}]*top:\s*0;\s*left:\s*0;\s*right:\s*0;\s*height:\s*var\(--decoration-height,100dvh\)/);
  assert.match(css,/--profile-frame-safe-inline:\s*calc\(var\(--profile-frame-side\) \+ 6px\)/);
  assert.match(css,/\.lf-profile-page\.has-page-decoration\s+:is\(\.lf-profile-identity,\s*\.lf-reader-identity\)\s*\{[^}]*padding-inline:\s*var\(--profile-frame-safe-inline\)\s*!important/);
  assert.match(read('modules/lorefy-profile-shop.js'),/page\.classList\.toggle\('has-page-decoration',!!pagePack\)/);
});

function shopHarness(selection=null) {
  const changes=[],effects=[],nodes=[];let state=0,auth;
  const request={owner:'a',profile:{name:'A'}};
  const root={document:{readyState:'loading',addEventListener:()=>{},documentElement:{lang:'en'},querySelector:()=>({}),activeElement:null},
    LorefyBackend:{mode:'demo',user:{id:'a'},onAuth:fn=>{auth=fn;}},localStorage:{getItem:()=>null},sessionStorage:{getItem:()=>null},
    addEventListener:()=>{},removeEventListener:()=>{},React:{useState:initial=>{const index=state++;return [index===0?request:index===2?selection:initial,value=>changes.push({index,value})];},
      useRef:()=>({current:null}),useEffect:fn=>effects.push(fn),createElement:(type,props,...children)=>{const node={type,props:props||{},children};nodes.push(node);return node;}},
    ReactDOM:{createPortal:content=>content}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window:root,URLSearchParams});
  root.LorefyProfileShop.Shop();
  return {root,changes,effects,nodes,request,auth:()=>auth};
}

test('an account change closes the stale decoration dialog and cleanup disables the callback',()=>{
  const s=shopHarness(),cleanup=s.effects[0]();
  assert.equal(typeof s.auth(),'function');
  s.root.LorefyBackend.user={id:'b'};s.auth()();
  const update=s.changes.find(change=>change.index===0);
  assert.equal(typeof update.value,'function');assert.equal(update.value(s.request),null);
  cleanup();s.changes.length=0;s.auth()();assert.equal(s.changes.length,0);
});

test('new bundle and part previews clear stale success messages',()=>{
  const catalog=shopHarness();
  const node=catalog.nodes.find(node=>node.type===catalog.root.LorefyProfileShop.Catalog);
  node.props.onSelect('blossom');
  assert.ok(catalog.changes.some(change=>change.index===9&&change.value===''));
  const detail=shopHarness('observatory');
  detail.nodes.find(node=>node.type==='button'&&node.children.some(child=>child&&child.children&&child.children.includes('Avatar frame'))).props.onClick();
  assert.ok(detail.changes.some(change=>change.index===9&&change.value===''));
});

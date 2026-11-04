const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const frame=require('../modules/lorefy-frame-motion.js');
const ids=['ember-harvest','ghost-parade','crimson-masquerade','poison-conservatory','velvet-familiar','silk-widow'];
function renderer(){try{return require('../modules/lorefy-halloween-motion.js');}catch{return {};}}
test('six selected Halloween packs use the shared renderer and reject unknown artwork',()=>{
  const api=renderer();assert.equal(typeof api.layout,'function','Halloween renderer must exist');
  assert.deepEqual(api.ids,ids);
  assert.throws(()=>api.layout('unknown',440,956));
  for(const id of ids)for(const w of [320,375,390,440,768])for(const h of [568,844,956]){
    const g=api.layout(id,w,h),cap=frame.profileHeader(w);
    assert.equal(g.line,cap.line);assert.equal(g.controls,16);
    assert.ok(g.rail<=20&&g.bottom<=28);
    assert.ok(Object.values(g).every(Number.isFinite));
  }
});
test('Halloween catalog is available in the actual store without demo-only gates or purchases',()=>{
  const window={location:{hostname:'app.lorefy.com',search:''},LorefyBackend:{mode:'live'}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
  const shop=window.LorefyProfileShop;
  assert.equal(typeof shop.installHalloweenCollections,'function','catalog installer must exist');
  const catalog=JSON.parse(read('launch/decorations/halloween/collections.json'));
  assert.equal(shop.installHalloweenCollections(catalog),true);
  assert.equal(shop.filterCatalog({collection:'halloween'}).length,6);
  assert.equal(shop.installHalloweenCollections([...catalog.slice(0,5),catalog[0]]),false);
  assert.equal(shop.installHalloweenCollections(catalog.map(p=>({...p,atlas:'https://example.org/art.png'}))),false);
  for(const pack of shop.filterCatalog({collection:'halloween'})){
    assert.equal(pack.renderer,'halloween');assert.equal(pack.free,true);
    assert.equal(pack.productId,undefined);assert.equal(pack.releaseAllowed,true);
    assert.equal(shop.previewParts(pack.id,'all').frame,pack.id);
    assert.equal(shop.previewParts(pack.id,'all').page,pack.id);
    assert.ok(fs.existsSync(path.join(root,pack.atlas)));
    for(const w of [320,440])assert.ok(shop.avatarSize(pack.id,w)/pack.geometry.size<=(w<380?136:160)+.01);
  }
});
test('Halloween runtime ships real assets outside QA and reuses the central scheduler',()=>{
  const file=path.join(root,'modules/lorefy-halloween-motion.js');
  assert.ok(fs.existsSync(file),'runtime renderer must exist');
  const src=read('modules/lorefy-halloween-motion.js');
  assert.doesNotMatch(src,/requestAnimationFrame|setInterval|qa\//);
  assert.match(read('modules/lorefy-frame-motion.js'),/halloween/);
  assert.match(read('index.html'),/modules\/lorefy-halloween-motion\.js/);
  assert.match(read('sw.js'),/modules\/lorefy-halloween-motion\.js/);
});

test('still store thumbnails paint once without starting an animation loop',async()=>{
  let draws=0,queued=0;
  const context={setTransform(){},clearRect(){},save(){},restore(){},translate(){}};
  const canvas={style:{},dataset:{},setAttribute(){},getContext:()=>context,remove(){}};
  const element={offsetWidth:100,offsetHeight:100,isConnected:true,appendChild(){},classList:{add(){},remove(){}}};
  const window={document:{hidden:false,createElement:()=>canvas,addEventListener(){}},devicePixelRatio:1,
    getComputedStyle:()=>({borderLeftWidth:'0',borderTopWidth:'0'}),requestAnimationFrame:()=>++queued,cancelAnimationFrame(){},
    IntersectionObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn([{isIntersecting:true}]);}disconnect(){}},
    LorefyOriginalRenderers:{halloween:{load:async()=>true,paint(){draws++;}}}};
  vm.runInNewContext(read('modules/lorefy-frame-motion.js'),{window});
  const dispose=window.LorefyFrameMotion.mount(element,{original:{renderer:'halloween',id:'velvet-familiar'},still:true});
  await Promise.resolve();await Promise.resolve();
  assert.equal(draws,1);assert.equal(queued,0);dispose();
});

test('public-profile SQL preparation adds only the six free frame IDs and preserves installed visibility guards',()=>{
  const file=path.join(root,'supabase/migrations/20261102190000_halloween_profile_artwork.sql');
  assert.ok(fs.existsSync(file),'public projection update must be prepared locally');
  const sql=fs.readFileSync(file,'utf8');
  for(const id of ids)assert.ok(sql.includes('halloween-'+id));
  assert.match(sql,/pg_get_functiondef/);assert.match(sql,/raise exception/);
  assert.doesNotMatch(sql,/CREATE OR REPLACE FUNCTION|grant execute|disable row level security/i);
});

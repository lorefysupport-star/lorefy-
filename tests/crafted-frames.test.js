const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ids=['witch','moon','ink','theatre','dawn','dusk','garden','patchwork'];
const runtime=()=>require('../modules/lorefy-crafted-motion.js');

test('eight approved frames have toolbar-safe geometry in every profile size',()=>{
  const api=runtime(),frame=require('../modules/lorefy-frame-motion.js');
  assert.deepEqual(api.ids,ids);assert.throws(()=>api.layout('unknown',440,956));
  for(const id of ids)for(const w of [320,375,390,440,768])for(const h of [568,844,956]){
    const g=api.layout(id,w,h),cap=frame.profileHeader(w);
    assert.equal(g.line,cap.line);assert.equal(g.controls,16);assert.ok(g.rail<=20&&g.bottom<=28);
    assert.ok(Object.values(g).every(Number.isFinite));
    const p=api.portrait(id);assert.ok(p.size>.4&&p.size<.65);assert.ok(p.cy+p.size/2<1);
  }
});

test('the live store installs only the eight approved, local assets without overwriting earlier collections',()=>{
  const window={location:{hostname:'app.lorefy.com',search:''},LorefyBackend:{mode:'live'}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
  const shop=window.LorefyProfileShop,catalog=JSON.parse(read('launch/decorations/crafted/collections.json'));
  shop.installHalloweenCollections(JSON.parse(read('launch/decorations/halloween/collections.json')));
  assert.equal(shop.installCraftedCollections(catalog),true);
  assert.equal(shop.filterCatalog({collection:'halloween'}).length,6);
  for(const [family,count]of [['objects',4],['expressive-elves',2],['crochet',2]])assert.equal(shop.filterCatalog({collection:family}).length,count);
  assert.equal(shop.installCraftedCollections(catalog),true);
  assert.equal(shop.bundles.filter(p=>p.renderer==='crafted').length,8);
  for(const bad of [catalog.slice(1),[...catalog.slice(0,7),catalog[0]],catalog.map(p=>({...p,atlas:'https://example.org/a.webp'})),catalog.map(p=>({...p,geometry:{cx:.5,cy:.5,size:.8}}))]){
    assert.equal(shop.installCraftedCollections(bad),false);
  }
  for(const p of catalog){
    const pack=shop.findBundle(p.id);assert.equal(pack.free,true);assert.equal(pack.productId,undefined);
    assert.equal(pack.releaseAllowed,true);assert.deepEqual(Array.from(pack.parts),['frame','page']);
    assert.equal(shop.previewParts(p.id,'all').page,p.id);
    assert.equal(shop.previewParts(p.id,'frame').page,null);
    assert.equal(shop.previewParts(p.id,'page').frame,null);
    assert.deepEqual(JSON.parse(JSON.stringify(pack.geometry)),runtime().portrait(pack.artId));
    for(const w of [320,440])assert.ok(shop.avatarSize(p.id,w)/pack.geometry.size<=(w<380?136:160)+.01);
    assert.ok(fs.statSync(path.join(root,p.atlas)).size<900000,'WebP atlas stays under 900KB');
  }
});

test('crafted runtime ships outside QA, loads lazily and uses only the shared animation clock',()=>{
  for(const name of ['objects','elves','crochet','motion']){
    const file='modules/lorefy-crafted-'+name+'.js';
    assert.doesNotMatch(read(file),/requestAnimationFrame|setInterval|qa\/|artifacts\//);
    assert.ok(read('index.html').includes(file));assert.ok(read('sw.js').includes(file));
    assert.equal(read('ios-web/'+file),read(file));assert.equal(read('ios/App/App/public/'+file),read(file));
  }
  assert.match(read('modules/lorefy-frame-motion.js'),/\['restored','halloween','crafted'\]/);
  assert.ok(!read('sw.js').includes("'./launch/decorations/crafted/witch.webp'"),'large art is not precached');
});

test('each family keeps its original articulated motion and protected portrait aperture',()=>{
  const object=require('../modules/lorefy-crafted-objects.js'),elf=require('../modules/lorefy-crafted-elves.js'),crochet=require('../modules/lorefy-crafted-crochet.js');
  for(const [api,slugs]of [[object,ids.slice(0,4)],[elf,ids.slice(4,6)],[crochet,ids.slice(6)]])for(const id of slugs){
    const poses=Array.from({length:48},(_,i)=>JSON.stringify(api.pose(id,i*.137)));
    assert.ok(new Set(poses).size>40,id+' must actually articulate');
  }
  assert.notEqual(elf.pose('dawn',1.4).left,elf.pose('dawn',1.4).right);
  const p=crochet.yarnPath(1.5);assert.deepEqual(p.start,p.ball);assert.deepEqual(p.end,p.hook);
});

test('atlas requests coalesce, failures are retryable and unknown IDs never fetch',async()=>{
  const images=[];let prepared=0;
  const window={document:{},LorefyFrameMotion:{profileHeader:()=>({line:64})},
    LorefyCraftObjects:{prepare(){prepared++;return {cells:[{},{}]};}},
    Image:class{set src(value){this.url=value;images.push(this);}}};
  vm.runInNewContext(read('modules/lorefy-crafted-motion.js'),{window});
  const api=window.LorefyOriginalRenderers.crafted;
  await assert.rejects(api.load('bad'));assert.equal(images.length,0);
  const a=api.load('witch'),b=api.load('witch');assert.equal(images.length,1);
  images[0].onerror();await assert.rejects(a);await assert.rejects(b);
  const next=api.load('witch');assert.equal(images.length,2);
  images[1].width=1024;images[1].height=1536;images[1].onload();await next;
  await api.load('witch');assert.equal(images.length,2);assert.equal(prepared,1);
});

test('still crafted thumbnails render once and never enqueue their own animation',async()=>{
  let draws=0,queued=0;
  const ctx={setTransform(){},clearRect(){},save(){},restore(){},translate(){}};
  const canvas={style:{},dataset:{},setAttribute(){},getContext:()=>ctx,remove(){}};
  const element={offsetWidth:100,offsetHeight:100,isConnected:true,appendChild(){},classList:{add(){},remove(){}}};
  const window={document:{hidden:false,createElement:()=>canvas,addEventListener(){}},devicePixelRatio:1,
    getComputedStyle:()=>({}),requestAnimationFrame:()=>++queued,cancelAnimationFrame(){},
    IntersectionObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn([{isIntersecting:true}]);}disconnect(){}},
    LorefyOriginalRenderers:{crafted:{load:async()=>true,paint(){draws++;}}}};
  vm.runInNewContext(read('modules/lorefy-frame-motion.js'),{window});
  const dispose=window.LorefyFrameMotion.mount(element,{original:{renderer:'crafted',id:'garden'},still:true});
  await Promise.resolve();await Promise.resolve();assert.equal(draws,1);assert.equal(queued,0);dispose();
});

test('ear and cloth attachment roots stay pinned through the entire choreography',()=>{
  const objects=require('../modules/lorefy-crafted-objects.js'),elves=require('../modules/lorefy-crafted-elves.js'),crochet=require('../modules/lorefy-crafted-crochet.js');
  for(let i=0;i<120;i++){
    const t=i/10;
    for(const id of objects.IDS)assert.equal(objects.flex(id,t,0),0);
    for(const id of crochet.IDS)assert.equal(crochet.flex(id,t,0),0);
    for(const id of elves.IDS)for(const side of ['left','right'])assert.equal(elves.bend(id,t,side==='left'?1:0,side),0);
  }
});

test('all eight material perimeters stay connected, bounded and animated at every supported size',()=>{
  const api=runtime();
  for(const id of ids)for(const w of [320,440,768]){
    const a=api.perimeter(id,0,w,956,64),b=api.perimeter(id,.7,w,956,64);
    assert.equal(a.length,b.length);assert.notDeepEqual(a,b);
    for(let i=0;i<a.length;i++){
      const p=a[i];assert.ok(p.x-p.half>=0&&p.x+p.half<=w&&p.y+p.half<=956);
      if(i)assert.ok(Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)<25);
    }
  }
});

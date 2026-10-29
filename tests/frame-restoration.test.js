const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const oldIds=['observatory','blossom','manuscript',...JSON.parse(read('launch/decorations/pfpvibes/collections.json')).map(p=>p.id),...JSON.parse(read('launch/decorations/originals/catalog.json')).paid.map(p=>p.id)];
test('all 39 existing frame identities have calibrated original artwork and material-specific restoration',()=>{
  const rows=JSON.parse(read('launch/decorations/refined/manifest.json'));
  assert.equal(rows.length,39);assert.deepEqual(new Set(rows.map(p=>p.id)),new Set(oldIds));
  const api=require('../modules/lorefy-frame-restoration.js');
  const actions=new Set();
  for(const p of rows){
    assert.ok(api.valid(p));actions.add(p.action);
    assert.ok(p.portraitClip.length===72&&p.geometry.size>p.aperture.size);
    assert.ok(fs.existsSync(path.join(root,p.avatar)));
    const a=api.pose(p,0),b=api.pose(p,1.1),end=api.pose(p,12);
    assert.notDeepEqual(a,b,p.id+' needs real body motion');
    for(const key of Object.keys(a))assert.ok(Math.abs(a[key]-end[key])<1e-7);
    for(const t of [0,.3,1,3,6,9,11.99])for(const v of Object.values(api.pose(p,t)))assert.ok(Number.isFinite(v));
    for(const edge of ['top','left','right','bottom']){
      const first=api.perimeter(p,0,320,850),later=api.perimeter(p,1.7,320,850);
      assert.notDeepEqual(first.filter(q=>q.edge===edge),later.filter(q=>q.edge===edge));
      for(const q of later)assert.ok(q.x-q.half>=0&&q.x+q.half<=320&&q.y-q.half>=64&&q.y+q.half<=850);
    }
  }
  assert.ok(actions.size>=12,'Do not give the entire catalog the same wobble');
  assert.equal(api.valid({...rows[0],avatar:'https://example.com/x.png'}),false);
});
test('page sides have visible travel rather than subpixel-only motion',()=>{
  const api=require('../modules/lorefy-frame-restoration.js');
  for(const p of JSON.parse(read('launch/decorations/refined/manifest.json'))){
    for(const edge of ['left','right']){
      const xs=Array.from({length:25},(_,i)=>api.perimeter(p,i/2,320,850).filter(q=>q.edge===edge)[48].x);
      assert.ok(Math.max(...xs)-Math.min(...xs)>=4,p.id+' '+edge+' should travel at least 4 CSS pixels');
    }
  }
});
test('top ribbon samples the opaque material instead of shrinking transparent padding into a hairline',()=>{
  const api=require('../modules/lorefy-frame-restoration.js'),w=100,h=100,pixels=new Uint8ClampedArray(w*h*4);
  for(let y=25;y<90;y++){
    for(let x=14;x<20;x++){const k=(y*w+x)*4;pixels[k]=210;pixels[k+1]=100;pixels[k+2]=110;pixels[k+3]=255;}
    for(let x=84;x<91;x++){const k=(y*w+x)*4;pixels[k]=90;pixels[k+1]=160;pixels[k+2]=230;pixels[k+3]=255;}
    pixels[(y*w+3)*4+3]=255;
  }
  const strip=api.materialPixels(pixels,w,h);
  for(const x of [0,20,200,511,512,1000]){
    let opaque=0;
    for(let y=0;y<strip.height;y++)if(strip.data[(y*strip.width+x)*4+3]>128)opaque++;
    assert.ok(opaque>=48,'At least 75% of the connector thickness must contain real artwork');
  }
  assert.deepEqual([...strip.data.slice(200*4,200*4+4)],[...strip.data.slice((strip.width-1-200)*4,(strip.width-200)*4)]);
  const right=api.materialPixels(pixels,w,h,true),sample=(32*right.width+200)*4;
  assert.deepEqual([...right.data.slice(sample,sample+4)],[90,160,230,255],'The right joint must use its own original material');
});
test('real page art retains one intact header with connected responsive edge deformation',()=>{
  const api=require('../modules/lorefy-frame-restoration.js');
  const rig={vertices:[[0,0],[1,0],[.25,.04],[.75,.04],[.1,.5],[.9,.5],[0,1],[1,1],[.5,.12]]};
  for(const p of JSON.parse(read('launch/decorations/refined/manifest.json')).filter(p=>p.page)){
    for(const [w,h]of [[320,680],[440,950],[768,1024]]){
      const a=api.pagePositions(p,rig,0,w,h),end=api.pagePositions(p,rig,12,w,h);
      const cap=api.headerBox(w,.43);
      assert.ok(cap.width<=184&&cap.height<=64,'Keep the intact crest compact');
      assert.ok(cap.y>=0&&cap.y+cap.height<=cap.line,'Crest belongs above the banner, not over its image');
      if(w>=380)assert.ok(cap.x>=122&&cap.x+cap.width<=w-122,'Do not cover the toolbar buttons');
      for(let i=0;i<a.length;i++){
        assert.ok(a[i][0]>=0&&a[i][0]<=1&&a[i][1]*h>=64&&a[i][1]<=1);
        assert.ok(Math.hypot(a[i][0]-end[i][0],a[i][1]-end[i][1])<1e-7);
      }
      for(const index of [4,5]){
        const xs=Array.from({length:25},(_,i)=>api.pagePositions(p,rig,i/2,w,h)[index][0]*w);
        assert.ok(Math.max(...xs)-Math.min(...xs)>4,p.id+' side mesh must flex visibly');
      }
    }
  }
});
test('substantial top connectors leave the toolbar clear and join both ends of the crest',()=>{
  const api=require('../modules/lorefy-frame-restoration.js'),p=JSON.parse(read('launch/decorations/refined/manifest.json')).find(p=>p.id==='original-ribbon-bunny');
  for(const w of [320,380,440,768])for(const t of [0,1,4,8,12]){
    const cap=api.headerBox(w,.3),paths=api.connectors(p,t,w,cap);
    assert.equal(paths.length,2);
    for(const [i,points]of paths.entries()){
      assert.ok(i?points[0].x>w-24:points[0].x<24);assert.ok(points.every(q=>q.half>=6));
      assert.ok(Math.abs(points.at(-1).x-(i?cap.x+cap.width*.94:cap.x+cap.width*.06))<1e-6);
      if(w>=380)for(const q of points){
        const hitsControls=(q.x-q.half<114||q.x+q.half>w-114)&&q.y-q.half<61;
        assert.equal(hitsControls,false,'The thicker ribbon must not run through the controls');
      }
    }
  }
});
test('upper corners start on the actual animated side with its tangent and source texture',()=>{
  const api=require('../modules/lorefy-frame-restoration.js');
  const rig={sideJoins:[{cx:.1,left:.08,right:.12,y:.27},{cx:.9,left:.88,right:.92,y:.27}]};
  for(const p of JSON.parse(read('launch/decorations/refined/manifest.json')))for(const w of [320,440])for(const t of [0,2,5,9,12]){
    const cap=api.headerBox(w,.3),joins=api.pageJoins(p,rig,t,w,950),paths=api.connectors(p,t,w,cap,joins);
    for(let i=0;i<2;i++){
      const points=paths[i],a=points[0],b=points[1],j=joins[i],dx=b.x-a.x,dy=b.y-a.y;
      assert.ok(Math.hypot(a.x-j.x,a.y-j.y)<1e-7,'No independent corner endpoint');
      const dot=(dx*j.dx+dy*j.dy)/Math.hypot(dx,dy);
      assert.ok(dot>.998,'Corner must leave the side in its upward tangent');
      assert.equal(points.texture,j.texture,'Lock the texture at the side seam');
      assert.ok(a.y>cap.line+24&&b.y<a.y);
      assert.ok(Math.abs(points[33].y-points[32].y)<.15,'Rounded corner must become horizontal');
    }
  }
});
test('the upper ornament has a readable middle size without becoming a full-width banner',()=>{
  const api=require('../modules/lorefy-frame-restoration.js');
  const cap=api.headerBox(440,.3);
  assert.ok(cap.width>=176&&cap.width<=192);
  assert.ok(cap.y+cap.height<=64);
  for(const w of [320,360]){const compact=api.headerBox(w,.3);assert.ok(compact.y>=64&&compact.y+compact.height<=compact.line);}
});
test('temporarily collapsed page previews do not dereference missing side anchors',()=>{
  const api=require('../modules/lorefy-frame-restoration.js'),p=JSON.parse(read('launch/decorations/refined/manifest.json'))[0];
  assert.deepEqual(api.pageJoins(p,null,0,100,100),[]);
  assert.deepEqual(api.pageJoins(p,null,0,40,900),[]);
});
test('the compact intact crest keeps articulated eye blinks as well as perimeter motion',()=>{
  const api=require('../modules/lorefy-frame-restoration.js'),p=JSON.parse(read('launch/decorations/refined/manifest.json')).find(p=>p.id==='original-night-gaze');
  const rig={vertices:[[.5,.095],[.5,.105]],features:[{x:.5,y:.1,cos:1,sin:0,w:.04,h:.02}]};
  const shut=api.crestPositions(p,rig,0),open=api.crestPositions(p,rig,3);
  assert.ok(shut[1][1]-shut[0][1]<(open[1][1]-open[0][1])*.4);
});
test('restoration preserves catalog IDs, permissions, prices, selections and source media',()=>{
  const window={location:{hostname:'127.0.0.1',search:'?decorationLab=1'},LorefyBackend:{mode:'demo'},LOREFY_RELEASE:{betaProfileDecorations:true}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
  const api=window.LorefyProfileShop;
  api.installBetaCollections(JSON.parse(read('launch/decorations/pfpvibes/collections.json')));
  api.installShopCatalog(JSON.parse(read('launch/decorations/originals/catalog.json')));
  const before=JSON.stringify(api.bundles.map(p=>({id:p.id,price:p.price,free:p.free,releaseAllowed:p.releaseAllowed,betaCollection:p.betaCollection})));
  assert.equal(api.installRestoration(JSON.parse(read('launch/decorations/refined/manifest.json'))),true);
  assert.equal(JSON.stringify(api.bundles.map(p=>({id:p.id,price:p.price,free:p.free,releaseAllowed:p.releaseAllowed,betaCollection:p.betaCollection}))),before);
  for(const id of oldIds)assert.equal(api.findBundle(id).motionRenderer,'restored');
  assert.equal(api.installRestoration([{id:'invented'}]),false);
  assert.doesNotMatch(read('modules/lorefy-frame-restoration.js'),/requestAnimationFrame|setInterval|\.saveProfile\(|localStorage/);
});
test('the shared bitmap skin and new renderer load in the app and profile QA before decoration boot',()=>{
  for(const file of ['index.html','qa/profile-header.html']){
    const src=read(file);
    assert.ok(src.indexOf('modules/lorefy-bitmap-rig.js')<src.indexOf('modules/lorefy-elven-motion.js'));
    assert.ok(src.indexOf('modules/lorefy-frame-restoration.js')<src.indexOf('modules/lorefy-profile-shop.js'));
  }
  assert.match(read('modules/lorefy-frame-motion.js'),/original\.renderer==='restored'/);
});
test('tall page artwork keeps its texture resolution without changing avatar defaults',()=>{
  const scales=[],ctx={drawImage(){},getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(255)}),beginPath(){},lineTo(){},moveTo(){},closePath(){},clip(){},save(){},restore(){},transform(){},scale:(...v)=>scales.push(v)};
  const window={document:{createElement:()=>({getContext:()=>ctx})}};
  vm.runInNewContext(read('modules/lorefy-bitmap-rig.js'),{window,Uint8ClampedArray});
  const api=window.LorefyBitmapRig,high=api.prepare({},2,1024),standard=api.prepare({},2);
  assert.equal(high.size,1024);assert.equal(standard.size,512);
  assert.equal(Math.max(...high.triangles.flatMap(t=>t.points.flat())),1024);
  api.paint(ctx,high,high.vertices,320,850);assert.deepEqual(scales[0],[320/1024,850/1024]);
});

test('a transient restoration manifest failure can recover without reloading the application',async()=>{
  const rows=JSON.parse(read('launch/decorations/refined/manifest.json'));let calls=0;
  const window={LorefyBitmapRig:{},fetch:async()=>++calls===1?{ok:false}:{ok:true,json:async()=>rows},Image:class{set src(_){throw Error('fixture-image');}}};
  vm.runInNewContext(read('modules/lorefy-frame-restoration.js'),{window});
  await assert.rejects(window.LorefyFrameRestoration.load('observatory'),/Missing frame calibration/);
  await assert.rejects(window.LorefyFrameRestoration.load('observatory'),/fixture-image/);
  assert.equal(calls,2);
  assert.match(read('sw.js'),/'\/launch\/decorations\/refined\/'/,'Cache viewed static frame artwork for offline reuse');
});

test('restoring the basic catalog cannot enable beta or paid collections that are not installed',()=>{
  const window={LorefyFrameRestoration:require('../modules/lorefy-frame-restoration.js')};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window});
  const api=window.LorefyProfileShop;
  assert.equal(api.installRestoration(JSON.parse(read('launch/decorations/refined/manifest.json'))),true);
  assert.equal(api.bundles.length,3);assert.ok(api.bundles.every(p=>p.motionRenderer==='restored'));
  assert.equal(api.findBundle('pfpvibes-bunny-hug'),null);
});

test('offscreen restored storefront cards do not eagerly allocate bitmap rigs',async()=>{
  let loads=0,notify;
  const context={setTransform(){},clearRect(){},save(){},restore(){},translate(){}};
  const canvas={style:{},dataset:{},setAttribute(){},getContext:()=>context,remove(){}};
  const window={document:{hidden:false,createElement:()=>canvas,addEventListener(){},documentElement:{getAttribute:()=>null}},
    getComputedStyle:()=>({borderLeftWidth:'0',borderTopWidth:'0'}),requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    IntersectionObserver:class{constructor(fn){notify=fn;}observe(){}disconnect(){}},
    LorefyOriginalRenderers:{restored:{load:async()=>{loads++;},paint(){}}}};
  vm.runInNewContext(read('modules/lorefy-frame-motion.js'),{window});
  const node={offsetWidth:176,offsetHeight:176,isConnected:true,closest:()=>null,appendChild(){},classList:{add(){},remove(){}}};
  const dispose=window.LorefyFrameMotion.mount(node,{original:{id:'observatory',renderer:'restored'}},'avatar');
  assert.equal(loads,0);notify([{isIntersecting:false}]);assert.equal(loads,0);
  notify([{isIntersecting:true}]);await Promise.resolve();assert.equal(loads,1);
  notify([{isIntersecting:true}]);assert.equal(loads,1);dispose();
});

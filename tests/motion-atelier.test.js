const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const modulePath=path.join(root,'modules/lorefy-motion-atelier.js');

test('six material-specific wave motions loop smoothly and remain bounded',()=>{
  assert.ok(fs.existsSync(modulePath),'The material animation renderer must exist');
  const api=require(modulePath),signatures=new Set();
  assert.equal(api.themes.length,6);
  for(const theme of api.themes){
    const poses=[0,1.2,3.5,9].map(t=>api.pose(theme.id,t,.37,2));
    assert.notDeepEqual(poses[0],poses[1],theme.id+' must animate its body');
    signatures.add(JSON.stringify(poses));
    for(let t=0;t<=12;t+=.1){
      const p=api.pose(theme.id,t,.7,1);
      assert.ok(Object.values(p).every(Number.isFinite));
      assert.ok(Math.abs(p.wave)<=1.01 && Math.abs(p.x)<=1.01 && Math.abs(p.y)<=1.01);
      assert.ok(p.scaleY>=.6&&p.scaleY<=1.15);
    }
    const first=api.pose(theme.id,0,.37,2),last=api.pose(theme.id,12,.37,2);
    for(const key of Object.keys(first)){
      const delta=key==='angle'?Math.sin((first[key]-last[key])/2):first[key]-last[key];
      assert.ok(Math.abs(delta)<1e-8,'No jump at the loop join');
    }
  }
  assert.equal(signatures.size,6,'Each material needs its own motion');
  assert.throws(()=>api.pose('unknown',1,.5,0));
});

function shop(host='127.0.0.1',mode='demo',search='?decorationLab=1'){
  const window={location:{hostname:host,search},LorefyBackend:{mode}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
  return window.LorefyProfileShop;
}
test('atelier catalog is local-demo only and rejects remote or duplicated assets',()=>{
  const api=shop();
  assert.equal(typeof api.installAtelierCollections,'function');
  const items=JSON.parse(read('qa/motion-atelier/collections.json'));
  assert.equal(items.length,6);
  assert.equal(api.installAtelierCollections(items),true);
  assert.equal(api.offered.filter(p=>p.renderer==='atelier').length,6);
  assert.equal(api.installAtelierCollections(items),true,'Repeated install is idempotent');
  assert.equal(api.bundles.filter(p=>p.renderer==='atelier').length,6);
  assert.equal(shop('lorefy.app').installAtelierCollections(items),false);
  assert.equal(shop('127.0.0.1','live').installAtelierCollections(items),false);
  assert.equal(shop('127.0.0.1','demo','').installAtelierCollections(items),false);
  assert.equal(api.installAtelierCollections([items[0],items[0],...items.slice(2)]),false);
  assert.equal(api.installAtelierCollections(items.map((p,i)=>i? p:{...p,overlay:'https://example.com/evil.png'})),false);
  for(const p of items){
    assert.ok(p.geometry.size>=.4&&p.geometry.size<=.85);
    assert.equal(p.releaseAllowed,false);
    const meta=JSON.parse(read(`qa/motion-atelier/${p.artId}/parts.json`));
    for(const kind of ['avatar','page']){
      assert.ok(meta[kind].parts.length>=2,'Use independently moving illustrated ornaments');
      for(const file of [kind+'.png',kind+'-base.png',...meta[kind].parts.map(a=>a.file)]){
        const bytes=fs.readFileSync(path.join(root,'qa/motion-atelier',p.artId,file));
        assert.equal(bytes.subarray(1,4).toString(),'PNG');
      }
    }
  }
});

test('only the new collection bypasses reduced-motion timestamps and uses the shared scheduler',()=>{
  const src=read('modules/lorefy-frame-motion.js');
  assert.match(src,/original\.renderer==='atelier'/);
  assert.match(src,/\['illustrated','autumn','original','atelier'\]/);
  assert.ok(fs.existsSync(modulePath));
  const renderer=read('modules/lorefy-motion-atelier.js');
  assert.doesNotMatch(renderer,/requestAnimationFrame|setInterval/);
  assert.match(renderer,/frame\.profileHeader/);
  assert.match(renderer,/clip\('evenodd'\)/,'Protect the portrait while artwork ripples');
  assert.match(read('index.html'),/modules\/lorefy-motion-atelier\.js/);
});

test('thick atelier rims reserve identity space and page connectors preserve their material',()=>{
  assert.match(read('modules/lorefy-profile-shop.js'),/--atelier-avatar-bottom-gap/);
  assert.match(read('styles/lorefy-frame-motion.css'),/has-atelier-avatar/);
  assert.match(read('modules/lorefy-frame-motion.js'),/materialConnectors/);
});

test('the mounted atelier renderer receives advancing time under both reduce-motion preferences',async()=>{
  for(const renderer of ['atelier','original']){
    const jobs=[],paints=[];
    const ctx={setTransform(){},clearRect(){},save(){},restore(){},translate(){}};
    const canvas={style:{},dataset:{},setAttribute(){},getContext:()=>ctx,remove(){}};
    const window={document:{hidden:false,createElement:()=>canvas,addEventListener(){},documentElement:{getAttribute:()=> 'reduced'}},
      requestAnimationFrame:fn=>{jobs.push(fn);return jobs.length;},cancelAnimationFrame(){},
      getComputedStyle:()=>({borderLeftWidth:'0',borderTopWidth:'0'}),matchMedia:()=>({matches:true}),
      LorefyOriginalRenderers:{[renderer]:{load:async()=>true,paint:(_c,_id,_kind,time)=>paints.push(time)}}};
    vm.runInNewContext(read('modules/lorefy-frame-motion.js'),{window});
    const element={offsetWidth:160,offsetHeight:160,isConnected:true,appendChild(){},closest:()=>null,classList:{add(){},remove(){}}};
    const dispose=window.LorefyFrameMotion.mount(element,{original:{id:'inkstorm',renderer}},'avatar');
    await Promise.resolve();jobs.shift()(1000);jobs.shift()(2000);
    assert.deepEqual(paints,renderer==='atelier'?[0,1,2]:[0,0,0]);
    dispose();
  }
});

test('every atelier header rises between the controls with substantial material and exact side joints',()=>{
  const api=require(modulePath),signatures=new Set();
  assert.equal(typeof api.headerRibbon,'function');
  for(const theme of api.themes)for(const width of [320,440]){
    assert.ok(fs.existsSync(path.join(root,'qa/motion-atelier',theme.id,'header.png')),'Use a complete illustrated ribbon rather than a repeated solid patch');
    const line=api.layout(theme.id,width,850).line;
    const a=api.headerRibbon(theme.id,0,width,line),b=api.headerRibbon(theme.id,1.7,width,line);
    assert.equal(a.length,225);
    assert.notDeepEqual(a,b,'The header itself must undulate over time');
    assert.ok(Math.max(...a.map(p=>p.y))-Math.min(...a.map(p=>p.y))>5);
    for(const p of [...a,...b]){
      assert.ok([p.x,p.y,p.half].every(Number.isFinite));
      assert.ok(p.half>=6&&p.half<=12,'Keep the illustrated material visible without oversized rails');
      assert.ok(p.x>=2&&p.x<=width-2);
      if(width>=380&&(p.x-p.half<114||p.x+p.half>width-114))assert.ok(p.y-p.half>=61,'Do not cover controls');
      assert.ok(p.y+p.half<=line+29,'Do not spread into the profile content');
    }
    const last=api.headerRibbon(theme.id,12,width,line);
    a.forEach((p,i)=>assert.ok(Math.abs(p.y-last[i].y)<1e-8));
    if(width===440)signatures.add(JSON.stringify(a));
  }
  assert.equal(signatures.size,6);
});

test('the atelier ribbon replaces the cropped static crest instead of adding a second header',()=>{
  const motion=require('../modules/lorefy-frame-motion.js'),calls=[];
  const c={drawImage:(...a)=>calls.push(a),save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},rotate(){}};
  motion.paintPageArt(c,{}, {x:0,y:0,w:340,h:768,materialConnectors:true},0,440,956);
  assert.ok(calls.length>3);
  assert.ok(calls.every(a=>a[2]>0),'No hard-cut static top crest or detached corners over the animated ribbon');
  assert.match(read('styles/lorefy-frame-motion.css'),/\.has-atelier-avatar\[data-profile-layout='reader'\] \.lf-reader-banner > \.lf-reader-back\s*\{\s*display:none !important/,'Keep only the Reader toolbar back action above this ribbon');
});

test('all six perimeter ribbons animate both sides and footer inside their protected edge bands',()=>{
  const api=require(modulePath);
  assert.equal(typeof api.borderRibbon,'function');
  const signatures=new Set();
  for(const theme of api.themes)for(const [w,h]of [[144,220],[320,740],[440,956]]){
    const first=api.borderRibbon(theme.id,0,w,h,64),later=api.borderRibbon(theme.id,1.3,w,h,64);
    assert.ok(first.length>250&&first.length<400,'Bound the mesh work per frame');
    for(const edge of ['left','right','bottom']){
      assert.notDeepEqual(first.filter(p=>p.edge===edge),later.filter(p=>p.edge===edge),edge+' must move');
    }
    for(let t=0;t<=12;t+=.5){
      const points=api.borderRibbon(theme.id,t,w,h,64);
      for(let i=0;i<points.length;i++){
        const p=points[i];assert.ok([p.x,p.y,p.half].every(Number.isFinite));
        assert.ok(p.half>4&&p.half<=10);
        assert.ok(p.x-p.half>=0&&p.x+p.half<=w&&p.y-p.half>=64&&p.y+p.half<=h);
        if(p.edge==='left')assert.ok(p.x+p.half<=24);
        if(p.edge==='right')assert.ok(p.x-p.half>=w-24);
        if(p.edge==='bottom')assert.ok(p.y-p.half>=h-12,'Keep the home-indicator gutter clear');
        if(i)assert.ok(Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)<12,'No disconnected corners');
      }
    }
    const last=api.borderRibbon(theme.id,12,w,h,64);
    first.forEach((p,i)=>{for(const key of ['x','y','half'])assert.ok(Math.abs(p[key]-last[i][key])<1e-8);});
    if(w===440)signatures.add(JSON.stringify(first));
  }
  assert.equal(signatures.size,6);
  assert.doesNotMatch(read('modules/lorefy-motion-atelier.js'),/function pageBody|pageCache/,'Do not retain the stretched static side/footer base');
});

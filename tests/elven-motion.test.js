const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ids=['emerald-whisper','duskborn','opal-silk','living-grove','elven-ranger','autumn-court'];

test('all six approved elf designs have calibrated original art and distinct bounded articulated motion',()=>{
  const file=path.join(root,'modules/lorefy-elven-motion.js');
  assert.ok(fs.existsSync(file),'The local elven renderer must exist');
  const api=require(file),catalog=JSON.parse(read('qa/elf-motion/collections.json'));
  assert.deepEqual(api.ids,ids);assert.equal(catalog.length,6);
  const signatures=new Set();
  for(const pack of catalog){
    assert.equal(pack.releaseAllowed,false);assert.equal(pack.id,'elven-'+pack.artId);
    assert.ok(ids.includes(pack.artId));
    assert.ok(pack.geometry.size>=.35&&pack.geometry.size<=.85);
    const meta=JSON.parse(read(`qa/elf-motion/${pack.artId}/rig.json`));
    assert.ok(meta.layers.length>=3&&meta.layers.length<=8);
    for(const kind of ['avatar','page']){
      const bytes=fs.readFileSync(path.join(root,`qa/elf-motion/${pack.artId}/${kind}.png`));
      assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes[25],6);
    }
    const initial=api.sample(pack.artId,0,meta.layers),later=api.sample(pack.artId,1.1,meta.layers);
    assert.notDeepEqual(initial,later);signatures.add(JSON.stringify(later));
    for(let t=0;t<=12;t+=.05){
      const poses=api.sample(pack.artId,t,meta.layers);
      assert.equal(poses.length,meta.layers.length);
      for(const p of poses){
        assert.ok(['rotation','dx','dy','scaleX','scaleY'].every(k=>Number.isFinite(p[k])));
        assert.ok(Math.abs(p.rotation)<=.16&&Math.abs(p.dx)<=.02&&Math.abs(p.dy)<=.02);
        assert.ok(p.scaleX>=.35&&p.scaleX<=1.1&&p.scaleY>=.9&&p.scaleY<=1.1);
      }
      if(pack.artId==='emerald-whisper')for(const [i,layer]of meta.layers.entries())if(layer.kind==='ear')assert.ok(Math.abs(poses[i].rotation)<=.055);
    }
    const final=api.sample(pack.artId,12,meta.layers);
    initial.forEach((p,i)=>Object.keys(p).forEach(k=>assert.ok(Math.abs(p[k]-final[i][k])<1e-8)));
    for(const [w,h]of [[320,740],[440,956]]){
      const first=api.pagePose(pack.artId,0,w,h,64),later=api.pagePose(pack.artId,1.8,w,h,64);
      for(const edge of ['top','left','right','bottom'])assert.notDeepEqual(first.filter(p=>p.edge===edge),later.filter(p=>p.edge===edge));
      for(const p of [...first,...later]){
        assert.ok(p.x-p.size/2>=0&&p.x+p.size/2<=w&&p.y-p.size/2>=64&&p.y+p.size/2<=h);
        assert.ok(p.edge==='top'||p.edge==='bottom'||p.x+p.size/2<=24||p.x-p.size/2>=w-24);
      }
    }
  }
  assert.equal(signatures.size,6);
  assert.throws(()=>api.sample('invalid',1,[]));
  assert.equal(api.validMeta({version:1,layers:[]}),false);
  const bad=JSON.parse(read('qa/elf-motion/emerald-whisper/rig.json'));
  bad.layers[0].polygon[0][0]=-1;assert.equal(api.validMeta(bad),false);
  assert.doesNotMatch(read('modules/lorefy-elven-motion.js'),/requestAnimationFrame|setInterval/);
});

test('elven motion uses the existing shared scheduler even with reduced-motion preference and disposes cleanly',async()=>{
  const jobs=[],paints=[];let removed=0,canceled=0;
  const ctx={setTransform(){},clearRect(){},save(){},restore(){},translate(){}};
  const canvas={style:{},dataset:{},setAttribute(){},getContext:()=>ctx,remove(){removed++;}};
  const window={document:{hidden:false,createElement:()=>canvas,addEventListener(){},documentElement:{getAttribute:()=> 'reduced'}},
    requestAnimationFrame:fn=>{jobs.push(fn);return jobs.length;},cancelAnimationFrame(){canceled++;},
    getComputedStyle:()=>({borderLeftWidth:'0',borderTopWidth:'0'}),matchMedia:()=>({matches:true}),
    LorefyOriginalRenderers:{elven:{load:async()=>true,paint:(_c,_id,_kind,t)=>paints.push(t)}}};
  vm.runInNewContext(read('modules/lorefy-frame-motion.js'),{window});
  const node={offsetWidth:176,offsetHeight:176,isConnected:true,appendChild(){},closest:()=>null,classList:{add(){},remove(){}}};
  const dispose=window.LorefyFrameMotion.mount(node,{original:{id:'emerald-whisper',renderer:'elven'}},'avatar');
  await Promise.resolve();jobs.shift()(1000);jobs.shift()(2000);assert.deepEqual(paints,[0,1,2]);
  dispose();assert.equal(removed,1);assert.equal(canceled,1);
});

function shop(host='127.0.0.1',mode='demo',search='?decorationLab=1'){
  const window={location:{hostname:host,search},LorefyBackend:{mode}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});return window.LorefyProfileShop;
}
test('elf packs are isolated local-demo additions, never a production catalog or media replacement',()=>{
  const api=shop();assert.equal(typeof api.installElvenCollections,'function');
  const catalog=JSON.parse(read('qa/elf-motion/collections.json'));
  assert.equal(api.installElvenCollections(catalog),true);assert.equal(api.installElvenCollections(catalog),true);
  assert.equal(api.bundles.filter(p=>p.renderer==='elven').length,6);
  assert.equal(shop('lorefy.app').installElvenCollections(catalog),false);
  assert.equal(shop('127.0.0.1','live').installElvenCollections(catalog),false);
  assert.equal(shop('127.0.0.1','demo','').installElvenCollections(catalog),false);
  assert.equal(api.installElvenCollections([catalog[0],catalog[0],...catalog.slice(2)]),false);
  assert.equal(api.installElvenCollections(catalog.map((p,i)=>i?p:{...p,overlay:'https://example.com/x.png'})),false);
  const src=read('modules/lorefy-frame-motion.js');
  assert.match(src,/original\.renderer==='elven'/);
  assert.match(read('index.html'),/modules\/lorefy-elven-motion\.js/);
});

test('elf page materials move on every edge without stretching tiny source bands',()=>{
  const api=require('../modules/lorefy-elven-motion.js'),signatures=new Set();
  for(const id of ids)for(const w of [320,440]){
    const a=api.perimeter(id,0,w,850,64),b=api.perimeter(id,1.7,w,850,64);
    assert.ok(a.length>100);signatures.add(JSON.stringify(b.slice(0,10)));
    for(const edge of ['top','left','right','bottom']){
      assert.notDeepEqual(a.filter(p=>p.edge===edge),b.filter(p=>p.edge===edge),id+' '+edge);
    }
    for(const p of [...a,...b]){
      assert.ok(Number.isFinite(p.x+p.y+p.half));
      assert.ok(p.x-p.half>=0&&p.x+p.half<=w);
      assert.ok(p.y-p.half>=64&&p.y+p.half<=850);
      if(p.edge==='left'||p.edge==='right')assert.ok(p.x+p.half<=24||p.x-p.half>=w-24);
    }
    const end=api.perimeter(id,12,w,850,64);
    a.forEach((p,i)=>['x','y','half'].forEach(k=>assert.ok(Math.abs(p[k]-end[i][k])<1e-8)));
  }
  assert.equal(signatures.size,12);
  assert.doesNotMatch(read('modules/lorefy-elven-motion.js'),/\.paintPageArt\(/);
});

test('elf portraits fill the actual frame opening and deformation has no cut-out layer seams',()=>{
  const api=require('../modules/lorefy-elven-motion.js');
  for(const id of ids){
    const m=JSON.parse(read(`qa/elf-motion/${id}/rig.json`));
    assert.ok(m.geometry.size>m.aperture.size+.05,'Portrait must reach the rim, not stop at a dangling jewel');
    assert.equal(m.portraitClip.length,72);
    assert.ok(m.portraitClip.every(p=>p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1)));
    const vertices=api.skin(id,1.1,m.layers,[[.5,.5],[0,1],[.5,.02]]);
    assert.equal(vertices.length,3);assert.deepEqual(vertices[1],[0,1]);
    assert.ok(vertices.every(p=>p.every(Number.isFinite)));
  }
  assert.doesNotMatch(read('modules/lorefy-elven-motion.js'),/destination-out/,'Do not punch polygon holes in the frame');
  assert.match(read('styles/lorefy-frame-motion.css'),/has-page-decoration\.has-elven-page/,'Reserve a separate crest row above the portrait');
});

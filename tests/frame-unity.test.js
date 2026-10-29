const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const motion=require('../modules/lorefy-frame-motion.js');
const bitmap=require('../modules/lorefy-bitmap-rig.js');
const restored=require('../modules/lorefy-frame-restoration.js');
const read=p=>fs.readFileSync(p,'utf8');

test('the phone preview centers its scaled frame without a min-content grid overflow',()=>{
  assert.match(read('phone-preview.html'),/grid-template-columns:\s*minmax\(0,1fr\)/);
});

test('ribbon sampling removes transparent gutters without turning the material into a hairline',()=>{
  assert.equal(typeof bitmap.ribbonPixels,'function');
  const w=20,h=100,pixels=new Uint8ClampedArray(w*h*4);
  for(let x=0;x<w;x++)for(let y=42;y<58;y++){
    const k=(y*w+x)*4;pixels[k]=200;pixels[k+1]=120;pixels[k+2]=60;pixels[k+3]=255;
  }
  const out=bitmap.ribbonPixels(pixels,w,h);
  assert.equal(out.width,w);assert.equal(out.height,32);
  for(let x=0;x<w;x++){
    let opaque=0;for(let y=0;y<out.height;y++)if(out.data[(y*w+x)*4+3]>128)opaque++;
    assert.ok(opaque>=24);
  }
});

test('crest connectors terminate on the visible artwork rather than transparent crop corners',()=>{
  assert.equal(typeof bitmap.headerAnchorPixels,'function');
  const w=100,h=100,pixels=new Uint8ClampedArray(w*h*4);
  for(const x of [12,87])for(let y=35;y<=64;y++)pixels[(y*w+x)*4+3]=255;
  const anchors=bitmap.headerAnchorPixels(pixels,w,h);
  assert.ok(anchors[0].x<.2&&anchors[1].x>.8);
  assert.ok(anchors.every(p=>p.y>=.6&&p.y<.7));
  const cap={...motion.profileHeader(440),anchors:anchors.map(p=>({x:128+p.x*184,y:10+p.y*50}))};
  const joins=[{x:12,y:88,dx:0,dy:-1,half:7},{x:428,y:88,dx:0,dy:-1,half:7}];
  for(const [i,path]of motion.headerConnectors(440,cap,joins).entries()){
    assert.equal(path.at(-1).x,cap.anchors[i].x);assert.equal(path.at(-1).y,cap.anchors[i].y);
  }
});

test('all animated families share a toolbar-safe crest and exact side-join geometry',()=>{
  assert.equal(typeof motion.profileHeader,'function');
  assert.equal(typeof motion.headerConnectors,'function');
  for(const w of [320,375,390,440,768])for(const ratio of [.2,.43,.7]){
    const cap=motion.profileHeader(w,ratio);
    assert.deepEqual(restored.headerBox(w,ratio),cap);
    assert.ok(cap.width<=184&&cap.height<=64);
    assert.ok(cap.y>=0&&cap.y+cap.height<=cap.line);
    const joins=[{x:12,y:cap.line+24,dx:0,dy:-1,half:7},{x:w-12,y:cap.line+24,dx:0,dy:-1,half:7}];
    for(const [i,points]of motion.headerConnectors(w,cap,joins,u=>Math.sin(u)).entries()){
      assert.deepEqual([points[0].x,points[0].y],[joins[i].x,joins[i].y]);
      const a=points[1],b=points[0];assert.ok(Math.abs((a.x-b.x)/(a.y-b.y))<.1);
      for(const p of points){
        assert.ok(Number.isFinite(p.x+p.y+p.half));
        if(w>=380&&(p.x-p.half<114||p.x+p.half>w-114))assert.ok(p.y-p.half>=61);
      }
    }
  }
  for(const file of ['modules/lorefy-elven-motion.js','modules/lorefy-motion-atelier.js']){
    assert.match(read(file),/\.profileHeader\(/);
    assert.match(read(file),/\.headerConnectors\(/);
  }
});

test('all 51 portrait frames use one responsive artwork budget instead of family-specific sizes',()=>{
  const window={location:{hostname:'127.0.0.1',search:'?decorationLab=1'},LorefyBackend:{mode:'demo'},LOREFY_RELEASE:{betaProfileDecorations:true},LorefyFrameRestoration:restored};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
  const shop=window.LorefyProfileShop;
  assert.equal(shop.installBetaCollections(JSON.parse(read('launch/decorations/pfpvibes/collections.json'))),true);
  assert.equal(shop.installShopCatalog(JSON.parse(read('launch/decorations/originals/catalog.json'))),true);
  shop.installAtelierCollections(JSON.parse(read('qa/motion-atelier/collections.json')));
  shop.installElvenCollections(JSON.parse(read('qa/elf-motion/collections.json')));
  shop.installRestoration(JSON.parse(read('launch/decorations/refined/manifest.json')));
  assert.equal(typeof shop.avatarSize,'function');
  assert.equal(shop.bundles.length,51);
  for(const pack of shop.bundles)for(const w of [320,375,440]){
    const size=shop.avatarSize(pack.id,w),g=shop.frameGeometry(pack.id);
    assert.ok(size<=96);
    assert.ok(size/g.size<=(w<380?136:160)+.01);
  }
  const css=read('styles/lorefy-frame-motion.css');
  assert.match(css,/has-calibrated-portrait/);
  assert.match(css,/has-page-decoration\s*\{[^}]*--profile-cover-height:[^;]*88px/);
  assert.match(css,/--reader-layout-inline:var\(--profile-frame-safe-inline,32px\)/,'Reader ID rules must use the same content gutter as the page rails');
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..'),file=path.join(root,'modules/lorefy-avatar-rig.js');

test('PFP animation has independent articulated layers rather than whole-image strip wobble',()=>{
  assert.ok(fs.existsSync(file),'The avatar layer rig must exist');
  const rig=require(file),ids=['inkstorm','star-atlas','sakura-wind','tidal-glass','signal-zero','paper-flight'];
  const signatures=new Set();
  for(const id of ids){
    const meta=JSON.parse(fs.readFileSync(path.join(root,'qa/motion-atelier',id,'parts.json'))).avatar;
    const first=rig.sample(id,0,meta),later=rig.sample(id,1.1,meta),last=rig.sample(id,12,meta);
    assert.notDeepEqual(first,later,id+' must perform a real action');
    signatures.add(first.action);
    assert.ok(first.body.length>=1&&first.parts.length>=2);
    for(let t=0;t<=12;t+=.15){
      const frame=rig.sample(id,t,meta);
      for(const p of frame.parts){
        assert.ok(['x','y','size','rotation','opacity','wing'].every(k=>Number.isFinite(p[k])));
        assert.ok(p.x-p.size/2>=0&&p.x+p.size/2<=1&&p.y-p.size/2>=0&&p.y+p.size/2<=1);
        assert.ok(p.opacity>=0&&p.opacity<=1);
      }
      for(const p of frame.body)assert.ok(['rotation','scale','dx','dy'].every(k=>Number.isFinite(p[k])));
    }
    for(const [i,p]of first.body.entries())for(const k of ['rotation','scale','dx','dy'])assert.ok(Math.abs(p[k]-last.body[i][k])<1e-7);
  }
  assert.equal(signatures.size,6);
  assert.throws(()=>rig.sample('invalid',0,{}));
  assert.throws(()=>rig.sample('constructor',0,{}),/Unknown avatar rig/);
  const src=fs.readFileSync(path.join(root,'modules/lorefy-motion-atelier.js'),'utf8');
  const avatar=src.slice(src.indexOf("if(kind==='avatar')"),src.indexOf('    }else{',src.indexOf("if(kind==='avatar')")));
  assert.doesNotMatch(avatar,/ripple\(/,'Do not send the PFP through the old whole-PNG shear');
  assert.match(avatar,/LorefyAvatarRig\.paint/);
  assert.doesNotMatch(fs.readFileSync(file,'utf8'),/if\(frame\.flow\)/,'The zero-phase fluid layer must not blink off at the loop join');
});

test('the dedicated PFP rig loads before its renderer in the app and both QA contexts',()=>{
  for(const source of ['index.html','qa/motion-atelier.html','qa/profile-header.html','qa/avatar-animation.html']){
    const text=fs.readFileSync(path.join(root,source),'utf8');
    assert.ok(text.indexOf('modules/lorefy-avatar-rig.js')<text.indexOf('modules/lorefy-motion-atelier.js'));
    assert.ok(text.includes('modules/lorefy-avatar-rig.js'));
  }
  const exporter=fs.readFileSync(path.join(root,'qa/avatar-animation.html'),'utf8');
  assert.match(exporter,/portrait\.naturalWidth-crop/,'The proof video must preserve the same cover crop as the live PFP');
});

test('water crests, ballistic spray, gears, panels and paper wings have separate timelines',()=>{
  assert.ok(fs.existsSync(file));const rig=require(file);
  const meta=JSON.parse(fs.readFileSync(path.join(root,'qa/motion-atelier/tidal-glass/parts.json'))).avatar;
  const water=rig.sample('tidal-glass',1,meta);
  assert.equal(water.body.length,3);assert.ok(water.parts.length>=12);assert.ok(water.flow>0);
  assert.ok(new Set(water.body.map(p=>p.rotation)).size===3);
  assert.ok(new Set(water.parts.map(p=>p.opacity)).size>3,'Spray must launch and fade, not orbit rigidly');
  const paper=rig.sample('paper-flight',.5,meta),paperNext=rig.sample('paper-flight',.75,meta);
  assert.notEqual(paper.parts[0].wing,paperNext.parts[0].wing,'Articulated wings need their own channel');
  assert.equal(rig.sample('signal-zero',1,meta).body.length,8);
  assert.equal(rig.sample('star-atlas',1,meta).body.length,2);
});

test('independent fluid crests have sufficient material overlap to avoid hard pie-slice gaps',()=>{
  const masks=[],ctx={save(){},restore(){},beginPath(){},moveTo(){},closePath(){},clip(){},drawImage(){},arc(){},
    createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:mask=>masks.push(mask)};
  const window={document:{createElement:()=>({getContext:()=>ctx})}};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{window});
  const meta=JSON.parse(fs.readFileSync(path.join(root,'qa/motion-atelier/tidal-glass/parts.json'))).avatar;
  const result=window.LorefyAvatarRig.prepare({meta:{avatar:meta},avatar:{width:512,height:512},avatarParts:[]},'tidal-glass');
  assert.equal(result.layers.length,3);
  assert.equal(masks.length,3,'Each crest needs a feathered alpha mask rather than a hard radial cut');
  assert.ok(masks.every(m=>m.data.some((x,i)=>i%4===3&&x>0&&x<255)));
});

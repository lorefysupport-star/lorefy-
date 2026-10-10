const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const manifest=()=>JSON.parse(read('qa/frame-lab/collections.json'));
function setup(host='localhost',search='?decorationLab=1',mode='demo') {
  const values={};const root={location:{hostname:host,search},LorefyBackend:{mode,user:{id:'a'}},
    localStorage:{getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v},dispatchEvent:()=>{},CustomEvent:class{}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window:root,URLSearchParams});
  return {root,api:root.LorefyProfileShop,values};
}
test('24 exported overlay designs are explicitly isolated from public/native release',()=>{
  const data=manifest();assert.equal(data.length,24);
  for(const item of data){assert.ok(item.names.ar && item.names.en);assert.equal(item.releaseAllowed,false);
    assert.ok(fs.existsSync(path.join(__dirname,'..',item.overlay)));}
  for(const s of [setup('lorefy.app'),setup('localhost','?decorationLab=1','live'),setup('localhost','')]) {
    assert.equal(s.api.installLocalCollections(data),false);assert.equal(s.api.bundles.length,3);
  }
});
test('local application does not replace the normal account decoration record',async()=>{
  const s=setup();assert.equal(s.api.installLocalCollections(manifest()),true);
  assert.equal(s.api.bundles.length,27);
  s.values['lorefy.user.profileDecoration.v1']='{"ownerId":"a","frame":"observatory"}';
  await s.api.applyDecoration('pfpvibes-ghost-orbit','all','a');
  assert.equal(s.api.readDecoration(s.root.localStorage,'a').page,'pfpvibes-ghost-orbit');
  assert.equal(JSON.parse(s.values['lorefy.user.profileDecoration.v1']).frame,'observatory');
  assert.equal(s.api.frameGeometry('pfpvibes-ghost-orbit').size,.78);
});
test('local manifest cannot register remote assets or untrusted IDs',()=>{
  const s=setup();assert.equal(s.api.installLocalCollections([{...manifest()[0],overlay:'https://evil.test/file.png'}]),false);
  assert.equal(s.api.bundles.length,3);
});

test('complete rabbit artwork has a calibrated aperture and future geometry cannot leave its canvas',()=>{
  const s=setup();assert.equal(s.api.installLocalCollections(manifest()),true);
  const pack=s.api.bundles.find(p=>p.id==='pfpvibes-bunny-hug');
  assert.equal(pack.overlay,'qa/frame-lab/bunny-hug-complete.png');
  const g=s.api.frameGeometry(pack.id);
  assert.ok(g.cy>.55 && g.size<.78);
  assert.ok(g.cy+g.size/2<1 && g.cx-g.size/2>0);
  const bad=manifest().map(p=>({...p}));bad[0].geometry={cx:.9,cy:.1,size:.8};
  assert.equal(setup().api.installLocalCollections(bad),false);
});

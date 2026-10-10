const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../backend/lorefy-native-photos.js'),'utf8');
function picker(format) {
  let file, changes=0, errors=0;
  const input={dispatchEvent:()=>{changes++;}};
  const root={Capacitor:{isNativePlatform:()=>true,Plugins:{Camera:{getPhoto:async()=>({format,base64String:'YWJj'})}}},
    atob:()=> 'abc',File:class{constructor(bytes,name,options){Object.assign(this,{bytes,name,type:options.type});}},
    DataTransfer:class{constructor(){this.files=[];this.items={add:f=>{file=f;this.files.push(f);}};}},
    Event:class{},CustomEvent:class{},dispatchEvent:()=>{errors++;}};
  vm.runInNewContext(source,{window:root,Uint8Array});
  return {run:()=>root.LorefyNativePhotos.pickInto(input),file:()=>file,changes:()=>changes,errors:()=>errors};
}
for(const [format,extension,mime] of [['png','png','image/png'],['jpeg','jpg','image/jpeg'],['webp','webp','image/webp']]) {
  test('native '+format+' photo keeps matching extension and MIME',async()=>{
    const p=picker(format);
    assert.equal(await p.run(),true);
    assert.equal(p.file().name,'lorefy-photo.'+extension);
    assert.equal(p.file().type,mime);
    assert.equal(p.changes(),1);
  });
}
test('unsupported native photo format is not disguised as JPEG',async()=>{
  const p=picker('heic');
  assert.equal(await p.run(),false);
  assert.equal(p.changes(),0);
  assert.equal(p.errors(),1);
});

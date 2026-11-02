const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{createRequire}=require('node:module');
const semver=require('semver'),lock=require('../package-lock.json'),toolRequire=createRequire(require.resolve('rimraf'));
const {glob,globSync}=toolRequire('glob'),{rimraf}=require('rimraf');
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lorefy-tooling-'));
 for(const name of ['keep space/keep.txt','remove/a.txt','remove/nested/b.txt','other/c.txt']){const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'fixture');}
 return {root,cleanup(){assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+'lorefy-tooling-'));fs.rmSync(root,{recursive:true,force:true});}};
}
test('tooling lock contains only patched glob and minimatch resolutions',()=>{
 for(const [name,min] of [['glob','14.0.2'],['minimatch','11.0.1']]){
  const entries=Object.entries(lock.packages).filter(([p])=>p.endsWith('/'+name));assert.ok(entries.length);
  for(const [p,v] of entries)assert.ok(semver.gte(v.version,min),p+' is still '+v.version);
 }
});
test('rimraf glob dependency preserves async and sync matches, spaces and exclusions',async()=>{
 const f=fixture();try{
  const options={cwd:f.root,nodir:true,ignore:'keep space/**'};
  const expected=['other/c.txt','remove/a.txt','remove/nested/b.txt'].map(p=>p.split('/').join(path.sep));
  assert.deepEqual((await glob('**/*.txt',options)).sort(),expected);
  assert.deepEqual(globSync('**/*.txt',options).sort(),expected);
 }finally{f.cleanup();}
});
test('rimraf retains Capacitor literal sync cleanup and opt-in async glob cleanup',async()=>{
 const f=fixture();try{
  assert.equal(rimraf.sync(path.join(f.root,'remove')),true);assert.equal(fs.existsSync(path.join(f.root,'remove')),false);
  assert.equal(await rimraf(path.join(f.root,'other','*.txt').replaceAll('\\','/'),{glob:true}),true);
  assert.equal(fs.existsSync(path.join(f.root,'other','c.txt')),false);assert.equal(fs.readFileSync(path.join(f.root,'keep space','keep.txt'),'utf8'),'fixture');
 }finally{f.cleanup();}
});
test('glob cancellation rejects without traversing the remaining fixture tree',async()=>{
 const f=fixture();let reads=0;const controller=new AbortController();
 try{
  const customFs={...fs,readdir(...args){reads++;if(reads===1)controller.abort(Error('fixture abort'));return fs.readdir(...args);}};
  await assert.rejects(glob('**/*',{cwd:f.root,fs:customFs,signal:controller.signal}),/fixture abort/);
  await new Promise(setImmediate);await new Promise(setImmediate);assert.ok(reads<=1,'continued reading '+reads+' directories after abort');
 }finally{f.cleanup();}
});

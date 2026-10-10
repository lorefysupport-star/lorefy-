const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const covers = 'lorefy.user.customCovers.v2';
const portraits = 'lorefy.characterCustomImages.v1';
const owner = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const image = 'data:image/jpeg;base64,YQ==';

function harness(values = new Map([['lorefy.activeUser.v1', owner]])) {
  const events = [], uploaded = [], cloud = {};
  const backend = {
    mode:'live', _pullGeneration:1,
    getSession:async()=>({userId:owner}),
    _uploadCustomArtwork:async(user,kind,value)=>{uploaded.push({user,kind,value}); return user+'/'+kind+'/unique.jpg';},
    _storageMediaUrl:async(bucket,value)=>'https://storage.test/'+value+'?token=fresh',
    push:async()=>{for (const key of [covers,portraits]) if(values.has(key)) cloud[key]=values.get(key); return true;}
  };
  const window = {LorefyBackend:backend, addEventListener(){}, dispatchEvent:event=>events.push(event),
    localStorage:{getItem:key=>values.get(key)??null, setItem:(key,value)=>values.set(key,String(value))}};
  const scope = {window, localStorage:window.localStorage, console, URL, setTimeout, clearTimeout,
    CustomEvent:function(type,init){this.type=type;this.detail=init.detail;}, Date};
  vm.runInNewContext(fs.readFileSync(path.join(root,'backend/lorefy-custom-artwork.js'),'utf8'),scope);
  return {api:window.LorefyArtwork,backend,window,values,uploaded,cloud,events};
}

test('uploaded covers persist a durable owner reference, not base64 or an expiring URL',async()=>{
  const h=harness();
  await h.api.saveCover('work',image);
  const saved=JSON.parse(h.values.get(covers)).work;
  assert.equal(saved,'lorefy-artwork:'+owner+'/covers/unique.jpg');
  assert.equal(h.cloud[covers],h.values.get(covers));
  assert.equal(h.uploaded[0].user,owner);
  assert.match(h.api.display(saved),/token=fresh/);
});
test('cold reopen renews the saved portrait reference without changing cloud state',async()=>{
  const h=harness(); await h.api.saveCharacter('hero',image);
  const reopened=harness(new Map(h.values));
  await reopened.api.hydrate(owner);
  const saved=JSON.parse(reopened.values.get(portraits)).hero;
  assert.match(reopened.api.display(saved),/token=fresh/);
  assert.equal(reopened.uploaded.length,0);
  assert.equal(reopened.values.get(portraits),h.cloud[portraits]);
});
test('cloud save cannot report success while a sync is still pending',async()=>{
  const h=harness(); let release;
  h.backend.push=()=>new Promise(resolve=>{release=resolve;});
  let finished=false;
  const save=h.api.saveCover('work','https://cover.test/one.jpg').then(()=>{finished=true;});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(finished,false);
  assert.equal(JSON.parse(h.values.get(covers)).work,'https://cover.test/one.jpg');
  release(true); await save; assert.equal(finished,true);
});
test('upload or storage failure preserves the previous choice and rejects success',async()=>{
  const h=harness(); h.values.set(covers,JSON.stringify({work:'old'}));
  h.backend._uploadCustomArtwork=async()=>{throw Error('upload failed');};
  await assert.rejects(h.api.saveCover('work',image),/upload failed/);
  assert.equal(JSON.parse(h.values.get(covers)).work,'old');
  h.window.localStorage.setItem=()=>{throw Error('quota');};
  await assert.rejects(h.api.saveCover('work','https://cover.test/new'),/quota/);
  assert.equal(JSON.parse(h.values.get(covers)).work,'old');
});
test('failed cloud sync leaves the local choice available for retry, without a success',async()=>{
  const h=harness(); h.backend.push=async()=>{throw Error('offline');};
  await assert.rejects(h.api.saveCharacter('hero',image),/offline/);
  assert.match(JSON.parse(h.values.get(portraits)).hero,/^lorefy-artwork:/);
});
test('account switch during upload cannot write the old owner image into the new account',async()=>{
  const h=harness(); let release;
  h.backend._uploadCustomArtwork=()=>new Promise(resolve=>{release=resolve;});
  const save=h.api.saveCover('work',image);
  await new Promise(resolve=>setImmediate(resolve));
  h.values.set('lorefy.activeUser.v1',other); h.backend._pullGeneration++;
  release(owner+'/covers/old.jpg');
  await assert.rejects(save,/account/i);
  assert.equal(h.values.has(covers),false);
});
test('simultaneous changes and resetting persist without dropping other entries',async()=>{
  const h=harness();
  await Promise.all([h.api.saveCover('one','https://cover.test/1'),h.api.saveCover('two','https://cover.test/2')]);
  await h.api.saveCover('one','');
  assert.deepEqual(JSON.parse(h.cloud[covers]),{two:'https://cover.test/2'});
});
test('compiled cover picker and both portrait pickers await durable saving',()=>{
  const app=fs.readFileSync(path.join(root,'uploads/files/lorefy-app.js'),'utf8');
  const growth=fs.readFileSync(path.join(root,'modules/lorefy-growth-features.js'),'utf8');
  assert.match(app,/LorefyArtwork\.saveCover/);
  assert.match(app,/LorefyArtwork\.display\(r,"covers"\)/);
  assert.match(growth,/await global\.LorefyArtwork\.saveCharacter/);
  assert.match(growth,/await setCharacterImage/);
  assert.match(growth,/await cbSetCustomImg/);
});
test('public profile resolves owner storage references without reading local viewer choices',async()=>{
  const window={};
  vm.runInNewContext(fs.readFileSync(path.join(root,'backend/lorefy-backend.js'),'utf8'),{window, console, URL, setTimeout, clearTimeout});
  const b=window.LorefyBackend; b.mode='live'; b.getSession=async()=>({userId:other});
  b.client={rpc:async name=>({data:name==='get_public_profile_social'?{id:owner}: {
    custom_work_covers:{work:'lorefy-artwork:'+owner+'/covers/a.jpg'},
    custom_character_images:{hero:'lorefy-artwork:'+owner+'/characters/b.jpg'}
  }}),from:()=>({select:()=>({eq:()=>({is:()=>({eq:async()=>({count:0})})})})})};
  const requests=[];
  b._storageMediaUrl=async(bucket,value)=>{requests.push({bucket,value});return value?'https://storage.test/'+value:'';};
  const result=await b.getPublicProfile(owner);
  assert.equal(result.custom_work_covers.work,'https://storage.test/'+owner+'/covers/a.jpg');
  assert.equal(result.custom_character_images.hero,'https://storage.test/'+owner+'/characters/b.jpg');
  assert.equal(requests.filter(r=>r.bucket==='custom-covers').length,2);
});
test('community attachment references are renewed instead of persisting signed URLs',async()=>{
  const window={};
  vm.runInNewContext(fs.readFileSync(path.join(root,'backend/lorefy-backend.js'),'utf8'),{window, console, URL, setTimeout, clearTimeout});
  const b=window.LorefyBackend;
  b._storageMediaUrl=async(bucket,value)=>'https://storage.test/'+value+'?token=new';
  const original={kind:'top',items:[{id:'hero',image:'lorefy-artwork:'+owner+'/characters/b.jpg'}]};
  const result=await b._resolveArtworkAttachment(original);
  assert.match(result.items[0].image,/token=new/);
  assert.match(original.items[0].image,/^lorefy-artwork:/);
});

test('backend uploads immutable owner-scoped files with the raster MIME and no upsert',async()=>{
  const requests=[];
  let sequence=0;
  const window={crypto:{randomUUID:()=>`image-${++sequence}`}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'backend/lorefy-backend.js'),'utf8'),{
    window,console,URL,setTimeout,clearTimeout,atob,
    fetch:async(url,options)=>{requests.push({url,options});return {ok:true};}
  });
  const b=window.LorefyBackend;
  b._storageHeaders=async type=>({'content-type':type,Authorization:'Bearer test'});
  b._storageObjectUrl=(prefix,object,bucket)=>`https://storage.test/${bucket}/${object}`;
  const first=await b._uploadCustomArtwork(owner,'covers',image);
  const second=await b._uploadCustomArtwork(owner,'covers',image);
  assert.notEqual(first,second);
  assert.match(first,new RegExp(`^${owner}/covers/image-1\\.jpg$`));
  assert.equal(requests[0].options.method,'POST');
  assert.equal(requests[0].options.headers['content-type'],'image/jpeg');
  assert.equal(requests[0].options.headers['x-upsert'],'false');
  assert.equal(requests[0].options.body.byteLength,1);
  assert.match(requests[0].url,/custom-covers/);
});

test('backend refuses unsupported or oversized images before a storage request',async()=>{
  let requests=0;
  const window={};
  vm.runInNewContext(fs.readFileSync(path.join(root,'backend/lorefy-backend.js'),'utf8'),{
    window,console,URL,setTimeout,clearTimeout,atob,
    fetch:async()=>{requests++;return {ok:true};}
  });
  const b=window.LorefyBackend;
  await assert.rejects(b._uploadCustomArtwork(owner,'covers','data:image/svg+xml;base64,YQ=='),/Invalid/);
  const oversized='data:image/jpeg;base64,'+Buffer.alloc(5*1024*1024+1).toString('base64');
  await assert.rejects(b._uploadCustomArtwork(owner,'characters',oversized),/5 MB/);
  assert.equal(requests,0);
});

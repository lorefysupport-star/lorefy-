const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const metrics = require('../modules/lorefy-reading-metrics');

test('completed works contribute a persisted one-time checkpoint without mutating the legacy input', () => {
  const progress = {};
  const options={library:{a:'تم القراءة'},progressById:progress,getWork:()=>({ch:100,vol:10})};
  const saved=metrics.initializeCompletedProgress(options).progressById;
  const result = metrics.calculateReadingMetrics({...options,progressById:saved});
  assert.equal(result.chapters,100);
  assert.equal(result.hours,20);
  assert.deepEqual(progress,{});
  assert.equal(saved.a.chapter,100);
  assert.deepEqual(metrics.calculateReadingMetrics({...options,progressById:saved,getWork:()=>({ch:999})}),result);
});

test('multiple representations of the same reading do not triple its time', () => {
  const result = metrics.calculateReadingMetrics({library:{a:'reading'},
    progressById:{a:{chapter:10,volume:1,page:200}},getWork:()=>({ch:20})});
  assert.equal(result.minutes,120);
});

test('completed books use pages; unknown totals preserve explicit progress', () => {
  const works={a:{type:'Book',pages:240},b:{ch:0},c:{ch:500}};
  const options={library:{a:'تمت القراءة',b:'تم القراءة',c:'قائمة الأمنيات'},
    progressById:{b:{chapter:8}},getWork:id=>works[id]};
  const result=metrics.calculateReadingMetrics({...options,progressById:metrics.initializeCompletedProgress(options).progressById});
  assert.equal(result.pages,240);
  assert.equal(result.chapters,8);
  assert.equal(result.minutes,456);
});

test('native photo picker returns JPEG files and cancellation preserves the old input', async () => {
  const events=[];
  const input={type:'file',accept:'image/*',files:['old'],dispatchEvent:e=>events.push(e.type)};
  let cancelled=false;
  class Transfer { constructor(){this.files=[];this.items={add:f=>this.files.push(f)}} }
  const root={Capacitor:{isNativePlatform:()=>true,Plugins:{Camera:{getPhoto:async()=>{
    if(cancelled)throw new Error('User cancelled photos app');
    return {base64String:'aGVsbG8=',format:'jpeg'};
  }}}},File:class {constructor(bytes,name,opts){this.name=name;this.type=opts.type}},
  DataTransfer:Transfer,Event:class {constructor(type){this.type=type}},atob,Uint8Array};
  vm.runInNewContext(fs.readFileSync('backend/lorefy-native-photos.js','utf8'),{window:root});
  assert.equal(await root.LorefyNativePhotos.pickInto(input),true);
  assert.equal(input.files[0].type,'image/jpeg');
  assert.deepEqual(events,['change']);
  const previous=input.files;
  cancelled=true;
  assert.equal(await root.LorefyNativePhotos.pickInto(input),false);
  assert.equal(input.files,previous);
});

test('permission registration is single-flight and denied notifications remain disabled', async () => {
  const state=new Map();
  let permission='granted', registrations=0, checks=0;
  const root={Capacitor:{isNativePlatform:()=>true,Plugins:{PushNotifications:{
    checkPermissions:async()=>{checks++;return {receive:permission}},
    register:async()=>{registrations++}
  }}},localStorage:{getItem:key=>state.get(key),setItem:(key,value)=>state.set(key,value)}};
  vm.runInNewContext(fs.readFileSync('backend/lorefy-native-runtime.js','utf8'),{window:root,URL});
  await Promise.all([root.LorefyNativeRuntime.requestPermissionAndRegister(),root.LorefyNativeRuntime.requestPermissionAndRegister()]);
  assert.equal(checks,1);
  assert.equal(registrations,1);
  assert.equal(state.get('lorefy.native.push.enabled.v1'),'true');
  permission='denied';
  assert.equal(await root.LorefyNativeRuntime.setPushEnabled(true),false);
  assert.equal(registrations,1);
  assert.equal(state.get('lorefy.native.push.enabled.v1'),'false');
});

test('custom character photos are account scoped and dark surfaces are neutral', () => {
  assert.match(fs.readFileSync('backend/lorefy-backend.js','utf8'), /"lorefy.characterCustomImages.v1"/);
  const css=fs.readFileSync('styles/lorefy-design-system.css','utf8');
  assert.match(css,/--ui-bg: #0b0b0c/);
  assert.match(css,/--ui-surface: #171719/);
  const html=fs.readFileSync('index.html','utf8');
  assert.match(html,/lorefy-native-photos.js\?v=20261001-build33/);
});

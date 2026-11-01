const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-community.js','utf8');
function harness(){
 const body={children:[]},app={children:[],parentElement:body,inert:false},background={parentElement:app,inert:false},nav={parentElement:app,inert:false};body.children=[app];app.children=[background,nav];
 const context={doc:{body},Map,WeakMap,Array};
 const start=source.indexOf('  var communityIsolationLocks'),end=source.indexOf('  var replyDrafts');
 if(start>=0)vm.runInNewContext(source.slice(start,end),context);
 const isolate=context.isolateCommunityOverlay||(()=>()=>{}),sweep=context.releaseDetachedCommunityOverlays||(()=>{});
 function overlay(){const n={parentElement:app,children:[],inert:false,isConnected:true};app.children.push(n);return n;}
 return{background,nav,overlay,isolate,sweep};
}
test('community modal isolates page/nav and releases only its own changes',()=>{
 const h=harness(),n=h.overlay(),release=h.isolate(n);assert.equal(h.background.inert,true);assert.equal(h.nav.inert,true);assert.equal(n.inert,false);
 release();assert.equal(h.background.inert,false);assert.equal(h.nav.inert,false);
});
for(const outerFirst of [false,true])test('nested community isolation survives '+(outerFirst?'outer':'inner')+' closing first',()=>{
 const h=harness(),outer=h.overlay(),a=h.isolate(outer),inner=h.overlay(),b=h.isolate(inner);
 assert.equal(outer.inert,true);assert.equal(h.nav.inert,true);
 if(outerFirst){a();assert.equal(h.nav.inert,true);b();}else{b();assert.equal(outer.inert,false);assert.equal(h.nav.inert,true);a();}
 assert.equal(h.nav.inert,false);
});
test('community isolation preserves pre-existing inert state and release is idempotent',()=>{
 const h=harness();h.nav.inert=true;const a=h.isolate(h.overlay());a();a();assert.equal(h.nav.inert,true);assert.equal(h.background.inert,false);
});
test('detached community overlays release locks without unlocking a still-open nested layer',()=>{
 const h=harness(),outer=h.overlay(),a=h.isolate(outer),inner=h.overlay(),b=h.isolate(inner);
 outer.isConnected=false;h.sweep();assert.equal(h.nav.inert,true);inner.isConnected=false;h.sweep();assert.equal(h.nav.inert,false);a();b();assert.equal(h.nav.inert,false);
});
test('composer, attachment, editor, conversation and reader posts use the same isolation boundary',()=>{
 for(const name of ['openAttachmentPicker','openComposerSheet','editPost','openThread','openReaderPosts']){
  const start=source.indexOf('function '+name+'('),next=source.indexOf('\n  function ',start+10),block=source.slice(start,next<0?undefined:next);
  assert.match(block,/isolateCommunityOverlay\(/,name);
 }
 assert.match(source,/function scheduleEnhance\([\s\S]*releaseDetachedCommunityOverlays\(/);
});

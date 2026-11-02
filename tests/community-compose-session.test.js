const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),RenderNode=require('./helpers/render-dom');
const source=fs.readFileSync('modules/lorefy-community.js','utf8');
function harness(){
 const storage=new Map([['lorefy.activeUser.v1','owner-a']]),auth=[],pending=[],toasts=[],doc={activeElement:null,documentElement:{lang:'en'}};
 class Node extends RenderNode{
  constructor(tag,attrs={},children=[]){super(tag,attrs,children);Object.defineProperty(this,'isConnected',{get(){let n=this;while(n&&n!==doc.body)n=n.parentNode;return n===doc.body;}});this.style={setProperty(){}};this.disabled=false;}
  get parentElement(){return this.parentNode;}
  get clientHeight(){return 844;}
  getBoundingClientRect(){return{top:0};}
  focus(){doc.activeElement=this;}
  querySelectorAll(selector){const parts=selector.split(' ');if(parts.length===2)return this.querySelector(parts[0])?.querySelectorAll(parts[1])||[];return super.querySelectorAll(selector);}
 }
 doc.body=new Node('body');const host=new Node('main'),opener=new Node('button');doc.body.appendChild(host);host.appendChild(opener);opener.focus();
 function el(tag,attrs,children){return new Node(tag,attrs||{},(Array.isArray(children)?children:[children]).filter(Boolean));}
 const global={localStorage:{getItem:k=>storage.get(k)||null},innerHeight:844,addEventListener(){},removeEventListener(){},setTimeout(){},dispatchEvent(){},CustomEvent:class{},LorefyBackend:{mode:'live',user:{id:'owner-a'},client:{},_communityEpoch:1,publishCommunityPost:input=>new Promise((resolve,reject)=>pending.push({input,resolve,reject})),onAuth(fn){auth.push(fn);return()=>auth.splice(auth.indexOf(fn),1);}}};
 doc.querySelector=s=>host.querySelector(s);
 const scope={global,doc,state:{attachment:null,composeSheet:null,posts:[]},composerDrafts:new Map(),composerViewportCleanup:null,composerReturnFocus:null,identity:()=>({id:global.LorefyBackend.user.id,username:'reader',name:'Reader'}),el,icon:()=>null,avatar:()=>null,quoteAttachment:()=>null,savedAttachments:()=>[{kind:'list',id:'owner-list'}],renderAttachmentPreview:()=>el('div'),communityOverlayHost:()=>host,isolateCommunityOverlay:()=>()=>{},hydrateIcons(){},syncComposerAttachment(){},isDemo:()=>false,normalizePost:p=>p,renderPostFeed(){},toast:m=>toasts.push(m),console:{warn(){}}};
 const helperStart=source.indexOf('  function communitySession(');if(helperStart>=0)vm.runInNewContext(source.slice(helperStart,source.indexOf('\n  function ',helperStart+5)),scope);
 vm.runInNewContext(source.slice(source.indexOf('  function openAttachmentPicker('),source.indexOf('  function syncComposerAttachment(')),scope);
 vm.runInNewContext(source.slice(source.indexOf('  function closeComposerSheet('),source.indexOf('  function createComposerFab(')),scope);
 const open=()=>{scope.openComposerSheet();return scope.state.composeSheet;},input=()=>scope.state.composeSheet.querySelector('.lf-community-compose-text'),submit=sheet=>sheet.querySelector('.lf-community-compose-submit').handlers.click();
 return{global,scope,pending,auth,storage,toasts,open,input,submit,switchOwner(){global.LorefyBackend.user={id:'owner-b'};storage.set('lorefy.activeUser.v1','owner-b');},emit(){auth.slice().forEach(fn=>fn());}};
}
for(const outcome of ['resolve','reject'])test('replaced composer ignores old publish '+outcome,async()=>{
 const h=harness(),old=h.open();h.input().value='Old pending draft';const job=h.submit(old);old.remove();const next=h.open();h.input().value='Newer draft';h.pending[0][outcome](outcome==='reject'?Error('Old failure'):{id:'post'});await job;
 assert.equal(h.scope.state.composeSheet,next);assert.equal(next.isConnected,true);assert.equal(h.input().value,'Newer draft');assert.deepEqual(h.toasts,[]);assert.equal(h.scope.state.posts.length,0);
});
for(const change of ['owner','client','backend','epoch','active'])test('composer cannot dispatch after '+change+' replacement',async()=>{
 const h=harness(),sheet=h.open();h.input().value='Only for opening session';
 if(change==='owner')h.switchOwner();if(change==='client')h.global.LorefyBackend.client={};if(change==='backend')h.global.LorefyBackend={...h.global.LorefyBackend};if(change==='epoch')h.global.LorefyBackend._communityEpoch++;if(change==='active')h.storage.set('lorefy.activeUser.v1','other');
 const job=h.submit(sheet);assert.equal(h.pending.length,0);await job;
});
test('auth account change closes the old editor and retains only its owner draft',()=>{
 const h=harness(),old=h.open();h.input().value='Owner A private draft';h.switchOwner();h.emit();assert.equal(old.isConnected,false);assert.equal(h.auth.length,0);
 h.open();assert.equal(h.input().value,'');h.scope.closeComposerSheet();h.global.LorefyBackend.user={id:'owner-a'};h.storage.set('lorefy.activeUser.v1','owner-a');h.open();assert.equal(h.input().value,'Owner A private draft');
});
test('same-session auth event does not discard the current draft',()=>{
 const h=harness(),sheet=h.open();h.input().value='Keep this';h.emit();assert.equal(sheet.isConnected,true);assert.equal(h.input().value,'Keep this');h.scope.closeComposerSheet();assert.equal(h.auth.length,0);
});
test('current publish retains single-flight dispatch and normal successful close',async()=>{
 const h=harness(),sheet=h.open();h.input().value='Current post';const a=h.submit(sheet),b=h.submit(sheet);assert.equal(h.pending.length,1);h.pending[0].resolve({id:'post'});await Promise.all([a,b]);assert.equal(sheet.isConnected,false);assert.equal(h.scope.state.posts.length,1);assert.equal(h.auth.length,0);
});
test('current failed publish retains the draft and unlocks retry',async()=>{
 const h=harness(),sheet=h.open();h.input().value='Retry me';const job=h.submit(sheet);h.pending[0].reject(Error('Offline'));await job;assert.equal(sheet.isConnected,true);assert.equal(h.input().value,'Retry me');assert.equal(h.input().disabled,false);assert.equal(sheet.querySelector('.lf-community-compose-submit').disabled,false);
});
test('silent client replacement during publish closes only its obsolete busy editor',async()=>{
 const h=harness(),sheet=h.open();h.input().value='Pending original';const job=h.submit(sheet);h.global.LorefyBackend.client={};h.pending[0].resolve({id:'old'});await job;assert.equal(sheet.isConnected,false);assert.equal(h.auth.length,0);assert.equal(h.scope.state.posts.length,0);
});
test('old owner publish cannot dismiss the new owners composer after auth transition',async()=>{
 const h=harness(),sheet=h.open();h.input().value='A pending';const job=h.submit(sheet);h.switchOwner();h.emit();const next=h.open();h.input().value='B draft';h.pending[0].resolve({id:'old'});await job;assert.equal(h.scope.state.composeSheet,next);assert.equal(next.isConnected,true);assert.equal(h.input().value,'B draft');assert.equal(h.scope.state.posts.length,0);
});
for(const viaAuth of [false,true])test('closing composer '+(viaAuth?'by auth change':'normally')+' removes its picker and rejects its old selection',()=>{
 const h=harness(),old=h.open();old.querySelector('.lf-community-compose-tools').children[0].handlers.click();const picker=h.scope.doc.querySelector('.lf-community-picker'),choice=picker.querySelector('.lf-community-picker-option');
 if(viaAuth){h.switchOwner();h.emit();}else h.scope.closeComposerSheet();assert.equal(picker.isConnected,false);
 h.open();choice.handlers.click();assert.equal(h.scope.state.attachment,null);assert.equal(h.scope.state.composeSheet.isConnected,true);
});

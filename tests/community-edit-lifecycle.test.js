const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-community.js','utf8'),start=source.indexOf('  function editPost('),end=source.indexOf('  async function removePost(',start);
function harness(){
 const nodes=[],pending=[],doc={activeElement:null},host={appendChild(n){n.isConnected=true;}};let releases=0;
 function el(tag,attrs={},children=[]){attrs=attrs||{};const n={tag,attrs,children:Array.isArray(children)?children:[children],events:{},disabled:false,isConnected:true,value:'',textContent:attrs.text||'',appendChild(c){this.children.push(c);},addEventListener(k,fn){this.events[k]=fn;},remove(){this.isConnected=false;},focus(){doc.activeElement=this;}};nodes.push(n);return n;}
 doc.querySelector=()=>nodes.find(n=>n.attrs.class==='lf-community-edit'&&n.isConnected)||null;
 const context={doc,el,icon:()=>null,uiText:(ar,en)=>en,communityOverlayHost:()=>host,isolateCommunityOverlay:()=>()=>releases++,hydrateIcons(){},mutatePost:(post,value)=>new Promise((resolve,reject)=>pending.push({value,resolve,reject}))};
 vm.runInNewContext(source.slice(start,end),context);
 const opener={isConnected:true,focus(){doc.activeElement=this;}};doc.activeElement=opener;context.editPost({body:'Original post'});
 return{doc,opener,pending,nodes,releases:()=>releases,input:nodes.find(n=>n.tag==='textarea'),save:nodes.find(n=>n.attrs.class==='lf-community-edit-save'),close:nodes.find(n=>n.tag==='button'&&n.attrs['aria-label']==='Close'),status:nodes.find(n=>n.attrs.role==='status')};
}
test('typing during a pending edit cannot re-enable save or dispatch a second mutation',async()=>{
 const h=harness();h.input.value='First edit';const first=h.save.events.click();assert.equal(h.input.disabled,true);assert.equal(h.doc.activeElement,h.close);
 h.input.value='Second edit';h.input.events.input();assert.equal(h.save.disabled,true);const second=h.save.events.click();assert.equal(h.pending.length,1);
 h.pending[0].resolve();await Promise.all([first,second]);assert.equal(h.releases(),1);
});
test('failed edit keeps its draft and explicitly unlocks a single retry',async()=>{
 const h=harness();h.input.value='Keep my draft';const first=h.save.events.click();h.pending[0].reject(Error('offline'));await first;
 assert.equal(h.input.value,'Keep my draft');assert.equal(h.input.disabled,false);assert.equal(h.save.disabled,false);assert.match(h.status.textContent,/Could not save/);
 const retry=h.save.events.click();assert.equal(h.pending.length,2);assert.equal(h.pending[1].value.body,'Keep my draft');h.pending[1].resolve();await retry;
});
test('a dismissed editor cannot steal focus again when its mutation succeeds late',async()=>{
 const h=harness(),job=h.save.events.click();h.close.events.click();const next={};h.doc.activeElement=next;
 h.pending[0].resolve();await job;assert.equal(h.doc.activeElement,next);assert.equal(h.releases(),1);
});
test('a dismissed editor ignores late failure instead of changing abandoned draft controls',async()=>{
 const h=harness(),job=h.save.events.click();h.close.events.click();h.pending[0].reject(Error('old failure'));await job;
 assert.equal(h.status.textContent,'');assert.equal(h.releases(),1);
});
test('a detached editor cannot restore its obsolete opener after a successful receipt',async()=>{
 const h=harness(),job=h.save.events.click(),modal=h.nodes.find(n=>n.attrs.class==='lf-community-edit');modal.remove();const next={};h.doc.activeElement=next;
 h.pending[0].resolve();await job;assert.equal(h.doc.activeElement,next);
});

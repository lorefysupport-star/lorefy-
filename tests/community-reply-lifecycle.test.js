const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-community.js','utf8'),start=source.indexOf('    send.addEventListener("click", async function () {'),end=source.indexOf('    overlay.appendChild(sheet);',start);
function harness(){
 let handler,resolve,reject;const calls={inputs:0,paint:0,feed:0,toasts:0,focus:0},scroll={scrollTop:0,scrollHeight:20},pending=new Promise((yes,no)=>{resolve=yes;reject=no;}),overlay={isConnected:true},input={value:'Reply draft',style:{},focus(){calls.focus++;},dispatchEvent(){calls.inputs++;}},send={disabled:false,addEventListener(type,fn){handler=fn;}};
 const scope={input,send,overlay,sending:false,post:{id:'post',replyCount:0},replyTarget:null,replyContext:()=>null,targetBar:{hidden:false},replyActivityAt:1,isDemo:()=>false,global:{LorefyBackend:{mode:'live',replyCommunityPost:()=>pending},Event:function(){}},paintReplies:async()=>calls.paint++,sheet:{querySelector:()=>scroll},renderPostFeed:()=>calls.feed++,toast:()=>calls.toasts++,uiText:(ar,en)=>en};
 vm.runInNewContext(source.slice(start,end),scope);return{scope,calls,overlay,input,send,scroll,click:()=>handler(),resolve,reject};
}
test('closed reply receipt cannot clear the persisted draft or repaint the old conversation',async()=>{
 const h=harness(),job=h.click();h.overlay.isConnected=false;h.resolve();await job;
 assert.equal(h.input.value,'Reply draft');assert.equal(h.calls.inputs,0);assert.equal(h.calls.paint,0);assert.equal(h.calls.feed,0);assert.equal(h.scroll.scrollTop,0);assert.equal(h.scope.targetBar.hidden,false);
});
test('closed reply failure cannot show an obsolete toast or unlock abandoned controls',async()=>{
 const h=harness(),job=h.click();h.overlay.isConnected=false;h.reject(Error('Late failure'));await job;assert.equal(h.calls.toasts,0);assert.equal(h.send.disabled,true);
});
test('detached send handler cannot start another reply mutation',async()=>{
 const h=harness();h.overlay.isConnected=false;const job=h.click();assert.equal(h.send.disabled,false);h.resolve();await job;assert.equal(h.calls.paint,0);
});
test('current reply success clears its sent draft and refreshes the conversation once',async()=>{
 const h=harness(),job=h.click();assert.equal(h.calls.focus,1);h.resolve();await job;assert.equal(h.scope.post.replyCount,1);assert.equal(h.input.value,'');assert.equal(h.calls.inputs,1);assert.equal(h.calls.paint,1);assert.equal(h.calls.feed,1);
});
test('current reply failure retains a retryable draft and reports the failure',async()=>{
 const h=harness(),job=h.click();h.reject(Error('Offline'));await job;assert.equal(h.input.value,'Reply draft');assert.equal(h.calls.toasts,1);assert.equal(h.send.disabled,false);
});

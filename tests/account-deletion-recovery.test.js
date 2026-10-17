const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../backend/lorefy-backend.js'),'utf8');
function harness(result,session={userId:'reader'}){
  let signedOut=0,calls=0;
  const values=new Map([['lorefy.activeUser.v1','reader'],['lorefy.ui.lang.v1','en']]);
  const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v))};
  const window={localStorage:storage};
  vm.runInNewContext(source,{window,localStorage:storage,console,URL,setTimeout,clearTimeout});
  const api=window.LorefyBackend;
  Object.assign(api,{mode:'live',user:{id:'reader'},getSession:async()=>session,signOut:async()=>signedOut++,client:{functions:{invoke:async()=>{calls++;return typeof result==='function'?result():result;}}}});
  return {api,signedOut:()=>signedOut,calls:()=>calls};
}
test('live account deletion cannot succeed without a session',async()=>{
  const h=harness({data:null},null);
  await assert.rejects(h.api.deleteAccount(),e=>e.code==='LOREFY_SESSION_INVALID');
  assert.equal(h.signedOut(),0);
});
test('recent-auth rejection is actionable and preserves the account session',async()=>{
  const h=harness({error:{context:new Response(JSON.stringify({error:'recent_authentication_required'}),{status:401})}});
  await assert.rejects(h.api.deleteAccount(),e=>e.code==='LOREFY_REAUTH_REQUIRED'&&/sign in|الدخول/i.test(e.message));
  assert.equal(h.signedOut(),0);
});
test('failed storage cleanup does not report successful deletion or sign out',async()=>{
  const h=harness({error:{context:new Response(JSON.stringify({error:'storage_cleanup_failed'}),{status:500})}});
  await assert.rejects(h.api.deleteAccount(),e=>e.code==='LOREFY_DELETE_FAILED');
  assert.equal(h.signedOut(),0);
});
test('concurrent deletion submits only one server request',async()=>{
  let release;
  const result=new Promise(resolve=>{release=resolve;});
  const h=harness(()=>result);
  const a=h.api.deleteAccount(),b=h.api.deleteAccount();
  await new Promise(resolve=>setTimeout(resolve,0));
  release({data:null});
  await Promise.all([a,b]);
  assert.equal(h.calls(),1);
  assert.equal(h.signedOut(),1);
});

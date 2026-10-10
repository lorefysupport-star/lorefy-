const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../backend/lorefy-backend.js'),'utf8');
function harness(result,session={userId:'reader'}){
  let signedOut=0,calls=0;
  const scope={readLS:()=> 'en',invalidSessionError:()=>Object.assign(new Error('Sign in again'),{code:'LOREFY_SESSION_INVALID'}),console};
  const start=source.indexOf('    deleteAccount: async function(');
  const end=source.indexOf('    SYNC_KEYS:',start);
  vm.runInNewContext('var B={'+source.slice(start,end)+'};',scope);
  Object.assign(scope.B,{mode:'live',getSession:async()=>session,signOut:async()=>signedOut++,client:{functions:{invoke:async()=>{calls++;return typeof result==='function'?result():result;}}}});
  return {api:scope.B,signedOut:()=>signedOut,calls:()=>calls};
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

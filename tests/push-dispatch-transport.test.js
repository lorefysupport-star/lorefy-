const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module'),{webcrypto}=require('node:crypto');
const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/dispatch-notifications/index.ts','utf8').replace(/^import .*createClient.*\r?\n/,''));
const A='11111111-1111-4111-8111-111111111111',N='22222222-2222-4222-8222-222222222222';
const key=(async()=>{
 const pair=await webcrypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 return '-----BEGIN PRIVATE KEY-----\n'+Buffer.from(await webcrypto.subtle.exportKey('pkcs8',pair.privateKey)).toString('base64')+'\n-----END PRIVATE KEY-----';
})();
async function runtime(devices,transport){
 let handler;const calls=[],deleted=[],timeouts=[];
 const env={PUSH_WEBHOOK_SECRET:'fixture-webhook-only',SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-only',APNS_TEAM_ID:'FIXTURE',APNS_KEY_ID:'FIXTURE',APNS_PRIVATE_KEY:await key};
 const notification={id:N,user_id:A,kind:'test',title:'Fixture',body:'Synthetic test',target_path:'/community',data:{},event_key:'fixture-event'};
 const client={from(table){const builder={select(){return this;},eq(){return this;},order(){return this;},maybeSingle:async()=>({data:notification}),limit:async()=>({data:devices}),delete(){return this;},in:async(_,ids)=>{deleted.push(...ids);return{error:null};}};return builder;}};
 const FakeAbortSignal={timeout(ms){timeouts.push(ms);const controller=new AbortController();setTimeout(()=>controller.abort(new Error('fixture timeout')),5);return controller.signal;}};
 vm.runInNewContext(source,{Deno:{env:{get:k=>env[k]},serve:fn=>{handler=fn;}},createClient:()=>client,crypto:webcrypto,TextEncoder,Uint8Array,Response,btoa,atob,AbortSignal:FakeAbortSignal,
  fetch:async(url,options)=>{calls.push({url,options});return transport(url,options);}});
 const request=()=>new Request('https://fixture.invalid/dispatch',{method:'POST',headers:{'x-lorefy-webhook-secret':env.PUSH_WEBHOOK_SECRET,'Content-Type':'application/json'},body:JSON.stringify({type:'INSERT',schema:'public',table:'notifications',record:{id:N,user_id:A}})});
 return{send:()=>handler(request()),calls,deleted,timeouts};
}
const device=id=>({id,token:'synthetic-'+id,environment:'production'});

test('one APNs network failure does not reject the complete dispatch or delete a retryable device',async()=>{
 const h=await runtime([device('offline'),device('healthy')],async url=>{if(url.includes('offline'))throw Error('fixture offline');return new Response(null,{status:200});});
 const response=await h.send();assert.equal(response.status,202);assert.deepEqual(await response.json(),{delivered:1,unavailable:1});
 assert.equal(h.calls.length,2);assert.deepEqual(h.deleted,[]);
});

test('APNs requests have a bounded deadline within the existing five-second webhook budget',async()=>{
 const h=await runtime([device('slow')],(_,options)=>{
  if(!options.signal)return Promise.reject(Error('No request deadline'));
  return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));
 });
 const response=await h.send();assert.deepEqual(await response.json(),{delivered:0,unavailable:1});
 assert.equal(h.timeouts.length,1);assert.ok(h.timeouts[0]>0&&h.timeouts[0]<=4000);assert.deepEqual(h.deleted,[]);
});

test('only an APNs-invalid token is removed; transient rejection stays registered',async()=>{
 const h=await runtime([device('invalid'),device('transient')],async url=>new Response(JSON.stringify({reason:url.includes('invalid')?'Unregistered':'ServiceUnavailable'}),{status:url.includes('invalid')?410:503}));
 const response=await h.send();assert.deepEqual(await response.json(),{delivered:0,unavailable:2});assert.deepEqual(h.deleted,['invalid']);
 assert.ok(h.calls.every(c=>c.url.startsWith('https://api.push.apple.com/3/device/')));
 assert.ok(h.calls.every(c=>c.options.headers['apns-topic']==='com.lorefy.app'));
});

test('an account without a registered device never contacts Apple',async()=>{
 const h=await runtime([],()=>{throw Error('Unexpected delivery');}),response=await h.send();
 assert.equal(response.status,202);assert.deepEqual(await response.json(),{delivered:0,unavailable:0});assert.equal(h.calls.length,0);
});

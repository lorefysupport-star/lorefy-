const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(app,p),'utf8');
const catalog=JSON.parse(read('launch/decorations/originals/catalog.json'));
const owner='11111111-1111-4111-8111-111111111111';
function shopRoot(mode='demo'){
 const values={},window={LOREFY_RELEASE:{betaProfileDecorations:true},LorefyBackend:{mode,user:{id:owner},push:async()=>true},localStorage:{getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v},dispatchEvent:()=>{},CustomEvent:class{}};
 vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
 assert.equal(window.LorefyProfileShop.installBetaCollections(JSON.parse(read('launch/decorations/pfpvibes/collections.json'))),true);
 assert.equal(window.LorefyProfileShop.installShopCatalog(catalog),true);return {window,values,shop:window.LorefyProfileShop};
}
test('the storefront has exactly twelve SAR13 paid pairs and the last five free collections',()=>{
 const {shop}=shopRoot();assert.equal(shop.offered.length,17);
 assert.deepEqual(Array.from(shop.offered.filter(p=>p.free),p=>p.id),catalog.freeIds);
 for(const pack of shop.offered.filter(p=>!p.free)){
  assert.equal(pack.price.amount,1300);assert.equal(pack.price.currency,'SAR');assert.deepEqual(Array.from(pack.parts),['frame','page']);
  assert.match(pack.productId,/^com\.lorefy\.app\.decorations\.[a-z_]+$/);
  for(const file of [pack.overlay,pack.pageOverlay,`launch/decorations/originals/${pack.artId}/avatar.png`,`launch/decorations/originals/${pack.artId}/page.png`])assert.ok(fs.existsSync(path.join(app,file)));
 }
 assert.ok(shop.findBundle('observatory'),'retired art remains readable on existing profiles');
 assert.ok(!shop.offered.some(p=>p.id==='observatory'));
});
test('paid previews have two frames and never synthesize a third paid effect',()=>{
 const {shop}=shopRoot(),id=catalog.paid[0].id;
 assert.deepEqual(JSON.parse(JSON.stringify(shop.previewParts(id,'all'))),{frame:id,page:id,effect:null});
});
test('a paid collection cannot be applied in demo, offline or without verified ownership',async()=>{
 const {shop,values,window}=shopRoot();
 await assert.rejects(shop.applyDecoration(catalog.paid[0].id,'all',owner),/PURCHASE_REQUIRED/);assert.deepEqual(values,{});
 window.LorefyDecorationBilling={has:async()=>false};
 await assert.rejects(shop.applyDecoration(catalog.paid[0].id,'frame',owner),/PURCHASE_REQUIRED/);assert.deepEqual(values,{});
 await shop.applyDecoration(catalog.freeIds[0],'all',owner);assert.ok(Object.keys(values).length);
 await assert.rejects(shop.applyDecoration('observatory','all',owner),/INVALID/);
});
test('ownership is checked before persistence and an account switch cancels application',async()=>{
 const {shop,values,window}=shopRoot('live');
 window.LorefyDecorationBilling={has:async()=>{window.LorefyBackend.user.id='other';return true;}};
 await assert.rejects(shop.applyDecoration(catalog.paid[0].id,'all',owner),/ACCOUNT_CHANGED/);assert.deepEqual(values,{});
});
test('invalid storefront manifests leave the catalog unchanged',()=>{
 const {shop}=shopRoot(),before=shop.offered.map(p=>p.id).join();
 const invalid=JSON.parse(JSON.stringify(catalog));invalid.paid[0].overlay='https://evil.test/image.png';
 assert.equal(shop.installShopCatalog(invalid),false);assert.equal(shop.offered.map(p=>p.id).join(),before);
 invalid.paid[0]=null;assert.equal(shop.installShopCatalog(invalid),false);
});
function billingRoot(overrides={}){
 const finished=[],actions=[],window={LorefyProfileShop:{offered:catalog.paid.map(p=>({...p,free:false}))},LorefyBackend:{mode:'live',user:{id:owner},client:{from(){return {select(){return this},eq(){return this},then(resolve){resolve({data:[{product_id:catalog.paid[0].productId,status:'active',environment:'Production'}],error:null})}}},functions:{invoke:async(_,input)=>{actions.push(input.body.action);return {data:input.body.action==='status'?{ready:true}:{verified:true}};}}}},Capacitor:{isNativePlatform:()=>true,Plugins:{LorefyPurchases:{products:async()=>({products:catalog.paid.map(p=>({id:p.productId,displayPrice:'SAR 13'}))}),purchase:async()=>({status:'success',transactionId:'42',signedTransaction:'a.b.c'}),finish:async x=>finished.push(x.transactionId),restore:async()=>({transactions:[]})}}}};
 Object.assign(window,overrides);vm.runInNewContext(read('modules/lorefy-decoration-billing.js'),{window});return {window,billing:window.LorefyDecorationBilling,finished,actions};
}
test('transactions finish only after a successful server verification',async()=>{
 const {billing,actions,finished}=billingRoot();await billing.buy(catalog.paid[0],owner);
 assert.deepEqual(actions,['status','verify']);assert.deepEqual(finished,['42']);
});
test('failed verification retains the transaction for restore and grants no ownership',async()=>{
 const {window,billing,finished}=billingRoot();window.LorefyBackend.client.functions.invoke=async(_,r)=>({data:r.body.action==='status'?{ready:true}:{error:'LOREFY_PURCHASE_INVALID'}});
 await assert.rejects(billing.buy(catalog.paid[0],owner),/INVALID/);assert.deepEqual(finished,[]);
});
test('an unverified response never finishes and a revoked purchase never reports ownership',async()=>{
 const rejected=billingRoot();rejected.window.LorefyBackend.client.functions.invoke=async(_,r)=>({data:r.body.action==='status'?{ready:true}:{verified:false}});
 await assert.rejects(rejected.billing.buy(catalog.paid[0],owner),/VERIFICATION_FAILED/);assert.deepEqual(rejected.finished,[]);
 const revoked=billingRoot();revoked.window.LorefyBackend.client.from=()=>({select(){return this},eq(){return this},then(resolve){resolve({data:[{product_id:catalog.paid[0].productId,status:'revoked',environment:'Production'}]})}});
 await assert.rejects(revoked.billing.buy(catalog.paid[0],owner),/NOT_OWNED/);
});
test('unconfigured verification stops before the Apple purchase sheet can charge',async()=>{
 const {window,billing}=billingRoot();let calls=0;window.LorefyBackend.client.functions.invoke=async()=>({data:{ready:false}});window.Capacitor.Plugins.LorefyPurchases.purchase=async()=>calls++;
 await assert.rejects(billing.buy(catalog.paid[0],owner),/SETUP_REQUIRED/);assert.equal(calls,0);
});
test('cancelled and pending purchases never reach the server grant or finish',async()=>{
 for(const status of ['cancelled','pending']){
  const {window,billing,actions,finished}=billingRoot();window.Capacitor.Plugins.LorefyPurchases.purchase=async()=>({status});
  await assert.rejects(billing.buy(catalog.paid[0],owner),new RegExp(status==='pending'?'PENDING':'CANCELLED'));
  assert.deepEqual(actions,['status']);assert.deepEqual(finished,[]);
 }
});
test('unfinished purchases recover with the current account and still require server verification',async()=>{
 const {window,billing,actions,finished}=billingRoot();let token;
 window.Capacitor.Plugins.LorefyPurchases.pending=async input=>{token=input.appAccountToken;return {transactions:[{transactionId:'84',signedTransaction:'a.b.c'}]};};
 await billing.reconcile(owner);assert.equal(token,owner);assert.deepEqual(actions,['status','verify']);assert.deepEqual(finished,['84']);
});
test('a disposed purchase listener cannot update ownership or process another account',async()=>{
 const {window,billing}=billingRoot();let listener,removed=0,reads=0,updates=0;
 window.Capacitor.Plugins.LorefyPurchases.pending=async()=>{reads++;return {transactions:[]};};
 window.Capacitor.Plugins.LorefyPurchases.addListener=async(_,callback)=>{listener=callback;return {remove:()=>removed++};};
 const dispose=billing.watch(owner,()=>updates++);await new Promise(resolve=>setImmediate(resolve));assert.equal(reads,1);assert.equal(updates,1);
 window.LorefyBackend.user.id='other';listener();await new Promise(resolve=>setImmediate(resolve));assert.equal(reads,1);
 dispose();assert.equal(removed,1);listener();assert.equal(reads,1);
});
test('server transaction policy rejects another account, product, app, environment or purchase type',async()=>{
 const {ownershipRow,productIds,signedInput}=await import('../supabase/functions/decoration-purchases/policy.mjs');
 const tx={bundleId:'com.lorefy.app',environment:'Production',type:'Non-Consumable',productId:productIds[0],appAccountToken:owner,transactionId:'42',originalTransactionId:'42',purchaseDate:Date.now()};
 assert.equal(ownershipRow(tx,owner,'Production').status,'active');
 for(const changes of [{appAccountToken:'other'},{productId:'monthly'},{environment:'Sandbox'},{bundleId:'other.app'},{type:'Consumable'},{purchaseDate:Date.now()+3600000},{transactionId:'garbage'}])assert.throws(()=>ownershipRow({...tx,...changes},owner,'Production'));
 assert.equal(ownershipRow({...tx,revocationDate:Date.now()},owner,'Production').status,'revoked');
 assert.equal(signedInput('a.b.c'),true);assert.equal(signedInput('a.'.repeat(20000)),false);
});

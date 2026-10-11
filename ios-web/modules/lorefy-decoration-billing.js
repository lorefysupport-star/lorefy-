/* One-time cosmetics: StoreKit purchases, server-verified account ownership. */
(function(root){
  'use strict';
  let flight=null;
  const failure=code=>Object.assign(new Error(code),{code});
  function account(){const b=root.LorefyBackend;return b&&b.mode==='live'&&b.user&&b.user.id||'';}
  function native(){return root.Capacitor&&root.Capacitor.isNativePlatform&&root.Capacitor.isNativePlatform()&&root.Capacitor.Plugins&&root.Capacitor.Plugins.LorefyPurchases;}
  function products(){return root.LorefyProfileShop.offered.filter(p=>!p.free).map(p=>p.productId);}
  function assertOwner(owner){if(!owner||account()!==owner)throw failure('LOREFY_PURCHASE_ACCOUNT_CHANGED');}
  async function server(body,owner){
    assertOwner(owner);const b=root.LorefyBackend;
    if(!b.client||!b.client.functions)throw failure('LOREFY_PURCHASE_UNAVAILABLE');
    const result=await b.client.functions.invoke('decoration-purchases',{body});assertOwner(owner);
    if(result.error||!result.data||result.data.error)throw failure(result.data&&result.data.error||'LOREFY_PURCHASE_VERIFICATION_FAILED');
    return result.data;
  }
  async function owned(owner){
    assertOwner(owner);const result=await root.LorefyBackend.client.from('decoration_purchases').select('product_id,status,environment').eq('user_id',owner).eq('environment','Production').eq('status','active');assertOwner(owner);
    if(result.error)throw result.error;
    return Array.isArray(result.data)?result.data.filter(r=>r.status==='active'&&r.environment==='Production'&&products().includes(r.product_id)).map(r=>r.product_id):[];
  }
  async function has(pack,owner){return pack.free||(await owned(owner)).includes(pack.productId);}
  async function availability(owner){
    assertOwner(owner);const plugin=native();if(!plugin)throw failure('LOREFY_PURCHASE_IOS_REQUIRED');
    const status=await server({action:'status'},owner);
    if(!status.ready)throw failure('LOREFY_PURCHASE_SETUP_REQUIRED');
    const result=await plugin.products({productIds:products()});assertOwner(owner);return result.products||[];
  }
  async function verifyTransactions(rows,owner,plugin){
    for(const row of rows){
      const result=await server({action:'verify',signedTransaction:row.signedTransaction},owner);
      if(result.verified!==true)throw failure('LOREFY_PURCHASE_VERIFICATION_FAILED');
      await plugin.finish({transactionId:row.transactionId});
    }
    return owned(owner);
  }
  async function buy(pack,owner){
    if(flight)throw failure('LOREFY_PURCHASE_IN_PROGRESS');
    assertOwner(owner);if(!pack||pack.free||!products().includes(pack.productId))throw failure('LOREFY_PURCHASE_PRODUCT_INVALID');
    flight=(async()=>{
      const list=await availability(owner),product=list.find(p=>p.id===pack.productId);
      if(!product)throw failure('LOREFY_PURCHASE_PRODUCT_UNAVAILABLE');
      const plugin=native(),result=await plugin.purchase({productId:pack.productId,appAccountToken:owner});
      assertOwner(owner);
      if(result.status!=='success')throw failure(result.status==='pending'?'LOREFY_PURCHASE_PENDING':'LOREFY_PURCHASE_CANCELLED');
      const rows=await verifyTransactions([result],owner,plugin);
      if(!rows.includes(pack.productId))throw failure('LOREFY_PURCHASE_NOT_OWNED');
      return rows;
    })();try{return await flight;}finally{flight=null;}
  }
  async function restore(owner){
    if(flight)throw failure('LOREFY_PURCHASE_IN_PROGRESS');
    flight=(async()=>{await availability(owner);const plugin=native();const result=await plugin.restore({appAccountToken:owner});assertOwner(owner);return verifyTransactions(result.transactions||[],owner,plugin);})();
    try{return await flight;}finally{flight=null;}
  }
  async function reconcile(owner){
    if(flight)throw failure('LOREFY_PURCHASE_IN_PROGRESS');
    flight=(async()=>{await availability(owner);const plugin=native();const result=await plugin.pending({appAccountToken:owner});assertOwner(owner);return verifyTransactions(result.transactions||[],owner,plugin);})();
    try{return await flight;}finally{flight=null;}
  }
  function watch(owner,onOwned){
    const plugin=native();let disposed=false,handle;
    const refresh=()=>{if(disposed||account()!==owner)return;reconcile(owner).then(rows=>{if(!disposed&&account()===owner)onOwned(rows);}).catch(()=>{});};
    if(plugin&&plugin.addListener){
      Promise.resolve(plugin.addListener('transactionsUpdated',refresh)).then(value=>{if(disposed)value.remove();else handle=value;}).catch(()=>{});
      refresh();
    }
    return ()=>{disposed=true;if(handle)handle.remove();};
  }
  root.LorefyDecorationBilling=Object.freeze({account,owned,has,availability,buy,restore,reconcile,watch});
})(typeof window!=='undefined'?window:globalThis);

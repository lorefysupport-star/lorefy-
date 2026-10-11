export const bundleId='com.lorefy.app';
export const appAppleId=6799704077;
export const productIds=Object.freeze(['night-gaze','signal-drift','midnight-bloom','crimson-current','maple-scout','twilight-den','amber-drift','woodland-lantern','moon-fox','ribbon-bunny','ember-tiger','mint-raccoon'].map(id=>'com.lorefy.app.decorations.'+id.replaceAll('-','_')));
export function ownershipRow(tx,userId,environment){
  if(!tx || tx.bundleId!==bundleId || tx.environment!==environment || tx.type!=='Non-Consumable' ||
    !productIds.includes(tx.productId) || typeof tx.appAccountToken!=='string' || tx.appAccountToken.toLowerCase()!==userId.toLowerCase() ||
    !/^\d{1,30}$/.test(tx.transactionId||'') || !/^\d{1,30}$/.test(tx.originalTransactionId||'') ||
    !Number.isFinite(tx.purchaseDate) || tx.purchaseDate>Date.now()+300000)throw Error('LOREFY_PURCHASE_INVALID');
  return {user_id:userId,product_id:tx.productId,environment,status:tx.revocationDate?'revoked':'active',
    transaction_id:tx.transactionId,original_transaction_id:tx.originalTransactionId,purchased_at:new Date(tx.purchaseDate).toISOString(),verified_at:new Date().toISOString()};
}
export function signedInput(value){return typeof value==='string'&&value.length<=24000&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);}

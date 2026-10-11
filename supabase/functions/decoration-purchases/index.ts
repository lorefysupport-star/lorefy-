import {createClient} from 'npm:@supabase/supabase-js@2.95.3';
import {SignedDataVerifier,AppStoreServerAPIClient,Environment} from 'npm:@apple/app-store-server-library@3.1.0';
import {Buffer} from 'node:buffer';
import {bundleId,appAppleId,ownershipRow,signedInput} from './policy.mjs';
// Public Apple PKI trust anchor, never an account signing key.
const rootCA='MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM6BgD56KyKA==';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
const environment=Deno.env.get('APPLE_IAP_ENVIRONMENT')==='Sandbox'?Environment.SANDBOX:Environment.PRODUCTION;
const verifier=new SignedDataVerifier([Buffer.from(rootCA,'base64')],true,environment,bundleId,environment===Environment.PRODUCTION?appAppleId:undefined);
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return respond({error:'METHOD_NOT_ALLOWED'},405);
  if(Number(req.headers.get('content-length')||0)>26000)return respond({error:'PAYLOAD_TOO_LARGE'},413);
  try{
    const raw=await req.text();if(raw.length>26000)return respond({error:'PAYLOAD_TOO_LARGE'},413);
    const body=JSON.parse(raw),url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    // Server notifications authenticate their JWS, all client actions authenticate Auth.
    const notification=typeof body.signedPayload==='string';
    let userId='';
    if(!notification){
      const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
      const {data,error}=await db.auth.getUser(token);if(error||!data.user)return respond({error:'UNAUTHORIZED'},401);userId=data.user.id;
    }
    const issuer=Deno.env.get('APPLE_IAP_ISSUER_ID'),keyId=Deno.env.get('APPLE_IAP_KEY_ID'),privateKey=Deno.env.get('APPLE_IAP_PRIVATE_KEY');
    const ready=!!issuer&&!!keyId&&!!privateKey;
    if(body.action==='status'&&!notification)return respond({ready,environment,provider:'apple',purchaseType:'non-consumable'});
    let signed=body.signedTransaction;
    if(notification){
      if(!signedInput(body.signedPayload))return respond({error:'INVALID_NOTIFICATION'},400);
      const event=await verifier.verifyAndDecodeNotification(body.signedPayload);
      signed=event.data?.signedTransactionInfo;
      if(!signed)return respond({received:true});
    }else if(body.action!=='verify')return respond({error:'INVALID_ACTION'},400);
    if(!signedInput(signed))return respond({error:'INVALID_TRANSACTION'},400);
    const tx=await verifier.verifyAndDecodeTransaction(signed);
    if(notification){
      if(!tx.appAccountToken)return respond({received:true});userId=tx.appAccountToken;
    }
    ownershipRow(tx,userId,environment); // Check account, SKU, app and environment before Apple API.
    if(!ready)return respond({error:'LOREFY_PURCHASE_SETUP_REQUIRED'},503);
    const api=new AppStoreServerAPIClient(privateKey!,keyId!,issuer!,bundleId,environment);
    const fresh=await api.getTransactionInfo(tx.transactionId!);
    if(!fresh.signedTransactionInfo)throw Error('Missing transaction');
    const current=await verifier.verifyAndDecodeTransaction(fresh.signedTransactionInfo);
    if(current.originalTransactionId!==tx.originalTransactionId||current.transactionId!==tx.transactionId)throw Error('Transaction mismatch');
    const row=ownershipRow(current,userId,environment);
    if(tx.revocationDate)row.status='revoked';
    const {data:result,error}=await db.rpc('record_decoration_purchase',{purchase:row});
    if(error)throw error;
    return respond({verified:true,status:result,environment,product:row.product_id});
  }catch(_){return respond({error:'LOREFY_PURCHASE_VERIFICATION_FAILED'},400);}
});

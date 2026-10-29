'use strict';
const INTERVAL={openlibrary:1100,bookbrainz:1100,wikidata:300,gcd:3000,googlebooks:1000};
function create(options={}){
  const fetcher=options.fetch||fetch,now=options.now||Date.now,sleep=options.sleep||(ms=>new Promise(r=>setTimeout(r,ms))),env=options.env||{};
  const cache=new Map(),pending=new Map(),cooldown=new Map(),queues=new Map(),next=new Map();let gcdWindow=0,gcdCount=0;
  const reply=(status,body,headers={})=>({status,body:typeof body==='string'?body:JSON.stringify(body),headers:{'Content-Type':'application/json; charset=utf-8',...headers}});
  function target(provider,input){
    const p=new URLSearchParams(input);p.delete('key');let base;
    if(provider==='openlibrary'){
      base='https://openlibrary.org/search.json';p.set('limit',String(Math.max(1,Math.min(50,Number(p.get('limit'))||20))));
    }else if(provider==='googlebooks'){
      base='https://www.googleapis.com/books/v1/volumes';if(env.GOOGLE_BOOKS_API_KEY)p.set('key',env.GOOGLE_BOOKS_API_KEY);
    }else if(provider==='bookbrainz'){
      const path=p.get('path')||'/1/search';p.delete('path');
      if(!/^\/1\/(?:search|(?:work|edition|edition-group)\/[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})$/i.test(path))return null;
      base='https://api.bookbrainz.org'+path;if(path==='/1/search')p.set('size',String(Math.max(1,Math.min(6,Number(p.get('size'))||6))));
    }else if(provider==='gcd'){
      const q=String(p.get('q')||'').trim();if(q.length<2||q.length>120)return null;
      base='https://www.comics.org/api/series/name/'+encodeURIComponent(q)+'/';
      return base+'?page='+Math.max(1,Math.min(10,Number(p.get('page'))||1));
    }else if(provider==='wikidata'){
      const action=p.get('action');if(!['wbsearchentities','wbgetentities'].includes(action))return null;
      if(action==='wbgetentities'&&!/^Q\d+(?:\|Q\d+){0,9}$/.test(p.get('ids')||''))return null;
      if(action==='wbsearchentities')p.set('limit',String(Math.max(1,Math.min(6,Number(p.get('limit'))||6))));
      base='https://www.wikidata.org/w/api.php';p.set('format','json');
    }else return null;
    if((p.get('q')||p.get('search')||'').length>160)return null;
    p.sort();return base+'?'+p;
  }
  async function bodyOf(response){
    const limit=3*1024*1024;if(Number(response.headers.get('content-length'))>limit)throw Error('response too large');
    if(!response.body?.getReader){const body=await response.text();if(Buffer.byteLength(body)>limit)throw Error('response too large');return body;}
    const reader=response.body.getReader(),chunks=[];let size=0;
    try{for(;;){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>limit){await reader.cancel();throw Error('response too large');}chunks.push(Buffer.from(r.value));}}
    finally{reader.releaseLock();}return Buffer.concat(chunks,size).toString('utf8');
  }
  async function execute(provider,url){
    const wait=Math.max(0,(next.get(provider)||0)-now());if(wait)await sleep(wait);next.set(provider,now()+INTERVAL[provider]);
    if((cooldown.get(provider)||0)>now())return reply(429,{error:'Provider cooling down'},{'Retry-After':String(Math.ceil((cooldown.get(provider)-now())/1000))});
    const credentials=env.GCD_API_USERNAME&&env.GCD_API_PASSWORD;
    if(provider==='gcd'){
      if(!credentials&&!options.allowAnonymousGcd)return reply(503,{error:'GCD account required outside the local testing preview'});
      if(now()-gcdWindow>=3600000){gcdWindow=now();gcdCount=0;}
      if(gcdCount>=(credentials?80:20))return reply(429,{error:'Local GCD request budget reached'},{'Retry-After':'3600'});
      gcdCount++;
    }
    const headers={Accept:'application/json','User-Agent':'Lorefy/1.0 (lorefysupport@gmail.com)'};
    if(provider==='gcd'&&credentials)headers.Authorization='Basic '+Buffer.from(env.GCD_API_USERNAME+':'+env.GCD_API_PASSWORD).toString('base64');
    try{
      const response=await fetcher(url,{headers,redirect:'error',signal:AbortSignal.timeout(10000)}),body=await bodyOf(response);
      if(response.status===429){const seconds=Math.min(3600,Math.max(30,Number(response.headers.get('retry-after'))||60));cooldown.set(provider,now()+seconds*1000);return reply(429,{error:'Source rate limited'},{'Retry-After':String(seconds)});}
      if(!response.ok)return reply(response.status,{error:'Catalog source unavailable',provider});
      JSON.parse(body);const answer=reply(200,body);cache.set(url,{until:now()+(/\/1\/(work|edition)/.test(url)?86400000:900000),answer});
      while(cache.size>256)cache.delete(cache.keys().next().value);return answer;
    }catch(_){return reply(502,{error:'Catalog source unavailable',provider});}
  }
  function request(provider,query){
    const url=target(provider,query);if(!url)return Promise.resolve(reply(400,{error:'Invalid provider query'}));
    const old=cache.get(url);if(old&&old.until>now())return Promise.resolve(old.answer);
    if(pending.has(url))return pending.get(url);
    if(pending.size>=24)return Promise.resolve(reply(429,{error:'Catalog queue is full'},{'Retry-After':'2'}));
    const job=(queues.get(provider)||Promise.resolve()).catch(()=>{}).then(()=>execute(provider,url));
    queues.set(provider,job);pending.set(url,job);job.finally(()=>pending.delete(url));return job;
  }
  return Object.freeze({request});
}
module.exports={create};

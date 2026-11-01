const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

test('loopback image gateway trusts system roots in addition to Node defaults',()=>{
 const {configureLocalTrust}=require('../tools/lorefy-api-server.js');
 const calls=[],tls={getCACertificates:kind=>kind==='default'?['bundled','extra']:['system'],setDefaultCACertificates:certs=>calls.push(certs)};
 assert.equal(configureLocalTrust(tls,'127.0.0.1'),true);
 assert.deepEqual(calls,[['bundled','extra','system']]);
 assert.equal(configureLocalTrust(tls,'0.0.0.0'),false);assert.equal(calls.length,1);
 assert.equal(configureLocalTrust({},'localhost'),false);
 assert.doesNotMatch(fs.readFileSync('tools/lorefy-api-server.js','utf8'),/rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED/);
});

test('local media accepts the same exact RanobeDB and Kitsu providers as covers',()=>{
 const {isAllowedMediaHost}=require('../tools/lorefy-api-server.js');
 for(const host of ['images.ranobedb.org','media.kitsu.app']){
  assert.equal(isAllowedMediaHost(host),true);assert.equal(isAllowedMediaHost(host+'.evil.invalid'),false);
 }
});

function proxy(href,config=true){
 const window={URL,URLSearchParams,location:new URL(href),LOREFY_RELEASE:{catalogProxyUrl:'https://project.supabase.co/functions/v1/lorefy-public'},LOREFY_REMOTE_CATALOG:config?{proxyBaseUrl:'/api/catalog'}:{}};
 vm.runInNewContext(fs.readFileSync('modules/lorefy-data-proxy.js','utf8'),{window,URL,URLSearchParams});return window.LorefyDataProxy;
}
test('chapter and portrait media use an available loopback gateway before the cloud',()=>{
 const image='https://static.wikia.nocookie.net/berserk/images/a/a1/Chapter_001.png';
 for(const host of ['127.0.0.1','localhost'])assert.equal(proxy('http://'+host+':8796/').mediaUrl(image),'/api/media?url='+encodeURIComponent(image));
 for(const href of ['https://lorefy.example/','capacitor://localhost/'])assert.equal(proxy(href).mediaUrl(image),'https://project.supabase.co/functions/v1/lorefy-public/media?url='+encodeURIComponent(image));
 assert.equal(proxy('http://localhost:8796/',false).mediaUrl(image),'https://project.supabase.co/functions/v1/lorefy-public/media?url='+encodeURIComponent(image));
});

test('chapter thumbnails take the displayed poster, not a removed hero child or backdrop',()=>{
 const source=fs.readFileSync('modules/lorefy-chapter-detail.js','utf8');
 const poster={getAttribute:()=>'/owner-chosen-cover.jpg'},legacy={getAttribute:()=>'/legacy.jpg'};
 for(const current of [poster,null]){
  const content={querySelector:s=>s==='h1'?{textContent:'Berserk'}:null,closest:()=>({querySelector:s=>s==='.lf-work-poster img'?current:s==='.lf-detail-hero > img'?legacy:null})};
  const scope={doc:{querySelector:()=>content},global:{location:{search:'?novel=work'}},URLSearchParams,catalogWork:()=>({id:'work',title:'Berserk',ch:384}),catalogCache:{},core:require('../modules/lorefy-chapter-detail-core.js'),metadata:null,readingOwner:()=> 'owner'};
  vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('  function context()'),source.indexOf('  function reviewFor(')),scope);
  assert.equal(scope.context().cover,current?'/owner-chosen-cover.jpg':'/legacy.jpg');
 }
});

test('chapter artwork recovers visibility and removes its chapter marker after work-cover fallback',()=>{
 const source=fs.readFileSync('modules/lorefy-chapter-detail.js','utf8');
 const removed=[],image={style:{},dataset:{chapterImage:'1'},getAttribute:()=>image.src};
 const scope={el:()=>image,info:{cover:'/work.jpg'},text:(_,en)=>en,art:{classList:{remove:x=>removed.push(x)}}};
 vm.createContext(scope);const start=source.indexOf("        var chapterImage = el('img')"),end=source.indexOf('        art.appendChild(chapterImage)',start);
 vm.runInContext(source.slice(start,end),scope);
 assert.equal(image.referrerPolicy,'no-referrer');
 image.src='/chapter.png';image.onerror();assert.equal(image.src,'/work.jpg');assert.equal(image.dataset.chapterImage,'');assert.deepEqual(removed,['has-chapter-image']);
 image.onerror();assert.equal(image.style.display,'none');image.onload();assert.equal(image.style.display,'');
 image.onerror();assert.equal(image.style.display,'none','work error terminates without cycling sources');
});

test('trusted chapter image is displayed even without a proxy, with a localized truthful label',async()=>{
 const source=fs.readFileSync('modules/lorefy-chapter-detail.js','utf8');
 for(const hasProxy of [false,true]){
  const image={dataset:{},src:''},row={dataset:{},querySelector:s=>s==='.lf-chapter-art img'?image:s==='.lf-chapter-art'?{classList:{add(){}}}:{},parentNode:{querySelector:()=>null}};
  const section={isConnected:true,dataset:{},querySelector:s=>s.includes('lf-chapter-row')?row:{classList:{add(){}}}};
  const scope={metadata:{sourceFor:()=>({}),load:()=>Promise.resolve({1:{title:'Real chapter',image:'https://static.wikia.nocookie.net/hunterxhunter/images/c/cf/Chapter_1.png'}})},global:{fetch(){},...(hasProxy?{LorefyDataProxy:{mediaUrl:src=>'/api/media?url='+encodeURIComponent(src)}}:{})},updateChapterTitle(){},text:(_,en)=>en,english:()=>true};
  vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('  function enrichRows('),source.indexOf('  function workMenuShift(')),scope);
  scope.enrichRows(section,{id:'work',chapterDetails:{}},[1]);await new Promise(r=>setImmediate(r));
  assert.ok(image.src.startsWith(hasProxy?'/api/media?url=':'https://static.wikia.nocookie.net/'));assert.equal(image.alt,'Chapter cover 1');
 }
});

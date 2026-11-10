const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
function harness(){
 const html=fs.readFileSync('index.html','utf8'),code=html.slice(html.indexOf('      var deferredLorefyAssetsStarted'),html.indexOf('      function localIdentity'));
 let time=0,seq=0,refreshes=0;const timers=new Map(),scripts=[],listeners={};
 const document={createElement:()=>({remove(){this.removed=true;}}),head:{appendChild(script){scripts.push({...script,at:time,original:script});}},addEventListener:(name,fn)=>listeners[name]=fn};
 const window={document,__lorefyIngest(){refreshes++;}};
 vm.runInNewContext(html.match(/window\.LOREFY_DEFERRED_ASSETS\s*=\s*\[[\s\S]*?\];/)[0],{window});
 function setTimeout(fn,ms){const key=++seq;timers.set(key,{at:time+ms,fn});return key;}
 vm.runInNewContext(code+';scheduleDeferredLorefyAssets();',{window,document,setTimeout,clearTimeout:key=>timers.delete(key)});
 return {scripts,listeners,get refreshes(){return refreshes;},async advance(ms){const end=time+ms;await flush();for(;;){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;time=next[1].at;timers.delete(next[0]);next[1].fn();await flush();}time=end;},focus(local=false){listeners.focusin?.({target:{tagName:'INPUT',closest:selector=>selector.includes('search-local')?(local?{}:null):{}}});},loaded(name){const script=scripts.find(s=>s.src.includes(name)&&!s.original.removed);script.original.onload();return flush();}};
}
test('online search loads promptly without downloading the legacy synopsis map',async()=>{
 const h=harness();await h.advance(250);assert.ok(h.scripts.some(s=>s.src.includes('open-catalog')));
 await h.loaded('open-catalog');assert.ok(h.scripts.some(s=>s.src.includes('api-catalog')));
 assert.equal(h.refreshes,0,'search helpers do not require rebuilding the catalog');
 await h.advance(15000);assert.ok(!h.scripts.some(s=>s.src.includes('ar-enrichment')));
 assert.equal(h.refreshes,0,'idle loading must not rebuild the catalog');
});
test('focusing media search starts loading immediately and reuses in-flight requests',async()=>{
 const h=harness();h.focus();h.focus();await flush();assert.equal(h.scripts.length,1);assert.equal(h.scripts[0].at,0);
 await h.loaded('open-catalog');h.focus();await flush();assert.equal(h.scripts.filter(s=>s.src.includes('api-catalog')).length,1);
});
test('People/local fields do not trigger on-demand media loading',()=>{
 const h=harness();h.focus(true);assert.equal(h.scripts.length,0);
});
test('failed search helper can be retried on focus without starting bulk enrichment',async()=>{
 const h=harness();h.focus();await flush();assert.ok(h.scripts[0]);h.scripts[0].original.onerror();await flush();h.focus();await flush();
 assert.equal(h.scripts.filter(s=>s.src.includes('open-catalog')).length,2);
 await h.advance(15000);assert.ok(!h.scripts.some(s=>s.src.includes('ar-enrichment')));
});

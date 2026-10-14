/* Loaded only by tools/prepare-ios-local-profile.mjs. No network or user content. */
(function(root){
 'use strict';
 const timer=root.setTimeout.bind(root),interval=root.setInterval.bind(root),raf=root.requestAnimationFrame.bind(root),Observer=root.MutationObserver,stats=new Map();
 function label(fn){const text=String(fn);for(const name of ['growthMaintenanceTick','translateTree','ensureOwnerPostMetric','syncProfileTopCharacters','enhanceDetail','scheduleEnhance','sync'])if(text.includes(name))return name;return fn.name||'anonymous';}
 function measure(name,fn){const start=performance.now();try{return fn();}finally{const ms=performance.now()-start,s=stats.get(name)||{calls:0,totalMs:0,maxMs:0,over16:0};s.calls++;s.totalMs+=ms;s.maxMs=Math.max(s.maxMs,ms);if(ms>16)s.over16++;stats.set(name,s);}}
 root.LorefyPerformanceProbe={measure:measure};
 root.setTimeout=function(fn,delay,...args){return timer(typeof fn==='function'?function(){return measure('timer:'+label(fn),()=>fn.apply(this,args));}:fn,delay,...args);};
 root.requestAnimationFrame=function(fn){return raf(function(time){return measure('raf:'+label(fn),()=>fn(time));});};
 root.MutationObserver=function(fn){return new Observer(function(records,observer){return measure('observer:'+label(fn),()=>fn(records,observer));});};root.MutationObserver.prototype=Observer.prototype;
 document.addEventListener('input',function(){const start=performance.now();raf(()=>{measure('input.nextFrame',()=>{});const s=stats.get('input.nextFrame');s.totalMs+=performance.now()-start;s.maxMs=Math.max(s.maxMs,performance.now()-start);});},true);
 function flush(){const rows=Array.from(stats,([name,s])=>({name,calls:s.calls,totalMs:+s.totalMs.toFixed(1),maxMs:+s.maxMs.toFixed(1),over16:s.over16})).sort((a,b)=>b.totalMs-a.totalMs).slice(0,18);console.log('LOREFY_PERF '+JSON.stringify({elapsedMs:Math.round(performance.now()),rows:rows}));}
 interval(flush,5000);root.addEventListener('pagehide',flush);
})(window);

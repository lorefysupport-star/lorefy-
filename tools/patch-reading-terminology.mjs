import {readFileSync, writeFileSync} from 'node:fs';
const file='uploads/files/lorefy-app.js';
let source=readFileSync(file,'utf8');
function once(before,after){
  if(source.includes(after))return;
  if(source.split(before).length!==2)throw Error('Ambiguous or missing reading display anchor: '+before.slice(0,100));
  source=source.replace(before,after);
}
once('window.LorefyI18n.translate(e,lang)','lorefyReadingStatusLabel(e,lang)');
once('s?window.LorefyI18n.translate(s,W):uiText','s?lorefyReadingStatusLabel(s,W):uiText');
const start=source.indexOf('className:"lf-library-tabs"'),end=source.indexOf('Object.keys(b).length>t.length',start);
if(start<0||end<0)throw Error('Library tab bounds missing');
let tabs=source.slice(start,end);
const oldLabel='React.createElement("span",null,n)';
if(!tabs.includes('lorefyReadingStatusLabel(o,W)')){
 if(tabs.split(oldLabel).length!==2)throw Error('Library label anchor missing');
 tabs=tabs.replace(oldLabel,'React.createElement("span",null,o==="all"?uiText(W,"الكل","All"):lorefyReadingStatusLabel(o,W))');
 source=source.slice(0,start)+tabs+source.slice(end);
}
const arrayStart=source.indexOf('[["all",',start),arrayEnd=source.indexOf('.map(([o,n,s])',arrayStart);
if(arrayStart>=0&&arrayEnd>arrayStart&&arrayEnd<end){
 source=source.slice(0,arrayStart)+'[["all",t.length],[STATUS_READING,d],[STATUS_DONE,s],[STATUS_WISHLIST,h],[STATUS_PAUSED,g],[STATUS_DROPPED,dropCount]].map(([o,s])'+source.slice(arrayEnd+'.map(([o,n,s])'.length);
}
// The profile uses the same keys, but owns its filtering and selected state.
once('}},n.l)})))','}},lorefyReadingStatusLabel(n.k,W))})))');
const profileStart=source.indexOf('[{k:STATUS_READING,l:'),profileEnd=source.indexOf('.map(n=>',profileStart);
if(profileStart>=0){if(profileEnd<0)throw Error('Profile filter bounds missing');source=source.slice(0,profileStart)+'STATUS_OPTIONS'+source.slice(profileEnd).replace('.map(n=>{const s=Rt===n.k;', '.map(k=>({k})).map(n=>{const s=Rt===n.k;');}
const emptyStart=source.indexOf(',s={[STATUS_READING]'),emptyEnd=source.indexOf(';return n.length===0',emptyStart);
if(emptyStart>=0){if(emptyEnd<0)throw Error('Profile empty bounds missing');source=source.slice(0,emptyStart)+source.slice(emptyEnd);}
once('}},s[Rt]):React.createElement','}},window.LorefyI18n.readingStatusEmpty(Rt,W)):React.createElement');
once('d.k===STATUS_PAUSED?"متوقف مؤقتًا":d.k===STATUS_DROPPED?"توقفت نهائيًا":lorefyReadingStatusLabel(d.k,W)','lorefyReadingStatusLabel(d.k,W)');
once('filtered:q!=="all",onClear:','filtered:q!=="all",status:q,onClear:');
once('n.slice(0,PROFILE_LIBRARY_BATCH).map(d=>React.createElement("div",{key:d.id,onClick:()=>T(d),style:{cursor:"pointer",aspectRatio:"2/3"',
 'n.slice(0,PROFILE_LIBRARY_BATCH).map(d=>React.createElement("button",{key:d.id,type:"button","data-reading-work-id":d.id,"aria-label":uiText(W,"فتح "+d.title,"Open "+d.title),onClick:()=>T(d),style:{cursor:"pointer",padding:0,background:"none",fontFamily:"inherit",aspectRatio:"2/3"');
writeFileSync(file,source);
const assets=['uploads/files/lorefy-app.js','modules/lorefy-i18n.js','modules/lorefy-work-panels.js','modules/lorefy-growth-features.js','modules/lorefy-public-profile.js','modules/lorefy-library-cinema.js'];
for(const entry of ['index.html','sw.js']){
 let text=readFileSync(entry,'utf8');
 for(const asset of assets){
  const pattern=new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[\\w-]+','g');
  if(!pattern.test(text))throw Error('Versioned entry missing '+asset);
  text=text.replace(pattern,asset+'?v=20261028-reading-terms-v1');
 }
 if(entry==='sw.js')text=text.replace("const CACHE = 'lorefy-v619-legal-studio';","const CACHE = 'lorefy-v620-reading-terms';");
 writeFileSync(entry,text);
}
console.log('Updated reading display call sites only; stored keys, filters and save callbacks retained.');

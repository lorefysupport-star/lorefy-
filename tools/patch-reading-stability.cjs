const fs = require('node:fs');
const path = require('node:path');
const target = path.resolve(__dirname,'../uploads/files/lorefy-app.js');
let source = fs.readFileSync(target,'utf8');
if (source.includes('initializeCompletedProgress({library:b')) {
  console.log('Reading stability integration already installed');
  process.exit(0);
}
function replaceOnce(from,to,label) {
  const count = source.split(from).length-1;
  if (count!==1) throw new Error(`${label}: expected 1 anchor, found ${count}`);
  source=source.replace(from,to);
}
const start=source.lastIndexOf('useEffect(()=>{',source.indexOf('sanitizeLegacyProgress'));
const end=source.indexOf(';const Un=',start);
if (start<0 || end<start || end-start>1600) throw new Error('Legacy migration bounds not found');
source=source.slice(0,start)+
  'useEffect(()=>{const migrate=()=>Ee(r=>{const result=window.LorefyReadingMetrics.initializeCompletedProgress({library:b,progressById:r,getWork:workById,getTotals:work=>({ch:workChapterCount(work),vol:workVolumeCount(work),pages:workPageCount(work)})});return result.changedIds.length?result.progressById:r});window.addEventListener("lorefy:catalog-ingested",migrate);migrate();return()=>window.removeEventListener("lorefy:catalog-ingested",migrate)},[Y,b,le])'+source.slice(end);
replaceOnce('normalizeProgress=(e={})=>typeof e=="number"?{chapter:Math.max(0,e||0),volume:0,page:0,note:""}:{chapter:Math.max(0,Number(e.chapter??e.ch??0)||0),volume:Math.max(0,Number(e.volume??e.vol??0)||0),page:Math.max(0,Number(e.page??0)||0),note:String(e.note||"")}',
  'normalizeProgress=(e={})=>window.LorefyReadingMetrics.normalizeProgress(e)','Finite progress normalization');
replaceOnce('qn=()=>{if(E){const delta=window.LorefyReadingMetrics.checkpointChapterDelta(le[E.id],to);',
  'qn=()=>{const saved=E&&ie===STATUS_DONE?window.LorefyReadingMetrics.completionCheckpoint(E,to,{ch:workChapterCount(E),vol:workVolumeCount(E),pages:workPageCount(E)}):normalizeProgress(to);if(E){const delta=window.LorefyReadingMetrics.checkpointChapterDelta(le[E.id],saved);','Explicit completion checkpoint');
replaceOnce('Ee(t=>({...t,[E.id]:normalizeProgress(to)}))','Ee(t=>({...t,[E.id]:saved}))','Persist checkpoint');
replaceOnce('Zn=t=>{t&&($(r=>{const o={...r};return delete o[t.id],o}),j(r=>({...r,[t.id]:STATUS_DONE})))}',
  'Zn=t=>{t&&($(r=>{const o={...r};return delete o[t.id],o}),Ee(r=>({...r,[t.id]:window.LorefyReadingMetrics.completionCheckpoint(t,r[t.id],{ch:workChapterCount(t),vol:workVolumeCount(t),pages:workPageCount(t)})})),j(r=>({...r,[t.id]:STATUS_DONE})))}','Quick completion checkpoint');
fs.writeFileSync(target,source);
console.log('Integrated stable completion checkpoints');

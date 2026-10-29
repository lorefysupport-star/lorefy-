import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const file=fileURLToPath(new URL('../uploads/files/lorefy-app.js',import.meta.url));
let source=readFileSync(file,'utf8');
if(!source.includes('LorefyReaderLayout.composeOwner')) {
  const start=source.indexOf('},cr=()=>{'),end=source.indexOf('},pr=()=>{',start);
  const ret=source.indexOf('return React.createElement("div",{className:"lf-screen-scroll lf-profile-page"',start);
  if(start<0||end<0||ret<start||ret>end)throw Error('Reader layout source anchors changed');
  const expression=source.slice(ret+7,end);
  const props='{lang:W,onEdit:Ho,onSettings:()=>ae(true),onLibrary:()=>nt("library"),onWork:T,onImageError:R,reading:Object.entries(b).filter(([id,status])=>status===STATUS_READING).map(([id])=>{const work=workById(id);return work?{work,cover:I(work),chapter:normalizeProgress(le[id]).chapter,total:workChapterCount(work)}:null}).filter(Boolean)}';
  source=source.slice(0,ret)+'return window.LorefyReaderLayout.composeOwner('+expression+','+props+')'+source.slice(end);
  writeFileSync(file,source);
}

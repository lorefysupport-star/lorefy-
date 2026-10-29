import fs from 'node:fs';
const path='uploads/files/lorefy-app.js';
let source=fs.readFileSync(path,'utf8');
const before='s=progressTotal(E);return React.createElement("div"';
const marker='s=progressTotal(E);if(window.LorefyWorkPanels)';
if(!source.includes(marker)){
 if(source.split(before).length!==2)throw Error('Reading status hook is not unique');
 const hook='s=progressTotal(E);if(window.LorefyWorkPanels){const owner=lorefyReviewRequestScope();return React.createElement(window.LorefyWorkPanels.Status,{key:(owner&&owner.owner||"guest")+":"+E.id,work:E,cover:I(E),typeLabel:typeLabel(E.type,W),language:W,choices:t.map(choice=>choice.k),status:ie,progress:o,trackProgress:r,isText:isTextWork(E),total:s,inLibrary:!!b[E.id],isCurrent:()=>lorefyReviewRequestCurrent(owner),onSelect:eo,onProgress:n,onSave:qn,onRemove:()=>We(E.id),onClose:()=>be(null)})}return React.createElement("div"';
 source=source.replace(before,hook);
 fs.writeFileSync(path,source);
}
if(source.includes('key:String(owner)+":"+E.id')){source=source.replace('key:String(owner)+":"+E.id','key:(owner&&owner.owner||"guest")+":"+E.id');fs.writeFileSync(path,source);}
console.log('Reading studio hook verified; legacy renderer retained as fallback.');
const coverBefore='hasMoreCovers=coverVisibleLimit<r.length;return React.createElement("div"';
if(!source.includes('hasMoreCovers=coverVisibleLimit<r.length;if(window.LorefyWorkPanels)')){
 if(source.split(coverBefore).length!==2)throw Error('Cover studio hook is not unique');
 source=source.replace(coverBefore,'hasMoreCovers=coverVisibleLimit<r.length;if(window.LorefyWorkPanels){const owner=lorefyReviewRequestScope();return React.createElement(window.LorefyWorkPanels.Cover,{key:(owner&&owner.owner||"guest")+":"+t.id,work:t,cover:n,typeLabel:typeLabel(t.type,W),language:W,options:visibleCoverOptions,loading:_n,uploading:qe,hasCustom:!!Tt[t.id],hasMore:hasMoreCovers,isCurrent:()=>lorefyReviewRequestCurrent(owner),onMore:()=>setCoverVisibleLimit(s=>Math.min(s+COVER_PICKER_BATCH,r.length)),onUpload:e=>Gn(e,t),onApply:src=>Kn(t.id,src),onClose:()=>xe(null)})}return React.createElement("div"');
 fs.writeFileSync(path,source);
}
console.log('Cover studio hook verified; catalog and upload callbacks preserved.');

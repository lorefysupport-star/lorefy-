import {readFileSync,writeFileSync} from 'node:fs';
const file='uploads/files/lorefy-app.js';
let source=readFileSync(file,'utf8');
if(!source.includes('return window.LorefyLibraryMedia.card(React.createElement("button",{type:"button",className:"lf-library-card"')){
  const start=source.indexOf('libraryVisible.map('),end=source.indexOf('},cr=()=>',start);
  if(start<0||end<0)throw new Error('Library map boundaries changed');
  let section=source.slice(start,end);
  const before='return React.createElement("button",{type:"button",className:"lf-library-card"';
  const suffix=')})))';
  if(section.split(before).length!==2||!section.endsWith(suffix))throw new Error('Library card shape changed');
  section=section.replace(before,'return window.LorefyLibraryMedia.card(React.createElement("button",{type:"button",className:"lf-library-card"');
  section=section.slice(0,-suffix.length)+'),{lang:W})})))';
  source=source.slice(0,start)+section+source.slice(end);
  writeFileSync(file,source);
}

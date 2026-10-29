import {readFileSync,writeFileSync} from 'node:fs';
const file='uploads/files/lorefy-app.js';let source=readFileSync(file,'utf8');
if(!source.includes('r&&o&&window.LorefyLibraryMedia.card')){
 const begin='r&&o&&React.createElement("div",{onClick:y=>{y.stopPropagation(),T(o)}',end='React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:280}}';
 const start=source.indexOf(begin),stop=source.indexOf(end,start);if(start<0||stop<0||source.indexOf(begin,start+1)>=0)throw new Error('Review work tile shape changed');
 let card=source.slice(start,stop);if(!card.endsWith(')),')||!card.includes('legalCoverOf(o)'))throw new Error('Review work cover boundary changed');
 card=card.replace('r&&o&&React.createElement("div",{','r&&o&&window.LorefyLibraryMedia.card(React.createElement("div",{className:"lf-community-work-card",');
 card=card.slice(0,-1)+',{lang:W,workId:o.id,title:o.title,artClass:"lf-review-work-art"}),';source=source.slice(0,start)+card+source.slice(stop);writeFileSync(file,source);
}

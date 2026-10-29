import {readFileSync,writeFileSync} from 'node:fs';
const file='uploads/files/lorefy-app.js';let source=readFileSync(file,'utf8');
function once(before,after){if(source.includes(after))return;if(source.split(before).length!==2)throw Error('Ambiguous reading typography anchor: '+before.slice(0,80));source=source.replace(before,after);}
once('className:"lf-library-copy"},React.createElement("strong",null,o.title),React.createElement("span",{"data-no-translate":"1"}',
 'className:"lf-library-copy"},React.createElement("strong",{dir:"auto",title:o.title,"data-no-translate":"1"},o.title),React.createElement("span",{"data-no-translate":"1",dir:W==="en"?"ltr":"rtl"}');
writeFileSync(file,source);
const assets=['uploads/files/lorefy-app.js','modules/lorefy-home-cinema.js','modules/lorefy-reader-layout.js','modules/lorefy-library-view.js','modules/lorefy-public-profile.js','styles/lorefy-home-immersive.css','styles/lorefy-library-refined.css','styles/lorefy-profile-refined.css','styles/lorefy-book-showcase.css'];
for(const file of ['index.html','sw.js']){
 let text=readFileSync(file,'utf8');
 for(const asset of assets){const pattern=new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[\\w-]+','g');if(!pattern.test(text))throw Error('Missing versioned asset '+asset);text=text.replace(pattern,asset+'?v=20261028-reading-type-v1');}
 if(file==='sw.js')text=text.replace("const CACHE = 'lorefy-v620-reading-terms';","const CACHE = 'lorefy-v621-reading-type';");
 writeFileSync(file,text);
}
console.log('Isolated the original library title and checkpoint text; no catalog or storage data changed.');

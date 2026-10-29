import fs from 'node:fs';

// The canonical React bundle is minified; restrict edits to its profile renderer.
const file='uploads/files/lorefy-app.js';
let source=fs.readFileSync(file,'utf8');
const start=source.indexOf('},cr=()=>{'),end=source.indexOf('},pr=()=>{',start);
if(start<0||end<0)throw Error('Profile renderer boundary changed');
let profile=source.slice(start,end);
for(const [before,after] of [
  ['r=Ie.map(n=>workById(n)).filter(Boolean).slice(0,4)','r=Ie.map(n=>workById(n)).filter(Boolean).slice(0,7)'],
  ['Math.max(0,4-r.length)','Math.max(0,7-r.length)']
]) {
  if(!profile.includes(before)&&!profile.includes(after))throw Error('Favorite renderer contract changed: '+before);
  profile=profile.replace(before,after);
}
source=source.slice(0,start)+profile+source.slice(end);
const oldPicker='return n?d:[o.id,...d].slice(0,4)',newPicker='return n?d:[o.id,...d].slice(0,7)';
if(!source.includes(oldPicker)&&!source.includes(newPicker))throw Error('Legacy favorites picker changed');
fs.writeFileSync(file,source.replace(oldPicker,newPicker));

const growthFile='modules/lorefy-growth-features.js';
source=fs.readFileSync(growthFile,'utf8');
const a=source.indexOf('  function openProfileFavouriteWorksEditor('),b=source.indexOf('  function syncProfileTopCharacters(',a);
if(a<0||b<0)throw Error('Favorite editor boundary changed');
const editor=source.slice(a,b).replaceAll('slice(0, 4)','slice(0, 7)').replace('draft.length < 4','draft.length < 7').replace('Math.min(3, initialSlot)','Math.min(6, initialSlot)');
fs.writeFileSync(growthFile,source.slice(0,a)+editor+source.slice(b));

const version='20261024-wood-shelf-v1';
const assets=['modules/lorefy-library-view.js','modules/lorefy-public-profile.js','modules/lorefy-interface-settings.js','styles/lorefy-book-showcase.css','uploads/files/lorefy-app.js','modules/lorefy-growth-features.js'];
for(const file of ['index.html','sw.js']) {
  let text=fs.readFileSync(file,'utf8');
  for(const asset of assets)text=text.replace(new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[a-zA-Z0-9-]+','g'),asset+'?v='+version);
  if(file==='sw.js') {
    text=text.replace('lorefy-v566-book-showcase','lorefy-v567-wood-shelf');
    if(!text.includes("'./assets/shelves/wall-walnut-v1.png'"))text=text.replace("const CORE = [","const CORE = [\n  './assets/shelves/wall-walnut-v1.png',");
  }
  fs.writeFileSync(file,text);
}
const test='tests/ui-unity.test.js';
let unity=fs.readFileSync(test,'utf8');
for(const asset of assets)unity=unity.replace(new RegExp("'"+asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"':'[a-zA-Z0-9-]+'"),"'"+asset+"':'"+version+"'");
fs.writeFileSync(test,unity);

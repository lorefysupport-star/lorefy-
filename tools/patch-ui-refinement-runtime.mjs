import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
const version='20261027-ui-refinement-v1';
const assets=['styles/lorefy-home-immersive.css','modules/lorefy-home-cinema.js','modules/lorefy-library-cinema.js','modules/lorefy-profile-sections.js','modules/lorefy-page-refresh.js','styles/lorefy-page-refresh.css','uploads/files/lorefy-app.js'];
for(const file of ['index.html','sw.js']){
 let text=readFileSync(file,'utf8');
 for(const asset of assets){
  const pattern=new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[\\w-]+','g');
  if(!pattern.test(text))throw Error('Runtime asset missing: '+file+' '+asset);
  text=text.replace(pattern,asset+'?v='+version);
 }
 if(file==='sw.js'){
  text=text.replace("const CACHE = 'lorefy-v604-home-reference';","const CACHE = 'lorefy-v605-ui-refinement';");
  for(const asset of ['styles/lorefy-library-refined.css?v=20261027-library-refined-v1','styles/lorefy-profile-refined.css?v=20261027-profile-refined-v1'])if(!text.includes(asset))text=text.replace('const CORE = [','const CORE = [\n \'./'+asset+'\',');
 }
 writeFileSync(file,text);
}
const files=[...assets,'styles/lorefy-library-refined.css','styles/lorefy-profile-refined.css','index.html','sw.js'];
for(const mirror of ['ios-web','ios/App/App/public'])for(const file of files){
 const destination=resolve(mirror,file);mkdirSync(dirname(destination),{recursive:true});copyFileSync(file,destination);
}
console.log('Updated and selectively mirrored '+files.length+' web assets; no native prepare/build.');

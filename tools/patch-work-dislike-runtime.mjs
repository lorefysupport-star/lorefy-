import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
const version='20261028-work-dislike-v1';
const assets=['backend/lorefy-backend.js','modules/lorefy-review-editor.js','modules/lorefy-home-cinema.js','modules/lorefy-growth-features.js','uploads/files/lorefy-app.js','styles/lorefy-work-studio.css'];
for(const file of ['index.html','sw.js']){
 let source=readFileSync(file,'utf8');
 for(const asset of assets){
  const pattern=new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[\\w-]+','g');
  if(!pattern.test(source))throw Error('Missing runtime entry: '+asset+' in '+file);
  source=source.replace(pattern,asset+'?v='+version);
 }
 if(file==='sw.js'){
  if(!/const CACHE = 'lorefy-v(?:606-durable-inbox|607-work-dislike)';/.test(source))throw Error('Unexpected cache generation');
  source=source.replace(/const CACHE = 'lorefy-v(?:606-durable-inbox|607-work-dislike)';/,"const CACHE = 'lorefy-v607-work-dislike';");
 }
 writeFileSync(file,source);
}
for(const mirror of ['ios-web','ios/App/App/public'])for(const file of [...assets,'index.html','sw.js']){
 const target=resolve(mirror,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(file,target);
}
console.log('Eight source web files selectively synchronized; no build or deployment.');

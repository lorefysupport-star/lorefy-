import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

const version='20261027-durable-inbox-v1';
const assets=['backend/lorefy-native-runtime.js','modules/lorefy-reading-metrics.js','uploads/files/lorefy-app.js'];
const style='styles/lorefy-notification-center.css';
for(const file of ['index.html','sw.js']){
 let source=readFileSync(file,'utf8');
 for(const asset of assets){
  const pattern=new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[\\w-]+','g');
  if(!pattern.test(source))throw Error('Missing runtime asset: '+file+' '+asset);
  source=source.replace(pattern,asset+'?v='+version);
 }
 if(file==='sw.js'){
  if(!/const CACHE = 'lorefy-v(?:605-ui-refinement|606-durable-inbox)';/.test(source))throw Error('Unexpected cache generation');
  source=source.replace(/const CACHE = 'lorefy-v(?:605-ui-refinement|606-durable-inbox)';/,"const CACHE = 'lorefy-v606-durable-inbox';");
  if(!source.includes(style))source=source.replace('const CORE = [',"const CORE = [\n './"+style+"?v=20261027-inbox-durable-v1',");
 }
 writeFileSync(file,source);
}
const files=[...assets,style,'index.html','sw.js'];
for(const mirror of ['ios-web','ios/App/App/public'])for(const file of files){
 const target=resolve(mirror,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(file,target);
}
console.log('Selectively synchronized '+files.length+' web files; no native build or upload.');

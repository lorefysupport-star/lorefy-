import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
const assets=['modules/lorefy-cover-media.js','modules/lorefy-growth-features.js','styles/lorefy-cover-media.css'];
for(const file of ['index.html','sw.js']){
 let source=readFileSync(file,'utf8');for(const asset of assets){const escaped=asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');source=source.replace(new RegExp('('+escaped+'\\?v=)[^"\'\\s]+','g'),'$120261029-list-portrait-v1');}
 if(file==='sw.js')source=source.replace(/const CACHE = '[^']+';/,"const CACHE = 'lorefy-v630-list-portrait';");writeFileSync(file,source);
}
for(const file of ['index.html','sw.js',...assets])for(const mirror of ['ios-web','ios/App/App/public'])copyFileSync(file,mirror+'/'+file);

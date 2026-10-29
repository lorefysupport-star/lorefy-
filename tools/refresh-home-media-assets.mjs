import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
const assets=['modules/lorefy-home-cinema.js','modules/lorefy-cover-media.js','modules/lorefy-library-media.js','styles/lorefy-cover-media.css'];
for(const file of ['index.html','sw.js']){
 let source=readFileSync(file,'utf8');
 for(const asset of assets){const escaped=asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');source=source.replace(new RegExp('('+escaped+'\\?v=)[^"\'\\s]+','g'),'$120261029-home-media-v1');}
 if(file==='sw.js')source=source.replace(/const CACHE = '[^']+';/,"const CACHE = 'lorefy-v626-home-media';");
 writeFileSync(file,source);
}
for(const file of ['index.html','sw.js',...assets])for(const mirror of ['ios-web','ios/App/App/public'])copyFileSync(file,mirror+'/'+file);

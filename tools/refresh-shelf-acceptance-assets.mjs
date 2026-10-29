import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';

const asset='styles/lorefy-profile-refined.css',old='20261028-reading-type-v1',version='20261029-shelf-acceptance-v1';
const before='lorefy-v634-search-editions',cache='lorefy-v635-shelf-acceptance';
const media='styles/lorefy-cover-media.css',mediaOld='20261029-rated-profile-media-v1';
for(const file of ['index.html','sw.js']){
 let source=readFileSync(file,'utf8');
 if(!source.includes(asset+'?v='+old)&&!source.includes(asset+'?v='+version))throw Error('Unexpected asset key: '+file);
 source=source.replaceAll(asset+'?v='+old,asset+'?v='+version);
 if(!source.includes(media+'?v='+mediaOld)&&!source.includes(media+'?v='+version))throw Error('Unexpected media key: '+file);
 source=source.replaceAll(media+'?v='+mediaOld,media+'?v='+version);
 if(file==='sw.js'){
  if(!source.includes("const CACHE = '"+before+"';")&&!source.includes("const CACHE = '"+cache+"';"))throw Error('Unexpected cache');
  source=source.replace("const CACHE = '"+before+"';","const CACHE = '"+cache+"';");
 }
 writeFileSync(file,source);
}
for(const file of ['index.html','sw.js',asset,media])for(const mirror of ['ios-web','ios/App/App/public'])copyFileSync(file,mirror+'/'+file);
for(const name of ['community-copy','cover-media','data-studio','legal-studio','reading-terminology','reading-typography','report-studio','ui-unity','work-byline-typography']){
 const file='tests/'+name+'.test.js';
 writeFileSync(file,readFileSync(file,'utf8').replaceAll(before,cache));
}

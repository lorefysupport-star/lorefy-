import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
const assets={'modules/lorefy-explore-studio.js':'20261029-editorial-media-v1','modules/lorefy-api-catalog.js':'20261025-open-catalog','styles/lorefy-explore-cinema.css':'20261028-byline-type-v1'},version='20261029-search-editions-v1',cache='lorefy-v634-search-editions';
for(const file of ['index.html','sw.js']){
 let source=readFileSync(file,'utf8');
 for(const [asset,old] of Object.entries(assets)){
  if(!source.includes(asset+'?v='+old)&&!source.includes(asset+'?v='+version))throw Error('Unexpected asset key: '+file+' '+asset);
  source=source.replaceAll(asset+'?v='+old,asset+'?v='+version);
 }
 if(file==='sw.js'){
  if(!source.includes("const CACHE = 'lorefy-v633-rated-profile-media';")&&!source.includes("const CACHE = '"+cache+"';"))throw Error('Unexpected cache');
  source=source.replace("const CACHE = 'lorefy-v633-rated-profile-media';","const CACHE = '"+cache+"';");
 }
 writeFileSync(file,source);
}
for(const file of ['index.html','sw.js',...Object.keys(assets)])for(const mirror of ['ios-web','ios/App/App/public'])copyFileSync(file,mirror+'/'+file);
for(const file of ['community-copy','cover-media','data-studio','legal-studio','reading-terminology','reading-typography','report-studio','ui-unity','work-byline-typography']){
 const target='tests/'+file+'.test.js';let source=readFileSync(target,'utf8').replaceAll('lorefy-v633-rated-profile-media',cache);
 if(['cover-media','ui-unity','work-byline-typography'].includes(file))source=source.replaceAll('20261029-editorial-media-v1',version);
 if(file==='ui-unity')source=source.replace("'styles/lorefy-explore-cinema.css':'20261028-byline-type-v1'","'styles/lorefy-explore-cinema.css':'"+version+"'");
 writeFileSync(target,source);
}

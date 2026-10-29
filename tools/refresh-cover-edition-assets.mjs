import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
const assets={'uploads/files/lorefy-app.js':'20261029-work-editor-media-v1','modules/lorefy-cover-api.js':'20261008-arabic-breadth-v4','modules/lorefy-work-panels.js':'20261028-reading-terms-v1','styles/lorefy-work-studio.css':'20261028-work-dislike-v1'};
const version='20261029-cover-editions-v1',before='lorefy-v635-shelf-acceptance',cache='lorefy-v636-cover-editions';
for(const file of ['index.html','sw.js']){
 let source=readFileSync(file,'utf8');
 for(const [asset,old] of Object.entries(assets)){
  if(!source.includes(asset+'?v='+old)&&!source.includes(asset+'?v='+version))throw Error('Unexpected asset key: '+file+' '+asset);
  source=source.replaceAll(asset+'?v='+old,asset+'?v='+version);
 }
 if(file==='sw.js'){
  if(!source.includes("const CACHE = '"+before+"';")&&!source.includes("const CACHE = '"+cache+"';"))throw Error('Unexpected cache');
  source=source.replace("const CACHE = '"+before+"';","const CACHE = '"+cache+"';");
 }
 writeFileSync(file,source);
}
for(const file of ['index.html','sw.js',...Object.keys(assets)])for(const mirror of ['ios-web','ios/App/App/public'])copyFileSync(file,mirror+'/'+file);
for(const name of ['community-copy','cover-media','data-studio','legal-studio','reading-terminology','reading-typography','report-studio','ui-unity','work-byline-typography']){
 const file='tests/'+name+'.test.js';let source=readFileSync(file,'utf8').replaceAll(before,cache);
 if(['reading-terminology','reading-typography'].includes(name))source=source.replaceAll("asset==='uploads/files/lorefy-app.js'?'20261029-work-editor-media-v1'","asset==='uploads/files/lorefy-app.js'?'"+version+"'");
 if(name==='reading-terminology')source=source.replace("asset==='modules/lorefy-growth-features.js'?","asset==='modules/lorefy-work-panels.js'?'"+version+"':asset==='modules/lorefy-growth-features.js'?");
 if(name==='ui-unity')for(const [asset,old] of Object.entries(assets))source=source.replace("'"+asset+"':'"+old+"'","'"+asset+"':'"+version+"'");
 writeFileSync(file,source);
}

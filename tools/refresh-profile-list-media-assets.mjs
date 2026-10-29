import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
const assets={
  'modules/lorefy-profile-sections.js':'20261027-ui-refinement-v1',
  'styles/lorefy-cover-media.css':'20261029-category-board-v1'
};
const version='20261029-profile-list-media-v1',cache='lorefy-v632-profile-list-media';
for(const file of ['index.html','sw.js']){
  let source=readFileSync(file,'utf8');
  for(const [asset,old] of Object.entries(assets)){
    if(!source.includes(asset+'?v='+old)&&!source.includes(asset+'?v='+version))throw Error('Unexpected asset key: '+file+' '+asset);
    source=source.replaceAll(asset+'?v='+old,asset+'?v='+version);
  }
  if(file==='sw.js'){
    if(!source.includes("const CACHE = 'lorefy-v631-category-board';")&&!source.includes("const CACHE = '"+cache+"';"))throw Error('Unexpected cache');
    source=source.replace("const CACHE = 'lorefy-v631-category-board';","const CACHE = '"+cache+"';");
  }
  writeFileSync(file,source);
}
for(const file of ['index.html','sw.js',...Object.keys(assets)])for(const mirror of ['ios-web','ios/App/App/public'])copyFileSync(file,mirror+'/'+file);
for(const file of ['community-copy','cover-media','data-studio','legal-studio','reading-terminology','reading-typography','report-studio','ui-unity','work-byline-typography']){
  const target='tests/'+file+'.test.js',source=readFileSync(target,'utf8');writeFileSync(target,source.replaceAll('lorefy-v631-category-board',cache));
}

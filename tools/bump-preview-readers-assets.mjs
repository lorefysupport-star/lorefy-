import fs from 'node:fs';
const base=new URL('../',import.meta.url),version='20261009-in-app-readers-v1';
const paths=['uploads/files/lorefy-app.js','modules/lorefy-public-profile.js','styles/lorefy-public-profile.css','modules/lorefy-i18n.js','modules/lorefy-user-discovery.js'];
for(const file of ['index.html','sw.js']){
  const target=new URL(file,base);let source=fs.readFileSync(target,'utf8');
  for(const path of paths)source=source.replaceAll(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[a-zA-Z0-9-]+','g'),path+'?v='+version);
  if(file==='sw.js'){
    source=source.replace("const CACHE = 'lorefy-v416-followers-language';","const CACHE = 'lorefy-v417-preview-readers';");
    const asset="  './modules/lorefy-preview-readers.js?v="+version+"',";
    if(!source.includes(asset))source=source.replace("  './modules/lorefy-i18n.js",asset+"\n  './modules/lorefy-i18n.js");
  }
  fs.writeFileSync(target,source);
}

import fs from 'node:fs';
const base=new URL('../',import.meta.url),version='20261009-public-appearance-v4';
const paths=['backend/lorefy-backend.js','modules/lorefy-i18n.js','modules/lorefy-public-appearance.js','modules/lorefy-public-profile.js','styles/lorefy-public-profile.css','modules/lorefy-user-discovery.js','modules/lorefy-growth-features.js','modules/lorefy-community.js','styles/lorefy-community.css','modules/lorefy-preview-readers.js'];
for(const file of ['index.html','sw.js']){
  const target=new URL(file,base);let source=fs.readFileSync(target,'utf8');
  for(const path of paths)source=source.replaceAll(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[a-zA-Z0-9-]+','g'),path+'?v='+version);
  if(file==='index.html'){
    const asset='<script defer src="modules/lorefy-public-appearance.js?v='+version+'"></script>';
    if(!source.includes(asset))source=source.replace('<script defer src="modules/lorefy-public-profile.js',asset+'\n<script defer src="modules/lorefy-public-profile.js');
  }else{
    source=source.replace("const CACHE = 'lorefy-v420-public-appearance';","const CACHE = 'lorefy-v421-public-appearance';");
    const asset="  './modules/lorefy-public-appearance.js?v="+version+"',";
    if(!source.includes(asset))source=source.replace("  './modules/lorefy-public-profile.js",asset+"\n  './modules/lorefy-public-profile.js");
  }
  fs.writeFileSync(target,source);
}

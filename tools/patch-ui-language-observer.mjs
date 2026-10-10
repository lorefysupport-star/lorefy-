import fs from 'node:fs';
const file=new URL('../uploads/files/lorefy-app.js',import.meta.url);
let source=fs.readFileSync(file,'utf8');
const start=source.indexOf('useEffect(()=>{if(document.documentElement.lang=W'),end=source.indexOf('},[W])',start);
if(start<0||end<0)throw Error('Language effect boundaries changed');
const section=source.slice(start,end);
const before='{childList:!0,subtree:!0,characterData:!0}',after='{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["placeholder","aria-label","title"]}';
if(section.includes(before)){
  if(section.split(before).length!==3)throw Error('Language observer anchors changed');
  source=source.slice(0,start)+section.replaceAll(before,after)+source.slice(end);
  fs.writeFileSync(file,source);
}

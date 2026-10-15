const fs=require('node:fs'),path=require('node:path');

function patch(source) {
  const start=source.indexOf('mr=()=>{if(!Fo)'),end=source.indexOf(',vr=',start);
  if(start<0||end<0)throw new Error('Connection renderer not found');
  const before='onKeyDown:e=>{(e.key==="Enter"||e.key===" ")&&',
    after='onKeyDown:e=>{e.target===e.currentTarget&&(e.key==="Enter"||e.key===" ")&&',
    section=source.slice(start,end);
  if(section.includes(after)&&!section.includes(before))return source;
  if(section.split(before).length!==2)throw new Error('Expected exactly one connection key handler');
  return source.slice(0,start)+section.replace(before,after)+source.slice(end);
}

if(require.main===module) {
  const file=path.join(__dirname,'../uploads/files/lorefy-app.js'),source=fs.readFileSync(file,'utf8'),updated=patch(source);
  if(source!==updated)fs.writeFileSync(file,updated);
  console.log('Connection keyboard boundary verified.');
}
module.exports=patch;

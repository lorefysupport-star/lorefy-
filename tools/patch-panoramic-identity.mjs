import fs from 'node:fs';
const file=new URL('../uploads/files/lorefy-app.js',import.meta.url);
let source=fs.readFileSync(file,'utf8');
if(!source.includes('className:"lf-profile-networks"')){
  const start=source.indexOf('className:"lf-profile-connections"'),end=source.indexOf('className:"lf-profile-metrics"',start);
  if(start<0||end<0)throw Error('Profile connections boundary missing');
  let section=source.slice(start,end);
  const before='}},o.map(n=>{',after='}},React.createElement("div",{className:"lf-profile-networks","aria-label":W==="en"?"Social accounts":"\\u062d\\u0633\\u0627\\u0628\\u0627\\u062a \\u0627\\u0644\\u062a\\u0648\\u0627\\u0635\\u0644"},o.map(n=>{';
  const tail='SocialGlyph,{k:n.key,size:15}))}),React.createElement("button"';
  if(section.split(before).length!==2||section.split(tail).length!==2)throw Error('Networks boundary is not unique');
  section=section.replace(before,after).replace(tail,'SocialGlyph,{k:n.key,size:15}))})),React.createElement("button"');
  source=source.slice(0,start)+section+source.slice(end);
  fs.writeFileSync(file,source);
}
console.log('Grouped profile networks without changing their links or handlers.');

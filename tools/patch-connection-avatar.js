const fs = require('node:fs');
const path = require('node:path');

// Scope the mechanical replacement to the legacy connection-row renderer.
function patch(source) {
  const start = source.indexOf('mr=()=>{if(!Fo)');
  const end = source.indexOf(',vr=', start);
  if (start < 0 || end < 0) throw new Error('Connection renderer not found');
  const before = 'React.createElement("img",{loading:"lazy",decoding:"async",src:o.av,alt:"",style:{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0}})';
  const after = 'React.createElement(window.LorefyUserExperience.ReaderAvatar,{src:o.av,name:o.name,username:o.un})';
  const section = source.slice(start, end);
  if (section.includes(after) && !section.includes(before)) return source;
  if (section.split(before).length !== 2) throw new Error('Expected exactly one connection avatar');
  return source.slice(0, start) + section.replace(before, after) + source.slice(end);
}

if (require.main === module) {
  const target = path.join(__dirname, '../uploads/files/lorefy-app.js');
  const source = fs.readFileSync(target, 'utf8'), updated = patch(source);
  if (source !== updated) fs.writeFileSync(target, updated);
  console.log('Connection avatar renderer verified.');
}
module.exports = patch;

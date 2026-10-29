import fs from 'node:fs';
const file='uploads/files/lorefy-app.js';
let source=fs.readFileSync(file,'utf8');
function once(before,after) {
  if(source.includes(after))return;
  if(source.split(before).length!==2)throw new Error('Unexpected source contract: '+before.slice(0,90));
  source=source.replace(before,after);
}
once('"data-profile-layout":window.LorefyProfileLayout.normalize(profileLayout)',
  '"data-profile-layout":window.LorefyProfileLayout.normalize(yn?profileLayoutDraft:profileLayout)');
once('customizeBannerPointer.current={x:e.clientX,y:e.clientY};Yo(Ct,Co,130)(e);',
  'customizeBannerPointer.current={x:e.clientX,y:e.clientY};const bannerPreviewHeight=e.currentTarget.parentElement.clientHeight||130;Yo(Ct,Co,bannerPreviewHeight)(e);');
const start=source.indexOf('cr=()=>');
if(start<0)throw new Error('Owner renderer missing');
// Exact anchored replacements keep this mechanical patch inside the owner header.
once('src:mt,alt:"",style:{width:"100%",height:"100%",objectFit:"cover",objectPosition:`50% ${So}%`',
  'src:yn?wt:mt,alt:"",style:{width:"100%",height:"100%",objectFit:"cover",objectPosition:`50% ${yn?Ct:So}%`');
once('}},J)),React.createElement("p",{className:"lf-profile-handle"',
  '}},yn?mo:J)),React.createElement("p",{className:"lf-profile-handle"');
once('}},"@",Y),_e&&React.createElement("p",{className:"lf-profile-bio"',
  '}},"@",yn?xo:Y),_e&&React.createElement("p",{className:"lf-profile-bio"');
once('LorefyPhotoFramer.open({src:result,slot,language:W,isCurrent,',
  'LorefyPhotoFramer.open({src:result,slot,language:W,isCurrent,ratio:slot==="banner"&&window.LorefyProfileHeader?window.LorefyProfileHeader.cropRatio(document):undefined,');
fs.writeFileSync(file,source);

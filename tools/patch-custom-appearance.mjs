import fs from 'node:fs';
const file=new URL('../uploads/files/lorefy-app.js',import.meta.url);
let source=fs.readFileSync(file,'utf8');
const replacements=[
  ['a=appearance==="dark",c=value=>','a=window.LorefyDesignSystem.isDark(appearance),c=value=>'],
  ['className:`lf-app is-${appearance}`,key:W,style:{width:',
    'className:`lf-app is-${window.LorefyDesignSystem.baseMode(appearance)}${window.LorefyDesignSystem.isCustom(appearance)?" is-custom":""}`,key:W,style:{...window.LorefyDesignSystem.tokens(appearance),width:'],
  ['c=value=>setAppearance(typeof value==="function"?(value(a)?"dark":"light"):(value?"dark":"light"))',
    'c=value=>setAppearance(window.LorefyDesignSystem.withBase(appearance,(typeof value==="function"?value(a):value)?"dark":"light"))'],
  ['useEffect(()=>{i&&i(a,appearance)},[appearance])',
    'useEffect(()=>{i&&i(a,appearance)},[appearance]);useEffect(()=>{const sync=e=>{if(e.key==="lorefy.ui.theme.v1")setAppearance(window.LorefyDesignSystem.readMode(localStorage))};window.addEventListener("storage",sync);return()=>window.removeEventListener("storage",sync)},[])']
];
for(const [before,after] of replacements){
  if(source.includes(after))continue;
  if(source.split(before).length!==2)throw Error('Unexpected appearance patch anchor: '+before);
  source=source.replace(before,after);
}
fs.writeFileSync(file,source);
console.log('Patched custom appearance mode and shared tokens.');

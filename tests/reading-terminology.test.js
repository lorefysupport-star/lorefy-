const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const i18n = require('../modules/lorefy-i18n');
const source = fs.readFileSync('uploads/files/lorefy-app.js','utf8');
const stored = ['أقرأ حالياً','تم القراءة','قائمة الأمنيات','توقف','توقف نهائي'];
const labels = {ar:['أقرأ الآن','قرأته','أرغب بالقراءة','متوقف مؤقتًا','توقفت نهائيًا'],en:['Reading','Completed','Want to read','Paused','Dropped']};
for (const lang of ['ar','en']) for (let index=0;index<stored.length;index++) test(`${lang} display for stored reading state ${index} is canonical`,()=>{
  assert.equal(i18n.readingStatusLabel(stored[index],lang),labels[lang][index]);
});
test('display formatting is not publication formatting or a storage migration',()=>{
  assert.equal(i18n.translate('مكتملة','en'),'Completed');
  for(const raw of ['مستمرة','مكتملة','Custom reading state']) assert.equal(i18n.readingStatusLabel(raw,'ar'),raw);
  assert.equal(i18n.readingStatusLabel(null,'ar'),'');
  for(const [constant,value] of [['READING',stored[0]],['DONE',stored[1]],['WISHLIST',stored[2]],['PAUSED',stored[3]],['DROPPED',stored[4]]]) assert.equal(JSON.parse(source.match(new RegExp('STATUS_'+constant+'=("(?:[^"\\\\]|\\\\.)*")'))[1]),value);
});
test('app badges, work action, library and profile filters call the same display function',()=>{
  const start=source.indexOf('function lorefyReadingStatusLabel('),end=source.indexOf('\nconst{useState',start),scope={window:{LorefyI18n:i18n}};
  vm.runInNewContext(source.slice(start,end),scope);
  for(const lang of ['ar','en']) stored.forEach((status,index)=>assert.equal(scope.lorefyReadingStatusLabel(status,lang),labels[lang][index]));
  for(const value of ['lorefyReadingStatusLabel(e,lang)','lorefyReadingStatusLabel(s,W)','lorefyReadingStatusLabel(o,W)','lorefyReadingStatusLabel(n.k,W)']) assert.ok(source.includes(value),value);
});
test('empty reading collections use the same meaning without changing publication text',()=>{
  for(const lang of ['ar','en']) {
    const messages=stored.map(status=>i18n.readingStatusEmpty(status,lang));
    assert.equal(new Set(messages).size,5);assert.ok(messages.every(Boolean));
    if(lang==='en')assert.ok(messages.every(value=>!/[\u0600-\u06ff]/.test(value)));
  }
  assert.ok(source.includes('window.LorefyI18n.readingStatusEmpty(Rt,W)'));
});
function panel(language,choices=stored){
  global.LorefyI18n=i18n;
  global.React={createElement:(tag,props,...children)=>({tag,props:props||{},children:children.flat(Infinity).filter(n=>n!=null&&n!==false)}),useRef:v=>({current:v}),useEffect(){}};
  const events=[],api=require('../modules/lorefy-work-panels');
  function nodes(n){return n&&typeof n==='object'?[n,...(n.children||[]).flatMap(nodes)]:[];}
  function text(n){return typeof n==='string'?n:(n.children||[]).map(text).join('');}
  const tree=api.Status({language,choices,status:choices[0],work:{title:'Work'},progress:{},onSelect:value=>events.push(value)});
  return {radios:nodes(tree).filter(n=>n.props.role==='radio'),text,events};
}
for(const lang of ['ar','en']) test(`work status labels follow values rather than option positions in ${lang}`,()=>{
  const choices=[stored[2],stored[0],stored[4],stored[1],stored[3]],p=panel(lang,choices);
  p.radios.forEach((radio,index)=>assert.ok(p.text(radio).includes(labels[lang][stored.indexOf(choices[index])])));
  p.radios[2].props.onClick();assert.deepEqual(p.events,[stored[4]]);
});
for(const lang of ['ar','en']) test(`import status chips reuse labels and retain draft selection in ${lang}`,()=>{
  const h=require('./helpers/import-dialog').harness(lang),chips=h.all('lf-im-chip');
  assert.deepEqual(chips.map(n=>n.textContent),[labels[lang][1],labels[lang][0],labels[lang][2],labels[lang][3],labels[lang][4]]);
  chips[3].click();assert.equal(chips[3].attrs['aria-pressed'],'true');assert.equal(h.writes.length,0);
});
test('visitor library status also uses the shared reading formatter',()=>{
  const src=fs.readFileSync('modules/lorefy-public-profile.js','utf8');
  assert.match(src,/root\.LorefyI18n\.readingStatusLabel\(status,/);
});
test('reading vocabulary consumers use current runtime cache keys',()=>{
  for(const entry of ['index.html','sw.js'])for(const asset of ['uploads/files/lorefy-app.js','modules/lorefy-i18n.js','modules/lorefy-work-panels.js','modules/lorefy-growth-features.js','modules/lorefy-public-profile.js'])assert.ok(fs.readFileSync(entry,'utf8').includes(asset+'?v='+(asset==='modules/lorefy-work-panels.js'?'20261029-cover-editions-v1':asset==='modules/lorefy-growth-features.js'?'20261101-character-studio-v1':asset==='uploads/files/lorefy-app.js'?'20261101-reading-favorite-type-v1':asset==='modules/lorefy-public-profile.js'?'20261101-profile-count-v1':'20261028-reading-terms-v1')),asset);
  assert.match(fs.readFileSync('sw.js','utf8'),/lorefy-v667-character-studio/);
});
test('profile reading results are named keyboard buttons rather than unnamed clickable containers',()=>{
  assert.ok(source.includes('React.createElement("button",{key:d.id,type:"button","data-reading-work-id":d.id,"aria-label":uiText(W,"فتح "+d.title,"Open "+d.title),onClick:()=>T(d)'));
});
for(const lang of ['ar','en'])test(`empty library filters share the profile meaning in ${lang}`,()=>{
  global.LorefyI18n=i18n;global.NenIcons={};global.React={createElement:(tag,props,...children)=>({tag,props,children})};
  const library=require('../modules/lorefy-library-cinema');
  for(const status of stored){const tree=library.Empty({language:lang,filtered:true,status});assert.equal(tree.children.find(n=>n?.tag==='strong').children[0],i18n.readingStatusEmpty(status,lang));}
  assert.ok(source.includes('filtered:q!=="all",status:q,'));
});

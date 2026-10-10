const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const labels=[['إصدارات جديدة','New releases'],['الأعلى تقييماً','Top rated'],['كتب مختارة','Book picks'],
  ['تابع القراءة','Continue reading'],['الكل','All'],['اختيار المحرّر',"Editor's pick"],['الأكثر رواجاً','Popular now'],['مختارة لك','Picked for you']];
function encoded(value) {return JSON.stringify(value).replace(/[^\x00-\x7f]/g,char=>'\\u'+char.charCodeAt(0).toString(16).padStart(4,'0').toUpperCase());}
test('discovery headings are bilingual on render rather than relying on a delayed DOM rewrite',()=>{
  const source=fs.readFileSync(require.resolve('../uploads/files/lorefy-app'),'utf8');
  const discovery=source.slice(source.indexOf('ir=()=>{'),source.indexOf('},sr=()=>'));
  for(const [ar,en] of labels) assert.ok(discovery.includes(`uiText(W,${encoded(ar)},${JSON.stringify(en)})`),ar);
});
test('featured discovery cards distinguish an absent rating from a zero score',()=>{
  const source=fs.readFileSync(require.resolve('../uploads/files/lorefy-app'),'utf8');
  const discovery=source.slice(source.indexOf('ir=()=>{'),source.indexOf('},sr=()=>'));
  assert.ok(discovery.includes('Number(_(P))>0?_(P):"\\u2014"'));
});

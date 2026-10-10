const fs = require('node:fs');
const path = require('node:path');

// Keep the legacy bundle minified; change only the audited render expression.
const file = path.join(__dirname, '../uploads/files/lorefy-app.js');
let text = fs.readFileSync(file, 'utf8');
const before = 'React.createElement("span",null,libraryQuery.trim()?"جرّب اسم العمل أو المؤلف.":n)';
const after = 'React.createElement("span",null,n)';
if (text.includes(before)) {
  if (text.split(before).length !== 2) throw new Error('Library label patch is not unique');
  text = text.replace(before, after);
  fs.writeFileSync(file, text);
} else if (!text.includes(after)) throw new Error('Library filter render was not found');

function replaceUnique(before, after) {
  if (text.includes(before)) {
    if (text.split(before).length !== 2) throw new Error('Ambiguous bundle patch: ' + before.slice(0,60));
    text = text.replace(before,after);
  } else if (!text.includes(after)) throw new Error('Bundle patch target missing: ' + before.slice(0,60));
}
replaceUnique('(m.related||[]).map(g=>workById(g)).filter(recommendationEligible)',
  'window.LorefyCatalogIdentity.relatedWorks(m,(m.related||[]).map(g=>workById(g)).filter(recommendationEligible),window.LorefyCatalogAliases)');
replaceUnique('"data-lorefy-action":"write-review",onClick:()=>Se(!0)',
  '"data-lorefy-action":"write-review",onClick:()=>{const draft=window.LorefySavedReviewDraft(M.find(r=>String(r.mid)===String(m.id)&&r.userId==="me"));dt(draft.rating);no(draft.ratings);ct.current=draft.text;pt.current=draft.moment;ht(draft.images);ro(draft.recommendation);io(draft.spoiler);Se(!0)}');
fs.writeFileSync(file,text);
replaceUnique('const t=document.getElementById("nc-root")||document.getElementById("root")||document.body;let r=null;const o=new MutationObserver',
  'const t=document.getElementById("screen")||document.getElementById("nc-root")||document.getElementById("root")||document.body;let r=null;const o=new MutationObserver');
fs.writeFileSync(file,text);

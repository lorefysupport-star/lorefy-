import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Apply bounded transformations to the generated, single-line React bundle.
const target = fileURLToPath(new URL('../uploads/files/lorefy-app.js', import.meta.url));
let source = await readFile(target, 'utf8');
const oldDisplay = 'window.LorefyArtwork.display(r):r;const o=Eo[t.id]';
if (source.includes(oldDisplay)) {
  source = source.replace(oldDisplay, 'window.LorefyArtwork.display(r,"covers"):r;const o=Eo[t.id]');
  await writeFile(target, source);
}
if (source.includes('const Kn=async(t,r)=>')) process.exit(0);
const replacements = [
  ['Pt(z=>({...z,[r.id]:y})),Ze(!1),xe(null),A("\\u062A\\u0645 \\u0631\\u0641\\u0639 \\u0627\\u0644\\u063A\\u0644\\u0627\\u0641")', 'Kn(r.id,y).then(saved=>{if(saved){Ze(!1);xe(null)}})'],
  ['if(r)return r;const o=Eo[t.id]', 'if(r)return window.LorefyArtwork?window.LorefyArtwork.display(r,"covers"):r;const o=Eo[t.id]'],
  ['const Kn=(t,r)=>{Pt(o=>({...o,[t]:r})),A("\\u062A\\u0645 \\u062A\\u063A\\u064A\\u064A\\u0631 \\u0627\\u0644\\u063A\\u0644\\u0627\\u0641")}', 'const Kn=async(t,r)=>{if(window.__lorefyArtworkSaving)return false;window.__lorefyArtworkSaving=true;A("جار حفظ الغلاف…");try{const o=await window.LorefyArtwork.saveCover(t,r);Pt(o);A(r?"تم حفظ الغلاف ومزامنته":"رجع للغلاف الافتراضي");return true}catch(e){A(e.message,"err");return false}finally{window.__lorefyArtworkSaving=false}}'],
  ['onClick:()=>{Pt(s=>{const d={...s};return delete d[t.id],d}),A("\\u0631\\u062C\\u0639 \\u0644\\u0644\\u063A\\u0644\\u0627\\u0641 \\u0627\\u0644\\u0627\\u0641\\u062A\\u0631\\u0627\\u0636\\u064A")}', 'onClick:()=>Kn(t.id,"")']
];
for (const [before, after] of replacements) {
  if (source.split(before).length !== 2) throw new Error('Generated picker target missing or ambiguous: ' + before);
  source = source.replace(before, after);
}
await writeFile(target, source);

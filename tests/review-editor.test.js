const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function editor() {
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'modules/lorefy-review-editor.js'), 'utf8'), sandbox);
  return sandbox.module.exports;
}

test('a quick review requires only a valid overall rating', () => {
  const api = editor();
  assert.equal(api.canPublish(0), false);
  assert.equal(api.canPublish(0.5), true);
  assert.equal(api.canPublish(5), true);
  for (const value of [NaN, Infinity, -1, 6, '4']) assert.equal(api.canPublish(value), false);
});

test('rating interaction retains half steps and detailed scores stay optional', () => {
  const api = editor();
  assert.equal(api.ratingValue(3, 0.5), 3.5);
  assert.equal(api.ratingValue(4, 1), 5);
  assert.equal(api.ratingValue(0, 1), 1);
  assert.equal(api.ratingValue(4, 2), 5);
});

test('the editor has explicit Arabic and English copy without DOM text translation', () => {
  const api = editor();
  assert.equal(api.copy('en').publish, 'Publish review');
  assert.equal(api.copy('ar').publish, 'نشر المراجعة');
  assert.equal(api.copy('en').details, 'Detailed ratings');
  assert.equal(api.formatLabel('مانجا','en'), 'Manga');
  assert.equal(api.formatLabel('لايت نوفل','en'), 'Light novel');
});

test('the app directly mounts the focused editor and does not erase a manual rating on partial details', () => {
  const source = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  assert.match(source, /React\.createElement\(window\.LorefyReviewComposer/);
  assert.doesNotMatch(source, /t\.every\(r=>r>0\)\?dt\([^;]+:dt\(0\)/);
  assert.match(source, /onPublish:guard\(tr\)/);
});

test('the new editor is included in the runtime, with fixed footer and theme tokens', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles/lorefy-review-editor.css'), 'utf8');
  assert.ok(index.indexOf('modules/lorefy-review-editor.js') < index.indexOf('uploads/files/lorefy-app.js'));
  assert.match(sw, /modules\/lorefy-review-editor\.js/);
  assert.match(css, /\.lf-rating-footer/);
  assert.match(css, /var\(--ui-surface/);
  assert.match(css, /prefers-reduced-motion/);
});

function rendered(props) {
  const states = [];
  const sandbox = { React:{
    createElement:(type, attributes, ...children)=>({type, attributes:attributes || {}, children:children.flat(Infinity)}),
    useState:value=>[value,next=>states.push(next)], useRef:value=>({current:value}), useEffect:()=>{}
  }};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'modules/lorefy-review-editor.js'), 'utf8'), sandbox);
  const defaults = {language:'en', work:{id:'test',title:'A Story'}, rating:4, ratings:{}, fields:[],
    textRef:{current:''}, momentRef:{current:''}, images:[], icons:{}, onPublish:async()=>true};
  return {tree:sandbox.LorefyReviewComposer({...defaults,...props}), states};
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const child of node.children || []) { const match=find(child,predicate); if(match) return match; }
  return null;
}

test('a first-completion publish button names the reading action in both languages',()=>{
  for(const [language,label] of [['ar','نشر وإضافة للمكتملة'],['en','Publish and mark completed']]) {
    const model=rendered({language,completeOnPublish:true});
    const footer=find(model.tree,n=>n.attributes.className==='lf-rating-footer');
    assert.equal(find(footer,n=>n.type==='button').children[0],label);
  }
  const existing=rendered({language:'en',completeOnPublish:false});
  assert.equal(find(find(existing.tree,n=>n.attributes.className==='lf-rating-footer'),n=>n.type==='button').children[0],'Publish review');
});

test('publishing is guarded against duplicate taps and retains the draft on failure', async () => {
  let calls=0, finish;
  const model=rendered({onPublish:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}});
  const footer=find(model.tree,n=>n.attributes.className==='lf-rating-footer');
  const button=find(footer,n=>n.type==='button');
  const request=button.attributes.onClick();
  await button.attributes.onClick();
  assert.equal(calls,1);
  finish(false);
  await request;
  assert.ok(model.states.some(value=>typeof value==='string' && value.includes('Your review is still here')));
  assert.equal(model.states.at(-1),false);
});

test('writing updates the existing draft refs and preserves English text', () => {
  const ref={current:''};
  const model=rendered({textRef:ref});
  const textarea=find(model.tree,n=>n.attributes.id==='lf-rating-text');
  textarea.attributes.onChange({target:{value:'An honest review in English.'}});
  assert.equal(ref.current,'An honest review in English.');
  assert.equal(textarea.attributes.dir,'auto');
});

test('a stale composer cannot overwrite shared text refs or submit a new editor', async () => {
  let current=true, calls=0;
  const textRef={current:'New draft'},momentRef={current:'New moment'};
  const model=rendered({textRef,momentRef,isCurrent:()=>current,onPublish:async()=>{calls++;}});
  current=false;
  find(model.tree,n=>n.attributes.id==='lf-rating-text').attributes.onChange({target:{value:'Old text'}});
  find(model.tree,n=>n.attributes.id==='lf-rating-moment').attributes.onChange({target:{value:'Old moment'}});
  const footer=find(model.tree,n=>n.attributes.className==='lf-rating-footer');
  await find(footer,n=>n.type==='button').attributes.onClick();
  assert.equal(textRef.current,'New draft');assert.equal(momentRef.current,'New moment');
  assert.equal(calls,0);assert.deepEqual(model.states,[]);
});

test('an obsolete composer does not set local state after its request settles',async()=>{
  let current=true,finish;
  const model=rendered({isCurrent:()=>current,onPublish:()=>new Promise(resolve=>{finish=resolve;})});
  const footer=find(model.tree,n=>n.attributes.className==='lf-rating-footer');
  const request=find(footer,n=>n.type==='button').attributes.onClick();
  current=false;model.states.length=0;finish(false);await request;
  assert.deepEqual(model.states,[]);
});

test('rating uses a labelled native slider with visible quarter-step values', () => {
  let score;
  const model=rendered({onRating:value=>{score=value;}});
  const slider=find(model.tree,n=>n.type==='input' && n.attributes.type==='range');
  assert.ok(slider, 'a familiar slider replaces hidden half-feather tap zones');
  assert.equal(slider.attributes.min,0);
  assert.equal(slider.attributes.max,5);
  assert.equal(slider.attributes.step,0.25);
  assert.equal(slider.attributes['aria-label'],'Your rating');
  slider.attributes.onChange({target:{value:'3.5'}});
  assert.equal(score,3.5);
});

test('work identity is a compact poster-and-title layout with one metadata line', () => {
  const sandbox={React:{useState:value=>[value,()=>{}],useRef:()=>({current:null}),useEffect:()=>{},createElement:(type,attributes,...children)=>({type,attributes:attributes||{},children:children.flat(Infinity)})}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'modules/lorefy-review-editor.js'),'utf8'),sandbox);
  assert.equal(typeof sandbox.LorefyWorkIdentity,'function');
  const tree=sandbox.LorefyWorkIdentity({work:{title:'A Story',type:'مانجا',yr:1998,st:'Completed'},language:'en',cover:'cover.jpg',creator:'Author',rating:4.5});
  assert.equal(find(tree,n=>n.type==='h1').children[0],'A Story');
  assert.equal(find(tree,n=>n.type==='img').attributes.src,'cover.jpg');
  assert.equal(find(tree,n=>n.attributes.className==='lf-work-rating-value').children[0],'4.5');
});

test('Story and Related tabs switch existing sections without duplicating data',()=>{
  const source=fs.readFileSync(path.join(root,'modules/lorefy-review-editor.js'),'utf8');
  assert.match(source,/lf-work-section-nav/);
  assert.match(source,/dataset\.workTab=activeTab/);
  assert.match(source,/role:'tab'/);
  const css=fs.readFileSync(path.join(root,'styles/lorefy-work-layout.css'),'utf8');
  assert.match(css,/data-work-tab='story'/);
  assert.match(css,/data-work-tab='related'/);
});

test('optional character slots localize generated labels without changing character names', () => {
  const source=fs.readFileSync(path.join(root,'modules/lorefy-growth-features.js'),'utf8');
  const start=source.indexOf('    function top4el(');
  const context={language:'en',labels:{},el:(tag,props)=>props};
  vm.createContext(context);
  vm.runInContext(source.slice(start,source.indexOf('    var sec =',start)),context);
  assert.equal(context.top4el('span',{text:'شخصية 1'}).text,'Character 1');
  assert.equal(context.top4el('span',{text:'Killua Zoldyck'}).text,'Killua Zoldyck');
});

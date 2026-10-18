const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
function identity(lang='en'){
  const updates=[];
  const root={React:{createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useState:x=>[x,v=>updates.push(v)],useRef:()=>({current:null}),useEffect:()=>{}},NenIcons:{Feather:'feather'}};
  vm.runInNewContext(read('modules/lorefy-review-editor.js'),root);
  return {tree:root.LorefyWorkIdentity({work:{id:'one',title:'A long work title',type:'مانجا'},rating:4.4,language:lang}),updates};
}
function find(n,fn){if(!n||typeof n!=='object')return null;if(fn(n))return n;for(const c of n.children||[]){const r=find(c,fn);if(r)return r;}return null;}
test('work identity separates the score from title and labels its meaning',()=>{
  const {tree}=identity();
  const line=find(tree,n=>n.props.className==='lf-work-title-line');
  assert.equal(find(line,n=>n.props.className==='lf-work-rating'),null);
  const score=find(tree,n=>n.props.className==='lf-work-rating');
  assert.match(score.props['aria-label'],/Work rating/);
});
test('work content exposes reviews directly and keyboard navigation follows direction',()=>{
  for(const language of ['ar','en']){
    const {tree,updates}=identity(language);
    const nav=find(tree,n=>n.props.role==='tablist');
    assert.equal(nav.children.length,3);
    assert.equal(nav.children.filter(n=>n.props.tabIndex===0).length,1);
    let focused=-1;
    const buttons=nav.children.map((n,i)=>({dataset:{workTab:n.props['data-work-tab']},focus:()=>{focused=i;}}));
    const e={key:language==='en'?'ArrowRight':'ArrowLeft',target:buttons[0],currentTarget:{querySelectorAll:()=>buttons},preventDefault:()=>{}};
    nav.props.onKeyDown(e);assert.equal(focused,1);assert.equal(updates.at(-1),'reviews');
  }
});
test('quick actions reveal characters and cover while resolving current targets at activation',()=>{
  const source=read('modules/lorefy-chapter-detail.js');
  assert.match(source,/function addSecondaryActions\(/);
  const part=source.slice(source.indexOf('function addSecondaryActions('),source.indexOf('var toolbar = actions.parentNode',source.indexOf('function addSecondaryActions(')));
  assert.match(part,/lf-chapter-quick-characters/);assert.match(part,/lf-chapter-quick-cover/);
  assert.match(part,/currentActions\.querySelector/);
  assert.doesNotMatch(part,/setItem|persist|setTimeout/);
});
test('reading choices are outermost single radios, updated independently of one-time dialog setup',()=>{
  const source=read('modules/lorefy-growth-features.js');
  const start=source.indexOf('function enhanceReadingChoices(');
  assert.ok(start>=0);
  const context={uiText:(ar,en)=>en};vm.runInNewContext(source.slice(start,source.indexOf('function enhanceInteractionAccessibility(',start)),context);
  const group={classList:{add:()=>{}},setAttribute:()=>{}};
  function option(name,selected=false){const attrs={},events={};return {textContent:name,children:[{}],dataset:{},parentElement:group,attrs,events,contains:()=>false,querySelector:s=>s==='svg'&&selected?{}:null,setAttribute:(k,v)=>{attrs[k]=v;},getAttribute:k=>attrs[k],addEventListener:(k,v)=>{events[k]=v;},focus:()=>{},click:()=>{}};}
  const a=option('Reading'),b=option('Completed',true),inner=option('Completed',true);b.contains=x=>x===inner;
  const sheet={classList:{add:()=>{}},querySelectorAll:()=>[a,b,inner,option('Wishlist'),option('Paused'),option('Dropped')]};
  context.enhanceReadingChoices(sheet);
  assert.equal(a.attrs.role,'radio');assert.equal(b.attrs['aria-checked'],'true');assert.equal(a.tabIndex,-1);assert.equal(b.tabIndex,0);assert.equal(inner.attrs.role,undefined);
  const handler=b.events.keydown;context.enhanceReadingChoices(sheet);assert.equal(b.events.keydown,handler);
  const unrelated=option('Reading');context.enhanceReadingChoices({...sheet,querySelectorAll:()=>[unrelated]});assert.equal(unrelated.attrs.role,undefined);
  const enhance=source.slice(source.indexOf('function enhanceInteractionAccessibility('));
  assert.match(enhance,/\.nc-sheet'\)[^;]*enhanceReadingChoices/);
});
test('work overflow menu reports expansion and supports vertical keyboard navigation',()=>{
  const source=read('modules/lorefy-chapter-detail.js');
  assert.match(source,/more\.setAttribute\('aria-haspopup', 'menu'\)/);
  assert.match(source,/more\.setAttribute\('aria-expanded', 'true'\)/);
  assert.match(source,/event\.key === 'ArrowDown'/);
});
test('work presentation covers sheets, artwork selection and reduced motion without hard-coded themes',()=>{
  const css=read('styles/lorefy-work-experience.css');
  for(const selector of ['lf-work-identity','lf-work-status-sheet','lf-cover-choice','lf-character-rating-row','lf-rating-sheet'])assert.ok(css.includes(selector));
  assert.match(css,/prefers-reduced-motion/);assert.match(css,/prefers-reduced-transparency/);assert.match(css,/var\(--ui-/);
  assert.match(css,/\.lf-detail-content\[data-work-tab\]\{[^}]*margin-inline:auto!important/);
  assert.match(read('index.html'),/styles\/lorefy-work-experience\.css/);
});
test('each character slider names its character and the filter bar supports keyboard selection',()=>{
  const source=read('modules/lorefy-growth-features.js');
  assert.match(source,/function scoreControl\(workId, charKey, getStatus, displayName\)/);
  assert.match(source,/label \+ \(displayName/);
  assert.match(source,/filterRow\.addEventListener\("keydown"/);
  assert.match(source,/"aria-label": uiText\("تصفية الشخصيات", "Filter characters"\)/);
});
test('work review reaction names do not collapse to just their count',()=>{
  const source=read('modules/lorefy-growth-features.js');
  const start=source.indexOf('function workReviewActionLabel(');assert.ok(start>=0);
  const context={uiText:(ar,en)=>en};vm.runInNewContext(source.slice(start,source.indexOf('function enhanceInteractionAccessibility(',start)),context);
  const fake=path=>({querySelector:selector=>selector.includes(path)?{}:null});
  assert.equal(context.workReviewActionLabel(fake('M7.9 20')),'Replies');
  assert.equal(context.workReviewActionLabel(fake('M19 14')),'Like');
  assert.equal(context.workReviewActionLabel(fake('M7 10')),'Recommend');
  assert.equal(context.workReviewActionLabel(fake('M3 6h18')),'Delete');
  assert.equal(context.workReviewActionLabel(fake('unknown')),'');
});
test('cover picker localizes system labels without changing the work title and adapts nested grids',()=>{
  const i18n=require('../modules/lorefy-i18n.js');
  assert.equal(i18n.translate('اختر الغلاف الأساسي','en'),'Choose default cover');
  assert.equal(i18n.translate('اختر غلاف 4','en'),'Choose cover 4');
  assert.equal(i18n.translate('غلاف 4','en'),'Cover 4');
  assert.equal(i18n.translate('Hunter x Hunter · اختر غلاف المجلد','en'),'Hunter x Hunter · Choose volume cover');
  assert.equal(i18n.translate('Hunter x Hunter','en'),'Hunter x Hunter');
  assert.equal(i18n.translate('غلاف 4','ar'),'غلاف 4');
  assert.match(read('styles/lorefy-work-experience.css'),/\.lf-work-cover-sheet div:has\(>\.lf-cover-choice\)/);
});

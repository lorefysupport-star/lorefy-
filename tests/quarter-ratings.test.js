const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const editor = require('../modules/lorefy-review-editor.js');
const chapter = require('../modules/lorefy-chapter-detail-core.js');
const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('work ratings accept quarters down to 0.25 and preserve existing saved decimals', () => {
  for (let value=0.25; value<=5; value+=0.25) assert.equal(editor.canPublish(value),true,String(value));
  assert.equal(editor.ratingValue(4,0.25),4.25);
  assert.equal(editor.ratingValue(4,0.75),4.75);
  assert.equal(editor.savedDraft({r:4.25}).rating,4.25);
  assert.equal(editor.savedDraft({r:4.3}).rating,4.3);
});
test('work and detailed rating sliders retain quarter precision in values and accessible text', () => {
  const nodes=[];
  const window={React:{createElement:(type,props,...children)=>{const n={type,props:props||{},children:children.flat(Infinity)};nodes.push(n);return n;},
    useState:v=>[v,()=>{}],useRef:v=>({current:v}),useEffect(){} }};
  vm.runInNewContext(read('modules/lorefy-review-editor.js'),{window});
  let picked, metric;
  window.LorefyReviewComposer({language:'en',work:{id:'work',title:'Work'},rating:4.25,ratings:{story:4.75},fields:[{k:'story',l:'Story'}],
    textRef:{current:''},momentRef:{current:''},images:[],icons:{},onRating:v=>picked=v,onMetric:(key,v)=>metric=[key,v]});
  const sliders=nodes.filter(n=>n.props.type==='range');
  assert.equal(sliders.length,2);
  assert.ok(sliders.every(n=>n.props.step===0.25));
  assert.equal(sliders[0].props['aria-valuetext'],'4.25 out of 5');
  sliders[0].props.onChange({target:{value:'4.75'}});assert.equal(picked,4.75);
  sliders[1].props.onChange({target:{value:'4.25'}});assert.deepEqual(metric,['story',4.25]);
  assert.ok(nodes.some(n=>n.props.className==='lf-rating-number'&&n.children.includes('4.25')));
  assert.ok(nodes.some(n=>n.type==='output'&&n.children.includes('4.75')));
});
test('chapter storage accepts every quarter including zero for comment-only input, rejects other fractions', () => {
  for(let value=0;value<=5;value+=0.25){const data=chapter.save({},'work',2,value,'note',false,1,10);assert.equal(data?.work['2'].rating,value);}
  for(const value of [4.2,5.25,-0.25,NaN,Infinity]) assert.equal(chapter.save({},'work',2,value,'note',false,1,10),null);
});
test('backend sends the exact chapter quarter to the dedicated RPC', async () => {
  const window={};vm.runInNewContext(read('backend/lorefy-backend.js'),{window,console,URL,URLSearchParams,setTimeout,clearTimeout});
  const backend=window.LorefyBackend,calls=[];backend.mode='live';backend.getSession=async()=>({userId:'00000000-0000-4000-8000-000000000001'});
  backend.user={id:'00000000-0000-4000-8000-000000000001'};
  backend.client={rpc:async(name,args)=>{calls.push({name,args});return {data:{rating:args.score}};}};
  assert.equal((await backend.publishChapterReview('work',2,4.25,'',false)).rating,4.25);
  assert.equal(calls[0].name,'publish_chapter_review');
  assert.equal(calls[0].args.score,4.25);
  await assert.rejects(backend.publishChapterReview('work',2,4.2,'note',false),/Invalid rating/);
  await assert.rejects(backend.publishChapterReview('work',2,NaN,'note',false),/Invalid rating/);
});
test('rating sharing does not truncate quarters to tenths', () => {
  const source=read('modules/lorefy-share-studio.js'),start=source.indexOf('  function findWorkRating('),end=source.indexOf('  function collectImages(',start);
  const scope={doc:{querySelectorAll:()=>[]}};vm.runInNewContext(source.slice(start,end),scope);
  assert.equal(scope.findWorkRating({textContent:'تقييمي 4.25'}),'4.25');
  assert.equal(scope.findWorkRating({textContent:'0.25 / 5 تقييمي'}),'0.25');
});
test('automatic detailed-score average rounds to quarters, not halves', () => {
  const app=read('uploads/files/lorefy-app.js');
  assert.ok(app.includes('dt(Math.round(t.reduce((r,o)=>r+o,0)/t.length*4)/4)'));
});

test('character slider displays, saves and clears exact quarters with a localized label', () => {
  const source=read('modules/lorefy-growth-features.js');
  const start=source.indexOf('  function scoreControl('),end=source.indexOf('  function characterRow(',start);
  const writes=[],nodes=[],scores={guts:4.25};
  function el(tag,props={},kids=[]){
    const node={tag,attrs:{...props},children:[],style:{setProperty(){}},handlers:{},
      textContent:props.text||'',value:props.value||'',classList:{toggle(){}},
      setAttribute(k,v){this.attrs[k]=v;},appendChild(n){this.children.push(n);},
      addEventListener(k,fn){this.handlers[k]=fn;}};
    (Array.isArray(kids)?kids:[kids]).filter(Boolean).forEach(n=>node.appendChild(n));nodes.push(node);return node;
  }
  const scope={el,getScores:()=>scores,setScore:(w,k,v)=>{writes.push([w,k,v]);scores[k]=v;},
    uiText:(ar,en)=>en,scheduleCharacterActionIcons(){}};
  vm.runInNewContext(source.slice(start,end),scope);
  let status;const row=scope.scoreControl('berserk','guts',v=>status=v);
  const slider=nodes.find(n=>n.attrs.type==='range'),output=nodes.find(n=>n.tag==='output');
  assert.ok(slider,'native rating slider');assert.equal(Number(slider.attrs.step),0.25);
  assert.equal(slider.attrs['aria-label'],'Character rating out of 5');
  assert.equal(output.textContent,'4.25');
  slider.value='4.75';slider.handlers.input();
  assert.deepEqual(writes.at(-1),['berserk','guts',4.75]);assert.equal(status,4.75);
  assert.equal(row.attrs['data-score'],'4.75');assert.equal(output.textContent,'4.75');
  slider.value='0';slider.handlers.input();assert.equal(status,0);assert.equal(row.attrs['data-score'],'0');
});

test('shared range styles also apply to the character portal outside the app root', () => {
  const css=read('styles/lorefy-work-surface.css');
  assert.match(css,/html:root:root:root:root \.lf-rating-scale input\[type="range"\] \{[^}]*width: 100%;[^}]*height: 44px/);
});

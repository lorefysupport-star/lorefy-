const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../modules/lorefy-explore-studio'),'utf8');
function harness({lang='en',reduced=false,count=3}={}) {
  let cursor=0,tree,cleanups=[];const hooks=[],effects=[],timers=new Map();let serial=0;
  const React={Fragment:'fragment',createElement:(tag,attrs,...children)=>({tag,attrs:attrs||{},children:children.flat(Infinity).filter(Boolean)}),
    useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=initial;return[hooks[i],v=>hooks[i]=typeof v==='function'?v(hooks[i]):v];},
    useRef(initial){const i=cursor++;return hooks[i]||=( {current:initial} );},useMemo:fn=>fn(),useEffect:fn=>effects.push(fn),useLayoutEffect(){}};
  const win={React,document:{hidden:false,activeElement:null},matchMedia:()=>({matches:reduced}),addEventListener(){},removeEventListener(){},
    setInterval(fn){const id=++serial;timers.set(id,fn);return id;},clearInterval:id=>timers.delete(id),clearTimeout(){}};
  vm.runInNewContext(source,{window:win});
  const works=Array.from({length:count},(_,i)=>({id:String(i+1),title:'Work '+(i+1),type:'Book',pop:count-i,genres:[]}));
  const props={language:lang,userKey:'test',allType:'All',types:['All','Book'],genres:[],categories:[],preferences:{},library:{},getRanked:()=>works,getWork:id=>works.find(w=>w.id===id),cover:()=>'',fallback:()=>'',typeLabel:x=>x,ratingScore:()=>0};
  function render(){cleanups.forEach(fn=>fn());cleanups=[];effects.length=0;cursor=0;tree=win.LorefyExploreStudio.Explore(props);cleanups=effects.map(fn=>fn()).filter(fn=>typeof fn==='function');return tree;}
  function nodes(node=tree){return node&&typeof node==='object'?[node,...node.children.flatMap(n=>nodes(n))]:[];}
  render();return {render,timers,nodes,win,rotation:()=>nodes().find(n=>n.attrs.className==='lf-explore-feature-rotation'),slide:()=>nodes().find(n=>n.attrs.className==='lf-explore-feature-dot'&&n.attrs['aria-pressed'])?.attrs['aria-label'],tick(){[...timers.values()].forEach(fn=>fn());render();},dispose(){cleanups.forEach(fn=>fn());}};
}
for(const lang of ['ar','en'])test('visible rotation control pauses and resumes without advancing on click in '+lang,()=>{
  const h=harness({lang});try{
    assert.equal(h.timers.size,1);const before=h.slide(),button=h.rotation();assert.ok(button);
    assert.equal(button.tag,'button');assert.equal(button.attrs.type,'button');
    assert.equal(button.attrs['aria-label'],lang==='ar'?'إيقاف العرض التلقائي':'Pause automatic slideshow');
    button.attrs.onClick();h.render();assert.equal(h.timers.size,0);h.tick();assert.equal(h.slide(),before);
    assert.equal(h.rotation().attrs['aria-label'],lang==='ar'?'تشغيل العرض التلقائي':'Start automatic slideshow');
    h.rotation().attrs.onClick();h.render();assert.equal(h.slide(),before);assert.equal(h.timers.size,1);h.tick();assert.notEqual(h.slide(),before);
  }finally{h.dispose();}
});
test('reduced motion has no autoplay or misleading rotation control',()=>{const h=harness({reduced:true});try{assert.equal(h.timers.size,0);assert.equal(h.rotation(),undefined);const before=h.slide();h.tick();assert.equal(h.slide(),before);}finally{h.dispose();}});
test('one featured work has no rotation control or timer',()=>{const h=harness({count:1});try{assert.equal(h.timers.size,0);assert.equal(h.rotation(),undefined);}finally{h.dispose();}});
test('manual navigation pauses rotation and exposes a start action',()=>{const h=harness();try{h.nodes().find(n=>n.attrs['aria-label']==='Next work').attrs.onClick();h.render();assert.equal(h.timers.size,0);assert.equal(h.rotation()?.attrs['aria-label'],'Start automatic slideshow');}finally{h.dispose();}});

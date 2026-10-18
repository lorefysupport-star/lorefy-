const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const plan=require('../modules/lorefy-catalog-plan');
const exploreSource=fs.readFileSync(require.resolve('../modules/lorefy-explore-studio'),'utf8');
function view(props) {
  const win={LorefyCatalogPlan:plan,React:{createElement:(type,props,...children)=>({type,props:props||{},children})}};
  vm.runInNewContext(exploreSource,{window:win});
  return win.LorefyExploreStudio.SearchSuggestions(props);
}
const state={searchQuery:'One Peice',searchType:'All',suggestions:['One Piece'],searching:false,searchError:false};
for(const language of ['ar','en'])test('correction is a named user action in '+language,()=>{
  let selected;const tree=view({state,query:'One Peice',type:'الكل',language,onChoose:q=>selected=q});
  assert.equal(tree.props['aria-label'],language==='en'?'Suggested searches':'اقتراحات البحث');
  assert.equal(tree.children[0].children[0],language==='en'?'Did you mean?':'هل تقصد؟');
  const button=tree.children[1].children[0][0];assert.equal(button.props.type,'button');assert.equal(button.props.dir,'auto');
  assert.equal(selected,undefined);button.props.onClick();assert.equal(selected,'One Piece');
});
for(const [name,patch,query,type] of [
  ['stale query',{},'Another query','All'],['different type',{},'One Peice','Book'],
  ['loading',{searching:true},'One Peice','All'],['failure',{searchError:true},'One Peice','All'],
  ['empty suggestions',{suggestions:[]},'One Peice','All'],['empty query',{searchQuery:''},'','All']
])test('corrections stay hidden for '+name,()=>assert.equal(view({state:{...state,...patch},query,type,language:'en'}),null));

function field() {
  const hooks=[],timers=new Map(),changes=[];let cursor=0,id=0,queued=[];
  const useState=initial=>{const slot=cursor++;if(!(slot in hooks))hooks[slot]=initial;return[hooks[slot],value=>hooks[slot]=value];};
  const useRef=initial=>{const slot=cursor++;return hooks[slot]||(hooks[slot]={current:initial});};
  const useEffect=(fn,deps)=>{const slot=cursor++,old=hooks[slot];if(!old||deps.some((v,i)=>v!==old[i])){hooks[slot]=deps;queued.push(fn);}};
  const React={useRef,Fragment:'fragment',createElement:(type,props,...children)=>({type,props:props||{},children})};
  const app=fs.readFileSync(require.resolve('../uploads/files/lorefy-app.js'),'utf8'),start=app.indexOf('function SearchBox(');
  const scope={React,useState,useEffect,C:{},uiText:(lang,ar,en)=>en,currentUILang:()=> 'en',X(){},
    setTimeout(fn){const timer=++id;timers.set(timer,fn);return timer;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(app.slice(start,app.indexOf('const SEARCH_CACHE=',start)),scope);
  let initial='';
  function render(next=initial){initial=next;cursor=0;const tree=scope.SearchBox({initial,onChange:q=>changes.push(q)});const input=tree.children.find(x=>x?.type==='input');input.props.ref.current={focus(){}};const effects=queued;queued=[];effects.forEach(fn=>fn());return{input,clear:tree.children.find(x=>x?.type==='button')};}
  return{render,changes,timers,flush(){const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());}};
}
test('choosing a correction replaces the old local query and cancels its pending debounce',()=>{
  const h=field();h.render('One Peice').input.props.onChange({target:{value:'One Peice pending'}});
  h.render('One Piece');assert.equal(h.render().input.props.value,'One Piece');h.flush();assert.deepEqual(h.changes,[]);
});
test('a debounced parent echo does not replace a newer draft',()=>{
  const h=field();h.render().input.props.onChange({target:{value:'One'}});h.flush();
  h.render().input.props.onChange({target:{value:'One Pe'}});h.render('One');
  assert.equal(h.render().input.props.value,'One Pe');h.flush();assert.deepEqual(h.changes,['One','One Pe']);
});
test('unrelated parent renders preserve draft and timer',()=>{
  const h=field();h.render('Start').input.props.onChange({target:{value:'Still typing'}});h.render('Start');
  assert.equal(h.render().input.props.value,'Still typing');h.flush();assert.deepEqual(h.changes,['Still typing']);
});
test('clearing after a replacement cannot emit an old draft',()=>{
  const h=field();h.render('One Peice');h.render('One Piece');h.render().clear.props.onClick();h.flush();
  assert.equal(h.render('').input.props.value,'');assert.deepEqual(h.changes,['']);
});

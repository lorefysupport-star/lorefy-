const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function harness(lang,value){let state=value,hook=0,focused=false;const refs=[],timers=new Map(),changes=[];let timerId=0;
 const React={Fragment:'fragment',useRef(initial){const i=hook++;return refs[i]||(refs[i]={current:initial});},createElement(type,props,...children){return{type,props:props||{},children};}};
 const app=fs.readFileSync(path.join(root,'uploads/files/lorefy-app.js'),'utf8'),start=app.indexOf('function SearchBox('),end=app.indexOf('const SEARCH_CACHE=',start);
 const scope={React,C:{text:'text',sub:'sub'},useState:initial=>[state,v=>state=v],useEffect(){},setTimeout(f){const id=++timerId;timers.set(id,f);return id;},clearTimeout(id){timers.delete(id);},currentUILang:()=>lang,uiText:(l,ar,en)=>l==='en'?en:ar,X(){}};
 vm.runInNewContext(app.slice(start,end),scope);
 function render(){hook=0;const tree=scope.SearchBox({initial:value,onChange:v=>changes.push(v),placeholder:lang==='en'?'Search':'بحث'});const input=tree.children.find(c=>c&&c.type==='input'),clear=tree.children.find(c=>c&&c.type==='button');if(input.props.ref)input.props.ref.current={focus(){focused=true;}};return{input,clear};}
 return {render,changes,timers,isFocused:()=>focused,flush(){for(const fn of timers.values())fn();timers.clear();}};
}
for(const lang of ['ar','en']){
 test('search accepts Arabic and Latin text direction without forced RTL: '+lang,()=>{const h=harness(lang,lang==='en'?'Berserk':'بيرسيرك'),{input}=h.render();assert.equal(input.props.dir,'auto');assert.notEqual(input.props.style.direction,'rtl');assert.equal(input.props.style.textAlign,'start');assert.ok(input.props.style.fontSize>=16);});
 test('clear search has a localized accessible button name: '+lang,()=>{const{clear}=harness(lang,'Query').render();assert.equal(clear.props.type,'button');assert.equal(clear.props['aria-label'],lang==='en'?'Clear search':'مسح البحث');});
}
test('clearing returns focus to the search field and updates the query once',()=>{const h=harness('en','Query'),{clear}=h.render();clear.props.onClick();assert.deepEqual(h.changes,['']);assert.equal(h.isFocused(),true);assert.equal(h.render().input.props.value,'');});
test('clear cancels a pending typed query so it cannot return after being cleared',()=>{const h=harness('en','Query');const view=h.render();view.input.props.onChange({target:{value:'Pending query'}});assert.equal(h.timers.size,1);view.clear.props.onClick();h.flush();assert.deepEqual(h.changes,['']);assert.equal(h.render().input.props.value,'');});

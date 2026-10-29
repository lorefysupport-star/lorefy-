const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const RenderNode=require('./helpers/render-dom.js');
const growth=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
function navigation(lang='en'){
 const scope={doc:{documentElement:{getAttribute:()=>lang==='ar'?'rtl':'ltr'}},uiText:(ar,en)=>lang==='ar'?ar:en};
 const begin=growth.indexOf('  var customizeDialogSequence =');assert.ok(begin>=0,'customize navigation helper is present');
 vm.runInNewContext(growth.slice(begin,growth.indexOf('  function workReviewActionLabel(',begin)),scope);
 class Node extends RenderNode{getAttribute(k){return this.attrs[k]??null;}focus(){scope.doc.activeElement=this;}addEventListener(type,fn){const old=this.handlers[type];this.handlers[type]=old?event=>{old(event);fn(event);}:fn;}}
 const make=cls=>new Node('div',{class:cls}),sheet=make('lf-customize-sheet'),group=make('lf-customize-tabs');
 const tabs=[new Node('button',{'aria-selected':'false'}),new Node('button',{'aria-selected':'true'})],panels=[make('lf-customize-profile-panel'),make('lf-customize-appearance-panel')];
 group.append(...tabs);sheet.append(group,...panels);
 tabs.forEach((tab,index)=>tab.addEventListener('click',()=>tabs.forEach((node,i)=>node.setAttribute('aria-selected',String(i===index)))));
 return {scope,sheet,tabs,panels,enhance:()=>scope.enhanceCustomizeNavigation(sheet),key(index,key){let prevented=false;tabs[index].handlers.keydown({key,target:tabs[index],preventDefault(){prevented=true;}});this.enhance();return prevented;}};
}
for(const lang of ['ar','en'])test(`customize tabs expose panels and keyboard navigation without replacing React selection in ${lang}`,()=>{
 const h=navigation(lang);h.enhance();assert.equal(h.tabs[0].tabIndex,-1);assert.equal(h.tabs[1].tabIndex,0);
 for(let i=0;i<2;i++){assert.equal(h.panels[i].getAttribute('role'),'tabpanel');assert.equal(h.tabs[i].getAttribute('aria-controls'),h.panels[i].getAttribute('id'));assert.equal(h.panels[i].getAttribute('aria-labelledby'),h.tabs[i].getAttribute('id'));}
 const handler=h.tabs[1].handlers.keydown;h.enhance();assert.equal(h.tabs[1].handlers.keydown,handler);
 assert.equal(h.key(1,lang==='ar'?'ArrowRight':'ArrowLeft'),true);assert.equal(h.scope.doc.activeElement,h.tabs[0]);assert.equal(h.tabs[0].tabIndex,0);
 assert.equal(h.key(0,'End'),true);assert.equal(h.tabs[1].tabIndex,0);assert.equal(h.key(1,'Home'),true);assert.equal(h.tabs[0].tabIndex,0);assert.equal(h.key(0,'Enter'),false);
});
test('customize dialog IDs remain unique across mounted instances',()=>{
 const h=navigation();h.enhance();const first=h.tabs[0].getAttribute('id');delete h.sheet.dataset.lfCustomizeId;h.enhance();assert.notEqual(h.tabs[0].getAttribute('id'),first);
});
test('clicking a customize tab updates its keyboard stop without waiting for the global enhancer',()=>{
 const h=navigation();h.enhance();h.tabs[0].click();assert.equal(h.tabs[0].tabIndex,0);assert.equal(h.tabs[1].tabIndex,-1);
});
for(const lang of ['ar','en'])test(`legacy customize dialog is named for its actual purpose in ${lang}`,()=>{
 const h=navigation(lang);assert.equal(h.scope.legacySheetLabel(h.sheet,{textContent:'Your library'}),lang==='ar'?'تخصيص حسابك':'Customize your profile');
 const other={classList:{contains:()=>false}};assert.equal(h.scope.legacySheetLabel(other,{textContent:' Reader heading '}),'Reader heading');
});
test('settings studio is scoped to settings/customization and keeps semantic glass, fields and action pairs',()=>{
 const css=fs.existsSync('styles/lorefy-settings-studio.css')?fs.readFileSync('styles/lorefy-settings-studio.css','utf8'):'';
 assert.match(css,/@layer lorefy-glass-materials/);assert.match(css,/var\(--glass-sheet\)/);assert.match(css,/var\(--glass-reflection\)/);assert.match(css,/color:var\(--ui-on-action\) !important/);
 assert.match(css,/font-size:16px !important/);assert.match(css,/min-height:44px !important/);assert.match(css,/focus-visible/);
 assert.doesNotMatch(css,/\.lf-home|\.lf-library-page|\.lf-explore-cinema|\.lf-profile-banner/);
 assert.match(css,/\.lf-settings-sheet \.lf-settings-cells\s*\{[^}]*background:transparent !important/s);
 assert.match(css,/input\[aria-invalid='true'\][^}]*border-color:var\(--ui-danger\) !important/);
});
test('settings material asset is versioned and cached',()=>{
 const asset='styles/lorefy-settings-studio.css?v=20261028-settings-studio-v1';for(const path of ['index.html','sw.js'])assert.ok(fs.readFileSync(path,'utf8').includes(asset),path);
});

function appearance(lang='en'){
 const source=fs.readFileSync('modules/lorefy-interface-settings.js','utf8');let index=0,nodes=[],values={},states=[true];const changes=[];
 const root={LorefyDesignSystem:require('../modules/lorefy-design-system.js'),LorefyLibraryView:require('../modules/lorefy-library-view.js'),NenIcons:{},
  localStorage:{getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v},document:{documentElement:{setAttribute(){}},querySelector:()=>({})},ReactDOM:{createPortal:n=>n},
  React:{Fragment:'fragment',useRef:()=>({current:null}),useEffect(){},useState(initial){const slot=index++;if(states[slot]===undefined)states[slot]=initial;return [states[slot],value=>states[slot]=value];},
   createElement(type,props,...children){const node={type,props:props||{},children:children.flat(Infinity)};nodes.push(node);return node;}}};
 vm.runInNewContext(source,{window:root});
 return {changes,values,render(){index=0;nodes=[];root.LorefyInterfaceSettings({language:lang,appearance:'dark',onAppearance:mode=>changes.push(mode),books:[]});return nodes;}};
}
for(const lang of ['ar','en'])test(`custom color inputs have visible wrapping labels in ${lang}`,()=>{
 const h=appearance(lang),nodes=h.render(),inputs=nodes.filter(n=>n.type==='input');assert.equal(inputs.length,2);
 for(const input of inputs){const label=nodes.find(n=>n.type==='label'&&n.children.includes(input));assert.ok(label);assert.ok(label.children.some(n=>n?.type==='span'));}
});
test('invalid color reports an associated error without changing the current palette',()=>{
 const h=appearance();let nodes=h.render();nodes.find(n=>n.props['aria-label']==='Hex color').props.onChange({target:{value:'#nope'}});nodes=h.render();nodes.find(n=>n.props['aria-label']==='Hex color').props.onBlur();nodes=h.render();
 const input=nodes.find(n=>n.props['aria-label']==='Hex color'),error=nodes.find(n=>n.props.role==='alert');assert.ok(error.props.id);assert.ok(nodes.find(n=>n.type==='fieldset').children.includes(error));assert.equal(input.props['aria-describedby'],error.props.id);assert.equal(input.props['aria-invalid'],true);assert.deepEqual(h.changes,[]);assert.equal(h.values['lorefy.ui.theme.v1'],undefined);
});
test('applying a custom color returns focus to its field before the Apply action becomes disabled',()=>{
 const h=appearance();let nodes=h.render();nodes.find(n=>n.props['aria-label']==='Hex color').props.onChange({target:{value:'#12abef'}});nodes=h.render();
 const input=nodes.find(n=>n.props['aria-label']==='Hex color');assert.ok(input.props.ref);let focused=false;input.props.ref.current={focus(){focused=true;}};
 nodes.find(n=>n.props['data-custom-apply']).props.onClick();assert.equal(focused,true);assert.deepEqual(h.changes,['custom-dark-12abef']);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const library = require('../modules/lorefy-library-view.js');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function storage(initial = {}) {
  const values = {...initial};
  return {values, getItem:key=>values[key]??null, setItem:(key,value)=>{values[key]=value;}};
}

test('spine view is an additional choice and does not reinterpret the existing list preference', () => {
  assert.equal(library.normalizeMode('spines'),'spines');
  assert.equal(library.normalizeMode('shelf'),'shelf');
  assert.equal(library.normalizeMode('unknown'),'grid');
  const store=storage({'lorefy.library.view.v1':'shelf','account':'keep'});
  assert.equal(library.savedMode(store),'shelf');
  assert.equal(library.setMode('spines',store),true);
  assert.equal(library.savedMode(store),'spines');
  assert.equal(store.values.account,'keep');
});

test('each spine has a stable, bounded height independent of viewport or selection', () => {
  const a=library.spineHeight('Berserk'),b=library.spineHeight('A very long title with العربية');
  assert.equal(a,library.spineHeight('Berserk'));
  assert.ok(a>=172&&a<=196);assert.ok(b>=172&&b<=196);
});

test('layout labels are explicit in Arabic and English', () => {
  assert.equal(library.options('ar').find(o=>o.mode==='spines').label,'رف الكتب');
  assert.equal(library.options('en').find(o=>o.mode==='shelf').label,'List');
});

test('motion preference is local, reversible and cannot disable the system accessibility preference', () => {
  const prefs=require('../modules/lorefy-interface-settings.js');
  const store=storage({account:'keep'});
  assert.equal(prefs.getMotion(store),'system');
  assert.equal(prefs.setMotion('reduced',store),true);
  assert.equal(prefs.reduceMotion(store,false),true);
  assert.equal(prefs.setMotion('system',store),true);
  assert.equal(prefs.reduceMotion(store,true),true);
  assert.equal(prefs.reduceMotion(store,false),false);
  assert.equal(store.values.account,'keep');
  assert.equal(prefs.setMotion('reduced',{setItem(){throw new Error('full');}}),false);
});

function renderSettings(lang,open=false) {
  const nodes=[],changed=[];let stateIndex=0;
  const window={LorefyDesignSystem:require('../modules/lorefy-design-system.js'),LorefyLibraryView:library,localStorage:storage(),NenIcons:{SlidersHorizontal:'icon',ChevronLeft:'back',ChevronRight:'back',RotateCcw:'reset',Check:'check'},
    React:{createElement(type,props,...kids){const node={type,props:props||{},children:kids.flat(Infinity)};nodes.push(node);return node;},
      useState(value){return [stateIndex++===0?open:value,()=>{}];},useRef(){return {current:null};},useEffect(){}},
    ReactDOM:{createPortal(node){return node;}},document:{querySelector(){return {};},documentElement:{setAttribute(){}}}};
  vm.runInNewContext(read('modules/lorefy-interface-settings.js'),{window});
  window.LorefyInterfaceSettings({language:lang,appearance:'pink',onAppearance:value=>changed.push(value),books:[{id:'b',title:'Berserk',cover:'cover.jpg'}]});
  return {nodes,changed};
}

test('personalization is one settings entry, then a labelled dialog with theme and layout choices', () => {
  const closed=renderSettings('en');
  assert.ok(closed.nodes.some(n=>n.props.className==='lf-interface-entry'));
  assert.equal(closed.nodes.some(n=>n.props.role==='dialog'),false);
  const {nodes,changed}=renderSettings('en',true);
  assert.ok(nodes.some(n=>n.props.role==='dialog'&&n.props['aria-modal']===true));
  const theme=nodes.find(n=>n.props['aria-label']==='Dark');assert.ok(theme);theme.props.onClick();assert.deepEqual(changed,['dark']);
  assert.ok(nodes.some(n=>n.props['data-layout']==='spines'));
  assert.ok(nodes.some(n=>n.props.role==='switch'&&n.props['aria-label']==='Reduce motion'));
});

test('Arabic dialog has direct localized labels and uses the supplied real cover assets', () => {
  const {nodes}=renderSettings('ar',true);
  assert.ok(nodes.some(n=>n.children.includes('المظهر والتخصيص')));
  assert.ok(nodes.some(n=>n.props.type==='button'&&n.props['data-layout']==='spines'&&n.children.includes('رف الكتب')));
  assert.ok(nodes.some(n=>n.type==='img'&&n.props.src==='cover.jpg'));
});

test('spines and settings are first-class runtime assets with bounded rendering and motion safeguards', () => {
  const html=read('index.html'),css=read('styles/lorefy-interface-settings.css'),app=read('uploads/files/lorefy-app.js');
  assert.match(html,/modules\/lorefy-interface-settings\.js/);
  assert.match(html,/styles\/lorefy-interface-settings\.css/);
  assert.match(app,/React\.createElement\(window\.LorefyInterfaceSettings,/);
  assert.match(app,/React\.createElement\("button",\{type:"button",className:"lf-library-card"/);
  assert.match(css,/is-spine-view/);
  assert.match(css,/minmax\(44px,/);
  assert.match(css,/data-lorefy-motion='reduced'/);
});

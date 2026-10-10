const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const design=require('../modules/lorefy-design-system.js');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

function contrast(a,b) {
  const luminance=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255)
    .map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
  const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test('custom colors form a complete chromatic theme, not a near-neutral accent skin',()=>{
  const channels=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16));
  for(const base of ['dark','light']){
    const orange=design.palette(design.customMode('#df7134',base));
    for(const key of ['bg','card','field','fill2','accentSoft','navBg','barBg']){
      const [r,g,b]=channels(orange[key]);
      assert.ok(r-g>=18&&g-b>=9,`${base}/${key} must visibly carry orange: ${orange[key]}`);
    }
    const blue=design.palette(design.customMode('#3687bb',base));
    const [r,,b]=channels(blue.bg);assert.ok(b-r>=20,`${base} blue page must carry blue`);
    assert.notEqual(orange.bg,orange.card);assert.notEqual(orange.card,orange.field);
    assert.equal(orange.green,design.palette(base).green);
    assert.equal(orange.red,design.palette(base).red);
  }
  for(const base of ['dark','light'])for(const color of ['#ffffff','#000000','#ffff00']){
    const p=design.palette(design.customMode(color,base));
    assert.notEqual(p.bg,p.card);assert.notEqual(p.card,p.field);
  }
});
test('custom theme chrome overrides fixed neutral legacy fields and headers only within the selected theme',()=>{
  const css=read('styles/lorefy-design-system.css');
  assert.match(css,/\.lf-app\.lf-app\.lf-app\.is-custom\s+:is\(input[^}]*background:\s*var\(--ui-fill\)\s*!important/);
  assert.match(css,/\.lf-app\.lf-app\.lf-app\.is-custom\s+:is\(\.lf-library-header[^}]*background:\s*var\(--ui-bar\)\s*!important/);
});
test('arbitrary colors retain their exact value and their separate background mode',()=>{
  assert.equal(design.customMode('#0aB','dark'),'custom-dark-00aabb');
  assert.equal(design.normalizeMode('custom-light-12ABEF'),'custom-light-12abef');
  assert.equal(design.isDark('custom-dark-ffffff'),true);
  assert.equal(design.isDark('custom-light-000000'),false);
  assert.deepEqual(design.customSettings('custom-dark-12abef'),{color:'#12abef',base:'dark'});
  for(const value of ['url(evil)','red','#ff000080','#12345','<script>'])assert.equal(design.customMode(value,'light'),null);
});
test('custom palettes keep readable body, muted, selected and action text even for extreme colors',()=>{
  const colors=['#ffffff','#000000','#ffff00','#ff0000','#00ff00','#0000ff','#ff00ff','#00ffff'];
  for(let r=0;r<256;r+=51)for(let g=0;g<256;g+=51)for(let b=0;b<256;b+=51)
    colors.push('#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join(''));
  for(const color of colors)for(const base of ['light','dark']){
    const p=design.palette(design.customMode(color,base));
    assert.equal(p.customColor,color);
    for(const bg of [p.bg,p.card,p.field,p.fill2,p.accentSoft])for(const ink of [p.text,p.sub,p.accentText])
      assert.ok(contrast(ink,bg)>=4.5,`${color}/${base}: ${ink} on ${bg}`);
    assert.ok(contrast(p.onAccent,p.accent)>=4.5);
    assert.ok(contrast(p.onAccent,p.accentPressed)>=4.5);
  }
});
test('custom appearance persists without touching reading or profile data and reports failed storage',()=>{
  const values={profile:'keep'},storage={setItem:(k,v)=>values[k]=v,getItem:k=>values[k]};
  assert.equal(design.saveMode('custom-dark-aabbcc',storage),true);
  assert.equal(design.readMode(storage),'custom-dark-aabbcc');
  assert.equal(values.profile,'keep');
  assert.equal(design.saveMode('custom-dark-invalid',storage),false);
  assert.equal(design.saveMode('dark',{setItem(){throw Error('quota');}}),false);
  assert.equal(design.readMode({getItem(){throw Error('blocked');}}),'dark');
});
test('React and shell use the same custom semantic tokens and the actual dark background mode',()=>{
  const mode='custom-light-bb3300',p=design.palette(mode),tokens=design.tokens(mode);
  assert.equal(tokens['--ui-bg'],p.bg);assert.equal(tokens['--ui-action'],p.accent);
  assert.equal(tokens['--ui-on-action'],p.onAccent);
  assert.match(read('uploads/files/lorefy-app.js'),/a=window\.LorefyDesignSystem\.isDark\(appearance\)/);
  assert.match(read('uploads/files/lorefy-app.js'),/\.\.\.window\.LorefyDesignSystem\.tokens\(appearance\)/);
  assert.match(read('index.html'),/LorefyDesignSystem\.tokens\(mode\)/);
});

function settingsHarness(failSave=false) {
  let index=0,nodes=[],changed=[];const states=[true],values={};
  const root={LorefyDesignSystem:design,LorefyLibraryView:require('../modules/lorefy-library-view.js'),NenIcons:{},
    localStorage:{getItem:k=>values[k]||null,setItem(k,v){if(failSave)throw Error('full');values[k]=v;}},
    document:{documentElement:{setAttribute(){}},querySelector:()=>({})},ReactDOM:{createPortal:n=>n},
    React:{Fragment:'fragment',useRef:()=>({current:null}),useEffect(){},useState(initial){const slot=index++;if(states[slot]===undefined)states[slot]=initial;return [states[slot],v=>states[slot]=v];},
      createElement(type,props,...children){const node={type,props:props||{},children:children.flat(Infinity)};nodes.push(node);return node;}}};
  vm.runInNewContext(read('modules/lorefy-interface-settings.js'),{window:root});
  const render=()=>{index=0;nodes=[];root.LorefyInterfaceSettings({language:'en',appearance:'dark',onAppearance:m=>changed.push(m),books:[]});return nodes;};
  return {render,changed,values};
}
test('color picker saves only a valid applied draft, and failure never changes the current theme',()=>{
  for(const fail of [false,true]){
    const h=settingsHarness(fail);let nodes=h.render();
    nodes.find(n=>n.props['aria-label']==='Hex color').props.onChange({target:{value:'#12abef'}});
    assert.equal(h.changed.length,0);nodes=h.render();
    nodes.find(n=>n.type==='button'&&n.props['data-custom-apply']).props.onClick();
    assert.deepEqual(h.changed,fail?[]:['custom-dark-12abef']);
    if(fail)assert.ok(h.render().some(n=>n.props.role==='alert'));
    else assert.equal(h.values['lorefy.ui.theme.v1'],'custom-dark-12abef');
  }
});
test('quick light and dark changes retain the custom color',()=>{
  const design=require('../modules/lorefy-design-system.js');
  assert.equal(design.withBase('custom-dark-12abef','light'),'custom-light-12abef');
  assert.equal(design.withBase('custom-light-12abef','dark'),'custom-dark-12abef');
  assert.equal(design.withBase('pink','dark'),'dark');
});
test('native color picker input updates the draft immediately before confirmation',()=>{
  const h=settingsHarness(),nodes=h.render();
  nodes.find(n=>n.props['aria-label']==='Choose theme color').props.onInput({currentTarget:{value:'#abcdef'}});
  assert.equal(h.render().find(n=>n.props['aria-label']==='Hex color').props.value,'#abcdef');
  assert.equal(h.changed.length,0);
});

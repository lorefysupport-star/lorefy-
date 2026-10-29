const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function localShop(){
  const window={location:{hostname:'127.0.0.1',search:'?decorationLab=1'},LorefyBackend:{mode:'demo'},LOREFY_RELEASE:{betaProfileDecorations:true},LorefyFrameRestoration:require('../modules/lorefy-frame-restoration.js')};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
  const api=window.LorefyProfileShop;
  api.installBetaCollections(JSON.parse(read('launch/decorations/pfpvibes/collections.json')));
  api.installShopCatalog(JSON.parse(read('launch/decorations/originals/catalog.json')));
  api.installAtelierCollections(JSON.parse(read('qa/motion-atelier/collections.json')));
  api.installElvenCollections(JSON.parse(read('qa/elf-motion/collections.json')));
  api.installRestoration(JSON.parse(read('launch/decorations/refined/manifest.json')));
  return api;
}
test('the redesigned store contains both new batches and updated offered originals, without unlocking hidden packs',()=>{
  const api=localShop(),before=JSON.stringify(api.offered);
  assert.equal(api.filterCatalog().length,29);
  assert.equal(api.filterCatalog({collection:'elven'}).length,6);
  assert.equal(api.filterCatalog({collection:'atelier'}).length,6);
  assert.equal(api.filterCatalog({collection:'classic'}).length,17);
  assert.ok(api.filterCatalog({collection:'classic'}).every(p=>p.motionRenderer==='restored'));
  assert.equal(JSON.stringify(api.offered),before);
  assert.equal(api.filterCatalog().some(p=>p.id==='pfpvibes-block-party'),false);
});
test('catalog search, sorting and saved/owned views are bilingual and never mutate selections or entitlements',()=>{
  const api=localShop(),id='original-ribbon-bunny';
  assert.equal(api.filterCatalog({query:'أرنب'}).some(p=>p.id===id),true);
  assert.equal(api.filterCatalog({query:'ribbon bunny'}).some(p=>p.id===id),true);
  assert.equal(api.filterCatalog({query:'NO SUCH ARTWORK'}).length,0);
  assert.equal(api.filterCatalog({view:'saved',wishlist:[id]}).map(p=>p.id).join(),id);
  const paid={...api.offered.find(p=>p.productId),free:false};
  assert.equal(api.filterCatalog({view:'owned',items:[paid],owned:[]}).length,0);
  assert.equal(api.filterCatalog({view:'owned',items:[paid],owned:[paid.productId]}).length,1);
  assert.equal(api.filterCatalog({freeOnly:true,items:[paid]}).length,0);
  assert.equal(api.filterCatalog({collection:'elven',query:'bunny'}).length,0);
  assert.equal(api.filterCatalog()[0].renderer,'elven');
});
test('the store has scoped responsive styling and keeps the existing checkout and local-only artwork guards',()=>{
  const js=read('modules/lorefy-profile-shop.js'),css=read('styles/lorefy-decoration-store.css');
  assert.match(js,/lf-store-v2/);assert.match(js,/type:'search'/);assert.match(js,/catalogState/);
  assert.match(js,/input,select/,'Focus trap includes the new search and sort fields');
  assert.match(css,/\.lf-store-v2/);assert.doesNotMatch(css,/font-size:\s*[^;]*vw|letter-spacing:\s*-/);
  assert.match(js,/isLocalLab\(\).*installCollections/);
  assert.match(js,/LOREFY_DECORATION_PURCHASE_REQUIRED/);
  assert.match(read('index.html'),/styles\/lorefy-decoration-store\.css/);
});
test('preview geometry waits for the selected animation rig and ignores late completion after disposal',async()=>{
  const effects=[],nodes=[],values=[];let finish,ready=false,layouts=0;
  const window={LorefyOriginalRenderers:{elven:{load:()=>new Promise(resolve=>{finish=()=>{ready=true;resolve();};}),layout:()=>{assert.ok(ready);layouts++;return {line:90};}}},
    React:{useRef:()=>({current:null}),useEffect:fn=>effects.push(fn),createElement:(type,props,...children)=>{const n={type,props:props||{},children};nodes.push(n);return n;}}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
  const pack={...window.LorefyProfileShop.bundles[0],renderer:'elven',artId:'emerald-whisper'};
  window.LorefyProfileShop.ProfilePreview({pack,profile:{name:'Reader'}});
  nodes.find(n=>n.type==='section').props.ref.current={clientWidth:320,clientHeight:460,style:{setProperty:(...v)=>values.push(v)}};
  const dispose=effects[0]();assert.equal(layouts,0);finish();await Promise.resolve();await Promise.resolve();
  assert.equal(layouts,1);assert.equal(values.at(-1)[1],'92px');dispose();
  const cancel=effects[0]();cancel();finish();await Promise.resolve();await Promise.resolve();assert.equal(layouts,1);
});
test('failed preview artwork leaves loading state and exposes a working retry command',async()=>{
  const effects=[],nodes=[],attrs={};let retries=0;
  const window={LorefyOriginalRenderers:{elven:{load:()=>Promise.reject(Error('offline')),layout:()=>{throw Error('must not measure missing art');}}},
    React:{useRef:()=>({current:null}),useEffect:fn=>effects.push(fn),createElement:(type,props,...children)=>{const n={type,props:props||{},children};nodes.push(n);return n;}}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
  const pack={...window.LorefyProfileShop.bundles[0],renderer:'elven',artId:'emerald-whisper'};
  window.LorefyProfileShop.ProfilePreview({pack,profile:{},onRetry:()=>retries++});
  nodes.find(n=>n.type==='section').props.ref.current={clientWidth:320,clientHeight:400,style:{setProperty(){}},setAttribute:(k,v)=>attrs[k]=v};
  effects[0]();await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(attrs['data-preview-ready'],'true');assert.equal(attrs['data-preview-failed'],'true');
  nodes.find(n=>n.type==='button'&&n.children.includes('إعادة المحاولة')).props.onClick();assert.equal(retries,1);
});

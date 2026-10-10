const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const api = () => require('../modules/lorefy-profile-shop.js');

test('free decorations are available in demo and live accounts, including native', () => {
  const shop = api();
  assert.equal(shop.isAvailable({mode:'demo'}), true);
  assert.equal(shop.isAvailable({mode:'live'}), true);
  assert.equal(shop.isAvailable({mode:'unavailable'}), false);
  assert.equal(shop.isAvailable(null), false);
});

test('free original bundles contain avatar and page frames plus an effect, without prices', () => {
  const shop = api();
  assert.equal(shop.bundles.length, 3);
  assert.equal(new Set(shop.bundles.map(pack => pack.id)).size, 3);
  for (const pack of shop.bundles) {
    assert.deepEqual(pack.parts, ['frame', 'page', 'effect']);
    assert.equal(pack.free, true);
    assert.ok(pack.names.ar && pack.names.en);
    assert.equal(pack.price, null);
    assert.equal(Object.isFrozen(pack), true);
  }
  assert.equal(shop.findBundle('not-a-product'), null);
});

test('part previews are reversible and never mutate the profile or grant ownership', () => {
  const shop = api(), original = {name:'Reader', banner:'https://example.com/banner.jpg'};
  const before = JSON.stringify(original);
  assert.deepEqual(shop.previewParts('observatory', 'all'), {frame:'observatory', page:'observatory', effect:'observatory'});
  assert.deepEqual(shop.previewParts('observatory', 'frame'), {frame:'observatory', page:null, effect:null});
  assert.deepEqual(shop.previewParts('observatory', 'unknown'), {frame:null, page:null, effect:null});
  assert.deepEqual(shop.previewParts('invalid', 'all'), {frame:null, page:null, effect:null});
  assert.equal(JSON.stringify(original), before);
});

test('wishlist is session-only and scoped to the current demo account', () => {
  const shop = api(), values = {};
  const store = {getItem:key => values[key] || null, setItem:(key,value) => {values[key]=value;}};
  assert.equal(shop.writeWishlist(store, 'a', ['observatory','invalid','observatory','blossom']), true);
  assert.deepEqual(shop.readWishlist(store, 'a'), ['observatory','blossom']);
  assert.deepEqual(shop.readWishlist(store, 'b'), []);
  assert.equal(shop.writeWishlist(store, '', ['observatory']), false);
  assert.equal(shop.writeWishlist({setItem(){throw Error('full');}}, 'a', []), false);
  assert.deepEqual(shop.readWishlist({getItem(){throw Error('blocked');}}, 'a'), []);
});

test('free decorations do not use checkout or rewrite the existing profile media', () => {
  const code = read('modules/lorefy-profile-shop.js');
  assert.doesNotMatch(code, /\.saveProfile\(|\.startCheckout\(|\.getEntitlements\(|function checkout/);
});

test('catalog uses real original art, RTL/LTR labels and accessible dialog controls', () => {
  const code = read('modules/lorefy-profile-shop.js');
  assert.match(code, /aria-modal/);
  assert.match(code, /aria-pressed/);
  assert.match(code, /Escape/);
  assert.match(code, /node\.inert/);
  assert.match(code, /previous\.focus\(\)/);
  assert.match(code, /sessionStorage/);
  assert.match(code, /applyDecoration/);
  assert.match(read('index.html'), /modules\/lorefy-profile-shop\.js/);
  assert.match(read('modules/lorefy-interface-settings.js'), /LorefyProfileShop\.Entry/);
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'launch', 'shop', 'lorefy-collection-atlas.jpg')));
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'launch', 'shop', 'lorefy-avatar-frames.png')));
  assert.match(read('styles/lorefy-profile-shop.css'), /lorefy-avatar-frames\.png/);
});

test('effects are bounded, noninteractive and respect both motion preferences', () => {
  const css = read('styles/lorefy-profile-shop.css');
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /data-lorefy-motion='reduced'/);
  assert.match(css, /pointer-events: none/);
  assert.doesNotMatch(css, /infinite|font-size:\s*\d+vw|letter-spacing:\s*-/);
  assert.match(css, /minmax\(0,\s*1fr\)/);
  assert.match(css, /overflow-wrap: anywhere/);
});

test('rendered catalog actions and part selection never change account state', () => {
  const nodes = [], calls = [];
  const window = {React:{useRef:()=>({current:null}),useEffect:()=>{},createElement:(type, props, ...children) => {
    const node = {type,props:props || {},children:children.flat(Infinity)}; nodes.push(node); return node;
  }}, NenIcons:{}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'), {window, URLSearchParams});
  const shop = window.LorefyProfileShop;
  shop.Catalog({lang:'en', profile:{name:'Reader'}, wishlist:[], onSelect:id => calls.push(id), onWishlist:() => {}});
  const preview = nodes.find(node => node.props['aria-label'] === 'Preview Observatory');
  assert.ok(preview); preview.props.onClick();
  assert.deepEqual(calls, ['observatory']);
  assert.equal(nodes.some(node => node.props['aria-label'] === 'Buy'), false);
});

test('the first click is queued until the independent preview controller is ready', () => {
  const effects = [], changes = [], listeners = {};
  let state = 0;
  const window = {
    location:{hostname:'localhost',search:'?preview=demo'}, LorefyBackend:{mode:'demo',user:{id:'demo-a'}},
    localStorage:{getItem:() => null}, document:{querySelector:() => null, documentElement:{lang:'en'}, activeElement:null},
    React:{useState:initial => {const index=state++; return [initial,value => changes.push({index,value})];}, useRef:() => ({current:null}), useEffect:fn => effects.push(fn)},
    addEventListener:(name,fn) => {listeners[name]=fn;}, removeEventListener:() => {},
    dispatchEvent:event => {if(listeners[event.type]) listeners[event.type](event);},
    CustomEvent:class {constructor(type,props){this.type=type;this.detail=props.detail;}}, sessionStorage:{getItem:() => null}
  };
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'), {window, URLSearchParams});
  assert.equal(window.LorefyProfileShop.open(), true);
  assert.equal(changes.length, 0);
  window.LorefyProfileShop.Shop(); effects[0]();
  const request=changes.find(change => change.index === 0);
  assert.ok(request, 'the queued click must open the preview');
  assert.equal(request.value.owner, 'demo-a');
});

test('a frame-only preview preserves a missing original cover instead of applying the bundle cover', () => {
  const nodes = [];
  const window = {React:{useRef:()=>({current:null}),useEffect:()=>{},createElement:(type, props, ...children) => {
    if (typeof type === 'function') return type({...props, children});
    const node={type,props:props || {},children}; nodes.push(node); return node;
  }},NenIcons:{}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'), {window, URLSearchParams});
  const shop=window.LorefyProfileShop;
  shop.ProfilePreview({pack:shop.bundles[0],profile:{name:'Reader',banner:''},part:'frame'});
  const banner=nodes.find(node => node.props.className === 'lf-shop-art lf-shop-profile-banner');
  assert.equal(banner.props.style.backgroundImage, 'none');
});

test('opening a bundle or changing the catalog tab resets the preview scroll', () => {
  const effects=[], nodes=[];
  let state=0;
  const window={document:{readyState:'loading',addEventListener:()=>{},documentElement:{lang:'en'},querySelector:()=>({})}, NenIcons:{},
    React:{useState:initial=>[state++ === 0 ? {profile:{},owner:'demo-a'} : initial,()=>{}],
      useRef:()=>({current:null}),useEffect:(fn,deps)=>effects.push({fn,deps}),
      createElement:(type,props,...children)=>{const node={type,props:props || {},children};nodes.push(node);return node;}},
    ReactDOM:{createPortal:content=>content}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'),{window,URLSearchParams});
  window.LorefyProfileShop.Shop();
  const body=nodes.find(node=>node.props.className === 'lf-shop-body');
  assert.ok(body.props.ref, 'the scroll body must be controlled');
  const scroll={scrollTop:350};body.props.ref.current=scroll;
  const reset=effects.find(effect=>effect.deps.length === 3);
  assert.ok(reset, 'reset must react to request, selection and tab');
  reset.fn();
  assert.equal(scroll.scrollTop,0);
});

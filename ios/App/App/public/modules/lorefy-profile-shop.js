/* Owner-selected decorations. Previews never replace profile media. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyProfileShop = api;
  if (root.document && root.ReactDOM) api.start();
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  let bundles = Object.freeze([
    {id:'observatory', names:{ar:'مرصد القمر', en:'Observatory'}, icon:'Moon', accent:'#9fe4ed', second:'#e5c889', row:'0%', collection:{ar:'بين السطور والنجوم', en:'Between pages and stars'}},
    {id:'blossom', names:{ar:'رسائل الربيع', en:'Spring Letters'}, icon:'Flower2', accent:'#ef99b6', second:'#f7d8ab', row:'50%', collection:{ar:'حكاية تزهر', en:'A story in bloom'}},
    {id:'manuscript', names:{ar:'المخطوطة', en:'Manuscript'}, icon:'Feather', accent:'#dabb78', second:'#79b5a0', row:'100%', collection:{ar:'من مكتبة الحكايات', en:'From the story archive'}}
  ].map(pack => Object.freeze({...pack, motion:Object.freeze({motif:{observatory:'spark',blossom:'flower',manuscript:'rune'}[pack.id],color:pack.accent,second:pack.second,speed:.5,count:6}), names:Object.freeze(pack.names), collection:Object.freeze(pack.collection), parts:Object.freeze(['frame','page','effect']), price:null, free:true})));
  function isLocalLab() {
    try {return ['localhost','127.0.0.1'].includes(root.location.hostname) && new URLSearchParams(root.location.search).get('decorationLab')==='1' && root.LorefyBackend.mode==='demo';}
    catch (_) {return false;}
  }
  function installLocalCollections(items) {
    return isLocalLab() && installCollections(items,false);
  }
  function betaCollectionsEnabled() {return !!(root.LOREFY_RELEASE && root.LOREFY_RELEASE.betaProfileDecorations === true);}
  function installBetaCollections(items) {
    return betaCollectionsEnabled() && installCollections(items,true);
  }
  function installCollections(items,beta) {
    if(!Array.isArray(items) || !items.length || items.length>24)return false;
    const overlayPath=beta ? /^launch\/decorations\/pfpvibes\/[a-z-]+\.png$/ : /^qa\/frame-lab\/[a-z-]+\.png$/;
    const ids=new Set();
    if(items.some(item=>!item || !/^pfpvibes-[a-z-]+$/.test(item.id) || ids.has(item.id) || !ids.add(item.id) ||
      !overlayPath.test(item.overlay) || !item.names || typeof item.names.ar!=='string' || typeof item.names.en!=='string' ||
      !/^#[\da-f]{6}$/i.test(item.accent) || !/^#[\da-f]{6}$/i.test(item.second) || item.releaseAllowed!==false ||
      (item.geometry && !validGeometry(item.geometry))))return false;
    const extra=items.map(item=>Object.freeze({id:item.id,names:Object.freeze({...item.names}),overlay:item.overlay,accent:item.accent,second:item.second,
      row:'0%',icon:'Sparkles',geometry:item.geometry?Object.freeze({...item.geometry}):null,releaseAllowed:false,betaCollection:beta,
      collection:Object.freeze(beta ? {ar:'PFP Vibes',en:'PFP Vibes'} : {ar:'PFP Vibes · تجربة محلية',en:'PFP Vibes · Local prototype'}),
      motion:Object.freeze({...item.motion,color:item.accent,second:item.second}),parts:Object.freeze(['frame','page','effect']),free:true,price:null}));
    bundles=Object.freeze([...bundles.filter(pack=>!pack.overlay),...extra]);return true;
  }
  let offerIds=null;
  const offeredBundles=()=>offerIds ? offerIds.map(findBundle).filter(Boolean) : bundles;
  const hasPaidOffers=()=>offeredBundles().some(pack=>!pack.free);
  const collectionKey=pack=>pack.renderer==='elven'?'elven':pack.renderer==='atelier'?'atelier':'classic';
  const searchKey=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f]/g,'').replace(/[أإآ]/g,'ا').toLowerCase().trim();
  function filterCatalog(options={}){
    const {items=offeredBundles(),collection='all',query='',view='collections',wishlist=[],owned=[],freeOnly=false,sort='newest',lang='ar'}=options;
    const terms=searchKey(query).split(/\s+/).filter(Boolean),rank={elven:0,atelier:1,classic:2};
    return items.filter(p=>(collection==='all'||collectionKey(p)===collection)&&(!freeOnly||p.free)&&
      (view!=='saved'||wishlist.includes(p.id))&&(view!=='owned'||p.free||owned.includes(p.productId))&&
      terms.every(term=>searchKey([p.names.ar,p.names.en,p.collection.ar,p.collection.en].join(' ')).includes(term)))
      .sort((a,b)=>sort==='name'?a.names[lang].localeCompare(b.names[lang],lang):rank[collectionKey(a)]-rank[collectionKey(b)]);
  }
  function installAtelierCollections(items) {
    if(!isLocalLab()||!Array.isArray(items)||items.length!==6)return false;
    const allowed=new Set(['inkstorm','star-atlas','sakura-wind','tidal-glass','signal-zero','paper-flight']),ids=new Set();
    if(items.some(p=>!p||!allowed.has(p.artId)||p.id!=='atelier-'+p.artId||ids.has(p.id)||!ids.add(p.id)||
      p.overlay!=='qa/motion-atelier/'+p.artId+'/avatar.png'||p.pageOverlay!=='qa/motion-atelier/'+p.artId+'/page.png'||
      p.releaseAllowed!==false||!p.names||typeof p.names.ar!=='string'||typeof p.names.en!=='string'||
      !/^#[\da-f]{6}$/i.test(p.accent)||!/^#[\da-f]{6}$/i.test(p.second)||!p.geometry||!validGeometry(p.geometry,.4)))return false;
    const extra=items.map(p=>Object.freeze({id:p.id,artId:p.artId,renderer:'atelier',overlay:p.overlay,pageOverlay:p.pageOverlay,
      names:Object.freeze({...p.names}),accent:p.accent,second:p.second,geometry:Object.freeze({...p.geometry}),releaseAllowed:false,
      parts:Object.freeze(['frame','page']),free:true,price:null,row:'0%',icon:'Sparkles',
      collection:Object.freeze({ar:'مشغل لورفاي',en:'Lorefy Atelier'}),motion:Object.freeze({color:p.accent,second:p.second})}));
    bundles=Object.freeze([...bundles.filter(p=>p.renderer!=='atelier'),...extra]);
    offerIds=Object.freeze([...extra.map(p=>p.id),...(offerIds||[]).filter(id=>!ids.has(id))]);return true;
  }
  function installElvenCollections(items) {
    if(!isLocalLab()||!Array.isArray(items)||items.length!==6)return false;
    const allowed=new Set(['emerald-whisper','duskborn','opal-silk','living-grove','elven-ranger','autumn-court']),ids=new Set();
    if(items.some(p=>!p||!allowed.has(p.artId)||p.id!=='elven-'+p.artId||ids.has(p.id)||!ids.add(p.id)||
      p.overlay!=='qa/elf-motion/'+p.artId+'/avatar.png'||p.pageOverlay!=='qa/elf-motion/'+p.artId+'/page.png'||
      p.releaseAllowed!==false||!p.names||typeof p.names.ar!=='string'||typeof p.names.en!=='string'||
      !/^#[\da-f]{6}$/i.test(p.accent)||!/^#[\da-f]{6}$/i.test(p.second)||!p.geometry||!validGeometry(p.geometry,.35)||
      !Array.isArray(p.portraitClip)||p.portraitClip.length!==72||p.portraitClip.some(q=>!Array.isArray(q)||q.length!==2||q.some(v=>!Number.isFinite(v)||v<0||v>1))))return false;
    const extra=items.map(p=>Object.freeze({id:p.id,artId:p.artId,renderer:'elven',overlay:p.overlay,pageOverlay:p.pageOverlay,
      names:Object.freeze({...p.names}),accent:p.accent,second:p.second,geometry:Object.freeze({...p.geometry}),portraitClip:Object.freeze(p.portraitClip.map(q=>Object.freeze([...q]))),releaseAllowed:false,
      parts:Object.freeze(['frame','page']),free:true,price:null,row:'0%',icon:'Sparkles',
      collection:Object.freeze({ar:'إلف لورفاي',en:'Lorefy Elven Atelier'}),motion:Object.freeze({color:p.accent,second:p.second})}));
    bundles=Object.freeze([...bundles.filter(p=>p.renderer!=='elven'),...extra]);
    offerIds=Object.freeze([...extra.map(p=>p.id),...(offerIds||[]).filter(id=>!ids.has(id))]);return true;
  }
  function installRestoration(items){
    if(!Array.isArray(items)||items.length!==39||new Set(items.map(p=>p&&p.id)).size!==39)return false;
    if(items.some(p=>!p||(!findBundle(p.id)&&!(root.LorefyFrameRestoration&&root.LorefyFrameRestoration.valid(p)))||!(['observatory','blossom','manuscript'].includes(p.id)||/^(pfpvibes|original)-[a-z-]+$/.test(p.id))||
      p.avatar!=='launch/decorations/refined/'+p.id+'.png'||!validGeometry(p.geometry,.35)||!p.aperture||!Number.isFinite(p.aperture.size)||p.aperture.size<=0||p.aperture.size>=p.geometry.size||
      !Array.isArray(p.portraitClip)||p.portraitClip.length!==72||p.portraitClip.some(q=>!Array.isArray(q)||q.length!==2||q.some(v=>!Number.isFinite(v)||v<0||v>1))||
      root.LorefyFrameRestoration&&!root.LorefyFrameRestoration.valid(p)))return false;
    const byId=new Map(items.map(p=>[p.id,p]));
    bundles=Object.freeze(bundles.map(pack=>{const p=byId.get(pack.id);return p?Object.freeze({...pack,motionRenderer:'restored',motionOverlay:p.avatar,
      geometry:Object.freeze({...p.geometry}),portraitClip:Object.freeze(p.portraitClip.map(q=>Object.freeze([...q])))}):pack;}));return true;
  }
  function articulated(pack){return !!pack&&(pack.renderer==='atelier'||pack.renderer==='elven'||pack.motionRenderer==='restored');}
  function motionOriginal(pack){const renderer=pack.motionRenderer||pack.renderer;return renderer?{original:{id:pack.motionRenderer?pack.id:pack.artId,renderer}}:{};}
  function installShopCatalog(catalog) {
    if(!catalog || catalog.version!==1 || !Array.isArray(catalog.freeIds) || catalog.freeIds.length!==5 || !Array.isArray(catalog.paid) || catalog.paid.length!==12)return false;
    const ids=new Set(),products=new Set();
    if(catalog.freeIds.some(id=>!findBundle(id)||!findBundle(id).free))return false;
    if(catalog.paid.some(p=>!p || !/^original-[a-z-]+$/.test(p.id) || ids.has(p.id) || !ids.add(p.id) ||
      p.productId!=='com.lorefy.app.decorations.'+p.artId.replaceAll('-','_') || products.has(p.productId) || !products.add(p.productId) ||
      !/^[a-z-]+$/.test(p.artId) || !['original','autumn','illustrated'].includes(p.renderer) ||
      p.overlay!=='launch/decorations/originals/'+p.artId+'/avatar-still.png' || p.pageOverlay!=='launch/decorations/originals/'+p.artId+'/page-still.png' ||
      !p.names || typeof p.names.ar!=='string' || typeof p.names.en!=='string' || !p.geometry || !['cx','cy','size'].every(k=>Number.isFinite(p.geometry[k])) ||
      p.geometry.size<.4 || p.geometry.size>.85 || !p.price || p.price.amount!==1300 || p.price.currency!=='SAR' || !/^#[\da-f]{6}$/i.test(p.accent) || !/^#[\da-f]{6}$/i.test(p.second)))return false;
    const freeForNow=catalog.freeForNow===true;
    const extra=catalog.paid.map(p=>Object.freeze({...p,free:freeForNow,price:freeForNow?null:Object.freeze({...p.price}),names:Object.freeze({...p.names}),parts:Object.freeze(['frame','page']),geometry:Object.freeze({...p.geometry}),motion:Object.freeze({...p.motion}),row:'0%',icon:'Sparkles'}));
    bundles=Object.freeze([...bundles.filter(p=>!p.productId),...extra]);
    offerIds=Object.freeze([...extra.map(p=>p.id),...catalog.freeIds]);return true;
  }
  const findBundle = id => bundles.find(pack => pack.id === id) || null;
  const isAvailable = backend => !!backend && ['demo','live'].includes(backend.mode);
  const DECORATION_KEY = isLocalLab() ? 'lorefy.user.localDecorationLab.v1' : 'lorefy.user.profileDecoration.v1';
  const normalizeDecoration = value => Object.fromEntries(['frame','page','effect'].map(key => [key,findBundle(value && value[key]) ? value[key] : null]));
  function previewParts(id, part) {
    const pack = findBundle(id);
    return Object.fromEntries(['frame','page','effect'].map(key => [key, pack && pack.parts.includes(key) && (part === 'all' || part === key) ? id : null]));
  }
  function readDecoration(storage, owner) {
    try {const record = JSON.parse(storage.getItem(DECORATION_KEY) || 'null'); return normalizeDecoration(owner && record && record.ownerId === owner ? record : null);}
    catch (_) {return normalizeDecoration(null);}
  }
  async function applyDecoration(id, part, owner) {
    if (!owner || owner !== ownerId() || !isAvailable(root.LorefyBackend)) throw new Error('LOREFY_DECORATION_ACCOUNT_CHANGED');
    if (id !== null && !findBundle(id) || !['all','frame','page','effect'].includes(part)) throw new Error('LOREFY_DECORATION_INVALID');
    if(id && ((offerIds&&!offerIds.includes(id)) || (part!=='all'&&!findBundle(id).parts.includes(part))))throw new Error('LOREFY_DECORATION_INVALID');
    if(id && findBundle(id).releaseAllowed===false && !isLocalLab() && !(betaCollectionsEnabled() && findBundle(id).betaCollection))throw new Error('LOREFY_DECORATION_LOCAL_ONLY');
    if(id && !findBundle(id).free && (!root.LorefyDecorationBilling || !await root.LorefyDecorationBilling.has(findBundle(id),owner)))throw new Error('LOREFY_DECORATION_PURCHASE_REQUIRED');
    if(owner!==ownerId())throw new Error('LOREFY_DECORATION_ACCOUNT_CHANGED');
    const next = id === null ? normalizeDecoration(null) : part === 'all' ? previewParts(id,'all') : {...readDecoration(root.localStorage,owner),[part]:id};
    root.localStorage.setItem(DECORATION_KEY,JSON.stringify({ownerId:owner,...next}));
    root.dispatchEvent(new root.CustomEvent('lorefy:decoration-change',{detail:{owner}}));
    let synced = root.LorefyBackend.mode === 'demo';
    if (!synced) {try {synced = await root.LorefyBackend.push() === true;} catch (_) {synced = false;}}
    return {local:true,synced,current:owner === ownerId(),decoration:next};
  }
  function frameGeometry(id) {
    if(findBundle(id) && findBundle(id).geometry)return findBundle(id).geometry;
    if(findBundle(id) && findBundle(id).overlay)return {cx:.5,cy:.5,size:.78};
    // Calibrated against each sprite's transparent portrait aperture, not its outer artwork.
    return {observatory:{cx:.493,cy:.463,size:.66},blossom:{cx:.523,cy:.483,size:.66},manuscript:{cx:.511,cy:.432,size:.66}}[id] || {cx:.5,cy:.5,size:.66};
  }
  function avatarSize(id,width=440) {
    const g=frameGeometry(id);return Math.min(96,(width<380?136:160)*g.size);
  }
  function validGeometry(g,min=.5){return ['cx','cy','size'].every(key=>Number.isFinite(g[key])) && g.size>=min && g.size<=.85 &&
    g.cx-g.size/2>=.02 && g.cx+g.size/2<=.98 && g.cy-g.size/2>=.02 && g.cy+g.size/2<=.98;}
  function avatarMotion(pack){return {...pack.motion,portrait:frameGeometry(pack.id)};}
  const wishlistKey = owner => 'lorefy.shop.preview.wishlist.v1:' + encodeURIComponent(owner);
  function readWishlist(storage, owner) {
    if (!owner) return [];
    try {
      const saved = JSON.parse(storage.getItem(wishlistKey(owner)) || '[]');
      return Array.isArray(saved) ? [...new Set(saved.filter(id => findBundle(id)))] : [];
    } catch (_) { return []; }
  }
  function writeWishlist(storage, owner, items) {
    if (!owner) return false;
    try { storage.setItem(wishlistKey(owner), JSON.stringify([...new Set(items.filter(id => findBundle(id)))])); return true; }
    catch (_) { return false; }
  }
  const h = (...args) => root.React.createElement(...args);
  const text = (lang, ar, en) => lang === 'en' ? en : ar;
  const icon = (name, size = 20) => root.NenIcons && root.NenIcons[name] ? h(root.NenIcons[name], {size, 'aria-hidden':true}) : null;
  const safeImage = value => /^(https?:\/\/|data:image\/(png|jpeg|webp);base64,|data:image\/svg\+xml;charset=utf-8,)/i.test(String(value || '')) ? value : '';
  const packStyle = pack => {
    const geometry = frameGeometry(pack.id);
    return {'--shop-accent':pack.accent,'--shop-second':pack.second,'--shop-row':pack.row,'--shop-frame-x':pack.row,
      '--shop-portrait-x':geometry.cx * 100 + '%','--shop-portrait-y':geometry.cy * 100 + '%','--shop-portrait-size':geometry.size * 100 + '%',
      '--shop-ring-scale':100 / geometry.size + '%','--shop-portrait-clip':pack.portraitClip?'polygon('+pack.portraitClip.map(q=>q.map(v=>(v*100).toFixed(3)+'%').join(' ')).join(',')+')':'circle(50%)',
      '--shop-portrait-radius':pack.portraitClip?'0':'50%','--shop-page-art':pack.overlay ? 'none' : 'url("../launch/shop/lorefy-page-' + pack.id + '.png")',
      '--shop-frame-image':pack.motionOverlay||pack.overlay ? 'url("../' + (pack.motionOverlay||pack.overlay) + '")' : 'url("../launch/shop/lorefy-avatar-frames.png")',
      '--shop-frame-size':pack.motionOverlay||pack.overlay ? '100% 100%' : '300% 100%'};
  };
  let lastProfile = {}, pendingRequest = null, controllerReady = false;
  function profileSnapshot() {
    const page = root.document.querySelector('.lf-profile-page:not(.lf-public-profile-page)');
    if (!page) return {...lastProfile};
    const content = selector => (page.querySelector(selector) || {}).textContent || '';
    const src = selector => { const img = page.querySelector(selector); return img ? safeImage(img.getAttribute('src')) : ''; };
    lastProfile = {
      name:content('.lf-profile-name').trim(), handle:content('.lf-profile-handle').trim(), bio:content('.lf-profile-bio').trim(),
      avatar:src('.lf-profile-avatar img'), banner:src('.lf-profile-banner > img'), layout:page.getAttribute('data-profile-layout') || 'normal'
    };
    return {...lastProfile};
  }
  function ownerId() {
    try { return root.LorefyBackend.user && root.LorefyBackend.user.id || JSON.parse(root.localStorage.getItem('lorefy.session.v1') || '{}').userId || ''; }
    catch (_) { return ''; }
  }
  function open() {
    if (!isAvailable(root.LorefyBackend) || !ownerId()) return false;
    const detail = {profile:profileSnapshot(), owner:ownerId()};
    if (controllerReady) root.dispatchEvent(new root.CustomEvent('lorefy:profile-shop-open', {detail}));
    else pendingRequest = detail;
    return true;
  }
  function Art({pack, className = '', banner}) {
    return h('div', {className:'lf-shop-art ' + className, style:banner !== undefined ? {backgroundImage:banner ? 'url(' + JSON.stringify(banner) + ')' : 'none', backgroundSize:'cover', backgroundPosition:'center'} : packStyle(pack), 'aria-hidden':true});
  }
  function Avatar({profile, pack, decorated = true, animated = true}) {
    return h('div', {className:'lf-shop-avatar', 'data-frame':decorated ? pack.id : 'none', style:packStyle(pack)},
      h('span', {className:'lf-shop-avatar-image'}, profile.avatar ? h('img', {src:profile.avatar, alt:'', decoding:'async', onError:event => {event.currentTarget.hidden = true;}}) : null,
        h('span', {className:'lf-shop-avatar-letter', 'aria-hidden':true}, (profile.name || 'Lorefy').slice(0,1))),
      decorated && h(FrameArt, {pack,kind:'avatar',className:'lf-shop-frame lf-shop-frame-art',animated}));
  }
  function FrameArt({pack,kind,className,animated=true}) {
    const ref=root.React.useRef(null);
    root.React.useEffect(()=>animated&&root.LorefyFrameMotion ? root.LorefyFrameMotion.mount(ref.current,{...(kind==='avatar'?avatarMotion(pack):pack.motion),...motionOriginal(pack)},kind) : undefined,[pack.id,kind,animated]);
    return h(kind==='avatar'?'span':'div',{ref,className,style:{...packStyle(pack),...(kind==='avatar'&&pack.overlay?{backgroundImage:'none'}:{})},
      'data-motion-page':kind==='page'&&(pack.overlay||pack.motionRenderer)?'true':undefined,'aria-hidden':true},
      kind==='avatar'&&(pack.motionOverlay||pack.overlay)&&h('img',{className:'lf-frame-overlay',src:pack.motionOverlay||pack.overlay,alt:'',loading:'lazy',decoding:'async'}));
  }
  function Effect({pack, replay}) {
    return h('div', {className:'lf-shop-effect', key:replay, 'data-effect':pack.id, 'aria-hidden':true},
      [0,1,2,3,4,5].map(index => h('span', {key:index, style:{'--i':index}}, icon(index % 2 ? pack.icon : 'Sparkles', index % 2 ? 22 : 14))));
  }
  function ProfilePreview({pack, profile, part = 'all', replay = 0, compact = false,onRetry}) {
    const parts = previewParts(pack.id, part);
    const ref=root.React.useRef(null);
    root.React.useEffect(()=>{
      const node=ref.current;if(!node)return;
      const renderer=root.LorefyOriginalRenderers?.[pack.motionRenderer||pack.renderer],id=pack.motionRenderer?pack.id:pack.artId;let alive=true,ready=!renderer?.load,failed=false;
      const update=()=>{if(!alive||!ready)return;const layout=failed?null:renderer?.layout?.(id,node.clientWidth,node.clientHeight);node.style.setProperty('--store-preview-top',((layout?.line||64)+2)+'px');node.setAttribute?.('data-preview-ready','true');if(failed)node.setAttribute?.('data-preview-failed','true');};
      update();if(renderer?.load)renderer.load(id).then(()=>{ready=true;update();}).catch(()=>{ready=true;failed=true;update();});
      const observer=root.ResizeObserver?new root.ResizeObserver(update):null;observer?.observe(node);return ()=>{alive=false;observer?.disconnect();};
    },[pack.id]);
    return h('section', {ref,className:'lf-shop-profile lf-store-profile' + (compact ? ' is-compact' : ''), style:packStyle(pack), 'data-preview-part':part,
      'aria-label':text(root.document && root.document.documentElement.lang, 'معاينة البروفايل', 'Profile preview')},
      h('div',{className:'lf-store-preview-loading',role:'status'},icon('LoaderCircle',22),text(root.document?.documentElement.lang,'جاري تحميل المعاينة','Loading preview')),
      h('div',{className:'lf-store-preview-error',role:'status'},h('span',null,text(root.document?.documentElement.lang,'تعذّر تحميل الحركة','Animation unavailable')),h('button',{type:'button',onClick:onRetry,disabled:!onRetry},text(root.document?.documentElement.lang,'إعادة المحاولة','Retry'))),
      h('div',{className:'lf-store-preview-toolbar','aria-hidden':true},icon('ChevronLeft',18),h('span',null,text(root.document?.documentElement.lang,'البروفايل','Profile')),icon('MoreHorizontal',18)),
      h(Art, {pack, className:'lf-shop-profile-banner', banner:profile.banner || ''}),
      parts.page && h(FrameArt,{pack,kind:'page',className:'lf-decoration-page-border is-preview'}),
      parts.effect && h(Effect, {pack, replay}),
      h('div', {className:'lf-shop-profile-identity'}, h(Avatar, {profile, pack, decorated:!!parts.frame}),
        h('h2', {dir:'auto'}, profile.name || 'Lorefy'), h('p', {dir:'ltr'}, profile.handle || '@lorefy'),
        !compact && profile.bio && h('p', {className:'lf-shop-profile-bio', dir:'auto'}, profile.bio)));
  }
  function Catalog({lang, profile, wishlist, onSelect, onWishlist, onlyWishlist=false,view='collections',owned=[],equipped={},catalogState,onCatalogState,onBrowse}) {
    const [local,setLocal]=root.React.useState({collection:'all',query:'',sort:'newest',freeOnly:false});
    const filters=catalogState||local,set=patch=>(onCatalogState||setLocal)({...filters,...patch});
    const currentView=onlyWishlist?'saved':view,offers=offeredBundles();
    const shown=filterCatalog({...filters,view:currentView,wishlist,owned,lang});
    const families=[['all','الكل','All'],['elven','الإلف','Elven'],['atelier','المشغل','Atelier'],['classic','الكلاسيكيات','Classics']].filter(([key])=>key==='all'||offers.some(p=>collectionKey(p)===key));
    const newPacks=offers.filter(p=>p.renderer==='elven').slice(0,3),equippedIds=[...new Set(Object.values(equipped).filter(Boolean))];
    const canReset=!!(filters.query||filters.collection!=='all'||filters.freeOnly)&&!(currentView==='saved'&&!offers.some(p=>wishlist.includes(p.id)));
    return h('div',{className:'lf-shop-catalog'},
      h('div',{className:'lf-store-search'},icon('Search',19),h('input',{type:'search',value:filters.query,'aria-label':text(lang,'ابحث عن حزمة','Search collections'),placeholder:text(lang,'ابحث عن حزمة','Search collections'),onChange:e=>set({query:e.target.value})}),
        filters.query&&h('button',{type:'button',onClick:()=>set({query:''}),'aria-label':text(lang,'مسح البحث','Clear search'),title:text(lang,'مسح البحث','Clear search')},icon('X',17))),
      h('div',{className:'lf-store-families',role:'group','aria-label':text(lang,'مجموعات الزينة','Decoration collections')},families.map(([key,ar,en])=>h('button',{key,type:'button','aria-pressed':filters.collection===key,onClick:()=>set({collection:key})},text(lang,ar,en)))),
      currentView==='owned'&&equippedIds.length>0&&h('section',{className:'lf-store-equipped'},h('h2',null,text(lang,'مظهرك الحالي','Currently equipped')),h('div',null,equippedIds.map(id=>{const p=findBundle(id);return p&&h('button',{key:id,type:'button',onClick:()=>onSelect(id)},h(Avatar,{profile,pack:p,animated:false}),h('span',null,p.names[lang]),icon('Check',16));}))),
      currentView==='collections'&&!filters.query&&filters.collection==='all'&&newPacks.length>0&&h('section',{className:'lf-store-arrivals'},
        h('header',null,h('div',null,h('span',null,text(lang,'وصل حديثًا','NEW ARRIVALS')),h('h2',null,text(lang,'إلف لورفاي','Lorefy Elven'))),h('button',{type:'button',onClick:()=>set({collection:'elven'})},text(lang,'عرض الكل','See all'),icon(lang==='en'?'ChevronRight':'ChevronLeft',17))),
        h('div',{className:'lf-store-arrival-art'},newPacks.map(p=>h('button',{key:p.id,type:'button',style:packStyle(p),onClick:()=>onSelect(p.id),'aria-label':text(lang,'معاينة ','Preview ')+p.names[lang]},h(Avatar,{profile,pack:p,animated:false}),h('span',null,p.names[lang]))))),
      h('header',{className:'lf-store-results'},h('div',null,h('h2',null,text(lang,currentView==='saved'?'المحفوظات':currentView==='owned'?'مجموعتي':'كل الحزم',currentView==='saved'?'Saved':currentView==='owned'?'My collection':'All collections')),h('span',{role:'status'},new Intl.NumberFormat(lang).format(shown.length),' ',text(lang,'حزمة','collections'))),
        h('select',{value:filters.sort,'aria-label':text(lang,'ترتيب الحزم','Sort collections'),onChange:e=>set({sort:e.target.value})},h('option',{value:'newest'},text(lang,'الأحدث','Newest')),h('option',{value:'name'},text(lang,'الاسم','Name')))),
      h('label',{className:'lf-store-free-filter'},h('input',{type:'checkbox',checked:filters.freeOnly,onChange:e=>set({freeOnly:e.target.checked})}),text(lang,'المجانية فقط','Free only')),
      h('div',{className:'lf-shop-products'},shown.map(pack=>h('article',{className:'lf-shop-product',key:pack.id,style:packStyle(pack),'data-store-pack':pack.id},
        h('button',{className:'lf-store-product-open',type:'button','data-store-open':pack.id,'aria-label':text(lang,'معاينة ','Preview ')+pack.names[lang],onClick:()=>onSelect(pack.id)},
          h('span',{className:'lf-shop-product-preview'},h(Avatar,{profile,pack,animated:false}),h('span',{className:'lf-store-product-badge'},text(lang,pack.motionRenderer==='restored'?'مُحدّث':collectionKey(pack)!=='classic'?'جديد':'كلاسيكي',pack.motionRenderer==='restored'?'Updated':collectionKey(pack)!=='classic'?'New':'Classic'))),
          h('span',{className:'lf-shop-product-copy'},h('span',{className:'lf-store-product-family'},pack.collection[lang]),h('strong',null,pack.names[lang]),h('span',{className:'lf-store-product-meta'},h('span',null,priceLabel(pack,lang)),h('span',null,icon(Object.values(equipped).includes(pack.id)?'Check':'Sparkles',14),text(lang,Object.values(equipped).includes(pack.id)?'مستخدمة':'متحركة',Object.values(equipped).includes(pack.id)?'Equipped':'Animated'))))),
        h('button',{type:'button',className:'lf-shop-wishlist','aria-pressed':wishlist.includes(pack.id),'aria-label':text(lang,'حفظ في المفضلة: ','Wishlist: ')+pack.names[lang],title:text(lang,'المحفوظات','Saved'),onClick:()=>onWishlist(pack.id)},icon('Bookmark',18))))),
      !shown.length&&h('div',{className:'lf-shop-empty',role:'status'},icon(currentView==='saved'?'Bookmark':'Search',28),h('h3',null,text(lang,currentView==='saved'?'لا توجد محفوظات هنا':'لا توجد نتائج',currentView==='saved'?'No saved collections here':'No results')),h('button',{type:'button',onClick:()=>canReset?set({collection:'all',query:'',freeOnly:false}):onBrowse?.()},text(lang,canReset?'إعادة ضبط الفلاتر':'استكشاف الحزم',canReset?'Reset filters':'Explore collections'))));
  }
  function priceLabel(pack,lang){return pack.free?text(lang,'مجانية','Free'):text(lang,'13 ر.س','SAR 13');}
  function Entry({language}) {
    if (!isAvailable(root.LorefyBackend)) return null;
    return h('button', {className:'lf-interface-entry lf-shop-settings-entry', type:'button', onClick:open, 'aria-haspopup':'dialog'},
      icon('Sparkles',20), h('span',null,h('strong',null,text(language,'زينة البروفايل','Profile decorations')),h('small',null,text(language,'حزم مجانية وحصرية','Free & exclusive collections'))),
      icon(language === 'en' ? 'ChevronRight' : 'ChevronLeft',18));
  }
  function Shop() {
    const R = root.React;
    const [request, setRequest] = R.useState(null);
    const [,refreshCatalog] = R.useState(0);
    const [selection, setSelection] = R.useState(null);
    const [part, setPart] = R.useState('all');
    const [tab, setTab] = R.useState('collections');
    const [wishlist, setWishlist] = R.useState([]);
    const [replay, setReplay] = R.useState(0);
    const [error, setError] = R.useState('');
    const [saving,setSaving] = R.useState(false);
    const [status,setStatus] = R.useState('');
    const [equipped,setEquipped] = R.useState(normalizeDecoration(null));
    const [owned,setOwned]=R.useState([]),[storePrices,setStorePrices]=R.useState({});
    const [catalogState,setCatalogState]=R.useState({collection:'all',query:'',sort:'newest',freeOnly:false});
    const lastProduct=R.useRef(null);
    const browseScroll=R.useRef(0);
    const host = R.useRef(null), closeButton = R.useRef(null), previous = R.useRef(null), body = R.useRef(null);
    const lang = root.document.documentElement.lang === 'en' ? 'en' : 'ar';
    R.useEffect(() => {
      let active = true;
      const show = event => {
        if (!isAvailable(root.LorefyBackend) || event.detail.owner !== ownerId()) return;
        previous.current = root.document.activeElement;
        setRequest(event.detail); setSelection(null); setPart('all'); setTab('collections'); setError('');
        setCatalogState({collection:'all',query:'',sort:'newest',freeOnly:false});lastProduct.current=null;browseScroll.current=0;
        setWishlist(readWishlist(root.sessionStorage, event.detail.owner));
        setEquipped(readDecoration(root.localStorage,event.detail.owner));setSaving(false);setStatus('');
        setOwned([]);setStorePrices({});
        if(hasPaidOffers() && root.LorefyDecorationBilling && root.LorefyBackend.mode==='live'){
          root.LorefyDecorationBilling.owned(event.detail.owner).then(rows=>{if(active&&ownerId()===event.detail.owner)setOwned(rows);}).catch(()=>{});
          root.LorefyDecorationBilling.availability(event.detail.owner).then(rows=>{if(active&&ownerId()===event.detail.owner)setStorePrices(Object.fromEntries(rows.map(r=>[r.id,r.displayPrice])));}).catch(()=>{});
        }
      };
      root.addEventListener('lorefy:profile-shop-open', show);
      const catalogChanged = () => refreshCatalog(n => n + 1);
      root.addEventListener('lorefy:profile-shop-catalog-ready', catalogChanged);
      if (root.LorefyBackend && root.LorefyBackend.onAuth) root.LorefyBackend.onAuth(() => {
        if (active) setRequest(current => current && (current.owner !== ownerId() || !isAvailable(root.LorefyBackend)) ? null : current);
      });
      controllerReady = true;
      if (pendingRequest) {const detail = pendingRequest; pendingRequest = null; show({detail});}
      return () => {active = false; controllerReady = false; root.removeEventListener('lorefy:profile-shop-open', show); root.removeEventListener('lorefy:profile-shop-catalog-ready', catalogChanged);};
    }, []);
    R.useEffect(() => {
      if (!request || !host.current) return;
      const overlay = host.current.parentElement;
      const background = Array.from(overlay.parentElement.children).filter(node => node !== overlay).map(node => {
        const saved = {node, inert:node.inert}; node.inert = true; return saved;
      });
      closeButton.current.focus();
      function keyboard(event) {
        if (event.key === 'Escape') { event.preventDefault(); setRequest(null); }
        if (event.key !== 'Tab') return;
        const controls = Array.from(host.current.querySelectorAll('button,a,input,select,[tabindex="0"]')).filter(node => !node.disabled && node.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && root.document.activeElement === first) {event.preventDefault(); last.focus();}
        else if (!event.shiftKey && root.document.activeElement === last) {event.preventDefault(); first.focus();}
      }
      root.document.addEventListener('keydown', keyboard);
      return () => {
        root.document.removeEventListener('keydown', keyboard);
        background.forEach(saved => {saved.node.inert = saved.inert;});
        const previous = previousFocus(); if (previous && previous.isConnected) previous.focus();
      };
      function previousFocus() { return previous.current; }
    }, [request]);
    R.useEffect(() => {
      if (body.current) body.current.scrollTop = selection?0:browseScroll.current||0;
    }, [request, selection, tab]);
    R.useEffect(()=>{
      if(!request)return;
      if(selection)closeButton.current?.focus();
      else if(lastProduct.current)host.current?.querySelector('[data-store-open="'+lastProduct.current+'"]')?.focus({preventScroll:true});
    },[selection]);
    R.useEffect(() => {
      if (!request || !hasPaidOffers() || !root.LorefyDecorationBilling || !root.LorefyDecorationBilling.watch || root.LorefyBackend.mode!=='live') return;
      return root.LorefyDecorationBilling.watch(request.owner, rows => {if(ownerId()===request.owner)setOwned(rows);});
    }, [request]);
    if (!request) return null;
    const pack = findBundle(selection), selected = id => {browseScroll.current=body.current?.scrollTop||0;lastProduct.current=id;setSelection(id); setPart('all'); setReplay(value => value + 1); setError('');setStatus('');};
    const purchased=pack && (pack.free || owned.includes(pack.productId));
    async function purchase(restore=false){
      if(saving)return;setSaving(true);setError('');setStatus('');
      try{
        if(!root.LorefyDecorationBilling || root.LorefyBackend.mode!=='live')throw Object.assign(new Error('demo'),{code:'LOREFY_PURCHASE_IOS_REQUIRED'});
        const rows=await (restore?root.LorefyDecorationBilling.restore(request.owner):root.LorefyDecorationBilling.buy(pack,request.owner));
        if(ownerId()!==request.owner){setRequest(null);return;}setOwned(rows);
        setStatus(text(lang,restore?'تم التحقق من مشترياتك':'تم الشراء. يمكنك الآن تطبيق الإطارين.',restore?'Purchases checked':'Purchased. You can now apply both frames.'));
      }catch(e){
        const messages={LOREFY_PURCHASE_CANCELLED:['أُلغيت عملية الشراء','Purchase cancelled'],LOREFY_PURCHASE_PENDING:['الشراء ينتظر الموافقة. تظهر الحزمة بعد اكتمال التحقق.','Purchase awaiting approval. Restore after approval.'],LOREFY_PURCHASE_IOS_REQUIRED:['الشراء متاح داخل تطبيق iOS؛ يمكنك معاينة الحزمة هنا.','Purchase in the iOS app. Preview this collection here.'],LOREFY_PURCHASE_SETUP_REQUIRED:['الشراء غير متاح بعد. حاول لاحقًا.','Purchases are not available yet. Please try later.'],LOREFY_PURCHASE_PRODUCT_UNAVAILABLE:['هذه الحزمة غير متاحة للشراء حاليًا.','This collection is not available for purchase yet.']};
        const m=messages[e.code]||['تعذر تأكيد الشراء. جرّب استعادة المشتريات أو حاول لاحقًا.','Could not verify purchase. Try restoring purchases or try later.'];setError(text(lang,...m));
      }finally{setSaving(false);}
    }
    async function apply(id, component) {
      if (saving) return;
      setSaving(true);setError('');setStatus('');
      try {
        const result = await applyDecoration(id,component,request.owner);
        if (!result.current) {setRequest(null);return;}
        setEquipped(result.decoration);
        setStatus(result.synced ? text(lang,id ? 'تم تطبيق الزينة' : 'تمت إزالة الزينة',id ? 'Decorations applied' : 'Decorations removed') :
          text(lang,'حُفظت على هذا الجهاز؛ لم تكتمل المزامنة بعد.','Saved on this device; cloud sync is pending.'));
      } catch (_) {setError(text(lang,'تعذر حفظ الزينة. تأكد من حسابك وحاول مجددًا.','Could not save decorations. Check your account and try again.'));}
      finally {setSaving(false);}
    }
    const isEquipped = pack && (part === 'all' ? pack.parts.every(key => equipped[key] === pack.id) : equipped[part] === pack.id);
    function toggleWishlist(id) {
      const next = wishlist.includes(id) ? wishlist.filter(value => value !== id) : wishlist.concat(id);
      if (!writeWishlist(root.sessionStorage, request.owner, next)) return setError(text(lang,'تعذر حفظ المفضلة في هذه الجلسة.','Could not save the wishlist in this session.'));
      setWishlist(next); setError('');
    }
    const content = h('div', {className:'lf-shop-overlay', 'data-no-translate':'1', dir:lang === 'en' ? 'ltr' : 'rtl'},
      h('section', {className:'lf-shop-dialog lf-store-v2', role:'dialog', 'aria-modal':true, 'aria-labelledby':'lf-shop-title', ref:host,'data-store-screen':pack?'detail':'catalog'},
        h('header', {className:'lf-shop-header'},
          h('button', {type:'button', className:'lf-shop-icon-button', ref:closeButton, onClick:() => pack ? setSelection(null) : setRequest(null),
            'aria-label':text(lang,pack ? 'رجوع إلى الحزم' : 'إغلاق المتجر',pack ? 'Back to collections' : 'Close shop'), title:text(lang,pack?'رجوع':'إغلاق',pack?'Back':'Close')}, icon(pack?(lang === 'en' ? 'ChevronLeft' : 'ChevronRight'):'X',22)),
          h('div', {className:'lf-shop-brand'},h('span',{className:'lf-shop-brand-mark'},icon('Feather',13),'LOREFY'),
            h('h1', {id:'lf-shop-title'},text(lang,pack?'معاينة الحزمة':'متجر الزينة',pack?'Collection preview':'Decoration Store'))),
          h('button', {type:'button', className:'lf-shop-icon-button', onClick:() => pack?setRequest(null):setTab('saved'), 'aria-label':text(lang,pack?'إنهاء المعاينة':'المحفوظات',pack?'End preview':'Saved collections'), title:text(lang,pack?'إنهاء المعاينة':'المحفوظات',pack?'End preview':'Saved collections')}, icon(pack?'X':'Bookmark',20))),
        h('div', {className:'lf-shop-body', ref:body}, pack ? h(R.Fragment,null,
          h('div',{className:'lf-shop-preview-stage',style:packStyle(pack)},
            h('span',{className:'lf-shop-preview-caption'},icon('Eye',15),text(lang,'معاينة على بروفايلك','Your profile preview')),
            h(ProfilePreview, {key:pack.id+':'+replay,pack, profile:request.profile, part, replay,onRetry:()=>setReplay(value=>value+1)})),
          h('div', {className:'lf-shop-detail'},
            h('div', {className:'lf-shop-detail-title'}, h('div',null,h('h2',null,pack.names[lang]),h('p',null,pack.collection[lang])),
              h('button',{className:'lf-shop-icon-button',type:'button',onClick:() => toggleWishlist(pack.id),'aria-pressed':wishlist.includes(pack.id),
                'aria-label':text(lang,'حفظ في المفضلة: ','Wishlist: ') + pack.names[lang]},icon('Bookmark',20))),
            h('div', {className:'lf-shop-parts',role:'group','aria-label':text(lang,'أجزاء الحزمة','Bundle components')},
              [['all','Layers','الحزمة','Bundle'],['frame','CircleUserRound','إطار الصورة','Avatar frame'],['page','PanelTop','إطار الصفحة','Profile frame'],['effect','Sparkles','التأثير','Effect']].filter(([value])=>value==='all'||pack.parts.includes(value)).map(([value,symbol,ar,en]) =>
                h('button',{key:value,type:'button','aria-pressed':part === value,onClick:() => {setPart(value); setReplay(count => count + 1);setStatus('');setError('');}},icon(symbol,20),h('span',null,text(lang,ar,en))))),
            h('div', {className:'lf-shop-includes'}, icon('Package',18), h('span',null,pack.parts.length===3?text(lang,'ثلاث قطع. حكاية واحدة.','Three pieces. One story.'):text(lang,'إطار صورة وإطار صفحة متحركان','Animated avatar + profile frames'))),
            pack.parts.includes('effect')&&h('button',{className:'lf-shop-replay',type:'button',onClick:() => setReplay(value => value + 1)},icon('RotateCcw',17),text(lang,'إعادة المعاينة','Replay preview')))) :
          h(R.Fragment,null,
            h('div', {className:'lf-shop-tabs',role:'group','aria-label':text(lang,'عرض المتجر','Shop view')},
              [['collections','المتجر','Store'],['owned','مجموعتي','My collection'],['saved','المحفوظات','Saved']].map(([value,ar,en]) => h('button',{key:value,type:'button','aria-pressed':tab === value,onClick:() => {browseScroll.current=0;setTab(value);}},text(lang,ar,en),value === 'saved' && wishlist.length>0 && h('span',null,wishlist.length)))),
            h(Catalog, {lang, profile:request.profile, wishlist, onSelect:selected, onWishlist:toggleWishlist,view:tab,owned,equipped,catalogState,onCatalogState:setCatalogState,onBrowse:()=>{browseScroll.current=0;setCatalogState({collection:'all',query:'',sort:'newest',freeOnly:false});setTab('collections');}})),
          hasPaidOffers() && h('button',{type:'button',className:'lf-shop-replay',disabled:saving,onClick:()=>purchase(true)},icon('RotateCcw',17),text(lang,'استعادة المشتريات','Restore purchases')),
          error && h('p',{className:'lf-shop-error',role:'alert'},error),status && h('p',{className:'lf-shop-status',role:'status'},status)),
        pack && h('footer', {className:'lf-shop-footer'},h('div',{className:'lf-shop-order-summary'},
          h('div',null,h('strong',null,text(lang,part==='all'?'الحزمة الكاملة':'القطعة المختارة',part==='all'?'Complete collection':'Selected component')),
            h('small',null,pack.free?text(lang,'مجانية حاليًا','Free for now'):text(lang,'شراء مرة واحدة · الإطاران معًا','One-time purchase · Both frames'))),h('span',null,pack.free?priceLabel(pack,lang):storePrices[pack.productId]||priceLabel(pack,lang))),
          pack && h('button',{type:'button',className:'lf-shop-apply',disabled:saving || (purchased&&isEquipped),onClick:() => purchased?apply(pack.id,part):purchase()},
          icon(isEquipped&&purchased ? 'Check' : purchased?'CheckCheck':'ShoppingBag',17),saving ? text(lang,'جارٍ التأكيد','Confirming') : !purchased ? text(lang,'شراء الحزمة · ','Buy collection · ')+(storePrices[pack.productId]||priceLabel(pack,lang)) : isEquipped ? text(lang,'مطبّقة','Applied') : text(lang,part === 'all' ? (pack.free?'تطبيق الحزمة مجانًا':'تطبيق الحزمة') : 'تطبيق هذا الجزء','Apply ' + (part === 'all' ? (pack.free?'bundle for free':'collection') : 'this component'))),
          Object.values(equipped).some(Boolean) && h('button',{type:'button',className:'lf-shop-remove',disabled:saving,onClick:() => apply(null,'all')},icon('Eraser',17),text(lang,'إزالة الزينة','Remove decorations')),
          !pack && !Object.values(equipped).some(Boolean) && h('span',null,icon('Sparkles',16),text(lang,'مجانية للجميع','Free for everyone')))));
    return root.ReactDOM.createPortal(content, root.document.querySelector('.lf-app'));
  }
  function start() {
    const boot = async () => {
      offerIds=Object.freeze([]);
      // Opening the page must not depend on either catalog request settling.
      const host = root.document.createElement('div'); host.className = 'lf-shop-controller'; root.document.body.appendChild(host);
      root.ReactDOM.createRoot(host).render(h(Shop));
      if((isLocalLab() || betaCollectionsEnabled()) && root.fetch) {
        try {
          const beta=betaCollectionsEnabled();
          const response=await root.fetch(beta ? 'launch/decorations/pfpvibes/collections.json' : 'qa/frame-lab/collections.json');
          if(response.ok)(beta ? installBetaCollections : installLocalCollections)(await response.json());
        } catch (_) { /* Original collections remain available if the manifest is missing. */ }
      }
      if(root.fetch){try{const r=await root.fetch('launch/decorations/originals/catalog.json');if(r.ok)installShopCatalog(await r.json());}catch(_) { /* Purchase catalog fails closed; existing appearance remains. */ }}
      if(isLocalLab()&&root.fetch){try{const r=await root.fetch('qa/motion-atelier/collections.json');if(r.ok)installAtelierCollections(await r.json());}catch(_) { /* Local artwork never changes the live catalog. */ }}
      if(isLocalLab()&&root.fetch){try{const r=await root.fetch('qa/elf-motion/collections.json');if(r.ok)installElvenCollections(await r.json());}catch(_) { /* Elf artwork is confined to the local demo. */ }}
      if(root.fetch){try{const r=await root.fetch('launch/decorations/refined/manifest.json');if(r.ok)installRestoration(await r.json());}catch(_){ /* Original rendering remains available if calibration cannot load. */ }}
      root.dispatchEvent(new root.CustomEvent('lorefy:profile-shop-catalog-ready'));
      let scheduled = false;
      function styleNode(node,pack) {Object.entries(packStyle(pack)).forEach(([key,value]) => node.style.setProperty(key,value));}
      function decorate(page,value) {
        const choice = normalizeDecoration(value), signature = JSON.stringify(choice);
        const avatar = page.querySelector('.lf-profile-avatar,.lf-reader-avatar');
        if (avatar) {
          const pack = findBundle(choice.frame);
          page.classList.toggle('has-atelier-avatar',articulated(pack));
          let ring = avatar.querySelector('.lf-decoration-avatar-frame');
          if (pack) {
            if (!ring) {ring = root.document.createElement('span');ring.className = 'lf-decoration-avatar-frame lf-shop-frame-art';ring.setAttribute('aria-hidden','true');avatar.appendChild(ring);}
            styleNode(ring,pack);avatar.classList.add('has-decoration');
            const geometry=frameGeometry(pack.id);
            avatar.classList.toggle('has-elven-portrait',pack.renderer==='elven');
            avatar.classList.toggle('has-refined-portrait',pack.motionRenderer==='restored');
            avatar.classList.add('has-calibrated-portrait');
            avatar.style.setProperty('--elven-portrait-clip',packStyle(pack)['--shop-portrait-clip']);
            avatar.style.setProperty('--profile-decoration-avatar-size',avatarSize(pack.id,page.clientWidth)+'px');
            const overhang=ring.offsetWidth*(pack.portraitClip?Math.max(geometry.cx,1-geometry.cx):1-geometry.cx)-avatar.clientWidth/2;
            avatar.style.setProperty('--profile-avatar-frame-inset',Math.max(40,Math.ceil(overhang+(pack.portraitClip?24:14)))+'px');
            if(articulated(pack)){
              avatar.style.setProperty('--atelier-avatar-bottom-gap',Math.max(12,Math.ceil(ring.getBoundingClientRect().bottom-avatar.getBoundingClientRect().bottom+18))+'px');
              const header=page.querySelector('.lf-profile-banner,.lf-reader-banner');
              if(header)page.style.setProperty('--atelier-owner-identity-inset',Math.max(18,Math.ceil(ring.getBoundingClientRect().bottom-header.getBoundingClientRect().bottom+18))+'px');
              const identity=page.querySelector('.lf-profile-identity,.lf-reader-identity');
              if(identity){
                page.style.setProperty('--atelier-identity-space',Math.ceil(ring.getBoundingClientRect().width+14)+'px');
                page.style.setProperty('--atelier-stacked-identity',Math.max(12,Math.ceil(ring.getBoundingClientRect().bottom-identity.getBoundingClientRect().top+16))+'px');
              }
            }else{avatar.style.removeProperty('--atelier-avatar-bottom-gap');page.style.removeProperty('--atelier-owner-identity-inset');}
            const bio=page.querySelector('.lf-profile-bio,.lf-reader-bio');
            if(bio&&articulated(pack)&&page.dataset.profileLayout==='reader'){
              const baseline=bio.getBoundingClientRect().top-parseFloat(root.getComputedStyle(bio).marginTop||0);
              page.style.setProperty('--atelier-reader-bio-gap',Math.max(12,Math.ceil(ring.getBoundingClientRect().bottom-baseline+12))+'px');
            }else page.style.removeProperty('--atelier-reader-bio-gap');
            if(bio && page.dataset.profileLayout==='immersive'){
              const baseline=bio.getBoundingClientRect().top-parseFloat(root.getComputedStyle(bio).marginTop||0);
              page.style.setProperty('--profile-frame-bio-gap',Math.max(24,Math.ceil(ring.getBoundingClientRect().bottom-baseline+8))+'px');
            } else page.style.removeProperty('--profile-frame-bio-gap');
            if(root.LorefyFrameMotion)root.LorefyFrameMotion.mount(ring,{...avatarMotion(pack),...motionOriginal(pack)},'avatar');
          } else {if (ring) ring.remove();avatar.classList.remove('has-decoration','has-elven-portrait','has-refined-portrait','has-calibrated-portrait');avatar.style.removeProperty('--elven-portrait-clip');avatar.style.removeProperty('--profile-avatar-frame-inset');avatar.style.removeProperty('--profile-decoration-avatar-size');page.style.removeProperty('--profile-frame-bio-gap');}
        }
        let pin = page.querySelector(':scope > .lf-decoration-page-pin');
        const pagePack = findBundle(choice.page);
        page.classList.toggle('has-elven-page',!!pagePack&&pagePack.renderer==='elven');
        page.classList.toggle('has-refined-page',!!pagePack&&pagePack.motionRenderer==='restored');
        page.classList.toggle('has-page-decoration',!!pagePack);
        page.classList.toggle('has-original-page-decoration',!!(pagePack&&(pagePack.renderer||pagePack.motionRenderer)));
        if (pagePack) {
          if (!pin) {
            pin = root.document.createElement('div');pin.className = 'lf-decoration-page-pin';pin.setAttribute('aria-hidden','true');
            const border = root.document.createElement('div');border.className = 'lf-decoration-page-border';pin.appendChild(border);page.prepend(pin);
          }
          styleNode(pin.firstElementChild,pagePack);
          pin.firstElementChild.style.setProperty('--decoration-height',page.clientHeight + 'px');
          if(pagePack.overlay||pagePack.motionRenderer)pin.firstElementChild.setAttribute('data-motion-page','true');else pin.firstElementChild.removeAttribute('data-motion-page');
          if(root.LorefyFrameMotion)root.LorefyFrameMotion.mount(pin.firstElementChild,{...pagePack.motion,...motionOriginal(pagePack)},'page');
        } else if (pin) pin.remove();
        const banner = page.querySelector('.lf-profile-banner,.lf-reader-banner');
        if (banner) {
          const old = banner.querySelector('.lf-decoration-effect');
          if (!choice.effect) {if (old) old.remove();}
          else if (!old || old.getAttribute('data-effect') !== choice.effect) {
            if (old) old.remove();
            const effect = root.document.createElement('span'),effectPack = findBundle(choice.effect);
            effect.className = 'lf-decoration-effect lf-shop-effect';effect.setAttribute('aria-hidden','true');effect.setAttribute('data-effect',choice.effect);styleNode(effect,effectPack);
            for (let i = 0;i < 6;i++) {
              const particle = root.document.createElement('span'),glyph = root.document.createElement('i');particle.style.setProperty('--i',i);
              glyph.setAttribute('data-lucide',i % 2 ? ({observatory:'moon',blossom:'flower-2',manuscript:'feather'}[choice.effect] || 'sparkles') : 'sparkles');particle.appendChild(glyph);effect.appendChild(particle);
            }
            banner.appendChild(effect);if (root.lucide) root.lucide.createIcons({nodes:[effect]});
          }
        }
        if (page.getAttribute('data-decoration-rendered') !== signature) page.setAttribute('data-decoration-rendered',signature);
      }
      function mount() {
        if(root.LorefyFrameMotion)root.LorefyFrameMotion.sweep();
        root.document.querySelectorAll('.lf-public-profile-page').forEach(page => {
          let choice;try {choice = JSON.parse(page.getAttribute('data-profile-decoration') || '{}');} catch (_) {}
          decorate(page,choice);
        });
        const page = root.document.querySelector('.lf-profile-page:not(.lf-public-profile-page)');
        if (!page) return;
        decorate(page,readDecoration(root.localStorage,ownerId()));
        if (!isAvailable(root.LorefyBackend)) return;
        profileSnapshot();
        const settings = page.querySelector('button[aria-label="الإعدادات"],button[aria-label="Settings"]');
        if (!settings) return;
        let button = settings.parentElement.querySelector('.lf-shop-shortcut');
        if (!button) {
          button = root.document.createElement('button'); button.type = 'button'; button.className = 'lf-shop-shortcut';
          button.setAttribute('aria-haspopup','dialog'); button.addEventListener('click',open);
          const glyph = root.document.createElement('i'); glyph.setAttribute('data-lucide','sparkles'); glyph.setAttribute('aria-hidden','true'); button.appendChild(glyph);
          settings.parentElement.appendChild(button);
          if (root.lucide) root.lucide.createIcons({nodes:[button]});
        }
        const label = text(root.document.documentElement.lang,'زينة البروفايل','Profile decorations');
        if (button.getAttribute('aria-label') !== label) {button.setAttribute('aria-label',label); button.title = label;}
      }
      const observer = new root.MutationObserver(() => {
        if (scheduled) return; scheduled = true;
        root.requestAnimationFrame(() => {scheduled = false; mount();});
      });
      observer.observe(root.document.getElementById('root') || root.document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-profile-decoration']});
      root.addEventListener('lorefy:decoration-change',mount);root.addEventListener('storage',mount);root.addEventListener('resize',mount);
      if (root.LorefyBackend && root.LorefyBackend.onAuth) root.LorefyBackend.onAuth(mount);
      mount();
    };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  }
  return Object.freeze({get bundles(){return bundles;},get offered(){return offeredBundles();},collectionKey,filterCatalog,installShopCatalog,installRestoration,installAtelierCollections,installElvenCollections,installLocalCollections,installBetaCollections,isLocalLab,findBundle,isAvailable,DECORATION_KEY,normalizeDecoration,readDecoration,applyDecoration,frameGeometry,avatarSize,previewParts,readWishlist,writeWishlist,Catalog,ProfilePreview,Entry,Shop,open,start});
});

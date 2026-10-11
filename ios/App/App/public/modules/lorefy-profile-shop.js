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
  function validGeometry(g){return ['cx','cy','size'].every(key=>Number.isFinite(g[key])) && g.size>=.5 && g.size<=.85 &&
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
      '--shop-ring-scale':100 / geometry.size + '%','--shop-page-art':pack.overlay ? 'none' : 'url("../launch/shop/lorefy-page-' + pack.id + '.png")',
      '--shop-frame-image':pack.overlay ? 'url("../' + pack.overlay + '")' : 'url("../launch/shop/lorefy-avatar-frames.png")',
      '--shop-frame-size':pack.overlay ? '100% 100%' : '300% 100%'};
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
  function Avatar({profile, pack, decorated = true}) {
    return h('div', {className:'lf-shop-avatar', 'data-frame':decorated ? pack.id : 'none', style:packStyle(pack)},
      h('span', {className:'lf-shop-avatar-image'}, profile.avatar ? h('img', {src:profile.avatar, alt:'', decoding:'async', onError:event => {event.currentTarget.hidden = true;}}) : null,
        h('span', {className:'lf-shop-avatar-letter', 'aria-hidden':true}, (profile.name || 'Lorefy').slice(0,1))),
      decorated && h(FrameArt, {pack,kind:'avatar',className:'lf-shop-frame lf-shop-frame-art'}));
  }
  function FrameArt({pack,kind,className}) {
    const ref=root.React.useRef(null);
    root.React.useEffect(()=>root.LorefyFrameMotion ? root.LorefyFrameMotion.mount(ref.current,{...(kind==='avatar'?avatarMotion(pack):pack.motion),...(pack.renderer?{original:{id:pack.artId,renderer:pack.renderer}}:{})},kind) : undefined,[pack.id,kind]);
    return h(kind==='avatar'?'span':'div',{ref,className,style:{...packStyle(pack),...(kind==='avatar'&&pack.overlay?{backgroundImage:'none'}:{})},
      'data-motion-page':kind==='page'&&pack.overlay?'true':undefined,'aria-hidden':true},
      kind==='avatar'&&pack.overlay&&h('img',{className:'lf-frame-overlay',src:pack.overlay,alt:'',loading:'lazy',decoding:'async'}));
  }
  function Effect({pack, replay}) {
    return h('div', {className:'lf-shop-effect', key:replay, 'data-effect':pack.id, 'aria-hidden':true},
      [0,1,2,3,4,5].map(index => h('span', {key:index, style:{'--i':index}}, icon(index % 2 ? pack.icon : 'Sparkles', index % 2 ? 22 : 14))));
  }
  function ProfilePreview({pack, profile, part = 'all', replay = 0, compact = false}) {
    const parts = previewParts(pack.id, part);
    return h('section', {className:'lf-shop-profile' + (compact ? ' is-compact' : ''), style:packStyle(pack), 'data-preview-part':part,
      'aria-label':text(root.document && root.document.documentElement.lang, 'معاينة البروفايل', 'Profile preview')},
      h(Art, {pack, className:'lf-shop-profile-banner', banner:profile.banner || ''}),
      parts.page && h(FrameArt,{pack,kind:'page',className:'lf-decoration-page-border is-preview'}),
      parts.effect && h(Effect, {pack, replay}),
      h('div', {className:'lf-shop-profile-identity'}, h(Avatar, {profile, pack, decorated:!!parts.frame}),
        h('h2', {dir:'auto'}, profile.name || 'Lorefy'), h('p', {dir:'ltr'}, profile.handle || '@lorefy'),
        !compact && profile.bio && h('p', {className:'lf-shop-profile-bio', dir:'auto'}, profile.bio)));
  }
  function Catalog({lang, profile, wishlist, onSelect, onWishlist, onlyWishlist = false}) {
    const [mood, setMood] = root.React.useState('all');
    const moods = [['all','كل الأجواء','All moods'],['dream','حالم','Dreamy'],['bloom','طبيعة','Nature'],['mystery','غامض','Mystic']];
    const moodOf = pack => ['flower','leaf','heart','bubble'].includes(pack.motion.motif) ? 'bloom' : ['ghost','rune'].includes(pack.motion.motif) ? 'mystery' : 'dream';
    const offers=offeredBundles();
    const saved = onlyWishlist ? offers.filter(pack => wishlist.includes(pack.id)) : offers;
    const shown = saved.filter(pack => mood === 'all' || moodOf(pack) === mood);
    const featured = offers[0] || bundles[0];
    return h('div', {className:'lf-shop-catalog'},
      !onlyWishlist && offers.length>0 && h('section', {className:'lf-shop-editorial'},
        h('div', {className:'lf-shop-intro'}, h('h2',null,text(lang,'لبروفايلك، حكاية أخرى.','Give your profile a new story.')),
          h('p',null,text(lang,'اختر ما يشبهك. ودع التفاصيل تحكي عنك.','Find your mood. Let the details tell your story.'))),
        h('button',{type:'button',className:'lf-shop-featured',style:packStyle(featured),onClick:()=>onSelect(featured.id),
          'aria-label':text(lang,'اكتشف مجموعة ','Discover ') + featured.names[lang]},
          h(Art,{pack:featured,className:'lf-shop-featured-landscape'}),
          h('span',{className:'lf-shop-featured-edition'},icon('Moon',13),text(lang,'اختيار الرواق','ATELIER PICK')),
          h('div',{className:'lf-shop-featured-portrait'},h(Avatar,{profile,pack:featured})),
          h('div',{className:'lf-shop-featured-copy'},h('span',null,text(lang,'مجموعة لورفاي الأصلية','LOREFY ORIGINALS')),
            h('h3',null,featured.names[lang]),h('p',null,featured.collection[lang]),
            h('span',{className:'lf-shop-featured-link'},text(lang,'اكتشف الحزمة','Explore collection'),icon(lang==='en'?'ArrowRight':'ArrowLeft',16))),
          h('span',{className:'lf-shop-featured-number','aria-hidden':true},'01'))),
      h('header', {className:'lf-shop-section-head'}, h('div',null,h('span',{className:'lf-shop-eyebrow'},text(lang,'اختر أجواءك','FIND YOUR MOOD')),
        h('h2', null, text(lang, onlyWishlist ? 'اختياراتك المحفوظة' : 'تشكيلة الرواق', onlyWishlist ? 'Your saved picks' : 'The collection'))),
        h('span', {className:'lf-shop-total'},new Intl.NumberFormat(lang).format(shown.length), ' ',text(lang,'حزمة','collections'))),
      h('div',{className:'lf-shop-moods',role:'group','aria-label':text(lang,'أجواء الحزم','Collection moods')},moods.map(([value,ar,en])=>
        h('button',{key:value,type:'button','aria-pressed':mood===value,onClick:()=>setMood(value)},text(lang,ar,en)))),
      h('div', {className:'lf-shop-products'}, shown.map(pack => h('article', {className:'lf-shop-product', key:pack.id, style:packStyle(pack)},
        h('button', {type:'button', className:'lf-shop-product-preview', 'aria-label':text(lang,'معاينة ','Preview ') + pack.names[lang], onClick:() => onSelect(pack.id)},
          h('span',{className:'lf-shop-product-orbit','aria-hidden':true}),
          h(Avatar, {profile, pack}),h('span',{className:'lf-shop-piece-count'},pack.parts.length===2?text(lang,'إطاران متحركان','2 animated frames'):text(lang,'٣ قطع','3 pieces'))),
        h('button', {type:'button', className:'lf-shop-wishlist', 'aria-pressed':wishlist.includes(pack.id),
          'aria-label':text(lang,'حفظ في المفضلة: ','Wishlist: ') + pack.names[lang], title:text(lang,'المفضلة','Wishlist'), onClick:() => onWishlist(pack.id)}, icon('Heart', 18)),
        h('div', {className:'lf-shop-product-copy'}, h('span',{className:'lf-shop-product-label'},text(lang,pack.overlay?'مجموعة خاصة':'لورفاي الأصلية',pack.overlay?'SIGNATURE COLLECTION':'LOREFY ORIGINALS')),
          h('h3', null, pack.names[lang]),h('div',{className:'lf-shop-product-bottom'},h('span',{className:'lf-shop-price'},priceLabel(pack,lang)),
          h('button', {type:'button', className:'lf-shop-view', 'aria-label':text(lang,'عرض الحزمة: ','View collection: ')+pack.names[lang],onClick:() => onSelect(pack.id)},icon(lang === 'en' ? 'ArrowUpRight' : 'ArrowUpLeft', 18))))))),
      !shown.length && h('div', {className:'lf-shop-empty', role:'status'}, icon(onlyWishlist?'Heart':'Sparkles', 28),
        h('p', null, text(lang,onlyWishlist?'لم تحفظ حزمة بهذه الأجواء بعد':'لا توجد حزم بهذه الأجواء',onlyWishlist?'No saved picks in this mood yet':'No collections in this mood'))),
      h('p',{className:'lf-shop-catalog-note'},icon('Gift',15),hasPaidOffers()?text(lang,'٥ حزم مجانية · الحزم الجديدة شراء مرة واحدة','5 free collections · New collections are a one-time purchase'):text(lang,'جميع الحزم مجانية حاليًا','All collections are free for now')));
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
    const host = R.useRef(null), closeButton = R.useRef(null), previous = R.useRef(null), body = R.useRef(null);
    const lang = root.document.documentElement.lang === 'en' ? 'en' : 'ar';
    R.useEffect(() => {
      let active = true;
      const show = event => {
        if (!isAvailable(root.LorefyBackend) || event.detail.owner !== ownerId()) return;
        previous.current = root.document.activeElement;
        setRequest(event.detail); setSelection(null); setPart('all'); setTab('collections'); setError('');
        setWishlist(readWishlist(root.sessionStorage, event.detail.owner));
        setEquipped(readDecoration(root.localStorage,event.detail.owner));setSaving(false);setStatus('');
        setOwned([]);setStorePrices({});
        if(hasPaidOffers() && root.LorefyDecorationBilling && root.LorefyBackend.mode==='live'){
          root.LorefyDecorationBilling.owned(event.detail.owner).then(rows=>{if(active&&ownerId()===event.detail.owner)setOwned(rows);}).catch(()=>{});
          root.LorefyDecorationBilling.availability(event.detail.owner).then(rows=>{if(active&&ownerId()===event.detail.owner)setStorePrices(Object.fromEntries(rows.map(r=>[r.id,r.displayPrice])));}).catch(()=>{});
        }
      };
      root.addEventListener('lorefy:profile-shop-open', show);
      if (root.LorefyBackend && root.LorefyBackend.onAuth) root.LorefyBackend.onAuth(() => {
        if (active) setRequest(current => current && (current.owner !== ownerId() || !isAvailable(root.LorefyBackend)) ? null : current);
      });
      controllerReady = true;
      if (pendingRequest) {const detail = pendingRequest; pendingRequest = null; show({detail});}
      return () => {active = false; controllerReady = false; root.removeEventListener('lorefy:profile-shop-open', show);};
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
        const controls = Array.from(host.current.querySelectorAll('button,a,[tabindex="0"]')).filter(node => !node.disabled && node.getClientRects().length);
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
      if (body.current) body.current.scrollTop = 0;
    }, [request, selection, tab]);
    R.useEffect(() => {
      if (!request || !hasPaidOffers() || !root.LorefyDecorationBilling || !root.LorefyDecorationBilling.watch || root.LorefyBackend.mode!=='live') return;
      return root.LorefyDecorationBilling.watch(request.owner, rows => {if(ownerId()===request.owner)setOwned(rows);});
    }, [request]);
    if (!request) return null;
    const pack = findBundle(selection), selected = id => {setSelection(id); setPart('all'); setReplay(value => value + 1); setError('');setStatus('');};
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
      h('section', {className:'lf-shop-dialog', role:'dialog', 'aria-modal':true, 'aria-labelledby':'lf-shop-title', ref:host},
        h('header', {className:'lf-shop-header'},
          h('button', {type:'button', className:'lf-shop-icon-button', ref:closeButton, onClick:() => pack ? setSelection(null) : setRequest(null),
            'aria-label':text(lang,pack ? 'رجوع إلى الحزم' : 'إغلاق المتجر',pack ? 'Back to collections' : 'Close shop'), title:text(lang,'رجوع','Back')}, icon(lang === 'en' ? 'ChevronLeft' : 'ChevronRight',22)),
          h('div', {className:'lf-shop-brand'},h('span',{className:'lf-shop-brand-mark'},icon('Feather',13),'LOREFY ATELIER'),
            h('h1', {id:'lf-shop-title'}, pack ? pack.names[lang] : text(lang,'رواق لورفاي','Lorefy Atelier'))),
          h('button', {type:'button', className:'lf-shop-icon-button', onClick:() => setRequest(null), 'aria-label':text(lang,'إنهاء المعاينة','End preview'), title:text(lang,'إنهاء المعاينة','End preview')}, icon('X',20))),
        h('div', {className:'lf-shop-body', ref:body}, pack ? h(R.Fragment,null,
          h('div',{className:'lf-shop-preview-stage',style:packStyle(pack)},
            h('span',{className:'lf-shop-preview-caption'},icon('Eye',15),text(lang,'على بروفايلك','ON YOUR PROFILE')),
            h(ProfilePreview, {pack, profile:request.profile, part, replay})),
          h('div', {className:'lf-shop-detail'},
            h('div', {className:'lf-shop-detail-title'}, h('div',null,h('h2',null,pack.names[lang]),h('p',null,pack.collection[lang])),
              h('button',{className:'lf-shop-icon-button',type:'button',onClick:() => toggleWishlist(pack.id),'aria-pressed':wishlist.includes(pack.id),
                'aria-label':text(lang,'حفظ في المفضلة: ','Wishlist: ') + pack.names[lang]},icon('Heart',20))),
            h('div', {className:'lf-shop-parts',role:'group','aria-label':text(lang,'أجزاء الحزمة','Bundle components')},
              [['all','Layers','الحزمة','Bundle'],['frame','CircleUserRound','إطار الصورة','Avatar frame'],['page','PanelTop','إطار الصفحة','Profile frame'],['effect','Sparkles','التأثير','Effect']].filter(([value])=>value==='all'||pack.parts.includes(value)).map(([value,symbol,ar,en]) =>
                h('button',{key:value,type:'button','aria-pressed':part === value,onClick:() => {setPart(value); setReplay(count => count + 1);setStatus('');setError('');}},icon(symbol,20),h('span',null,text(lang,ar,en))))),
            h('div', {className:'lf-shop-includes'}, icon('Package',18), h('span',null,pack.parts.length===3?text(lang,'ثلاث قطع. حكاية واحدة.','Three pieces. One story.'):text(lang,'إطار صورة وإطار صفحة متحركان','Animated avatar + profile frames'))),
            h('button',{className:'lf-shop-replay',type:'button',onClick:() => setReplay(value => value + 1)},icon('RotateCcw',17),text(lang,'إعادة المعاينة','Replay preview')))) :
          h(R.Fragment,null,
            h('div', {className:'lf-shop-tabs',role:'group','aria-label':text(lang,'عرض المتجر','Shop view')},
              [['collections','اكتشف','Discover'],['wishlist','محفوظاتك','Saved']].map(([value,ar,en]) => h('button',{key:value,type:'button','aria-pressed':tab === value,onClick:() => setTab(value)},icon(value==='collections'?'Grid2X2':'Heart',15),text(lang,ar,en),value === 'wishlist' && h('span',null,wishlist.length)))),
            h(Catalog, {lang, profile:request.profile, wishlist, onSelect:selected, onWishlist:toggleWishlist, onlyWishlist:tab === 'wishlist'})),
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
      if((isLocalLab() || betaCollectionsEnabled()) && root.fetch) {
        try {
          const beta=betaCollectionsEnabled();
          const response=await root.fetch(beta ? 'launch/decorations/pfpvibes/collections.json' : 'qa/frame-lab/collections.json');
          if(response.ok)(beta ? installBetaCollections : installLocalCollections)(await response.json());
        } catch (_) { /* Original collections remain available if the manifest is missing. */ }
      }
      offerIds=Object.freeze([]);
      if(root.fetch){try{const r=await root.fetch('launch/decorations/originals/catalog.json');if(r.ok)installShopCatalog(await r.json());}catch(_) { /* Purchase catalog fails closed; existing appearance remains. */ }}
      const host = root.document.createElement('div'); host.className = 'lf-shop-controller'; root.document.body.appendChild(host);
      root.ReactDOM.createRoot(host).render(h(Shop));
      let scheduled = false;
      function styleNode(node,pack) {Object.entries(packStyle(pack)).forEach(([key,value]) => node.style.setProperty(key,value));}
      function decorate(page,value) {
        const choice = normalizeDecoration(value), signature = JSON.stringify(choice);
        const avatar = page.querySelector('.lf-profile-avatar,.lf-reader-avatar');
        if (avatar) {
          const pack = findBundle(choice.frame);
          let ring = avatar.querySelector('.lf-decoration-avatar-frame');
          if (pack) {
            if (!ring) {ring = root.document.createElement('span');ring.className = 'lf-decoration-avatar-frame lf-shop-frame-art';ring.setAttribute('aria-hidden','true');avatar.appendChild(ring);}
            styleNode(ring,pack);avatar.classList.add('has-decoration');
            if(root.LorefyFrameMotion)root.LorefyFrameMotion.mount(ring,{...avatarMotion(pack),...(pack.renderer?{original:{id:pack.artId,renderer:pack.renderer}}:{})},'avatar');
          } else {if (ring) ring.remove();avatar.classList.remove('has-decoration');}
        }
        let pin = page.querySelector(':scope > .lf-decoration-page-pin');
        const pagePack = findBundle(choice.page);
        page.classList.toggle('has-page-decoration',!!pagePack);
        if (pagePack) {
          if (!pin) {
            pin = root.document.createElement('div');pin.className = 'lf-decoration-page-pin';pin.setAttribute('aria-hidden','true');
            const border = root.document.createElement('div');border.className = 'lf-decoration-page-border';pin.appendChild(border);page.prepend(pin);
          }
          styleNode(pin.firstElementChild,pagePack);
          pin.firstElementChild.style.setProperty('--decoration-height',page.clientHeight + 'px');
          if(pagePack.overlay)pin.firstElementChild.setAttribute('data-motion-page','true');else pin.firstElementChild.removeAttribute('data-motion-page');
          if(root.LorefyFrameMotion)root.LorefyFrameMotion.mount(pin.firstElementChild,{...pagePack.motion,...(pagePack.renderer?{original:{id:pagePack.artId,renderer:pagePack.renderer}}:{})},'page');
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
  return Object.freeze({get bundles(){return bundles;},get offered(){return offeredBundles();},installShopCatalog,installLocalCollections,installBetaCollections,isLocalLab,findBundle,isAvailable,DECORATION_KEY,normalizeDecoration,readDecoration,applyDecoration,frameGeometry,previewParts,readWishlist,writeWishlist,Catalog,ProfilePreview,Entry,Shop,open,start});
});

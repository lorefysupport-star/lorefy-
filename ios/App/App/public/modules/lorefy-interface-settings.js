(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LorefyInterfacePreferences = api;
})(typeof window !== 'undefined' ? window : this, function (root) {
  'use strict';
  var MOTION_KEY = 'lorefy.ui.motion.v1';
  function getMotion(storage) {
    try { return (storage || root.localStorage).getItem(MOTION_KEY) === 'reduced' ? 'reduced' : 'system'; }
    catch (error) { return 'system'; }
  }
  function applyMotion() {
    if (root.document) root.document.documentElement.setAttribute('data-lorefy-motion', getMotion());
  }
  function setMotion(value, storage) {
    var mode = value === 'reduced' ? 'reduced' : 'system';
    try { (storage || root.localStorage).setItem(MOTION_KEY, mode); }
    catch (error) { return false; }
    applyMotion();
    if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('lorefy:motion-change'));
    return true;
  }
  function reduceMotion(storage, systemReduced) {
    if (systemReduced === undefined) systemReduced = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return getMotion(storage) === 'reduced' || !!systemReduced;
  }
  function scrollBehavior() { return reduceMotion() ? 'auto' : 'smooth'; }
  applyMotion();
  if (root.addEventListener) root.addEventListener('storage', function (event) {
    if (event.key === MOTION_KEY) applyMotion();
  });

  root.LorefyInterfaceSettings = function InterfaceSettings(p) {
    var R = root.React, h = R.createElement, english = p.language === 'en';
    var text = function (ar, en) { return english ? en : ar; };
    var views = root.LorefyLibraryView;
    var openState = R.useState(!!p.embedded), open = openState[0], setOpen = openState[1];
    var layoutState = R.useState(views.savedMode(root.localStorage)), layout = layoutState[0], setLayout = layoutState[1];
    var motionState = R.useState(getMotion()), motion = motionState[0], updateMotion = motionState[1];
    var errorState = R.useState(''), error = errorState[0], setError = errorState[1];
    var design=root.LorefyDesignSystem, current=design.customSettings(p.appearance);
    var colorState=R.useState(current.color),color=colorState[0],setColor=colorState[1];
    var baseState=R.useState(current.base),base=baseState[0],setBase=baseState[1];
    var draftMode=design.customMode(color.trim(),base);
    var host = R.useRef(null), close = R.useRef(null), colorInput = R.useRef(null);
    var icon = function (name, size) { return root.NenIcons && h(root.NenIcons[name], {size:size || 18, 'aria-hidden':true}); };
    var options = views.options(p.language);
    var title = text('المظهر والتخصيص', 'Appearance & personalization');
    var themeLabels = {light:text('فاتح','Light'),dark:text('داكن','Dark'),pink:text('وردي','Pink')};
    var fail = function () { setError(text('تعذر حفظ الاختيار. حاول مجددًا.', 'Could not save your choice. Try again.')); };
    function chooseAppearance(mode){
      if(!design.saveMode(mode,root.localStorage))return fail();
      setError('');p.onAppearance(mode);
    }
    function applyColor(){
      if(!draftMode)return setError(text('أدخل لونًا صحيحًا مثل #12ABEF.','Enter a valid color such as #12ABEF.'));
      if(colorInput.current)colorInput.current.focus();
      chooseAppearance(draftMode);
    }
    function chooseLayout(mode) {
      if (!views.setMode(mode)) return fail();
      setLayout(mode); setError('');
    }
    function chooseMotion(mode) {
      if (!setMotion(mode)) return fail();
      updateMotion(mode); setError('');
    }
    function reset() {
      var layoutSaved = views.setMode('grid'), motionSaved = setMotion('system');
      setLayout(views.savedMode(root.localStorage)); updateMotion(getMotion());
      if (!layoutSaved || !motionSaved) return fail();
      chooseAppearance('dark');
    }
    R.useEffect(function(){
      var settings=design.customSettings(p.appearance);
      if(design.isCustom(p.appearance))setColor(settings.color);
      setBase(settings.base);
    },[p.appearance]);
    R.useEffect(function () {
      function changed() { setLayout(views.savedMode(root.localStorage)); updateMotion(getMotion()); }
      root.addEventListener('lorefy:library-view-change', changed);
      root.addEventListener('lorefy:motion-change', changed);
      root.addEventListener('storage', changed);
      return function () {
        root.removeEventListener('lorefy:library-view-change', changed);
        root.removeEventListener('lorefy:motion-change', changed);
        root.removeEventListener('storage', changed);
      };
    }, []);
    R.useEffect(function () {
      if (p.embedded || !open || !host.current) return;
      var previous = root.document.activeElement, overlay = host.current.parentElement;
      var background = Array.from(overlay.parentElement.children).filter(function (node) { return node !== overlay; }).map(function (node) {
        var saved = {node:node,inert:node.inert}; node.inert = true; return saved;
      });
      close.current && close.current.focus();
      function keyboard(event) {
        if (event.key === 'Escape') setOpen(false);
        if (event.key !== 'Tab') return;
        var nodes = Array.from(host.current.querySelectorAll('button,input,select,[tabindex="0"]')).filter(function (node) { return !node.disabled && node.getClientRects().length; });
        var first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && root.document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && root.document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      root.document.addEventListener('keydown', keyboard);
      return function () {
        root.document.removeEventListener('keydown', keyboard);
        background.forEach(function (saved) { saved.node.inert = saved.inert; });
        if (previous && previous.isConnected) previous.focus();
      };
    }, [open]);

    var selected = options.find(function (option) { return option.mode === layout; });
    var entry = h('button', {className:'lf-interface-entry',type:'button',onClick:function () { if(p.onCustomize)p.onCustomize();else setOpen(true); },'aria-haspopup':'dialog'},
      icon('SlidersHorizontal',20), h('span',null,h('strong',null,title),h('small',null,(themeLabels[p.appearance] || text('مخصص','Custom')) + ' · ' + selected.label)),icon(english ? 'ChevronRight' : 'ChevronLeft',18));
    var entries = h(R.Fragment,null,entry,root.LorefyProfileShop && h(root.LorefyProfileShop.Entry,{language:p.language}));
    if (!open) return entries;

    var books = (p.books || []).slice(0,layout === 'shelf' || layout === 'showcase' ? 3 : layout === 'spines' ? 7 : 8);
    var scene = h('section',{className:'lf-interface-preview','aria-label':text('معاينة المكتبة','Library preview')},
      h('div',{className:'lf-interface-preview-head'},h('strong',null,text('مكتبتك','Your library')),h('span',null,text('معاينة','Preview'))),
      h('div',{className:'lf-interface-preview-books'+(layout==='showcase'?' is-showcase-view':''),'data-mode':layout},books.map(function (book,index) {
        return h('div',{key:book.id,className:'lf-interface-preview-book'+(layout==='showcase'?' lf-showcase-book':''),title:book.title,
          'data-showcase-position':layout==='showcase'?views.showcasePlacement(index).position:undefined,
          style:{'--spine-height':views.spineHeight(book.title) + 'px','--showcase-row':'1'}},
          h('img',{src:book.cover,alt:'',className:layout==='showcase'?'lf-showcase-cover':undefined,decoding:'async',onError:function (event) {
            if (!book.fallback || event.currentTarget.getAttribute('src') === book.fallback) return;
            event.currentTarget.src = book.fallback;
          }}),layout==='showcase'?h('span',{className:'lf-showcase-caption','data-no-translate':'1'},h('span',{className:'lf-showcase-rank','aria-hidden':true},index+1),h('span',{className:'lf-showcase-title',dir:'auto'},book.title)):h('span',{dir:'auto'},book.title));
      })));
    var content = h('div',{className:'lf-interface-body'},scene,h('section',{className:'lf-interface-section','aria-labelledby':'lf-interface-layout-title'},
            h('h3',{id:'lf-interface-layout-title'},text('عرض المكتبة','Library layout')),
            h('div',{className:'lf-interface-layouts',role:'group','aria-label':text('عرض المكتبة','Library layout')},options.map(function (option) {
              return h('button',{key:option.mode,type:'button','data-layout':option.mode,'aria-pressed':layout===option.mode,onClick:function () { chooseLayout(option.mode); }},
                icon({grid:'LayoutGrid',spines:'LibraryBig',showcase:'GalleryHorizontalEnd',shelf:'List'}[option.mode],20),option.label);
            }))),
          h('section',{className:'lf-interface-section','aria-labelledby':'lf-interface-theme-title'},
            h('h3',{id:'lf-interface-theme-title'},text('ألوان التطبيق','Appearance')),
            h('div',{className:'lf-interface-themes lf-appearance-options',role:'group','aria-label':text('ألوان التطبيق','Appearance')},['light','dark','pink'].map(function (mode) {
              return h('button',{key:mode,type:'button','aria-label':themeLabels[mode],'aria-pressed':p.appearance===mode,onClick:function () { chooseAppearance(mode); }},
                h('span',{className:'lf-interface-swatch','data-theme':mode,'aria-hidden':true},p.appearance===mode && icon('Check',15)),h('span',null,themeLabels[mode]));
            })),
            h('fieldset',{className:'lf-interface-custom'},
              h('legend',null,text('لونك الخاص','Custom color')),
              h('div',{className:'lf-interface-color-row'},
                h('label',{className:'lf-interface-color-field'},h('span',null,text('اللون','Color')),
                h('input',{type:'color','aria-label':text('اختر لون الثيم','Choose theme color'),value:design.customSettings(draftMode || p.appearance).color,
                  onInput:function(event){setColor(event.currentTarget.value);setError('');},
                  onChange:function(event){setColor(event.target.value);setError('');}})),
                h('label',{className:'lf-interface-color-field'},h('span',null,text('كود اللون','Hex color')),
                h('input',{type:'text',ref:colorInput,dir:'ltr',spellCheck:false,autoComplete:'off',maxLength:7,'aria-label':text('كود اللون','Hex color'),
                  'aria-describedby':error?'lf-interface-color-error':undefined,
                  value:color,'aria-invalid':!draftMode,onChange:function(event){setColor(event.target.value);setError('');},
                  onBlur:function(){if(!draftMode)setError(text('أدخل لونًا صحيحًا مثل #12ABEF.','Enter a valid color such as #12ABEF.'));}}))),
              error && !draftMode && h('p',{className:'lf-interface-error',role:'alert',id:'lf-interface-color-error'},error),
              h('div',{className:'lf-interface-color-swatches',role:'group','aria-label':text('ألوان مقترحة','Suggested colors')},
                ['#3687bb','#18a985','#df7134','#c45087','#775ac8','#b4b64a'].map(function(value){return h('button',{key:value,type:'button',
                  style:{'--color-swatch':value},'aria-label':text('لون ','Color ')+value,'aria-pressed':color.toLowerCase()===value,
                  onClick:function(){setColor(value);setError('');}},color.toLowerCase()===value&&icon('Check',16));})),
              h('div',{className:'lf-interface-color-base',role:'group','aria-label':text('خلفية اللون المخصص','Custom color background')},['light','dark'].map(function(value){
                return h('button',{key:value,type:'button','aria-label':text(value==='dark'?'خلفية داكنة':'خلفية فاتحة',value==='dark'?'Dark background':'Light background'),
                  'aria-pressed':base===value,onClick:function(){setBase(value);}},icon(value==='dark'?'Moon':'Sun',17),themeLabels[value]);})),
              h('button',{type:'button',className:'lf-interface-color-apply','data-custom-apply':true,disabled:!draftMode || p.appearance===draftMode,
                onClick:applyColor},icon('Check',18),text(p.appearance===draftMode?'مطبّق':'تطبيق اللون',p.appearance===draftMode?'Applied':'Apply color')))),

          p.extra || null,h('section',{className:'lf-interface-section lf-interface-motion'},
            h('span',null,text('تقليل الحركة','Reduce motion')),
            h('button',{type:'button',role:'switch','aria-label':text('تقليل الحركة','Reduce motion'),'aria-checked':motion==='reduced',onClick:function () { chooseMotion(motion==='reduced' ? 'system' : 'reduced'); }},h('span',{'aria-hidden':true}))),
          error && draftMode && h('p',{className:'lf-interface-error',role:'alert',id:'lf-interface-color-error'},error));
    if(p.embedded)return content;
    var panel = h('div',{className:'lf-interface-overlay','data-no-translate':'1',dir:english ? 'ltr' : 'rtl'},
      h('section',{className:'lf-interface-panel',role:'dialog','aria-modal':true,'aria-labelledby':'lf-interface-title',ref:host},
        h('header',{className:'lf-interface-header'},
          h('button',{type:'button',ref:close,'aria-label':text('رجوع إلى الإعدادات','Back to settings'),title:text('رجوع إلى الإعدادات','Back to settings'),onClick:function () { setOpen(false); }},icon(english ? 'ChevronLeft' : 'ChevronRight',22)),
          h('h2',{id:'lf-interface-title'},title),
          h('button',{type:'button','aria-label':text('استعادة المظهر الافتراضي','Reset appearance'),title:text('استعادة المظهر الافتراضي','Reset appearance'),onClick:reset},icon('RotateCcw',19))),
        content));
    return h(R.Fragment,null,entries,root.ReactDOM.createPortal(panel,root.document.querySelector('.lf-app')));
  };
  return Object.freeze({getMotion:getMotion,setMotion:setMotion,reduceMotion:reduceMotion,scrollBehavior:scrollBehavior});
});

if(typeof window!=='undefined')window.LorefyCustomizeCamera=function(){var h=React.createElement,paths=window.lucide.icons.Camera[2];return h('span',{className:'lf-customize-camera-glyph'},h('svg',{width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},paths.map(function(p,i){return h(p[0],Object.assign({key:i},p[1]));})),window.NenIcons&&window.NenIcons.Plus&&h(window.NenIcons.Plus,{size:10,'aria-hidden':true}));};

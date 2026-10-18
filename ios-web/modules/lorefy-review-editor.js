(function (root) {
  'use strict';
  var words = {
    ar: { title:'مراجعتك', rating:'تقييمك للعمل', empty:'لم تقيّم بعد', optional:'اختياري', details:'التقييمات التفصيلية', review:'رأيك', placeholder:'ما الذي بقي معك من هذا العمل؟', recommend:'هل تنصح به؟', yes:'أنصح به', no:'لا أنصح به', spoiler:'تحتوي المراجعة على حرق', extras:'إضافات المراجعة', moment:'لحظة مميزة', momentPlaceholder:'مشهد أو اقتباس لا تنساه...', images:'صور المراجعة', attach:'إرفاق صورة', premium:'إرفاق صور مع Premium', characters:'شخصياتك المفضلة', publishComplete:'نشر وإضافة للمكتملة', publish:'نشر المراجعة', publishing:'جارٍ النشر...', close:'إغلاق', remove:'إزالة الصورة', failure:'تعذّر النشر. مراجعتك محفوظة هنا؛ حاول مجددًا.', outOf:'من 5', limit:'حرف' },
    en: { title:'Your review', rating:'Your rating', empty:'Not rated yet', optional:'Optional', details:'Detailed ratings', review:'Your thoughts', placeholder:'What stayed with you after reading?', recommend:'Would you recommend it?', yes:'Recommend', no:'Not for me', spoiler:'This review contains spoilers', extras:'Review extras', moment:'A memorable moment', momentPlaceholder:'A scene or quote you will remember...', images:'Review images', attach:'Attach image', premium:'Attach images with Premium', characters:'Favorite characters', publishComplete:'Publish and mark completed', publish:'Publish review', publishing:'Publishing...', close:'Close', remove:'Remove image', failure:'Could not publish. Your review is still here; try again.', outOf:'out of 5', limit:'characters' }
  };
  function copy(lang) { return words[lang === 'en' ? 'en' : 'ar']; }
  function formatLabel(value, lang) {
    var formats = {'مانجا':'Manga','مانهوا':'Manhwa','مانهوا صيني':'Manhua','مانهوا صينية':'Manhua','مانهوا صينيّة':'Manhua','كوميكس':'Comics','رواية':'Novel','كتاب':'Book','لايت نوفل':'Light novel','ويب نوفل':'Web novel'};
    return lang === 'en' ? formats[value] || value : value;
  }
  function canPublish(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0.25 && value <= 5; }
  function ratingValue(index, part) { return Math.min(5, Math.max(0.25, index + ([0.25,0.5,0.75,1].includes(part) ? part : 1))); }
  function savedDraft(review) {
    review = review || {};
    return {rating:Math.max(0,Math.min(5,Number(review.r)||0)),text:review.txt === '—' ? '' : String(review.txt || ''),
      ratings:Object.assign({story:0,art:0,chars:0,world:0},review.ratings || {}),
      images:Array.isArray(review.imgs) ? review.imgs.slice() : [],moment:String(review.moment || ''),
      spoiler:!!review.spoiler,recommendation:review.recVal || (review.rec === true ? 'yes' : null)};
  }
  root.LorefySavedReviewDraft = savedDraft;
  if (typeof module === 'object' && module.exports) module.exports = { copy:copy, canPublish:canPublish, ratingValue:ratingValue, formatLabel:formatLabel, savedDraft:savedDraft };

  root.LorefyWorkIdentity = function WorkIdentity(p) {
    var h=root.React.createElement, w=p.work, english=p.language==='en';
    var feather=root.NenIcons && root.NenIcons.Feather;
    var R=root.React,tabState=R.useState('story'),activeTab=tabState[0],setTab=tabState[1],host=R.useRef(null);
    R.useEffect(function(){setTab('story');},[w.id]);
    R.useEffect(function(){
      var content=host.current&&host.current.parentElement;
      if(!content)return;
      content.dataset.workTab=activeTab;
      if(activeTab==='reviews'){
        var reviews=Array.from(content.querySelectorAll('.lf-work-reader-tabs button')).find(function(button){return /^(مراجعات|Reviews)$/i.test(button.textContent.trim());});
        if(reviews)reviews.click();
      }
    },[activeTab,w.id]);
    function moveTab(event){
      var buttons=Array.from(event.currentTarget.querySelectorAll('[role="tab"]'));
      var index=buttons.indexOf(event.target),next=index;
      if(event.key==='Home')next=0;
      else if(event.key==='End')next=buttons.length-1;
      else if(event.key===(english?'ArrowRight':'ArrowLeft'))next=(index+1)%buttons.length;
      else if(event.key===(english?'ArrowLeft':'ArrowRight'))next=(index+buttons.length-1)%buttons.length;
      else return;
      if(index<0)return;
      event.preventDefault();setTab(buttons[next].dataset.workTab);buttons[next].focus();
    }
    return h('header',{className:'lf-work-identity',ref:host},
      h('img',{className:'lf-work-poster',src:p.cover,alt:w.title,decoding:'async',onError:p.onError,'data-fallback':p.fallback}),
      h('div',{className:'lf-work-copy'},
        h('p',{className:'lf-work-format'},[formatLabel(w.type,p.language),w.yr].filter(Boolean).join(' · ')),
        h('div',{className:'lf-work-title-line'},h('h1',{dir:'auto'},w.title)),
        p.subtitle && h('p',{className:'lf-work-subtitle'},p.subtitle),
        h('div',{className:'lf-work-rating','aria-label':english?'Work rating':'تقييم العمل'},feather&&h(feather,{size:20,'aria-hidden':true}),h('strong',{className:'lf-work-rating-value'},Number(p.rating)>0?Number(p.rating).toFixed(1):'—'),h('span',{className:'lf-work-rating-caption'},english?'out of 5':'من 5')),
        p.creator && (root.LorefyProductCore && root.LorefyProductCore.authorWorks([w],p.creator).length
          ? h('button',{type:'button',className:'lf-work-creator lf-work-author-button',onClick:function(){ root.LorefyProductTools.openAuthor(p.creator); },'aria-label':(english?'Works by ':'أعمال ')+p.creator},p.creator,root.NenIcons && h(english?root.NenIcons.ChevronRight:root.NenIcons.ChevronLeft,{size:14,'aria-hidden':true}))
          : h('p',{className:'lf-work-creator'},p.creator))),
      h('div',{className:'lf-work-action-slot'}),
      h('div',{className:'lf-work-facts'},w.st && h('span',null,w.st),p.metadata && h('span',null,p.metadata),w.pl && h('span',null,w.pl)),
      h('nav',{className:'lf-work-section-nav',role:'tablist','aria-label':english?'Work content':'محتوى العمل',onKeyDown:moveTab},
        [['story',english?'Story':'القصة'],['reviews',english?'Reviews':'المراجعات'],['related',english?'Related':'ذات صلة']].map(function(item){return h('button',{key:item[0],type:'button',role:'tab','data-work-tab':item[0],tabIndex:activeTab===item[0]?0:-1,'aria-selected':activeTab===item[0],onClick:function(){setTab(item[0]);}},item[1]);})));

  };

  root.LorefyReviewComposer = function ReviewComposer(p) {
    var R = root.React, h = R.createElement, w = copy(p.language), english = p.language === 'en';
    var textState = R.useState(p.textRef.current || ''), text = textState[0], setText = textState[1];
    var momentState = R.useState(p.momentRef.current || ''), moment = momentState[0], setMoment = momentState[1];
    var busyState = R.useState(false), busy = busyState[0], setBusy = busyState[1];
    var errorState = R.useState(''), error = errorState[0], setError = errorState[1];
    var host = R.useRef(null), closeButton = R.useRef(null), busyRef = R.useRef(false);
    var limit = p.premium ? 4000 : 750;
    var isCurrent = function () { return !p.isCurrent || p.isCurrent(); };
    var icon = function (name, props) { return p.icons[name] ? h(p.icons[name], Object.assign({size:18, 'aria-hidden':true}, props || {})) : null; };
    var label = function (value) { return root.LorefyI18n ? root.LorefyI18n.translate(value, p.language) : value; };
    R.useEffect(function () {
      var previous = root.document.activeElement;
      var overlay = host.current && host.current.parentElement;
      var background = overlay && overlay.parentElement ? Array.prototype.map.call(overlay.parentElement.children, function (node) {
        if (node === overlay) return null;
        var saved = { node:node, inert:node.inert };
        node.inert = true;
        return saved;
      }).filter(Boolean) : [];
      closeButton.current && closeButton.current.focus();
      function keyboard(event) {
        if (event.key === 'Escape' && !busyRef.current) p.onClose();
        if (event.key !== 'Tab' || !host.current) return;
        var nodes = Array.prototype.filter.call(host.current.querySelectorAll('button,input,textarea,summary,[tabindex="0"]'), function (node) { return !node.disabled && node.getClientRects().length; });
        var first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && root.document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && root.document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      root.document.addEventListener('keydown', keyboard);
      return function () {
        root.document.removeEventListener('keydown', keyboard);
        background.forEach(function (saved) { saved.node.inert = saved.inert; });
        previous && previous.isConnected && previous.focus();
      };
    }, []);
    function feathers(value, pick, name, large) {
      return h('div', {className:'lf-rating-scale' + (large ? ' is-large' : '')},
        h('input',{type:'range',min:0,max:5,step:0.25,value:value,'aria-label':name,'aria-valuetext':value?Number(value).toFixed(2)+' '+w.outOf:w.empty,style:{'--rating-progress':(value/5*100)+'%'},onChange:function(event){pick(Number(event.target.value));}}),
        h('div',{className:'lf-rating-scale-labels','aria-hidden':true},[0,1,2,3,4,5].map(function(n){return h('span',{key:n},String(n));})));
    }
    async function publish() {
      if (!isCurrent() || busyRef.current || !canPublish(p.rating)) return;
      busyRef.current = true; setBusy(true); setError('');
      try { if (await p.onPublish() === false && isCurrent()) setError(w.failure); }
      catch (e) { if (isCurrent()) setError(w.failure); }
      finally { busyRef.current = false; if (isCurrent()) setBusy(false); }
    }
    function optionalTitle(title) { return h('summary', null, h('span', null, title), h('small', null, w.optional)); }
    return h('div', {className:'nc-fade lf-review-editor-overlay', 'data-no-translate':'1', dir:english ? 'ltr' : 'rtl'},
      h('button', {className:'lf-rating-scrim', tabIndex:-1, 'aria-label':w.close, disabled:busy, onClick:p.onClose}),
      h('section', {ref:host, className:'nc-sheet lf-rating-sheet', 'data-review-mid':String(p.work.id), role:'dialog', 'aria-modal':true, 'aria-labelledby':'lf-rating-title'},
        h('div', {className:'lf-rating-handle', 'aria-hidden':true}),
        h('header', {className:'lf-rating-header'}, h('h2', {id:'lf-rating-title'}, w.title), h('button', {ref:closeButton, type:'button', title:w.close, 'aria-label':w.close, disabled:busy, onClick:p.onClose}, icon('X'))),
        h('div', {className:'lf-rating-body'},
          h('div', {className:'lf-rating-work'}, h('img', {src:p.cover, alt:'', decoding:'async'}), h('div', null, h('span', null, formatLabel(p.work.type,p.language)), h('h3', null, p.work.title), h('p', null, [p.work.auth,p.work.yr].filter(Boolean).join(' · ')))),
          h('section', {className:'lf-rating-primary', 'aria-label':w.rating},
            h('div', {className:'lf-rating-heading'}, h('h3', null, w.rating), h('output', {className:'lf-rating-number', 'aria-live':'polite'}, root.NenIcons && root.NenIcons.Feather && h(root.NenIcons.Feather,{size:24,'aria-hidden':true}), canPublish(p.rating) ? Number(p.rating).toFixed(2) : '—', h('small', null, canPublish(p.rating) ? w.outOf : w.empty))),
            feathers(p.rating, p.onRating, w.rating, true)),
          h('div', {className:'lf-rating-recommendation'}, h('p', null, w.recommend), h('div', null, [['yes',w.yes],['no',w.no]].map(function (item) {
            return h('button', {key:item[0], type:'button', 'aria-pressed':p.recommendation === item[0], onClick:function () { p.onRecommend(p.recommendation === item[0] ? null : item[0]); }}, icon('ThumbsUp',{className:item[0] === 'no' ? 'is-flipped' : ''}), item[1]);
          }))),
          h('section', {className:'lf-rating-writing'},
            h('label', {htmlFor:'lf-rating-text'}, w.review, h('small', null, w.optional)),
            h('textarea', {id:'lf-rating-text', dir:'auto', rows:3, value:text, placeholder:w.placeholder, maxLength:limit, onChange:function (event) { if (!isCurrent()) return; p.textRef.current = event.target.value; setText(event.target.value); }}),
            h('div', {className:'lf-rating-writing-meta'}, h('label', {className:'lf-rating-spoiler'}, h('input', {type:'checkbox', checked:p.spoiler, onChange:function (event) { p.onSpoiler(event.target.checked); }}), w.spoiler), h('span', {dir:'ltr'}, text.length+' / '+limit))),
          h('details', {className:'lf-rating-details'}, optionalTitle(w.details), h('div', {className:'lf-rating-metrics'}, p.fields.map(function (field) {
            return h('div', {key:field.k, className:'lf-rating-metric'}, h('div', null, h('span', null, label(field.l)), h('output', null, p.ratings[field.k] ? Number(p.ratings[field.k]).toFixed(2) : '—')), feathers(p.ratings[field.k] || 0, function (value) { p.onMetric(field.k,value); },label(field.l)));
          }))),
          h('details', {className:'lf-rating-extras'}, optionalTitle(w.extras),
            h('label', {htmlFor:'lf-rating-moment'}, w.moment), h('textarea', {id:'lf-rating-moment', dir:'auto', rows:2, value:moment, maxLength:1000, placeholder:w.momentPlaceholder, onChange:function (event) { if (!isCurrent()) return; p.momentRef.current = event.target.value; setMoment(event.target.value); }}),
            h('div', {className:'lf-rating-images'}, h('p', null, w.images), p.images.map(function (url,index) { return h('div', {key:index}, h('img', {src:url, alt:''}), h('button', {type:'button', 'aria-label':w.remove, onClick:function () { p.onRemoveImage(index); }}, icon('X'))); }),
              p.premium && p.images.length < 10 ? h('label', {className:'lf-rating-attach'}, icon('Plus'), h('span', null, w.attach), h('input', {type:'file', accept:'image/*', onChange:p.onUpload})) : !p.premium && h('button', {type:'button', onClick:p.onPaywall}, icon('Lock'), w.premium)),
            h('div', {className:'lf-rating-ranking', 'data-lf-review-ranking':'', 'aria-label':w.characters}))),
        h('footer', {className:'lf-rating-footer'}, error && h('p', {role:'alert'}, error), h('button', {type:'button', disabled:busy || !canPublish(p.rating), onClick:publish}, busy ? w.publishing : p.completeOnPublish ? w.publishComplete : w.publish))));
  };
})(typeof window !== 'undefined' ? window : this);

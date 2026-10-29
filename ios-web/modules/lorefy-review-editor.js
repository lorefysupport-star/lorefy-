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
  function isDislike(value, recommendation) { return value === 0 && (recommendation === 'no' || recommendation === false); }
  function canPublish(value, recommendation) { return isDislike(value,recommendation) || typeof value === 'number' && Number.isFinite(value) && value >= 0.25 && value <= 5; }
  function localDislikeCount(rows, workId, ownerId) {
    var latest=new Map();
    (rows||[]).forEach(function(row){
      if(!row || String(row.mid)!==String(workId))return;
      var user=row.userId==='me' ? ownerId||'me' : row.userId;
      if(!user)return;
      var old=latest.get(user);
      if(!old || (Number(row.ts)||0)>(Number(old.ts)||0))latest.set(user,row);
    });
    return Array.from(latest.values()).filter(function(row){return row.is_public!==false && isDislike(row.r,row.recVal||row.rec);}).length;
  }
  function ratingValue(index, part) { return Math.min(5, Math.max(0.25, index + ([0.25,0.5,0.75,1].includes(part) ? part : 1))); }
  function savedDraft(review) {
    review = review || {};
    var recommendation=review.recVal || (review.rec === true ? 'yes' : isDislike(review.r,review.rec) ? 'no' : null);
    if(recommendation==='no'&&!canPublish(review.r,'no'))recommendation=null;
    return {rating:Math.max(0,Math.min(5,Number(review.r)||0)),text:review.txt === '—' ? '' : String(review.txt || ''),
      ratings:Object.assign({story:0,art:0,chars:0,world:0},review.ratings || {}),
      images:Array.isArray(review.imgs) ? review.imgs.slice() : [],moment:String(review.moment || ''),
      spoiler:!!review.spoiler,recommendation:recommendation};
  }
  root.LorefySavedReviewDraft = savedDraft;
  root.LorefyCanPublishReview = canPublish;
  if (typeof module === 'object' && module.exports) module.exports = { copy:copy, canPublish:canPublish, isDislike:isDislike, localDislikeCount:localDislikeCount, ratingValue:ratingValue, formatLabel:formatLabel, savedDraft:savedDraft };

  root.LorefyWorkDislikes = function WorkDislikes(p) {
    var R=root.React,h=R.createElement,backend=root.LorefyBackend,owner=backend&&backend.user&&backend.user.id;
    var live=!!(backend&&backend.mode==='live'),workId=String(p.workId||''),en=p.language==='en';
    var context=[live,owner,backend&&backend._communityEpoch].join(':'),state=R.useState(null),result=state[0],setResult=state[1];
    var revision=JSON.stringify((p.reviews||[]).filter(function(row){return String(row.mid)===workId;}).map(function(row){return [row.id,row.r,row.recVal];}));
    var retryRef=R.useRef(null);
    R.useEffect(function(){
      if(!live)return;
      var active=true,sequence=0,client=backend.client,epoch=backend._communityEpoch;
      function current(){
        try{return active&&backend===root.LorefyBackend&&backend.mode==='live'&&backend.user&&backend.user.id===owner&&backend.client===client&&backend._communityEpoch===epoch&&(!root.localStorage.getItem('lorefy.activeUser.v1')||root.localStorage.getItem('lorefy.activeUser.v1')===owner);}catch(_){return false;}
      }
      async function load(){
        var request=++sequence;
        if(!current())return;
        setResult({workId:workId,context:context,count:null,failed:false});
        try{
          if(!backend.countWorkDislikes)throw new Error('Count is unavailable');
          var count=await backend.countWorkDislikes(workId);
          if(!Number.isSafeInteger(count)||count<0)throw new Error('Count is unavailable');
          if(current()&&request===sequence)setResult({workId:workId,context:context,count:count,failed:false});
        }catch(_){if(current()&&request===sequence)setResult({workId:workId,context:context,count:null,failed:true});}
      }
      retryRef.current=load;load();
      if(root.addEventListener)root.addEventListener('lorefy:community-refresh',load);
      return function(){active=false;retryRef.current=null;if(root.removeEventListener)root.removeEventListener('lorefy:community-refresh',load);};
    },[workId,context,backend,revision]);
    var matching=result&&result.workId===workId&&result.context===context;
    var count=live?(matching?result.count:null):localDislikeCount(p.reviews,workId,owner),failed=live&&matching&&result.failed;
    var icons=root.NenIcons||{};
    return h('div',{className:'lf-work-dislikes','aria-live':'polite','aria-label':en?'Public work dislikes':'عدم الإعجاب بالعمل في المراجعات العامة'},
      icons.ThumbsDown&&h(icons.ThumbsDown,{size:16,'aria-hidden':true}),h('strong',{'data-work-dislike-count':'',dir:'ltr'},count===null?'—':String(count)),
      h('span',null,en?'Dislikes':'عدم إعجاب'),failed&&h('button',{type:'button',title:en?'Retry dislike count':'إعادة تحميل عدد عدم الإعجاب','aria-label':en?'Retry dislike count':'إعادة تحميل عدد عدم الإعجاب',onClick:function(){retryRef.current&&retryRef.current();}},icons.RotateCw?h(icons.RotateCw,{size:16,'aria-hidden':true}):(en?'Retry':'إعادة المحاولة')));
  };

  root.LorefyWorkHeroMedia = function WorkHeroMedia(p) {
    var R=root.React,h=R.createElement,name=p.language==='en'?'Retry artwork':'إعادة تحميل صورة العمل';
    return h(root.LorefyCoverMedia,{src:p.src,fallback:p.fallback,workId:p.workId,language:p.language,alt:'',loading:'eager',fetchPriority:'high',render:function(surface,retry){
      return h(R.Fragment,null,h('span',{className:'lf-work-hero-art','aria-hidden':true},surface),retry&&R.cloneElement(retry,{className:'lf-cover-retry lf-work-hero-retry','aria-label':name,title:name}));
    }});
  };

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
      root.LorefyCoverMedia?h(root.LorefyCoverMedia,{className:'lf-work-poster',src:p.cover,fallback:p.fallback,alt:w.title,workId:w.id,language:p.language}):h('img',{className:'lf-work-poster',src:p.cover,alt:w.title,decoding:'async',onError:p.onError,'data-fallback':p.fallback}),
      h('div',{className:'lf-work-copy'},
        h('p',{className:'lf-work-format'},[formatLabel(w.type,p.language),w.yr].filter(Boolean).join(' · ')),
        h('div',{className:'lf-work-title-line'},h('h1',{dir:'auto','data-no-translate':'1'},w.title)),
        p.subtitle && h('p',{className:'lf-work-subtitle',dir:'auto',title:p.subtitle,'data-no-translate':'1'},p.subtitle),
        h('div',{className:'lf-work-rating','aria-label':english?'Work rating':'تقييم العمل'},feather&&h(feather,{size:20,'aria-hidden':true}),h('strong',{className:'lf-work-rating-value'},Number(p.rating)>0?Number(p.rating).toFixed(1):'—'),h('span',{className:'lf-work-rating-caption'},english?'out of 5':'من 5')),
        h(root.LorefyWorkDislikes,{workId:w.id,language:p.language,reviews:p.reviews}),
        p.creator && (root.LorefyProductCore && root.LorefyProductCore.authorWorks([w],p.creator).length
          ? h('button',{type:'button',className:'lf-work-creator lf-work-author-button',title:p.creator,'data-no-translate':'1',onClick:function(){ root.LorefyProductTools.openAuthor(p.creator); },'aria-label':(english?'Works by ':'أعمال ')+p.creator},h('span',{className:'lf-work-author-name',dir:'auto','data-no-translate':'1'},p.creator),root.NenIcons && h(english?root.NenIcons.ChevronRight:root.NenIcons.ChevronLeft,{size:14,'aria-hidden':true}))
          : h('p',{className:'lf-work-creator',dir:'auto',title:p.creator,'data-no-translate':'1'},p.creator))),
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
    var viewState=R.useState('write'),view=viewState[0],setView=viewState[1];
    var host = R.useRef(null), closeButton = R.useRef(null), busyRef = R.useRef(false);
    var limit = p.premium ? 4000 : 750;
    var isCurrent = function () { return !p.isCurrent || p.isCurrent(); };
    var disliked=isDislike(p.rating,p.recommendation),valid=canPublish(p.rating,p.recommendation);
    function pickRating(value){if(!isCurrent())return;if(value>0&&p.recommendation==='no')p.onRecommend(null);p.onRating(value);}
    function pickRecommendation(value){
      if(!isCurrent()||busyRef.current)return;
      if(value==='no'){p.onRating(0);p.onRecommend(disliked?null:'no');}
      else p.onRecommend(p.recommendation==='yes'?null:'yes');
    }
    var icon = function (name, props) { var component=p.icons[name]||root.NenIcons&&root.NenIcons[name];return component ? h(component, Object.assign({size:18, 'aria-hidden':true}, props || {})) : null; };
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
      if (!isCurrent() || busyRef.current || !canPublish(p.rating,p.recommendation)) return;
      busyRef.current = true; setBusy(true); setError('');
      try { if (await p.onPublish() === false && isCurrent()) setError(w.failure); }
      catch (e) { if (isCurrent()) setError(w.failure); }
      finally { busyRef.current = false; if (isCurrent()) setBusy(false); }
    }
    function optionalTitle(title) { return h('summary', null, h('span', null, title), h('small', null, w.optional)); }
    return h('div', {className:'nc-fade lf-review-editor-overlay', 'data-no-translate':'1', dir:english ? 'ltr' : 'rtl'},
      h('button', {className:'lf-rating-scrim', tabIndex:-1, 'aria-label':w.close, disabled:busy, onClick:p.onClose}),
      h('section', {ref:host, className:'nc-sheet lf-rating-sheet lf-review-studio', 'data-review-mid':String(p.work.id), role:'dialog', 'aria-modal':true, 'aria-labelledby':'lf-rating-title'},
        h('div', {className:'lf-rating-handle', 'aria-hidden':true}),
        h('header', {className:'lf-rating-header'}, h('h2', {id:'lf-rating-title'}, w.title), h('button', {ref:closeButton, type:'button', title:w.close, 'aria-label':w.close, disabled:busy, onClick:p.onClose}, icon('X'))),
        h('div', {className:'lf-rating-body'},
          h('div', {className:'lf-rating-work'}, h(root.LorefyCoverMedia,{className:'lf-review-mini-cover',src:p.cover,fallback:p.fallback,alt:p.work.title,workId:p.work.id,language:p.language}), h('div', null, h('span', null, formatLabel(p.work.type,p.language)), h('h3', null, p.work.title), h('p', null, [p.work.auth,p.work.yr].filter(Boolean).join(' · ')))),
          h('section', {className:'lf-rating-primary', 'aria-label':w.rating},
            h('div', {className:'lf-rating-heading'}, h('h3', null, w.rating), h('output', {className:'lf-rating-number', 'aria-live':'polite'}, root.NenIcons && root.NenIcons.Feather && h(root.NenIcons.Feather,{size:24,'aria-hidden':true}), valid ? Number(p.rating).toFixed(2) : '—', h('small', null, disliked?(english?'Dislike · 0 out of 5':'عدم إعجاب · صفر من 5'):valid?w.outOf:w.empty))),
            h('div',{className:'lf-review-score-controls'},h('button',{type:'button','aria-label':english?'Decrease rating':'خفض التقييم',title:english?'Decrease rating':'خفض التقييم',disabled:busy||p.rating<=0,onClick:function(){pickRating(Math.max(0,p.rating-.25));}},icon('Minus')),feathers(p.rating, pickRating, w.rating, true),h('button',{type:'button','aria-label':english?'Increase rating':'زيادة التقييم',title:english?'Increase rating':'زيادة التقييم',disabled:busy||p.rating>=5,onClick:function(){pickRating(Math.min(5,p.rating+.25));}},icon('Plus')))),
          h('nav',{className:'lf-review-studio-tabs',role:'tablist','aria-label':english?'Review sections':'أقسام المراجعة',onKeyDown:function(event){if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;var buttons=Array.from(event.currentTarget.querySelectorAll('[role=tab]')),i=buttons.indexOf(root.document.activeElement);if(i<0)return;event.preventDefault();var step=event.key===(english?'ArrowRight':'ArrowLeft')?1:-1,next=event.key==='Home'?0:event.key==='End'?2:(i+step+3)%3;buttons[next].click();buttons[next].focus();}},[['write',english?'Your thoughts':'رأيك'],['details',english?'Details':'التفاصيل'],['extras',english?'Extras':'إضافات']].map(function(entry){return h('button',{key:entry[0],type:'button',role:'tab','data-review-view':entry[0],'aria-selected':view===entry[0],tabIndex:view===entry[0]?0:-1,onClick:function(){if(isCurrent())setView(entry[0]);}},entry[1]);})),
          h('div',{className:'lf-review-view',hidden:view!=='write',role:'tabpanel','aria-label':english?'Your thoughts':'رأيك'},
          h('div', {className:'lf-rating-recommendation'}, h('p', null, w.recommend), h('div', null, [['yes',w.yes],['no',w.no]].map(function (item) {
            return h('button', {key:item[0], type:'button', disabled:busy, 'data-review-dislike':item[0]==='no'?'':undefined, 'aria-pressed':item[0]==='no'?disliked:p.recommendation==='yes', onClick:function () { pickRecommendation(item[0]); }}, icon(item[0]==='no'?'ThumbsDown':'ThumbsUp'), item[0]==='no'?(english?'Dislike · 0':'عدم إعجاب · صفر'):item[1]);
          }))),
          h('section', {className:'lf-rating-writing'},
            h('label', {htmlFor:'lf-rating-text'}, w.review, h('small', null, w.optional)),
            h('textarea', {id:'lf-rating-text', dir:'auto', rows:3, value:text, placeholder:w.placeholder, maxLength:limit, onChange:function (event) { if (!isCurrent()) return; p.textRef.current = event.target.value; setText(event.target.value); }}),
            h('div', {className:'lf-rating-writing-meta'}, h('label', {className:'lf-rating-spoiler'}, h('input', {type:'checkbox', checked:p.spoiler, onChange:function (event) { p.onSpoiler(event.target.checked); }}), w.spoiler), h('span', {dir:'ltr'}, text.length+' / '+limit)))),
          h('div',{className:'lf-review-view',hidden:view!=='details',role:'tabpanel','aria-label':w.details},h('details', {className:'lf-rating-details',open:true}, optionalTitle(w.details), h('div', {className:'lf-rating-metrics'}, p.fields.map(function (field) {
            return h('div', {key:field.k, className:'lf-rating-metric'}, h('div', null, h('span', null, label(field.l)), h('output', null, p.ratings[field.k] ? Number(p.ratings[field.k]).toFixed(2) : '—')), feathers(p.ratings[field.k] || 0, function (value) { p.onMetric(field.k,value); },label(field.l)));
          })))),
          h('div',{className:'lf-review-view',hidden:view!=='extras',role:'tabpanel','aria-label':w.extras},h('details', {className:'lf-rating-extras',open:true}, optionalTitle(w.extras),
            h('label', {htmlFor:'lf-rating-moment'}, w.moment), h('textarea', {id:'lf-rating-moment', dir:'auto', rows:2, value:moment, maxLength:1000, placeholder:w.momentPlaceholder, onChange:function (event) { if (!isCurrent()) return; p.momentRef.current = event.target.value; setMoment(event.target.value); }}),
            h('div', {className:'lf-rating-images'}, h('p', null, w.images), p.images.map(function (url,index) { var name=(english?'Review image ':'صورة المراجعة ')+(index+1);return h('div', {key:index+':'+url,className:'lf-rating-attachment'}, h(root.LorefyCoverMedia,{className:'lf-review-attachment-media',src:url,alt:name,kind:'image',workId:p.work.id+':attachment:'+index,language:p.language}), h('button', {type:'button',className:'lf-rating-remove',title:w.remove+' '+(index+1), 'aria-label':w.remove+' '+(index+1), onClick:function () { p.onRemoveImage(index); }}, icon('X'))); }),
              p.premium && p.images.length < 10 ? h('label', {className:'lf-rating-attach'}, icon('Plus'), h('span', null, w.attach), h('input', {type:'file', accept:'image/*', onChange:p.onUpload})) : !p.premium && h('button', {type:'button', onClick:p.onPaywall}, icon('Lock'), w.premium)),
            h('div', {className:'lf-rating-ranking', 'data-lf-review-ranking':'', 'aria-label':w.characters})))),
        h('footer', {className:'lf-rating-footer'}, error && h('p', {role:'alert'}, error), h('button', {type:'button', disabled:busy || !valid, onClick:publish}, busy ? w.publishing : p.completeOnPublish ? w.publishComplete : w.publish))));
  };
})(typeof window !== 'undefined' ? window : this);

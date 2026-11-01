(function(root) {
  'use strict';
  function CoverRequest(p) {
    var R=root.React, h=R.createElement, source=typeof p.src==='string'?p.src.trim():'';
    var missing=!source || !!p.fallback && source===p.fallback;
    var statusState=R.useState(missing?'missing':'loading'), status=statusState[0], setStatus=statusState[1];
    var attemptState=R.useState(0), attempt=attemptState[0], setAttempt=attemptState[1];
    var image=R.useRef(null), statusRef=R.useRef(status), generation=R.useRef(0);
    var en=p.language==='en', picture=p.kind==='image', Icon=root.NenIcons||{};
    R.useEffect(function() {
      if(missing)return;
      var img=image.current, active=true, token=generation.current, timer=null, observer=null;
      if(!img)return;
      function current(){return active && generation.current===token && image.current===img;}
      function release(keepListeners){
        if(timer!==null){root.clearTimeout(timer);timer=null;}
        if(observer){observer.disconnect();observer=null;}
        if(!keepListeners){img.removeEventListener('load',loaded);img.removeEventListener('error',failed);}
      }
      function settle(next,soft){
        if(!current() || statusRef.current==='ready' || statusRef.current==='missing')return;
        var changed=statusRef.current!==next;
        statusRef.current=next;release(soft);if(changed)setStatus(next);
      }
      function loaded(){if(img.naturalWidth>0)settle('ready');else settle('error');}
      function failed(){settle('error');}
      function arm(){if(current() && timer===null && statusRef.current==='loading')timer=root.setTimeout(function(){settle('error',true);},5500);}
      img.addEventListener('load',loaded);img.addEventListener('error',failed);
      if(img.complete){if(img.naturalWidth>0)loaded();else failed();}
      else if(p.loading==='lazy' && root.IntersectionObserver){
        observer=new root.IntersectionObserver(function(entries){
          if(entries.some(function(entry){return entry.isIntersecting;})){if(observer){observer.disconnect();observer=null;}arm();}
        },{rootMargin:'240px'});observer.observe(img);
      }else arm();
      return function(){active=false;release();};
    },[attempt]);
    function retry(event){
      event.preventDefault();event.stopPropagation();
      if(statusRef.current!=='error')return;
      generation.current++;statusRef.current='loading';setStatus('loading');setAttempt(function(n){return n+1;});
    }
    var message=picture?(status==='loading'?(en?'Loading image':'جارٍ تحميل الصورة'):status==='missing'?(en?'No image':'لا توجد صورة'):(en?'Image unavailable':'تعذر تحميل الصورة')):(status==='loading'?(en?'Loading cover':'جارٍ تحميل الغلاف'):status==='missing'?(en?'No cover':'لا يوجد غلاف'):(en?'Cover unavailable':'تعذر تحميل الغلاف'));
    var retryName=picture?(en?'Retry image':'إعادة تحميل الصورة'):(en?'Retry cover':'إعادة تحميل الغلاف'),Placeholder=picture?Icon.Image:Icon.BookOpen;
    var surface=h('span',{className:'lf-cover-surface',style:{'--lf-cover-fit':p.fit||'cover'},'data-cover-state':status,'aria-busy':status==='loading',role:status==='ready'?undefined:'img','aria-label':status==='ready'?undefined:message},
      !missing&&h('img',{key:attempt,ref:image,className:'lf-cover-image',src:source,alt:p.alt||'',loading:p.loading||'eager',fetchPriority:p.fetchPriority,decoding:'async',referrerPolicy:'no-referrer','aria-hidden':status==='ready'?undefined:true,'data-lorefy-cover-managed':'1'}),
      status!=='ready'&&h('span',{className:'lf-cover-message','aria-hidden':true,'data-no-translate':'1'},Placeholder&&h(Placeholder,{size:22,'aria-hidden':true}),h('span',null,message)));
    var action=status==='error'&&h('button',{type:'button',className:'lf-cover-retry',onClick:retry,'data-no-translate':'1','aria-label':retryName,title:retryName},Icon.RotateCw?h(Icon.RotateCw,{size:18,'aria-hidden':true}):h('span',null,en?'Retry':'إعادة'));
    return p.render?p.render(surface,action):h('span',{className:'lf-cover-wrap '+(p.className||'')},surface,action);
  }
  root.LorefyCoverMedia=function CoverMedia(p){
    return root.React.createElement(CoverRequest,Object.assign({},p,{key:JSON.stringify([p.workId,p.src,p.fallback])}));
  };
  // Imperative portraits belong to the legacy character page, not a React root.
  root.LorefyPortraitMedia={mount:function(wrap,p){
    var doc=root.document,source=typeof p.src==='string'?p.src.trim():'',active=true,token=0,img=null,timer=null,observer=null,state=source?'loading':'missing',retried=false;
    var en=p.language==='en',name=p.alt||'',label=doc.createElement('span'),status=doc.createElement('span'),retry=doc.createElement('button');
    label.className='lf-character-initial';label.textContent=p.initials||'?';label.setAttribute('aria-hidden','true');
    status.className='lf-portrait-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('data-no-translate','1');
    retry.className='lf-portrait-retry';retry.type='button';retry.setAttribute('data-no-translate','1');
    var retryName=(en?'Retry image for ':'إعادة تحميل صورة ')+name;retry.setAttribute('aria-label',retryName);retry.title=retryName;
    var icon=doc.createElement('i');icon.setAttribute('data-lucide','rotate-cw');icon.setAttribute('aria-hidden','true');retry.appendChild(icon);
    wrap.setAttribute('data-lorefy-portrait','1');wrap.appendChild(label);wrap.appendChild(status);if(p.retry!==false)(p.retryHost||wrap).appendChild(retry);
    function release(keepListeners){if(timer!==null){root.clearTimeout(timer);timer=null}if(observer){observer.disconnect();observer=null}if(img&&!keepListeners){img.removeEventListener('load',loaded);img.removeEventListener('error',failed)}}
    function paint(next){
      if(!active)return;state=next;wrap.setAttribute('data-portrait-state',state);wrap.setAttribute('aria-busy',String(state==='loading'));
      label.hidden=state==='ready';retry.hidden=state!=='error'&&!(state==='loading'&&retried);retry.setAttribute('aria-disabled',String(state!=='error'));
      status.textContent=state==='ready'?'':(state==='loading'?(en?'Loading image':'جارٍ تحميل الصورة'):state==='missing'?(en?'No image':'لا توجد صورة'):(en?'Image unavailable':'تعذر تحميل الصورة'))+(name?' · '+name:'');
      if(img)img.setAttribute('aria-hidden',String(state!=='ready'));
    }
    function settle(next,soft){if(!active||state==='ready'||state==='missing')return;var focused=doc.activeElement===retry,changed=state!==next;release(soft);if(changed)paint(next);if(next==='ready'&&focused){var edit=wrap.querySelector('.lf-character-image-edit')||(p.focusTarget&&p.focusTarget());if(edit)edit.focus()}}
    var loaded,failed;
    function request(){
      release();if(img)img.remove();var current=++token;paint('loading');img=doc.createElement('img');
      img.alt=name;img.loading=p.loading||'lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.setAttribute('data-lorefy-cover-managed','1');img.setAttribute('aria-hidden','true');
      if(p.shareSrc)img.setAttribute('data-share-src',p.shareSrc);
      loaded=function(){if(active&&token===current)settle(img.naturalWidth>0?'ready':'error')};failed=function(){if(active&&token===current)settle('error')};
      img.addEventListener('load',loaded);img.addEventListener('error',failed);wrap.insertBefore(img,label);img.src=source;
      function arm(){if(active&&token===current&&state==='loading'&&timer===null)timer=root.setTimeout(function(){if(token===current)settle('error',true)},5500)}
      if(img.complete){loaded();return}
      if(img.loading==='lazy'&&root.IntersectionObserver){observer=new root.IntersectionObserver(function(entries){if(entries.some(function(entry){return entry.isIntersecting})){if(observer){observer.disconnect();observer=null}arm()}},{rootMargin:'240px'});observer.observe(img)}else arm();
    }
    function onRetry(event){event.preventDefault();event.stopPropagation();if(!active||state!=='error')return;retried=true;request()}
    retry.addEventListener('click',onRetry);if(source)request();else paint('missing');
    return{dispose:function(remove){if(!active)return;active=false;token++;release();retry.removeEventListener('click',onRetry);if(remove){if(img)img.remove();label.remove();status.remove();retry.remove()}}};
  }};
})(typeof window!=='undefined'?window:this);

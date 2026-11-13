(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.LorefyContinuity = api; api.runtime = api.mount(root); }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var EASE = 'cubic-bezier(.22,1,.36,1)';
  function flip(from, to) {
    if (!from || !to || ![from.x,from.y,from.width,from.height,to.x,to.y,to.width,to.height].every(Number.isFinite) ||
        Math.min(from.width,from.height,to.width,to.height) <= 0) return null;
    return {transform:'translate3d('+(from.x-to.x)+'px,'+(from.y-to.y)+'px,0) scale('+(from.width/to.width)+','+(from.height/to.height)+')',transformOrigin:'0 0'};
  }
  function reduced(env) {
    return env.document.hidden || env.document.documentElement.getAttribute('data-lorefy-motion') === 'reduced' ||
      !!(env.matchMedia && env.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function animator(env) {
    var active = new Map();
    function cancel(node) { var record=active.get(node); if(record)record.finish(true); }
    function play(node, keys, duration, cleanup) {
      cancel(node);
      if (reduced(env) || !node.isConnected || !node.animate) { if(cleanup)cleanup(); return; }
      var animation, done=false;
      function finish() {
        if(done)return;done=true;active.delete(node);
        if(animation)animation.cancel();
        if(cleanup)cleanup();
      }
      try {
        animation=node.animate(keys,{duration:Math.min(280,duration),easing:EASE,fill:'none'});
        active.set(node,{finish:finish});animation.finished.then(finish,finish);
      } catch(error) { finish(); }
    }
    return {play:play,cancel:cancel,clear:function(){Array.from(active.values()).forEach(function(r){r.finish(true);});},size:function(){return active.size;}};
  }
  function mount(env) {
    var doc=env.document;
    if(!doc || !env.MutationObserver || !env.requestAnimationFrame || doc.documentElement.hasAttribute('data-lf-continuity'))return;
    doc.documentElement.setAttribute('data-lf-continuity','ready');
    var motion=animator(env), pending=null, raf=0, expiry=0, observer=null, pill=null;
    var surfaceSelector='[role="dialog"],.lf-settings-sheet,.lf-community-compose-sheet > section,[role="menu"]';
    var groupSelector='.lf-bottom-nav,.lf-profile-section-tabs,.lf-community-tabs,.lf-explore-tabs,.lf-library-tabs,[role="tablist"]';
    function visible(node) {
      if(!node || !node.isConnected)return false;
      var r=node.getBoundingClientRect();
      return r.width>0 && r.height>0 && r.bottom>0 && r.right>0 && r.top<env.innerHeight && r.left<env.innerWidth;
    }
    function selected(group) { return group && group.querySelector('[aria-selected="true"],[aria-current="page"],.is-active'); }
    function painted(node) {var bg=node&&env.getComputedStyle(node).backgroundColor;return bg && bg!=='transparent' && bg!=='rgba(0, 0, 0, 0)';}
    function pillNode(node) {var icon=node?.querySelector('.lf-nav-icon');return node && (!painted(node)&&painted(icon)?icon:node);}
    function rect(node) { var r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}; }
    function image(node) {
      if(!node)return null;
      var img=node.matches('img')?node:node.querySelector('img.lf-cover-image,img');
      return img && visible(img) && img.complete && img.naturalWidth>0 ? {src:img.currentSrc||img.src,rect:rect(img),node:img} : null;
    }
    function stopWatching() {
      if(observer)observer.disconnect();observer=null;
      if(raf)env.cancelAnimationFrame(raf);raf=0;
      if(expiry)env.clearTimeout(expiry);expiry=0;pending=null;
    }
    function clear() {stopWatching();motion.clear();pill=null;}
    function fly(source,target) {
      var to=image(target),delta=to && source && source.src===to.src && flip(source.rect,to.rect);
      if(!delta)return;
      // Reuse a decoded cover URL; never clone a screen or preload another asset.
      var ghost=doc.createElement('img');ghost.src=source.src;ghost.alt='';ghost.setAttribute('aria-hidden','true');
      ghost.className='lf-continuity-cover';
      Object.assign(ghost.style,{left:to.rect.x+'px',top:to.rect.y+'px',width:to.rect.width+'px',height:to.rect.height+'px'});
      doc.body.appendChild(ghost);
      motion.play(ghost,[Object.assign({opacity:1},delta),{transform:'translate3d(0,0,0) scale(1,1)',transformOrigin:'0 0',opacity:1},{transform:'translate3d(0,0,0) scale(1,1)',transformOrigin:'0 0',opacity:0}],260,function(){ghost.remove();});
    }
    function movePill(state) {
      var selection=selected(state.group),current=state.icon?selection?.querySelector('.lf-nav-icon'):selection;
      if(!visible(current) || current===state.selected || !state.paint)return false;
      var destination=rect(current),delta=flip(state.rect,destination);
      if(!delta)return false;
      if(pill)motion.cancel(pill.node);
      var group=state.group,host=group.getBoundingClientRect(),ghost=doc.createElement('span');
      ghost.className='lf-continuity-pill';ghost.setAttribute('aria-hidden','true');
      group.setAttribute('data-lf-moving-pill','');current.setAttribute('data-lf-pill-target','');
      Object.assign(ghost.style,state.paint,{left:(destination.x-host.x+group.scrollLeft)+'px',top:(destination.y-host.y+group.scrollTop)+'px',width:destination.width+'px',height:destination.height+'px'});
      group.appendChild(ghost);pill={node:ghost,paint:state.paint};
      motion.play(ghost,[delta,{transform:'translate3d(0,0,0) scale(1,1)',transformOrigin:'0 0'}],230,function(){
        ghost.remove();current.removeAttribute('data-lf-pill-target');group.removeAttribute('data-lf-moving-pill');if(pill?.node===ghost)pill=null;
      });
      return true;
    }
    function inspect() {
      raf=0;var state=pending;if(!state)return;
      var screen=doc.querySelector('.nc-screen'),changed=screen && screen!==state.screen;
      if(changed) {
        var sign=state.back?-1:1;
        if(state.navDelta)sign=state.navDelta;
        else if(doc.documentElement.dir==='rtl')sign=-sign;
        if(state.cover) {
          var target=screen.querySelector('.lf-work-poster img');
          if(state.back)target=Array.from(screen.querySelectorAll('.lf-managed-cover-card img.lf-cover-image,button img.lf-cover-image')).find(function(n){return visible(n)&&(n.currentSrc||n.src)===state.cover.src;});
          fly(state.cover,target);
        }
        motion.play(screen,[{opacity:.65,translate:(sign*12)+'px 0'},{opacity:1,translate:'0 0'}],180);
      }
      var moved=state.group && movePill(state);
      var searchMoved=false;
      if(state.search) {
        var search=doc.querySelector('.lf-search-box:has(input[type="search"]),input[type="search"]');
        if(visible(search)) {
          var searchRect=rect(search),searchFlip=flip(state.search,searchRect);
          searchMoved=!!searchFlip && (Math.abs(state.search.y-searchRect.y)>1 || Math.abs(state.search.x-searchRect.x)>1);
          if(searchMoved)motion.play(search,[searchFlip,{transform:'translate3d(0,0,0) scale(1,1)',transformOrigin:'0 0'}],200);
        }
      }
      var opened=Array.from(doc.querySelectorAll(surfaceSelector)).find(function(n){return !state.surfaces.has(n)&&visible(n);});
      if(opened) {
        var r=opened.getBoundingClientRect(),origin=state.anchor;
        if(opened.matches('[role="menu"]')) {
          var x=origin?Math.max(0,Math.min(r.width,origin.x+origin.width/2-r.x)):r.width/2;
          var y=origin?Math.max(0,Math.min(r.height,origin.y+origin.height/2-r.y)):0;
          motion.play(opened,[{opacity:0,scale:'.96',transformOrigin:x+'px '+y+'px'},{opacity:1,scale:'1',transformOrigin:x+'px '+y+'px'}],160);
        } else motion.play(opened,[{opacity:.65,translate:'0 18px'},{opacity:1,translate:'0 0'}],220);
      }
      if(changed || moved || opened || searchMoved)stopWatching();
    }
    function schedule() {if(!raf)raf=env.requestAnimationFrame(inspect);}
    function arm(target,control) {
      stopWatching();if(reduced(env))return;
      var screen=doc.querySelector('.nc-screen');if(!screen)return;
      var group=control && control.closest(groupSelector),chosen=pillNode(selected(group));
      var oldRect=chosen&&visible(chosen)?rect(chosen):null;
      var style=oldRect&&env.getComputedStyle(chosen),paint=painted(chosen)?{background:style.backgroundColor,borderRadius:style.borderRadius,boxShadow:style.boxShadow}:null;
      if(!paint && oldRect && group.matches('.lf-bottom-nav'))paint={background:style.getPropertyValue('--ui-selected'),borderRadius:style.borderRadius,boxShadow:'none'};
      // Retarget rapid selection changes from the capsule's on-screen position.
      if(pill && group && pill.node.parentElement===group){oldRect=rect(pill.node);paint=pill.paint;}
      motion.clear();
      var back=!!(control && (control.matches('.lf-navigation-back') || /^(Back|رجوع)$/.test(control.getAttribute('aria-label')||'')));
      var coverHost=target.closest('.lf-cover-open')?.parentElement || target.closest('[data-work-title],.lf-work-poster') || control?.querySelector('img.lf-cover-image');
      var nav=control?.closest('.lf-nav-item'),active=selected(doc.querySelector('.lf-bottom-nav'));
      pending={screen:screen,back:back,cover:back?image(screen.querySelector('.lf-work-poster')):image(coverHost),
        group:oldRect?group:null,selected:chosen,rect:oldRect,anchor:control&&rect(control),
        paint:paint,icon:chosen?.classList.contains('lf-nav-icon'),
        navDelta:nav&&active?Math.sign(nav.getBoundingClientRect().x-active.getBoundingClientRect().x):0,
        search:target.matches('input[type="search"]')?rect(target.closest('.lf-search-box')||target):null,
        surfaces:new Set(doc.querySelectorAll(surfaceSelector))};
      observer=new env.MutationObserver(schedule);
      observer.observe(doc.querySelector('.lf-app')||doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-selected','aria-current','class']});
      expiry=env.setTimeout(stopWatching,650);schedule();
    }
    function activate(event) {
      var target=event.target;
      if(!target?.closest || target.closest('.lf-continuity-cover,.lf-continuity-pill'))return;
      var control=target.closest('button,a,[role="tab"],[role="button"],input[type="checkbox"]');
      if(!control || control.disabled || control.getAttribute('aria-disabled')==='true' || !control.closest('.lf-app'))return;
      arm(target,control);
    }
    function focusSearch(event) {
      var target=event.target;
      if(target?.matches('input[type="search"],input[role="searchbox"]') && target.closest('.lf-app'))arm(target,target);
    }
    doc.addEventListener('click', activate, true);
    doc.addEventListener('focusin', focusSearch, true);
    doc.addEventListener('pointerdown',function(event){var surface=event.target.closest?.(surfaceSelector);if(surface)motion.cancel(surface);},true);
    doc.addEventListener('visibilitychange',clear);
    env.addEventListener('pagehide',clear);
    env.addEventListener('resize',clear);
    env.addEventListener('lorefy:motion-change',clear);
    env.addEventListener('lorefy:auth-changed',clear);
    env.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',clear);
    return {clear:clear,active:motion.size,watching:function(){return !!pending;}};
  }
  return {flip:flip,animator:animator,mount:mount};
});

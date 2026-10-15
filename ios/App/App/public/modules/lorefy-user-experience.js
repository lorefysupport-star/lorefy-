(function (root) {
  'use strict';
  function ReaderAvatar(p) {
    var R=root.React,h=R.createElement,src=typeof p.src==='string'?p.src.trim():'';
    var failed=R.useState(null),name=String(p.name || p.username || 'L').trim();
    return h('span',{className:'lf-connection-avatar','aria-hidden':true},
      h('span',{'data-no-translate':true,dir:'auto'},Array.from(name)[0] || 'L'),
      src && failed[0]!==src ? h('img',{src:src,alt:'',loading:'lazy',decoding:'async',onError:function () { failed[1](src); }}) : null);
  }
  function SpoilerGate(p) {
    var R=root.React,h=R.createElement,en=p.language==='en', state=R.useState(false), revealed=p.revealed == null ? state[0] : p.revealed;
    if (!p.spoiler) return h(R.Fragment,null,p.children);
    return h('section',{className:'lf-spoiler-gate','aria-label':en?'Spoiler warning':'تحذير حرق'},
      h('div',{className:'lf-spoiler-notice'},h('span',{className:'lf-spoiler-icon','aria-hidden':true},'!'),
        h('div',null,h('strong',null,en?'This review contains spoilers':'هذه المراجعة تحتوي على حرق'),h('small',null,en?'Story details and images are hidden.':'تفاصيل القصة والصور مخفية.')),
        h('button',{type:'button','aria-expanded':revealed,onClick:function (e) { e.stopPropagation(); if(p.onToggle) p.onToggle(); else state[1](!revealed); }},revealed ? en?'Hide review':'إخفاء المراجعة' : en?'Show review':'إظهار المراجعة')),
      revealed && h('div',{className:'lf-spoiler-content'},p.children));
  }
  function suggestions(work, catalog, options) {
    options=options || {};
    if (!work) return [];
    var identity=options.identity || root.LorefyCatalogIdentity, aliases=Object.assign({},options.aliases || {});
    var feedback=options.feedback || (root.LorefyProductTools ? root.LorefyProductTools.core.recommendations.getFeedback() : {});
    var genres=new Set((work.genres || []).map(function (g) { return String(g).toLowerCase(); }));
    var explicit=new Set((work.related || []).map(String)), scored=[];
    (catalog || []).forEach(function (candidate) {
      if (!candidate || !candidate.id || candidate.type!==work.type || options.eligible && !options.eligible(candidate)) return;
      if (feedback[candidate.id] && feedback[candidate.id].value==='not_interested') return;
      if (identity ? identity.sameWork(work,candidate,aliases) : candidate.id===work.id) return;
      var matches=(candidate.genres || []).filter(function (g) { return genres.has(String(g).toLowerCase()); }).length;
      var author=work.auth && candidate.auth && work.auth===candidate.auth;
      var score=(explicit.has(String(candidate.id))?100:0)+matches*10+(author?8:0);
      if (score) scored.push({work:candidate,score:score});
    });
    scored.sort(function (a,b) { return b.score-a.score || (Number(b.work.pop)||0)-(Number(a.work.pop)||0) || String(a.work.id).localeCompare(String(b.work.id)); });
    var items=scored.slice(0,80).map(function (item) { return Object.assign({},item.work); });
    // Catalog identity already distinguishes adaptations, volumes and series.
    return (identity ? identity.relatedWorks(work,items,aliases) : items).slice(0,12);
  }
  function Recommendations(p) {
    var h=root.React.createElement,en=p.language==='en',items=suggestions(p.work,root.LorefyMangaData,{eligible:p.eligible,aliases:root.LorefyCatalogAliases});
    if (!items.length) return null;
    return h('section',{className:'lf-work-suggestions','aria-label':en?'Similar works':'أعمال مشابهة'},h('h2',null,en?'Similar works':'أعمال مشابهة'),h('p',null,en?'From the same format and your work’s genres.':'من نفس نوع العمل وتصنيفاته.'),
      h('div',{className:'lf-suggestion-rail'},items.map(function (w) { return h('button',{type:'button',key:w.id,onClick:function () { p.onOpen(w); },'aria-label':(en?'Open ':'فتح ')+w.title},h('img',{src:p.cover(w),alt:'',loading:'lazy',onError:p.onCoverError,'data-fallback':p.fallback(w)}),h('strong',{'data-no-translate':'1',dir:'auto'},w.title)); })));
  }
  function reviewKey(review,surface) {
    return [surface,root.LorefyBackend && root.LorefyBackend.user && root.LorefyBackend.user.id || '',review.id,!!review.spoiler,review.txt].join('|');
  }
  var api={ReaderAvatar:ReaderAvatar,reviewKey:reviewKey,SpoilerGate:SpoilerGate,suggestions:suggestions,Recommendations:Recommendations};
  root.LorefyUserExperience=api;
  if (typeof module==='object' && module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

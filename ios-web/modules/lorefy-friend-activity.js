(function (root) {
  'use strict';
  function canonical(id, aliases) {
    var key = String(id || ''), seen = new Set();
    while (aliases && aliases[key] && !seen.has(key)) { seen.add(key); key = String(aliases[key]); }
    return key;
  }
  function derive(reviews, following, options) {
    options = options || {};
    var friends = new Set((following || []).map(String)), hidden = new Set((options.hidden || []).map(String));
    var latest = new Map();
    (reviews || []).forEach(function (review) {
      var user = String(review.userId || review.user_id || ''), workId = canonical(review.mid || review.work_id, options.aliases);
      var rating = Number(review.r == null ? review.rating : review.r), ts = Number(review.ts) || Date.parse(review.created_at);
      if (!friends.has(user) || hidden.has(user) || user === options.owner || user === 'me' || !workId || review.is_public === false || !Number.isFinite(ts) || !Number.isFinite(rating) || rating < .25 || rating > 5) return;
      var key = user + '|' + workId, previous = latest.get(key);
      var row = Object.assign({}, review, {userId:user, mid:workId, r:rating, ts:ts});
      if (!previous || ts > previous.ts || ts === previous.ts && String(row.id) > String(previous.id)) latest.set(key, row);
    });
    var recent = Array.from(latest.values()).sort(function (a,b) { return b.ts-a.ts || String(b.id).localeCompare(String(a.id)); });
    var groups = new Map();
    recent.forEach(function (row) {
      var group = groups.get(row.mid);
      if (!group) { group = {mid:row.mid, count:0, total:0, ts:row.ts}; groups.set(row.mid,group); }
      group.count++; group.total += row.r;
    });
    var popular = Array.from(groups.values()).map(function (group) { group.r = group.total / group.count; return group; })
      .sort(function (a,b) { return b.count-a.count || b.r-a.r || b.ts-a.ts || a.mid.localeCompare(b.mid); });
    return {recent:recent, popular:popular};
  }
  function eligible(work,policy) {
    // These are readers' published ratings, like the feed below, rather than editorial recommendations.
    return !!work && !(policy && (policy.isExcludedWork(work) || policy.isExplicitWork(work) || policy.isAiGeneratedWork(work)));
  }
  function Rails(p) {
    p=Object.assign({},p,{compact:true});
    var R=root.React, h=R.createElement, en=p.language==='en', backend=root.LorefyBackend;
    var owner=String(backend && backend.user && backend.user.id || ''), live=backend && backend.mode==='live';
    var followingKey=(p.following || []).map(String).sort().join('|');
    var reviewKey=(p.reviews || []).map(function (r) { return r.id+':'+r.ts+':'+r.r; }).join('|');
    var state=R.useState({owner:'',rows:[],following:[],loading:live,error:false}), result=state[0], set=state[1];
    var tick=R.useState(0), refresh=tick[0], update=tick[1], version=R.useState(0), bump=version[1];
    var expandedState=R.useState({}), expanded=expandedState[0], expand=expandedState[1];
    R.useEffect(function () {
      function changed() { update(function (n) { return n+1; }); }
      function ingested() { bump(function (n) { return n+1; }); }
      root.addEventListener('lorefy:profile-follow-changed',changed);
      root.addEventListener('lorefy:community-refresh',changed);
      root.addEventListener('lorefy:catalog-ingested',ingested);
      root.addEventListener('lorefy:reader-safety-changed',ingested);
      return function () { root.removeEventListener('lorefy:profile-follow-changed',changed); root.removeEventListener('lorefy:community-refresh',changed); root.removeEventListener('lorefy:catalog-ingested',ingested); root.removeEventListener('lorefy:reader-safety-changed',ingested); };
    },[]);
    R.useEffect(function () {
      if (!live) return;
      var current=true;
      set({owner:owner,rows:[],following:[],loading:true,error:false});
      Promise.resolve().then(function () { return backend.listFriendRatings(); }).then(function (data) {
        if (!current || owner !== String(backend.user && backend.user.id || '')) return;
        set({owner:owner,rows:data.ratings,following:data.followingIds,limited:data.limited,loading:false,error:false});
        var loader=root.LorefyCatalogLoader;
        if (loader && loader.loadWorks) loader.loadWorks(data.ratings.map(function (r) { return r.work_id; })).catch(function () {});
      }).catch(function () { if (current && owner === String(backend.user && backend.user.id || '')) set({owner:owner,rows:[],following:[],loading:false,error:true}); });
      return function () { current=false; };
    },[owner,live,followingKey,reviewKey,refresh]);
    R.useEffect(function () {
      if (!live || !root.LorefyPageRefresh) return;
      var mounted=true;
      var stop=root.LorefyPageRefresh.register('community-friends',async function (context) {
        var data=await backend.listFriendRatings();
        if (!mounted || !context.active() || owner!==String(backend.user && backend.user.id || '')) return false;
        set({owner:owner,rows:data.ratings,following:data.followingIds,limited:data.limited,loading:false,error:false});
        var loader=root.LorefyCatalogLoader;
        if (loader && loader.loadWorks) loader.loadWorks(data.ratings.map(function (row) { return row.work_id; })).catch(function () {});
        return true;
      });
      return function () { mounted=false; stop(); };
    },[owner,live]);
    var valid=!live || result.owner===owner, loading=live && (!valid || result.loading), error=live && valid && result.error;
    var safety=root.LorefyProductTools && root.LorefyProductTools.core.safety;
    var hidden=safety ? safety.getBlockedUsers().concat(safety.getMutedUsers()) : [];
    var data=derive(live ? valid ? result.rows : [] : p.reviews,live ? valid ? result.following : [] : p.following,{owner:owner,hidden:hidden,aliases:root.LorefyCatalogAliases});
    function section(kind,title,rows) {
      var items=rows.map(function (row) { return {row:row,work:p.getWork(row.mid)}; }).filter(function (item) { return eligible(item.work,root.LorefyCatalogPolicy); });
      return h('section',{className:'lf-friend-section','aria-label':title},
        h('header',null,h('h2',null,title),(p.onSeeAll ? items.length>0 : items.length>8) && h('button',{type:'button','aria-expanded':!!expanded[kind],onClick:function () { if(p.onSeeAll){p.onSeeAll(title,items.map(function(item){return item.work;}));return;}expand(function (old) { return Object.assign({},old,{[kind]:!old[kind]}); }); }},expanded[kind] ? en?'Less':'أقل' : en?'See all':'عرض الكل')),
        loading ? h('p',{className:'lf-friend-empty',role:'status'},en?'Loading friends’ ratings…':'جارٍ تحميل تقييمات الأصدقاء…') : error ? h('div',{className:'lf-friend-empty',role:'status'},h('p',null,en?'Could not load friends’ ratings.':'تعذر تحميل تقييمات الأصدقاء.'),h('button',{type:'button',onClick:function () { update(function (n) { return n+1; }); }},en?'Try again':'إعادة المحاولة'))
        : !items.length ? h('p',{className:'lf-friend-empty'},en?'Your friends’ ratings will appear here.':'ستظهر هنا تقييمات الحسابات التي تتابعها.')
        : h('div',{className:'lf-friend-rail'+(expanded[kind]?' is-expanded':''),role:'list'},items.slice(0,expanded[kind]?80:12).map(function (item) {
          var row=item.row,w=item.work, profile=row.profile || {}, name=row.user || profile.name || profile.username || (en?'Reader':'قارئ'), avatar=row.av || profile.avatar;
          return h('article',{key:kind==='recent'?row.userId+'|'+row.mid:row.mid,className:'lf-friend-item',role:'listitem'},
            h('button',{type:'button',className:'lf-friend-cover','aria-label':(en?'Open ':'فتح ')+w.title,onClick:function () { p.onWork(w); }},h('img',{src:p.cover(w),alt:'',loading:'lazy',decoding:'async',onError:p.onCoverError,'data-fallback':p.fallback(w)})),
            kind==='recent' ? h('button',{type:'button',className:'lf-friend-reader','aria-label':(en?'Open profile: ':'فتح حساب: ')+name,onClick:function () { p.onReader({id:row.userId,name:name,un:row.un || profile.username,av:avatar}); }},avatar ? h('img',{src:avatar,alt:'',loading:'lazy',onError:function (e) { e.currentTarget.style.visibility='hidden'; }}) : h('span',{className:'lf-friend-avatar','aria-hidden':true},name.slice(0,1)),h('span',{'data-no-translate':'1',dir:'auto'},name))
            : !p.compact && h('strong',{className:'lf-friend-title','data-no-translate':'1',dir:'auto'},w.title),
            (!p.compact || kind==='recent') && h('div',{className:'lf-friend-score','aria-label':(en?'Rating out of five: ':'التقييم من خمسة: ')+row.r.toFixed(2)},
              p.compact && root.NenIcons && root.NenIcons.Feather ? h(root.NenIcons.Feather,{size:10,'aria-hidden':true}) : h('span',{className:'lf-friend-feathers','aria-hidden':true},h(p.Stars,{n:row.r,size:10})),
              h('b',{className:'lf-friend-score-value','data-no-translate':'1',dir:'ltr'},Number(row.r.toFixed(2)))),
            kind==='popular' && !p.compact && h('small',null,en?row.count+' friend'+(row.count===1?'':'s'):row.count+' من الأصدقاء'));
        })));
    }
    return h('div',{className:'lf-friend-activity'+(p.compact?' is-compact':''),dir:en?'ltr':'rtl'},p.showRecent!==false && section('recent',en?'New from friends':'جديد تقييمات الأصدقاء',data.recent),p.showPopular!==false && section('popular',en?'Popular with friends':'شائع بين أصدقائك',data.popular),live && result.limited && h('small',{className:'lf-friend-sample'},en?'Based on recent ratings from accounts you follow.':'حسب أحدث تقييمات الحسابات التي تتابعها.'));
  }
  var api={canonical:canonical,derive:derive,eligible:eligible,Rails:Rails};
  root.LorefyFriendActivity=api;
  if (typeof module==='object' && module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

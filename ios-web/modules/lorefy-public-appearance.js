(function(root,factory){
  var api=factory(root,typeof module==='object'&&module.exports?require('./lorefy-design-system.js'):root.LorefyDesignSystem);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LorefyPublicAppearance=api;
})(typeof window!=='undefined'?window:this,function(root,design){
  'use strict';
  var aliases={'مانجا':'Manga','مانهوا':'Manhwa','مانهوا صيني':'Manhua','كوميكس':'Comics','كتاب':'Book','رواية':'Novel','لايت نوفل':'Light Novel','ويب نوفل':'Web Novel'};
  var types=['Manga','Manhwa','Manhua','Comics','Book','Novel','Light Novel','Web Novel'];
  function format(value){return types.includes(value)?value:aliases[value]||'';}
  function normalize(profile){
    design=design||root.LorefyDesignSystem;
    profile=profile||{};
    var position=Number(profile.banner_position);
    return {theme:design.normalizeMode(profile.theme),library_view:['spines','shelf'].includes(profile.library_view)?profile.library_view:'grid',
      banner_position:Number.isFinite(position)?Math.max(0,Math.min(100,position)):50,favorite_type:format(profile.favorite_type)};
  }
  function favoriteType(profile,workById){
    if(format(profile.favorite_type))return format(profile.favorite_type);
    var counts={};
    new Set(Object.keys(profile.library_entries||{}).concat(profile.favorite_work_ids||[])).forEach(function(id){var work=workById(id),type=format(work&&work.type);if(type)counts[type]=(counts[type]||0)+1;});
    return Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]||types.indexOf(a)-types.indexOf(b);})[0]||'';
  }
  function style(profile){
    var mode=normalize(profile).theme;
    var tokens=design.tokens(mode),map={'--apple-bg':'bg','--apple-surface':'surface','--apple-fill':'fill','--apple-label':'ink','--apple-label-2':'muted','--apple-label-3':'muted','--apple-separator-soft':'line','--apple-blue-pressed':'action-pressed',
      '--lf-bg':'bg','--lf-card':'surface','--lf-border':'line','--lf-text':'ink','--lf-sub':'muted','--lf-accent':'action','--lf-reader-bg':'bg','--lf-reader-text':'ink','--lf-reader-border':'line'};
    Object.keys(map).forEach(function(key){tokens[key]=tokens['--ui-'+map[key]];});return tokens;
  }
  function fromState(data,catalog){
    function parse(key,fallback){try{return JSON.parse(data[key]);}catch(_){return fallback;}}
    var profile={library_entries:parse('lorefy.user.library.v2',{}),favorite_work_ids:parse('lorefy.user.favorites.v2',[])};
    var ids=new Set(Object.keys(profile.library_entries||{}).concat(profile.favorite_work_ids||[]).map(String));
    var byId=new Map();
    (catalog||[]).forEach(function(work){var id=String(work.id);if(ids.has(id))byId.set(id,work);});
    if(byId.size<ids.size)return format(parse('lorefy.user.favoriteType.v1',''))||favoriteType(profile,function(id){return byId.get(String(id));});
    return favoriteType(profile,function(id){return byId.get(String(id));});
  }
  return {normalize:normalize,style:style,favoriteType:favoriteType,format:format,fromState:fromState};
});

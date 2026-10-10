(function(root,factory){
  var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  if(!root||!root.document)return;
  var params=new URLSearchParams(root.location.search),id=params.get('qaTester');
  if(!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(root.location.hostname)||params.get('preview')!=='demo'||!root.location.pathname.endsWith('/qa/tester-app.html'))throw Error('Tester lab is local-only');
  var data=root.LorefyTesterData,profile=data.profiles.find(p=>p.id===id);
  if(!profile)throw Error('Unknown tester');
  var original=root.localStorage,scoped=api.createStorage(original,id);
  root.LorefyTesterLab={profile:profile,data:data,storage:scoped,storageFor:other=>api.createStorage(original,other)};
  Object.defineProperty(root,'localStorage',{value:scoped});
  Object.defineProperty(root,'sessionStorage',{value:api.createStorage(root.sessionStorage,id)});
  if(!scoped.getItem('qa.seed.v1')) {
    var seed={
      'lorefy.session.v1':{userId:profile.id,name:profile.name,email:profile.username+'@example.invalid',mode:'demo'},
      'lorefy.identity.v1':{id:profile.id,name:profile.name,un:profile.username,bio:profile.bio,avatar:profile.avatar,banner:profile.banner},
      'lorefy.user.library.v2':profile.library_entries,'lorefy.user.favorites.v2':profile.favorite_work_ids,
      'lorefy.user.profileLayout.v1':profile.profile_layout,'lorefy.user.progress.v2':profile.progress,
      'lorefy.profile.preferenceBoards.v1':{[profile.formats[0]]:profile.top_work_ids},
      'lorefy.user.socials.v2':profile.social_links,'lorefy.ui.lang.v1':params.get('lang')||profile.lang,
      'lorefy.ui.theme.v1':profile.theme,'lorefy.user.following.v1':profile.following_ids,
      'lorefy.user.preferences.v2':{version:2,formats:profile.formats,genres:profile.genres,seedWorkIds:profile.favorite_work_ids,discovery:[],onboardingVersion:2},
      'lorefy.user.privateReviews.v2':data.reviews.map(r=>Object.assign({},r,{userId:r.userId===id?'me':r.userId})),
      'lorefy.customLists.v1':[{id:'qa-top-'+id,name:'Top 10 - '+profile.latin,works:profile.top_work_ids,ts:1791536400000}]
    };
    Object.entries(seed).forEach(([key,value])=>scoped.setItem(key,JSON.stringify(value)));
    scoped.setItem('qa.seed.v1','1');
  }
  if(['ar','en'].includes(params.get('lang'))&&scoped.getItem('qa.requestedLang')!==params.get('lang')){
    scoped.setItem('lorefy.ui.lang.v1',JSON.stringify(params.get('lang')));
    scoped.setItem('qa.requestedLang',params.get('lang'));
  }
})(typeof window!=='undefined'?window:null,function(){
  function createStorage(storage,id){
    var prefix='lorefy.qa.tester.'+id+'.';
    var keys=()=>Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>k&&k.startsWith(prefix));
    return {getItem:key=>storage.getItem(prefix+key),setItem:(key,value)=>storage.setItem(prefix+key,String(value)),removeItem:key=>storage.removeItem(prefix+key),
      clear:()=>keys().forEach(k=>storage.removeItem(k)),key:i=>(keys()[i]||'').slice(prefix.length)||null,get length(){return keys().length;}};
  }
  return {createStorage:createStorage};
});

(function(root){
  var lab=root.LorefyTesterLab;if(!lab)throw Error('Missing isolated tester boot');
  var data=lab.data,B=root.LorefyBackend,p=lab.profile;
  function stored(id,key,fallback){try{return JSON.parse(lab.storageFor(id).getItem(key)||'null')||fallback;}catch{return fallback;}}
  function following(id){return stored(id,'lorefy.user.following.v1',data.profiles.find(x=>x.id===id)?.following_ids||[]);}
  function profile(id){var base=data.profiles.find(x=>x.id===id);if(!base)return null;var identity=stored(id,'lorefy.identity.v1',{});
    return Object.assign({},base,{name:identity.name||base.name,bio:identity.bio||base.bio,avatar:identity.avatar||base.avatar,banner:identity.banner||base.banner,
      favorite_work_ids:stored(id,'lorefy.user.favorites.v2',base.favorite_work_ids),library_entries:stored(id,'lorefy.user.library.v2',base.library_entries),
      profile_layout:stored(id,'lorefy.user.profileLayout.v1',base.profile_layout),
      following_count:following(id).length,follower_count:data.profiles.filter(x=>following(x.id).includes(id)).length,is_following:following(p.id).includes(id)});}
  var session={userId:p.id,name:p.name,email:p.username+'@example.invalid',mode:'demo'};
  B.mode='demo';B.user={id:p.id};B.init=async()=>{B.mode='demo';B.user={id:p.id};return false;};B.getSession=async()=>session;
  B.startSync=()=>{};B.push=async()=>false;B.pull=async()=>false;B.subscribeCommunity=async()=>()=>{};
  B.getPublicProfile=async id=>profile(id);B.searchPublicProfiles=async query=>data.profiles.map(x=>profile(x.id)).filter(x=>x.name.includes(query)||x.username.includes(query));
  B.listProfileFollowers=async id=>data.profiles.filter(x=>following(x.id).includes(id)).map(x=>profile(x.id));
  B.listProfileFollowing=async id=>following(id).map(profile).filter(Boolean);B.getFollowedProfileIds=async()=>following(p.id);
  B.toggleProfileFollow=async(id,value)=>{if(!data.profiles.some(x=>x.id===id)||id===p.id)return false;var ids=following(p.id);lab.storage.setItem('lorefy.user.following.v1',JSON.stringify(value?Array.from(new Set(ids.concat(id))):ids.filter(x=>x!==id)));return value;};
  function reviews(options){options=options||{};return data.reviews.filter(r=>(!options.userId||r.userId===options.userId)&&(!options.workId||r.mid===options.workId)).map(r=>({id:r.id,user_id:r.userId,work_id:r.mid,rating:r.r,recommend:r.rec,body:r.txt,images:[],created_at:new Date(r.ts).toISOString(),profile:profile(r.userId),comments:[],reactions:{heart:r.likes,like:0,mine:{}}}));}
  B.listReviews=async options=>reviews(options);B.listReviewCollection=async options=>reviews(options);
  B.setReviewReaction=async()=>({local:true});B.listReviewComments=async()=>[];
  root.addEventListener('DOMContentLoaded',()=>{
    if(root.LorefyUserDiscovery)root.LorefyUserDiscovery.demoReaders.push(...data.profiles.map(x=>profile(x.id)));
  },{once:true});
  root.LorefyMangaData=root.LorefyMangaData||[];
  const known=new Set(root.LorefyMangaData.map(w=>String(w.id)));
  for(const work of data.profiles.flatMap(x=>x.works))if(!known.has(String(work.id))){root.LorefyMangaData.push(work);known.add(String(work.id));}
})(window);

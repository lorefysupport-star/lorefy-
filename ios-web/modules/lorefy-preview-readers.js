(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LorefyPreviewReaders=api;
})(typeof window!=='undefined'?window:null,function(root){
  'use strict';
  let current=null,backend=null;
  const clone=value=>JSON.parse(JSON.stringify(value));
  function allowed(location,mode){
    const params=new URLSearchParams(location&&location.search||'');
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location&&location.hostname||'')&&
      params.get('preview')==='demo'&&params.get('demo')==='ready'&&mode==='demo';
  }
  function createCommunity(options){
    const {data,storage,viewerId}=options;
    const ids=new Set(data.profiles.map(p=>p.id)),reviewIds=new Set(data.reviews.map(r=>r.id));
    const key='lorefy.preview.readers.'+encodeURIComponent(viewerId)+'.following.v1';
    const defaults=data.profiles.slice(0,3).map(p=>p.id);
    const viewerFollowers=data.profiles.slice(0,3).map(p=>p.id);
    function following(id){
      if(id!==viewerId)return (data.profiles.find(p=>p.id===id)?.following_ids||[]).concat(viewerFollowers.includes(id)?[viewerId]:[]);
      try{const value=storage.getItem(key);const rows=value===null?defaults:JSON.parse(value);return Array.isArray(rows)?rows.filter(id=>ids.has(id)):[];}catch(_){return defaults;}
    }
    function saveFollowing(rows){storage.setItem(key,JSON.stringify(Array.from(new Set(rows)).filter(id=>ids.has(id))));}
    function profile(id){
      if(id===viewerId){
        let identity={};try{identity=JSON.parse(storage.getItem('lorefy.identity.v1')||'{}');}catch(_){}
        return {id:viewerId,name:identity.name||'Lorefy',username:identity.un||'lorefy_demo',avatar:identity.avatar||'',banner:identity.banner||'',bio:identity.bio||'',
          follower_count:viewerFollowers.length,following_count:following(viewerId).length,is_following:false};
      }
      const base=data.profiles.find(p=>p.id===id);if(!base)return null;
      return Object.assign(clone(base),{is_following:following(viewerId).includes(id),
        follower_count:data.profiles.filter(p=>following(p.id).includes(id)).length+(following(viewerId).includes(id)?1:0),
        following_count:following(id).length});
    }
    function rows(options){
      options=options||{};
      return data.reviews.filter(r=>(!options.userId||r.userId===options.userId)&&(!options.workId||r.mid===options.workId))
        .map(r=>({id:r.id,user_id:r.userId,work_id:r.mid,rating:r.r,recommend:r.rec,body:r.txt,images:[],
          created_at:new Date(r.ts).toISOString(),profile:profile(r.userId),comments:[],reactions:{heart:r.likes,like:0,mine:{}}}));
    }
    return {
      data,reviewIds,findReader:profile,
      followingStorage:{getItem:k=>k==='lorefy.user.following.v1'?JSON.stringify(following(viewerId)):null,
        setItem:(k,v)=>{if(k==='lorefy.user.following.v1')saveFollowing(JSON.parse(v));}},
      searchPublicProfiles:async query=>data.profiles.map(p=>profile(p.id)).filter(p=>
        [p.name,p.latin,p.username].some(value=>String(value).toLowerCase().includes(String(query).replace(/^@/,'').toLowerCase()))),
      getPublicProfile:async id=>profile(id),getFollowedProfileIds:async()=>following(viewerId).slice(),
      listProfileFollowing:async id=>following(id).map(profile).filter(Boolean),
      listProfileFollowers:async id=>(id===viewerId?viewerFollowers:data.profiles.filter(p=>following(p.id).includes(id)).map(p=>p.id).concat(following(viewerId).includes(id)?[viewerId]:[])).map(profile).filter(Boolean),
      toggleProfileFollow:async(id,value)=>{if(!ids.has(id))return false;const rows=following(viewerId);saveFollowing(value?rows.concat(id):rows.filter(x=>x!==id));return value===true;},
      listReviews:async options=>rows(options),listReviewCollection:async options=>rows(options)
    };
  }
  function reviewState(React,useStoredState,community){
    const [local,setLocal]=useStoredState('lorefy.user.privateReviews.v2',[]);
    const [fixtures,setFixtures]=React.useState(()=>community?clone(community.data.reviews):[]);
    const shown=community?local.filter(r=>!community.reviewIds.has(r.id)).concat(fixtures).sort((a,b)=>b.ts-a.ts):local;
    const state=React.useRef?React.useRef(shown):{current:shown};state.current=shown;
    if(!community)return [local,setLocal];
    return [shown,update=>{
      const next=typeof update==='function'?update(state.current):update;state.current=next;
      setLocal(next.filter(r=>!community.reviewIds.has(r.id)));
      setFixtures(next.filter(r=>community.reviewIds.has(r.id)));
    }];
  }
  function isActive(){return !!(root&&current&&backend&&allowed(root.location,backend.mode));}
  async function prepare(B,session){
    if(!root||!B||!session||session.mode!=='demo'||!allowed(root.location,B.mode)||root.LorefyTesterLab)return false;
    if(current)return true;
    const response=await root.fetch('qa/tester-data.json?v=20261009-noura-bunny-v1');
    if(!response.ok)throw Error('Preview reader data unavailable');
    const data=await response.json();
    if(!allowed(root.location,B.mode))return false;
    current=createCommunity({data,storage:root.localStorage,viewerId:session.userId});backend=B;
    // Preserve real backend behavior if this page changes to a live session.
    for(const name of ['getPublicProfile','searchPublicProfiles','getFollowedProfileIds','listProfileFollowers','listProfileFollowing','toggleProfileFollow']){
      const original=B[name];B[name]=function(){return isActive()?current[name].apply(current,arguments):original.apply(B,arguments);};
    }
    const directory=root.LorefyUserDiscovery;
    if(directory)directory.demoReaders.push(...data.profiles.map(p=>current.findReader(p.id)));
    const known=new Set((root.LorefyMangaData||[]).map(w=>String(w.id)));
    for(const work of data.profiles.flatMap(p=>p.works))if(!known.has(String(work.id))){root.LorefyMangaData.push(work);known.add(String(work.id));}
    if(root.__lorefyIngest){
      await new Promise(resolve=>{root.addEventListener('lorefy:catalog-ingested',resolve,{once:true});root.__lorefyIngest();});
    }
    return true;
  }
  return {allowed,createCommunity,reviewState,prepare,isActive,
    findReader:id=>isActive()?current.findReader(id):null,
    getFollowingStorage:()=>isActive()?current.followingStorage:null,
    useReviews:(React,hook)=>reviewState(React,hook,isActive()?current:null)};
});

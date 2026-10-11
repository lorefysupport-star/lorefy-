/* Opt-in, isolated localhost regression data. Never loaded by the production entry point. */
(function(root){
  var params=new URLSearchParams(root.location.search),lab=root.LorefyTesterLab;
  if (!lab || params.get('userFixesQA')!=='1' || !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(root.location.hostname)) return;
  var work=lab.profile.favorite_work_ids[0],own=lab.data.reviews.find(function(r){ return r.userId===lab.profile.id; });
  if(own){own.spoiler=true;own.txt='QA SPOILER: هذه تفاصيل يجب أن تبقى مخفية قبل إظهار المراجعة.';own.imgs=['launch/brand/lorefy-reading-scene.jpg'];}
  // One-time fixture seed so status changes remain testable after a reload.
  if(!lab.storage.getItem('qa.userFixes.seed.v1')){
    var library=JSON.parse(lab.storage.getItem('lorefy.user.library.v2')||'{}');library[work]='توقف';
    lab.storage.setItem('lorefy.user.library.v2',JSON.stringify(library));
    lab.storage.setItem('lorefy.user.privateReviews.v2',JSON.stringify(lab.data.reviews.map(function(r){return Object.assign({},r,{userId:r.userId===lab.profile.id?'me':r.userId});})));
    lab.storage.setItem('qa.userFixes.seed.v1','1');
  }
})(window);

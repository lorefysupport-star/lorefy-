const test=require('node:test'),assert=require('node:assert/strict');
const appearance=require('../modules/lorefy-public-appearance');
const works={shadow:{type:'ويب نوفل'},comic:{type:'كوميكس'},manga:{type:'Manga'}};
test('unread favorites, wishlist and ordinary ratings cannot outweigh a completed web novel',()=>{
 const profile={favorite_type:'Comics',library_entries:{shadow:'تم القراءة',comic:'قائمة الأمنيات'},
  progress_by_id:{shadow:{chapter:3233}},favorite_work_ids:['comic'],own_reviews:[{mid:'comic',r:5}]};
 assert.equal(appearance.favoriteType(profile,id=>works[id]),'Web Novel');
 assert.equal(appearance.label('Web Novel','ar'),'ويب نوفل');
 assert.equal(appearance.label('Web Novel','en'),'Web Novel');
});
test('positive reading checkpoints count distinct works, not score weights or duplicate sources',()=>{
 assert.equal(appearance.favoriteType({library_entries:{comic:'أقرأ حالياً',manga:'أقرأ حالياً'},progress_by_id:{comic:{chapter:0},manga:{chapter:1}},favorite_work_ids:['comic']},id=>works[id]),'Manga');
 assert.equal(appearance.favoriteType({library_entries:{shadow:'تم القراءة'},progress_by_id:{},own_reviews:[{mid:'shadow',completedByReview:true,completionProgress:{chapter:3233}}]},id=>works[id]),'Web Novel');
 assert.equal(appearance.favoriteType({library_entries:{comic:'قائمة الأمنيات'},progress_by_id:{comic:{chapter:0}},favorite_work_ids:['comic']},id=>works[id]),'');
});
test('saved sync projection recomputes read-only evidence and does not retain a stale genre for an empty library',()=>{
 const state={'lorefy.user.library.v2':'{"shadow":"تم القراءة","comic":"قائمة الأمنيات"}',
  'lorefy.user.progress.v2':'{"shadow":{"chapter":3233}}','lorefy.user.favorites.v2':'["comic"]','lorefy.user.favoriteType.v1':'"Comics"'};
 assert.equal(appearance.fromState(state,Object.entries(works).map(([id,w])=>({id,...w}))),'Web Novel');
 assert.equal(appearance.fromState({...state,'lorefy.user.library.v2':'{}','lorefy.user.progress.v2':'{}'},[]),'');
});

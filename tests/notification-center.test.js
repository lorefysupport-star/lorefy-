const test=require('node:test'),assert=require('node:assert/strict');
const api=()=>require('../modules/lorefy-notification-center.js');
test('all interaction types have distinct categories and bilingual copy',()=>{
 const c=api();for(const [event,category] of [['post_like','likes'],['review_like','likes'],['post_reply','replies'],['review_reply','replies'],['post_mention','mentions'],['comment_mention','mentions'],['follow','follows']]){
  const row={kind:event==='follow'?'follow':'',data:{event,actorName:'Nora'}};
  assert.equal(c.category(row),category);assert.ok(c.copy(row,'en').body.includes('Nora'));assert.ok(c.copy(row,'ar').title);
 }
});
test('filtering keeps read history, isolates mentions and never mutates source order',()=>{
 const c=api(),rows=[{id:'old',kind:'follow',read_at:'x',created_at:'2026-01-01'},
 {id:'new',kind:'mention',created_at:'2026-11-13'},{id:'new',kind:'mention',created_at:'2026-11-13'}];
 assert.deepEqual(c.select(rows,'all').map(x=>x.id),['new','old']);
 assert.deepEqual(c.select(rows,'unread').map(x=>x.id),['new']);
 assert.equal(c.select(rows,'mentions').length,1);assert.equal(rows[0].id,'old');
});
test('unknown payloads are plain text, not synthesized links or HTML',()=>{
 const c=api(),row={title:'<script>',body:'literal',kind:'system'};
 assert.deepEqual(c.copy(row,'en'),{title:'<script>',body:'literal'});assert.equal(c.category(row),'other');
});

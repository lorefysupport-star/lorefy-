const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function backendForTest() {
  const window = {};
  vm.runInNewContext(read('backend/lorefy-backend.js'), {window, console, URL, URLSearchParams, setTimeout, clearTimeout});
  const backend = window.LorefyBackend;
  backend.mode = 'live';
  backend.getSession = async () => ({userId:'00000000-0000-4000-8000-000000000001'});
  return backend;
}

test('visitor artwork uses the owner snapshot, never viewer cover preferences', () => {
  const source = read('modules/lorefy-public-profile.js');
  assert.match(source, /profile\.custom_work_covers/);
  assert.match(source, /profile\.custom_character_images/);
  assert.doesNotMatch(source, /props\.cover\(work\)/);
  assert.match(read('backend/lorefy-backend.js'), /get_public_profile_artwork/);
});
test('public chapter reviews stay in chapters; existing private notes are not auto-published', () => {
  const source = read('modules/lorefy-chapter-detail.js');
  assert.doesNotMatch(source, /LorefyCommunity\.openComposer/);
  assert.match(source, /listChapterReviews/);
  assert.match(source, /publishChapterReview/);
  assert.match(source, /lf-chapter-discussion/);
  assert.match(source, /lf-chapter-private-save/);
  const sql = read('supabase/migrations/20261003143000_profile_artwork_chapter_reviews.sql');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /unique\s*\(user_id, work_id, chapter\)/i);
  assert.match(sql, /author_has_blocked_viewer/);
  assert.doesNotMatch(sql, /insert into.*chapter_reviews.*user_state/is);
});
test('reply refresh is race-safe, retryable, and bounded by viewport', () => {
  const source = read('modules/lorefy-community.js');
  assert.match(source, /request !== repliesRequest/);
  assert.match(source, /lf-community-retry/);
  assert.match(source, /replyBefore/);
  assert.match(read('styles/lorefy-community.css'), /overflow-wrap:\s*anywhere/);
});

test('reply targeting preserves the draft and closing a thread does not discard it', () => {
  const source = read('modules/lorefy-community.js');
  const start = source.indexOf('    function targetReply(');
  const end = source.indexOf('    var sheet =', start);
  const draft = 'Keep my draft exactly';
  const scope = {post:{id:'root'}, replyTarget:null, targetBar:{hidden:true}, targetLabel:{textContent:''}, input:{value:draft,focus(){}}, uiText:(_,en)=>en};
  vm.runInNewContext(source.slice(start,end),scope);
  scope.targetReply({id:'reply',profile:{username:'reader'}});
  assert.equal(scope.input.value,draft);
  assert.equal(scope.replyTarget.id,'reply');
  assert.equal(scope.targetBar.hidden,false);
  assert.match(source, /replyDrafts\.get\(draftKey\)/);
  assert.match(source, /replyDrafts\.set\(draftKey, input\.value\)/);
});

test('a feed response from an abandoned screen cannot overwrite the current screen', () => {
  const source = read('modules/lorefy-community.js');
  assert.match(source, /request !== state\.feedRequest/);
  assert.match(source, /feedPage !== state\.page/);
});

test('chapter discussion supports owner deletion and reader reporting without public draft migration', () => {
  const source = read('modules/lorefy-chapter-detail.js');
  assert.match(source, /deleteChapterReview/);
  assert.match(source, /submitReport/);
  assert.match(source, /setProfileBlock/);
  assert.match(read('backend/lorefy-backend.js'), /eq\("user_id", session\.userId\)/);
});

test('chapter publishing uses a dedicated RPC and rejects invalid or empty input', async () => {
  const backend = backendForTest(), calls = [];
  backend.client = {rpc:async (name, args) => { calls.push([name,args]); return {data:{rating:args.score},error:null}; }};
  await assert.rejects(backend.publishChapterReview('work',0,4,'',false), /Invalid chapter/);
  await assert.rejects(backend.publishChapterReview('work',1,6,'',false), /Invalid rating/);
  await assert.rejects(backend.publishChapterReview('work',1,0,'',false), /Invalid chapter review/);
  await assert.rejects(backend.publishChapterReview('work',1,4,'x'.repeat(1001),false), /Invalid chapter review/);
  assert.equal(calls.length,0);
  await backend.publishChapterReview('work',1,4,'  Spoiler  ',true);
  assert.equal(calls[0][0],'publish_chapter_review');
  assert.equal(calls[0][1].comment_body,'Spoiler');
  assert.equal(calls[0][1].has_spoiler,true);
  backend.client.rpc = async () => ({error:new Error('network failed')});
  await assert.rejects(backend.publishChapterReview('work',1,4,'kept',false), /network failed/);
});

test('chapter review pagination is stable and signs avatars before rendering', async () => {
  const backend = backendForTest(), calls = [];
  const result = {data:[{rating:4,profile:{avatar:'owner/avatar.png'}}],error:null};
  const query = {then:resolve=>Promise.resolve(result).then(resolve)};
  for (const key of ['select','eq','order','range']) query[key]=(...args)=>{calls.push([key,...args]);return query;};
  backend.client = {from:table=>{assert.equal(table,'chapter_reviews'); return query;}};
  backend._storageMediaUrl = async (bucket, value) => {assert.equal(bucket,'profile-media'); return 'https://example.com/signed/'+value;};
  const rows = await backend.listChapterReviews('work',7,20);
  assert.equal(rows[0].profile.avatar,'https://example.com/signed/owner/avatar.png');
  assert.ok(calls.some(call=>call[0]==='range'&&call[1]===20&&call[2]===39));
  assert.deepEqual(calls.filter(call=>call[0]==='order').map(call=>call[1]),['updated_at','id']);
});

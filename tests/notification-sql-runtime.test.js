const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const migration='supabase/migrations/20261104120000_notification_interaction_delivery.sql';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
const R='44444444-4444-4444-8444-444444444444',P='55555555-5555-4555-8555-555555555555',Q='66666666-6666-4666-8666-666666666666';
let db;
test.before(async()=>{
 db=new PGlite();
 await db.exec(`
 create role anon; create role authenticated; create schema auth; create schema private;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth to authenticated;
 create table public.profiles(id uuid primary key,name text,username text,is_private boolean default false);
 create table public.profile_blocks(blocker_id uuid,blocked_id uuid,primary key(blocker_id,blocked_id));
 create table public.reviews(id uuid primary key,user_id uuid,work_id text,is_public boolean default true,body text default '');
 create table public.review_comments(id uuid primary key default gen_random_uuid(),review_id uuid,user_id uuid,body text,is_deleted boolean default false,created_at timestamptz default now());
 create table public.review_reactions(review_id uuid,user_id uuid,kind text,primary key(review_id,user_id,kind));
 create table public.profile_follows(follower_id uuid,following_id uuid,primary key(follower_id,following_id));
 create function private.lock_actor_action(text) returns void language sql as $$select$$;
 create function private.can_interact_with_review(uuid) returns boolean language sql as $$select true$$;
 create function private.author_has_blocked_viewer(uuid) returns boolean language sql as $$select false$$;
 create function private.reader_has_blocked_author(uuid) returns boolean language sql as $$select false$$;
 create function public.moderate_community_text() returns trigger language plpgsql as $$begin return new;end$$;
 `);
 for(const file of ['20260828204500_notifications_foundation.sql','20260913000000_review_comment_threads.sql','20260920090000_community_posts.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 if(fs.existsSync(migration))await db.exec(fs.readFileSync(migration,'utf8'));
 await db.exec(fs.readFileSync('supabase/migrations/20261113055739_notification_mentions_inbox.sql','utf8'));
});
test.after(async()=>{await db?.close();});
test.beforeEach(async()=>{
 await db.exec(`reset role; truncate notifications,profile_blocks,profile_follows,review_comments,review_reactions,reviews,community_posts,profiles,auth.users cascade;
 insert into auth.users values('${A}'),('${B}'),('${C}');
 insert into profiles(id,name,username) values('${A}','Ali','ali'),('${B}','Nora','nora'),('${C}','Fahad','fahad');
 insert into reviews values('${R}','${A}','mal-manga-2-berserk',true);
 insert into community_posts(id,user_id,kind,body) values('${P}','${A}','text','Test post');
 select set_config('request.jwt.claim.sub','${C}',false);`);
});
const rows=async()=> (await db.query('select * from notifications order by event_key')).rows;

test('mentions are server-resolved, case insensitive and unique; email text and self mentions stay quiet',async()=>{
 await db.exec(`insert into community_posts(user_id,kind,body) values('${C}','text','Hello @NORA @nora @fahad test@ali.com @unknown');`);
 const items=await rows();assert.equal(items.length,1);assert.equal(items[0].user_id,B);
 assert.equal(items[0].kind,'mention');assert.equal(items[0].data.event,'post_mention');assert.equal(items[0].data.actorName,'Fahad');
});
test('review and comment mentions preserve exact destination and avoid duplicate ordinary replies',async()=>{
 await db.exec(`update reviews set body='Hello @nora' where id='${R}';`);
 assert.equal((await rows())[0].data.reviewId,R);await db.exec('truncate notifications');
 await db.exec(`insert into review_comments(review_id,user_id,body) values('${R}','${C}','Hi @ali @nora');`);
 const items=await rows();assert.equal(items.length,2);assert.equal(items.filter(x=>x.user_id===A).length,1);
 const mention=items.find(x=>x.user_id===B);assert.equal(mention.kind,'mention');assert.ok(mention.data.commentId);assert.equal(mention.target_path,'/review/'+R);
});
test('private works, hidden authors and blocks do not leak content through mentions',async()=>{
 await db.exec(`update reviews set is_public=false,body='Hello @nora' where id='${R}';
 update profiles set is_private=true where id='${C}';
 insert into community_posts(user_id,kind,body) values('${C}','text','@nora');`);
 assert.equal((await rows()).length,0);
 await db.exec(`update profiles set is_private=false where id='${C}';insert into profile_blocks values('${B}','${C}');
 insert into community_posts(user_id,kind,body) values('${C}','text','@nora');`);
 assert.equal((await rows()).length,0);
});
test('editing mentions sends only newly added recipients and never repeats existing receipts',async()=>{
 await db.exec(`insert into community_posts(id,user_id,kind,body) values('${Q}','${C}','text','@nora');
 update community_posts set body='again @nora @ali' where id='${Q}';
 update community_posts set body='remove' where id='${Q}';update community_posts set body='@nora @ali' where id='${Q}';`);
 assert.equal((await rows()).length,2);
});
test('a mention cannot expose a parent work or thread whose owner blocked the recipient',async()=>{
 await db.exec(`insert into profile_blocks values('${A}','${B}');
 insert into review_comments(review_id,user_id,body) values('${R}','${C}','Hello @nora');
 insert into community_posts(user_id,kind,body,parent_id) values('${C}','text','Hello @nora','${P}');`);
 assert.equal((await rows()).filter(x=>x.user_id===B).length,0);
});

test('review replies reach both the reviewer and the parent-comment author',async()=>{
 await db.exec(`insert into review_comments(id,review_id,user_id,body) values('${Q}','${R}','${B}','First comment'); truncate notifications;
 insert into review_comments(review_id,user_id,parent_id,body) values('${R}','${C}','${Q}','Reply');`);
 const items=await rows();assert.equal(items.length,2);assert.deepEqual(items.map(x=>x.user_id).sort(),[A,B]);
 const reply=items.find(x=>x.user_id===B);assert.equal(reply.data.event,'review_reply');assert.equal(reply.data.commentId.length,36);assert.equal(reply.data.actorName,'Fahad');
});
test('self replies stay quiet and the same recipient never gets two copies',async()=>{
 await db.exec(`insert into review_comments(id,review_id,user_id,body) values('${Q}','${R}','${A}','Own comment');
 insert into review_comments(review_id,user_id,parent_id,body) values('${R}','${C}','${Q}','Reply');`);
 assert.equal((await rows()).length,1);
 await db.exec(`truncate notifications; insert into review_comments(review_id,user_id,body) values('${R}','${A}','Self');`);
 assert.equal((await rows()).length,0);
});
test('thread replies preserve validated reply context and notify its actual author',async()=>{
 await db.exec(`insert into community_posts(id,user_id,kind,body,parent_id) values('${Q}','${B}','text','First reply','${P}'); truncate notifications;`);
 const result=await db.query('select * from public.publish_community_post($1,$2,$3::jsonb,$4::uuid)',['Reply','text',JSON.stringify({replyTo:{id:Q,username:'forged'},ignored:'not stored'}),P]);
 assert.equal(result.rows[0].attachment.replyTo.id,Q);assert.equal(result.rows[0].attachment.replyTo.username,'nora');
 assert.equal(result.rows[0].attachment.ignored,undefined);
 assert.deepEqual((await rows()).map(x=>x.user_id).sort(),[A,B]);
});
test('reply context cannot target a comment in another thread',async()=>{
 await db.exec(`insert into community_posts(id,user_id,kind,body) values('${Q}','${B}','text','Unrelated');`);
 await assert.rejects(db.query('select public.publish_community_post($1,$2,$3::jsonb,$4::uuid)',['Reply','text',JSON.stringify({replyTo:{id:Q}}),P]),/invalid_reply_target/);
 assert.equal((await rows()).length,0);
});
test('likes, hearts, dislikes and follows create bounded persistent interaction receipts',async()=>{
 await db.exec(`insert into review_reactions values('${R}','${B}','heart'),('${R}','${C}','dislike');
 insert into community_post_reactions(post_id,user_id,kind) values('${P}','${B}','like'),('${P}','${C}','dislike');
 insert into profile_follows values('${B}','${A}');`);
 const items=await rows();assert.equal(items.length,5);assert.ok(items.every(x=>x.data.actorName&&x.data.event));
 assert.equal(items.find(x=>x.kind==='follow').data.profileId,B);
 await db.exec(`delete from community_post_reactions where post_id='${P}' and user_id='${B}'; insert into community_post_reactions(post_id,user_id,kind) values('${P}','${B}','like');`);
 assert.equal((await rows()).length,5);
});
test('blocks in either direction suppress notifications without rejecting the original interaction',async()=>{
 await db.exec(`insert into profile_blocks values('${A}','${B}'),('${C}','${A}');
 insert into review_reactions values('${R}','${B}','like'),('${R}','${C}','heart');
 insert into profile_follows values('${B}','${A}');`);
 assert.equal((await rows()).length,0);
});
test('reaction on a reply opens its root thread and keeps the reply identifier',async()=>{
 await db.exec(`insert into community_posts(id,user_id,kind,body,parent_id) values('${Q}','${B}','text','Reply','${P}');truncate notifications;
 insert into community_post_reactions(post_id,user_id,kind) values('${Q}','${C}','like');`);
 const item=(await rows())[0];assert.equal(item.user_id,B);assert.equal(item.data.postId,P);assert.equal(item.data.replyId,Q);
});
test('the focused migration is repeatable without deleting notifications or widening inbox grants',async()=>{
 await db.exec(`insert into profile_follows values('${B}','${A}');`);
 await db.exec(fs.readFileSync(migration,'utf8'));
 assert.equal((await rows()).length,1);
 assert.equal((await db.query("select has_table_privilege('authenticated','public.notifications','INSERT') as allowed")).rows[0].allowed,false);
});

test('mention migration replays safely while retaining read and unread history',async()=>{
 await db.exec(`insert into community_posts(id,user_id,kind,body) values('${Q}','${B}','text','Hello @ali');`);
 const before=await rows();assert.ok(before.some(r=>r.kind==='mention'));
 await db.exec(fs.readFileSync('supabase/migrations/20261113055739_notification_mentions_inbox.sql','utf8'));
 assert.deepEqual(await rows(),before);
 assert.equal((await db.query("select has_function_privilege('authenticated','private.notify_text_mentions()','EXECUTE') as allowed")).rows[0].allowed,false);
});
test('inbox access and read receipts stay owner scoped and never delete history',async()=>{
 await db.exec(`insert into profile_follows values('${B}','${A}'),('${A}','${B}');
 select set_config('request.jwt.claim.sub','${A}',false); set role authenticated;`);
 assert.equal((await db.query('select * from notifications')).rows.length,1);
 assert.equal((await db.query('select mark_notifications_read() as count')).rows[0].count,1);
 const items=(await db.query('select * from notifications')).rows;assert.ok(items[0].read_at);assert.equal(items[0].user_id,A);
 await assert.rejects(db.query("insert into notifications(user_id,kind,title,target_path,event_key) values($1,'system','forged','/home','fake')",[A]),/permission denied/);
 await db.exec('reset role');assert.equal((await rows()).length,2);
});

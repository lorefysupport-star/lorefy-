const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const migration=fs.readFileSync('supabase/migrations/20261104184233_crafted_profile_artwork.sql','utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
let db;
test.before(async()=>{
 db=new PGlite();await db.exec(`
 create schema auth;create schema private;create role anon;create role authenticated;
 create table profiles(id uuid primary key,is_private boolean default false);
 create table user_state(user_id uuid primary key,data jsonb);
 create table profile_blocks(blocker_id uuid,blocked_id uuid);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function private.reader_state_json(value text,fallback text) returns jsonb language sql immutable as $$select coalesce(value::jsonb,fallback::jsonb)$$;
 create function private.author_has_blocked_viewer(id uuid) returns boolean language sql stable as $$select exists(select 1 from profile_blocks where blocker_id=id and blocked_id=auth.uid())$$;
 create function private.reader_has_blocked_author(id uuid) returns boolean language sql stable as $$select exists(select 1 from profile_blocks where blocker_id=auth.uid() and blocked_id=id)$$;
 create function private.owns_decoration(id uuid,pack text) returns boolean language sql stable as $$select pack='owned-test'$$;
 insert into profiles values('${A}',false),('${B}',false);
 insert into user_state values('${A}','{}');
 `);
 const original=fs.readFileSync('supabase/migrations/20261010212411_decoration_purchases.sql','utf8');
 const start=original.indexOf('CREATE OR REPLACE FUNCTION public.get_public_profile_artwork');
 await db.exec(original.slice(start)+';');
 await db.exec(fs.readFileSync('supabase/migrations/20261102190000_halloween_profile_artwork.sql','utf8'));
 await db.exec('revoke all on function public.get_public_profile_artwork(uuid) from public,anon;grant execute on function public.get_public_profile_artwork(uuid) to authenticated;');
 await db.exec(migration);
});
test.after(async()=>await db?.close());
test.beforeEach(async()=>await db.exec(`update profiles set is_private=false;truncate profile_blocks;select set_config('request.jwt.claim.sub','${B}',false);`));
const choose=async(value,owner=A)=>await db.query('update user_state set data=$1::jsonb where user_id=$2',[JSON.stringify({'lorefy.user.profileDecoration.v1':JSON.stringify({ownerId:owner,frame:value,page:value,effect:value})}),A]);
const project=async()=> (await db.query('select public.get_public_profile_artwork($1) as art',[A])).rows[0].art;
for(const id of ['witch','moon','ink','theatre','dawn','dusk','garden','patchwork'])test('public projection accepts crafted-'+id+' only in approved frame/page slots',async()=>{
 await choose('crafted-'+id);const result=await project();
 assert.equal(result.profile_decoration.frame,'crafted-'+id);assert.equal(result.profile_decoration.page,'crafted-'+id);assert.equal(result.profile_decoration.effect,null);
});
test('privacy and both blocking directions still suppress artwork',async()=>{
 await choose('crafted-garden');await db.exec(`update profiles set is_private=true where id='${A}'`);assert.equal(await project(),null);
 await db.exec(`update profiles set is_private=false;insert into profile_blocks values('${A}','${B}')`);assert.equal(await project(),null);
 await db.exec(`truncate profile_blocks;insert into profile_blocks values('${B}','${A}')`);assert.equal(await project(),null);
 await db.exec(`select set_config('request.jwt.claim.sub','${A}',false)`);assert.equal((await project()).profile_decoration.frame,'crafted-garden');
});
test('anonymous, owner-forged and arbitrary IDs are not exposed',async()=>{
 await choose('crafted-garden',B);assert.equal((await project()).profile_decoration.frame,null);
 await choose('crafted-not-approved');assert.equal((await project()).profile_decoration.frame,null);
 await choose('crafted-garden');await db.exec("select set_config('request.jwt.claim.sub','',false)");assert.equal(await project(),null);
});
test('earlier free packs, purchase checks and function privileges survive idempotent installation',async()=>{
 for(const id of ['observatory','halloween-ember-harvest','owned-test']){await choose(id);assert.equal((await project()).profile_decoration.frame,id);}
 const before=(await db.query("select pg_get_functiondef('public.get_public_profile_artwork(uuid)'::regprocedure) as source,proacl::text as acl,prosecdef from pg_proc where oid='public.get_public_profile_artwork(uuid)'::regprocedure")).rows[0];
 await db.exec(migration);const after=(await db.query("select pg_get_functiondef('public.get_public_profile_artwork(uuid)'::regprocedure) as source,proacl::text as acl,prosecdef from pg_proc where oid='public.get_public_profile_artwork(uuid)'::regprocedure")).rows[0];
 assert.deepEqual(after,before);assert.equal(after.prosecdef,true);assert.match(after.acl,/authenticated=X/);assert.doesNotMatch(after.acl,/anon=X/);
});
test('the patch refuses an unfamiliar function instead of overwriting it',async()=>{
 await db.exec('begin');try{
  await db.exec('create or replace function public.get_public_profile_artwork(profile_ref uuid) returns jsonb language sql as $$select null::jsonb$$;');
  await assert.rejects(db.exec(migration),/Artwork projection changed/);
 }finally{await db.exec('rollback');}
});

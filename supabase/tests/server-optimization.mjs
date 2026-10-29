// Isolated PostgreSQL/WASM integration check. Never connects to Supabase.
// Install @electric-sql/pglite@0.5.13 in a temporary directory, then pass its
// absolute dist/index.js path: node supabase/tests/server-optimization.mjs PATH
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const {PGlite} = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const migration = await fs.readFile(new URL('../migrations/20261029194223_optimize_feed_and_foreign_keys.sql', import.meta.url), 'utf8');
const owner = '00000000-0000-0000-0000-000000000001';
const viewer = '00000000-0000-0000-0000-000000000002';
await db.exec(`
  create role authenticated;
  create role anon;
  create schema auth;
  create schema private;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create table public.profiles(id uuid primary key, is_private boolean not null);
  create table public.chapter_reviews(id integer primary key, user_id uuid);
  create table public.reviews(id uuid primary key, created_at timestamptz);
  create table public.community_post_reactions(user_id uuid);
  create table public.notifications(actor_id uuid);
  create table public.decoration_purchases(product_id text);
  create table private.profile_username_reservations(user_id uuid);
  create table private.test_blocks(blocker_id uuid, blocked_id uuid);
  create function private.author_has_blocked_viewer(author_id uuid)
    returns boolean language sql stable security definer set search_path='' as $$
      select exists(select 1 from private.test_blocks
        where blocker_id=author_id and blocked_id=auth.uid())
    $$;
  create function private.reader_has_blocked_author(author_id uuid)
    returns boolean language sql stable security definer set search_path='' as $$
      select exists(select 1 from private.test_blocks
        where blocker_id=auth.uid() and blocked_id=author_id)
    $$;
  grant usage on schema public, auth, private to authenticated;
  grant select on public.profiles to authenticated;
  grant select,delete on public.chapter_reviews to authenticated;
  alter table public.profiles enable row level security;
  create policy "Public profiles respect account blocks" on public.profiles
    for select to authenticated using(id=(select auth.uid()) or (
      not is_private and not private.author_has_blocked_viewer(id)
      and not private.reader_has_blocked_author(id)));
  alter table public.chapter_reviews enable row level security;
  create policy "Visible chapter reviews" on public.chapter_reviews
    for select to authenticated using(user_id=auth.uid() or (
      not private.author_has_blocked_viewer(user_id)
      and not private.reader_has_blocked_author(user_id)
      and exists(select 1 from public.profiles p
        where p.id=chapter_reviews.user_id and not p.is_private)));
  create policy "Delete own chapter review" on public.chapter_reviews
    for delete to authenticated using(user_id=auth.uid());
  insert into public.profiles values ('${owner}',false),('${viewer}',false);
  insert into public.chapter_reviews values (1,'${owner}'),(2,'${viewer}');
`);

async function readAs(subject, role='authenticated') {
  await db.exec(`begin; set local role ${role};`);
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [subject]);
    return (await db.query('select id from public.chapter_reviews order by id')).rows.map(r=>r.id);
  } finally { await db.exec('rollback'); }
}
async function deleteAs(subject, id) {
  await db.exec('begin; set local role authenticated;');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [subject]);
    return (await db.query('delete from public.chapter_reviews where id=$1 returning id',[id])).rows.map(r=>r.id);
  } finally { await db.exec('rollback'); }
}
let checks = 0;
async function contract() {
  await db.exec('update public.profiles set is_private=false; delete from private.test_blocks;');
  assert.deepEqual(await readAs(viewer),[1,2]); checks++;
  assert.deepEqual(await deleteAs(viewer,1),[]); checks++;
  assert.deepEqual(await deleteAs(owner,1),[1]); checks++;
  await db.exec(`update public.profiles set is_private=true where id='${owner}';`);
  assert.deepEqual(await readAs(viewer),[2]); checks++;
  assert.deepEqual(await readAs(owner),[1,2]); checks++;
  assert.deepEqual(await deleteAs(owner,1),[1]); checks++;
  await db.exec(`update public.profiles set is_private=false;
    insert into private.test_blocks values ('${owner}','${viewer}');`);
  assert.deepEqual(await readAs(viewer),[2]); checks++;
  assert.deepEqual(await readAs(owner),[1]); checks++;
  await db.exec(`delete from private.test_blocks;
    insert into private.test_blocks values ('${viewer}','${owner}');`);
  assert.deepEqual(await readAs(viewer),[2]); checks++;
  await assert.rejects(readAs('', 'anon'), /permission denied/); checks++;
}
try {
  await contract();
  const before = (await db.query("select policyname,roles,cmd,permissive from pg_policies where tablename='chapter_reviews' order by policyname")).rows;
  await db.exec('begin;'+migration+'commit;');
  await contract();
  assert.deepEqual((await db.query("select policyname,roles,cmd,permissive from pg_policies where tablename='chapter_reviews' order by policyname")).rows,before); checks++;
  assert.equal((await db.query("select count(*)::int as n from pg_indexes where indexname in ('reviews_feed_created_id_idx','community_post_reactions_user_id_idx','notifications_actor_id_idx','decoration_purchases_product_id_idx','profile_username_reservations_user_id_idx')")).rows[0].n,5); checks++;
  // A stale/repeated deployment must fail as one transaction, preserving state.
  await assert.rejects(db.exec('begin;'+migration+'commit;'),/chapter_review_policy_drift/); checks++;
  await db.exec('rollback');
  console.log(JSON.stringify({checks,passed:true,scope:'Isolated PGlite fixture; no network or production user writes'}));
} finally { await db.close(); }

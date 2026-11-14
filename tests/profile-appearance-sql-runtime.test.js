const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const owner = '11111111-1111-4111-8111-111111111111';
const viewer = '22222222-2222-4222-8222-222222222222';
const migrationPath = fs.readdirSync('supabase/migrations').find(name => name.endsWith('_public_profile_showcase.sql'));
const migration = migrationPath ? fs.readFileSync('supabase/migrations/' + migrationPath, 'utf8') : '';
let db;

test.before(async () => {
  db = new PGlite();
  await db.exec(`
    create schema auth; create schema private; create role anon; create role authenticated;
    create table public.profiles(id uuid primary key, is_private boolean default false);
    create table public.user_state(user_id uuid primary key, data jsonb);
    create table public.profile_blocks(blocker_id uuid, blocked_id uuid);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function private.reader_state_json(value text,fallback text) returns jsonb language sql immutable as $$select coalesce(value::jsonb,fallback::jsonb)$$;
    create function private.author_has_blocked_viewer(id uuid) returns boolean language sql stable as $$select exists(select 1 from profile_blocks where blocker_id=id and blocked_id=auth.uid())$$;
    create function private.reader_has_blocked_author(id uuid) returns boolean language sql stable as $$select exists(select 1 from profile_blocks where blocker_id=auth.uid() and blocked_id=id)$$;
    insert into public.profiles values('${owner}',false),('${viewer}',false);
    insert into public.user_state values('${owner}','{}');
  `);
  const original = fs.readFileSync('supabase/migrations/20261009122012_public_profile_appearance.sql', 'utf8');
  await db.exec(original.slice(0, original.indexOf('-- Batch search')));
  await db.exec(migration);
});
test.after(async () => db?.close());
test.beforeEach(async () => {
  await db.exec(`update public.profiles set is_private=false; truncate public.profile_blocks; select set_config('request.jwt.claim.sub','${viewer}',false);`);
});
async function choose(mode, encoded = false) {
  await db.query('update public.user_state set data=$1::jsonb where user_id=$2', [JSON.stringify({
    'lorefy.library.view.v1': encoded ? JSON.stringify(mode) : mode,
    'lorefy.ui.theme.v1': 'custom-light-367faa',
    'lorefy.user.bannerPos.v2': '0',
    'lorefy.user.favoriteType.v1': '"Manga"'
  }), owner]);
}
async function project() {
  return (await db.query('select public.get_public_profile_appearance($1) as appearance', [owner])).rows[0].appearance;
}
for (const mode of ['grid', 'spines', 'shelf', 'showcase']) test('public projection preserves saved ' + mode + ' for another reader', async () => {
  for (const encoded of [false, true]) {
    await choose(mode, encoded);
    assert.deepEqual(await project(), { library_view: mode, theme: 'custom-light-367faa', favorite_type: 'Manga', banner_position: 0 });
  }
});
test('unknown and absent display modes still fall back to grid', async () => {
  for (const mode of ['not-approved', null]) {
    await choose(mode);
    assert.equal((await project()).library_view, 'grid');
  }
});
test('private profiles, both block directions and anonymous requests remain hidden', async () => {
  await choose('showcase');
  await db.exec(`update public.profiles set is_private=true where id='${owner}'`);
  assert.equal(await project(), null);
  await db.exec(`select set_config('request.jwt.claim.sub','${owner}',false)`);
  assert.equal((await project()).library_view, 'showcase');
  await db.exec(`update public.profiles set is_private=false; select set_config('request.jwt.claim.sub','${viewer}',false); insert into public.profile_blocks values('${owner}','${viewer}')`);
  assert.equal(await project(), null);
  await db.exec(`truncate public.profile_blocks; insert into public.profile_blocks values('${viewer}','${owner}')`);
  assert.equal(await project(), null);
  await db.exec("select set_config('request.jwt.claim.sub','',false)");
  assert.equal(await project(), null);
});
test('the narrow idempotent patch preserves privileges and rejects unfamiliar function bodies', async () => {
  const definition = async () => (await db.query("select pg_get_functiondef(oid) as body, proacl::text as acl, prosecdef from pg_proc where oid='public.get_public_profile_appearance(uuid)'::regprocedure")).rows[0];
  const before = await definition();
  await db.exec(migration);
  assert.deepEqual(await definition(), before);
  assert.match(before.acl, /authenticated=X/);
  assert.doesNotMatch(before.acl, /anon=X|[,{]=X\//);
  await db.exec('begin');
  try {
    await db.exec('create or replace function public.get_public_profile_appearance(profile_ref uuid) returns jsonb language sql as $$select null::jsonb$$');
    await assert.rejects(db.exec(migration), /Appearance projection changed/);
  } finally { await db.exec('rollback'); }
});

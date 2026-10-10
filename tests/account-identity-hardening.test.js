const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

test("username claims are atomic, normalized, and never rely on a client availability check", () => {
  const migration = read("supabase", "migrations", "20260825010000_account_identity_hardening.sql");
  const backend = read("backend", "lorefy-backend.js");

  assert.match(migration, /create or replace function public\.save_my_profile/i);
  assert.match(migration, /lower\(trim\(regexp_replace/i);
  assert.match(migration, /username_taken/i);
  assert.match(migration, /errcode\s*=\s*'23505'/i);
  assert.match(migration, /profiles_username_lower_idx/i);
  assert.match(migration, /revoke all on function public\.save_my_profile/i);
  assert.match(migration, /grant execute on function public\.save_my_profile[\s\S]*authenticated/i);
  assert.match(backend, /rpc\("save_my_profile"/);
  assert.match(backend, /LOREFY_USERNAME_TAKEN/);
});

test("the deployed profile genres column is migrated to the canonical jsonb shape", () => {
  const migrationsDir = path.join(root, "supabase", "migrations");
  const migrationName = fs.readdirSync(migrationsDir)
    .find((name) => /fix_profile_genres_type\.sql$/.test(name));

  assert.ok(migrationName, "missing profile genres compatibility migration");
  const migration = fs.readFileSync(path.join(migrationsDir, migrationName), "utf8");
  assert.match(migration, /alter column genres drop default/i);
  assert.match(migration, /alter column genres type jsonb[\s\S]*using to_jsonb\(genres\)/i);
  assert.match(migration, /alter column genres set default '\[\]'::jsonb/i);
});

test("cloud account state contains library, lists, character ratings, and review choices for a later production build", () => {
  const backend = read("backend", "lorefy-backend.js");

  for (const key of [
    "lorefy.user.library.v2",
    "lorefy.characterRatings.v1",
    "lorefy.characterReview.v1",
    "lorefy.characterBoards.v1",
    "lorefy.charTopLists.v1",
    "lorefy.customLists.v1",
    "lorefy.reviewTop4.v1",
    "lorefy.profile.preferenceBoards.v1",
    "lorefy.profile.preferenceBoardCovers.v1"
  ]) assert.match(backend, new RegExp(key.replace(/\./g, "\\.")));

  assert.doesNotMatch(backend, /lorefy\.user\.profileCustomization\.v1/);

  assert.match(backend, /Object\.keys\(data\)\.forEach\(function\(k\)\{ if \(isAccountStateKey\(k\)/);
  assert.match(backend, /rpc\("sync_user_state"/);
  assert.match(backend, /state_conflict/);
  assert.match(backend, /hasRemoteState/);
  assert.match(backend, /mayKeepLocalState/);
  assert.match(backend, /this\._schedulePush\(\);/);
});

test("a newly authenticated account never adopts unowned local device state", () => {
  const backend = read("backend", "lorefy-backend.js");
  const start = backend.indexOf("function canReuseLocalAccountState(");
  const end = backend.indexOf("\n  function ", start + 1);

  assert.notEqual(start, -1, "missing account-state ownership helper");
  assert.notEqual(end, -1, "could not isolate account-state ownership helper");

  const context = {};
  vm.runInNewContext(
    `${backend.slice(start, end)}\nresult = [\n` +
      `  canReuseLocalAccountState(null, "account-a"),\n` +
      `  canReuseLocalAccountState("account-b", "account-a"),\n` +
      `  canReuseLocalAccountState("account-a", "account-a")\n` +
      `];`,
    context
  );

  assert.deepEqual(Array.from(context.result), [false, false, true]);
  assert.match(backend, /if \(!mayKeepLocalState\) clearUserData\(\);/);
});

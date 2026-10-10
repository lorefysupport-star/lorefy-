const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("native links accept Lorefy routes and reject foreign origins", () => {
  const runtime = require(path.join(root, "backend/lorefy-native-runtime.js"));

  assert.deepEqual(runtime.parseAppLink("/work/42"), {
    route: "detail",
    novel: "42"
  });
  assert.deepEqual(runtime.parseAppLink("/notifications"), {
    route: "profile",
    notifications: "1"
  });
  assert.deepEqual(runtime.parseAppLink("https://lorefy.app/work/42"), {
    route: "detail",
    novel: "42"
  });
  assert.deepEqual(runtime.parseAppLink("com.lorefy.app://community"), {
    route: "community"
  });
  assert.deepEqual(runtime.parseAppLink("lorefy://notifications"), {
    route: "profile",
    notifications: "1"
  });
  assert.deepEqual(runtime.parseAppLink("https://www.lorefy.app/search?q=hunter"), {
    route: "explore",
    search: "hunter"
  });
  assert.equal(runtime.parseAppLink("https://example.com/work/42"), null);
  assert.equal(runtime.parseAppLink("//evil.example/work/42"), null);
  assert.equal(runtime.parseAppLink("javascript:alert(1)"), null);
  assert.equal(runtime.parseAppLink("com.lorefy.app://auth/callback?code=secret"), null);
  assert.equal(runtime.parseAppLink("https://lorefy.app/work/../../profile"), null);
});

test("iOS push registration and custom-scheme links are wired into the native shell", () => {
  const pkg = JSON.parse(read("package.json"));
  const capacitor = JSON.parse(read("capacitor.config.json"));
  const delegate = read("ios/App/App/AppDelegate.swift");
  const entitlements = read("ios/App/App/App.entitlements");
  const info = read("ios/App/App/Info.plist");
  const swiftPackage = read("ios/App/CapApp-SPM/Package.swift");

  assert.equal(pkg.dependencies["@capacitor/push-notifications"], "8.1.2");
  assert.match(pkg.scripts["ios:sync"], /fix-capacitor-spm-paths/);
  assert.deepEqual(capacitor.plugins.PushNotifications.presentationOptions, ["badge", "sound", "banner", "list"]);
  assert.match(delegate, /didRegisterForRemoteNotificationsWithDeviceToken/);
  assert.match(delegate, /capacitorDidRegisterForRemoteNotifications/);
  assert.match(delegate, /didFailToRegisterForRemoteNotificationsWithError/);
  assert.match(delegate, /capacitorDidFailToRegisterForRemoteNotifications/);
  assert.match(entitlements, /<key>aps-environment<\/key>/);
  assert.doesNotMatch(entitlements, /com\.apple\.developer\.associated-domains|applinks:/);
  assert.match(info, /<string>com\.lorefy\.app<\/string>/);
  assert.match(info, /<string>lorefy<\/string>/);
  assert.match(swiftPackage, /CapacitorPushNotifications/);
  assert.doesNotMatch(swiftPackage, /path:\s*"[^"]*\\/);
});

test("notification backend is owner scoped and exposed through narrow RPCs", () => {
  const backend = read("backend/lorefy-backend.js");
  const migrations = fs.readdirSync(path.join(root, "supabase/migrations"))
    .filter((name) => name.endsWith("_notifications_foundation.sql"));

  assert.equal(migrations.length, 1);
  const migration = read(path.join("supabase/migrations", migrations[0]));

  assert.match(backend, /registerPushDevice:\s*async function/);
  assert.match(backend, /unregisterPushDevice:\s*async function/);
  assert.match(backend, /listNotifications:\s*async function/);
  assert.match(backend, /markNotificationsRead:\s*async function/);
  assert.match(backend, /subscribeNotifications:\s*async function/);

  assert.match(migration, /create table public\.push_device_tokens/i);
  assert.match(migration, /create table public\.notifications/i);
  assert.match(migration, /alter table public\.notifications enable row level security/i);
  assert.match(migration, /using \(user_id = \(select auth\.uid\(\)\)\)/i);
  assert.match(migration, /revoke all on table public\.notifications from public, anon, authenticated/i);
  assert.match(migration, /grant select on table public\.notifications to authenticated/i);
  assert.doesNotMatch(migration, /grant[^;]*insert[^;]*public\.notifications[^;]*authenticated/i);
  assert.match(migration, /create or replace function public\.register_push_device/i);
  assert.match(migration, /create or replace function public\.mark_notifications_read/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /revoke all on function public\.register_push_device/i);
  assert.match(migration, /create trigger notify_review_comment/i);
  assert.match(migration, /create trigger notify_review_reaction/i);
  assert.match(migration, /create trigger notify_profile_follow/i);
});

test("native runtime is loaded in the app and cached for release", () => {
  const html = read("index.html");
  const worker = read("sw.js");
  const app = read("uploads/files/lorefy-app.js");
  const backendAt = html.indexOf("backend/lorefy-backend.js");
  const runtimeAt = html.indexOf("backend/lorefy-native-runtime.js");
  const appAt = html.indexOf("uploads/files/lorefy-app.js");

  assert.ok(backendAt >= 0 && runtimeAt > backendAt && appAt > runtimeAt);
  assert.match(worker, /backend\/lorefy-native-runtime\.js\?v=/);
  assert.match(app, /LorefyNativeRuntime\.setPushEnabled/);
  assert.match(app, /lorefy\.native\.push\.enabled\.v1/);
});

test("push dispatch is server-only and sends APNs alert payloads", () => {
  const dispatcher = read("supabase/functions/dispatch-notifications/index.ts");
  assert.match(dispatcher, /PUSH_WEBHOOK_SECRET/);
  assert.match(dispatcher, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(dispatcher, /APNS_TEAM_ID/);
  assert.match(dispatcher, /APNS_KEY_ID/);
  assert.match(dispatcher, /api\.push\.apple\.com\/3\/device/);
  assert.match(dispatcher, /apns-push-type/);
  assert.match(dispatcher, /targetPath/);
  assert.doesNotMatch(dispatcher, /Access-Control-Allow-Origin[^\n]*\*/);
});

test("notification database dispatch keeps its webhook secret inside Vault", () => {
  const migration = read("supabase/migrations/20260830083000_push_dispatch_webhook.sql");
  assert.match(migration, /create extension if not exists pg_net/i);
  assert.match(migration, /vault\.decrypted_secrets/);
  assert.match(migration, /net\.http_post/);
  assert.match(migration, /x-lorefy-webhook-secret/);
  assert.match(migration, /jsonb_build_object\('id', new\.id, 'user_id', new\.user_id\)/);
  assert.doesNotMatch(migration, /PUSH_WEBHOOK_SECRET\s*=\s*['"]/);
});

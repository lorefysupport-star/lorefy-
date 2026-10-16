const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

test("owner profile and My Reviews only use reviews authored by the active account", () => {
  const app = read("uploads", "files", "lorefy-app.js");

  assert.match(app, /myReviews=M\.filter\(r=>r\.userId==="me"\|\|r\.un===Y\)/);
  assert.match(app, /profileFavoriteType=\(\(\)=>\{[\s\S]*?myReviews\.forEach/);
  assert.match(app, /profileRecentWorks=\(\(\)=>\{[\s\S]*?\[\.\.\.myReviews\]\.reverse\(\)/);
  assert.match(app, /To=myReviews\.length/);

  const pageStart = app.indexOf("Er=()=>");
  const pageEnd = app.indexOf(",Nr=[", pageStart);
  assert.notEqual(pageStart, -1);
  assert.notEqual(pageEnd, -1);
  const myReviewsPage = app.slice(pageStart, pageEnd);
  assert.match(myReviewsPage, /myReviews\.length/);
  assert.match(myReviewsPage, /myReviews\.map\(/);
  assert.doesNotMatch(myReviewsPage, /\bM\.(?:length|map)\b/);
});

test("home continuation requires active reading status and a real saved stop point", () => {
  const app = read("uploads", "files", "lorefy-app.js");

  assert.match(app, /Hn=Object\.entries\(b\)\.filter\(\(\[t,r\]\)=>r===STATUS_READING&&hasSavedProgress\(le\[t\]\)\)/);
  assert.match(app, /hasSavedProgress=e=>\{const i=normalizeProgress\(e\);return i\.chapter>0\|\|i\.page>0\|\|i\.volume>0\}/);
  assert.doesNotMatch(app, /Hn=Object\.keys\(b\)\.map\(t=>workById\(t\)\)/);

  const homeStart = app.indexOf("ir=()=>");
  assert.notEqual(homeStart, -1);
  const home = app.slice(homeStart, homeStart + 30000);

  assert.match(home, /pe=Object\.entries\(b\)\.filter\(\(\[k,status\]\)=>status===STATUS_READING&&hasSavedProgress\(le\[k\]\)\)/);
  assert.doesNotMatch(home, /\(\[,k\]\)=>k===STATUS_READING&&hasSavedProgress\(le\[k\]\)/);
  assert.match(home, /w=pe\.slice\(0,4\)/);
  assert.match(home, /w\.length>0&&React\.createElement\("section",\{className:"lf-continue-section"\}/);
  assert.doesNotMatch(home, /w=\(pe\.length\?pe:g\)/);
  assert.doesNotMatch(home, /progressPercent\(k,U\)\|\|Math\.min/);
});

test("followers and following rows open the full public reader profile", () => {
  const app = read("uploads", "files", "lorefy-app.js");
  const modalStart = app.indexOf("mr=()=>");
  const modalEnd = app.indexOf(",vr=", modalStart);

  assert.notEqual(modalStart, -1);
  assert.notEqual(modalEnd, -1);
  const connectionsModal = app.slice(modalStart, modalEnd);
  assert.match(connectionsModal, /lorefy:open-reader-profile/);
  assert.match(connectionsModal, /e\.stopPropagation\(\)/);
  assert.match(connectionsModal, /role:"button"/);
});

test("public profile snapshots include the account's own reading summary", () => {
  const migrationsDir = path.join(root, "supabase", "migrations");
  const migrationName = fs.readdirSync(migrationsDir)
    .find((name) => /public_profile_reading_summary\.sql$/.test(name));

  assert.ok(migrationName, "missing public profile reading-summary migration");
  const migration = fs.readFileSync(path.join(migrationsDir, migrationName), "utf8");
  const growth = read("modules", "lorefy-growth-features.js");

  assert.match(migration, /total_chapters bigint/i);
  assert.match(migration, /read_hours bigint/i);
  assert.match(migration, /library_entries jsonb/i);
  assert.match(migration, /auth\.uid\(\) is not null/i);
  assert.match(migration, /grant execute on function public\.get_public_profile_social\(uuid\) to authenticated/i);
  assert.match(growth, /total_chapters/);
  assert.match(growth, /read_hours/);
  assert.match(growth, /library_entries/);
});

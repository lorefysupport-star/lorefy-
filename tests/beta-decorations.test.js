const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rootPath = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(rootPath, file), 'utf8');
const source = JSON.parse(read('qa/frame-lab/collections.json'));
const beta = source.map(pack => ({...pack, overlay:pack.overlay.replace('qa/frame-lab/', 'launch/decorations/pfpvibes/')}));
function setup(enabled) {
  const values = {};
  const root = {location:{hostname:'app.lorefy', search:''}, LOREFY_RELEASE:{betaProfileDecorations:enabled},
    LorefyBackend:{mode:'live',user:{id:'owner'},push:async()=>true},
    localStorage:{getItem:key=>values[key]||null,setItem:(key,value)=>values[key]=value},
    CustomEvent:class {},dispatchEvent:()=>{}};
  vm.runInNewContext(read('modules/lorefy-profile-shop.js'), {window:root,URLSearchParams});
  return {root,api:root.LorefyProfileShop,values};
}
test('beta ships all 24 collections and persists every component to the owner account', async()=>{
  const s = setup(true);
  assert.equal(typeof s.api.installBetaCollections, 'function');
  assert.equal(s.api.installBetaCollections(beta), true);
  assert.equal(s.api.bundles.length, 27);
  for (const pack of beta) {
    const result = await s.api.applyDecoration(pack.id,'all','owner');
    assert.equal(result.synced,true);
    for (const part of ['frame','page','effect']) assert.equal(result.decoration[part],pack.id);
    assert.equal(s.api.readDecoration(s.root.localStorage,'visitor').frame,null);
    assert.ok(s.api.findBundle(pack.id).motion.speed > 0);
  }
  assert.equal(s.api.DECORATION_KEY,'lorefy.user.profileDecoration.v1');
});
test('beta collections reject QA paths, remote assets and non-beta builds',()=>{
  assert.equal(setup(false).api.installBetaCollections(beta),false);
  assert.equal(setup(true).api.installBetaCollections(source),false);
  assert.equal(setup(true).api.installBetaCollections([{...beta[0],overlay:'https://example.com/frame.png'}]),false);
});
test('bundled assets retain complete artwork and match every collection',()=>{
  const bundled = JSON.parse(read('launch/decorations/pfpvibes/collections.json'));
  assert.deepEqual(bundled,beta);
  for (let i=0;i<beta.length;i++) assert.deepEqual(fs.readFileSync(path.join(rootPath,beta[i].overlay)),fs.readFileSync(path.join(rootPath,source[i].overlay)));
  assert.match(read('tools/prepare-ios-web.mjs'),/betaProfileDecorations: nativeRelease.releaseMode === "beta" && nativeRelease.profileDecorations === true/);
});
test('public profile projection accepts every packaged ID without widening visibility',()=>{
  const sql = read('supabase/migrations/20261009171500_beta_profile_decorations.sql');
  for (const pack of beta) assert.ok(sql.includes("'"+pack.id+"'"));
  assert.match(sql,/auth.uid\(\) is not null/);
  assert.match(sql,/s.decoration->>'ownerId' = profile_ref::text/);
  assert.match(sql,/not p.is_private/);
  assert.match(sql,/not private.author_has_blocked_viewer\(p.id\)/);
  assert.match(sql,/not private.reader_has_blocked_author\(p.id\)/);
  assert.match(sql,/revoke all.*from public, anon/);
});

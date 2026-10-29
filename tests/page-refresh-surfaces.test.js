const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../modules/lorefy-page-refresh.js');
const target=className=>({matches:selector=>selector.split(',').some(s=>s.trim()==='.'+className)});
test('pull-to-refresh recognizes the whole Home and Library rather than only a nested feed',()=>{
 assert.ok(api.PAGE_SELECTOR.includes('.lf-home-cinema'));
 assert.ok(api.PAGE_SELECTOR.includes('.lf-library-cinema'));
});
test('Home refresh runs posts, reviews and friend activity exactly once each',()=>{
 assert.deepEqual(api.refreshNames(target('lf-home-cinema'),()=>true),['community-posts','community-reviews','community-friends']);
 assert.deepEqual(api.refreshNames(target('lf-community-page'),()=>false),['community-posts']);
});
test('Library reuses account refresh and visitors retain their own profile handler',()=>{
 assert.deepEqual(api.refreshNames(target('lf-library-cinema'),()=>false),['profile-owner']);
 assert.deepEqual(api.refreshNames(target('lf-reader-full'),()=>false),['profile-visitor']);
});

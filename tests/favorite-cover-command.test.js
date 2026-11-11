const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8'),growth=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
test('favorite cover command is scoped to the opening account, validates work and cleans up',()=>{
 const start=app.indexOf('function lorefyBindFavoriteCoverEditor(');assert.ok(start>=0);
 const end=app.indexOf('\nfunction ',start+1);let current=true,listener,removed=0;const opened=[];
 const context={window:{addEventListener:(name,fn)=>{assert.equal(name,'lorefy:edit-favorite-cover');listener=fn;},removeEventListener:(name,fn)=>{assert.equal(fn,listener);removed++;}},
 lorefyReviewRequestScope:()=>({owner:'one'}),lorefyReviewRequestCurrent:()=>current,workById:id=>id==='valid'?{id}:null};
 vm.runInNewContext(app.slice(start,end),context);
 const stop=context.lorefyBindFavoriteCoverEditor(id=>opened.push(id));listener({detail:{workId:'missing'}});listener({detail:{workId:'valid'}});
 current=false;listener({detail:{workId:'valid'}});stop();assert.deepEqual(opened,['valid']);assert.equal(removed,1);
});
test('favorite work editor owns the cover action and favorite character tiles omit their overlay',()=>{
 const editor=growth.slice(growth.indexOf('  function openProfileFavouriteWorksEditor('),growth.indexOf('  function syncProfileFavouriteWorksControls('));
 assert.match(editor,/lorefy:edit-favorite-cover/);assert.match(editor,/lf-top-works-editor-cover-action/);
 const tile=growth.slice(growth.indexOf('  function profileTopCharacterTile('),growth.indexOf('  function profileTopCharacterSelection('));
 assert.ok(tile.length>0);assert.doesNotMatch(tile,/tile\.appendChild\(profileCharacterImageEdit/);
 assert.match(growth,/selectedActions\.appendChild\(profileCharacterImageEdit\(activeItem, render\)\)/);
});

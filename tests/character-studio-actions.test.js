const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Node=require('./helpers/render-dom');
const source=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
test('shared profile image command opens the existing picker, preserves owner and ignores obsolete controls',()=>{
 const start=source.indexOf('  function profileCharacterImageEdit(');assert.ok(start>=0);
 let owner='a',opened=0,refreshed=0,callback;const timers=[];
 const scope={el:(tag,attrs,kids)=>new Node(tag,attrs,Array.isArray(kids)?kids:kids?[kids]:[]),uiText:(ar,en)=>en,
  profileRatedCharacterOwner:()=>owner,profileWorkFor:()=>({id:'work'}),scheduleCharacterActionIcons(){},
  openCharacterImagePicker(c,cb,work){assert.equal(c.name,'Hero');assert.equal(work.id,'work');callback=cb;opened++;},
  global:{setTimeout:fn=>timers.push(fn)}};
 vm.runInNewContext(source.slice(start,source.indexOf('  function profileRatedCharacterTile(',start)),scope);
 const button=scope.profileCharacterImageEdit({workId:'work',character:{name:'Hero'}},()=>refreshed++);
 assert.equal(button.tag,'button');assert.match(button.attrs['aria-label'],/Hero/);button.click();assert.equal(opened,1);
 callback();timers.splice(0).forEach(f=>f());assert.equal(refreshed,1);
 owner='b';button.click();assert.equal(opened,1);callback();timers.splice(0).forEach(f=>f());assert.equal(refreshed,1);
});

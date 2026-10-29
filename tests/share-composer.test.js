const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function api(extra={}){const scope={module:{exports:{}},...extra};vm.runInNewContext(fs.readFileSync('modules/lorefy-share-composer.js','utf8'),scope);return scope.module.exports;}
test('nested export mounts inside the active dialog rather than its inert application sibling',()=>{
 const source=fs.readFileSync('modules/lorefy-share-composer.js','utf8');
 const match=source.match(/ function exportMount\(doc,opener\)\{[\s\S]*?\n \}/);
 assert.ok(match,'explicit nested-dialog export mount is required');
 const scope={};vm.runInNewContext(match[0],scope);
 const app={name:'app'},screen={name:'screen'},body={name:'body'};
 const doc={body,querySelector:()=>app,getElementById:()=>screen};
 const dialog={isConnected:true,closest:()=>null};
 assert.equal(scope.exportMount(doc,{closest:()=>dialog}),dialog);
 dialog.closest=()=>({inert:true});assert.equal(scope.exportMount(doc,{closest:()=>dialog}),app);
 dialog.closest=()=>null;dialog.isConnected=false;assert.equal(scope.exportMount(doc,{closest:()=>dialog}),app);
 assert.equal(scope.exportMount(doc,null),app);
 doc.querySelector=()=>null;assert.equal(scope.exportMount(doc,null),screen);
 const openSource=source.slice(source.indexOf(' function open(input)'));
 assert.ok(openSource.includes('exportMount(root.document,previous)'));
 assert.ok(openSource.includes("dialog.addEventListener('keydown',keyboard)"));
 assert.ok(openSource.includes("dialog.removeEventListener('keydown',keyboard)"));
});
test('export model preserves deliberate zero, item order and long lists without invented rows',()=>{
 const a=api(),model=a.normalize({kind:'ranking',rating:0,items:Array.from({length:27},(_,i)=>({id:i,name:'Character '+i,image:'assets/'+i+'.png',rank:i+1}))});
 assert.equal(model.rating,0);assert.equal(model.items.length,27);assert.equal(model.items[26].rank,27);
 assert.equal(a.normalize({rating:null}).rating,null);assert.equal(a.normalize({rating:''}).rating,null);
 assert.equal(a.normalize({items:[null,{name:'Guts',rank:3}]}).items[0].rank,3);
 const image='data:image/png;base64,'+'A'.repeat(9000),withPhoto=a.normalize({profile:{avatar:image},items:[{image}]});assert.equal(withPhoto.items[0].image,image);assert.equal(withPhoto.profile.avatar,image);
});
test('share palette follows custom app colors by default and allows independent background, ink and accent',()=>{
 const a=api(),theme={background:'#fdeaf2',accent:'#af235a',ink:'#30212a'};
 assert.equal(a.palette(a.settings(),theme).background,theme.background);
 const s=a.settings({followTheme:false,background:'#192833',accent:'#82e4c8',ink:'#fafafa'});
 assert.equal(a.palette(s,theme).accent,'#82e4c8');assert.equal(a.palette(s,theme).background,'#192833');assert.equal(a.palette(s,theme).ink,'#fafafa');
 assert.equal(a.settings({template:'invalid',format:'bad',background:'url(evil)'}).template,'spotlight');
});
test('selected personal-picks layout has one leading row and nine equal portrait tiles, not a podium',()=>{
 const a=api(),model=a.normalize({kind:'top',title:'My Berserk picks',items:Array.from({length:10},(_,i)=>({name:'Character '+i,rank:i+1,image:'image-'+i}))});
 for(const format of ['portrait','story','square']){
  const s=a.settings({template:'spotlight',format}),p=a.plan(model,s,0);
  assert.equal(p.style,'personal-picks');assert.equal(p.items.length,10);assert.equal(p.pages,1);
  assert.equal(p.items[0].role,'hero');assert.ok(p.items[0].caption.x>p.items[0].image.x+p.items[0].image.w);
  assert.equal(p.items.slice(1).every(r=>r.role==='pick'),true);
  assert.equal(new Set(p.items.slice(1).map(r=>r.image.w)).size,1);
  assert.equal(new Set(p.items.slice(1).map(r=>r.image.h)).size,1);
  assert.ok(p.items.slice(1).every(r=>r.image.y>=p.hero.y+p.hero.h));
  assert.ok(p.hero.y<200);assert.ok(p.hero.h<p.height*.3);
 }
});
test('selected layout handles sparse lists and rank gaps without filling unused selections',()=>{
 const a=api();for(const count of [0,1,2,3,7,10,27]){
  const m=a.normalize({kind:'list',title:'Custom list',items:Array.from({length:count},(_,i)=>({name:'Work '+i,rank:i*2+1,image:'image-'+i}))}),s=a.settings({template:'spotlight'});
  const ranks=[];for(let n=0;n<a.pageCount(m,s);n++){const p=a.plan(m,s,n);assert.equal(p.style,'personal-picks');ranks.push(...p.items.map(r=>r.item.rank));}
  assert.deepEqual(ranks,Array.from({length:count},(_,i)=>i*2+1));
 }
});
test('selected design becomes the default once without resetting colors or later template choices',()=>{
 const a=api(),source=fs.readFileSync('modules/lorefy-share-composer.js','utf8'),match=source.match(/ function preferences\(value\)\{[^\n]+/);
 assert.ok(match);const scope={settings:a.settings};vm.runInNewContext(match[0],scope);
 const old=scope.preferences({template:'journal',followTheme:false,accent:'#cc3355',format:'square'});
 assert.equal(old.template,'spotlight');assert.equal(old.accent,'#cc3355');assert.equal(old.format,'square');assert.equal(old.followTheme,false);
 assert.equal(scope.preferences({...old,template:'gallery'}).template,'gallery');
});
test('three export designs paginate every item and keep every image and text box in frame',()=>{
 const a=api();assert.equal(a.templates.length,3);
 for(const kind of ['work','review','ranking','top','list'])for(const template of a.templates)for(const format of ['story','portrait','square'])for(const n of [1,3,10,27]){
  const model=a.normalize({kind,items:Array.from({length:n},(_,i)=>({name:'A long title '+i,rank:i+1,image:'assets/'+i+'.jpg'}))}),s=a.settings({template:template.id,format});
  const seen=[];for(let page=0;page<a.pageCount(model,s);page++){
   const plan=a.plan(model,s,page);for(const item of plan.items){seen.push(item.item.rank);for(const r of [item.image,item.caption])assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=plan.width+.1&&r.y+r.h<=plan.height+.1,JSON.stringify({kind,template:template.id,format,n,r}));}
   assert.ok(plan.items.every(i=>i.caption.y+i.caption.h<=plan.footerY));
  }
  assert.deepEqual(seen,Array.from({length:n},(_,i)=>i+1));
 }
});
test('export fails clearly for a missing selected image and only loads the selected page',async()=>{
 const a=api(),model=a.normalize({kind:'list',items:Array.from({length:27},(_,i)=>({name:'Work '+i,image:'assets/'+i+'.jpg'}))}),calls=[];
 const images=await a.loadPage(model,a.settings({template:'journal'}),1,async src=>{calls.push(src);return {naturalWidth:100,naturalHeight:150};});
 assert.equal(calls.length,images.plan.items.length);assert.ok(calls.every(s=>s!=='assets/0.jpg'));
 await assert.rejects(a.loadPage(model,a.settings(),0,async()=>null),e=>e.code==='LOREFY_SHARE_MEDIA_UNAVAILABLE');
});
test('closing an export can unsubscribe auth without skipping other listeners',()=>{
 const scope={window:{}};vm.runInNewContext(fs.readFileSync('backend/lorefy-backend.js','utf8'),scope);const b=scope.window.LorefyBackend;let calls=[];
 let stop=b.onAuth(()=>{calls.push('export');stop();});assert.equal(typeof stop,'function');
 b.onAuth(()=>calls.push('app'));b._emit(null);b._emit(null);assert.deepEqual(calls,['export','app','app']);assert.equal(b._authCbs.length,1);
});
test('work lists, character top lists and review shares enter the same editable export flow',()=>{
 const growth=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
 function extract(name){const start=growth.indexOf('  function '+name+'(');assert.ok(start>=0);const end=growth.indexOf('\n  function ',start+4);return growth.slice(start,end);}
 let saved;const scope={global:{LorefyShareComposer:{open:m=>{saved=m;return m;},currentProfile:()=>({name:'Reader'})}},mlWorkBy:id=>({id,title:id}),mlTitleOf:w=>w.title,mlCoverOf:w=>'cover-'+w.id,
  clCastCache:{work:[]},characterImageUrl:c=>c.img,doc:{querySelector:()=>null},reviewDetailSnapshot:()=>({work:'Berserk',text:'A full review',rating:'0',author:'Reader',handle:'reader',cover:'cover'}),communityCardKey:()=> 'review'};
 vm.createContext(scope);vm.runInContext(extract('mlPoster'),scope);scope.mlPoster({name:'My list',works:Array.from({length:27},(_,i)=>String(i))});assert.equal(saved.items.length,27);assert.equal(saved.kind,'list');
 vm.runInContext(extract('clPoster'),scope);scope.clPoster({mid:'work',title:'Characters',chars:Array.from({length:10},(_,i)=>({name:'Character '+i,img:'image-'+i}))},true);assert.equal(saved.items.length,10);assert.equal(saved.kind,'top');
 vm.runInContext(extract('openCommunityReviewShareSheet'),scope);scope.openCommunityReviewShareSheet({});assert.equal(saved.kind,'review');assert.equal(saved.rating,0);assert.equal(saved.text,'A full review');
 const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8');assert.ok(app.includes('const exportBoard=board=>window.LorefyShareComposer.open'));assert.ok(app.includes('kind:"work",title:m.title'));
 const community=fs.readFileSync('modules/lorefy-community.js','utf8');assert.ok(community.includes('global.LorefyShareComposer.open({kind:post.kind'));
});

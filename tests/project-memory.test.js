const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,'../tools/project-memory.mjs')).href);
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'lorefy-memory-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'project-memory/playbooks'),{recursive:true});
 await fs.mkdir(path.join(root,'project-memory/.obsidian'),{recursive:true});
 await fs.writeFile(path.join(root,'package.json'),JSON.stringify({name:'fixture',version:'1.0.0',description:'PRIVATE_DESCRIPTION',scripts:{test:'node --test'},dependencies:{'@capacitor/core':'8.4.3'}}));
 await fs.writeFile(path.join(root,'.env'),'SECRET_VALUE_NOT_FOR_MEMORY');
 return root;
}
test('snapshot uses allowlisted facts, detects drift and never exports secrets or arbitrary package fields',async t=>{
 const api=await load(),root=await fixture(t);
 await api.refresh(root,'2026-10-13T00:00:00Z');
 const note=await fs.readFile(path.join(root,'project-memory/04-Current-State.md'),'utf8');
 assert.match(note,/8\.4\.3/);assert.doesNotMatch(note,/SECRET_VALUE|PRIVATE_DESCRIPTION/);
 assert.equal((await api.checkFreshness(root)).fresh,true);
 await fs.writeFile(path.join(root,'package.json'),'{}');
 assert.equal((await api.checkFreshness(root)).fresh,false);
});
test('refresh preserves manual notes and refuses to overwrite a hand-written snapshot',async t=>{
 const api=await load(),root=await fixture(t),file=path.join(root,'project-memory/04-Current-State.md');
 await fs.writeFile(file,'My manual notes');
 await assert.rejects(api.refresh(root),/not a generated note/);
 assert.equal(await fs.readFile(file,'utf8'),'My manual notes');
});
test('local retrieval excludes Obsidian config and symlinks and supports Arabic queries',async t=>{
 const api=await load(),root=await fixture(t),vault=path.join(root,'project-memory');
 await fs.writeFile(path.join(vault,'00-Home.md'),'# Home\n[[playbooks/Frames]]');
 await fs.writeFile(path.join(vault,'playbooks/Frames.md'),'# Frames\nإطارات البنر\n[[00-Home]]');
 await fs.writeFile(path.join(vault,'.obsidian/private.md'),'SECRET');
 try{await fs.symlink(path.join(root,'.env'),path.join(vault,'leak.md'));}catch(e){if(e.code!=='EPERM')throw e;}
 const notes=await api.readNotes(vault);
 assert.deepEqual(notes.map(n=>n.path),['00-Home.md','playbooks/Frames.md']);
 assert.equal(api.searchNotes(notes,'إطارات')[0].path,'playbooks/Frames.md');
 assert.deepEqual(await api.validateLinks(root,notes),[]);
});
test('link validation reports unresolved, ambiguous and escaping links',async t=>{
 const api=await load(),root=await fixture(t);
 const notes=[{path:'00-Home.md',text:'[[Missing]] [[Same]] [escape](../../outside.md)'},{path:'a/Same.md',text:''},{path:'b/Same.md',text:''}];
 const issues=await api.validateLinks(root,notes);
 assert.ok(issues.some(i=>i.includes('Missing')));
 assert.ok(issues.some(i=>i.includes('ambiguous')));
 assert.ok(issues.some(i=>i.includes('outside the project')));
});

test('native Bases and Canvas wiki embeds resolve only inside the vault',async t=>{
 const api=await load(),root=await fixture(t),vault=path.join(root,'project-memory');
 await fs.mkdir(path.join(vault,'dashboards'));
 await fs.writeFile(path.join(vault,'dashboards/Work.base'),'{}');
 await fs.writeFile(path.join(vault,'dashboards/Map.canvas'),'{}');
 const notes=[{path:'00-Home.md',text:'![[dashboards/Work.base]] [[dashboards/Map.canvas|Map]]'}];
 assert.deepEqual(await api.validateLinks(root,notes),[]);
 notes[0].text+=' [[dashboards/Missing.base]] [[../outside.base]]';
 const issues=await api.validateLinks(root,notes);
 assert.equal(issues.length,2);
 assert.ok(issues.some(i=>i.includes('Missing.base')));
 assert.ok(issues.some(i=>i.includes('outside the vault')));
});

test('native dashboard links reject symlinks outside the vault even when the target exists',async t=>{
 const api=await load(),root=await fixture(t),vault=path.join(root,'project-memory');
 await fs.mkdir(path.join(root,'outside'));
 await fs.writeFile(path.join(root,'outside/Private.base'),'{}');
 await fs.symlink(path.join(root,'outside'),path.join(vault,'linked'),'junction');
 const issues=await api.validateLinks(root,[{path:'00-Home.md',text:'[[linked/Private.base]]'}]);
 assert.equal(issues.length,1);
 assert.match(issues[0],/outside the vault/);
});
test('bounded context preserves core guidance and includes relevant memory without changing files',async t=>{
 const api=await load(),root=await fixture(t),vault=path.join(root,'project-memory');
 for(const name of api.coreNotes)await fs.writeFile(path.join(vault,name),'# '+name+'\nRead current source before making claims.');
 await fs.writeFile(path.join(vault,'playbooks/Frames.md'),'# Frames\nBanner rules '+'.'.repeat(20000));
 const text=await api.context(root,'Banner',2500);
 assert.ok(text.length<=2500);assert.match(text,/00-Home/);assert.match(text,/Frames/);
});
test('the project agent contract reads memory and release packaging excludes the vault',async()=>{
 const root=path.resolve(__dirname,'..');
 assert.match(await fs.readFile(path.join(root,'AGENTS.md'),'utf8'),/npm run memory:context/);
 assert.match(await fs.readFile(path.join(root,'.easignore'),'utf8'),/^project-memory\/$/m);
 const prepare=await fs.readFile(path.join(root,'tools/prepare-ios-web.mjs'),'utf8');
 assert.doesNotMatch(prepare.slice(prepare.indexOf('const runtimeEntries'),prepare.indexOf('async function sourceExists')),/project-memory/);
});

test('freshness detects added, edited and deleted untracked source files without a Git repository',async t=>{
 const api=await load(),root=await fixture(t),folder=path.join(root,'modules');
 await fs.mkdir(folder);await fs.writeFile(path.join(folder,'new-feature.js'),'const feature = 1;');
 await api.refresh(root);
 await fs.writeFile(path.join(folder,'new-feature.js'),'const feature = 2;');
 assert.equal((await api.checkFreshness(root)).fresh,false);
 await api.refresh(root);await fs.writeFile(path.join(folder,'another.js'),'// new');
 assert.equal((await api.checkFreshness(root)).fresh,false);
 await api.refresh(root);await fs.unlink(path.join(folder,'another.js'));
 assert.equal((await api.checkFreshness(root)).fresh,false);
});

test('source inventory exports fingerprints, not file contents, credentials or generated bundles',async t=>{
 const api=await load(),root=await fixture(t);
 for(const dir of ['modules','modules/node_modules','ios-web','config','uploads/files','uploads/catalog-runtime'])await fs.mkdir(path.join(root,dir),{recursive:true});
 await fs.writeFile(path.join(root,'modules/example.js'),'PRIVATE_SOURCE_BODY');
 await fs.writeFile(path.join(root,'modules/.env'),'SECRET');
 await fs.writeFile(path.join(root,'modules/node_modules/leak.js'),'SECRET');
 await fs.writeFile(path.join(root,'config/lorefy-release.json'),'SECRET');
 await fs.writeFile(path.join(root,'ios-web/copied.js'),'GENERATED');
 await fs.writeFile(path.join(root,'uploads/files/lorefy-app.js'),'MAIN_APP_BODY');
 await fs.writeFile(path.join(root,'uploads/catalog-runtime/chunk.js'),'BULK_DATA');
 try{await fs.symlink(path.join(root,'.env'),path.join(root,'modules/linked.js'));}catch(e){if(e.code!=='EPERM')throw e;}
 const files=await api.inventorySources(root),raw=JSON.stringify(files);
 assert.ok(files.some(f=>f.path==='modules/example.js'));
 assert.ok(files.some(f=>f.path==='uploads/files/lorefy-app.js'));
 assert.doesNotMatch(raw,/PRIVATE_SOURCE_BODY|MAIN_APP_BODY|SECRET|BULK_DATA|node_modules|\.env|linked\.js|ios-web|lorefy-release/);
 assert.match(files.find(f=>f.path==='modules/example.js').sha256,/^[a-f0-9]{64}$/);
});

test('refresh creates source atlas links but refuses handwritten generated files before writing',async t=>{
 const api=await load(),root=await fixture(t);
 await fs.mkdir(path.join(root,'modules'));await fs.writeFile(path.join(root,'modules/feature.js'),'// feature');
 await api.refresh(root,'2026-10-14T00:00:00Z');
 const atlas=await fs.readFile(path.join(root,'project-memory/generated/Source-Modules.md'),'utf8');
 assert.match(atlas,/modules\/feature\.js/);
 const notes=await api.readNotes(path.join(root,'project-memory'));
 assert.deepEqual((await api.validateLinks(root,notes)).filter(i=>i.includes('missing source')),[]);
 const state=await fs.readFile(path.join(root,'project-memory/04-Current-State.md'),'utf8');
 await fs.writeFile(path.join(root,'project-memory/generated/Source-Modules.md'),'Keep my manual map');
 await assert.rejects(api.refresh(root),/not a generated/);
 assert.equal(await fs.readFile(path.join(root,'project-memory/04-Current-State.md'),'utf8'),state);
});

test('freshness also detects corruption of a generated source atlas',async t=>{
 const api=await load(),root=await fixture(t);
 await api.refresh(root);
 await fs.appendFile(path.join(root,'project-memory/07-Source-Atlas.md'),'\nCORRUPTED');
 assert.equal((await api.checkFreshness(root)).fresh,false);
});

test('memory graph inspection reports unreachable and duplicate notes without deleting them',async()=>{
 const api=await load();
 const notes=[{path:'00-Home.md',text:'# Home\n[[systems/Account|الحساب]]'},
 {path:'systems/Account.md',text:'# Account\n[[00-Home]]'},
 {path:'a/Copy.md',text:'# Identical note'},{path:'b/Copy.md',text:'# Identical note'}];
 const report=api.inspectNotes(notes);
 assert.deepEqual(report.orphanNotes,['a/Copy.md','b/Copy.md']);
 assert.deepEqual(report.duplicateGroups,[['a/Copy.md','b/Copy.md']]);
});

test('retrieval normalizes Arabic and prioritizes curated system knowledge over generated inventories',async()=>{
 const api=await load();
 const notes=[{path:'generated/Source-Modules.md',text:'# إطارات\nMany إطارات files'},
 {path:'systems/Profile.md',text:'# أبعاد الإطارات\nSource-checked contract'}];
 assert.equal(api.searchNotes(notes,'اطارات')[0].path,'systems/Profile.md');
});

test('context follows one relevant wiki connection without exceeding the context budget',async t=>{
 const api=await load(),root=await fixture(t),vault=path.join(root,'project-memory');
 for(const name of api.coreNotes)await fs.writeFile(path.join(vault,name),'# Guidance');
 await fs.mkdir(path.join(vault,'systems'));
 await fs.writeFile(path.join(vault,'systems/Search.md'),'# searchworker\n[[systems/Account]]');
 await fs.writeFile(path.join(vault,'systems/Account.md'),'# account-ownership-contract');
 const output=await api.context(root,'searchworker',2500);
 assert.match(output,/account-ownership-contract/);assert.ok(output.length<=2500);
});

test('canvas validates unique node IDs, local note paths and connected edges',async()=>{
 const api=await load(),map={nodes:[{id:'app',file:'systems/App.md',x:0,y:0},{id:'data',file:'systems/Data.md',x:440,y:0}],edges:[{from:'app',to:'data',label:'reads'}]};
 const canvas=api.buildCanvas(map);
 assert.equal(canvas.nodes[0].type,'file');assert.equal(canvas.edges[0].toNode,'data');
 assert.throws(()=>api.buildCanvas({...map,nodes:[...map.nodes,map.nodes[0]]}),/duplicate/i);
 assert.throws(()=>api.buildCanvas({...map,nodes:[{id:'bad',file:'../.env',x:0,y:0}]}),/local note/i);
 assert.throws(()=>api.buildCanvas({...map,edges:[{from:'app',to:'unknown'}]}),/unknown/i);
});

test('source inventory rejects traversal through a symlinked ancestor directory',async t=>{
 const api=await load(),root=await fixture(t),outside=await fs.mkdtemp(path.join(os.tmpdir(),'lorefy-memory-outside-'));
 t.after(()=>fs.rm(outside,{recursive:true,force:true}));
 await fs.mkdir(path.join(outside,'migrations'));await fs.writeFile(path.join(outside,'migrations/private.sql'),'PRIVATE_BODY');
 try{await fs.symlink(outside,path.join(root,'supabase'),'junction');}catch(e){if(e.code==='EPERM'){t.skip('Symlink permission unavailable');return;}throw e;}
 assert.ok(!(await api.inventorySources(root)).some(f=>f.path.includes('private.sql')));
});

test('refresh builds the canvas from a curated map and detects map drift',async t=>{
 const api=await load(),root=await fixture(t),vault=path.join(root,'project-memory');
 await fs.writeFile(path.join(vault,'00-Home.md'),'# Home');
 const map={nodes:[{id:'home',file:'00-Home.md',x:0,y:0}],edges:[]},file=path.join(vault,'brain-map.json');
 await fs.writeFile(file,JSON.stringify(map));await api.refresh(root);
 const canvas=JSON.parse(await fs.readFile(path.join(vault,'generated/Project-Brain.canvas'),'utf8'));
 assert.equal(canvas.nodes[0].file,'00-Home.md');assert.equal((await api.checkFreshness(root)).fresh,true);
 map.nodes[0].x=440;await fs.writeFile(file,JSON.stringify(map));
 assert.equal((await api.checkFreshness(root)).fresh,false);
});

test('every unit-test command documented in the feature router names an existing test',async()=>{
 const root=path.resolve(__dirname,'..'),router=await fs.readFile(path.join(root,'project-memory/08-Feature-Router.md'),'utf8');
 const names=[...router.matchAll(/tests\/[a-z0-9-]+\.test\.js/g)].map(m=>m[0]);
 assert.ok(names.length>=20);
 for(const name of names)await fs.access(path.join(root,name));
});

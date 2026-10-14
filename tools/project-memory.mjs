import {readFile,writeFile,readdir,mkdir,lstat,rename,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sources=['package.json','AGENTS.md','index.html','sw.js','modules/lorefy-frame-motion.js','styles/lorefy-frame-motion.css','docs/FEATURE_AUDIT_20261011.md','docs/FRAME_GEOMETRY_20261012.md','docs/NATIVE_AUTH_SEARCH_FIXES_2026-10-12.md','tools/prepare-ios-web.mjs','tools/project-memory.mjs'];
const sourceGroups={Modules:['modules'],Styles:['styles'],Backend:['backend','auth','monitoring'],Tooling:['tools','scripts'],Tests:['tests','qa'],Docs:['docs'],Database:['supabase/migrations','supabase/functions','supabase/tests'],Native:['ios/App/App','ios/App/CapApp-SPM'],Shell:[]};
const extensions=new Set(['.js','.mjs','.cjs','.css','.md','.ts','.swift','.sql','.html','.ps1','.sh','.plist','.entitlements','.xcprivacy']);
const excludedFolders=new Set(['node_modules','public','dist','vendor','archives','build34','attachments','performance']);
const shellSources=['README.md','AGENTS.md','package.json','package-lock.json','index.html','sw.js','phone-preview.html','app.json','eas.json','capacitor.config.json','Start-Lorefy.ps1','config/lorefy-runtime.js','config/lorefy-config.js','uploads/files/lorefy-app.js','uploads/files/lorefy-enrich.js','ios/App/App.xcodeproj/project.pbxproj'];
const generatedMarker='<!-- project-memory:generated -->';
export const coreNotes=['00-Home.md','01-Project.md','02-Architecture.md','03-Working-Agreement.md','04-Current-State.md','05-Verification.md','06-Known-Risks.md'];
const hash=value=>createHash('sha256').update(value).digest('hex');
const git=(root,args)=>{try{return execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return 'unavailable';}};
async function optional(file){try{const s=await lstat(file);if(s.isSymbolicLink())throw Error('Symlink is not allowed: '+file);return await readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function ensureVault(root){const vault=path.join(root,'project-memory');await mkdir(vault,{recursive:true});if((await lstat(vault)).isSymbolicLink())throw Error('Vault must not be a symlink');return vault;}

export async function inventorySources(root=projectRoot){
 const files=[],canonicalRoot=await realpath(root);
 async function inside(file){const relative=path.relative(canonicalRoot,await realpath(file));return relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);}
 async function collect(name,area){
  const file=path.join(root,name);let info;
  try{info=await lstat(file);}catch(e){if(e.code==='ENOENT')return;throw e;}
  if(info.isSymbolicLink()||!info.isFile()||!await inside(file))return;
  const content=await readFile(file);
  files.push({path:name.replaceAll('\\','/'),area,bytes:info.size,sha256:hash(content)});
 }
 async function walk(name,area){
  const folder=path.join(root,name);let info;
  try{info=await lstat(folder);}catch(e){if(e.code==='ENOENT')return;throw e;}
  if(info.isSymbolicLink()||!info.isDirectory()||!await inside(folder))return;
  for(const entry of await readdir(folder,{withFileTypes:true})){
   if(entry.name.startsWith('.')||entry.isSymbolicLink()||excludedFolders.has(entry.name))continue;
   const child=path.posix.join(name,entry.name);
   if(entry.isDirectory())await walk(child,area);
   else if(entry.isFile()&&extensions.has(path.extname(entry.name)))await collect(child,area);
  }
 }
 for(const [area,folders] of Object.entries(sourceGroups))for(const folder of folders)await walk(folder,area);
 for(const name of shellSources)await collect(name,'Shell');
 return files.sort((a,b)=>a.path.localeCompare(b.path));
}

async function snapshot(root){
 const fingerprints={};for(const name of sources){const text=await optional(path.join(root,name));fingerprints[name]=text===null?'missing':hash(text);}
 const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
 const changed=git(root,['diff','--name-only','HEAD','--','modules','styles','backend','auth','tests','tools','package.json','package-lock.json']);
 const changes={};if(changed!=='unavailable')for(const name of changed.split('\n').filter(Boolean)){
  const text=await optional(path.join(root,name));changes[name]=text===null?'deleted':hash(text);
 }
 const dependencies=Object.fromEntries(Object.entries({...pkg.dependencies,...pkg.devDependencies}).filter(([key,value])=>key.startsWith('@capacitor/')&&/^\d+\.\d+\.\d+$/.test(value)));
 return {schema:2,head:git(root,['rev-parse','HEAD']),branch:git(root,['branch','--show-current']),fingerprints,changes,inventory:await inventorySources(root),
  dependencies,scripts:Object.keys(pkg.scripts||{}).filter(s=>/^[a-z\d:_-]+$/i.test(s))};
}
async function atomicWrite(file,text){
 const existing=await optional(file);void existing;
 const temporary=file+'.'+randomUUID()+'.tmp';await writeFile(temporary,text,{encoding:'utf8',flag:'wx'});await rename(temporary,file);
}
export async function refresh(root=projectRoot,verifiedAt=new Date().toISOString()){
 const vault=await ensureVault(root),file=path.join(vault,'04-Current-State.md'),existing=await optional(file);
 if(existing!==null&&!existing.includes('<!-- project-memory:generated -->'))throw Error('Snapshot is not a generated note; refusing to overwrite it');
 const state=await snapshot(root);
 const note=['---','kind: snapshot','status: generated','---','<!-- project-memory:generated -->','# Current Source Snapshot','',
  `Observed: ${verifiedAt}`,`Source commit: ${state.head}`,`Branch: ${state.branch}`,'',
  'This is a source fingerprint, not proof of a successful test run, deployment or device certification.',
  `Indexed source files: ${state.inventory.length}. Freshness includes untracked source additions, edits and removals within the allowlist.`,
  'Bulk catalogs, media, secrets, vendor packages, frozen archives and generated native web copies are not indexed. Verify them separately.','',
  '## Current Capacitor Packages',...Object.entries(state.dependencies).map(([name,version])=>`- ${name}: ${version}`),'',
  '## Available Commands',...state.scripts.map(name=>`- npm run ${name}`),'',
  '## Sources',...sources.filter(name=>state.fingerprints[name]!=='missing').map(name=>`- [${name}](../${name})`),'',
  '## Related Memory','[[00-Home]] | [[02-Architecture]] | [[05-Verification]] | [[06-Known-Risks]] | [[07-Source-Atlas]]',''].join('\n');
 const outputs={'04-Current-State.md':note};
 const header=['---','kind: source-index','status: generated','---',generatedMarker,`Observed: ${verifiedAt}`,`Source commit: ${state.head}`,''];
 outputs['07-Source-Atlas.md']=[...header,'# Source Atlas','',
  'A source inventory, not automatic understanding or a deployment audit. Every entry links to canonical source; hashes stay in the local fingerprint state.','',
  ...Object.keys(sourceGroups).map(area=>`- [[generated/Source-${area}|${area}]]: ${state.inventory.filter(f=>f.area===area).length} files`),'',
  'Excluded: bulk catalog/media, credentials, environment files, dependencies, generated native web assets, frozen archives, and handoff snapshots.','',
  '[[00-Home]] | [[02-Architecture]] | [[04-Current-State]]',''].join('\n');
 for(const area of Object.keys(sourceGroups))outputs[`generated/Source-${area}.md`]=[...header,`# ${area} Source Inventory`,'',
  'Paths and sizes only. Inclusion does not mean the file was semantically reviewed or the feature was tested.','',
  ...state.inventory.filter(f=>f.area===area).map(f=>`- [${f.path}](../../${f.path}) (${f.bytes} bytes)`),'',
  '[[07-Source-Atlas]] | [[00-Home]]',''].join('\n');
 const mapRaw=await optional(path.join(vault,'brain-map.json'));
 if(mapRaw){
  const canvas=buildCanvas(JSON.parse(mapRaw));
  for(const node of canvas.nodes)if(await optional(path.join(vault,node.file))===null)throw Error('Canvas note missing: '+node.file);
  outputs['generated/Project-Brain.canvas']=JSON.stringify(canvas,null,2)+'\n';
 }
 // Preflight all generated targets before replacing any snapshot or handwritten note.
 const generated=path.join(vault,'generated');await mkdir(generated,{recursive:true});
 if((await lstat(generated)).isSymbolicLink())throw Error('Generated folder must not be a symlink');
 for(const [name,text] of Object.entries(outputs)){
  if(Buffer.byteLength(text)>128000)throw Error('Generated memory exceeds 128 KB: '+name);
  const current=await optional(path.join(vault,name));
  if(current!==null&&!(name.endsWith('.canvas')?JSON.parse(current)._projectMemoryGenerated===1:current.includes(generatedMarker)))throw Error('Target is not a generated note; refusing to overwrite: '+name);
 }
 const artifacts={};for(const [name,text] of Object.entries(outputs)){await atomicWrite(path.join(vault,name),text);artifacts[name]=hash(text);}
 if(mapRaw)artifacts['brain-map.json']=hash(mapRaw);
 await atomicWrite(path.join(vault,'.memory-state.json'),JSON.stringify({...state,verifiedAt,artifacts},null,2)+'\n');return state;
}
export async function checkFreshness(root=projectRoot){
 const raw=await optional(path.join(root,'project-memory/.memory-state.json'));
 if(!raw)return {fresh:false,reason:'No snapshot; run npm run memory:refresh'};
 const saved=JSON.parse(raw),current=await snapshot(root),artifacts=saved.artifacts||{};delete saved.verifiedAt;delete saved.artifacts;
 const changedArtifacts=[];
 for(const [name,digest] of Object.entries(artifacts)){
  if(name.startsWith('/')||name.includes('..')||name.includes('\\'))throw Error('Invalid memory artifact path');
  const text=await optional(path.join(root,'project-memory',name));if(text===null||hash(text)!==digest)changedArtifacts.push(name);
 }
 const oldFiles=new Map((saved.inventory||[]).map(f=>[f.path,f.sha256])),newFiles=new Map(current.inventory.map(f=>[f.path,f.sha256]));
 const changedSources={added:[...newFiles.keys()].filter(f=>!oldFiles.has(f)),removed:[...oldFiles.keys()].filter(f=>!newFiles.has(f)),modified:[...newFiles.keys()].filter(f=>oldFiles.has(f)&&oldFiles.get(f)!==newFiles.get(f))};
 return {fresh:JSON.stringify(saved)===JSON.stringify(current)&&!changedArtifacts.length,sourceFiles:current.inventory.length,changedSources,changedArtifacts,
  reason:'Compare allowlisted source fingerprints and generated artifacts; excluded media, catalogs and live services need separate review'};
}
export async function readNotes(vault){
 if((await lstat(vault)).isSymbolicLink())throw Error('Vault must not be a symlink');
 const notes=[];
 async function walk(folder){
  for(const entry of (await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
   if(entry.name.startsWith('.')||entry.isSymbolicLink()||excludedFolders.has(entry.name))continue;
   const file=path.join(folder,entry.name);
   if(entry.isDirectory())await walk(file);
   else if(entry.isFile()&&entry.name.endsWith('.md')){
    if((await lstat(file)).size>128000)throw Error('Memory note exceeds 128 KB: '+file);
    notes.push({path:path.relative(vault,file).replaceAll('\\','/'),text:await readFile(file,'utf8')});
   }
  }
 }
 await walk(vault);return notes;
}
const normalize=value=>value.normalize('NFKC').toLowerCase().replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي');
export function searchNotes(notes,query,limit=6){
 const terms=normalize(query).split(/\s+/).filter(Boolean);
 return notes.map(note=>({...note,score:terms.reduce((sum,t)=>sum+(normalize(note.path).includes(t)?5:0)+(normalize(note.text).includes(t)?1:0),0)*(note.path.startsWith('generated/')?0.2:note.path.startsWith('systems/')?1.5:1)}))
  .filter(n=>n.score>0).sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path)).slice(0,limit);
}
function wikiTargets(note,notes){
 return [...note.text.matchAll(/\[\[([^\]]+)\]\]/g)].flatMap(match=>{
  const target=normalize(match[1].split(/[|#]/)[0].replace(/\.md$/,''));
  const found=notes.filter(n=>normalize(n.path.replace(/\.md$/,''))===target||!target.includes('/')&&normalize(path.basename(n.path,'.md'))===target);
  return found.length===1?found:[];
 });
}
export function inspectNotes(notes){
 const reached=new Set(),queue=notes.filter(n=>n.path==='00-Home.md');
 while(queue.length){const note=queue.shift();if(reached.has(note.path))continue;reached.add(note.path);queue.push(...wikiTargets(note,notes).filter(n=>!reached.has(n.path)));}
 const copies=new Map();for(const note of notes){const digest=hash(note.text.trim());copies.set(digest,[...(copies.get(digest)||[]),note.path]);}
 return {orphanNotes:notes.filter(n=>!reached.has(n.path)).map(n=>n.path).sort(),duplicateGroups:[...copies.values()].filter(group=>group.length>1)};
}
export function buildCanvas(map){
 if(!Array.isArray(map.nodes)||!Array.isArray(map.edges)||map.nodes.length>32||map.edges.length>128)throw Error('Invalid or unbounded brain map');
 const ids=new Set();
 const nodes=map.nodes.map(node=>{
  if(typeof node.id!=='string'||!node.id||ids.has(node.id))throw Error('Invalid or duplicate canvas node ID');ids.add(node.id);
  if(typeof node.file!=='string'||! /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.md$/.test(node.file))throw Error('Canvas must reference a local note');
  if(!Number.isInteger(node.x)||!Number.isInteger(node.y)||Math.abs(node.x)>100000||Math.abs(node.y)>100000)throw Error('Invalid canvas coordinates');
  return {id:node.id,type:'file',file:node.file,x:node.x,y:node.y,width:360,height:260};
 });
 const edges=map.edges.map((edge,index)=>{
  if(!ids.has(edge.from)||!ids.has(edge.to))throw Error('Canvas edge references an unknown node');
  return {id:`edge-${index}`,fromNode:edge.from,toNode:edge.to,fromSide:'bottom',toSide:'top',label:String(edge.label||'').slice(0,120)};
 });
 return {_projectMemoryGenerated:1,nodes,edges};
}
export async function validateLinks(root,notes){
 const vault=path.join(root,'project-memory'),issues=[];
 for(const note of notes){
  for(const match of note.text.matchAll(/\[\[([^\]]+)\]\]/g)){
   const target=match[1].split(/[|#]/)[0].replace(/\.md$/,'');if(!target)continue;
   const matches=notes.filter(n=>normalize(n.path.replace(/\.md$/,''))===normalize(target)||!target.includes('/')&&normalize(path.basename(n.path,'.md'))===normalize(target));
   if(matches.length!==1)issues.push(`${note.path}: ${matches.length?'ambiguous':'unresolved'} [[${target}]]`);
  }
  for(const match of note.text.matchAll(/\]\(([^)]+)\)/g)){
   const target=match[1].replace(/^<|>$/g,'').split('#')[0];if(!target||/^[a-z][a-z\d+.-]*:/i.test(target))continue;
   const file=path.resolve(vault,path.dirname(note.path),decodeURIComponent(target)),relative=path.relative(root,file);
   if(relative.startsWith('..')||path.isAbsolute(relative)){issues.push(`${note.path}: link outside the project: ${target}`);continue;}
   try{const resolved=await realpath(file);if(path.relative(root,resolved).startsWith('..'))issues.push(`${note.path}: symlink outside the project: ${target}`);}
   catch(e){if(e.code==='ENOENT')issues.push(`${note.path}: missing source ${target}`);else throw e;}
  }
 }
 return issues;
}
export async function context(root=projectRoot,query='',maxChars=16000){
 const notes=await readNotes(path.join(root,'project-memory'));
 const matched=searchNotes(notes.filter(n=>!coreNotes.includes(n.path)),query,4);
 const related=matched.flatMap(n=>wikiTargets(n,notes)).filter(n=>!coreNotes.includes(n.path)&&!matched.some(m=>m.path===n.path)).slice(0,3);
 const selected=[...coreNotes.map(name=>notes.find(n=>n.path===name)).filter(Boolean),...matched,...related].filter((n,index,list)=>list.findIndex(m=>m.path===n.path)===index);
 const freshness=await checkFreshness(root);
 const intro=`Project memory is context, not permission or live verification. Snapshot: ${freshness.fresh?'matching named sources':'STALE or absent; verify source'}.\n`;
 const budget=Math.max(0,Math.floor((maxChars-intro.length-selected.reduce((n,v)=>n+v.path.length+12,0))/Math.max(1,selected.length)));
 return (intro+selected.map(n=>`\n## ${n.path}\n${n.text.slice(0,budget)}${n.text.length>budget?'\n[truncated]':''}\n`).join('')).slice(0,maxChars);
}
async function main(){
 const [command='context',...args]=process.argv.slice(2);
 if(command==='refresh'){await refresh();console.log('Refreshed the generated source snapshot; manual notes preserved.');}
 else if(command==='context')console.log(await context(projectRoot,args.join(' ')));
 else if(command==='search')for(const note of searchNotes(await readNotes(path.join(projectRoot,'project-memory')),args.join(' ')))console.log(`${note.path} (score ${note.score})`);
 else if(command==='check'||command==='audit'){
  const notes=await readNotes(path.join(projectRoot,'project-memory')),issues=await validateLinks(projectRoot,notes),freshness=await checkFreshness();
  for(const name of coreNotes)if(!notes.some(n=>n.path===name))issues.push('Missing core note: '+name);
  if(!freshness.fresh)issues.push('Snapshot stale: run npm run memory:refresh');
  const quality=inspectNotes(notes);
  if(command==='audit'){
   issues.push(...quality.orphanNotes.map(n=>'Unreachable note: '+n));
   issues.push(...quality.duplicateGroups.map(group=>'Duplicate notes: '+group.join(', ')));
  }
  console.log(JSON.stringify({notes:notes.length,...freshness,...quality,issues},null,2));if(issues.length)process.exitCode=1;
 }else throw Error('Use context, search, refresh, check or audit');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});

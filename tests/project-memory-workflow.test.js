const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const YAML=require('yaml');
const vault=path.resolve(__dirname,'../project-memory');
const read=name=>fs.readFile(path.join(vault,name),'utf8');
const metadata=text=>YAML.parse(text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);

test('native YAML property edits keep booleans and null review dates intact',()=>{
 const props=metadata('---\nkind: bug\nstatus: open\nsource_verified: false\nreviewed_on: null\n---\n# Example');
 assert.equal(props.kind,'bug');assert.equal(props.source_verified,false);assert.equal(props.reviewed_on,null);
});

test('native dashboards use bounded local Bases views, not executable plugins',async()=>{
 for(const name of ['Work','Knowledge','Sessions']){
  const base=YAML.parse(await read('dashboards/'+name+'.base'));
  assert.deepEqual(YAML.parse(YAML.stringify(base)),base);
  assert.ok(base.filters.and.includes('file.ext == "md"'));
  assert.ok(base.views.length>0&&base.views.length<=5);
  for(const view of base.views){assert.equal(view.type,'table');assert.ok(view.order.includes('file.name'));}
  assert.doesNotMatch(JSON.stringify(base),/https?:|javascript:|eval\(|fetch\(/);
 }
 const knowledge=YAML.parse(await read('dashboards/Knowledge.base'));
 assert.match(knowledge.formulas.review_due,/reviewed_on/);
 assert.match(knowledge.formulas.review_due,/true\)/);
 assert.doesNotMatch(knowledge.formulas.review_due,/mtime|ctime/);
});

test('work items retain explicit source, device and service evidence boundaries',async()=>{
 const files=(await fs.readdir(path.join(vault,'bugs'))).filter(name=>name.endsWith('.md'));
 assert.ok(files.length>=3);
 for(const file of files){
  const note=await read('bugs/'+file),props=metadata(note);
  assert.equal(props.kind,'bug');
  assert.match(props.id,/^(LF-\d{3}|APNS-\d{3})$/);
  assert.match(props.priority,/^P[0-3]$/);
  assert.ok(['open','needs-device','needs-service','closed'].includes(props.status));
  assert.match(props.reviewed_on,/^\d{4}-\d{2}-\d{2}$/);
  assert.match(props.source_commit,/^[a-f\d]{7,40}$/);
  assert.equal(typeof props.source_verified,'boolean');
  assert.equal(typeof props.device_verified,'boolean');
  assert.equal(typeof props.service_verified,'boolean');
  if(props.status==='closed'){
   assert.ok(props.verified_on&&props.resolution_evidence);
   assert.equal(props.source_verified,true);
   if(props.requires_device)assert.equal(props.device_verified,true);
   if(props.requires_service)assert.equal(props.service_verified,true);
  }
  assert.match(note,/\[\[12-Device-Repairs/);
  assert.match(note,/\[\[15-Work-Control/);
 }
});

test('work templates never certify source, device or services on creation',async()=>{
 const bug=metadata(await read('templates/Bug.md'));
 assert.equal(bug.kind,'bug');assert.equal(bug.status,'open');
 for(const name of ['source_verified','device_verified','service_verified'])assert.equal(bug[name],false);
 assert.equal(bug.reviewed_on,null);assert.equal(bug.verified_on,null);
 const session=metadata(await read('templates/Session.md'));
 assert.equal(session.kind,'session');assert.equal(session.status,'in-progress');
 assert.equal(session.verified_on,null);
 const decision=metadata(await read('templates/Decision.md'));
 assert.equal(decision.kind,'decision');assert.equal(decision.status,'proposed');
});

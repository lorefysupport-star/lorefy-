const test=require('node:test'),assert=require('node:assert/strict');
const requests=require('../modules/lorefy-catalog-requests.js');
function storage(){const data=new Map();return{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};}
test('missing works remain account-scoped review drafts, never automatic catalog publications',()=>{
 const store=storage(),a=requests.create(store,'user-a'),b=requests.create(store,'user-b');
 const first=a.save({title:'Missing novel',type:'Novel',url:'https://openlibrary.org/works/OL1W'});
 assert.equal(first.status,'local-draft');assert.equal(a.list().length,1);assert.equal(b.list().length,0);
 assert.equal(a.save({title:'Missing novel',type:'Novel',url:first.url}).id,first.id);
 assert.equal(a.list().length,1);a.remove(first.id);assert.equal(a.list().length,0);
});
test('missing work references reject private hosts, credentials and non-web schemes',()=>{
 for(const url of ['javascript:alert(1)','file:///tmp/a','http://127.0.0.1/a','http://192.168.1.2','https://user:password@example.org','http://[::1]','http://0x7f000001','http://169.254.169.254','https://secret.local']){
  assert.throws(()=>requests.create(storage(),'a').save({title:'Title',type:'Novel',url}),/reference/);
 }
 assert.throws(()=>requests.create(storage(),'').save({title:'Title',type:'Novel',url:'https://example.org'}),/account/);
});
test('draft writes report storage failure and validate required fields',()=>{
 const a=requests.create({getItem:()=>null,setItem(){throw Error('full')}},'a');
 assert.throws(()=>a.save({title:'Title',type:'Novel',url:'https://example.org'}),/full/);
 assert.throws(()=>requests.create(storage(),'a').save({title:'',type:'Novel',url:'https://example.org'}),/title/);
});

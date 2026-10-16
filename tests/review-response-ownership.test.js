const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');

function harness(action) {
  const values = new Map([['lorefy.activeUser.v1','a'],['lorefy.session.v1',JSON.stringify({userId:'a'})]]);
  const writes = [], calls = [], timers=[];
  let resolve, reject;
  const pending = new Promise((yes,no)=>{resolve=yes;reject=no;});
  const backend = {mode:'live',user:{id:'a'},_communityEpoch:0};
  const method = {publish:'publishReview',remove:'deleteReview',reply:'addReviewComment'}[action];
  backend[method]=(...args)=>{calls.push(args);return pending;};
  const storage = {getItem:key=>values.get(key) ?? null,setItem:(key,value)=>values.set(key,String(value))};
  const mark = name => (...args)=>writes.push(name);
  const scope = {m:{id:'work',title:'Work'}, G:4,J:'First account',Y:'first',Z:'',Fe:null,se:false,
    ct:{current:'First draft'},pt:{current:'First moment'},ft:[],ze:{},gt:false,
    window:{localStorage:storage,LorefyBackend:backend,dispatchEvent:mark('refresh')},
    document:{querySelector:()=>{writes.push('query editor');return null;}},
    CustomEvent:class {}, A:mark('toast'),fo:mark('reviews'),ht:mark('images'),Wo:mark('notifications'),
    bo:mark('success'),Se:mark('close'),dt:mark('rating'),no:mark('metrics'),ro:mark('recommend'),io:mark('spoiler'),
    Io:mark('comments'),It:mark('active comment'),S:mark('screen'),At:mark('detail'),ve:null,Ao:'main',
    setTimeout:fn=>{writes.push('timer');timers.push(fn);}};
  vm.createContext(scope);
  const guardStart=source.indexOf('function lorefyReviewRequestScope(');
  if(guardStart>=0) vm.runInContext(source.slice(guardStart,source.indexOf('const{useState',guardStart)),scope);
  const start=source.indexOf({publish:'tr=async()=>',remove:'qo=async t=>',reply:'Ko=async(t,r,o)=>'}[action]);
  const end=source.indexOf({publish:',qo=async',remove:',or=()=>',reply:',Jo=t=>'}[action],start);
  assert.ok(start>=0 && end>start);
  const name={publish:'tr',remove:'qo',reply:'Ko'}[action];
  vm.runInContext('const '+source.slice(start,end)+';this.run='+name+';',scope);
  return {scope,backend,storage,writes,calls,resolve,reject,timers,
    run:()=>action==='reply'?scope.run('review','Reply text'):scope.run('review'),
    switchAccount() { backend.user={id:'b'}; backend._communityEpoch++; storage.setItem('lorefy.activeUser.v1','b');
      storage.setItem('lorefy.session.v1',JSON.stringify({userId:'b'}));
      scope.ct.current='Next account draft';scope.pt.current='Next account moment'; }};
}

for(const action of ['publish','remove','reply']) {
  test('late '+action+' success cannot write UI state after account switch', async()=>{
    const h=harness(action), request=h.run(); assert.equal(h.calls.length,1);
    h.switchAccount();h.resolve({id:'saved',body:'Reply text'});await request;
    assert.deepEqual(h.writes,[]);
    assert.equal(h.scope.ct.current,'Next account draft');
    assert.equal(h.scope.pt.current,'Next account moment');
  });
  test('late '+action+' failure does not show an old error in a new session', async()=>{
    const h=harness(action), request=h.run();h.backend._communityEpoch++;
    h.reject(Error('Old request failed'));await request;
    assert.deepEqual(h.writes,[]);
  });
}

test('an unchanged account still completes successful review mutations',async()=>{
  for(const action of ['publish','remove','reply']) {
    const h=harness(action),request=h.run();h.resolve({id:'saved',body:'Reply text'});await request;
    assert.ok(h.writes.includes(action==='reply'?'comments':'reviews'),action);
  }
});

test('local owner mismatch invalidates a response even before backend identity refreshes',async()=>{
  const h=harness('publish'),request=h.run();h.storage.setItem('lorefy.activeUser.v1','b');
  h.resolve({id:'saved'});await request;assert.deepEqual(h.writes,[]);
});

test('a replaced backend instance cannot finish an earlier review request',async()=>{
  const h=harness('publish'),request=h.run();h.scope.window.LorefyBackend={...h.backend};
  h.resolve({id:'saved'});await request;assert.deepEqual(h.writes,[]);
});

test('unreadable owner state fails closed before sending a review mutation',async()=>{
  const h=harness('publish');h.storage.setItem('lorefy.session.v1','{broken');
  const request=h.run();h.resolve({id:'saved'});await request;
  assert.equal(h.calls.length,0);assert.deepEqual(h.writes,[]);
});

test('an old success timer cannot update a new account',async()=>{
  const h=harness('publish'),request=h.run();h.resolve({id:'saved'});await request;
  assert.equal(h.timers.length,1);h.switchAccount();h.writes.length=0;h.timers[0]();
  assert.deepEqual(h.writes,[]);
});

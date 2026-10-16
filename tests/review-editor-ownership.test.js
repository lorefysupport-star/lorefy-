const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');

function harness() {
  const values = new Map([['lorefy.activeUser.v1','a'],['lorefy.session.v1','{"userId":"a"}']]);
  const writes=[], calls=[], timers=[];
  let resolve,reject;
  const pending=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const mark=name=>(...args)=>writes.push(name);
  const backend={mode:'live',user:{id:'a'},_communityEpoch:0,publishReview:body=>{calls.push(body);return pending;}};
  const scope={window:{LorefyBackend:backend,localStorage:{getItem:key=>values.get(key)||null},dispatchEvent:mark('refresh'),
    LorefySavedReviewDraft:require('../modules/lorefy-review-editor').savedDraft,LorefyReviewComposer:()=>{}},
    React:{createElement:(type,props)=>({type,props})},currentUILang:()=> 'en',I:()=>'',getScoreFields:()=>[],
    m:{id:'work',title:'A work'},M:[],G:4,J:'Reader',Y:'reader',Z:'',Fe:null,se:false,ze:{},gt:false,
    ct:{current:''},pt:{current:''},ft:[],reviewEditor:{current:null},on:true,
    dt:mark('rating'),no:mark('metrics'),ht:mark('images'),ro:mark('recommend'),io:mark('spoiler'),
    Se:mark('close'),fo:mark('reviews'),Wo:mark('notifications'),bo:mark('success'),A:mark('toast'),
    Yn(){},Yt(){},StarBtn(){},X(){},ThumbsUp(){},Plus(){},Lock(){},CustomEvent:class {},
    setTimeout:fn=>{timers.push(fn);}};
  vm.createContext(scope);
  const guard=source.indexOf('function lorefyReviewRequestScope(');
  vm.runInContext(source.slice(guard,source.indexOf('const{useState',guard)),scope);
  const opener=source.indexOf('"data-lorefy-action":"write-review",onClick:()=>{');
  const body=source.indexOf('onClick:()=>{',opener)+'onClick:()=>{'.length;
  vm.runInContext('this.open=()=>{'+source.slice(body,source.indexOf('},style:',body))+'};',scope);
  const publish=source.indexOf('tr=async()=>');
  vm.runInContext('const '+source.slice(publish,source.indexOf(',qo=async',publish))+';this.publish=tr;',scope);
  const render=source.indexOf('fr=()=>');
  vm.runInContext('const '+source.slice(render,source.indexOf(',hr=()=>',render))+';this.render=fr;',scope);
  scope.open();scope.ct.current='First draft';scope.pt.current='First moment';writes.length=0;
  return {scope,writes,calls,resolve,reject,timers,
    switchAccount(){values.set('lorefy.activeUser.v1','b');values.set('lorefy.session.v1','{"userId":"b"}');backend.user={id:'b'};backend._communityEpoch++;},
    reopen(){scope.open();scope.ct.current='New draft';scope.pt.current='New moment';writes.length=0;}};
}

test('a draft opened by the previous account cannot be submitted by the next account',async()=>{
  const h=harness();h.switchAccount();const request=h.scope.publish();h.resolve({id:'saved'});await request;
  assert.equal(h.calls.length,0);assert.deepEqual(h.writes,[]);
});

test('an obsolete account editor is no longer rendered',()=>{
  const h=harness();h.switchAccount();assert.equal(h.scope.render(),null);
});

test('reopening the same work gets a distinct composer key and starts a clean draft',()=>{
  const h=harness(),first=h.scope.render();h.reopen();const second=h.scope.render();
  assert.notEqual(first.props.key,second.props.key);
  assert.equal(h.scope.ct.current,'New draft');
});

for(const outcome of ['success','failure']) {
  test('late publish '+outcome+' cannot change a replacement editor in the same account',async()=>{
    const h=harness(),request=h.scope.publish();h.reopen();
    if(outcome==='success')h.resolve({id:'saved'});else h.reject(Error('Old failure'));
    await request;assert.deepEqual(h.writes,[]);
    assert.equal(h.scope.ct.current,'New draft');assert.equal(h.scope.pt.current,'New moment');
  });
}

test('closed editors reject late success and their retained publish action',async()=>{
  const h=harness(),first=h.scope.render(),request=first.props.onPublish();
  first.props.onClose();h.writes.length=0;h.resolve({id:'saved'});await request;
  await first.props.onPublish();assert.equal(h.calls.length,1);assert.deepEqual(h.writes,[]);
});

test('retained field callbacks cannot modify a newly opened editor',()=>{
  const h=harness(),first=h.scope.render();h.reopen();
  first.props.onRating(1);first.props.onMetric('story',1);first.props.onRecommend('no');
  first.props.onSpoiler(true);first.props.onRemoveImage(0);first.props.onClose();
  assert.deepEqual(h.writes,[]);
  assert.equal(first.props.isCurrent(),false);assert.equal(h.scope.render().props.isCurrent(),true);
});

test('the current editor still publishes and a current failure preserves its draft',async()=>{
  const h=harness(),request=h.scope.publish();h.resolve({id:'saved'});await request;
  assert.ok(h.writes.includes('reviews'));assert.ok(h.writes.includes('close'));assert.equal(h.scope.ct.current,'');
  const failed=harness(),retry=failed.scope.publish();failed.reject(Error('Offline'));await retry;
  assert.deepEqual(failed.writes,['toast']);assert.equal(failed.scope.ct.current,'First draft');
});

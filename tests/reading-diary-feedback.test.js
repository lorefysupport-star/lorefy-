const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../modules/lorefy-reading-diary-core.js');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-reading-diary.js'),'utf8');
for(const kind of ['note','quote'])test(`${kind} save returns success and announces it after persisting`,()=>{
 let saved=[],messages=[];
 const scope={state:{composeKind:kind,owner:'a',composing:true},diaryOwner:()=> 'a',entries:()=>saved,LOG_KEY:'log',core,
  write:(_,rows)=>{saved=rows;return true;},global:{crypto:{randomUUID:()=> 'qa-entry'}},render(){},announce:m=>messages.push(m),text:(_,en)=>en};
 vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('  function createEntry('),source.indexOf('  function compose(')),scope);
 assert.equal(scope.createEntry('work','Keep this reflection','A short passage','chapter',3,true),true);
 assert.equal(saved.length,1);assert.equal(saved[0].note,'Keep this reflection');assert.equal(saved[0].type,kind);
 assert.match(messages[0],/saved.*privat/i);assert.equal(scope.state.composing,false);
});
test('failed persistence keeps the composer and never announces success',()=>{
 const messages=[],scope={state:{composeKind:'note',owner:'a',composing:true},diaryOwner:()=> 'a',entries:()=>[],LOG_KEY:'log',core,
  write:()=>false,global:{crypto:{randomUUID:()=> 'qa-entry'}},render(){throw Error('must keep draft');},announce:m=>messages.push(m),text:(_,en)=>en};
 vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('  function createEntry('),source.indexOf('  function compose(')),scope);
 assert.equal(scope.createEntry('work','Keep draft','','chapter',3,false),false);assert.equal(scope.state.composing,true);assert.deepEqual(messages,[]);
});
function clipboardHarness(){
 let copied,success,failure;const messages=[];
 const clipboard={writeText(value){copied=value;return{then(callback){success=callback;return{catch(callback){failure=callback;}};}};}};
 const scope={core,workInfo:()=>({title:'QA book'}),language:()=> 'en',text:(_,en)=>en,announce:m=>messages.push(m),
  global:{navigator:{clipboard}}};
 vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('  function sendShare('),source.indexOf('  function discussQuote(')),scope);
 scope.sendShare({id:'work',type:'note',note:'Private spoiler',spoiler:true,anchorType:'chapter',anchorValue:3},false);
 return{messages,copied,success:()=>success(),failure:()=>failure(Error('permission denied')),hasFailure:()=>typeof failure==='function'};
}
test('clipboard fallback announces a completed copy and omits spoiler content',()=>{
 const h=clipboardHarness();assert.doesNotMatch(h.copied,/Private spoiler/);assert.match(h.copied,/QA book/);
 assert.doesNotThrow(h.success);assert.deepEqual(h.messages,['Copied for sharing']);
});
test('clipboard denial is handled and never reports that copying succeeded',()=>{
 const h=clipboardHarness();assert.equal(h.hasFailure(),true);h.failure();assert.deepEqual(h.messages,['Could not copy. Try again.']);
});

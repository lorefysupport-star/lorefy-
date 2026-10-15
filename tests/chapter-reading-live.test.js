const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../modules/lorefy-chapter-detail-core.js');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-chapter-detail.js'),'utf8');
test('chapter total reads work metadata rather than the readers changing progress text',()=>{
 for(const metadataText of ['384 فصل','384 chapters']){
  const content={children:[{textContent:'6 فصل مقروء'}],querySelector:selector=>selector==='h1'?{textContent:'Berserk'}:selector==='.lf-work-facts'?{textContent:metadataText}:null,
   closest:()=>({querySelector:()=>null})};
  const scope={core,metadata:{sourceFor:()=>null,catalogFor:()=>null},doc:{querySelector:()=>content},
   global:{location:{search:'?novel=work'}},URLSearchParams,catalogWork:()=>({id:'work',title:'Berserk',ch:384}),readingOwner:()=> 'owner'};
  vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('  function context()'),source.indexOf('  function reviewFor(')),scope);
  assert.equal(scope.context().total,384,metadataText);
 }
});

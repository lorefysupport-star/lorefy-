const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

function rowFixture() {
  const source=fs.readFileSync(path.join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
  const start=source.indexOf('mr=()=>{if(!Fo)'),end=source.indexOf(',vr=',start),events=[],closed=[];
  const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)})};
  const window={LorefyUserExperience:{ReaderAvatar:'Avatar'},LorefyI18n:{connections:()=>({})},dispatchEvent:event=>events.push(event)};
  const context={React,window,Fo:'following',W:'en',_o:0,Ht:1,C:{},X:'X',Vt:[{id:'reader-a',name:'Reader',un:'reader'}],cloudFollowing:[],cloudFollowers:[],Ue:value=>closed.push(value),CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}}};
  const tree=vm.runInNewContext(source.slice(start,end)+';mr()',context);
  function nodes(node){return !node||typeof node!=='object'?[]:[node,...node.children.flatMap(nodes)];}
  const component=nodes(tree).find(n=>typeof n.type==='function');
  return {row:component.type(component.props),events,closed};
}

for(const key of ['Enter',' ']) {
  test(`a follow button ${JSON.stringify(key)} key never opens its parent reader row`,()=>{
    const fixture=rowFixture(),nested={tagName:'BUTTON'};
    let prevented=false;
    fixture.row.props.onKeyDown({key,target:nested,currentTarget:fixture.row,preventDefault:()=>{prevented=true;}});
    assert.equal(fixture.events.length,0);
    assert.equal(fixture.closed.length,0);
    assert.equal(prevented,false);
  });
  test(`a focused reader row still opens with ${JSON.stringify(key)}`,()=>{
    const fixture=rowFixture();let prevented=false;
    fixture.row.props.onKeyDown({key,target:fixture.row,currentTarget:fixture.row,preventDefault:()=>{prevented=true;}});
    assert.equal(prevented,true);
    assert.equal(fixture.events[0].type,'lorefy:open-reader-profile');
    assert.equal(fixture.events[0].detail.id,'reader-a');
    assert.equal(fixture.closed.length,1);
  });
}

test('the keyboard patch is scoped and repeatable',()=>{
  const patch=require('../tools/patch-connection-keys.js');
  const source=fs.readFileSync(path.join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
  assert.equal(patch(source),source);
  assert.throws(()=>patch('unknown renderer'),/Connection renderer not found/);
});

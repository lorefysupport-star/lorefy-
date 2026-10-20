const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
const component=source.slice(source.indexOf('function LorefyWorkStory('),source.indexOf('function LorefyStableInline('));
function render(attribution,language='ar',states=[false,false]){
 let index=0;const updates=[];
 const React={createElement:(tag,props,...children)=>({tag,props,children}),useState:()=>[states[index++],value=>updates.push(value)],useRef:()=>({current:null}),useId:()=>':story:',useLayoutEffect:()=>{}};
 const tree=vm.runInNewContext(component+';LorefyWorkStory({work,language,text:"A short summary"})',{React,URL,work:{type:'كتاب',synopsisAttribution:attribution},language});
 return {tree,updates,tools:tree.children[2].children.filter(Boolean)};
}
for(const lang of ['ar','en'])test('synopsis sources stay out of the work UI in '+lang,()=>{
 for(const attribution of ['https://www.safahat.org/books/123',{url:'https://www.nationalbook.org/books/nimona/'},undefined,null,{},'not a URL','javascript:alert(1)']){
  const {tools,tree}=render(attribution,lang);
  assert.equal(tools.some(el=>el.tag==='a'),false);
  assert.equal(tree.children[1].children[0],'A short summary');
 }
});
test('short synopses do not offer an empty expansion action',()=>{
 assert.equal(render(null).tools.length,0);
});
test('long synopsis action controls the matching paragraph and toggles state',()=>{
 for(const expanded of [false,true]){
  const {tree,tools,updates}=render(null,'en',[expanded,true]);const button=tools[0];
  assert.equal(button.tag,'button');assert.equal(button.props['aria-expanded'],expanded);
  assert.equal(button.props['aria-controls'],tree.children[1].props.id);
  assert.equal(button.children[0],expanded?'Show less':'Read more');
  button.props.onClick();assert.equal(updates[0](expanded),!expanded);
 }
});

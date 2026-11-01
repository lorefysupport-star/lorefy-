const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const identity=fs.readFileSync('modules/lorefy-review-editor.js','utf8'),explore=fs.readFileSync('modules/lorefy-explore-studio.js','utf8');
const h=(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(c=>c!==false&&c!=null)});
const walk=n=>typeof n==='object'?[n,...n.children.flatMap(walk)]:[];
function render(creator,language='en',linked=true){
 const calls=[],root={React:{createElement:h,useState:v=>[v,()=>{}],useEffect(){},useRef:()=>({current:null})},
  LorefyProductCore:{authorWorks:()=>linked?[{}]:[]},LorefyProductTools:{openAuthor:value=>calls.push(value)},
  NenIcons:{ChevronRight:'Right',ChevronLeft:'Left'}};
 vm.runInNewContext(identity,{window:root});
 const work={id:'fixture',title:'توقف / Literal Work',type:'Manga',auth:creator};
 const props={work,creator,language,subtitle:'عنوان آخر / Alternative Subtitle',rating:4};
 const before=JSON.stringify(props),tree=root.LorefyWorkIdentity(props);
 return{nodes:walk(tree),calls,before,after:JSON.stringify(props),work};
}
for(const creator of ['اسم المؤلف الطويل جدًا / A Long Author Name','AnUnbrokenAuthorNameThatMustWrapWithinTheColumn','Short']){
 test('linked author preserves full literal name, automatic direction and callback: '+creator,()=>{
  const r=render(creator),button=r.nodes.find(n=>n.props.className==='lf-work-creator lf-work-author-button');
  const text=r.nodes.find(n=>n.props.className==='lf-work-author-name');
  assert.ok(text);assert.equal(text.props.dir,'auto');assert.equal(text.props['data-no-translate'],'1');
  assert.equal(text.children[0],creator);assert.equal(button.props.title,creator);
  assert.equal(button.props['aria-label'],'Works by '+creator);button.props.onClick();assert.deepEqual(r.calls,[creator]);
  assert.equal(r.before,r.after);
 });
}
test('Arabic author action retains its language and directional icon independently of source text',()=>{
 const r=render('An English Author','ar'),button=r.nodes.find(n=>n.props.className==='lf-work-creator lf-work-author-button');
 assert.equal(button.props['aria-label'],'أعمال An English Author');assert.equal(button.children[1].type,'Left');
 assert.equal(button.children[1].props['aria-hidden'],true);
});
test('unlinked creator and secondary title stay full and are protected from UI translation',()=>{
 const r=render('توقف','en',false),creator=r.nodes.find(n=>n.props.className==='lf-work-creator'),subtitle=r.nodes.find(n=>n.props.className==='lf-work-subtitle');
 for(const n of [creator,subtitle]){assert.equal(n.props.dir,'auto');assert.equal(n.props['data-no-translate'],'1');assert.equal(n.props.title,n.children[0]);}
 const title=r.nodes.find(n=>n.type==='h1');assert.equal(title.props['data-no-translate'],'1');assert.equal(title.children[0],r.work.title);
 assert.ok(!r.nodes.some(n=>n.props.className==='lf-work-author-name'));
});
function item(work){
 const calls=[],scope={h,root:{},cover:()=>h('img',{}),openWork:value=>calls.push(value),t:(ar,en)=>en,Icon:()=>null};
 vm.runInNewContext(explore.slice(explore.indexOf('    function item(work, feedback'),explore.indexOf('    var collectionRequest=',explore.indexOf('    function item(work, feedback'))),scope);
 const before=JSON.stringify(work),tree=scope.item(work,false);
 return{nodes:walk(tree),calls,before,after:JSON.stringify(work)};
}
test('search card exposes title and author together without truncating or changing the work callback',()=>{
 const work={id:'qa',title:'اسم عمل / Title',auth:'A Very Long Author Name'},r=item(work),button=r.nodes.find(n=>n.type==='button'),author=r.nodes.find(n=>n.props.className==='lf-explore-work-author');
 assert.equal(button.props['aria-label'],work.title+' · '+work.auth);
 assert.equal(author.props.title,work.auth);assert.equal(author.props.dir,'auto');assert.equal(author.props['data-no-translate'],'1');
 assert.equal(author.children[0],work.auth);button.props.onClick();assert.equal(r.calls[0],work);assert.equal(r.before,r.after);
});
test('metadata-only result describes its source, not an unsupported author attribution',()=>{
 const work={id:'source',title:'Imported title',metadataOnly:true,source:'Catalog source',auth:'Do not attribute'},r=item(work);
 const author=r.nodes.find(n=>n.props.className==='lf-explore-work-author'),button=r.nodes.find(n=>n.type==='button');
 assert.equal(author.props.title,'Catalog source');assert.equal(author.children[0],'Catalog source');
 assert.equal(button.props['aria-label'],'Imported title · Catalog source');
});
test('missing search byline does not add an undefined author or change source strings',()=>{
 const r=item({id:'empty',title:'Literal title'}),button=r.nodes.find(n=>n.type==='button');
 assert.equal(button.props['aria-label'],'Literal title');assert.equal(r.before,r.after);
});
test('work author is a bounded44px action with a shrinking text track and fixed icon',()=>{
 const css=fs.readFileSync('styles/lorefy-work-cinema.css','utf8');
 assert.match(css,/\.lf-detail-page \.lf-work-author-button\{[^}]*min-height:44px!important/);
 assert.match(css,/\.lf-detail-page \.lf-work-author-button\{[^}]*max-width:100%!important/);
 assert.match(css,/\.lf-detail-page \.lf-work-author-name\{[^}]*min-width:0!important[^}]*overflow-wrap:anywhere!important/);
 assert.match(css,/\.lf-detail-page \.lf-work-author-button>svg\{[^}]*flex:0 0 14px!important/);
});
test('secondary titles and plain bylines wrap without clipping or theme replacement',()=>{
 const css=fs.readFileSync('styles/lorefy-work-cinema.css','utf8');
 assert.match(css,/\.lf-detail-page :is\(\.lf-work-subtitle,\.lf-work-creator\)\{[^}]*overflow-wrap:anywhere!important[^}]*unicode-bidi:isolate/);
});
test('search byline is readable and bounded to two font-relative lines; rails keep their chosen composition',()=>{
 const css=fs.readFileSync('styles/lorefy-explore-cinema.css','utf8');
 assert.match(css,/\.lf-explore-cinema \.lf-explore-work-author\{[^}]*font-size:12px!important/);
 assert.match(css,/\.lf-explore-cinema \.lf-explore-work-author\{[^}]*-webkit-line-clamp:2!important/);
 assert.match(css,/\.lf-explore-cinema \.lf-explore-work-author\{[^}]*min-block-size:2lh!important/);
 assert.match(css,/\.lf-explore-cinema \.lf-explore-rail \.lf-explore-work-author\{display:none!important\}/);
});
test('byline fixes have matching runtime/offline asset versions',()=>{
 const entry=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 for(const file of ['modules/lorefy-review-editor.js','modules/lorefy-explore-studio.js','styles/lorefy-work-cinema.css','styles/lorefy-explore-cinema.css']){
  const version=['modules/lorefy-explore-studio.js','styles/lorefy-explore-cinema.css'].includes(file)?'20261029-search-editions-v1':file.startsWith('modules/')?'20261101-recommendation-logic-v1':'20261028-byline-type-v1';
  assert.ok(entry.includes(file+'?v='+version));
  assert.ok(sw.includes(file+'?v='+version));
 }
 assert.match(sw,/lorefy-v680-community-modals/);
});
test('linked author tooltip cannot be translated as an interface command',()=>{
 const r=render('توقف','en'),button=r.nodes.find(n=>n.props.className==='lf-work-creator lf-work-author-button');
 assert.equal(button.props['data-no-translate'],'1');assert.equal(button.props.title,'توقف');
 assert.equal(button.props['aria-label'],'Works by توقف');
});
test('search button source title and combined author label stay literal',()=>{
 const r=item({id:'literal',title:'توقف',auth:'المراجعة'}),button=r.nodes.find(n=>n.type==='button');
 assert.equal(button.props['data-no-translate'],'1');assert.equal(button.props.title,'توقف');
 assert.equal(button.props['aria-label'],'توقف · المراجعة');
});

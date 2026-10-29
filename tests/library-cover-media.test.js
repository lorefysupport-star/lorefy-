const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const file='modules/lorefy-library-media.js';
const h=(type,props,...children)=>({type,props:{...(props||{}),children:children.flat().filter(v=>v!=null&&v!==false)},key:props?.key||null});
const kids=n=>n?.props?.children||[];
const walk=n=>n&&typeof n==='object'?[n,...kids(n).flatMap(walk)]:[];
function loadAPI(){assert.ok(fs.existsSync(file),'library cover adapter exists');const root={React:{createElement:h,cloneElement:(node,props,...children)=>h(node.type,{...node.props,...props},...(children.length?children:kids(node))),Children:{toArray:value=>(Array.isArray(value)?value:value?[value]:[]).map(node=>node&&typeof node==='object'?h(node.type,node.props,...kids(node)):node),forEach:(value,fn)=>(Array.isArray(value)?value:value?[value]:[]).forEach(fn)}},LorefyCoverMedia:'CoverMedia'};vm.runInNewContext(fs.readFileSync(file,'utf8'),{window:root});return{api:root.LorefyLibraryMedia,root};}
function fixture(){const calls=[],image=h('img',{src:'original.jpg','data-fallback':'data:image/svg+xml,fallback'}),done=h('span',{className:'lf-library-done'}),progress=h('div',{className:'lf-library-progress'}),cover=h('div',{className:'lf-library-cover'},image,done,progress),copy=h('div',{className:'lf-library-copy'},'Literal title'),node=h('button',{key:'work-id',className:'lf-library-card','data-work-title':'Literal title','data-work-id':'work-id','aria-label':'Open Literal title',onClick:()=>calls.push('open')},cover,copy);return{calls,image,done,progress,cover,copy,node};}
test('adapter keeps source, metadata and cover container while separating native open/retry controls',()=>{
 const {api}=loadAPI(),f=fixture(),media=api.card(f.node,{lang:'en'});assert.equal(media.type,'CoverMedia');assert.equal(media.props.src,'original.jpg');assert.equal(media.props.fallback,'data:image/svg+xml,fallback');
 const surface=h('span',{'data-cover-state':'error'}),retry=h('button',{className:'lf-cover-retry'}),tree=media.props.render(surface,retry),nodes=walk(tree);
 assert.equal(tree.type,'div');assert.equal(tree.props.onClick,undefined);assert.equal(tree.props['aria-label'],undefined);
 assert.ok(tree.props.className.split(' ').includes('lf-managed-cover-card'));assert.ok(!tree.props.className.split(' ').includes('lf-cover-card'),'do not inherit the legacy fixed 110px cover-card rule');
 assert.ok(nodes.includes(f.done));assert.ok(nodes.includes(f.progress));assert.ok(nodes.includes(f.copy));assert.ok(nodes.includes(surface));
 assert.ok(nodes.find(n=>n.props['data-lorefy-book-cover']!==undefined));
 const open=nodes.find(n=>n.props.className==='lf-cover-open');assert.equal(open.props['aria-label'],'Open Literal title');open.props.onClick();assert.deepEqual(f.calls,['open']);
 assert.equal(tree.props['data-work-id'],'work-id');assert.ok(kids(tree).includes(retry));assert.ok(!walk(open).includes(retry));
});
test('profile favorite preserves its edit action, data and original custom cover',()=>{
 const {api}=loadAPI(),calls=[],image=h('img',{src:'data:image/png;base64,user-cover'}),cover=h('div',{onClick:()=>calls.push('open'),style:{aspectRatio:'2/3'}},image),edit=h('button',{onClick:()=>calls.push('edit'),title:'Edit cover'}),slot=h('div',{key:'favorite','data-work-title':'Favorite',style:{position:'relative'}},cover,edit),page=h('div',{'data-profile-layout':'reader'},h('section',{className:'lf-profile-favorites'},slot));
 const next=api.owner(page,{lang:'ar'}),media=kids(kids(next)[0])[0];assert.equal(media.type,'CoverMedia');assert.equal(media.props.src,'data:image/png;base64,user-cover');
 const tree=media.props.render(h('span',{}),h('button',{className:'lf-cover-retry'})),nodes=walk(tree),editor=nodes.find(n=>n.props.title==='Edit cover');
 assert.equal(editor.props.onClick,edit.props.onClick);assert.ok(editor.props.className.includes('lf-profile-cover-edit'));
 editor.props.onClick();nodes.find(n=>n.props.className==='lf-cover-open').props.onClick();assert.deepEqual(calls,['edit','open']);
 assert.equal(tree.props['data-work-title'],'Favorite');assert.equal(tree.props.style,slot.props.style);
});
test('empty favorite slots and character grids are not upgraded to covers',()=>{
 const {api}=loadAPI(),empty=h('div',{key:'empty'}),character=h('div',{'data-work-title':'Not a work'},h('img',{src:'portrait.jpg'}));
 const page=h('div',{},h('section',{className:'lf-profile-favorites'},empty),h('section',{className:'lf-profile-favorites lf-profile-top-characters-grid'},character));
 const next=api.owner(page,{lang:'en'});assert.equal(kids(kids(next)[0])[0],empty);assert.equal(kids(next)[1],kids(page)[1]);
});
test('a missing public cover remains a real book with an explicit missing source',()=>{
 const {api}=loadAPI(),placeholder=h('span',{className:'lf-reader-image-placeholder'},'A'),node=h('button',{className:'lf-reader-cover is-work',onClick(){},'aria-label':'Open A'},placeholder);
 const media=api.card(node,{src:'',workId:'visitor-work',title:'A',lang:'en',fit:'contain'});assert.equal(media.props.src,'');assert.equal(media.props.fit,'contain');assert.equal(media.props.workId,'visitor-work');
 const tree=media.props.render(h('span',{'data-cover-state':'missing'}),null);assert.equal(tree.props['data-work-title'],'A');assert.ok(walk(tree).some(n=>n.props['data-lorefy-book-cover']!==undefined));
});
test('plain reading-row art gets a fixed-format container without losing its progress/text',()=>{
 const {api}=loadAPI(),copy=h('span',{className:'lf-reader-layout-reading-copy'},'Title'),node=h('button',{className:'lf-reader-layout-reading-row',onClick(){},'data-reading-work':'id'},h('img',{src:'row.jpg'}),copy);
 const media=api.card(node,{lang:'en',artClass:'lf-reader-layout-reading-art'}),tree=media.props.render(h('span',{}),null);
 assert.ok(walk(tree).some(n=>n.props.className==='lf-reader-layout-reading-art'));assert.ok(walk(tree).includes(copy));
});

test('a missing image inside a public library wrapper renders the managed surface, not a letter placeholder',()=>{
 const {api}=loadAPI(),placeholder=h('span',{className:'lf-reader-image-placeholder'},'A'),cover=h('span',{className:'lf-reader-library-cover'},placeholder),node=h('button',{onClick(){}},cover);
 const media=api.card(node,{src:'',workId:'missing'}),surface=h('span',{'data-cover-state':'missing'}),tree=media.props.render(surface,null);
 assert.ok(walk(tree).includes(surface));assert.ok(!walk(tree).includes(placeholder));
});
test('the adapter retains legacy rendering if the shared media module is unavailable',()=>{
 const {api,root}=loadAPI(),f=fixture();delete root.LorefyCoverMedia;assert.equal(api.card(f.node),f.node);
});
test('source adoption covers Library, all owner layouts and public work/library cards but not avatars',()=>{
 const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8'),reader=fs.readFileSync('modules/lorefy-reader-layout.js','utf8'),pub=fs.readFileSync('modules/lorefy-public-profile.js','utf8');
 assert.match(app,/libraryVisible\.map[\s\S]{0,130}LorefyLibraryMedia\.card/);
 assert.match(reader,/LorefyLibraryMedia\.owner/);assert.match(reader,/LorefyLibraryMedia\.card/);
 assert.match(pub,/LorefyLibraryMedia\.card/);assert.match(pub,/src:ownerCover\(work\)/);
});
test('managed geometry has an explicit cover anchor and keeps open/edit/retry layers separate',()=>{
 const css=fs.readFileSync('styles/lorefy-cover-media.css','utf8');
 assert.match(css,/\[data-lorefy-book-cover\]>\.lf-cover-surface/);assert.match(css,/\.lf-cover-open\{display:block!important/);
 assert.match(css,/\.lf-profile-cover-edit\{[^}]*z-index:4!important/);
 assert.match(css,/\.lf-cover-surface>\.lf-cover-image\{[^}]*opacity:0!important/);assert.match(css,/data-cover-state=ready\]>\.lf-cover-image\{opacity:1!important/);
});
test('showcase recognizes missing managed media and styles the real book container, not an inner image',()=>{
 const source=fs.readFileSync('modules/lorefy-library-view.js','utf8');assert.match(source,/data-lorefy-book-cover/);assert.match(source,/lf-cover-surface/);
});

test('legacy favorite capture allows the managed open, edit and retry controls to handle their own events',()=>{
 const source=fs.readFileSync('modules/lorefy-growth-features.js','utf8'),start=source.indexOf('function syncProfileFavouriteWorksControls()'),end=source.indexOf('function syncProfileTopCharacters()',start),section=source.slice(start,end);
 assert.match(section,/event\.target\.closest\("\.lf-cover-open,\.lf-cover-retry,\.lf-profile-cover-edit"\)\) return/);
 assert.match(section,/slot\.removeAttribute\("role"\)/);assert.match(section,/\[data-lorefy-book-cover\],img/);
});

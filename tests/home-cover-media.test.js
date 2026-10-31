const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const h=(type,props,...children)=>({type,key:props?.key,props:{...props,children:children.flat().filter(x=>x!=null&&x!==false)}}),kids=n=>n?.props?.children||[],walk=n=>n&&typeof n==='object'?[n,...kids(n).flatMap(walk)]:[];
function load(){const root={React:{createElement:h,cloneElement:(n,p,...c)=>h(n.type,{...n.props,...p},...(c.length?c:kids(n))),Children:{forEach:(v,fn)=>(Array.isArray(v)?v:v?[v]:[]).forEach(fn)},useState:v=>[v,()=>{}],useRef:v=>({current:v}),useLayoutEffect(){},Fragment:'Fragment'},NenIcons:{BookOpen:'BookOpen'},LorefyCoverMedia:'CoverMedia'};for(const f of ['lorefy-library-media','lorefy-home-cinema'])vm.runInNewContext(fs.readFileSync('modules/'+f+'.js','utf8'),{window:root});return root;}
function fixture(root){const calls=[],works=[{id:'a',title:'Original title',ch:100,banner:'https://example.org/banner.jpg'},{id:'b',title:'Other',ch:50}],props={works,language:'en',cover:w=>w.id+'.jpg',fallback:()=> 'fallback.svg',progressFor:()=>({chapter:12}),percent:()=>12,summary:()=> '12 / 100',onOpen:w=>calls.push(w.id),onLibrary(){},onError(){}};return{calls,props,node:root.LorefyHomeCinema.Resume(props)};}
test('Home opts into managed backdrop, poster and switching thumbnails, preserving exact source identities',()=>{
 const root=load(),f=fixture(root),media=walk(f.node).filter(n=>n.type==='CoverMedia');assert.equal(media.length,4);
 assert.ok(media.some(n=>n.props.src==='https://example.org/banner.jpg'&&n.props.fetchPriority==='high'));assert.ok(media.filter(n=>n.props.src==='a.jpg').length>=2);
 assert.ok(media.every(n=>n.props.language==='en'&&n.props.fallback==='fallback.svg'));
});
test('Home poster Open and Retry are separate native controls and opening preserves the selected work',()=>{
 const root=load(),f=fixture(root),poster=walk(f.node).find(n=>n.type==='CoverMedia'&&n.props.loading==='eager'&&n.props.src==='a.jpg');assert.ok(poster);
 const surface=h('span',{}),retry=h('button',{className:'lf-cover-retry'}),rendered=poster.props.render(surface,retry),open=walk(rendered).find(n=>n.props.className==='lf-cover-open');assert.ok(open);open.props.onClick();assert.deepEqual(f.calls,['a']);assert.ok(kids(rendered).includes(retry));assert.ok(!walk(open).includes(retry));
});
test('thumbnail errors retain selection and pressed state without nesting a retry button',()=>{
 const root=load(),f=fixture(root),thumb=walk(f.node).find(n=>n.type==='CoverMedia'&&n.props.loading==='lazy'&&n.props.src==='a.jpg');assert.ok(thumb);
 const retry=h('button',{className:'lf-cover-retry'}),rendered=thumb.props.render(h('span',{}),retry);assert.equal(rendered.type,'button');assert.equal(rendered.props['aria-pressed'],true);assert.equal(rendered.props['aria-label'],'Switch to Original title');assert.equal(rendered.props.title,'Original title');assert.ok(!walk(rendered).includes(retry));
});
test('decorative backdrop is hidden from assistive technology but its recovery control is separate and named',()=>{
 const root=load(),f=fixture(root),backdrop=walk(f.node).find(n=>n.type==='CoverMedia'&&n.props.fetchPriority==='high');assert.ok(backdrop);
 const rendered=backdrop.props.render(h('span',{}),h('button',{className:'lf-cover-retry',onClick(){}}));const art=walk(rendered).find(n=>String(n.props.className||'').includes('lf-cinema-backdrop')),retry=walk(rendered).find(n=>String(n.props.className||'').includes('lf-cinema-background-retry'));
 assert.equal(art.props['aria-hidden'],true);assert.equal(retry.props['aria-label'],'Retry background');assert.ok(!walk(art).includes(retry));
});
test('media dimensions and decorative presentation have scoped material rules',()=>{
 const css=fs.readFileSync('styles/lorefy-cover-media.css','utf8');assert.match(css,/\.lf-cinema-backdrop[^{}]*\.lf-cover-message\{display:none/);assert.match(css,/\.lf-cinema-reading-switch[^{}]*\.lf-cover-surface\{[^}]*height:40px!important/);
});

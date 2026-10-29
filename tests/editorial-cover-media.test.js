const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const h=(type,props,...children)=>({type,key:props?.key,props:{...props,children:children.flat().filter(x=>x!=null&&x!==false)}}),kids=n=>n?.props?.children||[],walk=n=>n&&typeof n==='object'?[n,...kids(n).flatMap(walk)]:[];
function load(){const root={React:{createElement:h,cloneElement:(n,p,...c)=>h(n.type,{...n.props,...p},...(c.length?c:kids(n))),Children:{forEach:(v,fn)=>(Array.isArray(v)?v:v?[v]:[]).forEach(fn)},useState:v=>[v,()=>{}],useEffect(){},Fragment:'Fragment'},LorefyCoverMedia:'CoverMedia',NenIcons:{}};for(const f of ['lorefy-library-media','lorefy-friend-activity'])vm.runInNewContext(fs.readFileSync('modules/'+f+'.js','utf8'),{window:root});return root;}
function fixture(){const root=load(),calls=[],work={id:'work',title:'Literal work'};const node=root.LorefyFriendActivity.Rails({language:'en',reviews:[{id:'review',userId:'friend',user:'Reader',av:'avatar.jpg',mid:'work',r:4.75,ts:100}],following:['friend'],getWork:()=>work,cover:()=> 'custom-work.jpg',fallback:()=> 'fallback.svg',onCoverError(){},onWork:w=>calls.push(w.id),onReader:r=>calls.push(r.id),Stars:'Stars'});return{root,node,calls};}
test('friend review rails use managed work covers without adopting the reader avatar',()=>{
 const f=fixture(),nodes=walk(f.node),media=nodes.filter(n=>n.type==='CoverMedia');assert.equal(media.length,2);assert.ok(media.every(n=>n.props.src==='custom-work.jpg'&&n.props.fallback==='fallback.svg'));assert.equal(nodes.filter(n=>n.type==='img'&&n.props.src==='avatar.jpg').length,1);assert.ok(nodes.some(n=>kids(n).includes(4.75)));
});
test('friend Open work, Retry and reader-profile actions remain independent',()=>{
 const f=fixture(),media=walk(f.node).find(n=>n.type==='CoverMedia');assert.ok(media);const retry=h('button',{className:'lf-cover-retry'}),tree=media.props.render(h('span',{}),retry),open=walk(tree).find(n=>n.props.className==='lf-cover-open');assert.ok(open);assert.ok(!walk(open).includes(retry));open.props.onClick();walk(f.node).find(n=>n.props.className==='lf-friend-reader').props.onClick();assert.deepEqual(f.calls,['work','friend']);
});
test('Explore opts feature poster and format cards into the shared adapter',()=>{
 const s=fs.readFileSync('modules/lorefy-explore-studio.js','utf8');assert.match(s,/LorefyLibraryMedia\.card\(poster/);assert.match(s,/LorefyLibraryMedia\.card\(categoryCard/);
});
test('Explore backdrop has decorative semantics and a separately named recovery action',()=>{
 const s=fs.readFileSync('modules/lorefy-explore-studio.js','utf8');assert.match(s,/function heroArtwork\(work\)/);assert.match(s,/lf-explore-art-retry/);assert.match(s,/Retry artwork/);assert.match(s,/fetchPriority:'high'/);
});
test('review work attachments opt in with an explicit work anchor and compact art container',()=>{
 const s=fs.readFileSync('uploads/files/lorefy-app.js','utf8');assert.match(s,/r&&o&&window\.LorefyLibraryMedia\.card/);assert.match(s,/className:"lf-community-work-card"/);assert.match(s,/artClass:"lf-review-work-art"/);
});
test('scoped editorial geometry preserves compact art, sharp immersive crops and independent retry',()=>{
 const css=fs.readFileSync('styles/lorefy-cover-media.css','utf8');assert.match(css,/\.lf-review-work-art\{[^}]*width:34px[^}]*height:48px/);assert.match(css,/\.lf-explore-immersive-art[^{}]*\.lf-cover-image\{[^}]*transform:scale\(1\.2\)/);assert.match(css,/\.lf-explore-art-retry\{/);
});

test('clipped cover containers retain an outer keyboard focus indicator',()=>{
 const css=fs.readFileSync('styles/lorefy-cover-media.css','utf8');assert.match(css,/\.lf-managed-cover-card:has\(>\.lf-cover-open:focus-visible,>\.lf-cover-retry:focus-visible\)\{[^}]*outline:2px/);
});

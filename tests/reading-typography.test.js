const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const home=require('../modules/lorefy-home-cinema'),reader=require('../modules/lorefy-reader-layout');
const vm=require('node:vm');
const titles=['رحلة الحكايات الجزء الثاني Part 12: A Very Long Journey Beyond the Known World','The Extraordinarily Long Journey Through Every Kingdom and Every Chapter of the Unknown World','AnUnbrokenTitleThatCannotBeSplitAtASpaceButMustStillFitWithoutExpandingItsParent'];
function walk(n){return n&&typeof n==='object'?[n,...(n.children||[]).flatMap(walk)]:[];}
function react(){global.React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(n=>n!=null&&n!==false)}),useState:v=>[v,()=>{}],useRef:v=>({current:v}),useLayoutEffect(){}};global.NenIcons={};}
for(const title of titles)test('Home preserves full unmodified source title: '+title.slice(0,24),()=>{
 react();let opened;const work={id:'fixture',title,pages:100},before=JSON.stringify(work);
 const nodes=walk(home.Resume({works:[work],language:'ar',progressFor:()=>({page:1}),percent:()=>1,summary:()=> '1 / 100 صفحة',cover:()=> 'cover.jpg',fallback:()=>'',onOpen:w=>opened=w}));
 const heading=nodes.find(n=>n.type==='h3');assert.equal(heading.props.title,title);assert.equal(heading.props.dir,'auto');assert.equal(heading.props['data-no-translate'],'1');assert.ok(heading.children.includes(title));
 nodes.find(n=>n.props.className==='lf-cinema-resume-action').props.onClick();assert.equal(opened,work);assert.equal(JSON.stringify(work),before);
});
for(const title of titles)test('Reader title stays complete and isolated: '+title.slice(0,24),()=>{
 react();let opened;const work={id:'fixture',title},nodes=walk(reader.ReadingLately({lang:'en',reading:[{work,chapter:12,total:42,cover:'cover.jpg'}],onWork:w=>opened=w}));
 const name=nodes.find(n=>n.type==='strong');assert.equal(name.props.title,title);assert.equal(name.props.dir,'auto');assert.equal(name.props['data-no-translate'],'1');assert.ok(name.children.includes(title));
 nodes.find(n=>n.props['data-reading-work']).props.onClick();assert.equal(opened,work);
});
test('Library source isolates its work title without truncating the actual string',()=>{
 const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8');
 assert.ok(app.includes('React.createElement("strong",{dir:"auto",title:o.title,"data-no-translate":"1"},o.title)'));
 assert.ok(app.includes('"data-no-translate":"1",dir:W==="en"?"ltr":"rtl"'));
});
test('Home title has a stable two-line box and adapts layout rather than font size',()=>{
 const css=fs.readFileSync('styles/lorefy-home-immersive.css','utf8');
 assert.match(css,/min-block-size:2\.5em/);assert.match(css,/max-block-size:2\.5em/);assert.match(css,/text-align:start !important/);assert.match(css,/unicode-bidi:isolate/);assert.match(css,/@container/);
 assert.doesNotMatch(css,/@media\(max-width:359px\)\{\s*\.lf-app \.lf-home-cinema \.lf-cinema-resume h3/);
});
test('Library titles and metadata use isolated start alignment and flexible title tracks',()=>{
 const css=fs.readFileSync('styles/lorefy-library-refined.css','utf8');
 assert.match(css,/unicode-bidi:isolate/);assert.match(css,/text-align:start !important/);assert.match(css,/minmax\(40px,auto\)/);assert.match(css,/max-block-size:3em/);assert.match(css,/\[dir='rtl'\]/);
});
test('Profile titles have a two-line reservation without changing frame or shelf sizes',()=>{
 const css=fs.readFileSync('styles/lorefy-profile-refined.css','utf8');
 assert.match(css,/\.lf-reader-layout-reading-copy strong\s*\{[^}]*-webkit-line-clamp:2/);
 assert.match(css,/\.lf-reader-layout-cover-title\s*\{[^}]*-webkit-line-clamp:2/);
 assert.match(css,/unicode-bidi:isolate/);assert.match(css,/max-block-size:3em/);
});
test('Showcase preserves the full title as a tooltip without rewriting its caption',()=>{
 const source=fs.readFileSync('modules/lorefy-library-view.js','utf8');
 assert.ok(source.includes('if(caption.children[1].title!==title)caption.children[1].title=title;'));
});
test('Showcase captions can grow for enlarged text instead of clipping at 72 pixels',()=>{
 const css=fs.readFileSync('styles/lorefy-book-showcase.css','utf8');
 assert.match(css,/\.lf-showcase-caption\s*\{[^}]*min-height: 72px; height: auto/);
 assert.match(css,/\.lf-showcase-title\s*\{[^}]*min-block-size: 2\.8em/);
});
test('typography assets share current local cache keys',()=>{
 const assets=['uploads/files/lorefy-app.js','modules/lorefy-home-cinema.js','modules/lorefy-reader-layout.js','modules/lorefy-library-view.js','styles/lorefy-home-immersive.css','styles/lorefy-library-refined.css','styles/lorefy-profile-refined.css','styles/lorefy-book-showcase.css'];
 for(const file of ['index.html','sw.js'])for(const asset of assets)assert.ok(fs.readFileSync(file,'utf8').includes(asset+'?v='+(asset==='styles/lorefy-profile-refined.css'?'20261029-shelf-acceptance-v1':asset==='uploads/files/lorefy-app.js'?'20261029-cover-editions-v1':asset==='modules/lorefy-home-cinema.js'?'20261101-home-reading-v1':['uploads/files/lorefy-app.js','modules/lorefy-reader-layout.js','modules/lorefy-library-view.js'].includes(asset)?'20261029-library-media-v1':asset==='styles/lorefy-home-immersive.css'?'20261101-home-reading-v1':'20261028-reading-type-v1')),asset);
 assert.match(fs.readFileSync('sw.js','utf8'),/lorefy-v656-diary-retry/);
});
test('Showcase reservation follows the effective line height, including legacy important rules',()=>{
 const css=fs.readFileSync('styles/lorefy-book-showcase.css','utf8');
 assert.match(css,/\.lf-showcase-title\s*\{[^}]*min-block-size: 2lh; max-block-size: 2lh/);
});
function observeTitles(){
 let callback,options;const frames=[],doc={readyState:'complete',documentElement:{lang:'ar'},body:{},querySelectorAll:()=>[],querySelector:()=>null,getElementById:()=>null};
 const window={document:doc,localStorage:{getItem:()=>null},addEventListener(){},requestAnimationFrame:fn=>frames.push(fn),MutationObserver:function(fn){callback=fn;this.observe=(root,value)=>{options=value;};}};
 vm.runInNewContext(fs.readFileSync('modules/lorefy-library-view.js','utf8'),{window});return{callback,options,frames};
}
test('showcase observer watches exact title attributes and source text changes',()=>{
 const h=observeTitles();assert.equal(h.options.characterData,true);assert.ok(h.options.attributeFilter.includes('data-work-title'));
 h.callback([{type:'attributes',attributeName:'data-work-title'}]);assert.equal(h.frames.length,1);
});
test('source title mutations share one frame and caption edits do not schedule a loop',()=>{
 const h=observeTitles(),record={type:'characterData',target:{parentElement:{closest:()=>({})}}};
 h.callback([record]);h.callback([record]);assert.equal(h.frames.length,1);h.frames.shift()();
 h.callback([{type:'characterData',target:{parentElement:{closest:()=>null}}}]);assert.equal(h.frames.length,0);
});
test('unrelated attributes and user prose do not schedule title work',()=>{
 const h=observeTitles();h.callback([{type:'attributes',attributeName:'aria-label'},{type:'characterData',target:{parentElement:{closest:()=>null}}}]);assert.equal(h.frames.length,0);
 h.callback([{type:'childList'}]);assert.equal(h.frames.length,1);
});
test('visitor library titles retain full source text and work actions',()=>{
 const window={document:{documentElement:{lang:'en'}},React:{createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(n=>n!=null&&n!==false)}),useState:v=>[v,()=>{}],useEffect(){}},NenIcons:{},LorefyI18n:require('../modules/lorefy-i18n')};
 vm.runInNewContext(fs.readFileSync('modules/lorefy-public-profile.js','utf8'),{window,URL});
 let opened;const work={id:'fixture',title:titles[0],type:'Book'},nodes=walk(window.LorefyPublicProfile({profile:{id:'fixture-reader',library_entries:{fixture:'أقرأ حالياً'}},reviews:[],workById:()=>work,onWork:w=>opened=w}));
 const card=nodes.find(n=>String(n.props.className).startsWith('lf-reader-library-card')),name=walk(card).find(n=>n.type==='strong');
 assert.equal(name.props.title,work.title);assert.equal(name.props.dir,'auto');assert.equal(name.props['data-no-translate'],'1');card.props.onClick();assert.equal(opened,work);
});
test('visitor cards share the readable two-line title rule and status text',()=>{
 const css=fs.readFileSync('styles/lorefy-profile-refined.css','utf8');
 assert.match(css,/\.lf-reader-library-copy strong\s*\{[^}]*-webkit-line-clamp:2/);
 assert.match(css,/\.lf-reader-library-copy small\s*\{[^}]*font-size:12px/);
});

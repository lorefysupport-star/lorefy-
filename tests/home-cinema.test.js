const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const cinema=require('../modules/lorefy-home-cinema.js');
test('cinematic art stays bound to its actual work, not every reading entry',()=>{
 assert.match(cinema.artwork({id:'mal-manga-2-berserk'},'cover.jpg'),/berserk-home/);
 assert.equal(cinema.artwork({id:'pride',title:'Pride and Prejudice'},'pride.jpg'),'pride.jpg');
 assert.equal(cinema.artwork({id:'pride',banner:'https://example.org/actual-banner.jpg'},'pride.jpg'),'https://example.org/actual-banner.jpg');
 assert.equal(cinema.artwork({id:'mal-manga-2-berserk'},'cover.jpg',true),'cover.jpg');
});
test('unknown reading totals do not become fabricated progress percentages',()=>{
 assert.equal(cinema.meter({ch:0,vol:0,pages:0},50),null);
 assert.equal(cinema.meter({ch:420},52),52);
 assert.equal(cinema.meter({pages:180},200),100);
 assert.equal(cinema.meter({pages:180},NaN),null);
});
function render(props){const events=[],R={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat().filter(Boolean)}),useState:value=>[value,next=>events.push(next)],useRef:value=>({current:value}),useLayoutEffect(){}};
 global.React=R;global.NenIcons={BookOpen:'BookOpen',Compass:'Compass'};return cinema.Resume(props);}
function all(node){return [node,...(node.children||[]).filter(x=>x&&typeof x==='object').flatMap(all)];}
test('continue actions and progress preserve the supplied reading data',()=>{
 let opened;const work={id:'pride',title:'Pride and Prejudice',pages:432};
 const node=render({works:[work],language:'en',cover:()=> 'pride.jpg',fallback:()=>'',progressFor:()=>({page:90}),summary:(w,p)=>p.page+' pages',percent:()=>21,onOpen:w=>opened=w,onLibrary(){}});
 const nodes=all(node),resume=nodes.find(x=>x.props.className==='lf-cinema-resume-action');resume.props.onClick();assert.equal(opened,work);
 assert.ok(nodes.some(x=>x.children.includes('90 pages')));assert.equal(work.pages,432);
 assert.equal(nodes.find(x=>x.props.className==='lf-cinema-progress').props['aria-valuenow'],21);
});
test('empty reading state remains usable and never inserts a sample work',()=>{
 let explored=false;const node=render({works:[],language:'en',onExplore:()=>explored=true});
 all(node).find(x=>x.type==='button').props.onClick();assert.ok(explored);assert.equal(all(node).filter(x=>x.type==='img').length,0);
});
test('Home styling and assets are scoped and wired before the existing application',()=>{
 const css=fs.readFileSync('styles/lorefy-home-cinema.css','utf8'),index=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('uploads/files/lorefy-app.js','utf8');
 assert.ok(index.indexOf('modules/lorefy-home-cinema.js')<index.indexOf('src="uploads/files/lorefy-app.js'));
 assert.match(app,/lf-screen-scroll lf-home-screen lf-home-cinema/);assert.match(app,/window\.LorefyHomeCinema\.Resume/);
 assert.match(css,/\.lf-home-cinema/);assert.match(css,/lf-community-dislike-button/);assert.doesNotMatch(css,/\.lf-library-page|\.lf-profile-page|\.lf-explore-studio/);
});

test('Home review score is a single icon with the exact fractional value and bilingual accessible name',()=>{
 global.React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat().filter(Boolean)})};
 global.NenIcons={Star:'Star'};
 for(const language of ['en','ar']){
  const node=cinema.ReviewRating({value:4.75,language,recommendation:'no'});
  assert.equal(node.props['data-rating'],'4.75');
  assert.match(node.props['aria-label'],/4\.75/);
  assert.ok(all(node).some(n=>n.type==='Star'));
  assert.equal(all(node).filter(n=>n.type==='Star').length,1);
  assert.ok(all(node).some(n=>n.children.includes('4.75')));
 }
 assert.ok(all(cinema.ReviewRating({value:0,language:'en'})).some(n=>n.children.includes('—')));
});

test('Home uses explicit tweet layout anchors without replacing React-owned reaction children',()=>{
 const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8');
 assert.match(app,/lf-cinema-review-score/);
 assert.match(app,/x===\"main\"&&window\.LorefyHomeCinema\?React\.createElement\(window\.LorefyHomeCinema\.ReviewRating/);
 assert.match(app,/\"data-review-rating\":t\.r/);
 const css=fs.readFileSync('styles/lorefy-home-cinema.css','utf8');
 assert.match(css,/\.lf-home-cinema \.lf-community-work-card\{[^}]*direction:ltr!important/);
 assert.match(css,/\.lf-home-cinema \.lf-community-action-row\{[^}]*justify-content:flex-start!important/);
});

test('Home artwork is sharp and its composer uses a scoped glass sheet with viewport bounds',()=>{
 const css=fs.readFileSync('styles/lorefy-home-cinema.css','utf8');
 assert.doesNotMatch(css,/\.lf-cinema-backdrop\.is-cover\{[^}]*blur\(/);
 assert.match(css,/\.lf-app:has\(\.lf-home-cinema\) \.lf-community-compose-sheet>section\{[^}]*backdrop-filter:blur\(/);
 assert.match(css,/max-height:calc\(var\(--composer-viewport-height/);
 assert.match(css,/\.lf-community-compose-submit:disabled/);
});

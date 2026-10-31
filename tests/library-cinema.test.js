const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const api=()=>require('../modules/lorefy-library-cinema.js');
test('Library has no decorative book backdrop or extra artwork request',()=>{
 const source=fs.readFileSync('modules/lorefy-library-cinema.js','utf8'),app=fs.readFileSync('uploads/files/lorefy-app.js','utf8'),css=fs.readFileSync('styles/lorefy-library-cinema.css','utf8');
 assert.doesNotMatch(source,/function Backdrop|backdropWork|LorefyHomeCinema\.artwork/);
 assert.doesNotMatch(app,/LorefyLibraryCinema\.Backdrop/);
 assert.doesNotMatch(css,/lf-library-cinema-backdrop/);
});
test('Library checkpoints show saved units and known totals, never fabricate a denominator',()=>{
 assert.equal(api().checkpoint({ch:420},{chapter:218},'en','saved'),'218 / 420 chapters');
 assert.equal(api().checkpoint({pages:412},{page:90},'ar','saved'),'90 / 412 صفحة');
 assert.equal(api().checkpoint({vol:42},{volume:12},'en','saved'),'12 / 42 volumes');
 assert.equal(api().checkpoint({ch:0},{chapter:12},'en','12 chapters'),'12 chapters');
 assert.equal(api().checkpoint({ch:420},{chapter:0},'en','No checkpoint'),'No checkpoint');
 assert.equal(api().hasTotal({ch:0,pages:0}),false);
});
test('saved-unit percentage never uses a different unit total or exceeds one hundred',()=>{
 assert.equal(api().percentage({pages:400},{page:100}),25);
 assert.equal(api().percentage({ch:200},{chapter:50}),25);
 assert.equal(api().percentage({vol:20},{volume:4}),20);
 assert.equal(api().percentage({ch:200},{page:50}),null);
 assert.equal(api().percentage({ch:0},{chapter:50}),null);
 assert.equal(api().percentage({ch:100},{chapter:150}),100);
 assert.equal(api().percentage({ch:100},{chapter:0}),0);
});
test('Library search remains controlled and its clear button updates the same state',()=>{
 global.React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat().filter(Boolean)})};
 global.NenIcons={Search:'Search',X:'X'};let query='Berserk';
 const tree=api().Search({value:query,onChange:value=>query=value,language:'en'}),walk=n=>[n,...(n.children||[]).filter(x=>typeof x==='object').flatMap(walk)],nodes=walk(tree);
 const input=nodes.find(n=>n.type==='input');assert.equal(input.props.value,'Berserk');
 input.props.onChange({target:{value:'Dune'}});assert.equal(query,'Dune');
 nodes.find(n=>n.type==='button').props.onClick();assert.equal(query,'');
});
test('Library cinema is isolated and preserves all four existing view modes',()=>{
 const css=fs.readFileSync('styles/lorefy-library-cinema.css','utf8'),app=fs.readFileSync('uploads/files/lorefy-app.js','utf8'),index=fs.readFileSync('index.html','utf8');
 assert.match(app,/lf-screen-scroll lf-library-page lf-library-cinema/);
 assert.match(app,/window\.LorefyLibraryCinema\.Search/);
 assert.match(css,/\.lf-library-cinema/);assert.doesNotMatch(css,/\.lf-profile-page|\.lf-explore-studio/);
 assert.match(css,/not\(\.is-shelf-view\):not\(\.is-spine-view\):not\(\.is-showcase-view\)/);
 assert.ok(index.indexOf('modules/lorefy-library-cinema.js')<index.indexOf('src="uploads/files/lorefy-app.js'));
 const view=require('../modules/lorefy-library-view.js');assert.deepEqual(view.options('en').map(x=>x.mode),['grid','spines','showcase','shelf']);
});
test('Library header cancels legacy title padding and absolute layout controls',()=>{
 const css=fs.readFileSync('styles/lorefy-library-cinema.css','utf8');
 assert.match(css,/\.lf-library-cinema-heading h1\{[^}]*padding:0!important/);
 assert.match(css,/\.lf-library-view-switch\{[^}]*position:static!important/);
 assert.match(css,/\.lf-library-cinema \.lf-library-copy>span\{[^}]*direction:ltr!important/);
 assert.match(css,/\.lf-library-copy strong\{[^}]*white-space:normal!important/);
});

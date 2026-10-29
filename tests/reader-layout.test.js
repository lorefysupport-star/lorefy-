const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function harness() {
  const React = {
    createElement:(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}}),
    cloneElement:(element,props,...children)=>({type:element.type,props:{...element.props,...props,...(children.length?{children:children.flat(Infinity)}:{})}}),
    Children:{toArray:children=>[children].flat(Infinity).filter(Boolean)}
  };
  const NenIcons=Object.fromEntries(['Settings','Pencil','ChevronLeft','ChevronRight','BookOpen'].map(name=>[name,props=>React.createElement('svg',props)]));
  const window={React,NenIcons,LorefyProfileLayout:{normalize:value=>['normal','immersive','reader'].includes(value)?value:'normal'}};
  vm.runInNewContext(read('modules/lorefy-reader-layout.js'), {window});
  return {api:window.LorefyReaderLayout,h:React.createElement};
}
function fixture(h,layout) {
  const part=(className,...children)=>h('div',{className},...children);
  const metric=part('lf-profile-metrics',part('metric-a','4'));
  const name=part('lf-profile-name','Actual reader');
  const head=part('lf-profile-top-works-head','Favorites');
  const avatar=h('button',{className:'lf-profile-avatar',onClick:()=>{}},h('img',{src:'avatar.jpg'}));
  const banner=part('lf-profile-banner',h('img',{src:'banner.jpg'}),avatar);
  const favorites=part('lf-profile-favorites','Saved favorites');
  const recent=part('lf-profile-recent','Recent');
  const page=h('div',{'data-profile-layout':layout},banner,part('lf-profile-identity',name,metric,head),favorites,recent);
  return {page,metric,name,head,avatar,favorites,recent};
}
test('existing layouts return the exact original React tree',()=>{
  const {api,h}=harness();
  for(const layout of ['normal','immersive']){const {page}=fixture(h,layout);assert.equal(api.composeOwner(page,{}),page);}
});
test('reader composition preserves identity, actions, artwork and secondary sections',()=>{
  const {api,h}=harness(),f=fixture(h,'reader');
  const result=api.composeOwner(f.page,{lang:'en',reading:[]});
  const all=[];function walk(node){if(!node||typeof node!=='object')return;if(typeof node.type==='function'){walk(node.type(node.props));return;}all.push(node);(node.props.children||[]).forEach(walk);}walk(result);
  for(const original of [f.name,f.avatar,f.recent])assert.ok(all.includes(original));
  assert.ok(all.some(node=>node.props.className==='lf-profile-banner'&&node.props.children.includes(f.avatar)));
  assert.ok(all.some(node=>node.type==='img'&&node.props.src==='banner.jpg'));
  assert.ok(all.some(node=>node.props.className==='lf-reader-layout-statistics'));
  assert.equal(all.filter(node=>node===f.metric).length,1);
  assert.ok(all.some(node=>node.props.className==='lf-profile-favorites'));
});
test('reading rows use saved progress, clamp percentages and call the existing work action',()=>{
  const {api}=harness(),opened=[];
  const work={id:'a',title:'Actual title'};
  const tree=api.ReadingLately({lang:'en',reading:[{work,cover:'cover.jpg',chapter:12,total:40}],onWork:w=>opened.push(w)});
  const all=[];function walk(n){if(!n||typeof n!=='object')return;all.push(n);(n.props.children||[]).forEach(walk);}walk(tree);
  assert.ok(all.some(n=>n.type==='progress'&&n.props.value===12&&n.props.max===40));
  all.find(n=>n.type==='button'&&n.props['data-reading-work']==='a').props.onClick();
  assert.deepEqual(opened,[work]);
  const empty=api.ReadingLately({lang:'en',reading:[]});
  assert.ok(empty);
});

function descendants(node) {
  if(!node||typeof node!=='object')return [];
  if(typeof node.type==='function')return descendants(node.type(node.props));
  return [node,...(node.props.children||[]).flatMap(descendants)];
}
test('reader toolbar gives every icon action a matching tooltip and accessible name',()=>{
  const {api}=harness();
  for(const lang of ['ar','en']) {
    const all=descendants(api.Toolbar({lang,onSettings(){},onEdit(){},onBack(){}}));
    for(const button of all.filter(n=>n.type==='button')) {
      assert.ok(button.props.title);
      assert.equal(button.props.title,button.props['aria-label']);
    }
    const icons=all.filter(n=>n.type==='svg');
    assert.equal(icons.length,3);
    assert.ok(icons.every(n=>n.props.strokeWidth===1.75));
    assert.ok(all.filter(n=>n.props.className==='lf-reader-layout-glyph').every(n=>n.props['aria-hidden']===true));
  }
});
test('Arabic reading progress isolates numerical order and describes the actual clamped value',()=>{
  const {api}=harness();
  const row={work:{id:'a',title:'عنوان محفوظ'},cover:'a.jpg',chapter:6,total:27};
  const all=descendants(api.ReadingLately({lang:'ar',reading:[row]}));
  const numbers=all.find(n=>n.type==='bdi');
  assert.equal(numbers.props.dir,'ltr');
  assert.equal(numbers.props.children.join(''),'6 / 27');
  assert.ok(all.some(n=>n.type==='h2'&&n.props.children.includes('أقرأ الآن')));
  assert.equal(all.find(n=>n.type==='progress').props['aria-valuetext'],'6 من 27 فصلًا');
  const overflow=descendants(api.ReadingLately({lang:'en',reading:[{...row,chapter:99}]}));
  assert.equal(overflow.find(n=>n.type==='progress').props['aria-valuetext'],'27 of 27 chapters');
});
test('unknown reading totals do not invent percentages or an empty denominator',()=>{
  const {api}=harness();
  const all=descendants(api.ReadingLately({lang:'en',reading:[{work:{id:'a',title:'Saved'},chapter:12,total:0}]}));
  assert.equal(all.find(n=>n.type==='bdi').props.children.join(''),'12');
  assert.ok(!all.some(n=>n.type==='progress'));
  const empty=descendants(api.ReadingLately({lang:'en',reading:[]}));
  assert.ok(empty.some(n=>n.type==='h2'&&n.props.children.includes('Currently reading')));
  assert.ok(!empty.some(n=>n.props['data-reading-work']));
});
test('public profile discovery preserves the new owner layout',async()=>{
  const window={};vm.runInNewContext(read('modules/lorefy-user-discovery.js'),{window});
  const directory=window.LorefyUserDiscovery.createUserDirectory({readers:[{id:'other',username:'other',profile_layout:'reader'}]});
  const rows=await directory.search('other');
  assert.equal(rows[0].profile_layout,'reader');
});
test('public composition preserves owner theme, artwork and follow handler',()=>{
  const {api,h}=harness();const follow=()=>{};
  const avatar=h('div',{className:'lf-reader-avatar'},h('img',{src:'owner-avatar.jpg'}));
  const metrics=h('div',{className:'lf-reader-metrics'},'123');
  const identity=h('div',{className:'lf-reader-identity'},avatar,h('h1',null,'Owner name'),h('button',{onClick:follow},'Follow'),metrics);
  const shelf=h('section',{'data-profile-shelf':'works'},h('img',{src:'owner-cover.jpg'}));
  const original=h('div',{'data-profile-layout':'reader','data-owner-theme':'pink'},h('div',{className:'lf-reader-banner'},h('img',{src:'owner-banner.jpg'})),h('div',{className:'lf-reader-surface'},identity,shelf));
  const result=api.composePublic(original,{lang:'en'});
  assert.equal(result.props['data-owner-theme'],'pink');
  const all=[];function walk(n){if(!n||typeof n!=='object')return;if(typeof n.type==='function'){walk(n.type(n.props));return;}all.push(n);(n.props.children||[]).forEach(walk);}walk(result);
  assert.ok(all.some(n=>n.type==='button'&&n.props.onClick===follow));
  assert.ok(all.includes(shelf));assert.ok(all.includes(avatar));assert.equal(all.filter(n=>n===metrics).length,1);
});
test('pending SQL patch extends only the existing whitelist and fails on a changed projection',()=>{
  const sql=read('supabase/migrations/20261023193458_reader_profile_layout.sql');
  assert.ok(sql.includes("pg_get_functiondef('public.get_public_profile_artwork(uuid)'::regprocedure)"));
  assert.ok(sql.includes('execute replace(definition,old_case,new_case)'));
  assert.ok(sql.includes('raise exception'));
  assert.doesNotMatch(sql,/drop |grant |revoke |update public\./i);
});
test('character insertions follow statistics only in Reader and do not churn stable nodes',()=>{
  const source=read('modules/lorefy-growth-features.js');
  const fn=source.slice(source.indexOf('function syncProfileTopCharacters()'),source.indexOf('function hydrateProfileRatedCharacters('));
  for(const layout of ['normal','immersive','reader']) {
    const inserted=[],afterFavorite={},afterStats={};
    const grid={children:[1,2,3,4],classList:{toggle(){}},getAttribute:()=>JSON.stringify(Array.from({length:4},()=>['','','']))};
    const characters={getAttribute:()=> '5',querySelector:()=>grid};
    const favorites={nextSibling:afterFavorite,closest:()=>page},statistics={nextSibling:afterStats};
    const page={getAttribute:()=>layout,querySelector:selector=>selector.includes('top-characters')?characters:selector.includes('statistics')?statistics:null,
      insertBefore:(node,before)=>{inserted.push({node,before});(layout==='reader'?statistics:favorites).nextSibling=node;}};
    const context={doc:{querySelector:()=>favorites},renameProfileFavouriteWorksHeading(){},profileCharacterEntries:()=>({entries:[],missing:[]}),
      profileTopCharacterSelection:()=>[],profileTopCharacterFromRef:()=>null,profileTopCharacterRefKey:()=>'',characterImageUrl:()=>'',profileRatedCharacterCache:{}};
    vm.createContext(context);vm.runInContext(fn,context);context.syncProfileTopCharacters();context.syncProfileTopCharacters();
    assert.equal(inserted.length,1);
    assert.equal(inserted[0].node,characters);assert.equal(inserted[0].before,layout==='reader'?afterStats:afterFavorite);
  }
});

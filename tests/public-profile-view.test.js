const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function render(profile, overrides = {}) {
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }),
    useState: value => [typeof value === 'function' ? value() : value, () => {}],
    useEffect: () => {}
  };
  const window = { React, NenIcons: {}, LorefyBackend: null, LorefyPublicAppearance:require('../modules/lorefy-public-appearance.js'), LorefyLibraryView:require('../modules/lorefy-library-view.js') };
  window.LorefyI18n = require('../modules/lorefy-i18n'); window.document = {documentElement:{lang:'ar'}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../modules/lorefy-profile-shop.js'), 'utf8'), { window, URLSearchParams });
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../modules/lorefy-public-profile.js'), 'utf8'), { window, URL });
  return window.LorefyPublicProfile({
    profile,
    workById: id => ({ id, title: id, type:'Manga' }),
    cover: () => '',
    reviews: [],
    onWork: () => {},
    ...overrides
  });
}

function nodes(tree) {
  return !tree || typeof tree !== 'object' ? [] : [tree, ...tree.children.flatMap(nodes)];
}

test('a known zero visitor review count is not replaced by a stale loaded review count',()=>{
  for(const review_count of [0,'0',4]){
    const tree=render({id:'reader-a',review_count},{reviews:[{id:'stale',userId:'reader-a',mid:'work'}],renderReview:()=>null});
    const metric=nodes(tree).find(n=>n.props['data-profile-stat']==='MessageCircle');
    assert.equal(metric.children.find(n=>n&&n.type==='strong').children[0],Number(review_count));
  }
});

test('missing visitor review counts still use only this readers loaded collection',()=>{
  for(const review_count of [null,undefined]){
    const tree=render({id:'reader-a',review_count},{reviews:[{id:'own',userId:'reader-a'},{id:'other',userId:'reader-b'}],renderReview:()=>null});
    const metric=nodes(tree).find(n=>n.props['data-profile-stat']==='MessageCircle');
    assert.equal(metric.children.find(n=>n&&n.type==='strong').children[0],1);
  }
});
test('visitor favorite format uses an Arabic source label that the English localizer can translate',()=>{
  const chip=nodes(render({id:'reader-a',favorite_type:'Manga'})).find(n=>n.props['data-favorite-type']);
  assert.ok(JSON.stringify(chip).includes('مانجا'));
  assert.equal(require('../modules/lorefy-i18n.js').translate('مانجا','en'),'Manga');
  assert.equal(chip.props['data-profile-stat'],'Heart');
  const metrics=nodes(render({id:'reader-a',favorite_type:'Novel'})).find(n=>n.props.className==='lf-reader-metrics');
  assert.ok(metrics.children.some(n=>n.props['data-favorite-type'] && JSON.stringify(n).includes('رواية')));
  assert.ok(!nodes(render({id:'reader-a'})).some(n=>n.props.className==='lf-reader-type-chip'));
});
test('visitor keeps its own theme and shelf without inheriting viewer preferences',()=>{
  const tree=render({id:'blue-owner',theme:'custom-light-367faa',library_view:'spines',favorite_work_ids:['book-a']});
  assert.equal(tree.props['data-owner-theme'],'custom-light-367faa');
  assert.equal(tree.props['data-owner-library-view'],'spines');
  assert.equal(tree.props.style['--ui-bg'],require('../modules/lorefy-design-system.js').tokens('custom-light-367faa')['--ui-bg']);
  const rail=nodes(tree).find(n=>n.props.className==='lf-reader-shelf-rail is-spine-view');
  assert.ok(rail);
  const card=rail.children.find(n=>n.props.className==='lf-reader-cover is-work');
  assert.equal(card.props.style['--spine-height'],require('../modules/lorefy-library-view.js').profileSpineHeight('book-a')+'px');
  assert.ok(!nodes(render({id:'plain-owner',library_view:'grid',favorite_work_ids:['book-b']})).some(n=>String(n.props.className).includes('is-spine-view')));
});

test('all seven public shelf favorites remain independently clickable',()=>{
  const opened=[];
  const shelf=nodes(render({id:'reader-a',library_view:'spines',favorite_work_ids:['a','b','c','d','e','f','g','h']},{onWork:work=>opened.push(work.id)}))
    .find(n=>n.props['data-profile-shelf']==='works');
  const cards=nodes(shelf).filter(n=>n.type==='button');
  assert.equal(cards.length,7);
  cards.forEach(card=>card.props.onClick());
  assert.deepEqual(opened,['a','b','c','d','e','f','g']);
});

test('owner showcase reaches both public favorites and library without dropping work actions',()=>{
  const opened=[];
  const tree=render({id:'showcase-owner',theme:'light',library_view:'showcase',favorite_work_ids:['a','b','c','d'],library_entries:{a:'reading',b:'completed'}},{onWork:work=>opened.push(work.id)});
  assert.equal(tree.props['data-owner-library-view'],'showcase');
  const all=nodes(tree);
  const shelf=all.find(n=>n.props.className==='lf-reader-shelf-rail is-showcase-view');
  const cards=nodes(shelf).filter(n=>n.type==='button');
  assert.equal(cards.length,3);cards.forEach(n=>n.props.onClick());
  assert.deepEqual(opened,['a','b','c']);
  assert.ok(all.some(n=>n.props.className==='lf-reader-library-grid is-showcase-view'));
  assert.ok(!nodes(render({id:'grid-owner',library_view:'grid',favorite_work_ids:['a']})).some(n=>String(n.props.className).includes('showcase')));
});

test('visitor header follows the owner layout with a safe normal fallback', () => {
  assert.equal(render({id:'owner-a', profile_layout:'immersive'}).props['data-profile-layout'], 'immersive');
  assert.equal(render({id:'owner-b', profile_layout:'normal'}).props['data-profile-layout'], 'normal');
  assert.equal(render({id:'owner-c', profile_layout:'unexpected'}).props['data-profile-layout'], 'normal');
});

test('visitor decoration uses only the owner projection and preserves profile artwork', () => {
  const tree = render({ id:'owner-a', avatar:'https://example.com/avatar.jpg', banner:'https://example.com/banner.jpg',
    profile_decoration:{frame:'observatory',page:'blossom',effect:'invalid',banner:'https://evil.test'} });
  assert.deepEqual(JSON.parse(tree.props['data-profile-decoration']),{frame:'observatory',page:'blossom',effect:null});
  assert.equal(render({id:'owner-b'}).props['data-profile-decoration'],'{"frame":null,"page":null,"effect":null}');
  const all=nodes(tree);
  assert.ok(all.some(node=>node.type==='img' && node.props.src==='https://example.com/avatar.jpg'));
  assert.ok(all.some(node=>node.type==='img' && node.props.src==='https://example.com/banner.jpg'));
});

function contrastWithWhite(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16) / 255);
  const luminance = channels.map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  return 1.05 / (luminance + 0.05);
}

test('visitor profile renders the full identity, reading metrics, and both favorite shelves', () => {
  const tree = render({ id:'reader-a', name:'Cara', username:'cara', total_chapters:1183, read_hours:237,
    completed_count:5, follower_count:3, following_count:2, favorite_work_ids:['work-a'],
    favorite_character_ids:[{ workId:'work-a', character:{ name:'Character A', image:'https://example.com/a.jpg' } }],
    social_links:{ instagram:'cara' } });
  const all = nodes(tree);
  assert.equal(all.filter(n => n.props['data-profile-stat']).length, 6);
  assert.equal(all.filter(n => n.props['data-profile-shelf']).length, 2);
  assert.equal(all.filter(n => n.props['data-connection']).length, 2);
  assert.equal(all.filter(n => n.props['data-favorite-type']).length, 1);
  assert.ok(JSON.stringify(tree).includes('1183'));
  assert.ok(all.some(n => n.type === 'a' && n.props.href === 'https://instagram.com/cara'));
  assert.equal(all.filter(n => n.props['data-owner-action']).length, 0);
});

test('visitor profile separates quiet connection counts from the primary follow action', () => {
  const tree = render({ id:'reader-a', name:'Cara', username:'cara', follower_count:3, following_count:2 });
  const all = nodes(tree);
  const summary = all.find(node => node.props.className === 'lf-reader-social-summary');
  const actions = all.find(node => node.props.className === 'lf-reader-primary-actions');

  assert.ok(summary);
  assert.ok(actions);
  assert.equal(all.filter(node => node.props.className === 'lf-reader-social-bar').length, 0);
  assert.equal(all.filter(node => node.props['data-connection']).length, 2);
  assert.equal(all.filter(node => node.props['data-follow-action']).length, 1);
  assert.ok(actions.children.some(node => node && node.props && node.props['data-follow-action']));
});

test('primary follow action keeps small white text at WCAG AA contrast', () => {
  const css = fs.readFileSync(path.join(__dirname, '../styles/lorefy-public-profile.css'), 'utf8');
  const rule = css.match(/\.lf-reader-follow\s*\{([\s\S]*?)\n\}/)[1];
  const hex = rule.match(/background:[^;]*(#[0-9a-f]{6})/i)[1];

  assert.ok(contrastWithWhite(hex) >= 4.5, `${hex} does not reach 4.5:1 against white`);
});

test('profile social controls use smooth borderless surfaces instead of framed controls', () => {
  const css = fs.readFileSync(path.join(__dirname, '../styles/lorefy-public-profile.css'), 'utf8');

  assert.match(css, /\.lf-reader-type-chip\s*\{[^}]*border:\s*0;/s);
  assert.match(css, /\.lf-reader-follow\s*\{[^}]*border-radius:\s*999px;/s);
  assert.match(css, /\.lf-reader-follow\.is-following\s*\{[^}]*border:\s*0;/s);
  assert.match(css, /\.lf-reader-socials a\s*\{[^}]*border:\s*0;/s);
  assert.doesNotMatch(css, /\.lf-reader-metrics\s*\{[^}]*border-block:/s);
  assert.doesNotMatch(css, /\.lf-reader-metrics\s*>\s*\*\s*\+\s*\*\s*\{[^}]*border-inline-start:/s);
});

test('visitor profile puts posts between reviews and completed and opens the post feed', () => {
  let opened = null;
  const all = nodes(render({ id:'reader-a', username:'cara', review_count:2, post_count:7, completed_count:4 }, {
    onPosts:profile => { opened = profile; }
  }));
  const metrics = all.filter(node => node.props['data-profile-stat']);

  assert.deepEqual(metrics.map(node => node.props['data-profile-stat']), ['MessageCircle', 'MessagesSquare', 'BookMarked', 'BookOpen', 'Clock', 'Heart']);
  const posts = metrics[1];
  assert.equal(posts.type, 'button');
  posts.props.onClick();
  assert.equal(opened.id, 'reader-a');
});

test('visitor top characters are buttons that open their linked work', () => {
  let opened = null;
  const all = nodes(render({ id:'reader-a', username:'cara', favorite_character_ids:[
    { workId:'work-a', character:{ name:'Character A', image:'https://example.com/a.jpg' } }
  ] }, { onWork:work => { opened = work; } }));
  const character = all.find(node => node.props['data-character-card']);

  assert.equal(character.type, 'button');
  assert.equal(character.props['aria-label'], 'فتح عمل Character A');
  character.props.onClick();
  assert.equal(opened.id, 'work-a');
});

test('visitor library exposes a dedicated view-all control and a compact preview', () => {
  const entries = Object.fromEntries(Array.from({ length:8 }, (_, index) => [`work-${index + 1}`, 'أقرأ حالياً']));
  const all = nodes(render({ id:'reader-a', username:'cara', library_entries:entries }));
  const viewAll = all.find(node => node.props['data-library-view-all']);

  assert.equal(viewAll.type, 'button');
  assert.ok(JSON.stringify(viewAll).includes('8'));
  assert.equal(all.filter(node => node.props['data-library-preview']).length, 4);
});

test('an empty visitor profile still has both shelves without editable plus buttons', () => {
  const all = nodes(render({ id:'reader-b', username:'empty' }));
  assert.equal(all.filter(n => n.props['data-profile-shelf']).length, 2);
  assert.equal(all.filter(n => n.props['data-empty-slot']).length, 8);
  assert.equal(all.filter(n => n.props['data-empty-slot'] && n.type === 'button').length, 0);
});

test('owner artwork wins over stale character snapshots and viewer artwork', () => {
  const all = nodes(render({ id:'reader-a', favorite_work_ids:['work-a'], library_entries:{'work-a':'completed'},
    custom_work_covers:{'work-a':'https://example.com/owner-new.jpg'},
    custom_character_images:{'character-key':'https://example.com/portrait-new.jpg'},
    favorite_character_ids:[{workId:'work-a', characterKey:'character-key', character:{id:7, key:'character-key', name:'A', image:'https://example.com/stale.jpg'}}]
  }, { cover:() => { throw new Error('Must not read viewer cover'); }, workById:id=>({id,title:id,cover:'https://example.com/source.jpg'}) }));
  const images = all.filter(n=>n.type==='img').map(n=>n.props.src);
  assert.equal(images.filter(src=>src==='https://example.com/owner-new.jpg').length,2);
  assert.ok(images.includes('https://example.com/portrait-new.jpg'));
  assert.ok(!images.includes('https://example.com/stale.jpg'));
});

test('a reader without overrides gets the source cover, not the viewers custom cover', () => {
  const all = nodes(render({id:'reader-b',favorite_work_ids:['work-a']}, {
    cover:()=>{throw new Error('Viewer custom cover leaked');}, workById:id=>({id,title:id,cover:'https://example.com/source.jpg'})
  }));
  assert.ok(all.some(n=>n.type==='img' && n.props.src==='https://example.com/source.jpg'));
});

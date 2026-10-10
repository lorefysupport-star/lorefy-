const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');

test('review action identity survives translated labels', () => {
  const growth = source('modules/lorefy-growth-features.js');
  const start = growth.indexOf('  function isReviewButton(');
  const end = growth.indexOf('  /* undo', start);
  const scope = {};
  vm.runInNewContext(growth.slice(start, end), scope);
  const button = {textContent:'Write a review', getAttribute: key => key === 'data-lorefy-action' ? 'write-review' : null};
  assert.equal(scope.isReviewButton(button), true);
  assert.equal(scope.isReviewButton({textContent:'My reviews', getAttribute:()=>null}), false);
});

test('chapter toolbar finds review action without character enhancement', () => {
  const chapter = source('modules/lorefy-chapter-detail.js');
  assert.ok(chapter.includes('[data-lorefy-action="write-review"]'));
  const app = source('uploads/files/lorefy-app.js');
  assert.ok(app.includes('"data-lorefy-action":"write-review"'));
});

test('React dark palette matches the shared CSS surface tokens', () => {
  const system = require('../modules/lorefy-design-system.js');
  const css = source('styles/lorefy-design-system.css');
  const dark = css.slice(css.indexOf('.lf-app.is-dark {'), css.indexOf('.lf-app.lf-app.lf-app,'));
  const fields = {bg:'bg', card:'surface', field:'fill', text:'ink', sub:'muted', border:'line'};
  for (const [field, token] of Object.entries(fields)) {
    const expected = dark.match(new RegExp('--ui-' + token + ':\\s*([^;]+)'))[1].trim();
    assert.equal(system.palette(true)[field].toLowerCase(), expected);
  }
});

test('cloud synchronization respects the deployed twenty-key patch limit', async () => {
  const backend = source('backend/lorefy-backend.js');
  const start = backend.indexOf('    push: async function(');
  const end = backend.indexOf('    saveProfile:', start);
  const payload = Object.fromEntries(Array.from({length:32},(_,i)=>['lorefy.user.key'+i,'value'+i]));
  let remote = {}, version = 0, calls = 0;
  const context = {ACTIVE_USER_KEY:'owner',readLS:()=> 'tester',gather:()=>payload,readPendingState:()=>payload,accountStateKeys:()=>Object.keys(payload),
    clearPendingState(){},writeStateBase(){},console};
  vm.runInNewContext('var B = {' + backend.slice(start,end) + '};',context);
  const api = context.B;
  Object.assign(api,{mode:'live',_stateVersion:0,_stateBase:{},getSession:async()=>({userId:'tester'}),client:{rpc:async(name,args)=>{
    calls++;
    if(Object.keys(args.state_patch).length>20 || args.removed_keys.length>20) return {error:{message:'invalid_state_patch'}};
    assert.equal(args.expected_version,version);
    remote={...remote,...args.state_patch}; version++;
    return {data:[{state_data:remote,state_version:version}]};
  }}});
  await api.push();
  assert.equal(calls,2);
  assert.deepEqual(JSON.parse(JSON.stringify(remote)),payload);
});

test('community reply submit remains busy while editing during a request', () => {
  const community = source('modules/lorefy-community.js');
  const thread = community.slice(community.indexOf('  async function openThread('),community.indexOf('  function renderPostFeed('));
  assert.match(thread,/if \(!body \|\| sending\) return/);
  assert.match(thread,/sending = true/);
  assert.match(thread,/send\.disabled = sending \|\| !input\.value\.trim\(\)/);
});

test('translation coverage includes imperative chapter and community controls', () => {
  const i18n = require('../modules/lorefy-i18n.js');
  for (const [ar,en] of [['مراجعة العمل','Review work'],['اكتب رداً...','Write a reply...'],['عنوان الفصل غير متوفر','Chapter title unavailable'],['جارٍ تحميل الردود...','Loading replies...']]) {
    assert.equal(i18n.translate(ar,'en'),en);
  }
  assert.equal(i18n.translate('الفصل 42','en'),'Chapter 42');
  assert.equal(i18n.translate('ابدأ جلسة قراءة','en'),'Start reading session');
  assert.equal(i18n.translate('إضافة A Game of Thrones إلى المكتبة','en'),'Add A Game of Thrones to library');
  assert.equal(i18n.translate('4.3 من 5','en'),'4.3 out of 5');
});

test('interface translations restore Arabic and preserve reader-authored content', () => {
  const i18n = require('../modules/lorefy-i18n.js');
  const node = {nodeValue:'اكتب مراجعة',parentElement:{closest:()=>null}};
  i18n.textNode(node,'en');
  assert.equal(node.nodeValue,'Write a review');
  i18n.textNode(node,'ar');
  assert.equal(node.nodeValue,'اكتب مراجعة');
  const comment = {nodeValue:'القصة',parentElement:{closest:()=>({})}};
  i18n.textNode(comment,'en');
  assert.equal(comment.nodeValue,'القصة');
  assert.equal(i18n.translate('القصة 5 من 5','en'),'Story 5 out of 5');
  assert.equal(i18n.translate('420 فصل','en'),'420 chapters');
});

test('failed cloud batches retain unacknowledged local changes for retry', async () => {
  const backend = source('backend/lorefy-backend.js');
  const start = backend.indexOf('    push: async function(');
  const end = backend.indexOf('    saveProfile:', start);
  const payload = Object.fromEntries(Array.from({length:32},(_,i)=>['lorefy.user.key'+i,'value'+i]));
  const pending = {...payload};
  let remote = {}, version = 0, calls = 0;
  const context = {ACTIVE_USER_KEY:'owner',readLS:()=> 'tester',gather:()=>payload,readPendingState:()=>({...pending}),accountStateKeys:()=>Object.keys(payload),
    clearPendingState(keys){keys.forEach(key=>delete pending[key]);},writeStateBase(){},console};
  vm.runInNewContext('var B = {' + backend.slice(start,end) + '};',context);
  const api = context.B;
  Object.assign(api,{mode:'live',_stateVersion:0,_stateBase:{},getSession:async()=>({userId:'tester'}),client:{rpc:async(name,args)=>{
    calls++;
    if(calls===2) return {error:{message:'temporary network error'}};
    assert.equal(args.expected_version,version);
    remote={...remote,...args.state_patch};version++;
    return {data:[{state_data:remote,state_version:version}]};
  }}});
  await assert.rejects(api.push());
  assert.equal(Object.keys(pending).length,12);
  await api.push();
  assert.equal(Object.keys(pending).length,0);
  assert.deepEqual(JSON.parse(JSON.stringify(remote)),payload);
});

test('English community filters retain their semantic identity', () => {
  const community = source('modules/lorefy-community.js');
  const start = community.indexOf('  function filterForCommunityTab(');
  const end = community.indexOf('  function syncCommunityTabSemantics(', start);
  const scope = {};
  vm.runInNewContext(community.slice(start,end),scope);
  for (const [label,filter] of [['Following','friends'],['My posts','mine'],['Popular','popular']]) {
    assert.equal(scope.filterForCommunityTab({textContent:label,dataset:{}}),filter);
  }
  assert.equal(scope.filterForCommunityTab({textContent:'Changed label',dataset:{communityFilter:'mine'}}),'mine');
});

test('post publishing cannot be re-enabled by editing during the request', () => {
  const sourceCode = source('modules/lorefy-community.js');
  const compose = sourceCode.slice(sourceCode.indexOf('    var toolButtons = composer'),sourceCode.indexOf('    communityOverlayHost().appendChild(composer)'));
  assert.match(compose,/if \(publishing\) return/);
  assert.match(compose,/publishing = true/);
  assert.match(compose,/submit\.disabled = publishing \|\|/);
});

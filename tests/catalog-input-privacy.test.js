const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness(result) {
  const source = fs.readFileSync('modules/lorefy-api-catalog.js', 'utf8');
  const begin = source.indexOf('  var inputTimer = null;');
  const end = source.indexOf('  function hookHistory()', begin);
  const events = {}, timers = new Map(), calls = [],statuses=[],options=[];
  const scope = {
    global: {
      AbortController,
      addEventListener(name, fn) { events[name] = fn; },
      CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},dispatchEvent(event){statuses.push(event.detail);},
      document: {addEventListener(name, fn) { events[name] = fn; }},
      setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
      clearTimeout(id) { timers.delete(id); }
    },
    config: () => ({autoSearch: true}), normalizeSpaces: s => s.trim(),normalizeType:s=>s,
    readRouteType: () => 'Manga', SEARCH_DEBOUNCE_MS: 650,
    search(q, type, requestOptions) { calls.push({q, type}); options.push(requestOptions); return typeof result==='function'?result():Promise.resolve(result||{}); }
  };
  vm.runInNewContext(source.slice(begin, end) + '\nbindSearchInputs();', scope);
  return {events, calls,statuses,options, flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); }};
}
function field(value, allowed = false, tagName = 'INPUT') {
  return {value, tagName, isConnected: true, closest: selector => allowed && selector!=="[data-lorefy-search-local]" ? {} : null};
}
test('private drafts, profile fields, chapter numbers and character search never reach catalog APIs', () => {
  const h = harness();
  for (const target of [field('private review', false, 'TEXTAREA'), field('private bio'), field('420'), field('Gon character')]) {
    h.events.input({target}); h.flush();
  }
  assert.equal(h.calls.length, 0);
});
test('catalog search still runs, and clearing or removing the field cancels queued requests', () => {
  const h = harness(), target = field('Hunter', true);
  h.events.input({target}); h.flush();
  assert.deepEqual(h.calls, [{q: 'Hunter', type: 'Manga'}]);
  h.events.input({target}); target.value = ''; h.events.input({target}); h.flush();
  target.value = 'Berserk'; h.events.input({target}); target.isConnected = false; h.flush();
  assert.equal(h.calls.length, 1);
});
test('navigation cancels a pending catalog query', () => {
  const h = harness();
  h.events.input({target: field('Hunter', true)});
  assert.equal(typeof h.events['lorefy:route-change'], 'function');
  h.events['lorefy:route-change'](); h.flush();
  assert.equal(h.calls.length, 0);
});
test('type-page search sends its explicit format instead of the URL default',()=>{
 const h=harness(),host={getAttribute:()=> 'Novel'},target=field('Golden son',true);
 target.closest=selector=>selector==='[data-lorefy-search-local]'?null:selector==='[data-lorefy-catalog-search]'?host:{};
 h.events.input({target});h.flush();assert.deepEqual(h.calls,[{q:'Golden son',type:'Novel'}]);
});
test('changing type before debounce cancels a queued format lookup',()=>{
 const h=harness();let type='Novel';const host={getAttribute:()=>type},target=field('Golden son',true);target.closest=selector=>selector==='[data-lorefy-search-local]'?null:host;
 h.events.input({target});type='Book';h.flush();assert.equal(h.calls.length,0);
});

test('online format lookup exposes waiting and failure instead of a false empty result',async()=>{
 const h=harness({error:'offline'}),host={getAttribute:()=> 'Novel'},target=field('Golden son',true);target.closest=selector=>selector==='[data-lorefy-search-local]'?null:host;
 h.events.input({target});assert.equal(h.statuses[0].status,'searching');h.flush();await Promise.resolve();await Promise.resolve();
 assert.equal(h.statuses.at(-1).status,'error');assert.equal(h.statuses.at(-1).type,'Novel');
});
test('a response for a cleared search does not replace current search status',async()=>{
 const h=harness(),target=field('Golden son',true);h.events.input({target});h.flush();target.value='';
 await Promise.resolve();await Promise.resolve();assert.equal(h.statuses.length,1);
});

test('main media search explicitly searches all types',()=>{
 const h=harness(),host={getAttribute:()=> 'All'},target=field('Golden son',true);
 target.closest=selector=>selector==='[data-lorefy-search-local]'?null:host;
 h.events.input({target});h.flush();assert.equal(h.calls[0].type,'All');
});
test('people and list modes never send their input to work providers',()=>{
 const h=harness(),target=field('private list name',true);target.closest=()=>({});
 h.events.input({target});h.flush();assert.equal(h.calls.length,0);
});
for(const type of ['Manga','Manhwa','Manhua','Comics','Novel','Book','Light Novel','Web Novel'])test('format input dispatches the selected '+type+' scope',()=>{
 const h=harness(),host={getAttribute:()=>type},target=field('Public title',true);
 target.closest=selector=>selector==='[data-lorefy-search-local]'?null:host;
 h.events.input({target});h.flush();assert.equal(h.calls[0].type,type);
});

test('editing and navigating abort the active HTTP operation, not just its queued timer',()=>{
 const h=harness(()=>new Promise(()=>{})),target=field('Hunter',true);
 h.events.input({target});h.flush();const first=h.options[0];assert.equal(first.signal.aborted,false);
 target.value='Berserk';h.events.input({target});assert.equal(first.signal.aborted,true);h.flush();
 h.events['lorefy:route-change']();assert.equal(h.options[1].signal.aborted,true);
});
test('returning to the same query cannot revive an older response or finish its newer busy state',async()=>{
 const completions=[],h=harness(()=>new Promise(resolve=>completions.push(resolve))),target=field('Hunter',true);
 h.events.input({target});h.flush();target.value='Berserk';h.events.input({target});h.flush();
 target.value='Hunter';h.events.input({target});h.flush();assert.equal(h.options[0].isCurrent(),false);
 completions[0]({});await Promise.resolve();await Promise.resolve();assert.equal(h.statuses.at(-1).status,'searching');
 completions[2]({});await Promise.resolve();await Promise.resolve();assert.equal(h.statuses.at(-1).status,'ready');
});

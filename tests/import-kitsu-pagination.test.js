const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync('modules/lorefy-growth-features.js', 'utf8');
const base = 'https://kitsu.io/api/edge/library-entries';
const pageUrl = n => base + '?filter[userId]=qa&filter[kind]=manga&include=manga&page[limit]=500&page[offset]=' + n;
function entry(id, title = 'Work ' + id) {
  return { data:[{id:String(id), type:'libraryEntries', attributes:{status:'completed',ratingTwenty:17,progress:38},
    relationships:{manga:{data:{type:'manga',id:String(id)}}}}],
    included:[{type:'manga',id:String(id),attributes:{canonicalTitle:title}}] };
}
function harness(load, {known = () => true} = {}) {
  const calls = [], scope = { URL, IM_READING:'reading', IM_DONE:'done', IM_WISH:'wish', IM_DROPPED:'dropped', IM_PAUSED:'paused',
    withTimeout:p => p, imFindByTitle:title => known(title) ? {id:title,title} : null,
    fetch:async url => {
      calls.push(String(url));
      if (new URL(url).pathname === '/api/edge/users') return {ok:true,json:async () => ({data:[{id:'qa'}]})};
      const result = await load(calls.filter(u => new URL(u).pathname !== '/api/edge/users').length, url);
      return {ok:!result.httpError,status:result.httpError,json:async () => result};
    } };
  vm.runInNewContext(source.slice(source.indexOf('  function imFetchKitsu('),source.indexOf('  function imReadFileText(')),scope);
  return {calls, run:() => scope.imFetchKitsu('qa')};
}

test('Kitsu follows every next page beyond the old six-page cutoff', async () => {
  const h = harness(n => ({...entry(n),links:{next:n < 9 ? pageUrl(n) : null}}));
  const result = await h.run();
  assert.equal(result.rows.length,9); assert.equal(h.calls.length,10);
  assert.equal(result.rows[8].score,4.25); assert.equal(result.rows[8].chapters,38);
  assert.equal(result.rows[8].status,'done'); assert.equal(result.misses,0);
});

test('Kitsu accepts relative JSON:API next links and link objects', async () => {
  for (const next of [pageUrl(1).replace('https://kitsu.io',''),{href:pageUrl(1)}]) {
    const h = harness(n => ({...entry(n),links:{next:n === 1 ? next : null}}));
    assert.equal((await h.run()).rows.length,2);
    assert(h.calls.every(u => u.startsWith('https://kitsu.io/')));
  }
});

test('Kitsu accepts the provider app domain without following arbitrary hosts', async () => {
  const h = harness(n => ({...entry(n),links:{next:n === 1 ? pageUrl(1).replace('kitsu.io','kitsu.app') : null}}));
  assert.equal((await h.run()).rows.length,2);
});

test('overlapping library entries count once, including unmatched entries', async () => {
  const h = harness(n => {
    const page = entry(n === 3 ? 2 : 1, n === 3 ? 'Missing' : 'Known');
    if (n === 4) Object.assign(page,entry(2,'Missing'));
    return {...page,links:{next:n < 4 ? pageUrl(n) : null}};
  }, {known:title => title === 'Known'});
  const result = await h.run();
  assert.equal(result.rows.length,1); assert.equal(result.misses,1);
});

for (const next of [
  'https://other.invalid/api/edge/library-entries', 'http://kitsu.io/api/edge/library-entries',
  'https://kitsu.io/api/edge/users', 'https://name:secret@kitsu.io/api/edge/library-entries',
  'https://kitsu.io:8443/api/edge/library-entries', 42, {unexpected:true}, ''
]) test('an invalid Kitsu next link rejects the entire preview: '+JSON.stringify(next), async () => {
  const h = harness(() => ({...entry(1),links:{next}}));
  await assert.rejects(h.run(),/تعذر إكمال جلب مكتبة Kitsu/);
  assert.equal(h.calls.length,2);
});

test('a repeated page rejects instead of silently returning a partial library', async () => {
  const h = harness(() => ({...entry(1),links:{next:pageUrl(1)}}));
  await assert.rejects(h.run(),/تعذر إكمال جلب مكتبة Kitsu/);
  assert.equal(h.calls.length,3);
});

test('a failed seventh page rejects rather than accepting the first six', async () => {
  const h = harness(n => n === 7 ? {httpError:503} : {...entry(n),links:{next:pageUrl(n)}});
  await assert.rejects(h.run(),/تعذر إكمال جلب مكتبة Kitsu/);
  assert.equal(h.calls.length,8);
});

for (const bad of [{}, {data:{}}, {data:null}, {data:[],included:{}}])
  test('malformed Kitsu response is not interpreted as successful completion '+JSON.stringify(bad), async () => {
    const h = harness(n => n === 2 ? bad : {...entry(1),links:{next:pageUrl(1)}});
    await assert.rejects(h.run(),/تعذر إكمال جلب مكتبة Kitsu/);
  });

test('unbounded unique page links stop with an explicit failure, never partial success', async () => {
  const h = harness(n => ({...entry(n),links:{next:pageUrl(n)}}));
  await assert.rejects(h.run(),/تعذر إكمال جلب مكتبة Kitsu/);
  assert.equal(h.calls.length,1001);
});

test('a fresh retry starts at the first page and succeeds without carrying partial rows', async () => {
  let fail = true;
  const h = harness((_n,url) => {
    const second = new URL(url).searchParams.has('page[offset]');
    if (second && fail) throw Error('offline');
    return {...entry(second ? 2 : 1),links:{next:second ? null : pageUrl(1)}};
  });
  await assert.rejects(h.run(),/تعذر إكمال جلب مكتبة Kitsu/);
  fail = false;
  const result = await h.run();
  assert.equal(result.rows.length,2); assert.equal(result.rows[0].work.title,'Work 1');
});

test('an actually empty library retains the specific empty-account error', async () => {
  const h = harness(() => ({data:[],links:{next:null}}));
  await assert.rejects(h.run(),/لا توجد أعمال مانجا/);
});

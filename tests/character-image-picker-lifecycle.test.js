const test=require('node:test');
const assert=require('node:assert/strict');
const {harness,flush,deferred}=require('./helpers/character-image-picker.js');

test('image picker takes focus, contains both Tab directions and restores background exactly once',async()=>{
  const h=harness(),picker=h.open();await flush();const first=picker.querySelector('.lf-image-choice-close');
  assert.equal(h.doc.activeElement,first);assert.equal(h.background.inert,true);assert.equal(h.alreadyInert.inert,true);
  const last=picker.querySelectorAll('button,a[href]').at(-1);last.focus();assert.equal(h.key(picker,'Tab'),true);assert.equal(h.doc.activeElement,first);
  assert.equal(h.key(picker,'Tab',true),true);assert.equal(h.doc.activeElement,last);
  assert.equal(h.key(picker,'Escape'),true);assert.equal(picker.isConnected,false);assert.equal(h.doc.activeElement,h.opener);
  assert.equal(h.background.inert,false);assert.equal(h.alreadyInert.inert,true);h.close();assert.equal(h.alreadyInert.inert,true);
});

test('provider failure offers one retry, deduplicates choices and announces progress',async()=>{
  let calls=0,options;const next=deferred();const h=harness({loader:(c,w,opts)=>{options=opts;return ++calls===1?Promise.reject(Error('offline')):next.promise;}});
  const picker=h.open();await flush();const retry=picker.querySelector('.lf-image-choice-retry');assert.ok(retry);
  assert.equal(options.reportErrors,true);assert.equal(retry.hidden,false);assert.equal(picker.querySelector('.lf-image-choice-status').attrs.role,'status');
  retry.click();retry.click();await flush();assert.equal(calls,2);assert.equal(retry.disabled,true);
  next.resolve(['https://example.com/current.jpg','https://example.com/fresh.jpg','https://example.com/fresh.jpg']);await flush();
  assert.equal(picker.querySelectorAll('.lf-image-choice').length,2);assert.equal(retry.hidden,true);assert.equal(h.timers.size,0);
});

test('timeout can be retried and an older provider result cannot replace the successful retry',async()=>{
  const old=deferred();let calls=0;const h=harness({loader:()=>++calls===1?old.promise:Promise.resolve(['https://example.com/fresh.jpg'])});
  const picker=h.open();await flush();h.expire();await flush();assert.match(picker.textContent,/Could not load/);
  picker.querySelector('.lf-image-choice-retry').click();await flush();old.resolve(['https://example.com/stale.jpg']);await flush();
  assert.equal(picker.querySelectorAll('img').some(n=>n.attrs.src==='https://example.com/stale.jpg'),false);
  assert.equal(picker.querySelectorAll('img').some(n=>n.attrs.src==='https://example.com/fresh.jpg'),true);
});

test('closing releases pending work and late results cannot mutate a detached picker or a replacement',async()=>{
  const old=deferred();let calls=0;const h=harness({loader:()=>++calls===1?old.promise:Promise.resolve([])});
  const first=h.open();h.close();const before=first.textContent;const next=h.open();await flush();
  old.resolve(['https://example.com/stale.jpg']);await flush();assert.equal(first.textContent,before);assert.equal(next.isConnected,true);
  h.close();assert.equal(h.timers.size,0);assert.equal(h.auth.size,0);for(const values of h.listeners.values())assert.equal(values.size,0);
});

test('owner switch invalidates a file read before it can save to another account',async()=>{
  const h=harness();const picker=h.open();const input=picker.querySelector('input');input.files=[{}];input.handlers.change();assert.equal(h.reads.length,1);
  h.switchOwner('second');h.switchOwner('first');await h.reads[0]('data:image/jpeg;base64,fixture');await flush();
  assert.equal(picker.isConnected,false);assert.equal(h.writes.length,0);assert.equal(h.changes.length,0);
});

test('pending save is single flight and cannot close or update a newer picker',async()=>{
  const saved=deferred();const h=harness({save:()=>saved.promise});const picker=h.open();await flush();
  picker.querySelector('.lf-image-choice').click();picker.querySelector('.lf-image-choice-secondary').click();assert.equal(h.writes.length,1);
  h.close();const next=h.open();saved.resolve();await flush();assert.equal(next.isConnected,true);assert.equal(h.changes.length,0);assert.equal(h.toasts.length,0);h.close();
});

test('save failure keeps choices available for retry and success closes with one callback',async()=>{
  let calls=0;const h=harness({save:async()=>{if(++calls===1)throw Error('save unavailable');}});const picker=h.open();await flush();
  await picker.querySelector('.lf-image-choice-secondary').click();await flush();assert.equal(picker.isConnected,true);assert.equal(h.changes.length,0);
  await picker.querySelector('.lf-image-choice-secondary').click();await flush();assert.equal(picker.isConnected,false);assert.deepEqual(h.changes,['']);assert.equal(h.doc.activeElement,h.opener);
});

test('closing the parent character page releases the nested picker before leaving',async()=>{
  const h=harness(),picker=h.open();let restored=false;h.background._releaseDialog=()=>{restored=!h.background.inert;};
  h.closeParent();assert.equal(picker.isConnected,false);assert.equal(restored,true);assert.equal(h.background.inert,true);
});

test('auth logout invalidates late results even when account storage has not caught up',async()=>{
  const remote=deferred(),h=harness({loader:()=>remote.promise}),picker=h.open();await flush();
  for(const listener of h.auth)listener(null);remote.resolve(['https://example.com/late.jpg']);await flush();
  assert.equal(picker.isConnected,false);assert.equal(h.writes.length,0);assert.equal(h.auth.size,0);
});

test('a synchronously failing provider offers recovery and a missing provider can become available',async()=>{
  const h=harness({loader:()=>{throw Error('unavailable');}}),picker=h.open();await flush();
  const retry=picker.querySelector('.lf-image-choice-retry');assert.equal(retry.hidden,false);
  h.global.LorefyCharacterSystem.loadImageOptions=async()=>[];retry.focus();retry.click();await flush();
  assert.equal(retry.hidden,true);assert.equal(h.doc.activeElement,picker.querySelector('.lf-image-choice-close'));h.close();
  const missing=harness({loader:null}),other=missing.open();assert.match(other.textContent,/unavailable/i);
  missing.global.LorefyCharacterSystem={loadImageOptions:async()=>[]};other.querySelector('.lf-image-choice-retry').click();await flush();assert.match(other.textContent,/No alternative/);missing.close();
});

test('disabling a focused retry or save action never strands focus outside the modal',async()=>{
  let calls=0;const remote=deferred(),save=deferred(),h=harness({loader:()=>++calls===1?Promise.reject(Error('offline')):remote.promise,save:()=>save.promise});
  const picker=h.open();await flush();const retry=picker.querySelector('.lf-image-choice-retry');retry.focus();retry.click();
  assert.equal(h.doc.activeElement,picker.querySelector('.lf-image-choice-close'));
  remote.resolve([]);await flush();const reset=picker.querySelector('.lf-image-choice-secondary');reset.focus();reset.click();
  assert.equal(h.doc.activeElement,picker.querySelector('.lf-image-choice-close'));h.key(picker,'Escape');assert.equal(picker.isConnected,false);save.resolve();await flush();
});

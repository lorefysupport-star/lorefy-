const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('restoration bypasses CSS smooth scrolling without changing the page preference', () => {
  const {createScrollMemory}=require('../modules/lorefy-scroll-memory.js');
  const memory=createScrollMemory(),node={scrollTop:0,isConnected:true};
  memory.enter('home',node);node.scrollTop=640;memory.remember();
  memory.enter('detail',{scrollTop:0});
  let options;
  const returning={scrollTop:0,scrollTo(value){options=value;this.scrollTop=value.top;}};
  memory.enter('home',returning);
  assert.equal(options?.behavior,'instant');assert.equal(returning.scrollTop,640);
});

function fixture() {
  const frames = new Map(), timers = new Map(), observers = [], events = {};
  let serial = 0, label = 'main', active;
  function node(limit = 1200) {
    let value = 0;
    return {isConnected:true, limit, writes:0,
      get scrollTop() { return value; },
      set scrollTop(next) { this.writes++; value = Math.min(this.limit, Math.max(0, next)); },
      contains(target) { return target === this; }};
  }
  active = node();
  const screen = {getAttribute:() => label, querySelector:selector => selector.includes('.lf-screen-scroll') ? active : null};
  const doc = {readyState:'complete', documentElement:{},querySelector:() => screen,
    addEventListener:(type, callback) => events[type] = callback};
  class Observer {
    constructor(callback) { this.callback = callback; this.connected = false; observers.push(this); }
    observe(target) { this.target = target; this.connected = true; }
    disconnect() { this.connected = false; }
  }
  const scope = {document:doc, MutationObserver:Observer, URLSearchParams, location:{search:''},
    addEventListener(){},requestAnimationFrame:fn => { const id=++serial; frames.set(id,fn); return id; },
    cancelAnimationFrame:id => frames.delete(id),setTimeout:fn => {const id=++serial; timers.set(id,fn); return id;},clearTimeout:id => timers.delete(id)};
  scope.window = scope;
  vm.runInNewContext(fs.readFileSync('modules/lorefy-scroll-memory.js','utf8'),scope);
  const api = scope.LorefyScrollMemory;
  function flush() {const current=[...frames.values()]; frames.clear(); current.forEach(fn => fn());}
  flush(); active.scrollTop=640; api.memory.remember();
  function switchTo(nextLabel, next) {label=nextLabel; active=next; api.sync();}
  switchTo('detail',node());
  const returning=node(0); switchTo('main',returning);
  return {scope,api,node,returning,frames,timers,events,observers,flush,switchTo,
    pending:() => observers.findLast(o => o.target === returning && o.connected)};
}

test('late-content mutation bursts request one restoration frame, not synchronous layouts', () => {
  const f=fixture(); f.flush(); const observer=f.pending(),writes=f.returning.writes;
  for(let i=0;i<100;i++) observer.callback([{type:'childList'}]);
  assert.equal(f.returning.writes,writes,'no scroll write during mutation delivery');
  assert.equal(f.frames.size,1,'at most one restoration frame per burst');
  f.returning.limit=1200; f.flush();
  assert.equal(f.returning.scrollTop,640);assert.equal(f.returning.writes,writes+1);
  assert.equal(observer.connected,false);assert.equal(f.timers.size,0);
});

test('touch, wheel and keyboard cancellation release the queued restoration', () => {
  for(const type of ['touchstart','wheel','keydown']){
    const f=fixture(),writes=f.returning.writes;
    f.events[type]({target:f.returning});assert.equal(f.frames.size,0,type+' releases its frame');f.returning.limit=1200; f.flush();
    assert.equal(f.returning.writes,writes,type+' must not fight the reader');
    assert.equal(f.pending(),undefined);assert.equal(f.timers.size,0);
  }
});

test('a callback from an obsolete restoration cannot cancel the newer page job', () => {
  const f=fixture(),stale=[...f.frames.values()][0];
  f.returning.limit=1200;f.returning.scrollTop=640;
  f.switchTo('detail',f.node());
  const latest=f.node(0);f.switchTo('main',latest);
  const newer=f.observers.findLast(o=>o.target===latest&&o.connected);
  stale();assert.equal(newer.connected,true);
  latest.limit=1200;f.flush();assert.equal(latest.scrollTop,640);
});

test('timeout and disconnected-page cleanup cancel pending frames', () => {
  const timed=fixture(),writes=timed.returning.writes;
  [...timed.timers.values()][0]();timed.flush();
  assert.equal(timed.returning.writes,writes);assert.equal(timed.frames.size,0);
  const removed=fixture();removed.returning.isConnected=false;removed.flush();
  assert.equal(removed.pending(),undefined);assert.equal(removed.timers.size,0);
});

test('leaving a still-loading page retains its intended saved position, not a clamped zero', () => {
  const f=fixture();
  f.events.click();
  f.switchTo('detail',f.node());
  assert.equal(f.api.memory.position('main:home'),640);
  const next=f.node(0);f.switchTo('main',next);next.limit=1200;f.flush();
  assert.equal(next.scrollTop,640);
});

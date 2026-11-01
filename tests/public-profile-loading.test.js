const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness(options = {}) {
  const states = [], effects = [], requests = [], follows = [], handlers = new Map();
  const renderedReviews = [];
  let cursor = 0;
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef(initial) { const index=cursor++; if(!(index in states))states[index]={current:initial}; return states[index]; },
    useEffect(callback, deps) {
      const index = cursor++, previous = effects[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[index] = { deps, callback };
      }
    }
  };
  const window = { React, NenIcons: {}, LorefyPageRefresh:{register:(key,fn)=>{handlers.set(key,fn);return()=>{if(handlers.get(key)===fn)handlers.delete(key);};}}, LorefyBackend: {
    mode: 'live',
    getPublicProfile(id) { return new Promise((resolve, reject) => requests.push({ id, resolve, reject })); },
    listReviewCollection: async () => options.rows || [],
    user:{id:'viewer'},
    toggleProfileFollow: options.follow || (async (...args) => {follows.push(args);return args[1];}),
    listProfileFollowers: options.followers || (async()=>[]),
    listProfileFollowing: options.following || (async()=>[])
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../modules/lorefy-public-profile.js'), 'utf8'), { window, URL });
  return {
    requests, follows, handlers, renderedReviews, window,
    unmount(){effects.forEach(effect=>effect?.cleanup?.());},
    render(id = 'reader-a') {
      cursor = 0;
      renderedReviews.length = 0;
      const tree = window.LorefyPublicProfile({ profile: { id, username: id }, workById: options.workById || (() => null),
        renderReview: row => { renderedReviews.push(row); return React.createElement('article', {id:row.id}); } });
      for (const node of nodes(tree)) if (node.props.ref && node.props.className === 'lf-reader-modal') node.props.ref.current = options.dialog || null;
      for (const effect of effects) {
        if (!effect?.callback) continue;
        const callback = effect.callback;
        effect.callback = null;
        effect.cleanup = callback();
      }
      return tree;
    }
  };
}
function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : [tree, ...tree.children.flatMap(nodes)]; }
const followButton = tree => nodes(tree).find(node => node.props['data-follow-action']);
const count = tree => nodes(tree).find(node => node.props['data-connection'] === 'followers').children[0].children[0];
const settle = () => new Promise(resolve => setImmediate(resolve));
async function loaded(options={}){const app=harness(options);app.render();app.requests[0].resolve({id:'reader-a',follower_count:4,is_following:false});await settle();app.render();return app;}
const connectionButton=(tree,kind)=>nodes(tree).find(n=>n.props['data-connection']===kind);
const dialog=tree=>nodes(tree).find(n=>n.props.role==='dialog');
const closeDialog=tree=>nodes(dialog(tree)).find(n=>n.type==='button'&&n.props['aria-label']==='إغلاق').props.onClick();

function modalFixture() {
 const listeners=new Map(),doc={activeElement:null,documentElement:{lang:'en'},querySelector:()=>null},body={};
 const make=(name,inert=false)=>({name,inert,isConnected:true,disabled:false,tabIndex:0,getClientRects:()=>[{}],focus(){doc.activeElement=this;}});
 const opener=make('opener'),close=make('close'),row=make('row'),background=make('profile'),nav=make('nav'),previouslyInert=make('already-inert',true);
 const modal={parentElement:body,querySelector:()=>close,querySelectorAll:()=>[close,row],contains:n=>n===close||n===row,
  addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
 body.children=[background,modal,nav,previouslyInert];doc.body=body;doc.activeElement=opener;
 const key=(key,shiftKey=false)=>{let prevented=false,stopped=false;listeners.get('keydown')?.({key,shiftKey,preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});return{prevented,stopped};};
 return{doc,modal,close,row,opener,background,nav,previouslyInert,listeners,key};
}

test('visitor connection dialog takes focus, isolates background and wraps keyboard navigation',async()=>{
 const f=modalFixture(),app=await loaded({dialog:f.modal});app.window.document=f.doc;
 await connectionButton(app.render(),'followers').props.onClick();app.render();
 assert.equal(f.doc.activeElement,f.close);assert.equal(f.background.inert,true);assert.equal(f.nav.inert,true);
 assert.equal(f.key('Tab',true).prevented,true);assert.equal(f.doc.activeElement,f.row);
 assert.equal(f.key('Tab').prevented,true);assert.equal(f.doc.activeElement,f.close);
});

test('Escape closes visitor connections, restores opener and preserves earlier inert state',async()=>{
 const f=modalFixture(),app=await loaded({dialog:f.modal});app.window.document=f.doc;
 await connectionButton(app.render(),'followers').props.onClick();app.render();
 assert.deepEqual(f.key('Escape'),{prevented:true,stopped:true});assert.equal(dialog(app.render()),undefined);
 assert.equal(f.doc.activeElement,f.opener);assert.equal(f.background.inert,false);assert.equal(f.nav.inert,false);assert.equal(f.previouslyInert.inert,true);assert.equal(f.listeners.size,0);
});

test('connection result does not steal keyboard focus from a reader row',async()=>{
 const f=modalFixture();let release;const app=await loaded({dialog:f.modal,followers:()=>new Promise(r=>release=r)});app.window.document=f.doc;
 const job=connectionButton(app.render(),'followers').props.onClick();app.render();f.row.focus();
 release([]);await job;app.render();assert.equal(f.doc.activeElement,f.row);assert.equal(f.nav.inert,true);
 app.unmount();assert.equal(f.nav.inert,false);assert.equal(f.listeners.size,0);
});

test('visitor library shares keyboard dismissal and never stacks over a connection dialog',async()=>{
 const f=modalFixture(),app=harness({dialog:f.modal,workById:id=>({id,title:'A work'})});app.window.document=f.doc;app.window.LorefyI18n={readingStatusLabel:value=>value};app.render();
 app.requests[0].resolve({id:'reader-a',library_entries:{work:'Read'}});await settle();app.render();
 const tree=app.render(),open=nodes(tree).find(n=>n.props['data-library-view-all']);open.props.onClick();app.render();
 assert.equal(f.doc.activeElement,f.close);
 assert.equal(dialog(app.render()).props['aria-label'],'مكتبة القارئ');
 await connectionButton(app.render(),'following').props.onClick();
 assert.equal(nodes(app.render()).filter(n=>n.props.role==='dialog').length,1);
 assert.equal(dialog(app.render()).props['aria-label'],'يتابع');
});

test('backdrop dismisses only when the backdrop itself is pressed',async()=>{
 const app=await loaded();await connectionButton(app.render(),'followers').props.onClick();
 let modal=dialog(app.render());modal.props.onClick({target:{},currentTarget:{}});assert.ok(dialog(app.render()));
 modal=dialog(app.render());const host={};modal.props.onClick({target:host,currentTarget:host});assert.equal(dialog(app.render()),undefined);
});

test('same-turn follow taps dispatch once and report accessible busy state',async()=>{
 let calls=0,release;const app=await loaded({follow:()=>{calls++;return new Promise(r=>release=r);}});
 const click=followButton(app.render()).props.onClick,one=click(),two=click();
 const busy=followButton(app.render());assert.equal(calls,1);assert.equal(busy.props.disabled,true);assert.equal(busy.props['aria-busy'],true);
 release(true);await Promise.all([one,two]);assert.equal(count(app.render()),5);assert.equal(followButton(app.render()).props['aria-pressed'],true);
});

test('a refused follow never manufactures success or increments the follower count',async()=>{
 const app=await loaded({follow:async()=>false});await followButton(app.render()).props.onClick();assert.equal(count(app.render()),4);assert.equal(followButton(app.render()).props['aria-pressed'],false);assert.ok(nodes(app.render()).some(n=>n.props.role==='alert'));
});

test('a late follow receipt is ignored after visiting another reader and returning',async()=>{
 let release;const app=await loaded({follow:()=>new Promise(r=>release=r)}),events=[];
 app.window.CustomEvent=class{constructor(type,options){this.type=type;this.detail=options.detail;}};app.window.dispatchEvent=e=>events.push(e);
 const job=followButton(app.render()).props.onClick();app.render('reader-b');app.render('reader-a');
 app.requests.at(-1).resolve({id:'reader-a',follower_count:9,is_following:false});await settle();app.render();
 release(true);await job;assert.equal(count(app.render()),9);assert.equal(followButton(app.render()).props['aria-pressed'],false);assert.equal(events.filter(e=>e.type==='lorefy:profile-follow-changed').length,0);assert.equal(followButton(app.render()).props.disabled,false);
});

test('account replacement without a render invalidates pending follow results',async()=>{
 let release;const app=await loaded({follow:()=>new Promise(r=>release=r)}),job=followButton(app.render()).props.onClick();app.window.LorefyBackend.user={id:'next-viewer'};release(true);await job;
 const tree=app.render();assert.notEqual(count(tree),5);
});

test('closing and reopening followers cannot be filled by the previous dialog response',async()=>{
 const pending=[];const app=await loaded({followers:()=>new Promise(r=>pending.push(r))});
 const old=connectionButton(app.render(),'followers').props.onClick();closeDialog(app.render());
 const current=connectionButton(app.render(),'followers').props.onClick();pending[1]([{id:'new',username:'new'}]);await current;
 pending[0]([{id:'old',username:'old'}]);await old;const serialized=JSON.stringify(dialog(app.render()));assert.match(serialized,/@new/);assert.doesNotMatch(serialized,/@old/);
});

test('an old followers failure cannot mark a following dialog failed',async()=>{
 let reject;const app=await loaded({followers:()=>new Promise((_,r)=>reject=r)});
 const old=connectionButton(app.render(),'followers').props.onClick();const next=connectionButton(app.render(),'following').props.onClick();await next;reject(new Error('old request'));await old;
 const modal=dialog(app.render());assert.equal(modal.props['aria-label'],'يتابع');assert.ok(!nodes(modal).some(n=>n.type==='button'&&n.children.includes('إعادة المحاولة')));
});

test('repeated opening while a connection list loads shares the current request',async()=>{
 let calls=0,release;const app=await loaded({followers:()=>{calls++;return new Promise(r=>release=r);}});
 const click=connectionButton(app.render(),'followers').props.onClick,a=click(),b=click();assert.equal(calls,1);release([]);await Promise.all([a,b]);assert.ok(dialog(app.render()));
});

test('unmounted profile cannot broadcast a late follow result',async()=>{
 let release;const events=[],app=await loaded({follow:()=>new Promise(r=>release=r)});app.window.CustomEvent=class{};app.window.dispatchEvent=e=>events.push(e);
 const job=followButton(app.render()).props.onClick();app.unmount();release(true);await job;assert.equal(events.length,0);
});

test('an older pull refresh cannot overwrite a newer confirmed follow',async()=>{
 const app=await loaded(),job=app.handlers.get('profile-visitor')({active:()=>true});await followButton(app.render()).props.onClick();assert.equal(count(app.render()),5);
 app.requests[1].resolve({id:'reader-a',follower_count:4,is_following:false});await job;assert.equal(count(app.render()),5);assert.equal(followButton(app.render()).props['aria-pressed'],true);
});

test('visited profile preserves unrated versus explicit zero at the shared review-card boundary',async()=>{
  const app=harness({rows:[{id:'unrated',user_id:'reader-a',work_id:'work',rating:null,recommend:null,is_public:true},
    {id:'zero',user_id:'reader-a',work_id:'other',rating:0,recommend:false,is_public:true}]});
  app.render();app.requests[0].resolve({id:'reader-a'});await settle();app.render();
  const unrated=app.renderedReviews.find(row=>row.id==='unrated'),zero=app.renderedReviews.find(row=>row.id==='zero');
  assert.equal(unrated.r,null);assert.equal(unrated.recVal,null);
  assert.equal(zero.r,0);assert.equal(zero.recVal,'no');
  assert.equal(zero.is_public,true);
});

test('visited profile passes negative reaction count and current viewer selection to the shared card',async()=>{
  const app=harness({rows:[{id:'reaction',user_id:'reader-a',work_id:'work',rating:2,recommend:false,is_public:true,
    reactions:{heart:9,like:3,dislike:4,mine:{heart:false,like:false,dislike:true}}}]});
  app.render();app.requests[0].resolve({id:'reader-a'});await settle();app.render();
  const row=app.renderedReviews[0];assert.equal(row.dislikeCount,4);assert.equal(row.myDislike,true);
  assert.equal(row.likeCount,3);assert.equal(row.myLike,false);assert.equal(row.likes,9);
  assert.equal(row.r,2);assert.equal(row.recVal,'no');
});

test('a remote reader does not appear unfollowed with zero followers while loading', async () => {
  const app = harness(), tree = app.render();
  assert.equal(tree.props['aria-busy'], true);
  assert.equal(count(tree), '\u2014');
  assert.equal(followButton(tree).props.disabled, true);
  await followButton(tree).props.onClick();
  assert.equal(app.follows.length, 0);
  app.requests[0].resolve({ id:'reader-a', follower_count:4, is_following:true, completed_count:2 });
  await settle();
  const loaded = app.render();
  assert.equal(loaded.props['aria-busy'], false);
  assert.equal(count(loaded), 4);
  assert.equal(followButton(loaded).props.disabled, false);
  assert.equal(followButton(loaded).props['aria-pressed'], true);
});

test('a failed remote profile keeps unknown counts and follow disabled until a successful retry', async () => {
  const app = harness();
  app.render();
  app.requests[0].reject(new Error('offline'));
  await settle();
  const failed = app.render();
  assert.equal(failed.props['aria-busy'], false);
  assert.equal(count(failed), '\u2014');
  assert.equal(followButton(failed).props.disabled, true);
  const alert = nodes(failed).find(node => node.props.role === 'alert');
  nodes(alert).find(node => node.type === 'button').props.onClick();
  app.render();
  assert.equal(app.render().props['aria-busy'], true);
  app.requests[1].resolve({ id:'reader-a', follower_count:0 });
  await settle();
  assert.equal(count(app.render()), 0);
  assert.equal(followButton(app.render()).props.disabled, false);
});

test('switching readers immediately hides old counts and ignores a late response', async () => {
  const app = harness();
  app.render('reader-a');
  const second = app.render('reader-b');
  assert.equal(count(second), '\u2014');
  assert.equal(followButton(second).props.disabled, true);
  app.requests[0].resolve({ id:'reader-a', follower_count:99, is_following:true });
  await settle();
  assert.equal(count(app.render('reader-b')), '\u2014');
  app.requests[1].resolve({ id:'reader-b', follower_count:5, is_following:false });
  await settle();
  assert.equal(count(app.render('reader-b')), 5);
  assert.equal(followButton(app.render('reader-b')).props['aria-pressed'], false);
});

test('pull refresh reloads the visited reader without changing the viewer and ignores cancellation',async()=>{
  const app=harness();app.render();app.requests[0].resolve({id:'reader-a',follower_count:4});await settle();app.render();
  assert.equal(typeof app.handlers.get('profile-visitor'),'function');
  const job=app.handlers.get('profile-visitor')({active:()=>true});
  app.requests[1].resolve({id:'reader-a',follower_count:7});assert.equal(await job,true);assert.equal(count(app.render()),7);
  const cancelled=app.handlers.get('profile-visitor')({active:()=>false});
  assert.equal(await cancelled,false);assert.equal(app.requests.length,2);
});

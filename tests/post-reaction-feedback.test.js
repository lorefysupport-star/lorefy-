const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Node=require('./helpers/render-dom'),source=fs.readFileSync('modules/lorefy-community.js','utf8');
function harness(){
 let resolve,reject,requests=0;const notices=[],post={id:'qa',reactions:{like:10,dislike:3,mine:{like:false,dislike:true}}};
 const button=()=>{const n=new Node('button',{},[new Node('span')]);n.getAttribute=k=>n.attrs[k]??null;return n;};
 const like=button(),dislike=button(),backend={mode:'live',user:{id:'a'},_communityEpoch:1,setCommunityPostReaction(){requests++;return new Promise((yes,no)=>{resolve=yes;reject=no;});}};
 const scope={Intl,doc:{documentElement:{lang:'en'}},uiText:(ar,en)=>en,isDemo:()=>false,global:{LorefyBackend:backend,setTimeout,clearTimeout},toast:v=>notices.push(v)};
 const start=source.indexOf('  var communityNumbers =');vm.runInNewContext(source.slice(start,source.indexOf('  function avatar(',start)),scope);
 const begin=source.indexOf('  function setPostReaction(');vm.runInNewContext(source.slice(begin,source.indexOf('  async function sharePost(',begin)),scope);
 return {post,like,dislike,scope,notices,backend,get requests(){return requests;},send:(kind='like')=>scope.setPostReaction(post,kind,kind==='like'?like:dislike,kind==='like'?dislike:like),resolve:()=>resolve(true),reject:()=>reject(Error('offline'))};
}
const flush=async()=>{for(let n=0;n<10;n++)await Promise.resolve();};
test('post reaction paints immediately and clears its opposite before network completion',async()=>{
 const h=harness();h.send();assert.equal(h.like.attrs['aria-pressed'],'true');assert.equal(h.like.children[0].textContent,'11');
 assert.equal(h.dislike.attrs['aria-pressed'],'false');assert.equal(h.dislike.children[0].textContent,'2');
 assert.equal(h.like.attrs['aria-busy'],'true');assert.equal(h.dislike.attrs['aria-disabled'],'true');
 h.resolve();await flush();assert.equal(h.like.attrs['aria-busy'],'false');assert.equal(h.dislike.attrs['aria-disabled'],'false');
});
test('both reaction controls share a pending lock, not two racing requests',async()=>{
 const h=harness();h.send();h.send('dislike');h.send();assert.equal(h.requests,1);h.resolve();await flush();
});
test('failed post reaction rolls back both counts and explains retry',async()=>{
 const h=harness();h.send();h.reject();await flush();
 assert.equal(h.post.reactions.like,10);assert.equal(h.post.reactions.dislike,3);assert.equal(h.post.reactions.mine.dislike,true);
 assert.equal(h.like.attrs['aria-pressed'],'false');assert.equal(h.dislike.attrs['aria-pressed'],'true');assert.equal(h.notices.length,1);
 assert.match(h.notices[0],/try again/i);h.send();assert.equal(h.requests,2);h.resolve();await flush();
});
for(const failure of [false,true])test('newer realtime state is not double-counted or rolled back on '+(failure?'failure':'success'),async()=>{
 const h=harness();h.send();h.post.reactions={like:16,dislike:4,mine:{like:true,dislike:false}};
 failure?h.reject():h.resolve();await flush();assert.equal(h.post.reactions.like,16);assert.equal(h.like.children[0].textContent,'16');
});
for(const transition of ['account','epoch','backend'])test('obsolete post reaction cannot announce success/failure in another '+transition,async()=>{
 const h=harness();h.send();
 if(transition==='account')h.backend.user={id:'b'};
 if(transition==='epoch')h.backend._communityEpoch++;
 if(transition==='backend')h.scope.global.LorefyBackend={...h.backend};
 h.reject();await flush();assert.deepEqual(h.notices,[]);
});
test('removing a selected reaction is immediate and reversible',async()=>{
 const h=harness();h.send('dislike');assert.equal(h.dislike.attrs['aria-pressed'],'false');assert.equal(h.post.reactions.dislike,2);
 h.reject();await flush();assert.equal(h.dislike.attrs['aria-pressed'],'true');assert.equal(h.post.reactions.dislike,3);
});

test('hanging post reactions release the shared controls and become retryable',async()=>{
 const h=harness();let timeout;
 h.scope.global.setTimeout=(fn,ms)=>{assert.equal(ms,14000);timeout=fn;return 1;};h.scope.global.clearTimeout=()=>{};
 const job=h.send();assert.equal(typeof timeout,'function');timeout();await job;
 assert.equal(h.like.attrs['aria-busy'],'false');assert.equal(h.dislike.attrs['aria-disabled'],'false');
 assert.equal(h.post.reactions.like,10);h.send();assert.equal(h.requests,2);h.resolve();await flush();
});

test('review reaction count is compact visually but exact and localized for assistive users',()=>{
 const growth=fs.readFileSync('modules/lorefy-growth-features.js','utf8'),start=growth.indexOf('  function setCommunityCountLabel(');
 const scope={Intl,uiText:(ar,en)=>en};vm.runInNewContext(growth.slice(start,growth.indexOf('  function paintCommunityDislike(',start)),scope);
 const button=new Node('button',{},[new Node('span')]);button.querySelector=()=>button.children[0];scope.setCommunityCountLabel(button,'إعجاب',12500);
 assert.equal(button.children[0].textContent,'12.5K');assert.match(button.attrs['aria-label'],/Like.*12,500/);
 assert.equal(button.attrs.title,button.attrs['aria-label']);
 let writes=0,text='';const counter={get textContent(){return text;},set textContent(value){text=value;writes++;}};
 const control=new Node('button');control.querySelector=()=>counter;
 Object.assign(scope,{K_COMMUNITY_LIKES:'counts',K_COMMUNITY_MY_LIKES:'mine',read:(key,f)=>key==='counts'?{qa:12500}:f});
 const begin=growth.indexOf('  function paintCommunityLike(');vm.runInNewContext(growth.slice(begin,growth.indexOf('  function wireCommunityLike(',begin)),scope);
 scope.paintCommunityLike(control,'qa');scope.paintCommunityLike(control,'qa');
 assert.equal(counter.textContent,'12.5K');assert.equal(writes,1,'equivalent enhancements must not oscillate between full and compact counts');
});

test('Home review and post actions share five stable, full-width touch tracks',()=>{
 const css=fs.readFileSync('styles/lorefy-home-immersive.css','utf8');
 assert.match(css,/:is\(\.lf-community-action-row,\.lf-community-post-actions\)\s*\{[^}]*display:grid !important[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/s);
 assert.match(css,/:is\(\.lf-community-action-row,\.lf-community-post-actions\) button\s*\{[^}]*min-height:44px[^}]*justify-content:center/s);
});

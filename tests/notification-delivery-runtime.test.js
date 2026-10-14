const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('backend/lorefy-native-runtime.js','utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',P='33333333-3333-4333-8333-333333333333';
function harness(native=false){
 let window,callback,rows=[],user=A;
 class Element {
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.listeners={};this.textContent='';this.className='';}
  appendChild(e){this.children.push(e);e.parent=this;return e;}
  setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k]||null;}
  addEventListener(k,fn){this.listeners[k]=fn;}remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);}
  querySelector(selector){let cls=selector.slice(1);return this.children.find(e=>e.className.split(' ').includes(cls))||null;}
 }
 const body=new Element('body'),head=new Element('head'),bell=new Element('button');
 const doc={body,head,hidden:false,documentElement:{lang:'en'},readyState:'loading',createElement:tag=>new Element(tag),getElementById:()=>null,addEventListener:()=>{},querySelector:s=>s==='.lf-notification-banner'?body.querySelector(s):null,querySelectorAll:s=>s.includes('Notifications')?[bell]:[]};
 const values=new Map(),intervals=[],timers=[];
 window={document:null,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},crypto:{randomUUID:()=>P},location:{href:'http://localhost/index.html',search:'',assign:()=>{}},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval:()=>{},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail;}},dispatchEvent:()=>{},Capacitor:{isNativePlatform:()=>native,Plugins:{}},LorefyBackend:{getSession:async()=>user?{userId:user}:null,listNotifications:async()=>rows,subscribeNotifications:async fn=>{callback=fn;return ()=>{};},registerPushDevice:async()=>true,unregisterPushDevice:async()=>true}};
 vm.runInNewContext(source,{window,URL,URLSearchParams,Set,Date,CustomEvent:window.CustomEvent,MutationObserver:class{observe(){}}});window.document=doc;
 return {window,doc,body,bell,values,intervals,api:window.LorefyNativeRuntime,setRows:r=>rows=r,setUser:u=>user=u,receive:item=>callback(item)};
}
const notification=(id='n1')=>({id,user_id:A,actor_id:B,kind:'reaction',title:'إعجاب جديد',body:'نورة أعجبت بمنشورك',target_path:'/community',data:{postId:P},created_at:new Date().toISOString()});
test('in-app like/comment banners name the actor, deduplicate, and update the English bell',async()=>{
 const h=harness();await h.api.connectCloudNotifications();h.receive(notification());
 let banner=h.body.querySelector('.lf-notification-banner');assert.ok(banner);assert.equal(banner.children[0].children[1].textContent,'نورة أعجبت بمنشورك');
 assert.equal(h.bell.children[0].textContent,'1');h.receive(notification());assert.equal(h.body.children.length,1);
 h.receive({...notification('n2'),kind:'comment',body:'فهد رد على منشورك'});banner=h.body.querySelector('.lf-notification-banner');assert.equal(banner.children[0].children[1].textContent,'فهد رد على منشورك');
 assert.equal(h.bell.children[0].textContent,'2');
});
test('notifications do not display self events or another account and clear immediately on logout',async()=>{
 const h=harness();await h.api.connectCloudNotifications();h.receive({...notification(),actor_id:A});assert.equal(h.body.children.length,0);
 h.receive({...notification(),user_id:B});assert.equal(h.body.children.length,0);
 h.receive(notification());h.setUser(null);await h.api.connectCloudNotifications();assert.equal(h.body.children.length,0);assert.equal(h.bell.children.length,0);
});
test('late inbox responses cannot restore the previous account after a switch',async()=>{
 const h=harness();await h.api.connectCloudNotifications();let resolve;
 h.window.LorefyBackend.listNotifications=()=>new Promise(r=>resolve=r);const stale=h.api.refreshCloudNotifications();
 h.setUser(B);h.window.LorefyBackend.listNotifications=async()=>[];await h.api.connectCloudNotifications();resolve([notification()]);await stale;
 assert.equal(h.bell.children.length,0);assert.equal(h.body.children.length,0);
});
test('realtime inserts during inbox fetch survive the initial snapshot',async()=>{
 const h=harness();let resolve;h.window.LorefyBackend.listNotifications=()=>new Promise(r=>resolve=r);
 const connect=h.api.connectCloudNotifications();await new Promise(r=>setImmediate(r));h.receive(notification());resolve([]);await connect;
 assert.equal(h.bell.children[0].textContent,'1');
});
test('temporary inbox failure preserves unread notifications',async()=>{
 const h=harness();h.setRows([notification()]);await h.api.connectCloudNotifications();h.window.LorefyBackend.listNotifications=async()=>{throw Error('offline');};await h.api.refreshCloudNotifications();assert.equal(h.bell.children[0].textContent,'1');
});
test('push payload and inbox routes open the exact post and reject foreign links',()=>{
 const h=harness(),route=h.api.notificationRoute(notification());assert.equal(route.route,'community');assert.equal(route.post,P);
 const push=h.api.notificationRoute({data:{targetPath:'/community',data:{postId:P}}});assert.equal(push.post,P);
 assert.equal(h.api.notificationRoute({data:{targetPath:'https://evil.example/community',data:{postId:P}}}),null);
 assert.equal(h.api.parseAppLink('/community?post='+P).post,P);
});
test('disabling notifications unregisters natively even when server cleanup fails',async()=>{
 const h=harness(true);let unregistered=0;h.window.Capacitor.Plugins.PushNotifications={unregister:async()=>unregistered++};h.window.LorefyBackend.unregisterPushDevice=async()=>{throw Error('offline');};
 await assert.rejects(h.api.setPushEnabled(false),/offline/);assert.equal(unregistered,1);assert.equal(h.values.get('lorefy.native.push.enabled.v1'),'false');
});
test('permission denied never registers, and opt-in enables before the native registration event',async()=>{
 const h=harness(true);let registered=0;
 h.window.Capacitor.Plugins.PushNotifications={checkPermissions:async()=>({receive:'denied'}),register:async()=>registered++};assert.equal(await h.api.setPushEnabled(true),false);assert.equal(registered,0);
 h.window.Capacitor.Plugins.PushNotifications.checkPermissions=async()=>({receive:'granted'});
 h.window.Capacitor.Plugins.PushNotifications.register=async()=>{assert.equal(h.values.get('lorefy.native.push.enabled.v1'),'true');registered++;};
 assert.equal(await h.api.setPushEnabled(true),true);assert.equal(registered,1);
});

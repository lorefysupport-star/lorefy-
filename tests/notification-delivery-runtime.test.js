const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('backend/lorefy-native-runtime.js','utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',P='33333333-3333-4333-8333-333333333333';
function harness(native=false,values=new Map()){
 let window,callback,statusCallback,rows=[],user=A,page=null,mutated;
 const listeners={},globalListeners={},appListeners={};
 class Element {
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.listeners={};this.textContent='';this.className='';}
  appendChild(e){this.children.push(e);e.parent=this;return e;}
  prepend(e){this.children.unshift(e);e.parent=this;}
  closest(selector){return selector==='button'&&this.tagName==='BUTTON'?this:null;}
  setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k]||null;}
  addEventListener(k,fn){this.listeners[k]=fn;}remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);}
  querySelector(selector){let cls=selector.slice(1);return this.children.find(e=>e.className.split(' ').includes(cls))||null;}
 }
 const body=new Element('body'),head=new Element('head'),bell=new Element('button');
 const doc={body,head,hidden:false,documentElement:{lang:'en'},readyState:'loading',createElement:tag=>new Element(tag),getElementById:()=>null,addEventListener:(name,fn)=>listeners[name]=fn,querySelector:s=>s==='.lf-notification-banner'?body.querySelector(s):s==='.lf-notifications-page'?page:null,querySelectorAll:s=>s.includes('Notifications')?[bell]:[]};
 const intervals=[],timers=[];
 window={document:null,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},crypto:{randomUUID:()=>P},location:{href:'http://localhost/index.html',search:'',assign:()=>{}},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval:()=>{},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail;}},dispatchEvent:()=>{},addEventListener:(name,fn)=>globalListeners[name]=fn,Capacitor:{isNativePlatform:()=>native,Plugins:{App:{addListener:(name,fn)=>appListeners[name]=fn}}},LorefyBackend:{getSession:async()=>user?{userId:user}:null,listNotifications:async()=>rows,subscribeNotifications:async(fn,state)=>{callback=fn;statusCallback=state;return ()=>{};},registerPushDevice:async()=>true,unregisterPushDevice:async()=>true}};
 vm.runInNewContext(source,{window,URL,URLSearchParams,Set,Date,CustomEvent:window.CustomEvent,MutationObserver:class{constructor(fn){mutated=fn;}observe(){}}});window.document=doc;
 return {window,doc,body,bell,values,intervals,listeners,globalListeners,appListeners,api:window.LorefyNativeRuntime,setRows:r=>rows=r,setUser:u=>user=u,receive:(item,change)=>callback(item,change),status:state=>statusCallback?.(state),getStatus:()=>statusCallback,
   mountInbox(){page=new Element('div');page.className='lf-notifications-page';const empty=new Element('p');empty.textContent='No notifications';page.appendChild(empty);mutated?.();return page;},
   unmountInbox(){page=null;}
 };
}
const notification=(id='n1')=>({id,user_id:A,actor_id:B,kind:'reaction',title:'إعجاب جديد',body:'نورة أعجبت بمنشورك',target_path:'/community',data:{postId:P},created_at:new Date().toISOString()});

test('opening and reopening the bell fetches and mounts the remote inbox after React navigation',async()=>{
 const h=harness();h.api.start();h.listeners.DOMContentLoaded();
 await h.api.connectCloudNotifications();
 h.bell.setAttribute('aria-label','Notifications');
 h.setRows([notification()]);h.listeners.click({target:h.bell});
 let page=h.mountInbox();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(page.querySelector('.lf-cloud-notifications').children.length,1);
 assert.equal(page.children.find(node=>node.tagName==='P').getAttribute('data-lf-core-empty'),'hidden');
 h.unmountInbox();h.setRows([notification(),notification('n2')]);
 h.listeners.click({target:h.bell});page=h.mountInbox();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(page.querySelector('.lf-cloud-notifications').children.length,2);
 h.unmountInbox();h.setRows([]);h.listeners.click({target:h.bell});page=h.mountInbox();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(page.querySelector('.lf-cloud-notifications'),null);
 assert.equal(page.children.find(node=>node.tagName==='P').getAttribute('data-lf-core-empty'),null);
});
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
 h.window.LorefyBackend.listNotifications=()=>new Promise(r=>resolve=r);const stale=h.api.refreshCloudNotifications();await new Promise(r=>setImmediate(r));
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

test('the inbox survives a restart offline without requiring push permission',async()=>{
 const first=harness();first.values.set('lorefy.native.push.enabled.v1','false');first.setRows([notification()]);await first.api.connectCloudNotifications();
 const reopened=harness(false,first.values);reopened.window.LorefyBackend.listNotifications=async()=>{throw Error('offline');};
 await reopened.api.connectCloudNotifications();const rows=await reopened.api.refreshCloudNotifications();
 assert.equal(rows.length,1);assert.equal(rows[0].id,'n1');assert.equal(reopened.bell.children[0].textContent,'1');
});

test('cached inbox is owner-scoped across account changes and logout',async()=>{
 const first=harness();first.setRows([notification()]);await first.api.connectCloudNotifications();
 const other=harness(false,first.values);other.setUser(B);other.window.LorefyBackend.listNotifications=async()=>{throw Error('offline');};
 await other.api.connectCloudNotifications();assert.equal((await other.api.refreshCloudNotifications()).length,0);
 first.setUser(null);await first.api.connectCloudNotifications();assert.equal(first.bell.children.length,0);
});

test('read notifications remain in offline history and failed read receipts retry',async()=>{
 const first=harness();first.setRows([notification()]);let calls=0;
 first.api.start();first.listeners.DOMContentLoaded();
 first.window.LorefyBackend.markNotificationsRead=async()=>{calls++;throw Error('offline');};
 await first.api.connectCloudNotifications();const page=first.mountInbox();
 page.querySelector('.lf-cloud-notifications').children[0].listeners.click();await new Promise(r=>setImmediate(r));
 const reopened=harness(false,first.values);reopened.setRows([notification()]);
 reopened.window.LorefyBackend.markNotificationsRead=async ids=>{calls++;assert.deepEqual(Array.from(ids),['n1']);return 1;};
 await reopened.api.connectCloudNotifications();const rows=await reopened.api.refreshCloudNotifications();
 assert.equal(rows.length,1);assert.ok(rows[0].read_at);assert.equal(reopened.bell.children.length,0);assert.ok(calls>=2);
});

test('unchanged inbox refresh does not replace focused notification rows',async()=>{
 const h=harness();h.api.start();h.listeners.DOMContentLoaded();h.setRows([notification()]);await h.api.connectCloudNotifications();const page=h.mountInbox();
 const section=page.querySelector('.lf-cloud-notifications'),button=section.children[0];
 await h.api.refreshCloudNotifications();assert.equal(page.querySelector('.lf-cloud-notifications').children[0],button);
});

test('opening an empty inbox offline shows retry rather than a misleading empty success',async()=>{
 const h=harness();h.api.start();h.listeners.DOMContentLoaded();
 h.window.LorefyBackend.listNotifications=async()=>{throw Error('offline');};
 await h.api.connectCloudNotifications();const page=h.mountInbox();
 const status=page.querySelector('.lf-inbox-status');
 assert.ok(status);assert.equal(status.children[0].textContent,'Could not load notifications.');
 assert.equal(status.children[1].hidden,false);
 assert.equal(page.children.find(node=>node.tagName==='P').getAttribute('data-lf-core-empty'),'hidden');
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

test('disabling push while permission checking is pending cannot be undone by its late grant',async()=>{
 const h=harness(true);let resolvePermission,registered=0;
 h.window.Capacitor.Plugins.PushNotifications={checkPermissions:()=>new Promise(r=>resolvePermission=r),register:async()=>registered++,unregister:async()=>{}};
 const enable=h.api.setPushEnabled(true);await new Promise(r=>setImmediate(r));
 await h.api.setPushEnabled(false);resolvePermission({receive:'granted'});
 assert.equal(await enable,false);assert.equal(registered,0);
 assert.equal(h.values.get('lorefy.native.push.enabled.v1'),'false');
});

test('disabling push while the native prompt is open prevents registration after accepting it',async()=>{
 const h=harness(true);let resolvePrompt,registered=0;
 h.window.Capacitor.Plugins.PushNotifications={checkPermissions:async()=>({receive:'prompt'}),requestPermissions:()=>new Promise(r=>resolvePrompt=r),register:async()=>registered++,unregister:async()=>{}};
 const enable=h.api.setPushEnabled(true);await new Promise(r=>setImmediate(r));
 await h.api.setPushEnabled(false);resolvePrompt({receive:'granted'});
 assert.equal(await enable,false);assert.equal(registered,0);
 assert.equal(h.values.get('lorefy.native.push.enabled.v1'),'false');
});

test('a new explicit opt-in is independent of an old cancelled permission check',async()=>{
 const h=harness(true);let resolveOld,checks=0,registered=0;
 h.window.Capacitor.Plugins.PushNotifications={checkPermissions:()=>++checks===1?new Promise(r=>resolveOld=r):Promise.resolve({receive:'granted'}),register:async()=>registered++,unregister:async()=>{}};
 const old=h.api.setPushEnabled(true);await new Promise(r=>setImmediate(r));
 await h.api.setPushEnabled(false);const current=h.api.setPushEnabled(true);
 await new Promise(r=>setImmediate(r));resolveOld({receive:'denied'});
 assert.equal(await old,false);assert.equal(await current,true);
 assert.equal(registered,1);assert.equal(h.values.get('lorefy.native.push.enabled.v1'),'true');
});

test('simultaneous opt-ins share one current permission and registration attempt',async()=>{
 const h=harness(true);let checks=0,registered=0,resolvePermission;
 h.window.Capacitor.Plugins.PushNotifications={checkPermissions:()=>{checks++;return new Promise(r=>resolvePermission=r);},register:async()=>registered++};
 const a=h.api.setPushEnabled(true),b=h.api.setPushEnabled(true);resolvePermission({receive:'granted'});
 assert.equal(await a,true);assert.equal(await b,true);assert.equal(checks,1);assert.equal(registered,1);
});

test('a late native registration failure cannot disable a newer successful opt-in',async()=>{
 const h=harness(true);let rejectOld,registrations=0;
 h.window.Capacitor.Plugins.PushNotifications={checkPermissions:async()=>({receive:'granted'}),register:()=>++registrations===1?new Promise((r,j)=>rejectOld=j):Promise.resolve(),unregister:async()=>{}};
 const old=h.api.setPushEnabled(true).catch(e=>e);await new Promise(r=>setImmediate(r));
 await h.api.setPushEnabled(false);assert.equal(await h.api.setPushEnabled(true),true);
 rejectOld(Error('old registration failed'));assert.match((await old).message,/old registration failed/);
 assert.equal(h.values.get('lorefy.native.push.enabled.v1'),'true');
});

test('a registration completing after opt-out is unregistered again without enabling push',async()=>{
 const h=harness(true);let resolveRegistration,unregistered=0;
 h.window.Capacitor.Plugins.PushNotifications={checkPermissions:async()=>({receive:'granted'}),register:()=>new Promise(r=>resolveRegistration=r),unregister:async()=>unregistered++};
 const old=h.api.setPushEnabled(true);await new Promise(r=>setImmediate(r));
 await h.api.setPushEnabled(false);assert.equal(unregistered,1);resolveRegistration();
 assert.equal(await old,false);assert.equal(unregistered,2);
 assert.equal(h.values.get('lorefy.native.push.enabled.v1'),'false');
});

test('late opt-out cleanup does not unregister the newer native opt-in',async()=>{
 const h=harness(true);let resolveCleanup,unregistered=0;
 h.window.LorefyBackend.unregisterPushDevice=()=>new Promise(r=>resolveCleanup=r);
 h.window.Capacitor.Plugins.PushNotifications={checkPermissions:async()=>({receive:'granted'}),register:async()=>{},unregister:async()=>unregistered++};
 const off=h.api.setPushEnabled(false);assert.equal(await h.api.setPushEnabled(true),true);
 resolveCleanup(true);assert.equal(await off,false);assert.equal(unregistered,0);
 assert.equal(h.values.get('lorefy.native.push.enabled.v1'),'true');
});

const settle=()=>new Promise(r=>setImmediate(r));

test('parallel inbox refreshes share one request instead of invalidating each other',async()=>{
 const h=harness();await h.api.connectCloudNotifications();let resolve,calls=0;
 h.window.LorefyBackend.listNotifications=()=>{calls++;return new Promise(r=>resolve=r);};
 const jobs=Array.from({length:10},()=>h.api.refreshCloudNotifications());await settle();
 assert.equal(calls,1);resolve([notification()]);
 const results=await Promise.all(jobs);assert.ok(results.every(rows=>rows.length===1));
});

test('realtime reconnect catches missed notifications without waiting for the poll interval',async()=>{
 const h=harness();await h.api.connectCloudNotifications();h.setRows([notification()]);
 h.status('SUBSCRIBED');await settle();
 assert.equal(h.bell.children[0]?.textContent,'1');
 assert.equal(h.body.querySelector('.lf-notification-banner')?.children[0].children[1].textContent,notification().body);
});

test('reconnect during an existing fetch schedules one non-overlapping catch-up fetch',async()=>{
 const h=harness();await h.api.connectCloudNotifications();let resolve,calls=0,inFlight=0,peak=0;
 h.window.LorefyBackend.listNotifications=async()=>{
  calls++;inFlight++;peak=Math.max(peak,inFlight);
  const result=calls===1?await new Promise(r=>resolve=r):[notification()];inFlight--;return result;
 };
 const pending=h.api.refreshCloudNotifications();await settle();
 h.status('SUBSCRIBED');h.status('SUBSCRIBED');await settle();
 assert.equal(calls,1);resolve([]);await pending;await settle();
 assert.equal(calls,2);assert.equal(peak,1);assert.equal(h.bell.children[0]?.textContent,'1');
});

test('a read update from another device clears the badge but keeps history without a toast',async()=>{
 const h=harness();h.api.start();h.listeners.DOMContentLoaded();h.setRows([notification()]);await h.api.connectCloudNotifications();
 const page=h.mountInbox();
 h.receive({...notification(),read_at:'2026-10-30T01:00:00Z'},{event:'UPDATE'});
 assert.equal(h.bell.children.length,0);
 assert.equal(page.querySelector('.lf-cloud-notifications').children.length,1);
 assert.equal(h.body.querySelector('.lf-notification-banner'),null);
});

test('a stale unread snapshot or duplicate insert cannot undo a realtime read update',async()=>{
 const h=harness();h.setRows([notification()]);await h.api.connectCloudNotifications();let resolve;
 h.window.LorefyBackend.listNotifications=()=>new Promise(r=>resolve=r);
 const pending=h.api.refreshCloudNotifications();await settle();
 h.receive({...notification(),read_at:'2026-10-30T01:00:00Z'},{event:'UPDATE'});
 resolve([notification()]);const rows=await pending;
 assert.ok(rows[0].read_at);
 h.receive(notification());assert.equal(h.bell.children.length,0);
 assert.equal(h.body.querySelector('.lf-notification-banner'),null);
});

test('a stale subscription status cannot fetch or announce for the next account',async()=>{
 const h=harness();await h.api.connectCloudNotifications();const old=h.getStatus();
 assert.equal(typeof old,'function');
 h.setUser(B);await h.api.connectCloudNotifications();let calls=0;
 h.window.LorefyBackend.listNotifications=async()=>{calls++;return [];};
 old('SUBSCRIBED');await settle();assert.equal(calls,0);assert.equal(h.bell.children.length,0);
});

test('returning online refreshes the authenticated inbox immediately',async()=>{
 const h=harness();h.api.start();h.listeners.DOMContentLoaded();await h.api.connectCloudNotifications();h.setRows([notification()]);
 assert.equal(typeof h.globalListeners.online,'function');h.globalListeners.online();await settle();
 assert.equal(h.bell.children[0]?.textContent,'1');
});

test('native resume refreshes even when no push plugin or permission is available',async()=>{
 const h=harness(true);h.api.start();h.listeners.DOMContentLoaded();await h.api.connectCloudNotifications();h.setRows([notification()]);
 assert.equal(typeof h.appListeners.appStateChange,'function');
 h.appListeners.appStateChange({isActive:false});await settle();assert.equal(h.bell.children.length,0);
 h.appListeners.appStateChange({isActive:true});await settle();assert.equal(h.bell.children[0]?.textContent,'1');
});

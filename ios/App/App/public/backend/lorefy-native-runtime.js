(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.LorefyNativeRuntime = api;
    if (root.document) api.start();
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var INSTALLATION_KEY = "lorefy.native.installation.v1";
  var PUSH_ENABLED_KEY = "lorefy.native.push.enabled.v1";
  var ALLOWED_WEB_HOSTS = ["lorefy.app", "www.lorefy.app"];
  var ALLOWED_SCHEMES = ["com.lorefy.app:", "lorefy:"];
  var cloudNotifications = [];
  var cloudUnsubscribe = null;
  var started = false;
  var pushRegistration = null;
  var pushPreferenceEpoch = 0;
  var pendingToken = '';
  var connectionEpoch = 0, refreshEpoch = 0, activeAccount = '';
  var refreshJob = null;
  var shownNotifications = new Set(), bannerTimer = null;
  var INBOX_CACHE_PREFIX='lorefy.notifications.inbox.v1:';
  var pendingReads=new Set(),readJob=null,inboxState='ready';

  function inboxKey(owner) { return INBOX_CACHE_PREFIX+encodeURIComponent(owner); }
  function cleanInbox(rows,owner) {
    var seen=new Set();
    return (Array.isArray(rows)?rows:[]).filter(function(row){
      return row && typeof row.id==='string' && row.id.length>0 && row.id.length<=120 && !seen.has(row.id) &&
        row.actor_id!==owner && (!row.user_id || row.user_id===owner) && seen.add(row.id);
    }).slice(0,60).map(function(row){return {
      id:row.id,user_id:owner,actor_id:String(row.actor_id||''),kind:String(row.kind||'').slice(0,40),
      title:String(row.title||'').slice(0,120),body:String(row.body||'').slice(0,500),
      target_path:String(row.target_path||'').slice(0,500),data:{postId:row.data&&row.data.postId},
      read_at:row.read_at?String(row.read_at).slice(0,40):null,created_at:String(row.created_at||'').slice(0,40)
    };});
  }
  function saveInbox() {
    if(!activeAccount)return;
    try{root.localStorage.setItem(inboxKey(activeAccount),JSON.stringify({ownerId:activeAccount,rows:cleanInbox(cloudNotifications,activeAccount),pendingReads:Array.from(pendingReads).slice(0,200)}));}catch(_){}
  }
  function restoreInbox(owner) {
    try{
      var record=JSON.parse(root.localStorage.getItem(inboxKey(owner))||'null');
      if(!record || record.ownerId!==owner)return;
      cloudNotifications=cleanInbox(record.rows,owner);
      pendingReads=new Set((Array.isArray(record.pendingReads)?record.pendingReads:[]).filter(function(id){return typeof id==='string'&&id.length<=120;}).slice(0,200));
    }catch(_){}
  }
  async function flushReadReceipts() {
    var backend=root.LorefyBackend,epoch=connectionEpoch,owner=activeAccount;
    if(!owner || !pendingReads.size || !backend || !backend.markNotificationsRead)return;
    if(readJob && readJob.epoch===epoch)return readJob.promise;
    var ids=Array.from(pendingReads),job={epoch:epoch,promise:null};readJob=job;
    job.promise=Promise.resolve().then(function(){
      if(epoch!==connectionEpoch || owner!==activeAccount || backend!==root.LorefyBackend)return false;
      return backend.markNotificationsRead(ids);
    }).then(function(result){
      if(epoch!==connectionEpoch || owner!==activeAccount || backend!==root.LorefyBackend || result===false)return;
      ids.forEach(function(id){pendingReads.delete(id);});saveInbox();
    }).catch(function(){ /* Retry these receipts on the next authenticated refresh. */ }).finally(function(){if(readJob===job)readJob=null;});
    return job.promise;
  }
  function markInboxRead(ids) {
    var selected=ids?new Set(ids):new Set(cloudNotifications.map(function(item){return item.id;})),now=new Date().toISOString();
    cloudNotifications.forEach(function(item){if(selected.has(item.id)){item.read_at=item.read_at||now;pendingReads.add(item.id);}});
    saveInbox();renderCloudNotifications();flushReadReceipts();
  }

  function parseAppLink(rawUrl) {
    var raw = String(rawUrl || "").trim();
    if (!raw || /(?:^|[\\/])\.{1,2}(?:[\\/]|$)|%2e/i.test(raw)) return null;
    var parsed;
    var isInternalPath = raw.charAt(0) === "/" && raw.charAt(1) !== "/";
    try { parsed = new URL(raw, isInternalPath ? "https://lorefy.app" : undefined); } catch (error) { return null; }

    var protocol = parsed.protocol.toLowerCase();
    var path = parsed.pathname || "/";
    if (protocol === "https:") {
      if (ALLOWED_WEB_HOSTS.indexOf(parsed.hostname.toLowerCase()) === -1) return null;
    } else if (ALLOWED_SCHEMES.indexOf(protocol) !== -1) {
      path = "/" + [parsed.hostname, parsed.pathname].filter(Boolean).join("/").replace(/^\/+/, "");
    } else {
      return null;
    }

    path = path.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
    if (path === "/auth/callback") return null;

    var workMatch = path.match(/^\/work\/([A-Za-z0-9._:-]{1,200})$/);
    if (workMatch) return { route:"detail", novel:workMatch[1] };
    var reviewMatch = path.match(/^\/review\/([0-9a-f]{8}-[0-9a-f-]{27})$/i);
    if (reviewMatch) return { route:"community", review:reviewMatch[1].toLowerCase() };
    var profileMatch = path.match(/^\/profile\/([a-z0-9_]{3,24})$/i);
    if (profileMatch) return { route:"explore", search:"@" + profileMatch[1].toLowerCase() };
    if (path === "/search") {
      var query = String(parsed.searchParams.get("q") || "").trim().slice(0, 100);
      return query ? { route:"explore", search:query } : { route:"explore" };
    }
    if (path === "/notifications") return { route:"profile", notifications:"1" };
    if (path === "/community") {
      var post = parsed.searchParams.get("post");
      return validId(post) ? {route:"community",post:post} : {route:"community"};
    }
    if (path === "/library") return { route:"library" };
    if (path === "/profile") return { route:"profile" };
    if (path === "/home" || path === "/") return { route:"home" };
    return null;
  }

  function openRoute(target) {
    var route = typeof target === "string" ? parseAppLink(target) : target;
    if (!route || !root.location) return false;
    var url = new URL(root.location.href);
    ["route", "novel", "id", "search", "review", "post", "notifications"].forEach(function (key) {
      url.searchParams.delete(key);
    });
    Object.keys(route).forEach(function (key) {
      if (route[key] != null && route[key] !== "") url.searchParams.set(key, route[key]);
    });
    root.location.assign(url.pathname + "?" + url.searchParams.toString());
    return true;
  }

  function installationId() {
    var current = "";
    try { current = root.localStorage.getItem(INSTALLATION_KEY) || ""; } catch (error) {}
    if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(current)) return current;
    current = root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() :
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (char) {
        var value = Math.random() * 16 | 0;
        return (char === "x" ? value : (value & 3 | 8)).toString(16);
      });
    try { root.localStorage.setItem(INSTALLATION_KEY, current); } catch (error) {}
    return current;
  }

  function isNative() {
    return !!(root.Capacitor && root.Capacitor.isNativePlatform && root.Capacitor.isNativePlatform());
  }

  function pushPlugin() {
    return root.Capacitor && root.Capacitor.Plugins && root.Capacitor.Plugins.PushNotifications;
  }

  async function registerToken(token) {
    var backend = root.LorefyBackend;
    if (!backend || typeof backend.registerPushDevice !== "function") return false;
    return backend.registerPushDevice({
      installationId:installationId(),
      token:String(token || ""),
      platform:"ios",
      environment:String(root.LOREFY_PUSH_ENVIRONMENT || "production"),
      locale:(root.document && root.document.documentElement.lang) || "ar",
      appVersion:String(root.LOREFY_BUILD_NUMBER || "13")
    });
  }

  async function requestPermissionAndRegister() {
    if (pushRegistration && pushRegistration.epoch === pushPreferenceEpoch) return pushRegistration.promise;
    var job = { epoch:++pushPreferenceEpoch, promise:null };
    pushRegistration = job;
    job.promise = registerWithPermission(job.epoch);
    try { return await job.promise; }
    finally { if (pushRegistration === job) pushRegistration = null; }
  }

  async function registerWithPermission(epoch) {
    var push = pushPlugin();
    if (!isNative() || !push) return false;
    var permission = await push.checkPermissions();
    if (epoch !== pushPreferenceEpoch) return false;
    if (!permission || permission.receive === "prompt") permission = await push.requestPermissions();
    if (epoch !== pushPreferenceEpoch) return false;
    if (!permission || permission.receive !== "granted") {
      try { root.localStorage.setItem(PUSH_ENABLED_KEY, "false"); } catch (error) {}
      return false;
    }
    try { root.localStorage.setItem(PUSH_ENABLED_KEY, 'true'); } catch (error) {}
    try { await push.register(); }
    catch(error) { if (epoch === pushPreferenceEpoch) root.localStorage.setItem(PUSH_ENABLED_KEY,'false'); throw error; }
    if (epoch !== pushPreferenceEpoch) {
      if (root.localStorage.getItem(PUSH_ENABLED_KEY) === 'false' && push.unregister) await push.unregister();
      return false;
    }
    return true;
  }

  async function setPushEnabled(enabled) {
    enabled = enabled === true;
    if (enabled) return requestPermissionAndRegister();
    var epoch = ++pushPreferenceEpoch;
    try { root.localStorage.setItem(PUSH_ENABLED_KEY, 'false'); } catch (error) {}
    var backend = root.LorefyBackend;
    try {
      if (backend && typeof backend.unregisterPushDevice === "function") await backend.unregisterPushDevice(installationId());
    } finally {
      var push = pushPlugin();
      if (epoch === pushPreferenceEpoch && isNative() && push && push.unregister) await push.unregister();
    }
    return false;
  }

  function validId(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '')); }

  function notificationRoute(notification) {
    var outer = notification && notification.data || {};
    var data = outer.data || outer;
    var path = notification && notification.target_path || outer.targetPath || outer.target_path || outer.url || outer.link || '';
    var route = parseAppLink(path);
    if (route && route.route === 'community' && validId(data.postId)) route.post = data.postId;
    return route;
  }

  function notificationTarget(notification) {
    var data = notification && notification.data || {};
    return data.targetPath || data.target_path || data.url || data.link || "";
  }

  function setupNativeListeners() {
    if (!isNative()) return;
    var plugins = root.Capacitor && root.Capacitor.Plugins;
    var App = plugins && plugins.App;
    var Push = plugins && plugins.PushNotifications;
    if (App) {
      App.addListener("appStateChange", function (event) {
        if (event && event.isActive) refreshCloudNotifications(true, true);
      });
      App.addListener("appUrlOpen", function (event) {
        var route = parseAppLink(event && event.url);
        if (route) openRoute(route);
      });
      if (App.getLaunchUrl) App.getLaunchUrl().then(function (event) {
        var route = parseAppLink(event && event.url);
        if (route) openRoute(route);
      }).catch(function () {});
    }
    if (!Push) return;
    Push.addListener("registration", function (token) {
      pendingToken = String(token && token.value || '');
      if (root.localStorage.getItem(PUSH_ENABLED_KEY) === 'false') return;
      registerToken(pendingToken).then(function (saved) { /* Retain the token for rebinding after an account change. */ }).catch(function () {
        root.dispatchEvent(new CustomEvent("lorefy:native-notification-error", { detail:{ code:"registration_failed" } }));
      });
    });
    Push.addListener("registrationError", function () {
      root.dispatchEvent(new CustomEvent("lorefy:native-notification-error", { detail:{ code:"native_registration_failed" } }));
    });
    Push.addListener("pushNotificationReceived", function (notification) {
      // Fetch the authenticated inbox rather than displaying an unscoped push payload.
      refreshCloudNotifications(true);
    });
    Push.addListener("pushNotificationActionPerformed", function (action) {
      var route = notificationRoute(action && action.notification);
      if (route) openRoute(route);
    });
    try {
      if (root.localStorage.getItem(PUSH_ENABLED_KEY) === "true") requestPermissionAndRegister().catch(function () {});
    } catch (error) {}
  }

  function formatNotificationTime(value) {
    var time = new Date(value).getTime();
    var minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    var en = root.document && root.document.documentElement.lang === 'en';
    if (!Number.isFinite(time) || minutes < 1) return en ? 'Now' : 'الآن';
    if (minutes < 60) return en ? minutes + 'm ago' : 'منذ ' + minutes + ' د';
    if (minutes < 1440) return en ? Math.floor(minutes / 60) + 'h ago' : 'منذ ' + Math.floor(minutes / 60) + ' س';
    return en ? Math.floor(minutes / 1440) + 'd ago' : 'منذ ' + Math.floor(minutes / 1440) + ' ي';
  }

  function injectStyles() {
    if (!root.document || root.document.getElementById("lf-native-runtime-styles")) return;
    var style = root.document.createElement("style");
    style.id = "lf-native-runtime-styles";
    style.textContent = ".lf-cloud-notifications{direction:rtl}.lf-cloud-notification{position:relative;display:flex;width:100%;gap:10px;padding:13px 18px;border:0;border-bottom:1px solid rgba(128,128,128,.16);background:transparent;color:inherit;text-align:right;font-family:inherit;cursor:pointer}.lf-cloud-notifications[dir=ltr]{direction:ltr}.lf-cloud-notifications[dir=ltr] .lf-cloud-notification{text-align:left}.lf-cloud-notification.is-unread{background:rgba(138,43,226,.09)}.lf-cloud-notification-dot{width:9px;height:9px;margin-top:6px;border-radius:50%;background:#8a2be2;flex:0 0 9px}.lf-cloud-notification-copy{min-width:0;flex:1}.lf-cloud-notification-copy strong,.lf-cloud-notification-copy span{display:block}.lf-cloud-notification-copy strong{font-size:13px}.lf-cloud-notification-copy span{font-size:12px;line-height:1.55;opacity:.72}.lf-cloud-notification-copy time{display:block;margin-top:3px;font-size:10px;opacity:.52}.lf-cloud-unread-badge{position:absolute!important;top:-3px!important;right:-3px!important;display:grid!important;place-items:center;width:17px!important;height:17px!important;border-radius:50%!important;background:#ef4056!important;color:#fff!important;font:800 9px/1 system-ui!important}.lf-notifications-page>p[data-lf-core-empty=hidden]{display:none!important}";
    style.textContent += '.lf-notification-banner{position:fixed;top:calc(env(safe-area-inset-top,0px) + 12px);left:12px;right:12px;max-width:460px;margin:auto;z-index:2147483000;display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--ui-line,#dbe5e7);border-radius:16px;background:var(--ui-surface,#fff);color:var(--ui-ink,#172d30);box-shadow:0 6px 24px rgba(0,0,0,.16)}.lf-notification-banner button{font:inherit;color:inherit;border:0;background:transparent;cursor:pointer}.lf-notification-banner-open{flex:1;min-width:0;min-height:48px;padding:6px 10px;text-align:start}.lf-notification-banner-open strong,.lf-notification-banner-open span{display:block;overflow-wrap:anywhere}.lf-notification-banner-open strong{font-size:14px}.lf-notification-banner-open span{font-size:13px;line-height:1.5;margin-top:3px}.lf-notification-banner-close{width:44px;min-height:44px;font-size:24px!important}';
    root.document.head.appendChild(style);
    style.textContent += '.lf-inbox-status{padding:14px 18px;color:var(--ui-secondary,#697582);font:inherit;text-align:start}.lf-inbox-status p{margin:0 0 8px;font-size:14px;line-height:1.65}.lf-inbox-status button{min-height:44px;padding:8px 16px;border:1px solid var(--ui-line,#cbd5dc);border-radius:22px;background:var(--ui-surface,#fff);color:var(--ui-action,#087c83);font:inherit;cursor:pointer}.lf-inbox-status button[hidden]{display:none}.lf-cloud-notification:focus-visible,.lf-inbox-status button:focus-visible{outline:2px solid var(--ui-action,#087c83);outline-offset:-3px}';
  }

  function updateBellBadges() {
    if (!root.document) return;
    var unread = cloudNotifications.filter(function (item) { return !item.read_at; }).length;
    Array.prototype.forEach.call(root.document.querySelectorAll('button[aria-label="الإشعارات"],button[aria-label="Notifications"]'), function (button) {
      var badge = button.querySelector(".lf-cloud-unread-badge");
      if (!unread) { if (badge) badge.remove(); return; }
      if (!badge) {
        badge = root.document.createElement("i");
        badge.className = "lf-cloud-unread-badge";
        button.appendChild(badge);
      }
      var value = String(Math.min(unread, 99));
      if (badge.textContent !== value) badge.textContent = value;
    });
  }

  function renderCloudNotifications() {
    if (!root.document) return;
    updateBellBadges();
    var page = root.document.querySelector(".lf-notifications-page");
    if (!page) return;
    renderInboxStatus(page);
    var previous = page.querySelector(".lf-cloud-notifications");
    var signature=JSON.stringify([root.document.documentElement.lang,cloudNotifications]);
    Array.prototype.forEach.call(page.children, function (child) {
      if (child.tagName === "P" && /لا إشعارات|No notifications/i.test(child.textContent || "")) {
        if (cloudNotifications.length || inboxState!=='ready') child.setAttribute("data-lf-core-empty", "hidden");
        else child.removeAttribute("data-lf-core-empty");
      }
    });
    if(previous && previous._lfInboxSignature===signature)return;
    if(previous)previous.remove();
    if (!cloudNotifications.length) return;
    var section = root.document.createElement("section");
    section.className = "lf-cloud-notifications";
    section._lfInboxSignature=signature;
    section.setAttribute("aria-label", root.document.documentElement.lang === "en" ? "Notifications" : "الإشعارات الجديدة");
    section.dir = root.document.documentElement.lang === "en" ? "ltr" : "rtl";
    cloudNotifications.forEach(function (item) {
      var button = root.document.createElement("button");
      button.type = "button";
      button.className = "lf-cloud-notification" + (item.read_at ? "" : " is-unread");
      var dot = root.document.createElement("span");
      dot.className = "lf-cloud-notification-dot";
      dot.hidden = !!item.read_at;
      var copy = root.document.createElement("span");
      copy.className = "lf-cloud-notification-copy";
      var title = root.document.createElement("strong");
      title.textContent = String(item.title || "إشعار جديد");
      var body = root.document.createElement("span");
      body.textContent = String(item.body || "");
      var time = root.document.createElement("time");
      time.textContent = formatNotificationTime(item.created_at);
      copy.appendChild(title); copy.appendChild(body); copy.appendChild(time);
      button.appendChild(dot); button.appendChild(copy);
      button.addEventListener("click", function () {
        markInboxRead([item.id]);
        var route = notificationRoute(item); if (route) openRoute(route);
      });
      section.appendChild(button);
    });
    var header = page.querySelector(".lf-inbox-status") || page.querySelector("header");
    if (header && header.insertAdjacentElement) header.insertAdjacentElement("afterend", section); else page.prepend(section);
  }

  function renderInboxStatus(page) {
    var previous=page.querySelector('.lf-inbox-status'),en=root.document.documentElement.lang==='en';
    if(inboxState==='ready'){if(previous)previous.remove();return;}
    if(!previous){
      previous=root.document.createElement('div');previous.className='lf-inbox-status';
      var message=root.document.createElement('p');message.setAttribute('role','status');previous.appendChild(message);
      var retry=root.document.createElement('button');retry.type='button';retry.addEventListener('click',function(){refreshCloudNotifications();});previous.appendChild(retry);
      var header=page.querySelector('header');if(header)header.insertAdjacentElement('afterend',previous);else page.prepend(previous);
    }
    var text=inboxState==='loading'?(en?'Updating notifications...':'جارٍ تحديث الإشعارات...'):
      cloudNotifications.length?(en?'Offline. Showing saved notifications.':'تعذر الاتصال. نعرض إشعاراتك المحفوظة.'):(en?'Could not load notifications.':'تعذر تحميل الإشعارات.');
    if(previous.children[0].textContent!==text)previous.children[0].textContent=text;
    previous.children[1].hidden=inboxState==='loading';
    var label=en?'Retry':'إعادة المحاولة';if(previous.children[1].textContent!==label)previous.children[1].textContent=label;
  }

  function dismissBanner() {
    if (bannerTimer) root.clearTimeout(bannerTimer);
    var banner = root.document && root.document.querySelector('.lf-notification-banner');
    if (banner) banner.remove();
  }

  function announceNotification(item) {
    if (!item || !item.id || item.read_at || shownNotifications.has(item.id)) return;
    shownNotifications.add(item.id);
    if (shownNotifications.size > 200) shownNotifications.delete(shownNotifications.values().next().value);
    if (!root.document || root.document.hidden) return;
    dismissBanner();
    var en = root.document.documentElement.lang === 'en';
    var banner = root.document.createElement('section');
    banner.className = 'lf-notification-banner'; banner.dir = en ? 'ltr' : 'rtl';
    banner.setAttribute('role','status'); banner.setAttribute('aria-live','polite');
    var open = root.document.createElement('button'); open.type = 'button'; open.className = 'lf-notification-banner-open';
    var title = root.document.createElement('strong'); title.textContent = String(item.title || (en ? 'New notification' : 'إشعار جديد'));
    var body = root.document.createElement('span'); body.textContent = String(item.body || '');
    open.appendChild(title); open.appendChild(body);
    open.addEventListener('click',function(){
      markInboxRead([item.id]);dismissBanner();
      var route=notificationRoute(item); if(route)openRoute(route);
    });
    var close=root.document.createElement('button'); close.type='button'; close.className='lf-notification-banner-close';
    close.textContent='×'; close.setAttribute('aria-label',en?'Dismiss notification':'إغلاق الإشعار');
    close.addEventListener('click',dismissBanner);
    banner.appendChild(open);banner.appendChild(close);root.document.body.appendChild(banner);
    bannerTimer=root.setTimeout(dismissBanner,7000);
  }

  async function refreshCloudNotifications(announce, catchUp) {
    var backend=root.LorefyBackend, epoch=connectionEpoch, owner=activeAccount;
    if (!backend || typeof backend.listNotifications !== 'function' || !activeAccount) return [];
    if(refreshJob && refreshJob.epoch===epoch && refreshJob.backend===backend){
      refreshJob.announce=refreshJob.announce||!!announce;
      refreshJob.catchUp=refreshJob.catchUp||!!catchUp;
      return refreshJob.promise;
    }
    var request=++refreshEpoch,job={epoch:epoch,backend:backend,announce:!!announce,catchUp:false};
    var current=function(){return epoch===connectionEpoch && request===refreshEpoch && owner===activeAccount && backend===root.LorefyBackend;};
    refreshJob=job;
    job.promise=(async function(){
     try {
      await flushReadReceipts();
      if(!current())return [];
      var initialIds=new Set(cloudNotifications.map(function(item){return item.id;}));
      var rows=await backend.listNotifications(60);
      if(!current())return [];
      rows=cleanInbox(rows,activeAccount).map(function(row){
        var old=cloudNotifications.find(function(item){return item.id===row.id;});
        if(old&&old.read_at)row.read_at=row.read_at||old.read_at;
        return row;
      });
      var existing=new Set(cloudNotifications.map(function(item){return item.id;}));
      var fresh=cloudNotifications.filter(function(item){return !initialIds.has(item.id) && !rows.some(function(row){return row.id===item.id;});});
      cloudNotifications=fresh.concat(rows).slice(0,60);
      inboxState='ready';saveInbox();
      renderCloudNotifications();
      if(job.announce) rows.filter(function(item){return !existing.has(item.id);}).reverse().forEach(announceNotification);
    } catch(error) {
      if(current()){inboxState='offline';renderCloudNotifications();}
    } finally {
      if(refreshJob===job)refreshJob=null;
    }
    if(!current())return [];
    // A reconnect may happen after the server took the in-flight snapshot.
    if(job.catchUp)return refreshCloudNotifications(job.announce);
    return cloudNotifications;
    })();
    return job.promise;
  }

  async function connectCloudNotifications() {
    var backend=root.LorefyBackend, epoch=++connectionEpoch;
    refreshEpoch++;
    refreshJob=null;
    if(cloudUnsubscribe){cloudUnsubscribe();cloudUnsubscribe=null;}
    activeAccount='';cloudNotifications=[];pendingReads=new Set();readJob=null;inboxState='loading';shownNotifications.clear();dismissBanner();renderCloudNotifications();
    if(!backend || !backend.getSession)return;
    var session;
    try{session=await backend.getSession();}catch(error){if(epoch===connectionEpoch){inboxState='offline';renderCloudNotifications();}return;}
    if(epoch!==connectionEpoch)return;
    if(!session || !session.userId){inboxState='ready';renderCloudNotifications();return;}
    activeAccount=session.userId;
    restoreInbox(activeAccount);renderCloudNotifications();
    // Subscribe before fetching so new inserts cannot fall into a startup gap.
    if(typeof backend.subscribeNotifications==='function') {
      try {
        var unsubscribe=await backend.subscribeNotifications(function(item, change){
          if(epoch!==connectionEpoch || backend!==root.LorefyBackend || !item || item.actor_id===activeAccount || (item.user_id && item.user_id!==activeAccount))return;
          var old=cloudNotifications.find(function(row){return row.id===item.id;});
          var next=Object.assign({},item,{read_at:item.read_at || old && old.read_at || null});
          if(change && change.event==='UPDATE'){
            if(!old){refreshCloudNotifications(false,true);return;}
            cloudNotifications=cleanInbox(cloudNotifications.map(function(row){return row.id===item.id?next:row;}),activeAccount);
            saveInbox();renderCloudNotifications();return;
          }
          cloudNotifications=cleanInbox([next].concat(cloudNotifications.filter(function(row){return row.id!==item.id;})),activeAccount);
          saveInbox();
          renderCloudNotifications();announceNotification(next);
          if(item.kind==='follow' && root.dispatchEvent && root.CustomEvent)root.dispatchEvent(new root.CustomEvent('lorefy:profile-follow-changed',{detail:item}));
        }, function(status){
          if(epoch===connectionEpoch && backend===root.LorefyBackend && status==='SUBSCRIBED')refreshCloudNotifications(true,true);
        });
        if(epoch!==connectionEpoch){unsubscribe();return;}cloudUnsubscribe=unsubscribe;
      }catch(error){}
    }
    await refreshCloudNotifications();
    if(epoch!==connectionEpoch)return;
    if(isNative()) {
      try {
        if(root.localStorage.getItem(PUSH_ENABLED_KEY)!=='false') {
          if(pendingToken)await registerToken(pendingToken);
          if(epoch===connectionEpoch)await requestPermissionAndRegister();
        }
      }catch(error){if(root.dispatchEvent && root.CustomEvent)root.dispatchEvent(new root.CustomEvent('lorefy:native-notification-error',{detail:{code:'registration_failed'}}));}
    }
  }

  function openPendingScreen() {
    if (!root.document || !root.location) return;
    var params = new URLSearchParams(root.location.search || "");
    if (params.get("notifications") === "1") {
      var tries = 0;
      var notificationTimer = root.setInterval(function () {
        var button = root.document.querySelector('button[aria-label="الإشعارات"],button[aria-label="Notifications"]');
        if (button) { root.clearInterval(notificationTimer); button.click(); }
        else if (++tries > 40) root.clearInterval(notificationTimer);
      }, 100);
    }
    var postId = params.get("post");
    if (validId(postId)) {
      var postTries=0;
      var postTimer=root.setInterval(function(){
        if(root.LorefyCommunity && root.LorefyCommunity.openThreadById){
          root.clearInterval(postTimer);root.LorefyCommunity.openThreadById(postId).catch(function(){});
        }else if(++postTries>60)root.clearInterval(postTimer);
      },100);
    }
    var reviewId = params.get("review");
    if (reviewId) {
      var reviewTries = 0;
      var reviewTimer = root.setInterval(function () {
        var card = root.document.querySelector('[data-review-id="' + reviewId.replace(/[^0-9a-f-]/gi, "") + '"]');
        if (card) { root.clearInterval(reviewTimer); card.click(); }
        else if (++reviewTries > 60) root.clearInterval(reviewTimer);
      }, 100);
    }
  }

  function installDocumentHooks() {
    injectStyles();
    openPendingScreen();
    root.document.addEventListener('visibilitychange',function(){if(!root.document.hidden)refreshCloudNotifications(true);});
    if(root.addEventListener)root.addEventListener('online',function(){refreshCloudNotifications(true,true);});
    root.setInterval(function(){if(!root.document.hidden && activeAccount)refreshCloudNotifications(true);},30000);
    root.document.addEventListener("click", function (event) {
      var target = event.target && event.target.closest && event.target.closest("button");
      if (!target) return;
      if (/^(الإشعارات|Notifications)$/.test(target.getAttribute('aria-label') || '')) refreshCloudNotifications();
      if (/قراءة الكل|Mark all as read/i.test(target.textContent || "") && target.closest(".lf-notifications-page")) {
        markInboxRead(null);
      }
    }, true);
    var observer = new MutationObserver(function () {
      var page = root.document.querySelector(".lf-notifications-page");
      if (page && ((cloudNotifications.length && !page.querySelector(".lf-cloud-notifications")) ||
          (inboxState !== 'ready' && !page.querySelector('.lf-inbox-status')))) renderCloudNotifications();
      else updateBellBadges();
    });
    observer.observe(root.document.body, { childList:true, subtree:true });
  }

  function start() {
    if (started || !root.document) return;
    started = true;
    var ready = function () {
      installDocumentHooks();
      setupNativeListeners();
      var attempts = 0;
      var backendTimer = root.setInterval(function () {
        if (root.LorefyBackend) {
          root.clearInterval(backendTimer);
          if (root.LorefyBackend.onAuth) root.LorefyBackend.onAuth(function () { connectCloudNotifications(); });
          connectCloudNotifications();
        } else if (++attempts > 50) root.clearInterval(backendTimer);
      }, 100);
    };
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", ready, { once:true });
    else ready();
  }

  return {
    parseAppLink:parseAppLink,
    openRoute:openRoute,
    requestPermissionAndRegister:requestPermissionAndRegister,
    setPushEnabled:setPushEnabled,
    refreshCloudNotifications:refreshCloudNotifications,
    connectCloudNotifications:connectCloudNotifications,
    notificationRoute:notificationRoute,
    start:start
  };
});

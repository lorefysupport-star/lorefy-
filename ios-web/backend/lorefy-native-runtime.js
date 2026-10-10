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
  var pendingToken = '';

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
    if (path === "/community") return { route:"community" };
    if (path === "/library") return { route:"library" };
    if (path === "/profile") return { route:"profile" };
    if (path === "/home" || path === "/") return { route:"home" };
    return null;
  }

  function openRoute(target) {
    var route = typeof target === "string" ? parseAppLink(target) : target;
    if (!route || !root.location) return false;
    var url = new URL(root.location.href);
    ["route", "novel", "id", "search", "review", "notifications"].forEach(function (key) {
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
    if (pushRegistration) return pushRegistration;
    pushRegistration = registerWithPermission();
    try { return await pushRegistration; }
    finally { pushRegistration = null; }
  }

  async function registerWithPermission() {
    var push = pushPlugin();
    if (!isNative() || !push) return false;
    var permission = await push.checkPermissions();
    if (!permission || permission.receive === "prompt") permission = await push.requestPermissions();
    if (!permission || permission.receive !== "granted") {
      try { root.localStorage.setItem(PUSH_ENABLED_KEY, "false"); } catch (error) {}
      return false;
    }
    await push.register();
    try { root.localStorage.setItem(PUSH_ENABLED_KEY, 'true'); } catch (error) {}
    return true;
  }

  async function setPushEnabled(enabled) {
    enabled = enabled === true;
    if (enabled) return requestPermissionAndRegister();
    try { root.localStorage.setItem(PUSH_ENABLED_KEY, 'false'); } catch (error) {}
    var backend = root.LorefyBackend;
    if (backend && typeof backend.unregisterPushDevice === "function") {
      try { await backend.unregisterPushDevice(installationId()); } catch (error) {}
    }
    return false;
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
      registerToken(pendingToken).then(function (saved) { if (saved !== false) pendingToken = ''; }).catch(function () {
        root.dispatchEvent(new CustomEvent("lorefy:native-notification-error", { detail:{ code:"registration_failed" } }));
      });
    });
    Push.addListener("registrationError", function () {
      root.dispatchEvent(new CustomEvent("lorefy:native-notification-error", { detail:{ code:"native_registration_failed" } }));
    });
    Push.addListener("pushNotificationReceived", function (notification) {
      root.dispatchEvent(new CustomEvent("lorefy:notification", { detail:notification || {} }));
      refreshCloudNotifications();
    });
    Push.addListener("pushNotificationActionPerformed", function (action) {
      var target = notificationTarget(action && action.notification);
      if (target) openRoute(target);
    });
    try {
      if (root.localStorage.getItem(PUSH_ENABLED_KEY) === "true") requestPermissionAndRegister().catch(function () {});
    } catch (error) {}
  }

  function formatNotificationTime(value) {
    var time = new Date(value).getTime();
    var minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (!Number.isFinite(time) || minutes < 1) return "الآن";
    if (minutes < 60) return "منذ " + minutes + " د";
    if (minutes < 1440) return "منذ " + Math.floor(minutes / 60) + " س";
    return "منذ " + Math.floor(minutes / 1440) + " ي";
  }

  function injectStyles() {
    if (!root.document || root.document.getElementById("lf-native-runtime-styles")) return;
    var style = root.document.createElement("style");
    style.id = "lf-native-runtime-styles";
    style.textContent = ".lf-cloud-notifications{direction:rtl}.lf-cloud-notification{position:relative;display:flex;width:100%;gap:10px;padding:13px 18px;border:0;border-bottom:1px solid rgba(128,128,128,.16);background:transparent;color:inherit;text-align:right;font-family:inherit;cursor:pointer}.lf-cloud-notification.is-unread{background:rgba(138,43,226,.09)}.lf-cloud-notification-dot{width:9px;height:9px;margin-top:6px;border-radius:50%;background:#8a2be2;flex:0 0 9px}.lf-cloud-notification-copy{min-width:0;flex:1}.lf-cloud-notification-copy strong,.lf-cloud-notification-copy span{display:block}.lf-cloud-notification-copy strong{font-size:13px}.lf-cloud-notification-copy span{font-size:12px;line-height:1.55;opacity:.72}.lf-cloud-notification-copy time{display:block;margin-top:3px;font-size:10px;opacity:.52}.lf-cloud-unread-badge{position:absolute!important;top:-3px!important;right:-3px!important;display:grid!important;place-items:center;width:17px!important;height:17px!important;border-radius:50%!important;background:#ef4056!important;color:#fff!important;font:800 9px/1 system-ui!important}.lf-notifications-page>p[data-lf-core-empty=hidden]{display:none!important}";
    root.document.head.appendChild(style);
  }

  function updateBellBadges() {
    if (!root.document) return;
    var unread = cloudNotifications.filter(function (item) { return !item.read_at; }).length;
    Array.prototype.forEach.call(root.document.querySelectorAll('button[aria-label="الإشعارات"]'), function (button) {
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
    var previous = page.querySelector(".lf-cloud-notifications");
    if (previous) previous.remove();
    Array.prototype.forEach.call(page.children, function (child) {
      if (child.tagName === "P" && /لا إشعارات/.test(child.textContent || "")) {
        if (cloudNotifications.length) child.setAttribute("data-lf-core-empty", "hidden");
        else child.removeAttribute("data-lf-core-empty");
      }
    });
    if (!cloudNotifications.length) return;
    var section = root.document.createElement("section");
    section.className = "lf-cloud-notifications";
    section.setAttribute("aria-label", "الإشعارات الجديدة");
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
        var backend = root.LorefyBackend;
        if (backend && backend.markNotificationsRead) backend.markNotificationsRead([item.id]).catch(function () {});
        item.read_at = new Date().toISOString();
        renderCloudNotifications();
        if (item.target_path) openRoute(item.target_path);
      });
      section.appendChild(button);
    });
    var header = page.querySelector("header");
    if (header) header.insertAdjacentElement("afterend", section); else page.prepend(section);
  }

  async function refreshCloudNotifications() {
    var backend = root.LorefyBackend;
    if (!backend || typeof backend.listNotifications !== "function") return [];
    try { cloudNotifications = await backend.listNotifications(60); }
    catch (error) { cloudNotifications = []; }
    renderCloudNotifications();
    return cloudNotifications;
  }

  async function connectCloudNotifications() {
    var backend = root.LorefyBackend;
    if (!backend) return;
    if (isNative() && backend.getSession) {
      try {
        var session = await backend.getSession();
        var optedOut = root.localStorage.getItem(PUSH_ENABLED_KEY) === 'false';
        if (session && session.userId && !optedOut) {
          if (pendingToken) { await registerToken(pendingToken); pendingToken = ''; }
          await requestPermissionAndRegister();
        }
      } catch (error) {
        if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('lorefy:native-notification-error',
          {detail:{code:'registration_failed'}}));
      }
    }
    if (cloudUnsubscribe) { cloudUnsubscribe(); cloudUnsubscribe = null; }
    await refreshCloudNotifications();
    if (typeof backend.subscribeNotifications === "function") {
      try {
        cloudUnsubscribe = await backend.subscribeNotifications(function (item) {
          if (!item) return;
          cloudNotifications = [item].concat(cloudNotifications.filter(function (row) { return row.id !== item.id; })).slice(0, 60);
          renderCloudNotifications();
          if (item.kind === "follow" && typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") {
            root.dispatchEvent(new root.CustomEvent("lorefy:profile-follow-changed", { detail: item }));
          }
        });
      } catch (error) {}
    }
  }

  function openPendingScreen() {
    if (!root.document || !root.location) return;
    var params = new URLSearchParams(root.location.search || "");
    if (params.get("notifications") === "1") {
      var tries = 0;
      var notificationTimer = root.setInterval(function () {
        var button = root.document.querySelector('button[aria-label="الإشعارات"]');
        if (button) { root.clearInterval(notificationTimer); button.click(); }
        else if (++tries > 40) root.clearInterval(notificationTimer);
      }, 100);
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
    root.document.addEventListener("click", function (event) {
      var target = event.target && event.target.closest && event.target.closest("button");
      if (!target) return;
      if (/قراءة الكل|Mark all as read/i.test(target.textContent || "") && target.closest(".lf-notifications-page")) {
        var backend = root.LorefyBackend;
        if (backend && backend.markNotificationsRead) backend.markNotificationsRead(null).catch(function () {});
        cloudNotifications.forEach(function (item) { item.read_at = item.read_at || new Date().toISOString(); });
        root.setTimeout(renderCloudNotifications, 0);
      }
    }, true);
    var observer = new MutationObserver(function () {
      var page = root.document.querySelector(".lf-notifications-page");
      if (page && cloudNotifications.length && !page.querySelector(".lf-cloud-notifications")) renderCloudNotifications();
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
    start:start
  };
});

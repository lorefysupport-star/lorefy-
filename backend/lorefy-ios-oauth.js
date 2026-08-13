/* Native OAuth return handling for Lorefy's Capacitor iOS shell. */
(function (global) {
  "use strict";

  var callbackUrl = "com.lorefy.app://auth/callback";
  var pendingKey = "lorefy.oauth.google.pending.v1";
  var pendingMaxAge = 10 * 60 * 1000;
  function isNative() {
    return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());
  }
  if (!isNative()) return;

  function ready(attempt) {
    var plugins = global.Capacitor && global.Capacitor.Plugins;
    if (global.LorefyBackend && plugins && plugins.App && plugins.Browser) return setup(plugins);
    if (attempt < 50) global.setTimeout(function () { ready(attempt + 1); }, 100);
  }

  function setup(plugins) {
    var backend = global.LorefyBackend;
    var Browser = plugins.Browser;
    var App = plugins.App;
    var originalSignIn = backend.signInWithOAuth;
    var pending = null;

    function readPendingMarker() {
      try {
        var value = JSON.parse(global.localStorage.getItem(pendingKey) || "null");
        if (!value || Date.now() - Number(value.startedAt || 0) > pendingMaxAge) {
          global.localStorage.removeItem(pendingKey);
          return null;
        }
        return value;
      } catch (_) { return null; }
    }

    function clearPendingMarker() {
      try { global.localStorage.removeItem(pendingKey); } catch (_) {}
    }

    async function completeNativeSession(url) {
      if (!backend.client) return;
      try {
        var parsed = new URL(url);
        if (parsed.protocol + "//" + parsed.host + parsed.pathname !== callbackUrl) return;
        var marker = readPendingMarker();
        if (!pending && !marker) return;
        var current = pending || { resolve: function () {}, reject: function (error) { console.warn("[Lorefy] OAuth return:", error); } };
        pending = null;
        var code = parsed.searchParams.get("code");
        if (!code) throw new Error("OAuth authorization code was not returned");
        var result = await backend.client.auth.exchangeCodeForSession(code);
        if (result.error || !result.data || !result.data.session) throw result.error || new Error("OAuth session was not returned");
        backend.user = result.data.session.user;
        if (backend._afterLogin && backend.user) await backend._afterLogin(backend.user.id);
        clearPendingMarker();
        try { await Browser.close(); } catch (_) {}
        current.resolve({ userId: backend.user && backend.user.id, native: true });
      } catch (error) {
        clearPendingMarker();
        try { await Browser.close(); } catch (_) {}
        current.reject(error);
      }
    }

    App.addListener("appUrlOpen", function (event) {
      if (event && event.url) completeNativeSession(event.url);
    });
    if (App.getLaunchUrl) {
      App.getLaunchUrl().then(function (event) {
        if (event && event.url) completeNativeSession(event.url);
      }).catch(function () {});
    }

    backend.signInWithOAuth = async function (provider) {
      provider = String(provider || "").toLowerCase();
      if (provider !== "google") return originalSignIn.call(backend, provider);
      if (!backend.client) return originalSignIn.call(backend, provider);
      if (pending) throw new Error("A sign-in flow is already active.");

      var response = await backend.client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl, skipBrowserRedirect: true }
      });
      if (response.error || !response.data || !response.data.url) throw response.error || new Error("Google OAuth URL is unavailable");
      try { global.localStorage.setItem(pendingKey, JSON.stringify({ provider:"google", startedAt:Date.now() })); } catch (_) {}
      await Browser.open({ url: response.data.url });
      return new Promise(function (resolve, reject) { pending = { resolve: resolve, reject: reject }; });
    };
  }

  ready(0);
})(typeof window !== "undefined" ? window : this);

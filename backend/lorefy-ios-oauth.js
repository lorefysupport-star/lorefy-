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

  function publicAuthError(error) {
    var message = String(error && error.message || error || "");
    if (/cancelled|canceled|user.*closed/i.test(message)) {
      return new Error("تم إلغاء تسجيل الدخول بواسطة Google.");
    }
    return new Error("تعذر تسجيل الدخول بواسطة Google حالياً. تحقق من اتصالك وحاول مجدداً.");
  }

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
    var activeCode = null;
    var starting = false;
    var dismissalTimer = null;

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

    function cancelNativeFlow() {
      global.clearTimeout(dismissalTimer);
      var current = pending;
      if (!current || activeCode) return;
      pending = null;
      activeCode = null;
      global.clearTimeout(current.timer);
      clearPendingMarker();
      var error = new Error("تم إلغاء تسجيل الدخول بواسطة Google.");
      error.code = "LOREFY_OAUTH_CANCELLED";
      current.reject(error);
    }

    async function completeNativeSession(url) {
      var current = null;
      var code = "";
      try {
        var parsed = new URL(url);
        if (parsed.protocol + "//" + parsed.host + parsed.pathname !== callbackUrl) return;
        global.clearTimeout(dismissalTimer);
        var deadline = Date.now() + 15000;
        while (!backend.client && Date.now() < deadline) {
          await new Promise(function(resolve){ global.setTimeout(resolve, 100); });
        }
        if (!backend.client) throw new Error("Native authentication client is not ready");
        var marker = readPendingMarker();
        if (!pending && !marker) return;
        current = pending || { resolve: function () {}, reject: function (error) { console.warn("[Lorefy] OAuth return:", error); } };
        code = parsed.searchParams.get("code");
        if (!code) throw new Error("OAuth authorization code was not returned");
        if (activeCode === code) return;
        activeCode = code;
        var result = await backend.client.auth.exchangeCodeForSession(code);
        if (result.error || !result.data || !result.data.session || !result.data.session.user) throw result.error || new Error("OAuth session was not returned");
        backend.user = result.data.session.user;
        clearPendingMarker();
        if (pending === current) pending = null;
        global.clearTimeout(current.timer);
        // The provider has already handed control back to Lorefy. Close its
        // browser immediately so cloud hydration cannot leave a blank sheet
        // covering the app on a slow connection.
        try { await Browser.close(); } catch (_) {}
        // Boot hydrates the persisted account once; do not hold up this handoff.
        current.resolve({ userId: backend.user && backend.user.id, native: true });
        // The auth gate awaits this native flow but does not navigate after a live session.
        // Reload the WebView so the persisted Supabase session mounts the app shell.
        if (global.location && typeof global.location.reload === "function") {
          global.setTimeout(function () { global.location.reload(); }, 0);
        }
      } catch (error) {
        clearPendingMarker();
        if (pending === current) pending = null;
        if (current) global.clearTimeout(current.timer);
        try { await Browser.close(); } catch (_) {}
        if (current) current.reject(publicAuthError(error));
      } finally {
        if (activeCode === code) activeCode = null;
      }
    }

    var callbackListenerError = null;
    var callbackListenerReady = Promise.resolve(App.addListener("appUrlOpen", function (event) {
      if (event && event.url) completeNativeSession(event.url);
    })).catch(function(error){ callbackListenerError = error; });
    if (Browser.addListener) {
      Browser.addListener("browserFinished", function () {
        // iOS can dismiss the provider before delivering appUrlOpen.
        // Keep the verifier and pending promise alive during that handoff.
        global.clearTimeout(dismissalTimer);
        dismissalTimer = global.setTimeout(cancelNativeFlow, 1000);
      }).catch(function () {});
    }
    if (App.getLaunchUrl) {
      App.getLaunchUrl().then(function (event) {
        if (event && event.url) completeNativeSession(event.url);
      }).catch(function () {});
    }

    backend.signInWithOAuth = async function (provider) {
      provider = String(provider || "").toLowerCase();
      if (provider !== "google") return originalSignIn.call(backend, provider);
      if (!backend.client) throw new Error("تسجيل الدخول غير جاهز. أعد فتح التطبيق وحاول مجدداً.");
      if (!global.crypto || typeof global.crypto.getRandomValues !== "function") throw new Error("Secure OAuth randomness is unavailable");
      if (pending || starting) throw new Error("A sign-in flow is already active.");

      starting = true;
      var response;
      var authorizationUrl;
      try {
        await callbackListenerReady;
        if (callbackListenerError) throw callbackListenerError;
        response = await backend.client.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: callbackUrl, skipBrowserRedirect: true }
        });
        if (response.error || !response.data || !response.data.url) {
          throw response.error || new Error("Google OAuth URL is unavailable");
        }
        authorizationUrl = new URL(response.data.url);
        if (authorizationUrl.searchParams.get("code_challenge_method") === "plain") {
          // WebCrypto is absent on some custom-scheme WebViews. Upgrade the SDK's
          // stored verifier to S256 using CryptoKit before opening the provider.
          if (!global.LorefyNativeSHA256) throw new Error("Secure OAuth hashing is unavailable");
          var hex = await global.LorefyNativeSHA256(authorizationUrl.searchParams.get("code_challenge"));
          var binary = hex.match(/.{2}/g).map(function(byte){ return String.fromCharCode(parseInt(byte, 16)); }).join("");
          authorizationUrl.searchParams.set("code_challenge", global.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
          authorizationUrl.searchParams.set("code_challenge_method", "s256");
        }
      } catch (error) { throw publicAuthError(error); }
      finally { starting = false; }
      try { global.localStorage.setItem(pendingKey, JSON.stringify({ provider:"google", startedAt:Date.now() })); } catch (_) {}
      var flow = {};
      flow.promise = new Promise(function (resolve, reject) {
        flow.resolve = resolve;
        flow.reject = reject;
      });
      pending = flow;
      flow.timer = global.setTimeout(function(){
        if (pending !== flow) return;
        pending = null;
        clearPendingMarker();
        Browser.close().catch(function(){});
        flow.reject(new Error("انتهت مهلة تسجيل الدخول. حاول مجدداً."));
      }, pendingMaxAge);
      try {
        await Browser.open({ url: authorizationUrl.toString() });
      } catch (error) {
        if (pending === flow) pending = null;
        global.clearTimeout(flow.timer);
        clearPendingMarker();
        throw publicAuthError(error);
      }
      return flow.promise;
    };
  }

  ready(0);
})(typeof window !== "undefined" ? window : this);

/* ════════════════════════════════════════════════════════════════════════
   Lorefy — Sign in with Apple (الجسر الأصلي لتطبيق iOS)
   backend/lorefy-ios-bridge.js

   عندما يعمل التطبيق داخل غلاف Capacitor (تطبيق iOS أصلي) نستخدم
   تدفّق Apple الأصلي عبر إضافة @capacitor-community/apple-sign-in
   ثم نمرّر الرمز إلى Supabase بدلاً من فتح متصفّح OAuth.
   في الويب: يبقى المسار الأصلي عبر LorefyBackend.signInWithApple.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";
  function isNative(){ return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform()); }
  if (!isNative()) return;   // ← في المتصفّح: لا تغيير

  function ready(cb){
    if (global.LorefyBackend && global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.SignInWithApple) cb();
    else setTimeout(function(){ ready(cb); }, 200);
  }

  function publicAuthError(error){
    var message = String(error && error.message || error || "");
    if (/cancelled|canceled|authorization_error.*1001/i.test(message)) {
      return new Error("تم إلغاء تسجيل الدخول بواسطة Apple.");
    }
    return new Error("تعذر تسجيل الدخول بواسطة Apple حالياً. تحقق من اتصالك وحاول مجدداً.");
  }

  function secureToken(){
    if (!global.crypto || typeof global.crypto.getRandomValues !== "function") {
      throw new Error("Secure random state is unavailable");
    }
    var bytes = new Uint8Array(24);
    global.crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function(byte){ return byte.toString(16).padStart(2, "0"); }).join("");
  }

  async function sha256(value){
    if (global.LorefyNativeSHA256) return global.LorefyNativeSHA256(value);
    if (!global.crypto || !global.crypto.subtle || typeof global.TextEncoder !== "function") {
      throw new Error("Secure nonce hashing is unavailable");
    }
    var digest = await global.crypto.subtle.digest("SHA-256", new global.TextEncoder().encode(value));
    return Array.prototype.map.call(new Uint8Array(digest), function(byte){
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  ready(function(){
    var BE  = global.LorefyBackend;
    var SIA = global.Capacitor.Plugins.SignInWithApple;
    var origOAuthSignIn = BE.signInWithOAuth;

    async function nativeAppleSignIn(){
      try{
        if (!BE.client) throw new Error("Native authentication client is not ready");
        var rawNonce = secureToken();
        var hashedNonce = await sha256(rawNonce);
        var state = secureToken();
        var result = await SIA.authorize({
          clientId: "com.lorefy.app",            // Bundle ID
          scopes:   "email name",
          state:    state,
          nonce:    hashedNonce
        });
        var resp = (result && result.response) || {};
        var idToken = resp.identityToken;
        if (!idToken) throw new Error("Apple did not return identity token");
        var r = await BE.client.auth.signInWithIdToken({
          provider: "apple",
          token:    idToken,
          nonce:    rawNonce
        });
        if (r.error || !r.data || !r.data.session || !r.data.user) throw r.error || new Error("Apple session was not returned");
        BE.user = r.data && r.data.user;
        if (resp.authorizationCode) {
          try {
            // Keep the one-time code in Keychain across reload. Boot registers
            // it server-side without holding up the authenticated screen.
            await BE.queueAppleAuthorization(resp.authorizationCode);
          } catch (registrationError) {
            console.warn("[Lorefy] Apple authorization retention failed; keeping the authenticated session:", registrationError);
          }
        } else {
          console.warn("[Lorefy] Apple did not return an authorization code; keeping the authenticated session.");
        }
        if (global.location && typeof global.location.reload === "function") {
          global.setTimeout(function () { global.location.reload(); }, 0);
        }
        return { userId: BE.user && BE.user.id, native: true };
      } catch (e){
        console.warn("[Lorefy] Apple native sign-in failed:", e);
        throw publicAuthError(e);
      }
    }

    BE.signInWithApple = nativeAppleSignIn;
    BE.signInWithOAuth = async function(provider){
      if (String(provider || "").toLowerCase() !== "apple") {
        return origOAuthSignIn.call(BE, provider);
      }
      return nativeAppleSignIn();
    };

    /* لاحقاً يمكن تمديد الجسر لطباعة لوغ أحداث، إخفاء شريط الحالة، إلخ. */
  });
})(typeof window !== "undefined" ? window : this);

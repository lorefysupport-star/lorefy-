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

  function secureToken(){
    if (!global.crypto || typeof global.crypto.getRandomValues !== "function") {
      throw new Error("Secure random state is unavailable");
    }
    var bytes = new Uint8Array(24);
    global.crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function(byte){ return byte.toString(16).padStart(2, "0"); }).join("");
  }

  async function sha256(value){
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
        if (r.error) throw r.error;
        if (!resp.authorizationCode) throw new Error("Apple did not return authorization code");
        BE.user = r.data && r.data.user;
        try {
          await BE.registerAppleAuthorization(resp.authorizationCode);
        } catch (registrationError) {
          try { await BE.signOut(); } catch (signOutError) {}
          throw registrationError;
        }
        if (BE._afterLogin && BE.user) await BE._afterLogin(BE.user.id);
        return { userId: BE.user && BE.user.id, native: true };
      } catch (e){
        console.warn("[Lorefy] Apple native sign-in failed:", e);
        throw e;
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

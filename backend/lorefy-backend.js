/* ════════════════════════════════════════════════════════════════════════
   Lorefy — Backend (lorefy-backend.js)   →  window.LorefyBackend

   حسابات حقيقية + مزامنة سحابية بلا إعادة كتابة التطبيق.
   الفكرة: التطبيق يخزّن كل شيء في localStorage (مفاتيح lorefy.user.*).
   هذه الوحدة تجعل Supabase «مصدر الحقيقة»: عند الدخول تسحب حالة المستخدم
   وتكتبها في localStorage، وعند أي تغيير تدفعها للسحابة. هكذا لا يضيع تعب
   أحد، وتبقى البيانات «رسمية» منذ البيتا.

   • إن وُجدت مفاتيح Supabase (window.LOREFY_SUPABASE) → وضع «حي» (live).
   • إن لم تُضبط → وضع «تجريبي» (demo): يعمل محلياً ليبقى النموذج قابلاً للتشغيل.
   اضبط المفاتيح في config/lorefy-config.js لتفعيل الحسابات الحقيقية.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";

  var SYNC_KEYS = [
    "lorefy.identity.v1",
    "lorefy.user.preferences.v1",
    "lorefy.user.preferences.v2",
    "lorefy.user.library.v2",
    "lorefy.user.progress.v2",
    "lorefy.user.favorites.v2",
    "lorefy.user.privateReviews.v2",
    "lorefy.user.socials.v2",
    "lorefy.user.customCovers.v2",
    "lorefy.user.readLog.v1",
    "lorefy.user.bannerPos.v2",
    "lorefy.user.avatarPos.v2",
    "lorefy.safety.blocked.v1",
    "lorefy.safety.muted.v1"
  ];
  var SESSION_KEY = "lorefy.session.v1";   // {userId,email,mode}
  var ACTIVE_USER_KEY = "lorefy.activeUser.v1";
  var ONBOARDING_DRAFT_KEY = "lorefy.onboarding.draft.v2";
  var SUPABASE_SDK = "vendor/supabase.js";
  var OAUTH_PROVIDERS = ["google", "apple"];
  var PROFILE_MEDIA_BUCKET = "profile-media";
  var REVIEW_MEDIA_BUCKET = "review-media";
  var PROFILE_MEDIA_TTL = 60 * 60 * 24;
  var REVIEW_MEDIA_TTL = 60 * 60;
  var ACCOUNT_STORAGE_PREFIXES = [
    "lorefy.user.", "lorefy.characterRatings.", "lorefy.characterReview.",
    "lorefy.characterCustomImages.", "lorefy.characterBoardImages.",
    "lorefy.characterBoards.", "lorefy.charTopLists.", "lorefy.customLists.",
    "lorefy.privacy.", "lorefy.recommendations.", "lorefy.review.saved.",
    "lorefy.reviewTop4.", "lorefy.reviewDetailMyDislikes.",
    "lorefy.communityMyLikes.", "lorefy.communityMyDislikes.",
    "lorefy.safety.", "lorefy.data.corrections."
  ];

  function readLS(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function writeLS(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function invalidSessionError(){
    var error = new Error("انتهت الجلسة أو حُذف الحساب. سجّل الدخول مجدداً.");
    error.code = "LOREFY_SESSION_INVALID";
    return error;
  }
  function clearUserData(){
    SYNC_KEYS.forEach(function(k){ try{ localStorage.removeItem(k); }catch(e){} });
    try {
      var owned = [];
      for (var index = 0; index < localStorage.length; index += 1) {
        var key = localStorage.key(index);
        if (key && ACCOUNT_STORAGE_PREFIXES.some(function(prefix){ return key.indexOf(prefix) === 0; })) owned.push(key);
      }
      owned.forEach(function(key){ localStorage.removeItem(key); });
    } catch(e){}
    try{ localStorage.removeItem(ACTIVE_USER_KEY); }catch(e){}
  }
  function normalizeUsername(value){
    return String(value || "").replace(/^@/, "").trim().toLowerCase();
  }
  function gather(){ var o={}; SYNC_KEYS.forEach(function(k){ var v=readLS(k); if(v!=null) o[k]=v; }); return o; }
  function isLocalDemoAllowed(){
    var location = global.location || {};
    var hostname = String(location.hostname || "").toLowerCase();
    var localHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(hostname);
    var params = new URLSearchParams(String(location.search || ""));
    var features = global.LOREFY_FEATURES || {};
    return localHost && features.demoAuthEnabled === true && params.get("preview") === "demo";
  }
  function isLocalDemoShortcutAllowed(){
    var location = global.location || {};
    var hostname = String(location.hostname || "").toLowerCase();
    var localHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(hostname);
    var features = global.LOREFY_FEATURES || {};
    return localHost && features.demoAuthEnabled === true;
  }
  function isEmailAuthEnabled(){
    var features = global.LOREFY_FEATURES || {};
    return !!(features.emailAuth && features.emailAuth.enabled === true);
  }
  function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function rasterDataUrl(value){ return /^data:image\/(?:jpeg|png|webp);base64,/i.test(String(value || "")); }
  function isUuid(value){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")); }
  function dataUrlFile(value){
    var parts = String(value || "").split(",");
    var mime = ((parts[0] || "").match(/^data:([^;]+);base64$/i) || [])[1];
    if (!mime || !parts[1]) throw new Error("صيغة الصورة غير مدعومة.");
    var binary = atob(parts[1]);
    var bytes = new Uint8Array(binary.length);
    for (var i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { body:bytes.buffer, type:mime.toLowerCase(), size:bytes.byteLength };
  }
  function storagePathFromUrl(value, bucket){
    value = String(value || "");
    if (!/^https?:\/\//i.test(value)) return null;
    try{
      var parsed = new URL(value);
      if (!global.LOREFY_SUPABASE || parsed.origin !== new URL(global.LOREFY_SUPABASE.url).origin) return null;
      var path = parsed.pathname;
      var markers = [
        "/storage/v1/object/sign/" + bucket + "/",
        "/storage/v1/object/authenticated/" + bucket + "/",
        "/storage/v1/object/public/" + bucket + "/"
      ];
      for (var i=0; i<markers.length; i++){
        var at = path.indexOf(markers[i]);
        if (at !== -1) return decodeURIComponent(path.slice(at + markers[i].length));
      }
    }catch(e){}
    return null;
  }

  var B = {
    mode: "demo",
    client: null,
    user: null,
    _authCbs: [],
    _recoveryCbs: [],
    _pushTimer: null,
    _origSetItem: null,
    _beforeUnload: null,
    _stateVersion: 0,
    _stateBase: {},
    initError: null,
    passwordRecovery: false,

    /* ── تهيئة ── */
    init: async function(){
      var cfg = global.LOREFY_SUPABASE;
      if (cfg && cfg.url && cfg.anonKey && !/YOUR_/.test(cfg.url+cfg.anonKey)){
        try{
          if(!global.supabase) await loadScript(SUPABASE_SDK);
          var authOptions = { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, flowType:"pkce" };
          if (global.LorefySecureAuthStorage) authOptions.storage = global.LorefySecureAuthStorage;
          this.client = global.supabase.createClient(cfg.url, cfg.anonKey, { auth:authOptions });
          this.passwordRecovery = /(?:[?#&])type=recovery(?:[&#]|$)/.test(location.href);
          var self = this;
          this.client.auth.onAuthStateChange(function(event){
            if (event === "PASSWORD_RECOVERY"){
              self.passwordRecovery = true;
              self._recoveryCbs.forEach(function(cb){ try{ cb(); }catch(e){} });
            }
          });
          this.mode = "live";
        }catch(e){
          console.error("[Lorefy] تعذّر تهيئة Supabase:", e);
          this.initError = e;
          this.mode = "unavailable";
        }
      } else {
        this.mode = isLocalDemoAllowed() ? "demo" : "unavailable";
        if (this.mode === "unavailable"){
          this.initError = new Error("Cloud accounts are not configured for this origin.");
          await this._clearInvalidSession();
        }
      }
      return this.mode;
    },

    isConfigured: function(){ return this.mode === "live"; },
    isAvailable: function(){ return this.mode !== "unavailable"; },
    _requireAvailable: function(){
      if (this.mode === "unavailable") throw new Error("الخدمة غير متاحة حالياً. حاول مرة أخرى لاحقاً.");
    },

    /* ── الجلسة الحالية ── */
    _requireEmailAuth: function(){
      if (!isEmailAuthEnabled()) throw new Error("Email/password sign-in is disabled by policy.");
    },
    getSession: async function(){
      if (this.mode === "live"){
        var r = await this.client.auth.getUser();
        var user = r && r.data && r.data.user;
        if (r.error || !user){
          await this._clearInvalidSession();
          return null;
        }
        this.user = user;
        return { userId:user.id, email:user.email, mode:"live" };
      }
      if (this.mode === "unavailable") return null;
      try{ var raw = readLS(SESSION_KEY); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
    },
    _clearInvalidSession: async function(){
      this.stopSync();
      if (this.client){
        try{ await this.client.auth.signOut({ scope:"local" }); }catch(e){}
      }
      try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
      try{ localStorage.removeItem(ONBOARDING_DRAFT_KEY); }catch(e){}
      clearUserData();
      this.user = null;
      if (window.LorefyMonitoring) window.LorefyMonitoring.setUserId(null);
      this._emit(null);
    },

    onAuth: function(cb){ this._authCbs.push(cb); },
    onPasswordRecovery: function(cb){ this._recoveryCbs.push(cb); },
    _emit: function(sess){ this._authCbs.forEach(function(cb){ try{cb(sess);}catch(e){} }); },

    /* ── OAuth providers ── */
    signInWithOAuth: async function(provider){
      provider = String(provider || "").toLowerCase();
      if (OAUTH_PROVIDERS.indexOf(provider) === -1) {
        throw new Error("Unsupported OAuth provider.");
      }
      if (this.mode === "unavailable" && isLocalDemoShortcutAllowed()){
        // Local demo shortcut: never send a development build to an external OAuth host.
        var params = new URLSearchParams(String(global.location.search || ""));
        params.set("preview", "demo");
        params.set("demo", "ready");
        global.location.search = params.toString();
        return null;
      }
      this._requireAvailable();
      if (OAUTH_PROVIDERS.indexOf(provider) === -1) {
        throw new Error("مزود تسجيل الدخول غير مدعوم.");
      }
      var configuredProviders = (global.LOREFY_FEATURES || {}).oauthProviders || {};
      if (!configuredProviders[provider] || configuredProviders[provider].enabled !== true) {
        throw new Error("مزود تسجيل الدخول غير مفعّل حالياً.");
      }
      if (this.mode === "live"){
        var redirect = new URL(location.href);
        redirect.hash = "";
        redirect.search = "";
        var r = await this.client.auth.signInWithOAuth({
          provider: provider,
          options: { redirectTo: redirect.toString() }
        });
        if (r.error) throw r.error;
        return r.data;
      }
      return this._demoSignIn({
        email: provider + "-user@example.com",
        name: "قارئ " + provider
      });
    },
    signInWithApple: async function(){
      return this.signInWithOAuth("apple");
    },

    registerAppleAuthorization: async function(authorizationCode){
      this._requireAvailable();
      if (this.mode !== "live") return { registered:true, demo:true };
      var code = String(authorizationCode || "");
      if (code.length < 10 || code.length > 4096) throw new Error("Apple authorization code is missing");
      var result = await this.client.functions.invoke("apple-authorization", {
        body:{ authorizationCode:code }
      });
      if (result.error) throw result.error;
      if (!result.data || result.data.registered !== true) throw new Error("Apple authorization was not registered");
      return result.data;
    },

    /* ── البريد: تسجيل / دخول ── */
    signUpWithEmail: async function(email, password, meta){
      this._requireAvailable();
      this._requireEmailAuth();
      if (this.mode === "live"){
        var r = await this.client.auth.signUp({ email:email, password:password, options:{ data: meta||{} } });
        if (r.error) throw r.error;
        if (r.data && r.data.session && r.data.user){
          this.user = r.data.user;
          await this._afterLogin(r.data.user.id);
        }
        return { userId: r.data && r.data.user && r.data.user.id, needsConfirm: !r.data.session };
      }
      return this._demoSignIn({ email:email, name:(meta&&meta.name)||"" });
    },

    /* ── بيانات الحساب واسم المستخدم ── */
    getAccountDefaults: async function(){
      var identity = null;
      try{ identity = JSON.parse(readLS("lorefy.identity.v1") || "null"); }catch(e){}
      if (this.mode !== "live"){
        var demoSession = await this.getSession();
        return {
          name:(identity&&identity.name)||(demoSession&&demoSession.name)||"",
          username:(identity&&identity.un)||"",
          email:(demoSession&&demoSession.email)||""
        };
      }
      var authResult = await this.client.auth.getUser();
      var authUser = authResult && authResult.data && authResult.data.user;
      if (authResult.error || !authUser) return { name:"", username:"", email:"" };
      var profileResult = await this.client.from("profiles").select("name,username").eq("id", authUser.id).maybeSingle();
      var profile = profileResult && profileResult.data;
      var meta = authUser.user_metadata || {};
      return {
        name:(identity&&identity.name)||(profile&&profile.name)||meta.name||meta.full_name||"",
        username:(identity&&identity.un)||(profile&&profile.username)||meta.username||"",
        email:authUser.email||""
      };
    },

    checkUsernameAvailable: async function(username){
      username = normalizeUsername(username);
      if (!/^[a-z0-9_]{3,24}$/.test(username)) return false;
      if (this.mode !== "live") return true;
      var authResult = await this.client.auth.getUser();
      var currentId = authResult && authResult.data && authResult.data.user && authResult.data.user.id;
      var query = this.client.from("profiles").select("id").ilike("username", username).limit(1);
      var result = await query.maybeSingle();
      if (result.error) throw result.error;
      return !result.data || result.data.id === currentId;
    },
    searchPublicProfiles: async function(query, limit){
      query = normalizeUsername(query).replace(/\s+/g, " ").slice(0, 64);
      if (query.length < 2) return [];
      if (this.mode !== "live") return [];
      var result = await this.client.rpc("search_public_profiles", {
        search_text: query,
        result_limit: Math.min(Math.max(Number(limit) || 20, 1), 20)
      });
      if (result.error) throw result.error;
      var rows = Array.isArray(result.data) ? result.data : [];
      return Promise.all(rows.map(async function(row){
        var copy = Object.assign({}, row);
        try{ copy.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, copy.avatar, PROFILE_MEDIA_TTL); }
        catch(e){ copy.avatar = ""; }
        return copy;
      }));
    },
    getFollowedProfileIds: async function(){
      if (this.mode !== "live") {
        try { return JSON.parse(readLS("lorefy.user.following.v1") || "[]"); } catch (error) { return []; }
      }
      var session = await this.getSession();
      if (!session || !session.userId) return [];
      var result = await this.client.from("profile_follows").select("following_id").eq("follower_id", session.userId).limit(500);
      if (result.error) throw result.error;
      return (result.data || []).map(function(row){ return row.following_id; });
    },
    toggleProfileFollow: async function(profileId, following){
      profileId = String(profileId || "").trim();
      if (!profileId) return false;
      following = following === true;
      if (this.mode !== "live") {
        var local = [];
        try { local = JSON.parse(readLS("lorefy.user.following.v1") || "[]"); } catch (error) {}
        local = Array.isArray(local) ? local.map(String) : [];
        local = following ? Array.from(new Set(local.concat(profileId))) : local.filter(function(id){ return id !== profileId; });
        writeLS("lorefy.user.following.v1", JSON.stringify(local.slice(0, 500)));
        return following;
      }
      var session = await this.getSession();
      if (!session || !session.userId || session.userId === profileId) return false;
      var result = following
        ? await this.client.from("profile_follows").upsert({ follower_id: session.userId, following_id: profileId }, { onConflict:"follower_id,following_id", ignoreDuplicates:true })
        : await this.client.from("profile_follows").delete().eq("follower_id", session.userId).eq("following_id", profileId);
      if (result.error) throw result.error;
      return following;
    },
    signInWithEmail: async function(email, password){
      this._requireAvailable();
      this._requireEmailAuth();
      if (this.mode === "live"){
        var r = await this.client.auth.signInWithPassword({ email:email, password:password });
        if (r.error) throw r.error;
        this.user = r.data.user;
        await this._afterLogin(r.data.user.id);
        return { userId: r.data.user.id };
      }
      return this._demoSignIn({ email:email, name:"" });
    },
    requestPasswordReset: async function(email){
      this._requireAvailable();
      this._requireEmailAuth();
      if (this.mode !== "live") return true;
      var redirect = new URL(location.href);
      redirect.hash = "";
      redirect.search = "";
      var r = await this.client.auth.resetPasswordForEmail(email, { redirectTo:redirect.toString() });
      if (r.error) throw r.error;
      return true;
    },
    updatePassword: async function(password){
      this._requireAvailable();
      if (this.mode !== "live") return true;
      var r = await this.client.auth.updateUser({ password:password });
      if (r.error) throw r.error;
      this.passwordRecovery = false;
      if (history && history.replaceState) history.replaceState(null, "", location.pathname);
      if (r.data && r.data.user){
        this.user = r.data.user;
        await this._afterLogin(r.data.user.id);
      }
      return true;
    },

    _demoSignIn: async function(info){
      var sess = { userId:"demo-"+(info.email||"user"), email:info.email||"", name:info.name||"", mode:"demo" };
      clearUserData();
      try{ localStorage.removeItem(ONBOARDING_DRAFT_KEY); }catch(e){}
      writeLS(SESSION_KEY, JSON.stringify(sess));
      this.startSync(sess.userId);
      this._emit(sess);
      return { userId: sess.userId, demo:true };
    },

    _afterLogin: async function(userId){
      if (window.LorefyMonitoring) window.LorefyMonitoring.setUserId(userId);
      await this.pull(userId);
      this.startSync(userId);
      this._emit({ userId:userId, mode:"live" });
    },

    /* ── خروج ── */
    signOut: async function(){
      this.stopSync();
      if (this.mode === "live"){ try{ await this.client.auth.signOut({ scope:"local" }); }catch(e){} }
      try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
      try{ localStorage.removeItem(ONBOARDING_DRAFT_KEY); }catch(e){}
      clearUserData();
      this.user = null;
      if (window.LorefyMonitoring) window.LorefyMonitoring.setUserId(null);
      this._emit(null);
    },

    /* ── سحب حالة المستخدم من السحابة → localStorage ── */
    pull: async function(userId){
      if (this.mode !== "live") return false;
      var pulled = false;
      var activeUser = readLS(ACTIVE_USER_KEY);
      if (activeUser && activeUser !== userId){
        clearUserData();
        try{ localStorage.removeItem(ONBOARDING_DRAFT_KEY); }catch(e){}
      }
      try{
        var r = await this.client.from("user_state").select("data,version").eq("user_id", userId).maybeSingle();
        if (r.error) throw r.error;
        var data = r && r.data && r.data.data;
        this._stateVersion = Number(r && r.data && r.data.version) || 0;
        this._stateBase = data && typeof data === "object" ? Object.assign({}, data) : {};
        clearUserData();
        writeLS(ACTIVE_USER_KEY, userId);
        if (data && typeof data === "object"){
          SYNC_KEYS.forEach(function(k){ if (data[k] != null) writeLS(k, data[k]); });
          pulled = true;
        }
      }catch(e){ console.warn("[Lorefy] pull:", e); }
      try{ await this._hydrateProfile(userId); }
      catch(e){ console.warn("[Lorefy] profile hydrate:", e); }
      return pulled;
    },

    _profileMediaPath: function(userId, kind, value, fallback){
      var fromUrl = storagePathFromUrl(value, PROFILE_MEDIA_BUCKET);
      if (fromUrl) return fromUrl;
      value = String(value || "");
      if (value.indexOf(userId + "/") === 0) return value;
      var fallbackPath = String(fallback || "");
      if (fallbackPath.indexOf(userId + "/") === 0) return fallbackPath;
      return "";
    },
    _storageHeaders: async function(contentType){
      var sessionResult = await this.client.auth.getSession();
      var session = sessionResult && sessionResult.data && sessionResult.data.session;
      if (sessionResult.error || !session || !session.access_token){
        await this._clearInvalidSession();
        throw invalidSessionError();
      }
      var headers = {
        apikey:global.LOREFY_SUPABASE.anonKey,
        authorization:"Bearer " + session.access_token
      };
      if (contentType) headers["content-type"] = contentType;
      return headers;
    },
    _storageObjectUrl: function(action, path, bucket){
      var encoded = String(path || "").split("/").map(encodeURIComponent).join("/");
      var operation = action ? action + "/" : "";
      return global.LOREFY_SUPABASE.url + "/storage/v1/object/" + operation + (bucket || PROFILE_MEDIA_BUCKET) + "/" + encoded;
    },
    _uploadProfileMedia: async function(userId, kind, value, fallback){
      if (!rasterDataUrl(value)) return this._profileMediaPath(userId, kind, value, fallback);
      var file = dataUrlFile(value);
      if (["image/jpeg","image/png","image/webp"].indexOf(file.type) === -1 || file.size > 5 * 1024 * 1024){
        throw new Error("اختر صورة JPEG أو PNG أو WebP أصغر من 5 MB.");
      }
      var extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      var path = userId + "/" + kind + "." + extension;
      var headers = await this._storageHeaders(file.type);
      headers["cache-control"] = "max-age=3600";
      headers["x-upsert"] = "true";
      var response = await fetch(this._storageObjectUrl("", path, PROFILE_MEDIA_BUCKET), {
        method:"POST",
        headers:headers,
        body:file.body
      });
      if (!response.ok){
        var problem = null;
        try{ problem = await response.json(); }catch(e){}
        throw new Error(problem && (problem.message || problem.error) || "تعذّر رفع الصورة.");
      }
      return path;
    },
    _storageMediaUrl: async function(bucket, value, ttl){
      value = String(value || "");
      if (!value) return "";
      var fromUrl = storagePathFromUrl(value, bucket);
      if (fromUrl) value = fromUrl;
      if (/^(?:data:|https?:\/\/)/i.test(value)) return "";
      var headers = await this._storageHeaders("application/json");
      var response = await fetch(this._storageObjectUrl("sign", value, bucket), {
        method:"POST",
        headers:headers,
        body:JSON.stringify({ expiresIn:ttl || PROFILE_MEDIA_TTL })
      });
      var data = null;
      try{ data = await response.json(); }catch(e){}
      if (!response.ok) throw new Error(data && (data.message || data.error) || "تعذّر تحميل الصورة.");
      return data && data.signedURL ? global.LOREFY_SUPABASE.url + "/storage/v1" + data.signedURL : "";
    },
    _profileMediaUrl: async function(value){
      return this._storageMediaUrl(PROFILE_MEDIA_BUCKET, value, PROFILE_MEDIA_TTL);
    },
    _uploadReviewMedia: async function(userId, reviewId, value){
      if (!rasterDataUrl(value)) throw new Error("Review media must be a JPEG, PNG, or WebP image.");
      var file = dataUrlFile(value);
      if (["image/jpeg","image/png","image/webp"].indexOf(file.type) === -1 || file.size > 8 * 1024 * 1024){
        throw new Error("Choose a JPEG, PNG, or WebP image smaller than 8 MB.");
      }
      var extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      var objectId = global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      var path = userId + "/" + reviewId + "/" + objectId + "." + extension;
      var headers = await this._storageHeaders(file.type);
      headers["cache-control"] = "max-age=3600";
      headers["x-upsert"] = "false";
      var response = await fetch(this._storageObjectUrl("", path, REVIEW_MEDIA_BUCKET), { method:"POST", headers:headers, body:file.body });
      if (!response.ok){
        var problem = null;
        try{ problem = await response.json(); }catch(e){}
        throw new Error(problem && (problem.message || problem.error) || "Review image upload failed.");
      }
      return path;
    },
    _removeReviewMedia: async function(paths){
      paths = (Array.isArray(paths) ? paths : []).filter(Boolean);
      if (!paths.length) return true;
      var headers = await this._storageHeaders("application/json");
      var response = await fetch(global.LOREFY_SUPABASE.url + "/storage/v1/object/" + REVIEW_MEDIA_BUCKET, {
        method:"DELETE", headers:headers, body:JSON.stringify({ prefixes:paths })
      });
      if (!response.ok){
        var problem = null;
        try{ problem = await response.json(); }catch(e){}
        throw new Error(problem && (problem.message || problem.error) || "Review image deletion failed.");
      }
      return true;
    },
    _hydrateProfile: async function(userId){
      var result = await this.client.from("profiles")
        .select("name,username,bio,avatar,banner,genres,social_links,is_private")
        .eq("id", userId)
        .maybeSingle();
      if (result.error) throw result.error;
      var profile = result.data;
      if (!profile) return false;
      var urls = [
        await this._profileMediaUrl(profile.avatar),
        await this._profileMediaUrl(profile.banner)
      ];
      var identity = {};
      try{ identity = JSON.parse(readLS("lorefy.identity.v1") || "{}") || {}; }catch(e){}
      identity = Object.assign({}, identity, {
        name:profile.name || identity.name || "",
        un:profile.username || identity.un || "",
        bio:profile.bio || "",
        avatar:urls[0] || identity.avatar || "",
        banner:urls[1] || identity.banner || "",
        avatarStoragePath:profile.avatar || "",
        bannerStoragePath:profile.banner || "",
        genres:Array.isArray(profile.genres) ? profile.genres : (identity.genres || []),
        isPrivate:profile.is_private === true
      });
      writeLS("lorefy.identity.v1", JSON.stringify(identity));
      if (profile.social_links && typeof profile.social_links === "object" && Object.keys(profile.social_links).length){
        writeLS("lorefy.user.socials.v2", JSON.stringify(profile.social_links));
      }
      return true;
    },

    /* ── دفع localStorage → السحابة (مع تأخير تجميعي) ── */
    push: async function(){
      var sess = await this.getSession();
      if (!sess) return;
      var payload = gather();
      if (this.mode === "live"){
        try{
          var base = this._stateBase || {};
          var patch = {};
          var removed = [];
          SYNC_KEYS.forEach(function(key){
            if (payload[key] !== base[key]){
              if (payload[key] == null) removed.push(key);
              else patch[key] = payload[key];
            }
          });
          if (!Object.keys(patch).length && !removed.length) return true;
          var sync = async function(expectedVersion){
            return B.client.rpc("sync_user_state", {
              state_patch: patch,
              removed_keys: removed,
              expected_version: expectedVersion
            });
          };
          var r = await sync(this._stateVersion);
          if (r.error && /state_conflict/i.test(String(r.error.message || r.error.details || ""))){
            var latest = await this.client.from("user_state").select("data,version").eq("user_id", sess.userId).maybeSingle();
            if (latest.error) throw latest.error;
            var remote = latest.data && latest.data.data && typeof latest.data.data === "object" ? latest.data.data : {};
            var overlaps = Object.keys(patch).concat(removed).some(function(key){ return remote[key] !== base[key]; });
            if (overlaps){
              var conflict = new Error("Your library changed on another device. Reopen the app before saving again.");
              conflict.code = "LOREFY_STATE_CONFLICT";
              throw conflict;
            }
            this._stateVersion = Number(latest.data && latest.data.version) || 0;
            r = await sync(this._stateVersion);
          }
          if (r.error) throw r.error;
          var row = Array.isArray(r.data) ? r.data[0] : r.data;
          this._stateVersion = Number(row && row.state_version) || (this._stateVersion + 1);
          this._stateBase = Object.assign({}, payload);
          return true;
        }catch(e){
          console.warn("[Lorefy] push:", e);
          throw e;
        }
      }
      /* في الوضع التجريبي تبقى البيانات في localStorage أصلاً */
      return this.mode === "demo";
    },

    saveProfile: async function(profile){
      this._requireAvailable();
      if (this.mode !== "live") return true;
      var authResult = await this.client.auth.getUser();
      var authUser = authResult && authResult.data && authResult.data.user;
      if (authResult.error || !authUser){
        await this._clearInvalidSession();
        throw invalidSessionError();
      }
      var currentResult = await this.client.from("profiles").select("avatar,banner,social_links,is_private").eq("id", authUser.id).maybeSingle();
      if (currentResult.error) throw currentResult.error;
      var current = currentResult.data || {};
      var media = [
        await this._uploadProfileMedia(authUser.id, "avatar", profile.avatar, current.avatar),
        await this._uploadProfileMedia(authUser.id, "banner", profile.banner, current.banner)
      ];
      var row = {
        id: authUser.id,
        username: profile.un || null,
        name: profile.name || "",
        bio: profile.bio || "",
        avatar: media[0],
        banner: media[1],
        genres: Array.isArray(profile.genres) ? profile.genres : [],
        social_links: profile.socials && typeof profile.socials === "object" ? profile.socials : (current.social_links || {}),
        is_private: typeof profile.isPrivate === "boolean" ? profile.isPrivate : current.is_private === true,
        updated_at: new Date().toISOString()
      };
      row.username = normalizeUsername(row.username);
      var r = await this.client.from("profiles").upsert(row, { onConflict: "id" });
      if (r.error){
        if (r.error.code === "23505"){
          var taken = new Error("اسم المستخدم مستخدم بالفعل.");
          taken.code = "LOREFY_USERNAME_TAKEN";
          throw taken;
        }
        if (r.error.code === "23503"){
          await this._clearInvalidSession();
          throw invalidSessionError();
        }
        throw r.error;
      }
      var view = [await this._profileMediaUrl(row.avatar), await this._profileMediaUrl(row.banner)];
      return {
        avatar:view[0], banner:view[1],
        avatarStoragePath:row.avatar, bannerStoragePath:row.banner,
        isPrivate:row.is_private
      };
    },
    setProfilePrivacy: async function(isPrivate){
      this._requireAvailable();
      isPrivate = isPrivate === true;
      if (this.mode !== "live") return isPrivate;
      var authResult = await this.client.auth.getUser();
      var authUser = authResult && authResult.data && authResult.data.user;
      if (authResult.error || !authUser){
        await this._clearInvalidSession();
        throw invalidSessionError();
      }
      var result = await this.client.from("profiles")
        .update({ is_private:isPrivate, updated_at:new Date().toISOString() })
        .eq("id", authUser.id)
        .select("is_private")
        .single();
      if (result.error) throw result.error;
      var identity = {};
      try{ identity = JSON.parse(readLS("lorefy.identity.v1") || "{}") || {}; }catch(e){}
      identity.isPrivate = result.data && result.data.is_private === true;
      writeLS("lorefy.identity.v1", JSON.stringify(identity));
      return identity.isPrivate;
    },
    publishReview: async function(review){
      this._requireAvailable();
      if (this.mode !== "live") throw new Error("Cloud review publishing is unavailable in demo mode.");
      var session = await this.getSession();
      if (!session || !session.userId) throw invalidSessionError();
      review = review || {};
      var reviewId = String(review.id || (global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : "00000000-0000-4000-8000-" + Date.now().toString().slice(-12)));
      var images = (Array.isArray(review.images) ? review.images : []).slice(0, 10);
      var uploaded = [];
      try{
        for (var i=0; i<images.length; i++) uploaded.push(await this._uploadReviewMedia(session.userId, reviewId, images[i]));
        var result = await this.client.rpc("publish_review", {
          review_id:reviewId,
          work_ref:String(review.workId || "").trim().slice(0, 200),
          review_rating:review.rating == null ? null : Math.max(0, Math.min(5, Number(review.rating))),
          review_body:String(review.body || "").trim().slice(0, 5000),
          review_recommend:review.recommend == null ? null : review.recommend === true,
          review_spoiler:review.spoiler === true,
          image_paths:uploaded,
          public_visible:review.isPublic !== false
        });
        if (result.error) throw result.error;
        var row = result.data;
        if (Array.isArray(row)) row = row[0];
        return this._hydrateReview(row || { id:reviewId, image_urls:uploaded });
      }catch(error){
        try{ await this._removeReviewMedia(uploaded); }catch(ignore){}
        throw error;
      }
    },
    _hydrateReview: async function(row){
      if (!row) return null;
      var copy = Object.assign({}, row);
      copy.images = await Promise.all((Array.isArray(row.image_urls) ? row.image_urls : []).map(async function(path){
        try{ return await B._storageMediaUrl(REVIEW_MEDIA_BUCKET, path, REVIEW_MEDIA_TTL); }catch(e){ return ""; }
      }));
      copy.images = copy.images.filter(Boolean);
      return copy;
    },
    listReviews: async function(options){
      if (this.mode !== "live") return [];
      options = options || {};
      var limit = Math.min(Math.max(Number(options.limit) || 50, 1), 100);
      var query = this.client.from("reviews")
        .select("id,user_id,work_id,rating,body,recommend,spoiler,image_urls,is_public,created_at,updated_at")
        .order("created_at", { ascending:false }).limit(limit);
      if (options.workId) query = query.eq("work_id", String(options.workId));
      if (options.userId) query = query.eq("user_id", String(options.userId));
      var result = await query;
      if (result.error) throw result.error;
      var rows = result.data || [];
      var userIds = Array.from(new Set(rows.map(function(row){ return row.user_id; }).filter(Boolean)));
      var reviewIds = rows.map(function(row){ return row.id; });
      var profileMap = {};
      var commentsByReview = {};
      var reactionsByReview = {};
      if (userIds.length){
        var profiles = await this.client.from("profiles").select("id,name,username,avatar").in("id", userIds);
        if (profiles.error) throw profiles.error;
        await Promise.all((profiles.data || []).map(async function(profile){
          try{ profile.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, profile.avatar, PROFILE_MEDIA_TTL); }catch(e){ profile.avatar = ""; }
          profileMap[profile.id] = profile;
        }));
      }
      if (reviewIds.length){
        var comments = await this.client.from("review_comments").select("id,review_id,user_id,body,created_at").in("review_id", reviewIds).eq("is_deleted", false).order("created_at", { ascending:true }).limit(500);
        if (comments.error) throw comments.error;
        var commentUserIds = (comments.data || []).map(function(comment){ return comment.user_id; }).filter(Boolean);
        var missingProfileIds = Array.from(new Set(commentUserIds)).filter(function(userId){ return !profileMap[userId]; });
        if (missingProfileIds.length){
          var commentProfiles = await this.client.from("profiles").select("id,name,username,avatar").in("id", missingProfileIds);
          if (commentProfiles.error) throw commentProfiles.error;
          await Promise.all((commentProfiles.data || []).map(async function(profile){
            try{ profile.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, profile.avatar, PROFILE_MEDIA_TTL); }catch(e){ profile.avatar = ""; }
            profileMap[profile.id] = profile;
          }));
        }
        (comments.data || []).forEach(function(comment){
          comment.profile = profileMap[comment.user_id] || null;
          (commentsByReview[comment.review_id] || (commentsByReview[comment.review_id] = [])).push(comment);
        });
        var reactions = await this.client.from("review_reactions").select("review_id,user_id,kind").in("review_id", reviewIds).limit(1000);
        if (reactions.error) throw reactions.error;
        (reactions.data || []).forEach(function(reaction){
          var stats = reactionsByReview[reaction.review_id] || (reactionsByReview[reaction.review_id] = { like:0, dislike:0, heart:0, mine:{} });
          stats[reaction.kind] = (stats[reaction.kind] || 0) + 1;
          if (B.user && reaction.user_id === B.user.id) stats.mine[reaction.kind] = true;
        });
      }
      return Promise.all(rows.map(async function(row){
        var hydrated = await B._hydrateReview(row);
        hydrated.profile = profileMap[row.user_id] || null;
        hydrated.comments = commentsByReview[row.id] || [];
        hydrated.reactions = reactionsByReview[row.id] || { like:0, dislike:0, heart:0, mine:{} };
        return hydrated;
      }));
    },
    deleteReview: async function(reviewId){
      if (this.mode !== "live") return true;
      if (!isUuid(reviewId)) return true;
      var found = await this.client.from("reviews").select("image_urls").eq("id", String(reviewId)).maybeSingle();
      if (found.error) throw found.error;
      await this._removeReviewMedia(found.data && found.data.image_urls);
      var removed = await this.client.from("reviews").delete().eq("id", String(reviewId));
      if (removed.error) throw removed.error;
      return true;
    },
    addReviewComment: async function(reviewId, body){
      if (!await this.getSession()) throw invalidSessionError();
      if (!isUuid(reviewId)) return null;
      body = String(body || "").trim().slice(0, 2000);
      if (!body) throw new Error("Comment cannot be empty.");
      var result = await this.client.rpc("publish_review_comment", { review_ref:String(reviewId), comment_body:body });
      if (result.error) throw result.error;
      return Array.isArray(result.data) ? result.data[0] : result.data;
    },
    setReviewReaction: async function(reviewId, kind, active){
      if (!await this.getSession()) throw invalidSessionError();
      if (!isUuid(reviewId)) return active !== false;
      kind = String(kind || "");
      if (["like","dislike","heart"].indexOf(kind) === -1) throw new Error("Unsupported reaction.");
      var result = await this.client.rpc("set_review_reaction", { review_ref:String(reviewId), reaction_kind:kind, reaction_active:active !== false });
      if (result.error) throw result.error;
      return active !== false;
    },
    submitReport: async function(input){
      input = input || {};
      if (this.mode !== "live") throw new Error("Cloud reporting is unavailable.");
      var result = await this.client.rpc("submit_report", {
        target_kind:String(input.targetType || "review"),
        target_ref:String(input.targetId || "").trim().slice(0, 200),
        report_reason:String(input.reason || "spam"),
        report_details:String(input.note || "").trim().slice(0, 800)
      });
      if (result.error) throw result.error;
      return { id:result.data, status:"open" };
    },
    setProfileBlock: async function(profileId, blocked){
      if (!await this.getSession()) throw invalidSessionError();
      if (!isUuid(profileId) || profileId === this.user.id) throw new Error("Invalid profile.");
      var query = this.client.from("profile_blocks");
      var result = blocked === false
        ? await query.delete().eq("blocker_id", this.user.id).eq("blocked_id", profileId)
        : await query.upsert({ blocker_id:this.user.id, blocked_id:profileId }, { onConflict:"blocker_id,blocked_id" });
      if (result.error) throw result.error;
      return blocked !== false;
    },
    completeOnboarding: async function(profile, preferences){
      this._requireAvailable();
      var cleanPreferences = {
        version:2,
        formats:Array.isArray(preferences&&preferences.formats) ? preferences.formats : [],
        genres:Array.isArray(preferences&&preferences.genres) ? preferences.genres : [],
        seedWorkIds:Array.isArray(preferences&&preferences.seedWorkIds) ? preferences.seedWorkIds.map(String) : [],
        discovery:Array.isArray(preferences&&preferences.discovery) ? preferences.discovery : [],
        onboardingVersion:2,
        completedAt:(preferences&&preferences.completedAt)||new Date().toISOString()
      };
      var cleanProfile = Object.assign({}, profile, {
        un:normalizeUsername(profile&&profile.un),
        genres:cleanPreferences.genres,
        preferences:cleanPreferences
      });
      await this.saveProfile(cleanProfile);
      writeLS("lorefy.identity.v1", JSON.stringify(cleanProfile));
      writeLS("lorefy.user.preferences.v2", JSON.stringify(cleanPreferences));
      try{ localStorage.removeItem(ONBOARDING_DRAFT_KEY); }catch(e){}
      await this.push();
      return { profile:cleanProfile, preferences:cleanPreferences };
    },
    _schedulePush: function(){
      var self = this;
      clearTimeout(this._pushTimer);
      this._pushTimer = setTimeout(function(){
        self.push().catch(function(e){ console.warn("[Lorefy] scheduled push:", e); });
      }, 1500);
    },
    _flushPush: function(){
      clearTimeout(this._pushTimer);
      this._pushTimer = null;
      return this.push().catch(function(e){ console.warn("[Lorefy] flush push:", e); });
    },

    /* ── مراقبة كتابات localStorage لدفعها تلقائياً ── */
    startSync: function(){
      if (this._origSetItem) return;            // مفعّل مسبقاً
      var self = this, orig = localStorage.setItem.bind(localStorage);
      this._origSetItem = orig;
      localStorage.setItem = function(k, v){
        orig(k, v);
        if (SYNC_KEYS.indexOf(k) !== -1) self._schedulePush();
      };
      this._visibilityHandler = function(){
        if (document.visibilityState === "hidden") self._flushPush();
        else self._schedulePush();
      };
      this._pageHideHandler = function(){ self._flushPush(); };
      document.addEventListener("visibilitychange", this._visibilityHandler);
      window.addEventListener("pagehide", this._pageHideHandler);
    },
    stopSync: function(){
      if (this._origSetItem){ localStorage.setItem = this._origSetItem; this._origSetItem = null; }
      if (this._visibilityHandler){ document.removeEventListener("visibilitychange", this._visibilityHandler); this._visibilityHandler = null; }
      if (this._pageHideHandler){ window.removeEventListener("pagehide", this._pageHideHandler); this._pageHideHandler = null; }
      clearTimeout(this._pushTimer);
    },

    /* Server-authoritative subscription state. Never fall back to localStorage. */
    getEntitlements: async function(){
      if (this.mode !== "live"){
        var billingError = new Error("Billing is not configured.");
        billingError.code = "LOREFY_BILLING_NOT_CONFIGURED";
        throw billingError;
      }
      var sess = await this.getSession();
      if (!sess) throw invalidSessionError();
      var result = await this.client.from("entitlements")
        .select("provider,product,status,expires_at,updated_at")
        .eq("user_id", sess.userId)
        .order("expires_at", { ascending:false, nullsFirst:false });
      if (result.error) throw result.error;
      return Array.isArray(result.data) ? result.data : [];
    },

    _billingError: function(message, code){
      var error = new Error(message || "Billing is not configured.");
      error.code = code || "LOREFY_BILLING_NOT_CONFIGURED";
      return error;
    },
    _billingConfig: function(){
      var billing = global.LOREFY_BILLING || {};
      if (this.mode !== "live" || billing.configured !== true || !billing.provider || billing.checkoutEnabled !== true){
        throw this._billingError();
      }
      return billing;
    },
    _billingProduct: function(product, billing){
      product = typeof product === "string" ? product : product && product.product;
      product = String(product || "").trim().toLowerCase();
      var products = Array.isArray(billing.products) ? billing.products.map(function(item){ return String(item).toLowerCase(); }) : [];
      if (!product || products.indexOf(product) === -1){
        throw this._billingError("The selected subscription product is not available.", "LOREFY_BILLING_PRODUCT_INVALID");
      }
      return product;
    },
    startCheckout: async function(product){
      var billing = this._billingConfig();
      product = this._billingProduct(product, billing);
      var functionName = String(billing.checkoutFunction || "create-checkout-session");
      if (!/^[a-z0-9-]{3,64}$/.test(functionName)) throw this._billingError();
      var result = await this.client.functions.invoke(functionName, { body:{ product:product } });
      if (result.error) throw result.error;
      return result.data;
    },
    restorePurchases: async function(){
      var billing = this._billingConfig();
      var functionName = String(billing.restoreFunction || "restore-purchases");
      if (!/^[a-z0-9-]{3,64}$/.test(functionName)) throw this._billingError();
      var result = await this.client.functions.invoke(functionName, { body:{} });
      if (result.error) throw result.error;
      return result.data;
    },

    /* ── حذف الحساب ── */
    deleteAccount: async function(){
      var sess = await this.getSession();
      if (this.mode === "live" && sess){
        var r = await this.client.functions.invoke("delete-account", { body:{ confirm:true } });
        if (r.error) throw r.error;
      }
      await this.signOut();
      return true;
    },

    SYNC_KEYS: SYNC_KEYS,
    OAUTH_PROVIDERS: OAUTH_PROVIDERS.slice()
  };

  global.LorefyBackend = B;
})(typeof window !== "undefined" ? window : this);

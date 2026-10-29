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
    "lorefy.user.profileLayout.v1",
    "lorefy.user.profileLists.v1",
    "lorefy.user.profileDecoration.v1",
    "lorefy.ui.theme.v1",
    "lorefy.library.view.v1",
    "lorefy.user.favoriteType.v1",
    "lorefy.user.library.v2",
    "lorefy.user.progress.v2",
    "lorefy.user.favorites.v2",
    "lorefy.user.profileTopCharacters.v1",
    "lorefy.user.privateReviews.v2",
    "lorefy.user.socials.v2",
    "lorefy.user.customCovers.v2",
    "lorefy.user.readLog.v1",
    "lorefy.user.readingDiary.v1",
    "lorefy.user.readingDiarySnapshot.v1",
    "lorefy.user.readingSession.v1",
    "lorefy.user.chapterReviews.v1",
    "lorefy.user.bannerPos.v2",
    "lorefy.user.avatarPos.v2",
    "lorefy.characterRatings.v1",
    "lorefy.characterReview.v1",
    "lorefy.characterCustomImages.v1",
    "lorefy.characterBoards.v1",
    "lorefy.charTopLists.v1",
    "lorefy.customLists.v1",
    "lorefy.reviewTop4.v1",
    "lorefy.review.saved.v1",
    "lorefy.reviewDetailMyDislikes.v1",
    "lorefy.communityMyLikes.v1",
    "lorefy.communityMyDislikes.v1",
    "lorefy.profile.preferenceBoards.v1",
    "lorefy.profile.preferenceBoardCovers.v1",
    "lorefy.safety.blocked.v1",
    "lorefy.safety.muted.v1"
  ];
  var SESSION_KEY = "lorefy.session.v1";   // {userId,email,mode}
  var ACTIVE_USER_KEY = "lorefy.activeUser.v1";
  var PENDING_STATE_KEY = "lorefy.pendingState.v1";
  var STATE_BASE_KEY = "lorefy.stateBase.v1";
  var ONBOARDING_DRAFT_KEY = "lorefy.onboarding.draft.v2";
  var SUPABASE_SDK = "vendor/supabase.js";
  var APPLE_AUTHORIZATION_QUEUE = "lorefy-apple-authorization-pending.v1";

  function boundedFetch(input, options) {
    var controller = new global.AbortController();
    var originalSignal = options && options.signal;
    var abort = function(){ controller.abort(); };
    if (originalSignal && originalSignal.aborted) abort();
    if (originalSignal) originalSignal.addEventListener("abort", abort, { once:true });
    var timer = global.setTimeout(abort, 15000);
    return global.fetch(input, Object.assign({}, options, { signal:controller.signal })).finally(function(){
      global.clearTimeout(timer);
      if (originalSignal) originalSignal.removeEventListener("abort", abort);
    });
  }
  var OAUTH_PROVIDERS = ["google", "apple"];
  var PROFILE_MEDIA_BUCKET = "profile-media";
  var REVIEW_MEDIA_BUCKET = "review-media";
  var PROFILE_MEDIA_TTL = 60 * 60 * 24;
  var REVIEW_MEDIA_TTL = 60 * 60;
  var ACCOUNT_STORAGE_PREFIXES = [
    "lorefy.user.", "lorefy.characterRatings.", "lorefy.characterReview.",
    "lorefy.characterCustomImages.", "lorefy.characterBoardImages.",
    "lorefy.characterBoards.", "lorefy.charTopLists.", "lorefy.customLists.",
    "lorefy.profile.preferenceBoards.", "lorefy.profile.preferenceBoardCovers.",
    "lorefy.privacy.", "lorefy.recommendations.", "lorefy.review.saved.",
    "lorefy.reviewTop4.", "lorefy.reviewDetailMyDislikes.",
    "lorefy.communityMyLikes.", "lorefy.communityMyDislikes.",
    "lorefy.safety.", "lorefy.data.corrections."
  ];

  function readLS(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function writeLS(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function readPendingState(){
    try {
      var value = JSON.parse(readLS(PENDING_STATE_KEY) || "{}") || {};
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch(e) { return {}; }
  }
  function writePendingState(pending){
    var keys = Object.keys(pending || {});
    try {
      if (keys.length) localStorage.setItem(PENDING_STATE_KEY, JSON.stringify(pending));
      else localStorage.removeItem(PENDING_STATE_KEY);
    } catch(e) {}
  }
  function stagePendingState(key, value){
    if (!isAccountStateKey(key)) return;
    var pending = readPendingState();
    pending[String(key)] = value == null ? null : String(value);
    writePendingState(pending);
  }
  function clearPendingState(keys, snapshot){
    var pending = readPendingState();
    (keys || Object.keys(pending)).forEach(function(key){
      if (!snapshot || pending[key] === snapshot[key]) delete pending[key];
    });
    writePendingState(pending);
  }
  function readStateBase(userId){
    try {
      var value = JSON.parse(readLS(STATE_BASE_KEY) || "{}") || {};
      return value && value.userId === userId ? value : null;
    } catch(e) { return null; }
  }
  function writeStateBase(userId, data, version){
    try { localStorage.setItem(STATE_BASE_KEY, JSON.stringify({ userId:userId, data:data || {}, version:Number(version) || 0 })); } catch(e) {}
  }
  function isAccountStateKey(key){
    return SYNC_KEYS.indexOf(key) !== -1 || ACCOUNT_STORAGE_PREFIXES.some(function(prefix){ return String(key || "").indexOf(prefix) === 0; });
  }
  function accountStateKeys(){
    var keys = SYNC_KEYS.slice();
    try{
      for (var index = 0; index < localStorage.length; index += 1) {
        var key = localStorage.key(index);
        if (key && isAccountStateKey(key) && keys.indexOf(key) === -1) keys.push(key);
      }
    }catch(e){}
    return keys;
  }
  function invalidSessionError(){
    var error = new Error("انتهت الجلسة أو حُذف الحساب. سجّل الدخول مجدداً.");
    error.code = "LOREFY_SESSION_INVALID";
    return error;
  }
  function mediaRequestScope(backend, expectedOwner){
    var active = readLS(ACTIVE_USER_KEY), user = backend.user && backend.user.id;
    var owner = expectedOwner || user || active;
    if (!owner || user && user !== owner || active && active !== owner) throw invalidSessionError();
    return {owner:owner, active:active, client:backend.client, epoch:backend._communityEpoch};
  }
  function mediaRequestCurrent(backend, request){
    return backend.mode === "live" && global.LorefyBackend === backend &&
      backend.client === request.client && backend._communityEpoch === request.epoch &&
      (backend.user && backend.user.id) === request.owner && readLS(ACTIVE_USER_KEY) === request.active;
  }
  function assertMediaRequest(backend, request){
    if (!mediaRequestCurrent(backend, request)) throw invalidSessionError();
  }
  function sessionReadScope(backend){
    return {mode:backend.mode, client:backend.client, epoch:backend._communityEpoch,
      user:backend.user && backend.user.id, active:readLS(ACTIVE_USER_KEY)};
  }
  function sessionReadCurrent(backend, request){
    return !!request && global.LorefyBackend === backend && backend.mode === request.mode &&
      backend.client === request.client && backend._communityEpoch === request.epoch &&
      (backend.user && backend.user.id) === request.user && readLS(ACTIVE_USER_KEY) === request.active;
  }
  function assertSessionRead(backend, request){
    if (!sessionReadCurrent(backend, request)) throw invalidSessionError();
  }
  function reviewConflictError(){
    var error = new Error("لديك مراجعة سابقة لهذا العمل. حدّث مراجعتك بدلاً من إنشاء مراجعة ثانية.");
    error.code = "LOREFY_REVIEW_ALREADY_EXISTS";
    return error;
  }
  function isReviewConflict(error){
    var text = String(error && (error.message || error.details || error.hint) || "");
    return error && error.code === "23505" && /reviews_user_work_unique_idx|user.*work/i.test(text) ||
      /reviews_user_work_unique_idx|duplicate key value violates unique constraint/i.test(text);
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
    try{ localStorage.removeItem(PENDING_STATE_KEY); localStorage.removeItem(STATE_BASE_KEY); }catch(e){}
  }
  function canReuseLocalAccountState(activeUser, userId){
    return !!activeUser && activeUser === userId;
  }
  function normalizeUsername(value){
    return String(value || "").replace(/^@/, "").trim().toLowerCase();
  }
  function gather(){
    var o={}; accountStateKeys().forEach(function(k){ var v=readLS(k); if(v!=null) o[k]=v; });
    var appearance=global.LorefyPublicAppearance;
    if(appearance && Array.isArray(global.LorefyMangaData) && global.LorefyMangaData.length){
      o['lorefy.user.favoriteType.v1']=JSON.stringify(appearance.fromState(o,global.LorefyMangaData));
    }
    return o;
  }
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
    _notificationChannel: null,
    _communitySubscription: null,
    _communityClosing: null,
    _communityEpoch: 0,
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
          var clientOptions = { auth:authOptions };
          if (global.fetch && global.AbortController) clientOptions.global = { fetch:boundedFetch };
          this.client = global.supabase.createClient(cfg.url, cfg.anonKey, clientOptions);
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
      if (this._sessionCheck && sessionReadCurrent(this, this._sessionCheckScope)) return this._sessionCheck;
      var request = sessionReadScope(this), pending = this._readSession();
      this._sessionCheck = pending;
      this._sessionCheckScope = request;
      try { return await pending; }
      finally {
        if (this._sessionCheck === pending) { this._sessionCheck = null; this._sessionCheckScope = null; }
      }
    },
    _readSession: async function(){
      if (this.mode === "live"){
        var request = sessionReadScope(this);
        // Signed-out screens must not call /user and /logout on every render.
        if (typeof this.client.auth.getSession === "function") {
          var saved = await this.client.auth.getSession();
          assertSessionRead(this, request);
          if (saved.error) throw saved.error;
          if (!saved.data || !saved.data.session) { this.user = null; return null; }
        }
        var r = await this.client.auth.getUser();
        assertSessionRead(this, request);
        var user = r && r.data && r.data.user;
        if (r.error && !["session_not_found", "refresh_token_not_found", "refresh_token_already_used", "bad_jwt", "user_not_found"].includes(r.error.code) && r.error.name !== "AuthSessionMissingError") {
          // Network/rate-limit/server errors are not proof that the saved identity is invalid.
          throw r.error;
        }
        if (r.error || !user){
          await this._clearInvalidSession();
          return null;
        }
        var expectedOwner = request.user || request.active;
        if (expectedOwner && user.id !== expectedOwner) throw invalidSessionError();
        this.user = user;
        this._sessionCleared = false;
        this.flushAppleAuthorization(user.id).catch(function(){
          console.warn("[Lorefy] Apple authorization retry deferred.");
        });
        return { userId:user.id, email:user.email, mode:"live" };
      }
      if (this.mode === "unavailable") return null;
      try{ var raw = readLS(SESSION_KEY); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
    },
    _clearInvalidSession: async function(){
      if (this._sessionCleared && sessionReadCurrent(this, this._clearedSessionScope)) return;
      var request = sessionReadScope(this);
      this._sessionCleared = true;
      this._clearedSessionScope = request;
      this.stopSync();
      assertSessionRead(this, request);
      this._communityEpoch += 1;
      this._mediaUrlCache = null;
      request.epoch = this._communityEpoch;
      await this._stopCommunitySubscription();
      assertSessionRead(this, request);
      await this._stopNotificationSubscription();
      assertSessionRead(this, request);
      if (request.client){
        try{ await request.client.auth.signOut({ scope:"local" }); }catch(e){}
      }
      assertSessionRead(this, request);
      try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
      try{ localStorage.removeItem(ONBOARDING_DRAFT_KEY); }catch(e){}
      clearUserData();
      this.user = null;
      this._clearedSessionScope = sessionReadScope(this);
      if (window.LorefyMonitoring) {
        window.LorefyMonitoring.setUserId(null);
        window.LorefyMonitoring.clear();
      }
      this._emit(null);
    },
    _stopNotificationSubscription: function(){
      var channel = this._notificationChannel;
      var client = this._notificationChannelClient || this.client;
      this._notificationChannel = null;
      this._notificationChannelClient = null;
      if (!channel || !client) return Promise.resolve();
      try{ return Promise.resolve(client.removeChannel(channel)).catch(function(){}); }
      catch(e){ return Promise.resolve(); }
    },

    onAuth: function(cb){
      var self=this, active=true;
      var listener=function(session){if(active)cb(session);};
      this._authCbs.push(listener);
      return function(){active=false;self._authCbs=self._authCbs.filter(function(fn){return fn!==listener;});};
    },
    onPasswordRecovery: function(cb){ this._recoveryCbs.push(cb); },
    _emit: function(sess){ this._authCbs.forEach(function(cb){ try{cb(sess);}catch(e){} }); },

    /* ── OAuth providers ── */
    signInWithOAuth: async function(provider){
      provider = String(provider || "").toLowerCase();
      if (OAUTH_PROVIDERS.indexOf(provider) === -1) {
        throw new Error("Unsupported OAuth provider.");
      }
      if (global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform()) {
        throw new Error("تسجيل الدخول غير جاهز. أعد فتح التطبيق وحاول مجدداً.");
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

    queueAppleAuthorization: async function(authorizationCode){
      if (!global.LorefySecureAuthStorage || !this.user) throw new Error("Native authorization storage is unavailable");
      await global.LorefySecureAuthStorage.setItem(APPLE_AUTHORIZATION_QUEUE, JSON.stringify({
        userId:this.user.id, code:String(authorizationCode), createdAt:Date.now()
      }));
    },
    flushAppleAuthorization: async function(userId){
      if (!global.LorefySecureAuthStorage || this._appleAuthorizationRunning) return;
      this._appleAuthorizationRunning = true;
      try {
        var raw = await global.LorefySecureAuthStorage.getItem(APPLE_AUTHORIZATION_QUEUE);
        if (!raw) return;
        var pending = JSON.parse(raw);
        if (Date.now() - pending.createdAt > 4 * 60 * 1000) {
          await global.LorefySecureAuthStorage.removeItem(APPLE_AUTHORIZATION_QUEUE);
          return;
        }
        if (pending.userId !== userId) return;
        await this.registerAppleAuthorization(pending.code);
        await global.LorefySecureAuthStorage.removeItem(APPLE_AUTHORIZATION_QUEUE);
      } finally { this._appleAuthorizationRunning = false; }
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
        name:(profile&&profile.name)||meta.name||meta.full_name||"",
        username:(profile&&profile.username)||"",
        email:authUser.email||""
      };
    },

    checkUsernameAvailable: async function(username){
      username = normalizeUsername(username);
      if (!/^[a-z0-9_]{3,24}$/.test(username)) return false;
      if (this.mode !== "live") return true;
      var result = await this.client.rpc("username_is_available", { requested_username:username });
      if (result.error) throw result.error;
      return result.data === true;
    },
    searchPublicProfiles: async function(query, limit){
      query = normalizeUsername(query).replace(/\s+/g, " ").slice(0, 64);
      if (query.length < 2) return [];
      if (this.mode !== "live") return [];
      var request = mediaRequestScope(this);
      var result = await this.client.rpc("search_public_readers", {
        search_text: query,
        result_limit: Math.min(Math.max(Number(limit) || 20, 1), 20)
      });
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      var rows = Array.isArray(result.data) ? result.data : [];
      var profiles = await Promise.all(rows.map(async function(row){
        var copy = Object.assign({}, row);
        try{ copy.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, copy.avatar, PROFILE_MEDIA_TTL); }
        catch(e){ copy.avatar = ""; }
        return copy;
      }));
      assertMediaRequest(this, request);
      return profiles;
    },
    getFollowedProfileIds: async function(){
      if (this.mode !== "live") {
        try { return JSON.parse(readLS("lorefy.user.following.v1") || "[]"); } catch (error) { return []; }
      }
      var request = mediaRequestScope(this);
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (session && session.userId !== request.owner) throw invalidSessionError();
      if (!session || !session.userId) return [];
      var result = await this.client.from("profile_follows").select("following_id").eq("follower_id", session.userId).limit(500);
      assertMediaRequest(this, request);
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
      var request = mediaRequestScope(this);
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (session && session.userId !== request.owner) throw invalidSessionError();
      if (!session || !session.userId || session.userId === profileId) return false;
      var result = following
        ? await this.client.from("profile_follows").upsert({ follower_id: session.userId, following_id: profileId }, { onConflict:"follower_id,following_id", ignoreDuplicates:true })
        : await this.client.from("profile_follows").delete().eq("follower_id", session.userId).eq("following_id", profileId);
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return following;
    },
    getPublicProfile: async function(profileId){
      profileId = String(profileId || "").trim();
      if (this.mode !== "live" || !isUuid(profileId)) return null;
      var request = mediaRequestScope(this);
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (session && session.userId !== request.owner) throw invalidSessionError();
      if (!session) return null;
      var result = await this.client.rpc("get_public_profile_social", { profile_ref:profileId });
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      var row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!row) return null;
      var copy = Object.assign({}, row);
      var artwork = await this.client.rpc("get_public_profile_artwork", { profile_ref:profileId });
      assertMediaRequest(this, request);
      if (artwork.error) throw artwork.error;
      Object.assign(copy, artwork.data || {});
      var appearance = await this.client.rpc("get_public_profile_appearance", { profile_ref:profileId });
      assertMediaRequest(this, request);
      if (appearance.error) throw appearance.error;
      Object.assign(copy, appearance.data || {});
      // Lists are a narrow public projection, never a read of another user's state.
      try {
        var lists = await this.client.rpc("get_public_profile_lists", { profile_ref:profileId });
        if (lists.error) throw lists.error;
        copy.profile_lists = Array.isArray(lists.data) ? lists.data : [];
      } catch (error) {
        copy.profile_lists = [];
        copy.profile_lists_error = true;
      }
      assertMediaRequest(this, request);
      // Resolve only this owner's projected artwork, never the viewer's choices.
      for (var artworkKey of ["custom_work_covers", "custom_character_images"]){
        var images = copy[artworkKey] || {};
        await Promise.all(Object.keys(images).map(async function(key){
          var value = String(images[key] || "");
          if (value.indexOf("lorefy-artwork:") !== 0) return;
          try{ images[key] = await B._storageMediaUrl("custom-covers", value.slice(15), PROFILE_MEDIA_TTL); }
          catch(e){ delete images[key]; }
        }));
        assertMediaRequest(this, request);
      }
      try{
        var posts = await this.client.from("community_posts").select("id", { count:"exact", head:true }).eq("user_id", profileId).is("parent_id", null).eq("is_deleted", false);
        if (!posts.error) copy.post_count = Number(posts.count) || 0;
      }catch(e){ copy.post_count = Number(copy.post_count) || 0; }
      assertMediaRequest(this, request);
      try{ copy.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, copy.avatar, PROFILE_MEDIA_TTL); }catch(e){ copy.avatar = ""; }
      assertMediaRequest(this, request);
      try{ copy.banner = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, copy.banner, PROFILE_MEDIA_TTL); }catch(e){ copy.banner = ""; }
      assertMediaRequest(this, request);
      return copy;
    },
    _listProfileConnections: async function(profileId, kind, limit, offset){
      profileId = String(profileId || "").trim();
      if (this.mode !== "live" || !isUuid(profileId)) return [];
      var request = mediaRequestScope(this);
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (session && session.userId !== request.owner) throw invalidSessionError();
      if (!session) return [];
      var result = await this.client.rpc("list_profile_connections", {
        profile_ref:profileId,
        connection_kind:kind,
        result_limit:Math.min(Math.max(Number(limit) || 100, 1), 200),
        result_offset:Math.min(Math.max(Number(offset) || 0, 0), 10000)
      });
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      var rows = Array.isArray(result.data) ? result.data : [];
      var connections = await Promise.all(rows.map(async function(row){
        var copy = Object.assign({}, row);
        try{ copy.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, copy.avatar, PROFILE_MEDIA_TTL); }catch(e){ copy.avatar = ""; }
        return copy;
      }));
      assertMediaRequest(this, request);
      return connections;
    },
    listProfileFollowers: async function(profileId, limit, offset){
      return this._listProfileConnections(profileId, "followers", limit, offset);
    },
    listProfileFollowing: async function(profileId, limit, offset){
      return this._listProfileConnections(profileId, "following", limit, offset);
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
      if (global.LorefyArtwork) await global.LorefyArtwork.hydrate(userId);
      this._emit({ userId:userId, mode:"live" });
    },

    /* ── خروج ── */
    signOut: async function(){
      var request = sessionReadScope(this);
      this.stopSync();
      assertSessionRead(this, request);
      this._communityEpoch += 1;
      this._mediaUrlCache = null;
      request.epoch = this._communityEpoch;
      await this._stopCommunitySubscription();
      assertSessionRead(this, request);
      var installationId = readLS("lorefy.native.installation.v1");
      if (this.mode === "live" && isUuid(installationId)){
        try{ await this.unregisterPushDevice(installationId); }catch(e){}
      }
      assertSessionRead(this, request);
      await this._stopNotificationSubscription();
      assertSessionRead(this, request);
      if (this.mode === "live"){ try{ await request.client.auth.signOut({ scope:"local" }); }catch(e){} }
      assertSessionRead(this, request);
      try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
      try{ localStorage.removeItem(ONBOARDING_DRAFT_KEY); }catch(e){}
      clearUserData();
      this.user = null;
      if (window.LorefyMonitoring) {
        window.LorefyMonitoring.setUserId(null);
        window.LorefyMonitoring.clear();
      }
      this._emit(null);
    },

    /* ── سحب حالة المستخدم من السحابة → localStorage ── */
    refreshAccount: async function(options){
      options = options || {};
      if (this.mode !== "live") return this.mode === "demo";
      var request = mediaRequestScope(this), backend = this;
      if (request.active !== request.owner) throw invalidSessionError();
      var current = function(){ return mediaRequestCurrent(backend, request) && (!options.active || options.active()); };
      if (!current()) throw invalidSessionError();
      if (this._accountRefresh && this._accountRefresh.current()) return this._accountRefresh.promise;
      var before = gather(), job = {current:current};
      job.promise = (async function(){
        try {
          await backend.pull(request.owner, {strict:true, current:current});
          if (!current()) throw invalidSessionError();
          return true;
        } finally {
          if (current()) {
            var after = gather();
            Object.keys(Object.assign({}, before, after)).forEach(function(key){
              if (before[key] !== after[key] && global.dispatchEvent && global.CustomEvent)
                global.dispatchEvent(new global.CustomEvent("lorefy:stored-state", {detail:{key:key}}));
            });
          }
          if (backend._accountRefresh === job) backend._accountRefresh = null;
        }
      })();
      this._accountRefresh = job;
      return job.promise;
    },
    pull: async function(userId, options){
      options = options || {};
      if (this.mode !== "live") return false;
      var pulled = false;
      var activeUser = readLS(ACTIVE_USER_KEY);
      var mayKeepLocalState = canReuseLocalAccountState(activeUser, userId);
      var localState = mayKeepLocalState ? gather() : {};
      var pending = mayKeepLocalState ? readPendingState() : {};
      var knownBase = mayKeepLocalState ? readStateBase(userId) : null;
      if (!mayKeepLocalState) clearUserData();
      if (activeUser && activeUser !== userId){
        try{ localStorage.removeItem(ONBOARDING_DRAFT_KEY); }catch(e){}
      }
      writeLS(ACTIVE_USER_KEY, userId);
      var pullGeneration = this._pullGeneration = (this._pullGeneration || 0) + 1;
      try{
        var r = await this.client.from("user_state").select("data,version").eq("user_id", userId).maybeSingle();
        if (options.current && !options.current()) throw invalidSessionError();
        if (this._pullGeneration !== pullGeneration || readLS(ACTIVE_USER_KEY) !== userId) {
          if (options.strict) throw invalidSessionError();
          return false;
        }
        if (r.error) throw r.error;
        // Writes can arrive while the network request is pending. Never apply
        // a pre-request journal over a newer rating or deletion.
        if (mayKeepLocalState) {
          localState = gather();
          pending = readPendingState();
          // Recover writes made before the observer attached, using the last
          // acknowledged snapshot. Account ownership was checked above.
          if (knownBase && knownBase.data) {
            var base = knownBase.data;
            Object.keys(Object.assign({}, base, localState)).forEach(function(k){
              if (!isAccountStateKey(k) || Object.prototype.hasOwnProperty.call(pending, k)) return;
              var localValue = localState[k] == null ? null : localState[k];
              var baseValue = base[k] == null ? null : base[k];
              if (localValue !== baseValue) {
                pending[k] = localValue;
                stagePendingState(k, localValue);
              }
            });
          }
        }
        var data = r && r.data && r.data.data;
        var stateVersion = Number(r && r.data && r.data.version) || 0;
        var hasRemoteState = !!(r && r.data && data && typeof data === "object" &&
          (stateVersion > 0 || Object.keys(data).length > 0));
        this._stateVersion = stateVersion;
        this._stateBase = data && typeof data === "object" ? Object.assign({}, data) : {};
        writeLS(ACTIVE_USER_KEY, userId);
        if (hasRemoteState){
          this._isApplyingRemote = true;
          try {
            var preserveLocal = mayKeepLocalState && (Object.keys(pending).length > 0 || (!knownBase && Object.keys(localState).length > 0));
            if (!preserveLocal) {
              clearUserData();
              writeLS(ACTIVE_USER_KEY, userId);
              Object.keys(data).forEach(function(k){ if (isAccountStateKey(k) && data[k] != null) writeLS(k, data[k]); });
              clearPendingState();
            } else {
              // With an acknowledged base, remote absence is a deletion too.
              // Never apply it over a local edit or guess without that base.
              Object.keys(Object.assign({}, knownBase && knownBase.data, localState, data)).forEach(function(k){
                if (!isAccountStateKey(k) || Object.prototype.hasOwnProperty.call(pending, k)) return;
                if (knownBase) {
                  if (data[k] == null) localStorage.removeItem(k);
                  else writeLS(k, data[k]);
                } else if (localState[k] == null && data[k] != null) writeLS(k, data[k]);
              });
              Object.keys(pending).forEach(function(k){
                if (!isAccountStateKey(k)) return;
                if (pending[k] == null) localStorage.removeItem(k);
                else writeLS(k, pending[k]);
              });
            }
          } finally { this._isApplyingRemote = false; }
          writeStateBase(userId, this._stateBase, stateVersion);
          pulled = true;
        } else if (!mayKeepLocalState) {
          clearUserData();
          writeLS(ACTIVE_USER_KEY, userId);
          clearPendingState();
          writeStateBase(userId, {}, stateVersion);
        }
      }catch(e){ if (options.strict) throw e; console.warn("[Lorefy] pull:", e); }
      if (options.current && !options.current()) throw invalidSessionError();
      try{ await this._hydrateProfile(userId, options); }
      catch(e){ if (options.strict) throw e; console.warn("[Lorefy] profile hydrate:", e); }
      return pulled;
    },

    _profileMediaPath: function(userId, kind, value, fallback){
      if (value === "") return "";
      var fromUrl = storagePathFromUrl(value, PROFILE_MEDIA_BUCKET);
      if (fromUrl) return fromUrl;
      value = String(value || "");
      if (value.indexOf(userId + "/") === 0) return value;
      var fallbackPath = String(fallback || "");
      if (fallbackPath.indexOf(userId + "/") === 0) return fallbackPath;
      return "";
    },
    _storageHeaders: async function(contentType, expectedOwner){
      var client = this.client, epoch = this._communityEpoch, user = this.user && this.user.id;
      var active = readLS(ACTIVE_USER_KEY);
      expectedOwner = expectedOwner || user || active;
      var sessionResult = await client.auth.getSession();
      // A delayed auth failure belongs to its opening session, not the next one.
      if (this.client !== client || this._communityEpoch !== epoch ||
          (this.user && this.user.id) !== user || readLS(ACTIVE_USER_KEY) !== active) throw invalidSessionError();
      var session = sessionResult && sessionResult.data && sessionResult.data.session;
      if (expectedOwner && (user && user !== expectedOwner || active && active !== expectedOwner ||
          session && (!session.user || session.user.id !== expectedOwner))) throw invalidSessionError();
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
      var request = mediaRequestScope(this, userId);
      var extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      var path = userId + "/" + kind + "." + extension;
      var headers = await this._storageHeaders(file.type, userId);
      assertMediaRequest(this, request);
      headers["cache-control"] = "max-age=0";
      headers["x-upsert"] = "true";
      this._mediaUrlCache = null;
      var response = await fetch(this._storageObjectUrl("", path, PROFILE_MEDIA_BUCKET), {
        method:"POST",
        headers:headers,
        body:file.body
      });
      assertMediaRequest(this, request);
      if (!response.ok){
        var problem = null;
        try{ problem = await response.json(); }catch(e){}
        throw new Error(problem && (problem.message || problem.error) || "تعذّر رفع الصورة.");
      }
      this._mediaUrlCache = null;
      return path;
    },
    _storageMediaUrl: async function(bucket, value, ttl){
      value = String(value || "");
      if (!value) return "";
      var fromUrl = storagePathFromUrl(value, bucket);
      if (fromUrl) value = fromUrl;
      if (/^(?:data:|https?:\/\/)/i.test(value)) return "";
      // The viewer owns this request; the image may belong to a permitted reader.
      var request = mediaRequestScope(this);
      var headers = await this._storageHeaders("application/json", request.owner);
      assertMediaRequest(this, request);
      var base = global.LOREFY_SUPABASE.url, lifetime = ttl || PROFILE_MEDIA_TTL;
      var cache = this._mediaUrlCache;
      if (!cache || cache.owner !== request.owner || cache.active !== request.active ||
          cache.client !== request.client || cache.epoch !== request.epoch || cache.base !== base){
        cache = this._mediaUrlCache = {owner:request.owner, active:request.active,
          client:request.client, epoch:request.epoch, base:base, entries:new Map()};
      }
      var key = JSON.stringify([bucket, value, lifetime]), now = Date.now();
      var entry = cache.entries.get(key), self = this;
      if (!entry || !entry.pending && entry.expires <= now){
        cache.entries.delete(key);
        while (cache.entries.size >= 256) cache.entries.delete(cache.entries.keys().next().value);
        // Reuse exact tokens for Smart CDN, without persisting them or extending their lifetime.
        entry = {pending:true, expires:now + Math.max(0, Math.min(60000, lifetime * 1000 - 5000))};
        cache.entries.set(key, entry);
        entry.promise = (async function(){
          try {
            var response = await fetch(self._storageObjectUrl("sign", value, bucket), {
              method:"POST", headers:headers, body:JSON.stringify({ expiresIn:lifetime })
            });
            assertMediaRequest(self, request);
            var data = null;
            try{ data = await response.json(); }catch(e){}
            assertMediaRequest(self, request);
            if (!response.ok) throw new Error(data && (data.message || data.error) || "تعذّر تحميل الصورة.");
            var url = data && data.signedURL ? base + "/storage/v1" + data.signedURL : "";
            if (!url && cache.entries.get(key) === entry) cache.entries.delete(key);
            return url;
          } catch(e) {
            if (cache.entries.get(key) === entry) cache.entries.delete(key);
            throw e;
          } finally { entry.pending = false; }
        })();
      }
      var result = await entry.promise;
      assertMediaRequest(this, request);
      return result;
    },
    _profileMediaUrl: async function(value){
      return this._storageMediaUrl(PROFILE_MEDIA_BUCKET, value, PROFILE_MEDIA_TTL);
    },
    _resolveArtworkAttachment: async function(attachment){
      var request = this.mode === "live" ? mediaRequestScope(this) : null;
      var copy = Object.assign({}, attachment || {});
      var resolveImage = async function(value){
        if (typeof value !== "string" || value.indexOf("lorefy-artwork:") !== 0) return value;
        try{ return await B._storageMediaUrl("custom-covers", value.slice(15), PROFILE_MEDIA_TTL); }
        catch(e){ return ""; }
      };
      if (copy.image) copy.image = await resolveImage(copy.image);
      if (request) assertMediaRequest(this, request);
      if (Array.isArray(copy.items)) copy.items = await Promise.all(copy.items.slice(0,10).map(async function(item){
        return Object.assign({}, item, {image:await resolveImage(item.image)});
      }));
      if (request) assertMediaRequest(this, request);
      return copy;
    },
    _uploadReviewMedia: async function(userId, reviewId, value){
      if (!rasterDataUrl(value)) throw new Error("Review media must be a JPEG, PNG, or WebP image.");
      var file = dataUrlFile(value);
      if (["image/jpeg","image/png","image/webp"].indexOf(file.type) === -1 || file.size > 8 * 1024 * 1024){
        throw new Error("Choose a JPEG, PNG, or WebP image smaller than 8 MB.");
      }
      var request = mediaRequestScope(this, userId);
      var extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      var objectId = global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      var path = userId + "/" + reviewId + "/" + objectId + "." + extension;
      var headers = await this._storageHeaders(file.type, userId);
      assertMediaRequest(this, request);
      headers["cache-control"] = "max-age=3600";
      headers["x-upsert"] = "false";
      var response = await fetch(this._storageObjectUrl("", path, REVIEW_MEDIA_BUCKET), { method:"POST", headers:headers, body:file.body });
      assertMediaRequest(this, request);
      if (!response.ok){
        var problem = null;
        try{ problem = await response.json(); }catch(e){}
        throw new Error(problem && (problem.message || problem.error) || "Review image upload failed.");
      }
      return path;
    },
    _uploadCustomArtwork: async function(userId, kind, value){
      if (!rasterDataUrl(value) || ["covers", "characters"].indexOf(kind) === -1) throw new Error("Invalid artwork image.");
      var file = dataUrlFile(value);
      if (["image/jpeg","image/png","image/webp"].indexOf(file.type) === -1 || file.size > 5 * 1024 * 1024) throw new Error("اختر صورة أصغر من 5 MB.");
      var request = mediaRequestScope(this, userId);
      var extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      var objectId = global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      var objectPath = userId + "/" + kind + "/" + objectId + "." + extension;
      var headers = await this._storageHeaders(file.type, userId);
      assertMediaRequest(this, request);
      headers["cache-control"] = "max-age=3600";
      headers["x-upsert"] = "false";
      var response = await fetch(this._storageObjectUrl("", objectPath, "custom-covers"), {method:"POST", headers:headers, body:file.body});
      assertMediaRequest(this, request);
      if (!response.ok){
        var problem = null;
        try{ problem = await response.json(); }catch(e){}
        throw new Error(problem && (problem.message || problem.error) || "تعذر رفع الصورة. حاول مجددًا.");
      }
      return objectPath;
    },
    _removeReviewMedia: async function(paths){
      paths = (Array.isArray(paths) ? paths : []).filter(Boolean);
      if (!paths.length) return true;
      var request = mediaRequestScope(this);
      var headers = await this._storageHeaders("application/json", request.owner);
      assertMediaRequest(this, request);
      this._mediaUrlCache = null;
      var response = await fetch(global.LOREFY_SUPABASE.url + "/storage/v1/object/" + REVIEW_MEDIA_BUCKET, {
        method:"DELETE", headers:headers, body:JSON.stringify({ prefixes:paths })
      });
      assertMediaRequest(this, request);
      if (!response.ok){
        var problem = null;
        try{ problem = await response.json(); }catch(e){}
        throw new Error(problem && (problem.message || problem.error) || "Review image deletion failed.");
      }
      this._mediaUrlCache = null;
      return true;
    },
    _hydrateProfile: async function(userId, options){
      options = options || {};
      var generation = this._pullGeneration;
      var identityAtStart = readLS("lorefy.identity.v1");
      var socialsAtStart = readLS("lorefy.user.socials.v2");
      var backend = this;
      var current = function(){
        return (!options.current || options.current()) && readLS(ACTIVE_USER_KEY) === userId && backend._pullGeneration === generation
          && readLS("lorefy.identity.v1") === identityAtStart
          && !Object.prototype.hasOwnProperty.call(readPendingState(), "lorefy.identity.v1");
      };
      if (!current()) return false;
      var result = await this.client.from("profiles")
        .select("name,username,bio,avatar,banner,genres,social_links,is_private")
        .eq("id", userId)
        .maybeSingle();
      if (!current()) return false;
      if (result.error) throw result.error;
      var profile = result.data;
      if (!profile) return false;
      var urls = [
        await this._profileMediaUrl(profile.avatar),
        await this._profileMediaUrl(profile.banner)
      ];
      if (!current()) return false;
      var identity = {};
      try{ identity = JSON.parse(readLS("lorefy.identity.v1") || "{}") || {}; }catch(e){}
      identity = Object.assign({}, identity, {
        name:profile.name || identity.name || "",
        un:profile.username || identity.un || "",
        bio:profile.bio || "",
        // A cleared or unresolved server image must not resurrect cached artwork.
        avatar:urls[0] || "",
        banner:urls[1] || "",
        avatarStoragePath:profile.avatar || "",
        bannerStoragePath:profile.banner || "",
        genres:Array.isArray(profile.genres) ? profile.genres : (identity.genres || []),
        isPrivate:profile.is_private === true
      });
      // Hydration is a remote read, not a new user edit. Suppress observation
      // only for these synchronous writes, never while awaiting the network.
      var applyingRemote = this._isApplyingRemote;
      this._isApplyingRemote = true;
      try {
        writeLS("lorefy.identity.v1", JSON.stringify(identity));
        if (readLS("lorefy.user.socials.v2") === socialsAtStart && profile.social_links && typeof profile.social_links === "object" && Object.keys(profile.social_links).length){
          writeLS("lorefy.user.socials.v2", JSON.stringify(profile.social_links));
        }
      } finally { this._isApplyingRemote = applyingRemote; }
      return true;
    },

    /* ── دفع localStorage → السحابة (مع تأخير تجميعي) ── */
    push: async function(){
      if (this._pushRunning) {
        await this._pushRunning;
        return this.push();
      }
      this._pushRunning = this._pushState();
      try { return await this._pushRunning; }
      finally { this._pushRunning = null; }
    },
    _pushState: async function(){
      var owner = readLS(ACTIVE_USER_KEY);
      var generation = this._pullGeneration;
      var backend = this;
      var current = function(){
        return readLS(ACTIVE_USER_KEY) === owner && backend._pullGeneration === generation;
      };
      var sess = await this.getSession();
      if (!sess) return;
      if (!current() || (this.mode === "live" && owner !== sess.userId)) return false;
      var payload = gather();
      var pendingAtStart = readPendingState();
      var status = function(value){
        if (!current()) return;
        backend._syncStatus = value;
        if (typeof global !== "undefined" && global.dispatchEvent && global.CustomEvent) global.dispatchEvent(new global.CustomEvent("lorefy:sync-status", {detail:{status:value}}));
      };
      if (this.mode === "live"){
        status("syncing");
        try{
          var base = this._stateBase || {};
          var patch = {};
          var removed = [];
          var stateKeys = accountStateKeys();
          // Removed dynamic keys no longer appear in the storage enumeration.
          Object.keys(base).concat(Object.keys(pendingAtStart)).forEach(function(key){
            if (stateKeys.indexOf(key) === -1 && isAccountStateKey(key)) stateKeys.push(key);
          });
          stateKeys.forEach(function(key){
            if (payload[key] !== base[key]){
              if (payload[key] == null) removed.push(key);
              else patch[key] = payload[key];
            }
          });
          if (!Object.keys(patch).length && !removed.length) {
            clearPendingState(Object.keys(pendingAtStart), pendingAtStart);
            writeStateBase(sess.userId, payload, this._stateVersion);
            status("synced");
            return true;
          }
          var batchPatch = {}, batchRemoved = [];
          var sync = async function(expectedVersion){
            return B.client.rpc("sync_user_state", {
              state_patch: batchPatch,
              removed_keys: batchRemoved,
              expected_version: expectedVersion
            });
          };
          var changes = Object.keys(patch).concat(removed);
          // The deployed RPC accepts at most 20 keys per patch. A new account
          // has more than 20 persisted fields even before its first rating.
          for (var offset = 0; offset < changes.length; offset += 20) {
          if (!current()) return false;
          var batchKeys = changes.slice(offset, offset + 20);
          batchPatch = {}; batchRemoved = [];
          batchKeys.forEach(function(key){
            if (Object.prototype.hasOwnProperty.call(patch,key)) batchPatch[key] = patch[key];
            else batchRemoved.push(key);
          });
          var r = await sync(this._stateVersion);
          if (!current()) return false;
          if (r.error && /state_conflict/i.test(String(r.error.message || r.error.details || ""))){
            var latest = await this.client.from("user_state").select("data,version").eq("user_id", sess.userId).maybeSingle();
            if (!current()) return false;
            if (latest.error) throw latest.error;
            var remote = latest.data && latest.data.data && typeof latest.data.data === "object" ? latest.data.data : {};
            var overlaps = batchKeys.some(function(key){
              var desired = Object.prototype.hasOwnProperty.call(batchPatch, key) ? batchPatch[key] : undefined;
              // A newer server version may already contain this exact change.
              // Only a third, different value is a genuine concurrent edit.
              return remote[key] !== base[key] && remote[key] !== desired;
            });
            if (overlaps){
              var conflict = new Error("Your library changed on another device. Reopen the app before saving again.");
              conflict.code = "LOREFY_STATE_CONFLICT";
              throw conflict;
            }
            this._stateVersion = Number(latest.data && latest.data.version) || 0;
            r = await sync(this._stateVersion);
            if (!current()) return false;
          }
          if (r.error) throw r.error;
          var row = Array.isArray(r.data) ? r.data[0] : r.data;
          this._stateVersion = Number(row && row.state_version) || (this._stateVersion + 1);
          this._stateBase = Object.assign({}, row && row.state_data || this._stateBase, batchPatch);
          batchRemoved.forEach(function(key){ delete B._stateBase[key]; });
          clearPendingState(batchKeys, pendingAtStart);
          writeStateBase(sess.userId, this._stateBase, this._stateVersion);
          }
          // Adopt unrelated remote edits only when the local value has not
          // changed before or during this push. Otherwise a later push would
          // mistake the old local copy for a new edit and undo the remote one.
          var localNow = gather();
          var pendingNow = readPendingState();
          var adopted = [];
          Object.keys(this._stateBase).forEach(function(key){
            if (stateKeys.indexOf(key) === -1 && isAccountStateKey(key)) stateKeys.push(key);
          });
          this._isApplyingRemote = true;
          try {
            stateKeys.forEach(function(key){
              if (payload[key] !== base[key] || localNow[key] !== payload[key] || Object.prototype.hasOwnProperty.call(pendingNow,key)) return;
              var value = backend._stateBase[key];
              if (value === localNow[key]) return;
              if (value == null) localStorage.removeItem(key);
              else localStorage.setItem(key,value);
              adopted.push(key);
            });
          } finally { this._isApplyingRemote = false; }
          adopted.forEach(function(key){
            if (typeof global !== "undefined" && global.dispatchEvent && global.CustomEvent) global.dispatchEvent(new global.CustomEvent("lorefy:stored-state", {detail:{key:key}}));
          });
          status("synced");
          return true;
        }catch(e){
          status(e && e.code === "LOREFY_STATE_CONFLICT" ? "conflict" : "pending");
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
      var request = mediaRequestScope(this);
      var authResult = await this.client.auth.getUser();
      assertMediaRequest(this, request);
      var authUser = authResult && authResult.data && authResult.data.user;
      if (authResult.error || !authUser){
        await this._clearInvalidSession();
        throw invalidSessionError();
      }
      if (authUser.id !== request.owner) throw invalidSessionError();
      var currentResult = await this.client.from("profiles").select("username,avatar,banner,social_links,is_private").eq("id", authUser.id).maybeSingle();
      assertMediaRequest(this, request);
      if (currentResult.error) throw currentResult.error;
      var current = currentResult.data || {};
      var requestedUsername = profile.un == null ? normalizeUsername(current.username) : normalizeUsername(profile.un);
      var english = readLS("lorefy.ui.lang.v1") === '"en"' || global.document && global.document.documentElement.lang === "en";
      if ((requestedUsername || current.username) && !/^[a-z0-9_]{3,24}$/.test(requestedUsername)) {
        var invalid = new Error(english ? "Use 3-24 letters, numbers or underscores for your username." : "اسم المستخدم يجب أن يكون 3-24 حرفًا إنجليزيًا أو رقمًا أو _.");
        invalid.code = "LOREFY_USERNAME_INVALID";
        throw invalid;
      }
      var avatar = await this._uploadProfileMedia(authUser.id, "avatar", profile.avatar, current.avatar);
      assertMediaRequest(this, request);
      var banner = await this._uploadProfileMedia(authUser.id, "banner", profile.banner, current.banner);
      assertMediaRequest(this, request);
      var media = [avatar, banner];
      var row = {
        username: requestedUsername || null,
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
      if (!row.username) row.username = null;
      var r = await this.client.rpc("save_my_profile", {
        profile_name:row.name,
        requested_username:row.username,
        profile_bio:row.bio,
        profile_avatar:row.avatar || null,
        profile_banner:row.banner || null,
        profile_genres:row.genres,
        profile_social_links:row.social_links,
        profile_is_private:row.is_private
      });
      assertMediaRequest(this, request);
      if (r.error){
        if (/username_change_cooldown/i.test(String(r.error.message || ""))) {
          var cooldown = new Error(english ? "You can change your username once every 7 days." : "يمكنك تغيير اسم المستخدم مرة كل 7 أيام.");
          cooldown.code = "LOREFY_USERNAME_COOLDOWN";
          throw cooldown;
        }
        if (r.error.code === "23505" || /username_taken/i.test(String(r.error.message || ""))){
          var taken = new Error(english ? "This username is already taken." : "اسم المستخدم مستخدم بالفعل.");
          taken.code = "LOREFY_USERNAME_TAKEN";
          throw taken;
        }
        if (r.error.code === "23503"){
          await this._clearInvalidSession();
          throw invalidSessionError();
        }
        throw r.error;
      }
      var saved = Array.isArray(r.data) ? r.data[0] : r.data;
      saved = saved && typeof saved === "object" ? saved : row;
      var avatarUrl = await this._profileMediaUrl(saved.avatar);
      assertMediaRequest(this, request);
      var bannerUrl = await this._profileMediaUrl(saved.banner);
      assertMediaRequest(this, request);
      var view = [avatarUrl, bannerUrl];
      return {
        username:saved.username || row.username || "",
        avatar:view[0], banner:view[1],
        avatarStoragePath:saved.avatar || "", bannerStoragePath:saved.banner || "",
        isPrivate:saved.is_private === true
      };
    },
    setProfilePrivacy: async function(isPrivate){
      this._requireAvailable();
      isPrivate = isPrivate === true;
      if (this.mode !== "live") return isPrivate;
      var request = mediaRequestScope(this);
      var authResult = await this.client.auth.getUser();
      assertMediaRequest(this, request);
      var authUser = authResult && authResult.data && authResult.data.user;
      if (authResult.error || !authUser){
        await this._clearInvalidSession();
        throw invalidSessionError();
      }
      if (authUser.id !== request.owner) throw invalidSessionError();
      var currentResult = await this.client.from("profiles")
        .select("name,username,bio,avatar,banner,genres,social_links,is_private")
        .eq("id", authUser.id)
        .maybeSingle();
      assertMediaRequest(this, request);
      if (currentResult.error) throw currentResult.error;
      var current = currentResult.data || {};
      var saved = await this.saveProfile({
        name:current.name || "",
        un:current.username || null,
        bio:current.bio || "",
        avatar:current.avatar || "",
        banner:current.banner || "",
        genres:Array.isArray(current.genres) ? current.genres : [],
        socials:current.social_links && typeof current.social_links === "object" ? current.social_links : {},
        isPrivate:isPrivate
      });
      assertMediaRequest(this, request);
      var identity = {};
      try{ identity = JSON.parse(readLS("lorefy.identity.v1") || "{}") || {}; }catch(e){}
      identity.isPrivate = saved.isPrivate === true;
      writeLS("lorefy.identity.v1", JSON.stringify(identity));
      return identity.isPrivate;
    },
    publishReview: async function(review){
      this._requireAvailable();
      if (this.mode !== "live") throw new Error("Cloud review publishing is unavailable in demo mode.");
      var request = mediaRequestScope(this);
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (!session || session.userId !== request.owner) throw invalidSessionError();
      review = review || {};
      var reviewId = String(review.id || (global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : "00000000-0000-4000-8000-" + Date.now().toString().slice(-12)));
      var images = (Array.isArray(review.images) ? review.images : []).slice(0, 10);
      var uploaded = [];
      var published = false;
      try{
        for (var i=0; i<images.length; i++) {
          assertMediaRequest(this, request);
          uploaded.push(await this._uploadReviewMedia(session.userId, reviewId, images[i]));
          assertMediaRequest(this, request);
        }
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
        published = !result.error;
        assertMediaRequest(this, request);
        if (result.error) {
          // Old production schemas may still have the unique index but not the
          // release upsert RPC. Never surface PostgreSQL internals to readers.
          if (isReviewConflict(result.error)) throw reviewConflictError();
          throw result.error;
        }
        var row = result.data;
        if (Array.isArray(row)) row = row[0];
        var hydrated = await this._hydrateReview(row || { id:reviewId, image_urls:uploaded });
        assertMediaRequest(this, request);
        return hydrated;
      }catch(error){
        if (!mediaRequestCurrent(this, request)) throw invalidSessionError();
        // Never delete committed media, or clean an old upload with a new account.
        if (!published) try{ await this._removeReviewMedia(uploaded); }catch(ignore){}
        assertMediaRequest(this, request);
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
    // Rating shelves use public metadata only; review bodies and media load in the normal review view.
    listFriendRatings: async function(){
      if (this.mode !== "live") return {followingIds:[],ratings:[],limited:false};
      var request = mediaRequestScope(this), owner = request.owner;
      var followingIds = Array.from(new Set(await this.getFollowedProfileIds())).filter(function(id){ return isUuid(id) && id !== owner; });
      assertMediaRequest(this, request);
      if (!followingIds.length) return {followingIds:[],ratings:[],limited:false};
      var batches = [], client = this.client, rows = [], limited = false, profiles = {};
      for (var i=0; i<followingIds.length; i+=50) batches.push(followingIds.slice(i,i+50));
      // Bound both URL size and concurrency for readers following many accounts.
      for (var offset=0; offset<batches.length; offset+=3) {
        var results = await Promise.all(batches.slice(offset,offset+3).map(async function(ids){
          var result = await client.from("reviews").select("id,user_id,work_id,rating,is_public,created_at")
            .in("user_id",ids).eq("is_public",true).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(500);
          assertMediaRequest(B, request);
          if (result.error) throw result.error;
          var readers = await client.from("profiles").select("id,name,username,avatar").in("id",ids);
          assertMediaRequest(B, request);
          if (readers.error) throw readers.error;
          return {rows:result.data || [],profiles:readers.data || []};
        }));
        assertMediaRequest(this, request);
        results.forEach(function(result){
          if (result.rows.length===500) limited=true;
          rows = rows.concat(result.rows);
          result.profiles.forEach(function(profile){ profiles[profile.id]=profile; });
        });
      }
      await Promise.all(Object.keys(profiles).map(async function(id){
        var profile=profiles[id];
        try { profile.avatar=await B._storageMediaUrl(PROFILE_MEDIA_BUCKET,profile.avatar,PROFILE_MEDIA_TTL); } catch(e) { profile.avatar=""; }
      }));
      assertMediaRequest(this, request);
      var allowed = new Set(followingIds);
      return {followingIds:followingIds,limited:limited,ratings:rows.filter(function(row){ return allowed.has(row.user_id) && profiles[row.user_id] && row.is_public===true; }).map(function(row){ return Object.assign({},row,{profile:profiles[row.user_id]}); })};
    },
    listReviews: async function(options){
      if (this.mode !== "live") return [];
      var request = mediaRequestScope(this);
      options = options || {};
      var limit = Math.min(Math.max(Number(options.limit) || 50, 1), 100);
      var query = this.client.from("reviews")
        .select("id,user_id,work_id,rating,body,recommend,spoiler,image_urls,is_public,created_at,updated_at")
        .order("created_at", { ascending:false }).order("id", { ascending:false }).limit(limit);
      if (options.workId) query = query.eq("work_id", String(options.workId));
      if (options.userId) query = query.eq("user_id", String(options.userId));
      if (options.before && isUuid(options.before.id)) {
        var date = new Date(options.before.created_at);
        if (!isNaN(date.getTime())) query = query.or("created_at.lt." + date.toISOString() + ",and(created_at.eq." + date.toISOString() + ",id.lt." + options.before.id + ")");
      }
      var result = await query;
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      var rows = result.data || [];
      var userIds = Array.from(new Set(rows.map(function(row){ return row.user_id; }).filter(Boolean)));
      var reviewIds = rows.map(function(row){ return row.id; });
      var profileMap = {};
      var commentsByReview = {};
      var reactionsByReview = {};
      if (userIds.length){
        var profiles = await this.client.from("profiles").select("id,name,username,avatar").in("id", userIds);
        assertMediaRequest(this, request);
        if (profiles.error) throw profiles.error;
        await Promise.all((profiles.data || []).map(async function(profile){
          try{ profile.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, profile.avatar, PROFILE_MEDIA_TTL); }catch(e){ profile.avatar = ""; }
          profileMap[profile.id] = profile;
        }));
        assertMediaRequest(this, request);
      }
      if (reviewIds.length){
        var comments = await this.client.from("review_comments").select("id,review_id,user_id,parent_id,body,created_at").in("review_id", reviewIds).eq("is_deleted", false).order("created_at", { ascending:true }).limit(500);
        assertMediaRequest(this, request);
        if (comments.error) throw comments.error;
        var commentUserIds = (comments.data || []).map(function(comment){ return comment.user_id; }).filter(Boolean);
        var missingProfileIds = Array.from(new Set(commentUserIds)).filter(function(userId){ return !profileMap[userId]; });
        if (missingProfileIds.length){
          var commentProfiles = await this.client.from("profiles").select("id,name,username,avatar").in("id", missingProfileIds);
          assertMediaRequest(this, request);
          if (commentProfiles.error) throw commentProfiles.error;
          await Promise.all((commentProfiles.data || []).map(async function(profile){
            try{ profile.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, profile.avatar, PROFILE_MEDIA_TTL); }catch(e){ profile.avatar = ""; }
            profileMap[profile.id] = profile;
          }));
          assertMediaRequest(this, request);
        }
        (comments.data || []).forEach(function(comment){
          comment.profile = profileMap[comment.user_id] || null;
          (commentsByReview[comment.review_id] || (commentsByReview[comment.review_id] = [])).push(comment);
        });
        var reactions = await this.client.from("review_reactions").select("review_id,user_id,kind").in("review_id", reviewIds).limit(1000);
        assertMediaRequest(this, request);
        if (reactions.error) throw reactions.error;
        (reactions.data || []).forEach(function(reaction){
          var stats = reactionsByReview[reaction.review_id] || (reactionsByReview[reaction.review_id] = { like:0, dislike:0, heart:0, mine:{} });
          stats[reaction.kind] = (stats[reaction.kind] || 0) + 1;
          if (reaction.user_id === request.owner) stats.mine[reaction.kind] = true;
        });
      }
      var hydratedRows = await Promise.all(rows.map(async function(row){
        var hydrated = await B._hydrateReview(row);
        hydrated.profile = profileMap[row.user_id] || null;
        hydrated.comments = commentsByReview[row.id] || [];
        hydrated.reactions = reactionsByReview[row.id] || { like:0, dislike:0, heart:0, mine:{} };
        return hydrated;
      }));
      assertMediaRequest(this, request);
      return hydratedRows;
    },
    countWorkDislikes: async function(workId){
      if (this.mode !== "live") return null;
      if (typeof workId !== "string" || !workId.trim() || workId.length > 200) throw new Error("Invalid work reference.");
      var request = mediaRequestScope(this);
      var result = await this.client.from("reviews").select("id", { count:"exact", head:true })
        .eq("work_id", workId.trim()).eq("is_public", true).eq("rating", 0).eq("recommend", false);
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      if (!Number.isSafeInteger(result.count) || result.count < 0) throw new Error("Dislike count is unavailable.");
      return result.count;
    },
    listReviewCollection: async function(options){
      options = options || {};
      if (!options.userId && !options.workId) throw new Error("A review collection must be scoped to a reader or work.");
      var request = sessionReadScope(this), before = null, rows = new Map();
      do {
        var page = await this.listReviews(Object.assign({}, options, {limit:100, before:before}));
        assertSessionRead(this, request);
        page.forEach(function(row){ rows.set(row.id, row); });
        var last = page[page.length - 1];
        if (page.length < 100) break;
        if (!last || before && last.id === before.id) throw new Error("Review pagination did not advance.");
        before = {id:last.id, created_at:last.created_at};
      } while (true);
      return Array.from(rows.values());
    },
    publishCommunityPost: async function(input){
      this._requireAvailable();
      if (this.mode !== "live") throw new Error("Cloud community publishing is unavailable in demo mode.");
      var request = mediaRequestScope(this);
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (!session || session.userId !== request.owner) throw invalidSessionError();
      input = input || {};
      var kind = ["text", "list", "top"].indexOf(String(input.kind || "text")) >= 0 ? String(input.kind || "text") : "text";
      var body = String(input.body || "").trim().slice(0, 1000);
      var attachment = input.attachment && typeof input.attachment === "object" && !Array.isArray(input.attachment) ? input.attachment : {};
      var parentId = isUuid(input.parentId) ? String(input.parentId) : null;
      var result = await this.client.rpc("publish_community_post", {
        post_body:body,
        post_kind:kind,
        post_attachment:attachment,
        parent_ref:parentId
      });
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      var row = Array.isArray(result.data) ? result.data[0] : result.data;
      return row || null;
    },
    listCommunityPosts: async function(options){
      if (this.mode !== "live") return [];
      var request = mediaRequestScope(this);
      options = options || {};
      var limit = Math.min(Math.max(Number(options.limit) || 40, 1), 100);
      var query = this.client.from("community_posts")
        .select("id,user_id,kind,body,attachment,parent_id,created_at,updated_at")
        .eq("is_deleted", false)
        .order("created_at", { ascending:!!options.parentId && !options.latestReplies })
        .order("id", { ascending:!!options.parentId && !options.latestReplies })
        .limit(limit);
      if (options.before && options.before.created_at && isUuid(options.before.id)) {
        var cursorDate = new Date(options.before.created_at);
        if (!isNaN(cursorDate.getTime())) query = query.or("created_at.lt." + cursorDate.toISOString() + ",and(created_at.eq." + cursorDate.toISOString() + ",id.lt." + options.before.id + ")");
      }
      if (options.postId) query = query.eq("id", String(options.postId));
      else if (options.replyActivity) {
        if (!isUuid(options.userId)) return [];
        var ownRoots = (options.parentIds || []).filter(isUuid).slice(0,60);
        query = query.not("parent_id", "is", null);
        query = ownRoots.length ? query.or("user_id.eq." + options.userId + ",parent_id.in.(" + ownRoots.join(',') + ")") : query.eq("user_id", options.userId);
      }
      else if (options.parentId) query = query.eq("parent_id", String(options.parentId));
      else query = query.is("parent_id", null);
      if (options.userId && !options.replyActivity) query = query.eq("user_id", String(options.userId));
      var result = await query;
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      var rows = result.data || [];
      var postIds = rows.map(function(row){ return row.id; }).filter(Boolean);
      await Promise.all(rows.map(async function(row){ row.attachment = await B._resolveArtworkAttachment(row.attachment); }));
      assertMediaRequest(this, request);
      var userIds = Array.from(new Set(rows.map(function(row){ return row.user_id; }).filter(Boolean)));
      var profileMap = {};
      var reactionMap = {};
      var replyCountMap = {};
      if (userIds.length){
        var profiles = await this.client.from("profiles").select("id,name,username,avatar").in("id", userIds);
        assertMediaRequest(this, request);
        if (profiles.error) throw profiles.error;
        await Promise.all((profiles.data || []).map(async function(profile){
          try{ profile.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, profile.avatar, PROFILE_MEDIA_TTL); }catch(e){ profile.avatar = ""; }
          profileMap[profile.id] = profile;
        }));
        assertMediaRequest(this, request);
      }
      if (postIds.length){
        var reactions = await this.client.from("community_post_reactions")
          .select("post_id,user_id,kind").in("post_id", postIds).limit(1000);
        assertMediaRequest(this, request);
        if (reactions.error) throw reactions.error;
        (reactions.data || []).forEach(function(reaction){
          var stats = reactionMap[reaction.post_id] || (reactionMap[reaction.post_id] = { like:0, dislike:0, mine:{ like:false, dislike:false } });
          var kind = reaction.kind === "dislike" ? "dislike" : "like";
          stats[kind] += 1;
          if (reaction.user_id === request.owner) stats.mine[kind] = true;
        });
        if (!options.parentId){
          var replies = await this.client.from("community_posts")
            .select("id,parent_id").in("parent_id", postIds).eq("is_deleted", false).limit(1000);
          assertMediaRequest(this, request);
          if (replies.error) throw replies.error;
          (replies.data || []).forEach(function(reply){
            replyCountMap[reply.parent_id] = (replyCountMap[reply.parent_id] || 0) + 1;
          });
        }
      }
      return rows.map(function(row){
        return Object.assign({}, row, {
          profile:profileMap[row.user_id] || null,
          reactions:reactionMap[row.id] || { like:0, dislike:0, mine:{ like:false, dislike:false } },
          replyCount:replyCountMap[row.id] || 0
        });
      });
    },
    listChapterReviews: async function(workId, chapter, offset){
      if (this.mode !== "live") return [];
      var request = mediaRequestScope(this);
      var start = Math.max(0, Number(offset) || 0);
      var result = await this.client.from("chapter_reviews")
        .select("id,user_id,work_id,chapter,rating,body,spoiler,updated_at,profile:profiles(id,name,username,avatar)")
        .eq("work_id", String(workId)).eq("chapter", Number(chapter))
        .order("updated_at", { ascending:false }).order("id", { ascending:false }).range(start, start + 19);
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      await Promise.all((result.data || []).map(async function(row){
        if (row.profile) {
          try { row.profile.avatar = await B._storageMediaUrl(PROFILE_MEDIA_BUCKET, row.profile.avatar, PROFILE_MEDIA_TTL); }
          catch (_) { row.profile.avatar = ""; }
        }
      }));
      assertMediaRequest(this, request);
      return result.data || [];
    },
    deleteChapterReview: async function(reviewId){
      var request = this.mode === "live" ? mediaRequestScope(this) : null;
      var session = await this.getSession();
      if (request) assertMediaRequest(this, request);
      if (!session || request && session.userId !== request.owner) throw invalidSessionError();
      if (!isUuid(reviewId)) throw new Error("Invalid chapter review.");
      var result = await this.client.from("chapter_reviews").delete().eq("id", reviewId).eq("user_id", session.userId).select("id");
      if (request) assertMediaRequest(this, request);
      if (result.error) throw result.error;
      if (!(result.data || []).length) throw new Error("Chapter review is unavailable.");
      return true;
    },
    publishChapterReview: async function(workId, chapter, rating, body, spoiler){
      var request = this.mode === "live" ? mediaRequestScope(this) : null;
      var session = await this.getSession();
      if (request) assertMediaRequest(this, request);
      if (!session || request && session.userId !== request.owner) throw invalidSessionError();
      if (!Number.isInteger(Number(chapter)) || Number(chapter) < 1 || Number(chapter) > 100000) throw new Error("Invalid chapter.");
      var score = Number(rating);
      if (!Number.isFinite(score) || !Number.isInteger(score * 4) || score < 0 || score > 5) throw new Error("Invalid rating.");
      var text = String(body || "").trim();
      if (text.length > 1000 || (!score && !text)) throw new Error("Invalid chapter review.");
      var result = await this.client.rpc("publish_chapter_review", { work_ref:String(workId), chapter_ref:Number(chapter), score:score, comment_body:text, has_spoiler:!!spoiler });
      if (request) assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return result.data;
    },
    replyCommunityPost: async function(postId, body, attachment){
      if (!isUuid(postId)) throw new Error("Invalid community post.");
      return this.publishCommunityPost({ kind:"text", body:body, parentId:postId, attachment:attachment || {} });
    },
    mutateCommunityPost: async function(postId, changes){
      this._requireAvailable();
      if (this.mode !== "live") throw invalidSessionError();
      var request = mediaRequestScope(this);
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (!session || session.userId !== request.owner) throw invalidSessionError();
      if (!isUuid(postId)) throw new Error("Invalid community post.");
      changes = changes || {};
      var result = await this.client.rpc("mutate_community_post", {
        post_ref:String(postId),
        post_body:typeof changes.body === 'string' ? changes.body.trim() : null,
        removed:typeof changes.is_deleted === 'boolean' ? changes.is_deleted : null
      });
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return Array.isArray(result.data) ? result.data[0] : result.data;
    },
    setCommunityPostReaction: async function(postId, kind, active){
      var request = this.mode === "live" ? mediaRequestScope(this) : null;
      var session = await this.getSession();
      if (request) assertMediaRequest(this, request);
      if (!session || request && session.userId !== request.owner) throw invalidSessionError();
      kind = kind === "dislike" ? "dislike" : "like";
      if (!isUuid(postId)) return active !== false;
      var result = await this.client.rpc("set_community_post_reaction", {
        post_ref:String(postId),
        reaction_kind:kind,
        reaction_active:active !== false
      });
      if (request) assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return active !== false;
    },
    _stopCommunitySubscription: function(){
      var subscription = this._communitySubscription;
      this._communitySubscription = null;
      if (!subscription) return this._communityClosing || Promise.resolve();
      subscription.listeners.clear();
      var closing;
      try {
        closing = Promise.resolve(subscription.client.removeChannel(subscription.channel)).catch(function(){});
      } catch(e) { closing = Promise.resolve(); }
      this._communityClosing = closing;
      var self = this;
      closing.then(function(){ if (self._communityClosing === closing) self._communityClosing = null; });
      return closing;
    },
    subscribeCommunity: async function(callback){
      if (this.mode !== "live" || typeof callback !== "function") return function(){};
      var epoch = this._communityEpoch;
      var session = await this.getSession();
      if (epoch !== this._communityEpoch) return function(){};
      if (!session){
        await this._stopCommunitySubscription();
        return function(){};
      }
      if (this._communityClosing) await this._communityClosing;
      if (epoch !== this._communityEpoch) return function(){};
      var subscription = this._communitySubscription;
      if (subscription && (subscription.userId !== session.userId || subscription.client !== this.client)){
        await this._stopCommunitySubscription();
        if (epoch !== this._communityEpoch) return function(){};
        subscription = this._communitySubscription;
      }
      var self = this;
      if (!subscription){
        subscription = { userId:session.userId, client:this.client, channel:null, listeners:new Set() };
        var notify = function(payload){
          if (self._communitySubscription !== subscription) return;
          subscription.listeners.forEach(function(listener){
            try{ listener.callback(payload || null); }catch(e){ console.warn("[Lorefy] community listener:", e); }
          });
        };
        subscription.channel = this.client.channel("community:" + session.userId)
          .on("postgres_changes", { event:"*", schema:"public", table:"reviews" }, notify)
          .on("postgres_changes", { event:"*", schema:"public", table:"review_comments" }, notify)
          .on("postgres_changes", { event:"*", schema:"public", table:"review_reactions" }, notify)
          .on("postgres_changes", { event:"*", schema:"public", table:"community_posts" }, notify)
          .on("postgres_changes", { event:"*", schema:"public", table:"community_post_reactions" }, notify)
          .on("postgres_changes", { event:"*", schema:"public", table:"profile_follows" }, notify)
          .subscribe();
        this._communitySubscription = subscription;
      }
      var listener = { callback:callback };
      subscription.listeners.add(listener);
      return function(){
        subscription.listeners.delete(listener);
        if (!subscription.listeners.size && self._communitySubscription === subscription) self._stopCommunitySubscription();
      };
    },
    deleteReview: async function(reviewId){
      if (this.mode !== "live") return true;
      if (!isUuid(reviewId)) return true;
      var request = mediaRequestScope(this);
      var found = await this.client.from("reviews").select("image_urls").eq("id", String(reviewId)).maybeSingle();
      assertMediaRequest(this, request);
      if (found.error) throw found.error;
      await this._removeReviewMedia(found.data && found.data.image_urls);
      assertMediaRequest(this, request);
      var removed = await this.client.from("reviews").delete().eq("id", String(reviewId));
      assertMediaRequest(this, request);
      if (removed.error) throw removed.error;
      return true;
    },
    addReviewComment: async function(reviewId, body, parentId){
      var request = this.mode === "live" ? mediaRequestScope(this) : null;
      var session = await this.getSession();
      if (request) assertMediaRequest(this, request);
      if (!session || request && session.userId !== request.owner) throw invalidSessionError();
      if (!isUuid(reviewId)) return null;
      body = String(body || "").trim().slice(0, 2000);
      if (!body) throw new Error("Comment cannot be empty.");
      parentId = isUuid(parentId) ? String(parentId) : null;
      var result = await this.client.rpc("publish_review_comment", { review_ref:String(reviewId), comment_body:body, parent_ref:parentId });
      if (request) assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return Array.isArray(result.data) ? result.data[0] : result.data;
    },
    setReviewReaction: async function(reviewId, kind, active){
      var request = this.mode === "live" ? mediaRequestScope(this) : null;
      var session = await this.getSession();
      if (request) assertMediaRequest(this, request);
      if (!session || request && session.userId !== request.owner) throw invalidSessionError();
      if (!isUuid(reviewId)) return active !== false;
      kind = String(kind || "");
      if (["like","dislike","heart"].indexOf(kind) === -1) throw new Error("Unsupported reaction.");
      var result = await this.client.rpc("set_review_reaction", { review_ref:String(reviewId), reaction_kind:kind, reaction_active:active !== false });
      if (request) assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return active !== false;
    },
    submitReport: async function(input){
      input = input || {};
      if (this.mode !== "live") throw new Error("Cloud reporting is unavailable.");
      var request = mediaRequestScope(this);
      var result = await this.client.rpc("submit_report", {
        target_kind:String(input.targetType || "review"),
        target_ref:String(input.targetId || "").trim().slice(0, 200),
        report_reason:String(input.reason || "spam"),
        report_details:String(input.note || "").trim().slice(0, 800)
      });
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return { id:result.data, status:"open" };
    },
    setProfileBlock: async function(profileId, blocked){
      var request = this.mode === "live" ? mediaRequestScope(this) : null;
      var session = await this.getSession();
      if (request) assertMediaRequest(this, request);
      if (!session || request && session.userId !== request.owner) throw invalidSessionError();
      var owner = request ? request.owner : this.user.id;
      if (!isUuid(profileId) || profileId === owner) throw new Error("Invalid profile.");
      var query = this.client.from("profile_blocks");
      var result = blocked === false
        ? await query.delete().eq("blocker_id", owner).eq("blocked_id", profileId)
        : await query.upsert({ blocker_id:owner, blocked_id:profileId }, { onConflict:"blocker_id,blocked_id" });
      if (request) assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return blocked !== false;
    },
    completeOnboarding: async function(profile, preferences){
      this._requireAvailable();
      var request = this.mode === "live" ? mediaRequestScope(this) : null;
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
      if (request) assertMediaRequest(this, request);
      writeLS("lorefy.identity.v1", JSON.stringify(cleanProfile));
      writeLS("lorefy.user.preferences.v2", JSON.stringify(cleanPreferences));
      try{ localStorage.removeItem(ONBOARDING_DRAFT_KEY); }catch(e){}
      await this.push();
      if (request) assertMediaRequest(this, request);
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
      var self = this;
      // Storage has a named setter: assigning an instance method can create a
      // stored string instead of intercepting writes. Patch its prototype.
      var target = global.Storage && global.Storage.prototype || localStorage;
      this._syncStorageTarget = target;
      var orig = target.setItem;
      this._origSetItem = orig;
      target.setItem = function(k, v){
        orig.call(this, k, v);
        if (this === localStorage && isAccountStateKey(k) && !self._isApplyingRemote) {
          stagePendingState(k, v);
          self._schedulePush();
        }
      };
      var origRemove = target.removeItem;
      this._origRemoveItem = origRemove;
      target.removeItem = function(k){
        origRemove.call(this, k);
        if (this === localStorage && isAccountStateKey(k) && !self._isApplyingRemote) {
          stagePendingState(k, null);
          self._schedulePush();
        }
      };
      this._visibilityHandler = function(){
        if (document.visibilityState === "hidden") self._flushPush();
        else self._schedulePush();
      };
      this._pageHideHandler = function(){ self._flushPush(); };
      document.addEventListener("visibilitychange", this._visibilityHandler);
      window.addEventListener("pagehide", this._pageHideHandler);
      this._schedulePush();
    },
    stopSync: function(){
      this._syncStatus = null;
      if (global.dispatchEvent && global.CustomEvent) global.dispatchEvent(new global.CustomEvent("lorefy:sync-status", {detail:{status:null}}));
      this._pullGeneration = (this._pullGeneration || 0) + 1;
      var target = this._syncStorageTarget;
      if (this._origSetItem){ target.setItem = this._origSetItem; this._origSetItem = null; }
      if (this._origRemoveItem){ target.removeItem = this._origRemoveItem; this._origRemoveItem = null; }
      this._syncStorageTarget = null;
      if (this._visibilityHandler){ document.removeEventListener("visibilitychange", this._visibilityHandler); this._visibilityHandler = null; }
      if (this._pageHideHandler){ window.removeEventListener("pagehide", this._pageHideHandler); this._pageHideHandler = null; }
      clearTimeout(this._pushTimer);
    },

    registerPushDevice: async function(input){
      input = input || {};
      if (this.mode !== "live") return false;
      var request = mediaRequestScope(this);
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (!session || session.userId !== request.owner) throw invalidSessionError();
      var installationId = String(input.installationId || "").trim();
      var token = String(input.token || "").trim();
      var platform = String(input.platform || "ios").toLowerCase();
      var environment = String(input.environment || "production").toLowerCase();
      if (!isUuid(installationId) || token.length < 32 || token.length > 4096) throw new Error("Invalid push device registration.");
      if (["ios","android"].indexOf(platform) === -1 || ["development","production"].indexOf(environment) === -1){
        throw new Error("Invalid push device metadata.");
      }
      var result = await this.client.rpc("register_push_device", {
        installation_ref:installationId,
        device_platform:platform,
        device_token:token,
        push_environment:environment,
        device_locale:String(input.locale || "ar").slice(0, 16),
        client_version:String(input.appVersion || "").slice(0, 32)
      });
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return result.data || true;
    },
    unregisterPushDevice: async function(installationId){
      if (this.mode !== "live") return false;
      installationId = String(installationId || "").trim();
      if (!isUuid(installationId)) return false;
      var request = mediaRequestScope(this);
      var result = await this.client.rpc("unregister_push_device", { installation_ref:installationId });
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return result.data === true;
    },
    listNotifications: async function(limit){
      if (this.mode !== "live") return [];
      var request = mediaRequestScope(this);
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (!session) return [];
      if (session.userId !== request.owner) throw invalidSessionError();
      var result = await this.client.from("notifications")
        .select("id,actor_id,kind,title,body,target_path,data,read_at,created_at")
        .eq("user_id", session.userId)
        .order("created_at", { ascending:false })
        .limit(Math.min(Math.max(Number(limit) || 50, 1), 100));
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return Array.isArray(result.data) ? result.data.filter(function(row){ return row && row.actor_id !== session.userId; }) : [];
    },
    markNotificationsRead: async function(notificationIds){
      if (this.mode !== "live") return 0;
      var ids = notificationIds == null ? null : (Array.isArray(notificationIds) ? notificationIds : [notificationIds]);
      if (ids && (ids.length > 200 || ids.some(function(id){ return !isUuid(id); }))) throw new Error("Invalid notification selection.");
      var request = mediaRequestScope(this);
      var result = await this.client.rpc("mark_notifications_read", { notification_ids:ids });
      assertMediaRequest(this, request);
      if (result.error) throw result.error;
      return Number(result.data) || 0;
    },
    subscribeNotifications: async function(callback, onState){
      if (this.mode !== "live" || typeof callback !== "function") return function(){};
      var request = mediaRequestScope(this);
      var attempt = (this._notificationAttempt || 0) + 1;
      this._notificationAttempt = attempt;
      var session = await this.getSession();
      assertMediaRequest(this, request);
      if (!session) return function(){};
      if (session.userId !== request.owner) throw invalidSessionError();
      if (this._notificationAttempt !== attempt) return function(){};
      var client = request.client;
      if (this._notificationChannel){
        var previous = this._notificationChannel;
        var previousClient = this._notificationChannelClient || client;
        this._notificationChannel = null;
        this._notificationChannelClient = null;
        try{ await previousClient.removeChannel(previous); }catch(e){}
        assertMediaRequest(this, request);
        if (this._notificationAttempt !== attempt) return function(){};
      }
      var self = this;
      var notify = function(event, payload){
        if (!mediaRequestCurrent(self, request) || self._notificationChannel !== channel) return;
        var notification = payload && payload.new;
        if (notification && notification.actor_id !== session.userId &&
            (!notification.user_id || notification.user_id === session.userId)) callback(notification, {event:event});
      };
      var channel = client.channel("notifications:" + session.userId)
        .on("postgres_changes", {
          event:"INSERT", schema:"public", table:"notifications", filter:"user_id=eq." + session.userId
        }, function(payload){ notify("INSERT", payload); })
        .on("postgres_changes", {
          event:"UPDATE", schema:"public", table:"notifications", filter:"user_id=eq." + session.userId
        }, function(payload){ notify("UPDATE", payload); });
      this._notificationChannel = channel;
      this._notificationChannelClient = client;
      channel.subscribe(function(status){
        if (!mediaRequestCurrent(self, request) || self._notificationChannel !== channel) return;
        if (typeof onState === "function") onState(status);
      });
      return function(){
        if (self._notificationChannel === channel) {
          self._notificationChannel = null;
          self._notificationChannelClient = null;
        }
        try{ Promise.resolve(client.removeChannel(channel)).catch(function(){}); }catch(e){}
      };
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
      if (this._deletionRunning && sessionReadCurrent(this, this._deletionScope)) return this._deletionRunning;
      var scope = sessionReadScope(this), pending = this._deleteAccount();
      this._deletionRunning = pending;
      this._deletionScope = scope;
      try { return await pending; }
      finally {
        if (this._deletionRunning === pending) { this._deletionRunning = null; this._deletionScope = null; }
      }
    },
    _deleteAccount: async function(){
      var live = this.mode === "live";
      var request = live ? mediaRequestScope(this) : sessionReadScope(this);
      var check = live ? assertMediaRequest : assertSessionRead;
      var sess = await this.getSession();
      check(this, request);
      if (this.mode !== "demo" && !sess) throw invalidSessionError();
      if (this.mode === "live"){
        if (sess.userId !== request.owner) throw invalidSessionError();
        var r = await this.client.functions.invoke("delete-account", { body:{ confirm:true } });
        check(this, request);
        if (r.error) {
          var details = {};
          try { if (r.error.context && r.error.context.clone) details = await r.error.context.clone().json(); } catch (_) {}
          check(this, request);
          var reason = String(details.error || '');
          var reauth = reason === 'recent_authentication_required' || reason === 'unauthorized';
          var english = readLS("lorefy.ui.lang.v1") === 'en';
          var failure = new Error(reauth
            ? english ? 'Sign in again, then return to Settings to confirm account deletion.' : 'سجّل الدخول مجددًا، ثم ارجع إلى الإعدادات وأكّد حذف الحساب.'
            : english ? 'Your account was not deleted. Please try again later or contact support.' : 'لم يُحذف حسابك. حاول لاحقًا أو تواصل مع الدعم.');
          failure.code = reauth ? 'LOREFY_REAUTH_REQUIRED' : 'LOREFY_DELETE_FAILED';
          failure.reason = reason;
          throw failure;
        }
      }
      check(this, request);
      await this.signOut();
      return true;
    },

    SYNC_KEYS: SYNC_KEYS,
    OAUTH_PROVIDERS: OAUTH_PROVIDERS.slice()
  };

  global.LorefyBackend = B;
})(typeof window !== "undefined" ? window : this);

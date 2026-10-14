(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.LorefyUserDiscovery = api;
    if (root.document) api.install();
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var FOLLOWING_KEY = "lorefy.user.following.v1";
  var MAX_RESULTS = 20;
  var demoReaders = [];

  function normalizeQuery(value) {
    return String(value || "")
      .replace(/^\s*@\s*/, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .slice(0, 64);
  }

  function safeText(value, max) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max || 160);
  }

  function normalizeReader(reader) {
    reader = reader || {};
    return {
      id: safeText(reader.id, 120),
      username: normalizeQuery(reader.username),
      name: safeText(reader.name, 80),
      bio: safeText(reader.bio, 220),
      avatar: safeText(reader.avatar || reader.av, 12000),
      av: safeText(reader.avatar || reader.av, 12000),
      banner: safeText(reader.banner, 24000),
      profile_layout: reader.profile_layout === 'immersive' ? 'immersive' : 'normal',
      theme: root.LorefyPublicAppearance ? root.LorefyPublicAppearance.normalize(reader).theme : reader.theme || 'dark',
      library_view: reader.library_view === 'spines' || reader.library_view === 'shelf' ? reader.library_view : 'grid',
      favorite_type: safeText(reader.favorite_type,30),
      banner_position: reader.banner_position != null && Number.isFinite(Number(reader.banner_position)) ? Math.max(0,Math.min(100,Number(reader.banner_position))) : 50,
      genres: Array.isArray(reader.genres) ? reader.genres.map(function (genre) { return safeText(genre, 30); }).filter(Boolean).slice(0, 4) : [],
      followers: Math.max(0, Number(reader.follower_count != null ? reader.follower_count : reader.followers) || 0),
      follower_count: Math.max(0, Number(reader.follower_count != null ? reader.follower_count : reader.followers) || 0),
      following_count: Math.max(0, Number(reader.following_count) || 0),
      review_count: Math.max(0, Number(reader.review_count) || 0),
      completed_count: Math.max(0, Number(reader.completed_count) || 0),
      total_chapters: Math.max(0, Number(reader.total_chapters) || 0),
      read_hours: Math.max(0, Number(reader.read_hours) || 0),
      favorite_work_ids: Array.isArray(reader.favorite_work_ids) ? reader.favorite_work_ids.map(String).filter(Boolean).slice(0, 12) : [],
      favorite_character_ids: Array.isArray(reader.favorite_character_ids) ? reader.favorite_character_ids.slice(0, 12) : [],
      library_entries: reader.library_entries && typeof reader.library_entries === "object" ? Object.assign({}, reader.library_entries) : {},
      social_links: reader.social_links && typeof reader.social_links === "object" ? Object.assign({}, reader.social_links) : {},
      is_following: reader.is_following === true
    };
  }

  function readFollowing(storage) {
    try {
      var value = JSON.parse(storage.getItem(FOLLOWING_KEY) || "[]");
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch (error) {
      return new Set();
    }
  }

  function persistFollowing(storage, following) {
    try { storage.setItem(FOLLOWING_KEY, JSON.stringify(Array.from(following).slice(0, 500))); } catch (error) {}
  }

  function rankReaders(readers, query, currentUserId, blockedIds) {
    var blocked = new Set((blockedIds || []).map(String));
    return (readers || [])
      .map(normalizeReader)
      .filter(function (reader) {
        return reader.id && reader.username && reader.id !== String(currentUserId || "") && !blocked.has(reader.id);
      })
      .map(function (reader) {
        var username = reader.username.toLowerCase();
        var name = reader.name.toLowerCase();
        var score = username === query ? 0 : username.indexOf(query) === 0 ? 1 : name.indexOf(query) === 0 ? 2 : username.indexOf(query) >= 0 ? 3 : name.indexOf(query) >= 0 ? 4 : 9;
        return { reader: reader, score: score };
      })
      .filter(function (item) { return item.score < 9; })
      .sort(function (left, right) { return left.score - right.score || right.reader.followers - left.reader.followers || left.reader.username.localeCompare(right.reader.username); })
      .slice(0, MAX_RESULTS)
      .map(function (item) { return item.reader; });
  }

  function createUserDirectory(options) {
    options = options || {};
    var storage = options.storage || (typeof localStorage !== "undefined" ? localStorage : { getItem: function () { return null; }, setItem: function () {} });
    var readers = Array.isArray(options.readers) ? options.readers : demoReaders;
    var adapter = options.adapter || null;
    var currentUserId = options.currentUserId || "";
    var blockedIds = options.blockedIds || [];
    var following = readFollowing(storage);
    var hydrated = false;

    async function hydrateFollowing() {
      if (hydrated || !adapter || typeof adapter.getFollowedProfileIds !== "function") return;
      hydrated = true;
      try {
        var ids = await adapter.getFollowedProfileIds();
        if (Array.isArray(ids)) {
          following = new Set(ids.map(String));
          persistFollowing(storage, following);
        }
      } catch (error) {}
    }

    function applyFollowing(profileId, value) {
      var id = safeText(profileId, 120);
      if (!id) return false;
      if (value === true) following.add(id); else following.delete(id);
      persistFollowing(storage, following);
      return following.has(id);
    }

    return {
      search: async function (value) {
        var query = normalizeQuery(value);
        if (query.length < 2) return [];
        await hydrateFollowing();
        if (adapter && typeof adapter.searchPublicProfiles === "function") {
          try {
            var remote = await adapter.searchPublicProfiles(query, MAX_RESULTS);
            if (Array.isArray(remote)) return rankReaders(remote, query, currentUserId, blockedIds);
          } catch (error) {}
        }
        return rankReaders(readers, query, currentUserId, blockedIds);
      },
      isFollowing: function (profileId) { return following.has(String(profileId)); },
      setFollowing: async function (profileId, value) {
        var id = safeText(profileId, 120);
        if (!id || id === String(currentUserId || "")) return false;
        var next = value === true;
        if (adapter && typeof adapter.toggleProfileFollow === "function") next = await adapter.toggleProfileFollow(id, next);
        applyFollowing(id, next);
        if (root && typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") {
          root.dispatchEvent(new root.CustomEvent("lorefy:profile-follow-changed", {
            detail: { profileId: id, following: next }
          }));
        }
        return next;
      },
      applyFollowing: applyFollowing
    };
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]; });
  }

  function initials(name) {
    return safeText(name || "L", 2).slice(0, 1).toUpperCase() || "L";
  }

  function safeAvatar(value) {
    value = String(value || "");
    return /^(?:https?:|data:image\/)/i.test(value) ? value : "";
  }

  function currentIdentity() {
    try { return JSON.parse(root.localStorage.getItem("lorefy.identity.v1") || "{}"); } catch (error) { return {}; }
  }

  function buildDirectory() {
    var identity = currentIdentity();
    var backend = root.LorefyBackend;
    var safety = root.LorefyProductCore && root.LorefyProductCore.createProductCore ? root.LorefyProductCore.createProductCore() : null;
    var params = new URLSearchParams(root.location.search || "");
    var isLocalDemo = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(root.location.hostname) && params.get("preview") === "demo";
    var preview = root.LorefyPreviewReaders && root.LorefyPreviewReaders.isActive();
    return createUserDirectory({
      storage: preview ? root.LorefyPreviewReaders.getFollowingStorage() : root.localStorage,
      readers: isLocalDemo ? demoReaders : [],
      currentUserId: (backend && backend.user && backend.user.id) || identity.id || "",
      blockedIds: safety && safety.safety ? safety.safety.getBlockedUsers() : [],
      adapter: preview ? backend : !isLocalDemo && backend && backend.isConfigured && backend.isConfigured() ? backend : null
    });
  }

  function injectStyles() {
    if (document.getElementById("lf-reader-discovery-styles")) return;
    var style = document.createElement("style");
    style.id = "lf-reader-discovery-styles";
    style.textContent = ".lf-reader-inline-results{margin:0 16px 12px;padding:13px 14px 5px;border:1px solid var(--lf-reader-border,#e5e0ed);border-radius:15px;background:var(--lf-reader-fill,#fff);box-shadow:0 6px 16px rgba(35,25,52,.05);direction:rtl}.lf-reader-inline-heading{display:flex;align-items:center;justify-content:space-between;margin:0 0 4px}.lf-reader-inline-heading strong{font-size:14px;color:var(--lf-reader-text,#171521)}.lf-reader-inline-heading span{font-size:11px;color:var(--lf-reader-sub,#817b8f)}.lf-reader-inline-row{width:100%;display:flex;align-items:center;gap:10px;padding:10px 0;border:0;border-top:1px solid var(--lf-reader-border,#eeeaf3);background:transparent;color:var(--lf-reader-text,#171521);cursor:pointer;font-family:inherit;text-align:right}.lf-reader-avatar{display:grid;place-items:center;overflow:hidden;width:42px;height:42px;flex:0 0 42px;border-radius:50%;background:linear-gradient(145deg,#9a52f0,#56219c);color:#fff;font-weight:900}.lf-reader-avatar img{width:100%;height:100%;object-fit:cover}.lf-reader-result-copy{min-width:0;flex:1}.lf-reader-result-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:900}.lf-reader-result-handle{display:block;color:var(--lf-reader-sub,#817b8f);font-size:11px;direction:ltr;text-align:right}.lf-reader-inline-state{border-radius:999px;padding:5px 8px;background:rgba(138,43,226,.1);color:#7132c5;font-size:10px;font-weight:800;flex-shrink:0}.lf-reader-profile-backdrop{position:absolute;inset:0;z-index:460;background:rgba(10,8,17,.48);display:flex;align-items:flex-end}.lf-reader-profile-sheet{width:100%;background:var(--lf-reader-bg,#fff);color:var(--lf-reader-text,#171521);border-radius:24px 24px 0 0;padding:14px 18px calc(24px + env(safe-area-inset-bottom));direction:rtl;text-align:center;box-shadow:0 -18px 42px rgba(0,0,0,.22)}.lf-reader-profile-close{float:left;width:34px;height:34px;border:0;border-radius:50%;background:#f0edf5;color:#171521;font-size:22px;cursor:pointer}.lf-reader-profile-sheet .lf-reader-avatar{width:72px;height:72px;flex-basis:72px;margin:12px auto;font-size:25px}.lf-reader-profile-sheet h2{margin:0;font-size:20px}.lf-reader-profile-sheet p{margin:9px 0;color:var(--lf-reader-sub,#817b8f);font-size:13px;line-height:1.7}.lf-reader-genres{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:12px 0}.lf-reader-genres span{background:#f3eefb;color:#7132c5;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800}.lf-reader-profile-follow{width:100%;border:0;border-radius:12px;padding:12px;background:#8a2be2;color:#fff;font:800 13px inherit;cursor:pointer}";
    document.head.appendChild(style);
  }

  function avatarMarkup(reader) {
    var avatar = safeAvatar(reader.avatar);
    return '<span class="lf-reader-avatar">' + (avatar ? '<img src="' + escapeHtml(avatar) + '" alt="">' : escapeHtml(initials(reader.name || reader.username))) + '</span>';
  }

  function openReaderProfile(reader, directory) {
    if (!reader || !reader.id || !root || typeof root.dispatchEvent !== "function" || typeof root.CustomEvent !== "function") return;
    root.dispatchEvent(new root.CustomEvent("lorefy:open-reader-profile", {
      detail: normalizeReader(reader)
    }));
  }

  function inlineReaderSection(page) {
    var section = page.querySelector("[data-lf-inline-reader-results]");
    if (section) return section;
    var header = page.querySelector(".lf-search-header");
    if (!header) return null;
    section = document.createElement("section");
    section.className = "lf-reader-inline-results";
    section.setAttribute("data-lf-inline-reader-results", "true");
    section.setAttribute("aria-live", "polite");
    header.insertAdjacentElement("afterend", section);
    return section;
  }

  function clearInlineReaderResults(page) {
    var section = page && page.querySelector("[data-lf-inline-reader-results]");
    if (section) section.remove();
  }

  function favoriteTypeMarkup(reader,language) {
    var type=reader.favorite_type;
    if(!type)return '';
    var names={Manga:'مانجا',Manhwa:'مانهوا',Manhua:'مانهوا صيني',Comics:'كوميكس',Book:'كتاب',Novel:'رواية','Light Novel':'لايت نوفل','Web Novel':'ويب نوفل'};
    return '<small class="lf-reader-result-type">'+escapeHtml(language==='en'?'Favorite type: '+type:'النوع المفضل: '+(names[type]||type))+'</small>';
  }
  async function renderInlineReaderResults(page, input, directory) {
    var query = input.value;
    if (normalizeQuery(query).length < 2) {
      clearInlineReaderResults(page);
      return;
    }
    var section = inlineReaderSection(page);
    if (!section) return;
    var labels = readerSearchLabels(document.documentElement.lang,0);
    section.innerHTML = '<div class="lf-reader-inline-heading"><strong>' + labels.title + '</strong><span>' + labels.searching + '</span></div>';
    var readers;
    try { readers = await directory.search(query); }
    catch (_) {
      if(page.isConnected && input.value===query) section.textContent=document.documentElement.lang==='en'?'Search failed. Try again.':'تعذر البحث. حاول مجددًا.';
      return;
    }
    if (!page.isConnected || input.value !== query || normalizeQuery(query).length < 2) return;
    if (!readers.length) {
      clearInlineReaderResults(page);
      return;
    }
    section = inlineReaderSection(page);
    labels = readerSearchLabels(document.documentElement.lang,readers.length);
    section.innerHTML = '<div class="lf-reader-inline-heading"><strong>' + labels.title + '</strong><span>' + labels.results + '</span></div>' + readers.map(function (reader) {
      return '<button class="lf-reader-inline-row" type="button" data-reader-id="' + escapeHtml(reader.id) + '" aria-label="' + labels.open + escapeHtml(reader.name || reader.username) + '">' + avatarMarkup(reader) + '<span class="lf-reader-result-copy"><span class="lf-reader-result-name" data-no-translate="true">' + escapeHtml(reader.name || reader.username) + '</span><span class="lf-reader-result-handle" data-no-translate="true">@' + escapeHtml(reader.username) + '</span>' + favoriteTypeMarkup(reader,document.documentElement.lang) + '</span><span class="lf-reader-inline-state">' + (directory.isFollowing(reader.id) ? labels.following : labels.public) + '</span></button>';
    }).join("");
    Array.prototype.forEach.call(section.querySelectorAll("[data-reader-id]"), function (button) {
      button.addEventListener("click", function () {
        var reader = readers.filter(function (item) { return item.id === button.getAttribute("data-reader-id"); })[0];
        if (reader) openReaderProfile(reader, directory);
      });
    });
  }

  function mountSearchEntry() {
    var page = document.querySelector(".lf-search-page");
    var input = page && page.querySelector(".lf-search-box input");
    if (!page || !input) return;
    if (input.dataset.lfReaderSearchBound === "true") return;
    input.dataset.lfReaderSearchBound = "true";
    var directory = buildDirectory();
    var timer;
    function refresh() {
      clearTimeout(timer);
      timer = setTimeout(function () { renderInlineReaderResults(page, input, directory); }, 140);
    }
    input.addEventListener("input", refresh);
    root.addEventListener("lorefy:profile-follow-changed", function (event) {
      var detail = event && event.detail || {};
      if (!detail.profileId) return;
      directory.applyFollowing(detail.profileId, detail.following === true);
      if (page.isConnected && input.value) refresh();
    });
    if (input.value) refresh();
  }

  function openReaderSearch() {
    if(document.querySelector('.lf-reader-discovery-page')) return;
    var en=document.documentElement.lang==='en',directory=buildDirectory(),opener=document.activeElement;
    var page=document.createElement('div');page.className='lf-reader-discovery-page';
    page.setAttribute('role','dialog');page.setAttribute('aria-modal','true');page.setAttribute('aria-label',en?'Find readers':'اكتشف قرّاء');
    page.innerHTML='<header><button type="button" aria-label="'+(en?'Close':'إغلاق')+'">×</button><h2>'+(en?'Find readers':'اكتشف قرّاء')+'</h2></header><input type="search" aria-label="'+(en?'Reader name or username':'اسم القارئ أو المستخدم')+'" placeholder="'+(en?'Name or @username':'الاسم أو @المستخدم')+'"><section aria-live="polite"></section>';
    var input=page.querySelector('input'),results=page.querySelector('section'),close=page.querySelector('button'),timer,revision=0;
    function dismiss(){revision++;clearTimeout(timer);page.remove();if(opener && opener.isConnected)opener.focus();}
    close.addEventListener('click',dismiss);
    page.addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.preventDefault();dismiss();return;}
      if(e.key!=='Tab')return;
      var items=Array.from(page.querySelectorAll('button,input')).filter(function(x){return !x.disabled && x.getClientRects().length;});
      if(e.shiftKey && document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus();}
      else if(!e.shiftKey && document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus();}
    });
    input.addEventListener('input',function(){
      clearTimeout(timer);var request=++revision,query=input.value;
      if(normalizeQuery(query).length<2){results.textContent=en?'Enter at least two characters.':'اكتب حرفين على الأقل.';return;}
      results.textContent=en?'Searching…':'جارٍ البحث…';
      timer=setTimeout(async function(){
        try{
          var readers=await directory.search(query);if(!page.isConnected || request!==revision)return;
          results.replaceChildren();
          if(!readers.length){results.textContent=en?'No matching readers.':'لا توجد حسابات مطابقة.';return;}
          readers.forEach(function(reader){
            var row=document.createElement('button');row.type='button';row.className='lf-reader-inline-row';
            row.innerHTML=avatarMarkup(reader)+'<span class="lf-reader-result-copy"><strong data-no-translate="true">'+escapeHtml(reader.name || reader.username)+'</strong><small data-no-translate="true">@'+escapeHtml(reader.username)+'</small>'+favoriteTypeMarkup(reader,document.documentElement.lang)+'</span>';
            row.addEventListener('click',function(){dismiss();openReaderProfile(reader,directory);});results.appendChild(row);
          });
        }catch(error){if(page.isConnected && request===revision)results.textContent=en?'Search failed. Try again.':'تعذر البحث. حاول مجددًا.';}
      },180);
    });
    results.textContent=en?'Enter a name or username.':'ابحث باسم القارئ أو اسم المستخدم.';
    (document.getElementById('screen') || document.body).appendChild(page);input.focus();
  }
  function install() {
    if (!root.document || root.__lorefyReaderDiscoveryInstalled) return;
    root.__lorefyReaderDiscoveryInstalled = true;
    injectStyles();
    root.addEventListener('lorefy:find-readers',openReaderSearch);
    var queued = false;
    function schedule() {
      if (queued) return;
      queued = true;
      setTimeout(function () { queued = false; mountSearchEntry(); }, 0);
    }
    root.document.addEventListener("DOMContentLoaded", schedule, { once: true });
    var waitForRoot = setInterval(function () {
      var appRoot = root.document.getElementById("root");
      if (!appRoot) return;
      clearInterval(waitForRoot);
      new MutationObserver(schedule).observe(appRoot, { childList: true, subtree: true });
      schedule();
    }, 120);
  }

  function readerSearchLabels(lang,count) {
    var en=lang==='en';
    return {title:en?'Readers':'حسابات القراء',searching:en?'Searching...':'جارٍ البحث...',
      results:count+(en?' results':' نتائج'),open:en?'Open reader ':'فتح حساب ',following:en?'Following':'تتابعه',public:en?'Public account':'حساب عام'};
  }
  return { buildDirectory:buildDirectory, openReaderProfile:openReaderProfile, normalizeQuery: normalizeQuery, createUserDirectory: createUserDirectory, demoReaders: demoReaders, rankReaders: rankReaders, readerSearchLabels:readerSearchLabels, install: install };
});

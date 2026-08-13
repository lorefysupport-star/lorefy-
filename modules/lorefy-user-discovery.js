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
  var demoReaders = [
    { id: "reader-qa", username: "qa_reader", name: "قارئ Lorefy", bio: "أرتب مكتبتي وأشارك مراجعاتي.", genres: ["مانجا", "خيال"], followers: 184 },
    { id: "reader-noura", username: "noura_pages", name: "نورة", bio: "روايات وويب نوفل وكل قصة تترك أثراً.", genres: ["رواية", "رومانسية"], followers: 73 },
    { id: "reader-faisal", username: "faisal_manga", name: "فيصل", bio: "مانجا أسبوعية وشونين كلاسيكي.", genres: ["مانجا", "أكشن"], followers: 261 },
    { id: "reader-sara", username: "sara_reads", name: "سارة العتيبي", bio: "أبحث عن أفضل المانهوا المكتملة.", genres: ["مانهوا", "فانتازيا"], followers: 128 },
    { id: "reader-hassan", username: "hassan_comics", name: "حسن", bio: "كوميكس، روايات مصورة، وقوائم قراءة طويلة.", genres: ["كوميكس", "خيال علمي"], followers: 96 }
  ];

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
      avatar: safeText(reader.avatar, 900),
      genres: Array.isArray(reader.genres) ? reader.genres.map(function (genre) { return safeText(genre, 30); }).filter(Boolean).slice(0, 4) : [],
      followers: Math.max(0, Number(reader.followers) || 0)
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
        if (next) following.add(id); else following.delete(id);
        persistFollowing(storage, following);
        return next;
      }
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
    return /^(?:https?:|data:image\/(?:png|jpe?g|webp);base64,)/i.test(value) ? value : "";
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
    return createUserDirectory({
      readers: isLocalDemo ? demoReaders : [],
      currentUserId: (backend && backend.user && backend.user.id) || identity.id || "",
      blockedIds: safety && safety.safety ? safety.safety.getBlockedUsers() : [],
      adapter: !isLocalDemo && backend && backend.isConfigured && backend.isConfigured() ? backend : null
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
    if (document.getElementById("lf-reader-profile-modal")) return;
    var modal = document.createElement("div");
    modal.id = "lf-reader-profile-modal";
    modal.className = "lf-reader-profile-backdrop";
    modal.innerHTML = '<section class="lf-reader-profile-sheet" role="dialog" aria-modal="true" aria-label="' + escapeHtml(reader.name || reader.username) + '"><button class="lf-reader-profile-close" type="button" aria-label="إغلاق">×</button>' + avatarMarkup(reader) + '<h2>' + escapeHtml(reader.name || reader.username) + '</h2><span class="lf-reader-result-handle">@' + escapeHtml(reader.username) + '</span><p>' + escapeHtml(reader.bio || "قارئ على Lorefy") + '</p><div class="lf-reader-genres">' + reader.genres.map(function (genre) { return '<span>' + escapeHtml(genre) + '</span>'; }).join("") + '</div><button class="lf-reader-profile-follow" type="button" data-follow>' + (directory.isFollowing(reader.id) ? "إلغاء المتابعة" : "متابعة") + '</button></section>';
    document.getElementById("screen").appendChild(modal);
    var close = function () { modal.remove(); };
    modal.querySelector(".lf-reader-profile-close").addEventListener("click", close);
    modal.addEventListener("click", function (event) { if (event.target === modal) close(); });
    modal.querySelector("[data-follow]").addEventListener("click", async function (event) {
      var control = event.currentTarget;
      control.disabled = true;
      try {
        var next = await directory.setFollowing(reader.id, !directory.isFollowing(reader.id));
        control.textContent = next ? "إلغاء المتابعة" : "متابعة";
      } catch (error) {
        control.textContent = "تعذر التحديث";
        setTimeout(function () { control.textContent = directory.isFollowing(reader.id) ? "إلغاء المتابعة" : "متابعة"; }, 1200);
      } finally {
        control.disabled = false;
      }
    });
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

  async function renderInlineReaderResults(page, input, directory) {
    var query = input.value;
    if (normalizeQuery(query).length < 2) {
      clearInlineReaderResults(page);
      return;
    }
    var section = inlineReaderSection(page);
    if (!section) return;
    section.innerHTML = '<div class="lf-reader-inline-heading"><strong>حسابات القراء</strong><span>جارٍ البحث...</span></div>';
    var readers = await directory.search(query);
    if (!page.isConnected || input.value !== query || normalizeQuery(query).length < 2) return;
    if (!readers.length) {
      clearInlineReaderResults(page);
      return;
    }
    section = inlineReaderSection(page);
    section.innerHTML = '<div class="lf-reader-inline-heading"><strong>حسابات القراء</strong><span>' + readers.length + ' نتائج</span></div>' + readers.map(function (reader) {
      return '<button class="lf-reader-inline-row" type="button" data-reader-id="' + escapeHtml(reader.id) + '" aria-label="فتح حساب ' + escapeHtml(reader.name || reader.username) + '">' + avatarMarkup(reader) + '<span class="lf-reader-result-copy"><span class="lf-reader-result-name">' + escapeHtml(reader.name || reader.username) + '</span><span class="lf-reader-result-handle">@' + escapeHtml(reader.username) + '</span></span><span class="lf-reader-inline-state">' + (directory.isFollowing(reader.id) ? "تتابعه" : "حساب عام") + '</span></button>';
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
    if (input.value) refresh();
  }

  function install() {
    if (!root.document || root.__lorefyReaderDiscoveryInstalled) return;
    root.__lorefyReaderDiscoveryInstalled = true;
    injectStyles();
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

  return { normalizeQuery: normalizeQuery, createUserDirectory: createUserDirectory, demoReaders: demoReaders, rankReaders: rankReaders, install: install };
});

(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LorefyProductCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var KEYS = {
    reports: "lorefy.safety.reports.v1",
    blocked: "lorefy.safety.blocked.v1",
    muted: "lorefy.safety.muted.v1",
    corrections: "lorefy.data.corrections.v1",
    visibility: "lorefy.privacy.listVisibility.v1",
    feedback: "lorefy.recommendations.feedback.v1"
  };
  var REPORT_REASONS = ["spam", "abuse", "harassment", "spoiler", "misinformation", "copyright"];
  var CORRECTION_ISSUES = ["cover", "characters", "metadata", "duplicate", "translation"];
  var VISIBILITIES = ["private", "unlisted", "public"];
  var FEEDBACK = ["not_interested", "more_like_this"];

  function createMemoryStore(seed) {
    var values = Object.assign({}, seed || {});
    return {
      getItem: function (key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
      setItem: function (key, value) { values[key] = String(value); },
      removeItem: function (key) { delete values[key]; },
      key: function (index) { return Object.keys(values)[index] || null; },
      get length() { return Object.keys(values).length; },
      snapshot: function () { return Object.assign({}, values); }
    };
  }

  function readJson(store, key, fallback) {
    try {
      var value = store.getItem(key);
      return value == null ? fallback : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(store, key, value) {
    store.setItem(key, JSON.stringify(value));
    return value;
  }

  function cleanText(value, max) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max || 500);
  }

  function createId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function canonicalWorkKey(title) {
    return String(title || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/\b(?:vol(?:ume)?|book|part|edition|ed)\.?\s*#?\s*[0-9٠-٩]+\b/gi, " ")
      .replace(/(?:\b(?:issue|number|no)\.?\s*#?\s*[0-9٠-٩]+\b|#\s*[0-9٠-٩]+\b)/gi, " ")
      .replace(/\(\s*(?:19|20)[0-9]{2}\s*(?:[-\u2013\u2014]\s*(?:(?:19|20)[0-9]{2})?)?\s*\)/g, " ")
      .replace(/(?:المجلد|مجلد|الجزء|جزء|الطبعة|طبعة)\s*[0-9٠-٩]+/g, " ")
      .replace(/[()[\]{}:;,.!?'"`~_\-/\\]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isPortableKey(key) {
    if (!key || /(?:session|activeUser|onboarding\.draft|premium)/i.test(key)) return false;
    return key === "lorefy.identity.v1" ||
      key.indexOf("lorefy.user.") === 0 ||
      key.indexOf("lorefy.lists.") === 0 ||
      key.indexOf("lorefy.customLists.") === 0 ||
      key.indexOf("lorefy.charTopLists.") === 0 ||
      key.indexOf("lorefy.character") === 0 ||
      key.indexOf("lorefy.profile.") === 0 ||
      key.indexOf("lorefy.safety.") === 0 ||
      key.indexOf("lorefy.data.") === 0 ||
      key.indexOf("lorefy.privacy.") === 0 ||
      key.indexOf("lorefy.recommendations.") === 0;
  }

  function buildPortableExport(snapshot, now) {
    var data = {};
    Object.keys(snapshot || {}).sort().forEach(function (key) {
      if (!isPortableKey(key)) return;
      var raw = snapshot[key];
      try { data[key] = JSON.parse(raw); }
      catch (error) { data[key] = raw; }
    });
    return {
      schema: 1,
      product: "Lorefy",
      exportedAt: (now || new Date()).toISOString(),
      data: data
    };
  }

  function storageSnapshot(store) {
    var snapshot = {};
    for (var index = 0; index < Number(store.length || 0); index += 1) {
      var key = store.key(index);
      if (key) snapshot[key] = store.getItem(key);
    }
    return snapshot;
  }

  function createProductCore(store) {
    store = store || (typeof localStorage !== "undefined" ? localStorage : createMemoryStore());

    var safety = {
      getReports: function () { return readJson(store, KEYS.reports, []); },
      report: function (input) {
        input = input || {};
        var targetId = cleanText(input.targetId, 160);
        var reason = cleanText(input.reason, 40);
        if (!targetId) throw new Error("target is required");
        if (REPORT_REASONS.indexOf(reason) === -1) throw new Error("reason is not supported");
        var reports = safety.getReports();
        var report = {
          id: createId("report"),
          targetId: targetId,
          targetType: cleanText(input.targetType || "content", 40),
          reason: reason,
          note: cleanText(input.note, 800),
          status: "pending",
          createdAt: new Date().toISOString()
        };
        var backend = typeof window !== "undefined" && window.LorefyBackend;
        if (backend && backend.mode === "live" && typeof backend.submitReport === "function") {
          return backend.submitReport({
            targetId: report.targetId,
            targetType: report.targetType === "content" ? "review" : report.targetType,
            reason: report.reason,
            note: report.note
          }).then(function (cloudReport) {
            report.id = cloudReport.id;
            report.status = cloudReport.status || "open";
            reports.unshift(report);
            writeJson(store, KEYS.reports, reports.slice(0, 250));
            return report;
          });
        }
        reports.unshift(report);
        writeJson(store, KEYS.reports, reports.slice(0, 250));
        return report;
      },
      getBlockedUsers: function () { return readJson(store, KEYS.blocked, []); },
      getMutedUsers: function () { return readJson(store, KEYS.muted, []); },
      blockUser: function (userId) {
        var id = cleanText(userId, 120);
        if (!id) throw new Error("user is required");
        var backend = typeof window !== "undefined" && window.LorefyBackend;
        if (backend && backend.mode === "live" && typeof backend.setProfileBlock === "function") {
          return backend.setProfileBlock(id, true).then(function () {
            var liveUsers = safety.getBlockedUsers();
            if (liveUsers.indexOf(id) === -1) liveUsers.push(id);
            writeJson(store, KEYS.blocked, liveUsers);
            return liveUsers;
          });
        }
        var users = safety.getBlockedUsers();
        if (users.indexOf(id) === -1) users.push(id);
        writeJson(store, KEYS.blocked, users);
        return users;
      },
      unblockUser: function (userId) {
        var id = String(userId);
        var backend = typeof window !== "undefined" && window.LorefyBackend;
        if (backend && backend.mode === "live" && typeof backend.setProfileBlock === "function") {
          backend.setProfileBlock(id, false).catch(function () {});
        }
        return writeJson(store, KEYS.blocked, safety.getBlockedUsers().filter(function (value) { return value !== id; }));
      },
      muteUser: function (userId) {
        var id = cleanText(userId, 120);
        if (!id) throw new Error("user is required");
        var users = safety.getMutedUsers();
        if (users.indexOf(id) === -1) users.push(id);
        writeJson(store, KEYS.muted, users);
        return users;
      },
      unmuteUser: function (userId) {
        return writeJson(store, KEYS.muted, safety.getMutedUsers().filter(function (id) { return id !== String(userId); }));
      },
      filterCommunity: function (items) {
        var hidden = new Set(safety.getBlockedUsers().concat(safety.getMutedUsers()).map(String));
        return (items || []).filter(function (item) {
          var author = String(item && (item.userId || item.un || item.user) || "");
          return !hidden.has(author);
        });
      }
    };

    var corrections = {
      list: function () { return readJson(store, KEYS.corrections, []); },
      submit: function (input) {
        input = input || {};
        var workId = cleanText(input.workId, 180);
        var issue = cleanText(input.issue, 40);
        if (!workId) throw new Error("work is required");
        if (CORRECTION_ISSUES.indexOf(issue) === -1) throw new Error("issue is not supported");
        var items = corrections.list();
        var correction = {
          id: createId("correction"),
          workId: workId,
          issue: issue,
          note: cleanText(input.note, 1000),
          proposedValue: cleanText(input.proposedValue, 1000),
          status: "pending",
          createdAt: new Date().toISOString()
        };
        items.unshift(correction);
        writeJson(store, KEYS.corrections, items.slice(0, 250));
        return correction;
      }
    };

    var privacy = {
      getListVisibility: function (listId) {
        var map = readJson(store, KEYS.visibility, {});
        return map[String(listId)] || "private";
      },
      setListVisibility: function (listId, visibility) {
        if (VISIBILITIES.indexOf(visibility) === -1) throw new Error("visibility is not supported");
        var id = cleanText(listId, 180);
        if (!id) throw new Error("list is required");
        var map = readJson(store, KEYS.visibility, {});
        map[id] = visibility;
        writeJson(store, KEYS.visibility, map);
        return visibility;
      }
    };

    var recommendations = {
      getFeedback: function () { return readJson(store, KEYS.feedback, {}); },
      setFeedback: function (workId, value) {
        if (FEEDBACK.indexOf(value) === -1) throw new Error("feedback is not supported");
        var id = cleanText(workId, 180);
        if (!id) throw new Error("work is required");
        var map = recommendations.getFeedback();
        map[id] = { value: value, updatedAt: new Date().toISOString() };
        writeJson(store, KEYS.feedback, map);
        return map[id];
      },
      clearFeedback: function (workId) {
        var map = recommendations.getFeedback();
        delete map[String(workId)];
        return writeJson(store, KEYS.feedback, map);
      },
      filter: function (works) {
        var map = recommendations.getFeedback();
        return (works || []).filter(function (work) {
          return !(map[String(work && work.id)] && map[String(work.id)].value === "not_interested");
        });
      }
    };

    return {
      keys: KEYS,
      safety: safety,
      corrections: corrections,
      privacy: privacy,
      recommendations: recommendations,
      exportPortable: function (now) { return buildPortableExport(storageSnapshot(store), now); }
    };
  }

  function authorKey(value) {
    return String(value || '').normalize('NFKD').toLowerCase()
      .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,'')
      .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ')
      .trim().split(/\s+/).sort().join(' ');
  }
  function authorWorks(works, author) {
    if (!author || /unknown|غير معروف|رواية|نوفل|novel/i.test(String(author))) return [];
    var key = authorKey(author), seen = new Set();
    return (works || []).filter(function (work) {
      if (!work || !work.id || seen.has(String(work.id))) return false;
      var names = Array.isArray(work.authors) ? work.authors : [work.auth || work.au || work.author];
      if (!names.some(function (name) { return authorKey(typeof name === 'object' && name ? name.name : name) === key; })) return false;
      seen.add(String(work.id)); return true;
    }).sort(function (a,b) { return (Number(a.yr || a.year) || 9999) - (Number(b.yr || b.year) || 9999); });
  }
  return {
    authorWorks: authorWorks,
    KEYS: KEYS,
    REPORT_REASONS: REPORT_REASONS,
    CORRECTION_ISSUES: CORRECTION_ISSUES,
    createMemoryStore: createMemoryStore,
    createProductCore: createProductCore,
    canonicalWorkKey: canonicalWorkKey,
    buildPortableExport: buildPortableExport,
    storageSnapshot: storageSnapshot,
    isPortableKey: isPortableKey
  };
});

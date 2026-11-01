(function (global) {
  "use strict";

  function viewKey(label, context) {
    context = context || {};
    if (label === "main") return "main:" + (context.homeTab === "community" ? "community" : "home") + (context.feedTab ? ":" + context.feedTab : "");
    if (label === "detail") return "detail:" + (context.workId || "unknown");
    if (label === "userprofile") return "userprofile:" + (context.profileId || "unknown");
    if (label === "listview") return "listview:" + (context.listId || "unknown");
    return String(label || "unknown");
  }

  function restorePosition(node, position) {
    if (typeof node.scrollTo === "function") node.scrollTo({ top:position, behavior:"instant" });
    else node.scrollTop = position;
  }

  function createScrollMemory() {
    var positions = new Map();
    var active = null;
    return {
      enter: function (key, node, options) {
        if (active && (!options || options.capture !== false)) this.remember();
        active = { key:key, node:node };
        var position = positions.get(key) || 0;
        restorePosition(node, position);
        return position;
      },
      remember: function () {
        if (active && active.node && active.node.isConnected !== false) {
          positions.set(active.key, Math.max(0, Number(active.node.scrollTop) || 0));
        }
      },
      position: function (key) { return positions.get(key) || 0; },
      active: function () { return active; }
    };
  }

  function start() {
    var doc = global.document;
    if (!doc || !global.MutationObserver) return;
    var memory = createScrollMemory();
    var pending = null;
    var scheduled = false;

    function stopPending() {
      if (!pending) return;
      pending.observer.disconnect();
      global.clearTimeout(pending.timeout);
      if (pending.frame !== null) global.cancelAnimationFrame(pending.frame);
      pending = null;
    }

    function restoreWhenReady(node, key, target) {
      if (target <= 0 || Math.abs(node.scrollTop - target) <= 2) return;
      var job = { node:node, key:key, observer:null, timeout:0, frame:null };
      function scheduleAttempt() {
        if (pending !== job || job.frame !== null) return;
        job.frame = global.requestAnimationFrame(attempt);
      }
      function attempt() {
        job.frame = null;
        if (pending !== job) return;
        if (!node.isConnected || memory.active().key !== key) { stopPending(); return; }
        restorePosition(node, target);
        if (Math.abs(node.scrollTop - target) <= 2) stopPending();
      }
      // Late image/card batches share one layout write in the next paint frame.
      job.observer = new global.MutationObserver(scheduleAttempt);
      pending = job;
      job.observer.observe(node, { childList:true, subtree:true });
      job.timeout = global.setTimeout(function () { if (pending === job) stopPending(); }, 3000);
      scheduleAttempt();
    }

    function currentView() {
      var screen = doc.querySelector(".lf-app .nc-screen[data-screen-label]");
      if (!screen) return null;
      var node = screen.querySelector(".lf-screen-scroll, .lf-reader-full");
      if (!node) return null;
      var label = screen.getAttribute("data-screen-label");
      var params = new URLSearchParams(global.location.search || "");
      var context = {
        homeTab:screen.querySelector(".lf-community-page") ? "community" : "home",
        feedTab:screen.querySelector('.lf-community-tabs [aria-selected="true"]')?.getAttribute('data-community-filter'),
        workId:screen.querySelector(".lf-detail-page")?.getAttribute("data-lf-work-id") || params.get("novel"),
        profileId:screen.querySelector("[data-lf-public-profile-id]")?.getAttribute("data-lf-public-profile-id") || params.get("profile"),
        listId:params.get("list")
      };
      return { node:node, key:viewKey(label, context) };
    }

    function sync() {
      scheduled = false;
      var view = currentView();
      if (!view) return;
      var previous = memory.active();
      if (previous && previous.node === view.node && previous.key === view.key) return;
      var restoring = !!pending;
      stopPending();
      var sameNode = previous && previous.node === view.node;
      var target = memory.enter(view.key, view.node, { capture:!sameNode && !restoring });
      restoreWhenReady(view.node, view.key, target);
    }

    function schedule() {
      if (scheduled) return;
      scheduled = true;
      global.requestAnimationFrame(sync);
    }

    doc.addEventListener("click", function () { if (!pending) memory.remember(); }, true);
    doc.addEventListener("scroll", function (event) {
      var active = memory.active();
      if (active && event.target === active.node && !pending) memory.remember();
    }, true);
    ["wheel", "touchstart", "keydown"].forEach(function (type) {
      doc.addEventListener(type, function (event) {
        if (pending && pending.node.contains(event.target)) stopPending();
      }, true);
    });
    var observer = new global.MutationObserver(schedule);
    observer.observe(doc.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:["class", "data-screen-label", "aria-selected"] });
    global.addEventListener("popstate", schedule);
    schedule();
    global.LorefyScrollMemory = { memory:memory, sync:sync };
  }

  var api = { createScrollMemory:createScrollMemory, viewKey:viewKey, start:start };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (global.document) {
    if (global.document.readyState === "loading") global.document.addEventListener("DOMContentLoaded", start);
    else start();
  }
})(typeof window !== "undefined" ? window : globalThis);

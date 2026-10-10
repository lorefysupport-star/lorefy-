(function (root, factory) {
  var api = factory(root || {});
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.document) root.LorefyMonitoring = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var STORAGE_KEY = "lorefy.diagnostics.events.v1";
  var MAX_EVENTS = 80;

  function sanitizeMessage(value) {
    return String(value == null ? "" : value)
      .replace(/((?:["']?)(?:access_token|refresh_token|id_token|authorization|password|email|session|user_id|userid|token|secret|key)(?:["']?\s*:\s*))(?:["'][^"']*["']|[^,}\s]+)/gi, "$1\"[redacted]\"")
      .replace(/([?&](?:token|key|secret|code|email|user|session|auth)=[^\s&#]*)/gi, "?[redacted]")
      .replace(/https?:\/\/([^\s?#]+)(?:\?[^\s#]*)?/gi, function (_, hostAndPath) { return "https://" + hostAndPath + "?[redacted]"; })
      .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [redacted]")
      .replace(/\b(?:token|secret|password|authorization)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
      .slice(0, 2400);
  }

  function createEventBuffer(limit, adapter) {
    limit = Math.max(1, Number(limit || MAX_EVENTS));
    var memory = [];
    adapter = adapter || {
      read: function () { return memory; },
      write: function (items) { memory = items.slice(); }
    };
    function list() {
      try {
        var items = adapter.read();
        return Array.isArray(items) ? items.slice(0, limit) : [];
      } catch (error) { return []; }
    }
    return {
      push: function (event) {
        var items = list();
        items.unshift(event);
        adapter.write(items.slice(0, limit));
        return event;
      },
      list: list,
      clear: function () { adapter.write([]); }
    };
  }

  function localAdapter() {
    return {
      read: function () {
        try { return JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "[]"); } catch (error) { return []; }
      },
      write: function (items) {
        try { root.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (error) {}
      }
    };
  }

  var buffer = createEventBuffer(MAX_EVENTS, root.localStorage ? localAdapter() : null);

  function routeName() {
    try {
      var params = new URLSearchParams(root.location.search || "");
      return sanitizeMessage(params.get("route") || root.location.pathname || "unknown");
    } catch (error) { return "unknown"; }
  }

  function eventBase(type, level) {
    return {
      id: "diag-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      type: type,
      level: level || "info",
      route: routeName(),
      createdAt: new Date().toISOString(),
      online: typeof root.navigator === "object" ? root.navigator.onLine !== false : true
    };
  }

  function optionalSend(event) {
    var endpoint = root.LOREFY_MONITORING_ENDPOINT;
    if (!endpoint || typeof root.fetch !== "function") return;
    try {
      root.fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
        keepalive: true,
        credentials: "omit"
      }).catch(function () {});
    } catch (error) {}
  }

  function record(event) {
    buffer.push(event);
    optionalSend(event);
    return event;
  }

  function captureException(error, context) {
    error = error || {};
    var event = eventBase("error", "error");
    event.message = sanitizeMessage(error.message || error.reason || error);
    event.name = sanitizeMessage(error.name || "Error");
    event.stack = sanitizeMessage(error.stack || "").split("\n").slice(0, 8).join("\n");
    event.context = sanitizeMessage(context || "");
    return record(event);
  }

  function captureMessage(message, level, details) {
    var event = eventBase("message", level || "info");
    event.message = sanitizeMessage(message);
    if (details != null) event.details = sanitizeMessage(typeof details === "string" ? details : JSON.stringify(details));
    return record(event);
  }

  function getDiagnostics() {
    var navigation = null;
    try {
      var entry = root.performance && root.performance.getEntriesByType && root.performance.getEntriesByType("navigation")[0];
      if (entry) navigation = {
        domInteractiveMs: Math.round(entry.domInteractive),
        domCompleteMs: Math.round(entry.domComplete),
        transferBytes: Math.round(entry.transferSize || 0)
      };
    } catch (error) {}
    return {
      schema: 1,
      product: "Lorefy",
      exportedAt: new Date().toISOString(),
      route: routeName(),
      navigation: navigation,
      events: buffer.list()
    };
  }

  if (root.addEventListener && !root.__lorefyDiagnosticsBound) {
    root.__lorefyDiagnosticsBound = true;
    root.addEventListener("error", function (event) {
      captureException(event.error || event.message, "window.error");
    });
    root.addEventListener("unhandledrejection", function (event) {
      captureException(event.reason || "Unhandled promise rejection", "unhandledrejection");
    });
    try {
      if (root.PerformanceObserver) {
        var observer = new root.PerformanceObserver(function (list) {
          list.getEntries().forEach(function (entry) {
            if (entry.duration < 180) return;
            var event = eventBase("long-task", "warning");
            event.durationMs = Math.round(entry.duration);
            record(event);
          });
        });
        observer.observe({ type: "longtask", buffered: true });
      }
    } catch (error) {}
  }

  return {
    sanitizeMessage: sanitizeMessage,
    createEventBuffer: createEventBuffer,
    captureException: captureException,
    captureMessage: captureMessage,
    setUserId: function () {},
    getDiagnostics: getDiagnostics,
    clear: buffer.clear,
    events: buffer.list
  };
});

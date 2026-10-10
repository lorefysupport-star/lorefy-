/* Build-time public configuration. The iOS preparation step replaces this
   with the public Supabase endpoint and publishable key when available. */
window.LOREFY_SUPABASE = window.LOREFY_SUPABASE || null;
window.LOREFY_RELEASE = window.LOREFY_RELEASE || {};
// The web preview is static, so its /api/catalog and /api/media routes do not
// exist. This public, anonymous gateway is also declared in lorefy-build-public.json.
window.LOREFY_RELEASE.catalogProxyUrl = window.LOREFY_RELEASE.catalogProxyUrl ||
  "https://qsroxmltioxqozmykens.supabase.co/functions/v1/lorefy-public";

/* Optional restricted-media mode. Catalog artwork remains enabled unless a
   release explicitly opts into this guard. URL validation and proxy allowlists
   still run in the cover and sharing modules. */
;(function (global) {
  "use strict";

  var doc = global.document;

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function nativeRuntime() {
    var capacitor = global.Capacitor;
    try {
      return !!(capacitor && (
        (typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform()) ||
        (typeof capacitor.getPlatform === "function" && capacitor.getPlatform() !== "web")
      ));
    } catch (_) {
      return false;
    }
  }

  function enabled() {
    var release = global.LOREFY_RELEASE || {};
    return nativeRuntime() && release.rightsSafeMedia === true;
  }

  function safeXml(value) {
    return text(value).replace(/[&<>"']/g, function (character) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character];
    });
  }

  function placeholder(label) {
    var title = safeXml(text(label) || "Lorefy").slice(0, 28);
    var seed = Array.prototype.reduce.call(title, function (sum, character) {
      return (sum * 31 + character.charCodeAt(0)) % 360;
    }, 208);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 720" role="img" aria-label="Lorefy generated cover">' +
      '<rect width="480" height="720" fill="hsl(' + seed + ', 46%, 25%)"/>' +
      '<circle cx="380" cy="160" r="180" fill="hsl(' + ((seed + 42) % 360) + ', 58%, 42%)" opacity=".42"/>' +
      '<path d="M70 565h340" stroke="white" stroke-opacity=".32" stroke-width="3"/>' +
      '<text x="240" y="325" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="30" font-weight="700">LOREFY</text>' +
      '<text x="240" y="372" text-anchor="middle" fill="white" fill-opacity=".9" font-family="Arial, sans-serif" font-size="22">' + title + '</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function configuredSupabaseOrigins() {
    var release = global.LOREFY_RELEASE || {};
    var candidates = [release.supabase && release.supabase.url, global.LOREFY_SUPABASE && global.LOREFY_SUPABASE.url];
    return candidates.map(function (value) {
      try { return new URL(text(value)).origin; } catch (_) { return ""; }
    }).filter(Boolean);
  }

  function isAllowedUrl(value) {
    var raw = text(value);
    if (!raw || /^(?:data:image\/|blob:)/i.test(raw)) return true;
    try {
      var parsed = new URL(raw, global.location && global.location.href || "http://localhost/");
      var location = global.location || {};
      if (parsed.origin === location.origin) return true;
      if (configuredSupabaseOrigins().indexOf(parsed.origin) !== -1 &&
          /^\/storage\/v1\/object\/(?:sign|authenticated|public)\/(?:profile-media|review-media)(?:\/|$)/i.test(parsed.pathname)) return true;
    } catch (_) {}
    return false;
  }

  function coverUrl(value, label) {
    var raw = text(value);
    return !enabled() || isAllowedUrl(raw) ? raw : placeholder(label);
  }

  function protectImage(image) {
    if (!enabled() || !image || String(image.tagName || "").toUpperCase() !== "IMG") return;
    var source = text(image.getAttribute && image.getAttribute("src"));
    if (!source || isAllowedUrl(source)) return;
    image.setAttribute("data-lorefy-original-src", source);
    image.setAttribute("src", placeholder(image.getAttribute("alt") || "Lorefy"));
  }

  function protectTree(node) {
    if (!node || node.nodeType !== 1) return;
    protectImage(node);
    if (node.querySelectorAll) node.querySelectorAll("img").forEach(protectImage);
  }

  function installDomProtection() {
    if (!enabled() || !doc || !doc.documentElement) return;
    protectTree(doc.documentElement);
    if (typeof MutationObserver !== "function") return;
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === "attributes") protectImage(record.target);
        else record.addedNodes.forEach(protectTree);
      });
    }).observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  }

  global.LorefyRightsSafeMedia = {
    enabled: enabled,
    isAllowedUrl: isAllowedUrl,
    coverUrl: coverUrl,
    placeholder: placeholder
  };

  installDomProtection();
})(window);

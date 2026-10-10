/* Lorefy public data gateway.
   Providers with unstable browser CORS are routed through the bounded public
   gateway. Jikan publishes CORS support, and its edge origin currently times
   out from Supabase, so Jikan remains a direct anonymous fallback. */
(function (global) {
  "use strict";

  function text(value) { return String(value || "").trim(); }
  function trimSlash(value) { return text(value).replace(/\/+$/, ""); }

  function publicBase() {
    var release = global.LOREFY_RELEASE || {};
    var explicit = trimSlash(release.catalogProxyUrl);
    if (/^https:\/\/[^/]+\/functions\/v1\/lorefy-public$/i.test(explicit)) return explicit;

    var supabase = release.supabase || global.LOREFY_SUPABASE || {};
    var url = trimSlash(supabase.url);
    return /^https:\/\//i.test(url) ? url + "/functions/v1/lorefy-public" : "";
  }

  function sameOriginBase() {
    var config = global.LOREFY_REMOTE_CATALOG || {};
    return text(config.proxyBaseUrl).replace(/^\/+|\/+$/g, "");
  }

  function catalogUrl(provider, targetUrl) {
    var parsed;
    try { parsed = new URL(targetUrl, global.location && global.location.href); } catch (_) { return targetUrl; }
    provider = text(provider).toLowerCase();
    var supported = ["anilist", "mangadex", "mangadex-covers", "openlibrary", "googlebooks", "jikan", "openlibrary-editions", "wikipedia", "wikidata", "commons", "dc-fandom", "marvel-fandom"];
    if (supported.indexOf(provider) < 0) return targetUrl;
    // Do not make all character and alternate-cover retrieval depend on a
    // single Edge egress path. These requests carry no session or user data.
    if (provider === "jikan") return targetUrl;
    var route = "catalog-" + encodeURIComponent(provider);
    var publicGateway = publicBase();
    if (publicGateway) {
      if (provider === "openlibrary-editions") {
        var match = parsed.pathname.match(/\/works\/([^/]+)\/editions\.json$/i);
        if (!match) return targetUrl;
        return publicGateway + "/" + route + "?work=" + encodeURIComponent(match[1]) + (parsed.search ? "&" + parsed.search.slice(1) : "");
      }
      return publicGateway + "/" + route + parsed.search;
    }

    var localGateway = sameOriginBase();
    if (localGateway && global.location && global.location.origin && global.location.origin !== "null") {
      return "/" + localGateway + "/" + encodeURIComponent(text(provider).toLowerCase()) + parsed.search;
    }
    return targetUrl;
  }

  function mediaUrl(targetUrl) {
    var parsed;
    try { parsed = new URL(targetUrl, global.location && global.location.href); } catch (_) { return targetUrl; }
    if (!/^https:$/i.test(parsed.protocol)) return targetUrl;
    if (/\/functions\/v1\/lorefy-public\/media$/i.test(parsed.pathname)) return parsed.toString();
    var publicGateway = publicBase();
    if (publicGateway) return publicGateway + "/media?url=" + encodeURIComponent(parsed.toString());
    var localGateway = sameOriginBase();
    if (localGateway) return "/api/media?url=" + encodeURIComponent(parsed.toString());
    return targetUrl;
  }

  global.LorefyDataProxy = Object.freeze({
    publicBase: publicBase,
    catalogUrl: catalogUrl,
    mediaUrl: mediaUrl
  });
})(typeof window !== "undefined" ? window : this);

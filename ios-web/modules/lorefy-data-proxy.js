/* Lorefy public data gateway.
   Providers with unstable browser CORS are routed through the bounded public
   gateway. Tenrai's Jikan-compatible MAL API is a direct anonymous fallback.
   The public api.jikan.moe service was discontinued on 2026-10-01. */
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
    var supported = ["anilist", "mangadex", "mangadex-covers", "openlibrary", "googlebooks", "jikan", "openlibrary-editions", "wikipedia", "wikidata", "commons", "dc-fandom", "marvel-fandom", "bookbrainz", "gcd"];
    if (supported.indexOf(provider) < 0) return targetUrl;
    if(global.LOREFY_REMOTE_CATALOG?.openSourcesPreview===true&&['localhost','127.0.0.1'].includes(global.location?.hostname)&&['openlibrary','googlebooks','wikidata','bookbrainz','gcd'].includes(provider)){
      var params=new URLSearchParams(parsed.search);
      if(provider==='bookbrainz')params.set('path',parsed.pathname);
      if(provider==='gcd'){var match=parsed.pathname.match(/\/series\/name\/([^/]+)\//);if(!match)return targetUrl;params.set('q',decodeURIComponent(match[1]));}
      return '/api/catalog/'+provider+'?'+params;
    }
    // Keep the legacy provider key for existing callers and cached identities.
    // This route carries public MAL resource IDs/queries, never account state.
    if (provider === "jikan") {
      if (parsed.origin === "https://api.jikan.moe" && parsed.pathname.indexOf("/v4/") === 0) {
        return "https://api.tenrai.org/v1" + parsed.pathname.slice(3) + parsed.search;
      }
      return targetUrl;
    }
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

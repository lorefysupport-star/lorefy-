/* config/lorefy-config.js — Supabase credentials (optional).
   Leaving keys unset disables cloud accounts outside the explicit local
   preview. To enable real cloud accounts, set:

   window.LOREFY_SUPABASE = { url: "https://YOUR_PROJECT.supabase.co", anonKey: "YOUR_ANON_KEY" };

   NOTE: the original config file was not present in the uploaded package;
   this placeholder keeps production fail-closed until configured.
*/
window.LOREFY_SUPABASE = window.LOREFY_SUPABASE || null;

var lorefyCloudConfigured = !!(window.LOREFY_SUPABASE &&
  window.LOREFY_SUPABASE.url &&
  window.LOREFY_SUPABASE.anonKey &&
  !/YOUR_/.test(String(window.LOREFY_SUPABASE.url) + String(window.LOREFY_SUPABASE.anonKey)));
var lorefyLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
var lorefyLocalDemo = lorefyLocalHost &&
  new URLSearchParams(location.search || "").get("preview") === "demo";
var lorefyBetaGuest = !!(window.LOREFY_RELEASE && window.LOREFY_RELEASE.betaGuestMode);
var lorefyReleaseApiUrl = window.LOREFY_RELEASE && window.LOREFY_RELEASE.apiUrl;
var lorefyPublicCatalogProxy = window.LOREFY_RELEASE && window.LOREFY_RELEASE.catalogProxyUrl;
var lorefyCatalogProxyBase = /^https:\/\//i.test(String(lorefyReleaseApiUrl || ""))
  ? String(lorefyReleaseApiUrl).replace(/\/+$/, "").replace(/\/api\/catalog$/i, "") + "/api/catalog"
  : "api/catalog";

/* Sign-in policy: OAuth only (Google / Apple). Email/password accounts are
   disabled — users must link a Google or Apple account. */
window.LOREFY_FEATURES = window.LOREFY_FEATURES || {
  oauthProviders: {
    google: { enabled: !lorefyBetaGuest && (lorefyCloudConfigured || lorefyLocalHost) },
    apple: { enabled: !lorefyBetaGuest && !!(window.LOREFY_RELEASE && window.LOREFY_RELEASE.nativeAppleSignInEnabled) && (lorefyCloudConfigured || lorefyLocalHost) }
  },
  emailAuth: { enabled: false },
  /* Demo accounts are allowed only on localhost with ?preview=demo. */
  demoAuthEnabled: true,
  /* Premium is server-authoritative. Local preview enables it explicitly. */
  premium: !!(window.LOREFY_RELEASE && window.LOREFY_RELEASE.betaPremiumUnlocked),
  premiumPreviewUnlocked: true
};

/* Do not offer a social provider until it is configured in Supabase. */
if ((!window.LOREFY_FEATURES.oauthProviders.google.enabled || window.LOREFY_FEATURES.oauthProviders.apple.enabled === false) && !document.getElementById("lorefy-auth-provider-visibility")) {
  var lorefyAuthProviderStyle = document.createElement("style");
  lorefyAuthProviderStyle.id = "lorefy-auth-provider-visibility";
  var unavailableProviders = [];
  if (!window.LOREFY_FEATURES.oauthProviders.google.enabled) unavailableProviders.push(".lf-auth .lf-page > div[style*='display: grid'] > button:nth-of-type(1)");
  if (window.LOREFY_FEATURES.oauthProviders.apple.enabled === false) unavailableProviders.push(".lf-auth .lf-page > div[style*='display: grid'] > button:nth-of-type(2)");
  lorefyAuthProviderStyle.textContent = unavailableProviders.join(",") + "{display:none!important}";
  document.head.appendChild(lorefyAuthProviderStyle);
}

/* Local demo only: keep the development build usable without pretending OAuth is configured. */
if (!lorefyCloudConfigured && !lorefyLocalDemo && lorefyLocalHost) {
  document.addEventListener("click", function(event){
    var target = event.target && event.target.closest ? event.target.closest("button") : null;
    if (!target || !target.closest(".lf-auth") || !/Google|Apple/.test(target.textContent || "")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var params = new URLSearchParams(location.search || "");
    params.set("preview", "demo");
    params.set("demo", "ready");
    location.search = params.toString();
  }, true);
  function mountLorefyLocalDemoEntry(attempt){
    var auth = document.querySelector(".lf-auth");
    if (!auth) {
      if (attempt < 30) window.setTimeout(function(){ mountLorefyLocalDemoEntry(attempt + 1); }, 100);
      return;
    }
    if (document.getElementById("lorefy-local-demo-entry")) return;
    var entry = document.createElement("div");
    entry.id = "lorefy-local-demo-entry";
    entry.style.cssText = "position:absolute;inset-inline:24px;bottom:72px;z-index:4;text-align:center";
    entry.innerHTML = '<p style="margin:0 0 9px;color:#a8a3a7;font:500 11px Readex Pro,Cairo,sans-serif">الدخول الحقيقي يحتاج إعداد Supabase</p><button type="button" style="width:100%;min-height:50px;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:#211d21;color:#f7f4f3;font:700 14px Readex Pro,Cairo,sans-serif;cursor:pointer">فتح التطبيق تجريبياً</button>';
    entry.querySelector("button").addEventListener("click", function(){
      var params = new URLSearchParams(location.search || "");
      params.set("preview", "demo");
      params.set("demo", "ready");
      location.search = params.toString();
    });
    auth.appendChild(entry);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function(){ mountLorefyLocalDemoEntry(0); }, { once:true });
  else mountLorefyLocalDemoEntry(0);
}

/* Billing stays disabled until a verified provider and server entitlements
   are configured. The local preview is intentionally separate from billing. */
window.LOREFY_BILLING = window.LOREFY_BILLING || {
  mode: "not-configured",
  configured: false,
  provider: null,
  checkoutEnabled: false,
  checkoutFunction: "create-checkout-session",
  restoreFunction: "restore-purchases",
  products: ["monthly", "yearly"],
  previewQuery: "preview=premium"
};

/* Weekly catalog updates. In production, point manifestUrl to the public
   Supabase Storage/Edge Function URL that publishes the latest delta. */
window.LOREFY_CATALOG_UPDATES = window.LOREFY_CATALOG_UPDATES || {
  enabled: true,
  autoCheck: true,
  manifestUrl: "uploads/lorefy-catalog-manifest.json",
  checkIntervalMs: 1000 * 60 * 60 * 24 * 7
};

/* Remote catalog APIs keep the bundled catalog light. Local originals stay in
   place; new or missing works are fetched on demand and cached as small deltas. */
window.LOREFY_REMOTE_CATALOG = window.LOREFY_REMOTE_CATALOG || {
  enabled: true,
  autoSearch: true,
    // Load only the selected type's bundled expansion after the base catalog is ready.
    // Other types and remote providers remain lazy.
    autoWarmCurrentType: true,
  warmAllTypes: false,
  warmDelayMs: 1600,
  baselineWarmDelayMs: 2600,
  baselineWarmTarget: 0,
  minimumNewWorksPerType: 500,
  expandedTargets: { "رواية": 900, "كتاب": 800 },
  expandedPageSize: 100,
  pagesPerWarmType: 0,
  perPage: 50,
  maxCachedWorks: 1800,
  proxyBaseUrl: lorefyCatalogProxyBase,
  publicProxyUrl: lorefyPublicCatalogProxy,
  providers: {
    expanded: true,
    anilist: true,
    mangaDex: true,
    openLibrary: true,
    googleBooks: false
  }
};

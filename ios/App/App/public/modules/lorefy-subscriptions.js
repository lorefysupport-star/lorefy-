/* Lorefy subscriptions facade.
   Billing remains intentionally inert until a verified provider and server
   entitlement endpoint are configured. Local Premium preview is not an
   account entitlement and is never accepted by this module as one. */
(function (global) {
  "use strict";

  var billing = global.LOREFY_BILLING || {};

  function isLocalPreview() {
    var location = global.location || {};
    var hostname = String(location.hostname || "").toLowerCase();
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(hostname)) return false;
    var params = new URLSearchParams(String(location.search || ""));
    return params.get("preview") === "premium";
  }

  function getStatus() {
    return {
      mode: String(billing.mode || "not-configured"),
      provider: billing.provider || null,
      configured: billing.configured === true && !!billing.provider,
      checkoutEnabled: billing.checkoutEnabled === true,
      preview: isLocalPreview(),
      entitlementsSource: "server"
    };
  }

  function unavailable() {
    var error = new Error("Billing is not configured.");
    error.code = "LOREFY_BILLING_NOT_CONFIGURED";
    return Promise.reject(error);
  }

  function getEntitlements() {
    var backend = global.LorefyBackend;
    if (!backend || backend.mode !== "live" || typeof backend.getEntitlements !== "function") {
      return unavailable();
    }
    return backend.getEntitlements();
  }

  function startCheckout(product) {
    var status = getStatus();
    var backend = global.LorefyBackend;
    if (!status.configured || !status.checkoutEnabled || !backend || backend.mode !== "live" || typeof backend.startCheckout !== "function") {
      return unavailable();
    }
    var products = Array.isArray(billing.products) ? billing.products.map(function(item){ return String(item).toLowerCase(); }) : [];
    product = String(typeof product === "string" ? product : product && product.product || "").trim().toLowerCase();
    if (!product || products.indexOf(product) === -1) {
      var error = new Error("The selected subscription product is not available.");
      error.code = "LOREFY_BILLING_PRODUCT_INVALID";
      return Promise.reject(error);
    }
    return backend.startCheckout(product);
  }

  function restorePurchases() {
    var status = getStatus();
    var backend = global.LorefyBackend;
    if (!status.configured || !status.checkoutEnabled || !backend || backend.mode !== "live" || typeof backend.restorePurchases !== "function") {
      return unavailable();
    }
    return backend.restorePurchases();
  }

  global.LorefySubscriptions = {
    status: getStatus,
    getStatus: getStatus,
    getEntitlements: getEntitlements,
    startCheckout: startCheckout,
    restorePurchases: restorePurchases
  };
}(window));

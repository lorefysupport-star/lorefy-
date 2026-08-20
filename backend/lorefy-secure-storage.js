/* Native-only Supabase session storage backed by iOS Keychain. */
(function (global) {
  "use strict";

  function isNative() {
    return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());
  }

  if (!isNative()) return;
  var plugin = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.SecureStorage;
  if (!plugin) {
    console.error("[Lorefy] Native secure storage plugin is unavailable.");
    var unavailable = function () {
      return Promise.reject(new Error("Lorefy cannot open the iOS Keychain."));
    };
    global.LorefySecureAuthStorageReady = false;
    global.LorefySecureAuthStorage = {
      getItem: unavailable,
      setItem: unavailable,
      removeItem: unavailable
    };
    return;
  }

  var ready = Promise.resolve().then(function () {
    return plugin.setKeyPrefix("lorefy-auth-");
  }).then(async function () {
    var legacyKeys = [];
    for (var index = 0; index < localStorage.length; index += 1) {
      var key = localStorage.key(index);
      if (key && /^sb-[a-z0-9]+-auth-token$/i.test(key)) legacyKeys.push(key);
    }
    try {
      for (var item = 0; item < legacyKeys.length; item += 1) {
        var value = localStorage.getItem(legacyKeys[item]);
        if (value) {
          await plugin.setItem(legacyKeys[item], value);
          var stored = await plugin.getItem(legacyKeys[item]);
          if (stored !== value) throw new Error("Keychain migration verification failed.");
        }
        localStorage.removeItem(legacyKeys[item]);
      }
    } catch (error) {
      legacyKeys.forEach(function (legacyKey) { localStorage.removeItem(legacyKey); });
      global.LorefySecureAuthStorageReady = false;
      console.error("[Lorefy] Session migration to Keychain failed closed:", error);
      throw new Error("Keychain migration failed. Sign in again.");
    }
  });

  global.LorefySecureAuthStorageReady = true;
  global.LorefySecureAuthStorage = {
    getItem: function (key) { return ready.then(function () { return plugin.getItem(key); }); },
    setItem: function (key, value) { return ready.then(function () { return plugin.setItem(key, value); }); },
    removeItem: function (key) { return ready.then(function () { return plugin.removeItem(key); }); }
  };
})(typeof window !== "undefined" ? window : this);

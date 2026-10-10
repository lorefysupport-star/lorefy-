/* Native-only Supabase session storage backed by iOS Keychain. */
(function (global) {
  "use strict";

  function isNative() {
    return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());
  }

  if (!isNative()) return;
  var plugin = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.SecureStorage;
  var keyPrefix = "lorefy-auth-";

  function isPkceVerifierKey(key) {
    return /-code-verifier$/i.test(String(key || ""));
  }

  function createStorageAdapter(nativePlugin) {
    if (!nativePlugin) return null;
    if (typeof nativePlugin.setKeyPrefix === "function" &&
        typeof nativePlugin.getItem === "function" &&
        typeof nativePlugin.setItem === "function" &&
        typeof nativePlugin.removeItem === "function") {
      return {
        configure: function () { return nativePlugin.setKeyPrefix(keyPrefix); },
        getItem: function (key) { return nativePlugin.getItem(key); },
        setItem: function (key, value) { return nativePlugin.setItem(key, value); },
        removeItem: function (key) { return nativePlugin.removeItem(key); }
      };
    }
    if (typeof nativePlugin.internalGetItem === "function" &&
        typeof nativePlugin.internalSetItem === "function" &&
        typeof nativePlugin.internalRemoveItem === "function") {
      return {
        configure: function () { return Promise.resolve(); },
        getItem: function (key) {
          return nativePlugin.internalGetItem({ prefixedKey:keyPrefix + key, sync:false })
            .then(function (result) { return result && result.data != null ? String(result.data) : null; });
        },
        setItem: function (key, value) {
          return nativePlugin.internalSetItem({ prefixedKey:keyPrefix + key, data:String(value), sync:false });
        },
        removeItem: function (key) {
          return nativePlugin.internalRemoveItem({ prefixedKey:keyPrefix + key, sync:false });
        }
      };
    }
    return null;
  }

  var storage = createStorageAdapter(plugin);
  if (!storage) {
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
    return storage.configure();
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
          await storage.setItem(legacyKeys[item], value);
          var stored = await storage.getItem(legacyKeys[item]);
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
    getItem: function (key) {
      if (isPkceVerifierKey(key)) return Promise.resolve(global.localStorage.getItem(key));
      return ready.then(function () { return storage.getItem(key); });
    },
    setItem: function (key, value) {
      if (isPkceVerifierKey(key)) {
        global.localStorage.setItem(key, String(value));
        return Promise.resolve();
      }
      return ready.then(function () { return storage.setItem(key, value); });
    },
    removeItem: function (key) {
      if (isPkceVerifierKey(key)) {
        global.localStorage.removeItem(key);
        return Promise.resolve();
      }
      return ready.then(function () { return storage.removeItem(key); });
    }
  };
})(typeof window !== "undefined" ? window : this);

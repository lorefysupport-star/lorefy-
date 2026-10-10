/* Authentication hashing uses iOS CryptoKit on custom-scheme WebViews. */
(function(global){
  "use strict";
  global.LorefyNativeSHA256 = async function(value){
    var native = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.LorefyAuthCrypto;
    if (native && typeof native.sha256 === "function") {
      var result = await native.sha256({ value:String(value) });
      if (!result || !/^[a-f0-9]{64}$/i.test(result.hex)) throw new Error("Invalid native authentication digest");
      return result.hex.toLowerCase();
    }
    if (!global.crypto || !global.crypto.subtle || !global.TextEncoder) throw new Error("Secure authentication hashing is unavailable");
    var digest = await global.crypto.subtle.digest("SHA-256", new global.TextEncoder().encode(String(value)));
    return Array.from(new Uint8Array(digest), function(byte){ return byte.toString(16).padStart(2, "0"); }).join("");
  };
})(typeof window !== "undefined" ? window : this);

/* Reclaim only reproducible downloads when a user save runs out of space. */
(function (root) {
  'use strict';
  var caches = ['lorefy.api.catalog.cache.v3', 'lorefy.characterCastCache.v20', 'lorefy.workRelations.v1'];
  function quota(error) {
    return error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014);
  }
  function write(storage, key, serialized) {
    try { storage.setItem(key, serialized); return true; }
    catch (error) { if (!quota(error)) throw error; }
    for (var i=0; i<caches.length; i++) {
      if (caches[i] === key || storage.getItem(caches[i]) == null) continue;
      storage.removeItem(caches[i]);
      try { storage.setItem(key, serialized); return true; }
      catch (error) { if (!quota(error)) throw error; }
    }
    return false;
  }
  var api={write:write};
  if (typeof module === 'object' && module.exports) module.exports=api;
  else root.LorefyStorageBudget=api;
})(typeof window !== 'undefined' ? window : this);

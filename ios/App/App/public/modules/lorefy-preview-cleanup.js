(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.LorefyPreviewCleanup = api;
    if (root.document) api.cleanStorage(root.localStorage);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var removed = {};
  var knownReader = /^(?:10000000-0000-4000-8000-00000000000[1-9abc]|reader-(?:qa|noura|faisal|sara|hassan))$/i;
  var knownContent = /^demo-(?:review|post|reply)-\d+$/;
  var referenceFields = ["id", "userId", "user_id", "author_id", "parent_id", "parentId", "reviewId", "review_id", "postId", "post_id"];
  var keys = [
    "lorefy.user.privateReviews.v2", "lorefy.user.communityPosts.v1",
    "lorefy.user.communityReactions.v1", "lorefy.user.following.v1",
    "lorefy.user.replyInbox.v1", "lorefy.review.saved.v1",
    "lorefy.communityLikes.v1", "lorefy.communityMyLikes.v1",
    "lorefy.communityDislikes.v1", "lorefy.communityMyDislikes.v1",
    "lorefy.reviewDetailDislikes.v1", "lorefy.reviewDetailMyDislikes.v1",
    "lorefy.communityActiveReview.v1", "lorefy.communityActiveReviewId.v1"
  ];

  function isFixtureId(value) {
    return typeof value === "string" && (knownReader.test(value) || knownContent.test(value));
  }

  function cleanValue(value) {
    if (isFixtureId(value)) return removed;
    if (Array.isArray(value)) return value.map(cleanValue).filter(function (item) { return item !== removed; });
    if (!value || typeof value !== "object") return value;
    if (referenceFields.some(function (field) { return isFixtureId(value[field]); })) return removed;
    var result = {};
    Object.keys(value).forEach(function (key) {
      if (isFixtureId(key)) return;
      var next = cleanValue(value[key]);
      if (next !== removed) result[key] = next;
    });
    return result;
  }

  function cleanStoredValue(raw) {
    if (isFixtureId(raw)) return null;
    try {
      var clean = cleanValue(JSON.parse(raw));
      return clean === removed ? null : JSON.stringify(clean);
    } catch (error) { return raw; }
  }

  function cleanStorage(storage) {
    var changed = 0;
    if (!storage) return changed;
    function cleanKey(key) {
      var raw = storage.getItem(key);
      if (raw == null) return;
      var next = cleanStoredValue(raw);
      if (next === raw) return;
      if (next == null) storage.removeItem(key);
      else storage.setItem(key, next);
      changed += 1;
    }
    try {
      keys.forEach(cleanKey);
      // Prevent queued sync writes from restoring removed preview records.
      ["lorefy.pendingState.v1", "lorefy.stateBase.v1"].forEach(function (key) {
        var raw = storage.getItem(key);
        if (!raw) return;
        var wrapper = JSON.parse(raw);
        var values = key === "lorefy.stateBase.v1" ? wrapper.data : wrapper;
        if (!values || typeof values !== "object") return;
        var touched = false;
        keys.forEach(function (stateKey) {
          if (typeof values[stateKey] !== "string") return;
          var next = cleanStoredValue(values[stateKey]);
          if (values[stateKey] !== next) { values[stateKey] = next; touched = true; }
        });
        if (touched) { storage.setItem(key, JSON.stringify(wrapper)); changed += 1; }
      });
    } catch (error) {}
    return changed;
  }

  return { isFixtureId:isFixtureId, cleanStorage:cleanStorage };
});

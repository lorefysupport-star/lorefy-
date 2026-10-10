(function (root) {
  'use strict';
  if (!root.document) return;

  function cacheOpenedWork() {
    var params = new URLSearchParams(root.location.search || '');
    if (params.get('route') !== 'detail') return;
    var id = params.get('novel') || params.get('id');
    if (!id) return;
    var work = (root.LorefyMangaData || []).find(function (item) { return item && String(item.id) === id; });
    if (!work) return;
    try { root.sessionStorage.setItem('lorefy.catalog.openWork.v1', JSON.stringify(work)); } catch (error) {}
  }

  function onSearchResult(event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function' || !target.closest('.lf-search-page .lf-search-result')) return;
    if (target.closest('button')) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    root.setTimeout(cacheOpenedWork, 80);
  }

  root.document.addEventListener('click', onSearchResult, true);
  root.document.addEventListener('keydown', onSearchResult, true);
})(window);

(function (root, factory) {
  var identity = root && root.LorefyCatalogIdentity;
  if (!identity && typeof module === 'object' && module.exports) identity = require('./lorefy-catalog-identity.js');
  var api = factory(root, identity);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyComicsSearch = api;
})(typeof window !== 'undefined' ? window : null, function (root, identity) {
  'use strict';

  function isComic(work) {
    return /^(?:comics?|\u0643\u0648\u0645\u064a\u0643\u0633)$/i.test(String(work && work.type || ''));
  }

  function titleKey(work) {
    var title = String(work && work.title || '').trim();
    return identity && typeof identity.canonicalWorkKey === 'function'
      ? identity.canonicalWorkKey(title)
      : title.toLowerCase();
  }

  function groupResults(works) {
    if (!Array.isArray(works)) return [];
    var groups = new Map();
    var result = [];
    works.forEach(function (work) {
      if (!isComic(work) || !titleKey(work)) {
        result.push(work);
        return;
      }
      var key = titleKey(work);
      var candidates = groups.get(key) || [];
      var group = candidates.find(function (candidate) {
        return candidate.works.some(function (existing) {
          return identity && typeof identity.sameWork === 'function'
            ? identity.sameWork(existing, work, root && root.LorefyCatalogAliases || {})
            : String(existing.id) === String(work.id);
        });
      });
      if (!group) {
        group = { firstIndex: result.length, works: [] };
        candidates.push(group);
        groups.set(key, candidates);
        result.push(work);
      }
      group.works.push(work);
    });
    groups.forEach(function (candidates) {
      candidates.forEach(function (group) {
        if (group.works.length > 1) {
          result[group.firstIndex] = Object.assign({}, group.works[0], { _searchAlternates: group.works });
        }
      });
    });
    return result;
  }

  function openPicker(works, onPick) {
    var doc = root && root.document;
    if (!doc || !Array.isArray(works) || !works.length || typeof onPick !== 'function') return;
    var existing = doc.querySelector('.lf-comic-editions');
    if (existing) existing.remove();
    var overlay = doc.createElement('div');
    overlay.className = 'lf-comic-editions';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '\u0625\u0635\u062f\u0627\u0631\u0627\u062a \u0627\u0644\u0643\u0648\u0645\u064a\u0643\u0633');
    var backdrop = doc.createElement('button');
    backdrop.className = 'lf-comic-editions-backdrop';
    backdrop.type = 'button';
    backdrop.setAttribute('aria-label', '\u0625\u063a\u0644\u0627\u0642');
    var sheet = doc.createElement('section');
    sheet.className = 'lf-comic-editions-sheet';
    sheet.dir = 'rtl';
    var header = doc.createElement('header');
    var title = doc.createElement('h2');
    title.textContent = works[0].title || '\u0627\u0644\u0643\u0648\u0645\u064a\u0643\u0633';
    var count = doc.createElement('span');
    count.textContent = works.length + ' \u0625\u0635\u062f\u0627\u0631\u0627\u062a';
    header.append(title, count);
    var list = doc.createElement('div');
    list.className = 'lf-comic-editions-list';
    function close() {
      overlay.remove();
      doc.removeEventListener('keydown', onKey);
    }
    function onKey(event) { if (event.key === 'Escape') close(); }
    backdrop.addEventListener('click', close);
    works.forEach(function (work) {
      var item = doc.createElement('button');
      item.className = 'lf-comic-editions-item';
      item.type = 'button';
      var name = doc.createElement('strong');
      name.textContent = work.title || '';
      var meta = doc.createElement('span');
      meta.textContent = [work.auth, work.yr].filter(Boolean).join(' \u00b7 ') || '\u0625\u0635\u062f\u0627\u0631 \u063a\u064a\u0631 \u0645\u062d\u062f\u062f';
      item.append(name, meta);
      item.addEventListener('click', function () { close(); onPick(work); });
      list.appendChild(item);
    });
    sheet.append(header, list);
    overlay.append(backdrop, sheet);
    doc.body.appendChild(overlay);
    doc.addEventListener('keydown', onKey);
    var first = list.querySelector('button');
    if (first) first.focus();
  }

  return { groupResults: groupResults, openPicker: openPicker };
});

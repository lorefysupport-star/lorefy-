(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.LorefyLegal = api;
    function refresh() {
      var storage;
      try { storage = root.localStorage; } catch (_) {}
      api.applyTheme(root.document.documentElement, root.LorefyDesignSystem, storage);
    }
    refresh();
    root.addEventListener('storage', function (event) {
      if (!event.key || event.key === 'lorefy.ui.theme.v1') refresh();
    });
    root.addEventListener('pageshow', refresh);
    root.document.addEventListener('DOMContentLoaded', function () { api.enhance(root); }, {once:true});
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var pages = ['privacy-policy.html', 'terms.html', 'support.html', 'community-guidelines.html'];
  function applyTheme(element, design, storage) {
    if (!design) return null;
    var mode = design.readMode(storage);
    Object.entries(design.tokens(mode)).forEach(function (entry) { element.style.setProperty(entry[0], entry[1]); });
    element.style.colorScheme = design.isDark(mode) ? 'dark' : 'light';
    element.setAttribute('data-legal-theme', mode);
    return mode;
  }
  function navigation(href, referrer) {
    var current = new URL(href), directory = new URL('.', current), from;
    try {
      var candidate = new URL(referrer);
      if (candidate.protocol === current.protocol && candidate.host === current.host &&
          candidate.pathname === new URL(candidate.pathname.split('/').pop(), directory).pathname &&
          ['index.html', 'phone-preview.html'].concat(pages).includes(candidate.pathname.split('/').pop())) from = candidate;
    } catch (_) {}
    var values = current.searchParams.has('entry') ? current.searchParams : from ? from.searchParams : new URLSearchParams();
    var phone = values.get('entry') === 'phone' || !!(from && from.pathname.endsWith('/phone-preview.html') && !current.searchParams.has('entry'));
    var back = new URLSearchParams({route:'profile'}), query = new URLSearchParams({entry:phone ? 'phone' : 'app'});
    // Carry only finite preview options, never authentication or redirect parameters.
    [['preview','demo'], ['demo','ready'], ['adaptive','1'], ['decorationLab','1']].forEach(function (pair) {
      if (values.get(pair[0]) === pair[1]) { back.set(pair[0], pair[1]); query.set(pair[0], pair[1]); }
    });
    return {back:(phone ? 'phone-preview.html' : 'index.html') + '?' + back, query:'?' + query};
  }
  function enhance(root) {
    var doc = root.document, article = doc.querySelector('.legal-content');
    if (!article || doc.querySelector('.legal-toc')) return;
    var english = false;
    try { english = JSON.parse(root.localStorage.getItem('lorefy.ui.lang.v1')) === 'en'; } catch (_) {}
    var text = function (ar, en) { return english ? en : ar; };
    var context = navigation(root.location.href, doc.referrer);
    var back = doc.querySelector('.legal-back');
    if (back) {
      back.href = context.back;
      back.setAttribute('aria-label', text('العودة إلى التطبيق', 'Back to Lorefy'));
      back.title = text('العودة إلى التطبيق', 'Back to Lorefy');
      back.lang = english ? 'en' : 'ar';
    }
    var skip = doc.querySelector('.legal-skip');
    if (skip) { skip.textContent = text('انتقل إلى المحتوى', 'Skip to content'); skip.lang = english ? 'en' : 'ar'; }
    var details = doc.createElement('details'); details.className = 'legal-toc';
    var summary = doc.createElement('summary'); summary.textContent = text('في هذه الصفحة', 'On this page');
    summary.lang = english ? 'en' : 'ar'; summary.dir = english ? 'ltr' : 'rtl';
    var nav = doc.createElement('nav'); nav.setAttribute('aria-label', text('أقسام الصفحة', 'Page sections')); nav.lang = english ? 'en' : 'ar';
    var list = doc.createElement('ol'); list.lang = 'ar'; list.dir = 'rtl';
    article.querySelectorAll('section').forEach(function (section, index) {
      var heading = section.querySelector('h2'); if (!heading) return;
      heading.id = 'legal-section-' + (index + 1); heading.tabIndex = -1;
      var li = doc.createElement('li'), a = doc.createElement('a');
      a.href = '#' + heading.id; a.textContent = heading.textContent;
      a.addEventListener('click', function () { root.requestAnimationFrame(function () { heading.focus({preventScroll:true}); }); });
      li.appendChild(a); list.appendChild(li);
    });
    nav.appendChild(list); details.appendChild(summary); details.appendChild(nav);
    article.insertBefore(details, article.querySelector('section'));
    article.querySelectorAll('a[href]').forEach(function (a) {
      var original = a.getAttribute('href');
      if (pages.includes(original)) a.href = original + context.query;
    });
  }
  return {applyTheme:applyTheme, navigation:navigation, enhance:enhance};
});

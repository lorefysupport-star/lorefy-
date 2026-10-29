(function () {
  'use strict';
  // Local opt-in only; no saved preference or production activation.
  if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  const direction = new URLSearchParams(location.search).get('redesign');
  if (!['profile', 'profile-promptsite'].includes(direction)) return;
  document.documentElement.dataset.lfRedesign = 'profile';
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = direction === 'profile-promptsite'
    ? 'styles/redesign/profile-promptsite.css?v=20261023-profile-2'
    : 'styles/redesign/profile.css?v=20261022-profile-1';
  document.head.appendChild(sheet);
  // Old experiment URLs must not restyle the new saved layout.
  if (document.querySelector && typeof MutationObserver === 'function') {
    const sync = () => {
      const disabled = !!document.querySelector('.lf-profile-page[data-profile-layout="reader"]');
      if (sheet.disabled !== disabled) sheet.disabled = disabled;
    };
    sync();
    new MutationObserver(sync).observe(document.documentElement, {
      childList:true, subtree:true, attributes:true, attributeFilter:['data-profile-layout']
    });
  }
})();

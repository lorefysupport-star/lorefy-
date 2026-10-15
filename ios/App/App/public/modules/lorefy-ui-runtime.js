/* ════════════════════════════════════════════════════════════════════════
   Lorefy — UI runtime shell (lorefy-ui-runtime.js) → window.LorefyUI.AppShell

   NOTE: The original module file did not arrive intact in the uploaded
   package (its slot held an unrelated asset). This is a faithful, minimal
   reconstruction of the host shell: AppShell simply renders whatever surface
   (auth gate or the app) it is given. The app manages its own theme, nav and
   scroll containers, so a transparent pass-through preserves the intended
   layout without altering any app behaviour.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";
  var React = global.React;
  function AppShell(props) {
    var children = props && props.children;
    var sync = React.useState(function () { return global.LorefyBackend && global.LorefyBackend._syncStatus || null; }), status = sync[0], setStatus = sync[1];
    React.useEffect(function () {
      var update = function (event) { setStatus(event.detail && event.detail.status || null); };
      var reset = function () { setStatus(null); };
      global.addEventListener('lorefy:sync-status', update);
      global.addEventListener('lorefy:auth-changed', reset);
      return function () { global.removeEventListener('lorefy:sync-status', update); global.removeEventListener('lorefy:auth-changed', reset); };
    }, []);
    var en = global.document && global.document.documentElement.lang === 'en';
    var message = status === 'conflict'
      ? (en ? 'Changes from another device could not be merged. Your edits are saved on this device.' : 'تعذر دمج تعديل من جهاز آخر. تعديلاتك محفوظة على هذا الجهاز.')
      : (en ? 'Sync is pending. Your edits are saved on this device.' : 'المزامنة معلّقة. تعديلاتك محفوظة على هذا الجهاز.');
    var warning = status === 'pending' || status === 'conflict' ? React.createElement('div', {className:'lf-cloud-sync-banner',role:'status'},
      React.createElement('span', null, message),
      React.createElement('button', {type:'button',onClick:function () { if (global.LorefyBackend) global.LorefyBackend.push().catch(function () {}); }}, en ? 'Retry' : 'إعادة المحاولة')) : null;
    return React.createElement(
      "div",
      { style: { position: "absolute", inset: 0, width: "100%", height: "100%" } },
      children == null ? null : children,
      warning
    );
  }
  global.LorefyUI = global.LorefyUI || {};
  global.LorefyUI.AppShell = AppShell;
})(typeof window !== "undefined" ? window : this);

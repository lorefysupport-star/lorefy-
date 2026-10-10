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
    return React.createElement(
      "div",
      { style: { position: "absolute", inset: 0, width: "100%", height: "100%" } },
      children == null ? null : children
    );
  }
  global.LorefyUI = global.LorefyUI || {};
  global.LorefyUI.AppShell = AppShell;
})(typeof window !== "undefined" ? window : this);

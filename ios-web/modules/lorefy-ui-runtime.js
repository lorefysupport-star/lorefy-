/* ════════════════════════════════════════════════════════════════════════
   Lorefy — UI runtime shell (lorefy-ui-runtime.js) → window.LorefyUI.AppShell

   NOTE: The original module file did not arrive intact in the uploaded
   package (its slot held an unrelated asset). This is a faithful, minimal
   reconstruction of the host shell. AppShell preserves the surface layout,
   shows synchronization warnings and contains render failures behind a manual
   recovery boundary. The app owns theme, navigation and scroll containers.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";
  var React = global.React;
  class RenderBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = {failed:false, attempt:0};
      this.retry = this.retry.bind(this);
    }
    static getDerivedStateFromError() { return {failed:true}; }
    componentDidCatch(error) {
      var name = error && error.name;
      console.warn('[Lorefy] surface render failed:', /^(Error|TypeError|RangeError|ReferenceError|SyntaxError|NotFoundError)$/.test(name) ? name : 'Error');
      if (this.recoveryFocus) this.recoveryFocus.focus();
    }
    componentDidUpdate(previous) {
      if (this.state.failed && previous.children !== this.props.children) this.retry();
    }
    retry() { this.setState(function(state){ return {failed:false, attempt:state.attempt + 1}; }); }
    render() {
      if (!this.state.failed) return React.createElement(React.Fragment, {key:this.state.attempt}, this.props.children);
      var en = global.document && global.document.documentElement.lang === 'en';
      return React.createElement('section', {role:'alert', dir:en ? 'ltr' : 'rtl', 'aria-labelledby':'lf-surface-error-title',
        style:{position:'absolute',inset:0,display:'grid',alignContent:'center',justifyItems:'center',gap:16,padding:24,boxSizing:'border-box',background:'var(--ui-bg,#0b0b0c)',color:'var(--ui-ink,#f5f5f7)',textAlign:'center'}},
        React.createElement('h1', {id:'lf-surface-error-title',style:{fontSize:20,margin:0}}, en ? 'This page could not be displayed' : 'تعذّر عرض هذه الصفحة'),
        React.createElement('p', {style:{fontSize:14,lineHeight:1.6,maxWidth:340,margin:0}}, en ? 'Your saved data has not changed.' : 'بياناتك المحفوظة لم تتغير.'),
        React.createElement('button', {type:'button',onClick:this.retry,ref:node=>{this.recoveryFocus=node;},
          style:{minHeight:44,minWidth:120,padding:'10px 20px',border:'1px solid var(--ui-line,#444)',borderRadius:8,background:'var(--ui-fill,#242426)',color:'inherit',font:'inherit',cursor:'pointer'}}, en ? 'Try again' : 'إعادة المحاولة'));
    }
  }
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
      React.createElement(RenderBoundary, null, children == null ? null : children),
      warning
    );
  }
  global.LorefyUI = global.LorefyUI || {};
  global.LorefyUI.RenderBoundary = RenderBoundary;
  global.LorefyUI.AppShell = AppShell;
})(typeof window !== "undefined" ? window : this);

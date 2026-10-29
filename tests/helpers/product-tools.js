const fs = require('node:fs'), vm = require('node:vm'), RenderNode = require('./render-dom.js');
const source = fs.readFileSync('modules/lorefy-product-tools.js', 'utf8');
function harness(lang = 'en', lists = [], fixture = {}) {
  const doc = { documentElement: { lang, dir: lang === 'ar' ? 'rtl' : 'ltr' } };
  const observers = [], writes = [], hooks = {};
  class Node extends RenderNode {
    constructor(tag, attrs = {}) {
      super(tag, attrs); this.inert = false; this.disabled = false;
      this.tabIndex = ['button', 'select', 'input', 'textarea', 'a'].includes(tag) ? 0 : -1;
      Object.defineProperty(this, 'isConnected', { get() { let node = this; while (node && node !== doc.body) node = node.parentNode; return node === doc.body; } });
    }
    get parentElement() { return this.parentNode; }
    get className() { return this.attrs.class || ''; }
    set className(value) { this.attrs.class = value; }
    getAttribute(name) { return this.attrs[name] ?? null; }
    removeAttribute(name) { delete this.attrs[name]; }
    removeChild(node) { node.remove(); return node; }
    removeEventListener(name) { delete this.handlers[name]; }
    getClientRects() { return this.hidden ? [] : [1]; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    closest(selector) { let node = this; while (node && !(selector.startsWith('.') ? node.classList.contains(selector.slice(1)) : node.attrs.role === 'dialog')) node = node.parentNode; return node || null; }
    focus() { doc.activeElement = this; }
    click() { if (!this.disabled) return this.handlers.click?.({ currentTarget: this, preventDefault() {}, stopPropagation() {} }); }
    querySelectorAll(selector) {
      if (/button.*input|button.*select/.test(selector)) return super.querySelectorAll('*').filter(node => ['button', 'select', 'input', 'textarea', 'a'].includes(node.tag) || node.tabIndex === 0);
      return super.querySelectorAll(selector);
    }
  }
  doc.body = new Node('body');
  const host = new Node('div'), app = new Node('div'), parent = new Node('section', { role: 'dialog' }), opener = new Node('button');
  app.inert = true; doc.body.appendChild(host); host.append(app, parent); parent.appendChild(opener); opener.focus();
  doc.createElement = tag => new Node(tag); doc.createTextNode = text => new Node('text', { text }); doc.getElementById = () => host;
  doc.querySelectorAll = selector => host.querySelectorAll(selector);
  const storage = new Map([['lorefy.activeUser.v1', 'fixture-owner'], ['lorefy.customLists.v1', JSON.stringify(lists)]]);
  const global = { document: doc, localStorage: { getItem: key => storage.get(key) || null }, setTimeout() {}, dispatchEvent() {}, CustomEvent: class {},
    LorefyProfileSections: { foldersFor: () => [{ id: 'profile', name: 'اسم قارئ طويل جدًا '.repeat(5), kind: 'characters', isPublic: true }], account: () => 'fixture-owner', setFolderVisibility: () => writes.push('visibility') } };
  const core = { privacy: { getListVisibility: () => 'unlisted', setListVisibility: () => writes.push('visibility') }, exportPortable: () => writes.push('export'),
    corrections: { list: () => fixture.corrections || [], submit: input => { if (hooks.submit) return hooks.submit(input); writes.push(input); return input; } },
    safety: { getReports: () => fixture.reports || [], getBlockedUsers: () => fixture.blocked || [], getMutedUsers: () => fixture.muted || [],
      unblockUser: id => hooks.unblock ? hooks.unblock(id) : writes.push('unblock'), unmuteUser: id => hooks.unmute ? hooks.unmute(id) : writes.push('unmute'),
      report: input => hooks.report ? hooks.report(input) : (writes.push(input), { id: 'local-report', status: 'pending' }),
      blockUser: id => hooks.block ? hooks.block(id) : writes.push('block'), muteUser: id => hooks.mute ? hooks.mute(id) : writes.push('mute') } };
  const context = { doc, global, core, URLSearchParams,
    MutationObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } } };
  const start = source.indexOf('  var ICONS =');
  vm.runInNewContext(source.slice(start, source.indexOf('  function profileAction(', start)), context);
  return { context, doc, host, app, parent, opener, writes, observers, hooks, storage, core,
    open() { context.openDataCenter(); return host.querySelector('.lf-product-overlay'); },
    mutations() { observers.filter(observer => !observer.disconnected).forEach(observer => observer.callback()); } };
}
module.exports = { harness };

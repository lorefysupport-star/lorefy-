(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.install(root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  function createGesture() {
    var start = null, distance = 0;
    return {
      start:function (point) { start = point; distance = 0; },
      move:function (point) {
        if (!start) return 0;
        var dx = Math.abs(point.x - start.x), dy = point.y - start.y;
        if (point.id !== start.id || point.top === false || dy < -8 || dx > 12 && dx > dy) {
          start = null; distance = 0; return 0;
        }
        distance = Math.max(0, dy);
        return distance;
      },
      end:function () { var armed = !!start && distance >= 80; start = null; distance = 0; return armed; },
      cancel:function () { start = null; distance = 0; }
    };
  }

  function createRunner(options) {
    options = options || {};
    var handlers = new Map(), jobs = new Map();
    var later = options.setTimeout || setTimeout, cancel = options.clearTimeout || clearTimeout;
    return {
      has:function (name) { return handlers.has(name); },
      register:function (name, handler) {
        handlers.set(name, handler);
        return function () { if (handlers.get(name) === handler) handlers.delete(name); };
      },
      run:function (name, context) {
        context = context || {};
        if (jobs.has(name) && jobs.get(name).active()) return jobs.get(name).promise;
        var handler = handlers.get(name);
        if (!handler) return Promise.reject(new Error('Refresh unavailable'));
        var valid = true, timer, job = {};
        job.active = function () { return valid && handlers.get(name) === handler && (!context.active || context.active()); };
        var deadline = new Promise(function (_, reject) {
          timer = later(function () { valid = false; reject(new Error('Refresh timeout')); }, options.timeoutMs || 15000);
        });
        var work = Promise.resolve().then(function () {
          if (!job.active()) throw new Error('Refresh cancelled');
          return handler({active:job.active});
        }).then(function (result) {
          if (!job.active()) throw new Error('Refresh cancelled');
          if (result === false) throw new Error('Refresh failed');
          return result;
        });
        job.promise = Promise.race([work, deadline]).finally(function () {
          valid = false; cancel(timer);
          if (jobs.get(name) === job) jobs.delete(name);
        });
        jobs.set(name, job);
        return job.promise;
      }
    };
  }

  function install(root) {
    var doc = root.document, runner = createRunner(), gesture = createGesture();
    var page = null, indicator = null, busy = false, resetTimer = null, generation = 0;
    var editorSelector = '[role="dialog"],.nc-sheet,.lf-profile-list-editor,.lf-community-compose-sheet,.lf-feature-overlay';
    function blocked() { return !!doc.querySelector(editorSelector); }
    function visiblePage() {
      return doc.querySelector('.lf-reader-full,.lf-profile-page,.lf-community-page');
    }
    function atTop(node) {
      for (var p = node; p && p !== doc; p = p.parentElement) {
        if (p.scrollTop > 1) return false;
      }
      return true;
    }
    function label(ar, en) { return doc.documentElement.lang === 'en' ? en : ar; }
    function control() {
      var host = doc.querySelector('.lf-app');
      if (!host) return null;
      if (!indicator || !indicator.isConnected) {
        indicator = doc.createElement('button');
        indicator.type = 'button'; indicator.className = 'lf-page-refresh'; indicator.dataset.state = 'idle';
        indicator.setAttribute('aria-label', label('تحديث الصفحة', 'Refresh page'));
        indicator.title = label('تحديث الصفحة', 'Refresh page');
        var icon = doc.createElement('i'); icon.setAttribute('data-lucide', 'refresh-cw'); icon.setAttribute('aria-hidden', 'true');
        var status = doc.createElement('span'); status.className = 'lf-page-refresh-status'; status.setAttribute('role', 'status');
        indicator.appendChild(icon); indicator.appendChild(status); host.appendChild(indicator);
        indicator.addEventListener('click', function () { page = visiblePage(); if (page) refresh(page); });
        if (root.lucide && root.lucide.createIcons) root.lucide.createIcons({nodes:[indicator]});
      }
      return indicator;
    }
    function paint(state, distance) {
      var button = control(); if (!button) return;
      root.clearTimeout(resetTimer);
      button.dataset.state = state;
      button.style.setProperty('--refresh-pull', Math.min(64, Math.max(0, distance || 0) * .5) + 'px');
      button.setAttribute('aria-busy', String(state === 'refreshing'));
      var text = state === 'refreshing' ? label('جارٍ التحديث', 'Refreshing')
        : state === 'success' ? label('تم التحديث', 'Updated')
        : state === 'error' ? label('تعذر التحديث · حاول مجددًا', 'Could not refresh · Try again') : '';
      button.setAttribute('aria-label', text || label('تحديث الصفحة', 'Refresh page'));
      var status = button.querySelector('span'); if (status.textContent !== text) status.textContent = text;
      if (state === 'success' || state === 'error') resetTimer = root.setTimeout(function () { paint('idle'); }, 2200);
    }
    async function refresh(target) {
      if (busy || blocked() || !target || !target.isConnected) return;
      var request = ++generation;
      var backend = root.LorefyBackend, owner = backend && backend.user && backend.user.id;
      var active = function () {
        return request === generation && target.isConnected && visiblePage() === target && !blocked()
          && backend === root.LorefyBackend && owner === (backend && backend.user && backend.user.id);
      };
      busy = true; paint('refreshing');
      try {
        var names = target.matches('.lf-community-page') ? ['community-posts']
          : target.matches('.lf-reader-full') ? ['profile-visitor'] : ['profile-owner'];
        if (runner.has('community-reviews')) names.push('community-reviews');
        if (target.matches('.lf-community-page') && runner.has('community-friends')) names.push('community-friends');
        await Promise.all(names.map(function (name) { return runner.run(name, {active:active}); }));
        if (request === generation) paint(active() ? 'success' : 'idle');
      } catch (_) { if (request === generation) paint(active() ? 'error' : 'idle'); }
      finally { if (request === generation) busy = false; }
    }
    runner.register('profile-owner', function (context) {
      var backend = root.LorefyBackend;
      if (!backend || !backend.refreshAccount) throw new Error('Account refresh unavailable');
      return backend.refreshAccount(context);
    });
    root.LorefyPageRefresh = {register:runner.register, refresh:function () { return refresh(visiblePage()); }};
    doc.addEventListener('touchstart', function (event) {
      if (event.touches.length !== 1 || busy || blocked()) { gesture.cancel(); return; }
      var node = event.target;
      page = visiblePage();
      if (!page || !page.contains(node) || node.closest('button,a,input,textarea,select,[contenteditable="true"],.lf-friend-rail') || !atTop(node)) { gesture.cancel(); page = null; return; }
      var touch = event.touches[0]; gesture.start({x:touch.clientX,y:touch.clientY,id:touch.identifier});
    }, {passive:true});
    doc.addEventListener('touchmove', function (event) {
      if (!page || busy) return;
      if (event.touches.length !== 1 || blocked() || page !== visiblePage()) { gesture.cancel(); page = null; paint('idle'); return; }
      var touch = event.touches[0];
      var distance = gesture.move({x:touch.clientX,y:touch.clientY,id:touch.identifier,top:atTop(event.target)});
      if (distance > 10 && event.cancelable) {
        event.preventDefault(); paint(distance >= 80 ? 'armed' : 'pulling', distance);
      } else if (distance === 0) paint('idle');
    }, {passive:false});
    doc.addEventListener('touchend', function () {
      var target = page; page = null;
      if (gesture.end()) refresh(target); else if (!busy) paint('idle');
    }, {passive:true});
    doc.addEventListener('touchcancel', function () { gesture.cancel(); page = null; if (!busy) paint('idle'); }, {passive:true});
    var lastPage = null, scheduled = false;
    function sync() {
      scheduled = false;
      var nextPage = visiblePage();
      if (nextPage === lastPage && indicator && indicator.isConnected) return;
      lastPage = nextPage;
      generation++; busy = false;
      var button = control(); if (button) button.hidden = !visiblePage();
      if (button) paint('idle');
      gesture.cancel(); page = null;
    }
    function schedule() { if (!scheduled) { scheduled = true; root.requestAnimationFrame(sync); } }
    root.addEventListener('lorefy:routechange', schedule);
    var observer = new root.MutationObserver(schedule);
    observer.observe(doc.documentElement, {childList:true,subtree:true});
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', schedule); else schedule();
  }
  return {createGesture:createGesture, createRunner:createRunner, install:install};
});

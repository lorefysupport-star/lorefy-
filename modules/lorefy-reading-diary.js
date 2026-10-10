(function (global) {
  'use strict';
  var doc = global.document;
  var core = global.LorefyReadingDiaryCore;
  if (!doc || !core) return;

  var LOG_KEY = 'lorefy.user.readingDiary.v1';
  var SNAP_KEY = 'lorefy.user.readingDiarySnapshot.v1';
  var SESSION_KEY = 'lorefy.user.readingSession.v1';
  var state = { filter: 'all', composing: false, sessionView: false, composeKind: 'note', selectedWork: '', workFilter: '', initialAnchor: null, editing: null, revealed: new Set() };
  var scheduled = false;
  var sessionTicker = 0;
  var lastFingerprint = '';
  var catalogCache = { source: null, length: -1, byId: new Map() };

  function language() { return doc.documentElement.lang === 'en' ? 'en' : 'ar'; }
  function text(ar, en) { return language() === 'en' ? en : ar; }

  function read(key, fallback) {
    try { var value = JSON.parse(global.localStorage.getItem(key) || 'null'); return value === null ? fallback : value; }
    catch (error) { return fallback; }
  }
  function write(key, value) {
    try { global.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { return false; }
  }
  function node(tag, className, content) {
    var element = doc.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  }
  function icon(name, size) {
    var element = node('i');
    element.setAttribute('data-lucide', name);
    element.setAttribute('width', String(size || 18));
    element.setAttribute('height', String(size || 18));
    element.setAttribute('aria-hidden', 'true');
    return element;
  }
  function button(className, label, iconName, action) {
    var element = node('button', className);
    element.type = 'button';
    element.setAttribute('aria-label', label);
    if (iconName) element.appendChild(icon(iconName));
    element.addEventListener('click', action);
    return element;
  }
  function refreshIcons(element) {
    try { if (global.lucide && global.lucide.createIcons) global.lucide.createIcons({ nodes: [element] }); }
    catch (error) {}
  }
  function snapshot() {
    return { library: read('lorefy.user.library.v2', {}), progress: read('lorefy.user.progress.v2', {}) };
  }
  function entries() { return read(LOG_KEY, []); }
  function activeSession() {
    var session = read(SESSION_KEY, null);
    return session && typeof session.id === 'string' && session.id && Number.isSafeInteger(session.startedAt)
      && Number.isFinite(Number(session.elapsedMs)) && Number(session.elapsedMs) >= 0 ? session : null;
  }
  function clearSession() {
    try { global.localStorage.removeItem(SESSION_KEY); return true; }
    catch (error) { return false; }
  }
  function sync() {
    if (!doc.querySelector('#screen .lf-app')) return;
    var current = snapshot();
    var fingerprint = JSON.stringify(current);
    if (fingerprint === lastFingerprint) return;
    lastFingerprint = fingerprint;
    var previous = read(SNAP_KEY, null);
    if (previous && previous.library && previous.progress) {
      var changes = core.transitions(previous, current, Date.now());
      if (changes.length) write(LOG_KEY, core.merge(entries(), changes));
    }
    write(SNAP_KEY, current);
    if (doc.querySelector('.lf-diary-page')) render();
  }
  function works() {
    var library = read('lorefy.user.library.v2', {});
    return Object.keys(library);
  }
  function catalogWork(id) {
    var catalog = Array.isArray(global.LorefyMangaData) ? global.LorefyMangaData : [];
    if (catalogCache.source !== catalog || catalogCache.length !== catalog.length) {
      catalogCache = { source: catalog, length: catalog.length, byId: new Map(catalog.filter(Boolean).map(function (work) { return [String(work.id), work]; })) };
    }
    return catalogCache.byId.get(String(id)) || null;
  }
  function workInfo(id) {
    var data = catalogWork(id) || {};
    var candidates = [data.titleEnglish, data.english, data.titleAr, data.ar, data.en, data.title, data.searchTitle, data.name];
    var title = candidates.map(function (value) { return String(value || '').trim(); }).find(function (value) {
      return value && !/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(value) && /[A-Za-z\u00c0-\u024f\u0600-\u06ff]/.test(value);
    }) || text('عمل من مكتبتك', 'A work from your library');
    var cover = data.sourceCoverUrl || data.cover || data.coverImage || data.image || data.img || '';
    return { title: String(title), cover: String(cover), type: String(data.type || '') };
  }
  function coverFor(id) {
    var info = workInfo(id);
    var wrap = node('span', 'lf-diary-cover');
    if (info.cover && /^(https?:|data:image\/|\/)/.test(info.cover)) {
      var image = node('img'); image.src = info.cover; image.alt = '';
      image.loading = 'lazy'; image.onerror = function () { image.remove(); wrap.classList.add('is-empty'); };
      wrap.appendChild(image);
    } else { wrap.classList.add('is-empty'); wrap.appendChild(icon('book-open', 23)); }
    return wrap;
  }
  function kind(event) {
    if (event.type === 'completed') return { label: text('أكملت', 'Completed'), symbol: 'check', group: 'completed' };
    if (event.type === 'started') return { label: text('بدأت القراءة', 'Started reading'), symbol: 'book-open', group: 'reading' };
    if (event.type === 'progress') return { label: text('تقدّم القراءة', 'Reading progress'), symbol: 'bookmark', group: 'reading' };
    if (event.type === 'quote') return { label: text('اقتباس', 'Quote'), symbol: 'quote', group: 'quotes' };
    if (event.type === 'session') return { label: text('جلسة قراءة', 'Reading session'), symbol: 'timer', group: 'sessions' };
    var unit = { chapter: text('فصل', 'Chapter'), page: text('صفحة', 'Page'), volume: text('مجلد', 'Volume') }[core.anchor(event).type];
    return { label: core.anchor(event).value ? (language() === 'en' ? unit + ' note' : 'ملاحظة ' + unit) : text('ملاحظة', 'Note'), symbol: 'pen-line', group: 'notes' };
  }
  function positionLabel(event) {
    var position = core.anchor(event);
    if (!position.value) return '';
    return { chapter: text('الفصل ', 'Chapter '), page: text('الصفحة ', 'Page '), volume: text('المجلد ', 'Volume ') }[position.type] + position.value;
  }
  function revealKey(event) { return event.entryId || event.id + '|' + event.at; }
  function dateLabel(at) {
    var date = new Date(Number(at));
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(language() === 'en' ? 'en-GB' : 'ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }
  function openWork(id) {
    var query = new URLSearchParams(global.location.search);
    query.set('route', 'detail'); query.set('novel', id);
    global.location.assign(global.location.pathname + '?' + query.toString());
  }
  function sendShare(event, includeSpoiler) {
    var text = core.shareText(event, workInfo(event.id).title, includeSpoiler, language());
    if (global.navigator.share) global.navigator.share({ text: text }).catch(function () {});
    else if (global.navigator.clipboard) global.navigator.clipboard.writeText(text).then(function () { announce(text('نُسخ النص للمشاركة', 'Copied for sharing')); });
    else announce(text('المشاركة غير متاحة على هذا الجهاز', 'Sharing is unavailable on this device'));
  }
  function discussQuote(event) {
    var attachment = core.communityQuote(event, workInfo(event.id));
    if (!attachment) { announce(text('لا يمكن نشر اقتباس يحتوي على حرق', 'Spoiler quotes cannot be posted')); return; }
    if (!global.LorefyCommunity || !global.LorefyCommunity.openComposer) { announce(text('المجتمع غير متاح الآن', 'Community is unavailable right now')); return; }
    var note = String(event.note || '').trim();
    close();
    global.LorefyCommunity.openComposer({ initialText: note, attachment: attachment });
  }
  function shareEntry(event) {
    if (!event.spoiler) { sendShare(event, false); return; }
    var page = doc.querySelector('.lf-diary-page');
    if (!page) return;
    var old = page.querySelector('.lf-diary-share-overlay'); if (old) old.remove();
    var overlay = node('div', 'lf-diary-share-overlay');
    var panel = node('section', 'lf-diary-share-panel');
    var subject = event.type === 'quote' ? text('الاقتباس', 'quote') : text('الملاحظة', 'note');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', text('خيارات مشاركة ', 'Share options: ') + subject);
    panel.appendChild(node('h2', '', text('مشاركة ', 'Share ') + subject));
    panel.appendChild(node('p', '', text('يحتوي هذا المحتوى على حرق. اختر ما سيظهر خارج سجلك الخاص.', 'This contains spoilers. Choose what to include outside your private diary.')));
    var safe = button('lf-diary-share-choice is-primary', text('مشاركة دون نص الحرق', 'Share without spoilers'), 'shield-check', function () { overlay.remove(); sendShare(event, false); });
    safe.appendChild(node('span', '', text('مشاركة دون نص الحرق', 'Share without spoilers'))); panel.appendChild(safe);
    var full = button('lf-diary-share-choice', text('تضمين نص الحرق', 'Include spoiler text'), 'eye', function () { overlay.remove(); sendShare(event, true); });
    full.appendChild(node('span', '', text('تضمين نص الحرق', 'Include spoiler text'))); panel.appendChild(full);
    var cancel = button('lf-diary-share-cancel', text('إلغاء المشاركة', 'Cancel sharing'), null, function () { overlay.remove(); });
    cancel.textContent = text('إلغاء', 'Cancel'); panel.appendChild(cancel);
    overlay.appendChild(panel); page.appendChild(overlay); refreshIcons(overlay); safe.focus();
  }
  function announce(message) {
    var live = doc.querySelector('.lf-diary-status');
    if (live) live.textContent = message;
  }
  function close() {
    if (sessionTicker) { global.clearInterval(sessionTicker); sessionTicker = 0; }
    var overlay = doc.querySelector('.lf-diary-page');
    if (overlay) overlay.remove();
    state.composing = false;
    state.sessionView = false;
    state.editing = null;
    state.initialAnchor = null;
  }
  function startReadingSession(id) {
    if (activeSession()) { state.sessionView = true; render(); return; }
    var session = core.startSession(id, Date.now());
    if (session) session.entryId = global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    if (!session || !write(SESSION_KEY, session)) { announce(text('اختر عملًا من مكتبتك أولًا', 'Choose a work from your library first')); return; }
    state.selectedWork = id;
    state.sessionView = true;
    render();
  }
  function pauseReadingSession() {
    var next = core.pauseSession(activeSession(), Date.now());
    if (!next || !write(SESSION_KEY, next)) { announce(text('تعذر إيقاف الجلسة', 'Could not pause the session')); return; }
    render();
  }
  function resumeReadingSession() {
    var next = core.resumeSession(activeSession(), Date.now());
    if (!next || !write(SESSION_KEY, next)) { announce(text('تعذر استئناف الجلسة', 'Could not resume the session')); return; }
    render();
  }
  function finishReadingSession() {
    var session = activeSession();
    var entryId = session && session.entryId || (global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2));
    var event = core.finishSession(session, Date.now(), entryId);
    if (!event) { announce(text('اقرأ ثانيةً واحدة على الأقل قبل حفظ الجلسة', 'Read for at least one second before saving')); return; }
    if (!write(LOG_KEY, core.merge(entries(), [event]))) { announce(text('تعذر حفظ الجلسة', 'Could not save the session')); return; }
    if (!clearSession()) { announce(text('حُفظت الجلسة، لكن تعذر إغلاق المؤقت', 'Session saved, but the timer could not be closed')); return; }
    state.sessionView = false;
    state.filter = 'sessions';
    render();
    announce(text('حُفظت جلسة القراءة في سجلك', 'Reading session saved to your diary'));
  }
  function discardReadingSession() {
    if (!global.confirm(text('إلغاء الجلسة دون حفظ الوقت؟', 'Discard this session without saving the time?'))) return;
    if (!clearSession()) { announce(text('تعذر إلغاء الجلسة', 'Could not discard the session')); return; }
    state.sessionView = false;
    render();
    announce(text('أُلغيت الجلسة', 'Session discarded'));
  }
  function renderSessionView(body) {
    var session = activeSession();
    var section = node('section', 'lf-diary-session-view');
    var workId = session ? session.id : state.selectedWork || state.workFilter;
    if (!session) {
      section.classList.add('is-ready');
      section.appendChild(node('p', 'lf-diary-session-eyebrow', text('جلسة جديدة', 'New session')));
      section.appendChild(node('h2', '', text('اختر ما تقرأه', 'Choose your next read')));
      section.appendChild(node('p', 'lf-diary-session-hint', text('سنسجّل وقت هذه الجلسة في سجل القراءة.', 'This session will be recorded in your reading diary.')));
      var choices = works();
      if (workId && choices.indexOf(workId) < 0) choices.unshift(workId);
      if (choices.length) {
        var art = node('div', 'lf-diary-session-ready-art'); art.appendChild(coverFor(workId || choices[0])); section.appendChild(art);
        var title = node('strong', 'lf-diary-session-ready-title', workInfo(workId || choices[0]).title); section.appendChild(title);
        var picker = node('label', 'lf-diary-session-picker', text('العمل', 'Work'));
        var select = node('select', 'lf-diary-select'); select.setAttribute('aria-label', text('اختر عملًا لجلسة القراءة', 'Choose a work for this session'));
        choices.forEach(function (id) { var option = node('option', '', workInfo(id).title); option.value = id; select.appendChild(option); });
        select.value = workId || choices[0];
        select.addEventListener('change', function () { state.selectedWork = select.value; art.replaceChildren(coverFor(select.value)); title.textContent = workInfo(select.value).title; refreshIcons(art); });
        picker.appendChild(select); section.appendChild(picker);
        var start = button('lf-diary-session-primary', text('بدء جلسة القراءة', 'Start reading session'), 'play', function () { startReadingSession(select.value); });
        start.appendChild(node('span', '', text('ابدأ القراءة', 'Start reading'))); section.appendChild(start);
      } else {
        section.appendChild(node('p', 'lf-diary-session-hint', text('أضف عملًا إلى مكتبتك لتبدأ جلسة قراءة.', 'Add a work to your library to start a reading session.')));
      }
    } else {
      var book = node('div', 'lf-diary-session-book'); book.appendChild(coverFor(session.id));
      var workCopy = node('div'); workCopy.appendChild(node('span', '', text('تقرأ الآن', 'Currently reading'))); workCopy.appendChild(node('strong', '', workInfo(session.id).title));
      book.appendChild(workCopy); section.appendChild(book);
      var clock = node('div', 'lf-diary-session-clock');
      clock.appendChild(node('span', '', session.runningSince ? text('مدة الجلسة', 'Session duration') : text('الجلسة متوقفة مؤقتًا', 'Session paused')));
      var time = node('time', 'lf-diary-session-time', core.clockTime(core.sessionElapsed(session, Date.now())));
      time.setAttribute('role', 'timer'); time.setAttribute('aria-label', text('وقت جلسة القراءة', 'Reading session time')); clock.appendChild(time);
      clock.appendChild(node('small', '', text('ساعات : دقائق : ثوانٍ', 'Hours : minutes : seconds'))); section.appendChild(clock);
      var controls = node('div', 'lf-diary-session-controls');
      var toggle = button('lf-diary-session-primary', session.runningSince ? text('إيقاف الجلسة مؤقتًا', 'Pause session') : text('استئناف الجلسة', 'Resume session'), session.runningSince ? 'pause' : 'play', session.runningSince ? pauseReadingSession : resumeReadingSession);
      toggle.appendChild(node('span', '', session.runningSince ? text('إيقاف مؤقت', 'Pause') : text('متابعة القراءة', 'Resume reading'))); controls.appendChild(toggle);
      var finish = button('lf-diary-session-finish', text('إنهاء وحفظ الجلسة', 'Finish and save session'), 'check', finishReadingSession);
      finish.appendChild(node('span', '', text('إنهاء وحفظ', 'Finish and save'))); controls.appendChild(finish);
      section.appendChild(controls);
      var discard = button('lf-diary-session-discard', text('إلغاء الجلسة دون حفظ', 'Discard session without saving'), null, discardReadingSession);
      discard.textContent = text('إلغاء الجلسة', 'Discard session'); section.appendChild(discard);
      if (session.runningSince) sessionTicker = global.setInterval(function () {
        var current = activeSession();
        if (!current || !current.runningSince || !doc.querySelector('.lf-diary-session-view')) { global.clearInterval(sessionTicker); sessionTicker = 0; return; }
        var elapsed = core.sessionElapsed(current, Date.now());
        if (elapsed >= 8 * 60 * 60 * 1000) {
          var paused = core.pauseSession(current, Date.now());
          if (paused && write(SESSION_KEY, paused)) { render(); announce(text('توقفت الجلسة تلقائيًا بعد ثماني ساعات', 'Session automatically paused after eight hours')); }
          return;
        }
        time.textContent = core.clockTime(elapsed);
      }, 1000);
    }
    body.appendChild(section);
  }
  function createEntry(workId, noteText, quoteText, anchorType, anchorValue, spoiler) {
    var text = String(noteText || '').trim();
    var position = Number(anchorValue);
    var isQuote = state.composeKind === 'quote';
    if (!workId || (!isQuote && !text) || !['chapter', 'page', 'volume'].includes(anchorType) || !Number.isSafeInteger(position) || position < 1 || position > 1000000) return false;
    var previous = entries();
    var identity = { at: state.editing ? state.editing.at : Date.now(), entryId: state.editing ? state.editing.entryId : global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2) };
    var event = isQuote
      ? core.quoteEntry(Object.assign({ id: workId, quote: quoteText, note: text, anchorType: anchorType, anchorValue: position, spoiler: spoiler }, identity))
      : Object.assign({ id: workId, type: 'note', chapter: anchorType === 'chapter' ? position : 0, anchorType: anchorType, anchorValue: position, spoiler: !!spoiler, note: text.slice(0, 600) }, identity);
    if (!event) return false;
    if (state.editing) previous = previous.filter(function (item) { return !(item.id === state.editing.id && item.at === state.editing.at && item.entryId === state.editing.entryId); });
    if (!write(LOG_KEY, core.merge(previous, [event]))) return false;
    state.composing = false;
    state.editing = null;
    state.initialAnchor = null;
    state.filter = state.workFilter ? (isQuote ? 'quotes' : 'notes') : 'all';
    render();
    announce(isQuote ? text('حُفظ الاقتباس في سجلك الخاص', 'Quote saved to your private diary') : text('حُفظت ملاحظتك بشكل خاص', 'Note saved privately'));
    return true;
  }
  function compose(body) {
    var form = node('form', 'lf-diary-form');
    if (!state.editing) {
      var mode = node('div', 'lf-diary-compose-modes'); mode.setAttribute('role', 'group'); mode.setAttribute('aria-label', text('نوع التدوين', 'Entry type'));
      [['note', text('ملاحظة', 'Note')], ['quote', text('اقتباس', 'Quote')]].forEach(function (choice) {
        var control = button('lf-diary-compose-mode' + (state.composeKind === choice[0] ? ' is-active' : ''), choice[1], null, function () {
          state.composeKind = choice[0];
          mode.querySelectorAll('button').forEach(function (item) { var active = item === control; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', active ? 'true' : 'false'); });
          quoteLabel.hidden = state.composeKind !== 'quote'; quote.required = state.composeKind === 'quote';
          noteLabel.firstChild.textContent = state.composeKind === 'quote' ? text('تعليقك (اختياري)', 'Your thoughts (optional)') : text('ماذا تودّ تذكره؟', 'What would you like to remember?');
          textarea.required = state.composeKind === 'note';
          textarea.placeholder = state.composeKind === 'quote' ? text('ما الذي لفتك في هذا المقطع؟', 'What caught your attention in this passage?') : text('فكرة أو انطباع بعد القراءة...', 'A thought or impression after reading...');
          textarea.setAttribute('aria-label', state.composeKind === 'quote' ? text('تعليقك على الاقتباس (اختياري)', 'Your thoughts on the quote (optional)') : text('ملاحظتك', 'Your note'));
          var pageTitle = form.closest('.lf-diary-page').querySelector('.lf-diary-header h1');
          if (pageTitle) pageTitle.textContent = state.composeKind === 'quote' ? text('إضافة اقتباس', 'Add quote') : text('إضافة ملاحظة', 'Add note');
        });
        control.textContent = choice[1]; control.setAttribute('aria-pressed', state.composeKind === choice[0] ? 'true' : 'false'); mode.appendChild(control);
      });
      form.appendChild(mode);
    }
    var label = node(state.workFilter ? 'div' : 'label', 'lf-diary-label', text('العمل', 'Work'));
    var select = node('select', 'lf-diary-select');
    select.required = true;
    var blank = node('option', '', text('اختر عملًا من مكتبتك', 'Choose a work from your library')); blank.value = ''; select.appendChild(blank);
    var choices = works();
    if (state.selectedWork && choices.indexOf(state.selectedWork) < 0) choices.unshift(state.selectedWork);
    choices.forEach(function (id) { var option = node('option', '', workInfo(id).title); option.value = id; select.appendChild(option); });
    select.value = state.selectedWork || '';
    if (state.workFilter) select.disabled = true;
    if (state.workFilter) {
      var context = node('div', 'lf-diary-work-context'); context.appendChild(coverFor(state.workFilter));
      var contextCopy = node('span'); contextCopy.appendChild(node('strong', '', workInfo(state.workFilter).title));
      contextCopy.appendChild(node('small', '', text('تدوينة لهذا العمل', 'Entry for this work'))); context.appendChild(contextCopy); label.appendChild(context);
    } else label.appendChild(select);
    form.appendChild(label);
    if (choices.length === 0) {
      var noWorks = node('div', 'lf-diary-no-works');
      noWorks.appendChild(node('p', '', text('أضف عملًا إلى مكتبتك لتدوّن عند موضع قراءتك.', 'Add a work to your library to make a reading note.')));
      var search = button('', text('الانتقال إلى بحث الأعمال', 'Go to work search'), 'search', function () {
        var query = new URLSearchParams(global.location.search); query.set('route', 'search');
        global.location.assign(global.location.pathname + '?' + query.toString());
      });
      search.appendChild(node('span', '', text('بحث الأعمال', 'Search works'))); noWorks.appendChild(search); form.appendChild(noWorks);
    }
    var existing = state.editing && core.anchor(state.editing);
    var currentProgress = snapshot().progress[select.value] || {};
    var anchorType = existing ? existing.type : state.initialAnchor ? state.initialAnchor.type : (Number(currentProgress.page) > 0 && !Number(currentProgress.chapter || currentProgress.ch) ? 'page' : 'chapter');
    var placeLabel = node('div', 'lf-diary-label', text('موضع القراءة', 'Reading position'));
    var kinds = node('div', 'lf-diary-position-kinds');
    [['chapter', text('فصل', 'Chapter')], ['page', text('صفحة', 'Page')], ['volume', text('مجلد', 'Volume')]].forEach(function (choice) {
      var control = button('lf-diary-position-kind' + (anchorType === choice[0] ? ' is-active' : ''), choice[1], null, function () {
        anchorType = choice[0];
        kinds.querySelectorAll('button').forEach(function (item) { item.classList.toggle('is-active', item === control); item.setAttribute('aria-pressed', item === control ? 'true' : 'false'); });
        var progress = snapshot().progress[select.value] || {};
        position.value = String(progress[anchorType] || (anchorType === 'chapter' ? progress.ch : anchorType === 'volume' ? progress.vol : '') || '');
      });
      control.textContent = choice[1]; control.setAttribute('aria-pressed', anchorType === choice[0] ? 'true' : 'false'); kinds.appendChild(control);
    });
    kinds.setAttribute('role', 'group'); kinds.setAttribute('aria-label', text('نوع موضع القراءة', 'Reading position type'));
    placeLabel.appendChild(kinds);
    var position = node('input', 'lf-diary-position-input'); position.type = 'number'; position.min = '1'; position.max = '1000000'; position.step = '1'; position.required = true;
    position.placeholder = text('رقم الموضع', 'Position number'); position.setAttribute('aria-label', text('رقم الفصل أو الصفحة أو المجلد', 'Chapter, page or volume number'));
    position.value = existing ? (existing.value || '') : state.initialAnchor ? state.initialAnchor.value : (currentProgress[anchorType] || (anchorType === 'chapter' ? currentProgress.ch : '') || '');
    placeLabel.appendChild(position); form.appendChild(placeLabel);
    select.addEventListener('change', function () { var progress = snapshot().progress[select.value] || {}; position.value = String(progress[anchorType] || ''); });
    var quoteLabel = node('label', 'lf-diary-label lf-diary-quote-label', text('المقطع الذي تريد الاحتفاظ به', 'A passage to keep'));
    var quote = node('textarea', 'lf-diary-textarea lf-diary-quote-input');
    quote.maxLength = 280; quote.required = state.composeKind === 'quote'; quote.rows = 3;
    quote.placeholder = text('اكتب مقتطفًا قصيرًا من العمل...', 'Write a short passage from the work...');
    if (state.editing) quote.value = state.editing.quote || '';
    quoteLabel.hidden = state.composeKind !== 'quote'; quoteLabel.appendChild(quote); form.appendChild(quoteLabel);
    var noteLabel = node('label', 'lf-diary-label', state.composeKind === 'quote' ? text('تعليقك (اختياري)', 'Your thoughts (optional)') : text('ماذا تودّ تذكره؟', 'What would you like to remember?'));
    var textarea = node('textarea', 'lf-diary-textarea');
    textarea.maxLength = 600; textarea.required = state.composeKind === 'note';
    textarea.placeholder = state.composeKind === 'quote' ? text('ما الذي لفتك في هذا المقطع؟', 'What caught your attention in this passage?') : text('فكرة أو انطباع بعد القراءة...', 'A thought or impression after reading...');
    textarea.setAttribute('aria-label', state.composeKind === 'quote' ? text('تعليقك على الاقتباس (اختياري)', 'Your thoughts on the quote (optional)') : text('ملاحظتك', 'Your note'));
    if (state.editing) textarea.value = state.editing.note || '';
    noteLabel.appendChild(textarea); form.appendChild(noteLabel);
    var spoilerLabel = node('label', 'lf-diary-spoiler');
    var spoiler = node('input'); spoiler.type = 'checkbox'; spoiler.checked = !!(state.editing && state.editing.spoiler);
    spoilerLabel.appendChild(spoiler);
    var spoilerCopy = node('span', 'lf-diary-spoiler-copy'); spoilerCopy.appendChild(node('strong', '', text('تحتوي على حرق', 'Contains spoilers')));
    spoilerCopy.appendChild(node('small', '', text('يُخفى النص قبل بلوغ هذا الموضع', 'Text stays hidden until you reach this position'))); spoilerLabel.appendChild(spoilerCopy);
    form.appendChild(spoilerLabel);
    var footer = node('div', 'lf-diary-form-foot');
    footer.appendChild(node('span', '', text('خاصة بك فقط', 'Only you can see this')));
    var save = button('lf-diary-save', text('حفظ التدوين', 'Save entry'), 'check', function () {});
    save.type = 'submit'; save.appendChild(node('span', '', text('حفظ', 'Save')));
    footer.appendChild(save); form.appendChild(footer);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!createEntry(select.value, textarea.value, quote.value, anchorType, position.value, spoiler.checked)) announce(text('اختر العمل وموضع القراءة واكتب النص أولًا', 'Choose a work and reading position, then write your entry'));
    });
    body.appendChild(form);
    refreshIcons(form);
  }
  function editNote(event) {
    state.editing = event;
    state.composeKind = event.type === 'quote' ? 'quote' : 'note';
    state.selectedWork = event.id;
    state.composing = true;
    render();
    var field = doc.querySelector(event.type === 'quote' ? '.lf-diary-quote-input' : '.lf-diary-textarea');
    if (field) field.focus();
  }
  function deleteNote(event) {
    var subject = event.type === 'quote' ? text('الاقتباس', 'quote') : text('الملاحظة', 'note');
    if (!global.confirm(text('حذف ', 'Delete ') + subject + text(' من سجل القراءة؟', ' from your reading diary?'))) return;
    var remaining = entries().filter(function (item) {
      return !(item.id === event.id && item.at === event.at && item.entryId === event.entryId);
    });
    if (!write(LOG_KEY, remaining)) { announce(text('تعذر حذف الملاحظة', 'Could not delete the note')); return; }
    render();
    announce(text('حُذف ', 'Deleted ') + subject);
  }
  function deleteSessionEntry(event) {
    if (!global.confirm(text('حذف جلسة القراءة من السجل؟', 'Delete this reading session from your diary?'))) return;
    var remaining = entries().filter(function (item) {
      return !(item.type === 'session' && item.id === event.id && item.at === event.at && item.entryId === event.entryId);
    });
    if (!write(LOG_KEY, remaining)) { announce(text('تعذر حذف الجلسة', 'Could not delete the session')); return; }
    render();
    announce(text('حُذفت الجلسة من السجل', 'Session deleted from your diary'));
  }
  function render() {
    var page = doc.querySelector('.lf-diary-page');
    if (!page) return;
    if (sessionTicker) { global.clearInterval(sessionTicker); sessionTicker = 0; }
    var scroll = page.querySelector('.lf-diary-scroll');
    var previousScroll = scroll ? scroll.scrollTop : 0;
    page.textContent = '';
    page.lang = language();
    page.dir = language() === 'en' ? 'ltr' : 'rtl';
    page.classList.toggle('is-composing', state.composing);
    page.classList.toggle('is-session', state.sessionView);
    var header = node('header', 'lf-diary-header');
    var back = button('lf-diary-icon-button', state.composing || state.sessionView ? text('رجوع إلى سجل القراءة', 'Back to reading diary') : state.workFilter ? text('رجوع إلى العمل', 'Back to work') : text('رجوع إلى حسابي', 'Back to profile'), language() === 'en' ? 'arrow-left' : 'arrow-right', function () {
      if (state.sessionView) { state.sessionView = false; render(); }
      else if (state.composing) { state.composing = false; state.editing = null; render(); }
      else close();
    });
    header.appendChild(back);
    header.appendChild(node('h1', '', state.sessionView ? text('جلسة قراءة', 'Reading session') : state.composing ? (state.editing ? text('تعديل ', 'Edit ') : text('إضافة ', 'Add ')) + (state.composeKind === 'quote' ? text('اقتباس', 'quote') : text('ملاحظة', 'note')) : state.workFilter ? text('ملاحظات العمل', 'Work notes') : text('سجل القراءة', 'Reading diary')));
    if (state.composing || state.sessionView) header.appendChild(node('span'));
    else header.appendChild(button('lf-diary-icon-button', text('إضافة ملاحظة أو اقتباس', 'Add note or quote'), 'plus', function () { state.composeKind = 'note'; state.composing = true; render(); }));
    page.appendChild(header);
    var body = node('div', 'lf-diary-scroll');
    if (state.sessionView) {
      renderSessionView(body); page.appendChild(body);
      var sessionStatus = node('span', 'lf-diary-status'); sessionStatus.setAttribute('role', 'status'); sessionStatus.setAttribute('aria-live', 'polite'); page.appendChild(sessionStatus);
      refreshIcons(page); return;
    }
    var intro = node('section', 'lf-diary-intro');
    intro.appendChild(node('p', 'lf-diary-eyebrow', text('مساحتك الخاصة', 'Your private space')));
    intro.appendChild(node('h2', '', state.workFilter ? workInfo(state.workFilter).title : text('كل صفحة لها أثر', 'Every page leaves a mark')));
    intro.appendChild(node('p', 'lf-diary-intro-copy', state.workFilter ? text('ملاحظاتك واقتباساتك عند موضع القراءة.', 'Your notes and quotes, tied to a reading position.') : text('محطات قراءتك، وملاحظاتك، والمقاطع التي تود العودة إليها. تبقى خاصة ما لم تشاركها.', 'Your reading milestones, notes and passages to return to. Private unless you share them.')));
    body.appendChild(intro);
    var all = entries().filter(function (event) { return !state.workFilter || event.id === state.workFilter; });
    var counters = node('div', 'lf-diary-counters');
    [['book-open', all.filter(function (e) { return e.type === 'started'; }).length, text('بدايات', 'Started')],
      ['bookmark', all.filter(function (e) { return e.type === 'progress'; }).length, text('تقدّم', 'Progress')],
      ['check', all.filter(function (e) { return e.type === 'completed'; }).length, text('إكمال', 'Completed')]].forEach(function (item) {
      var stat = node('div', 'lf-diary-counter'); stat.appendChild(icon(item[0], 17));
      stat.appendChild(node('strong', '', String(item[1]))); stat.appendChild(node('span', '', item[2])); counters.appendChild(stat);
    });
    body.appendChild(counters);
    if (!state.composing) {
      var running = activeSession();
      var total = core.sumSessionMs(all);
      var launch = button('lf-diary-session-launch', text('فتح جلسات القراءة', 'Open reading sessions'), 'timer', function () { state.sessionView = true; state.composing = false; render(); });
      var launchCopy = node('span'); launchCopy.appendChild(node('strong', '', running ? running.runningSince ? text('جلسة قراءة جارية', 'Reading session in progress') : text('جلسة متوقفة مؤقتًا', 'Session paused') : text('جلسات القراءة', 'Reading sessions')));
      launchCopy.appendChild(node('small', '', running ? workInfo(running.id).title + ' · ' + core.durationLabel(core.sessionElapsed(running, Date.now()), language()) : total ? text('وقت موثّق · ', 'Recorded time · ') + core.durationLabel(total, language()) : text('سجّل الوقت الذي قضيته مع كتابك', 'Record time spent with your book')));
      launch.appendChild(launchCopy); launch.appendChild(icon(language() === 'en' ? 'chevron-right' : 'chevron-left', 18)); body.appendChild(launch);
    }
    if (state.composing) compose(body);
    if (state.workFilter) {
      var clear = button('lf-diary-clear-work', text('عرض سجل كل الأعمال', 'Show diary for all works'), language() === 'en' ? 'arrow-left' : 'arrow-right', function () { state.workFilter = ''; state.selectedWork = ''; state.composing = false; state.filter = 'all'; render(); });
      clear.appendChild(node('span', '', text('كل الأعمال', 'All works'))); body.appendChild(clear);
    }
    var filters = node('div', 'lf-diary-filters'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', text('تصفية سجل القراءة', 'Filter reading diary'));
    [['all', text('الكل', 'All')], ['reading', text('القراءة', 'Reading')], ['sessions', text('جلسات', 'Sessions')], ['completed', text('المكتمل', 'Completed')], ['notes', text('ملاحظات', 'Notes')], ['quotes', text('اقتباسات', 'Quotes')]].forEach(function (item) {
      var filter = button('lf-diary-filter' + (state.filter === item[0] ? ' is-active' : ''), item[1], null, function () { state.filter = item[0]; render(); });
      filter.textContent = item[1]; filter.setAttribute('aria-pressed', state.filter === item[0] ? 'true' : 'false'); filters.appendChild(filter);
    });
    body.appendChild(filters);
    var visible = all.filter(function (event) { return state.filter === 'all' || kind(event).group === state.filter; });
    var readingState = snapshot();
    var timeline = node('div', 'lf-diary-timeline');
    if (!visible.length) {
      var empty = node('div', 'lf-diary-empty'); empty.appendChild(icon('book-open', 25));
      empty.appendChild(node('strong', '', all.length ? text('لا توجد عناصر في هذا القسم', 'No entries in this section') : state.workFilter ? text('لا توجد تدوينات لهذا العمل بعد', 'No entries for this work yet') : text('سجلك يبدأ مع قراءتك القادمة', 'Your diary starts with your next read')));
      empty.appendChild(node('p', '', all.length ? text('جرّب قسمًا آخر، أو أضف تدوينة جديدة.', 'Try another section or add a new entry.') : state.workFilter ? text('أضف ملاحظة أو اقتباسًا من زر الإضافة.', 'Add a note or quote using the add button.') : text('ابدأ عملًا أو حدّث تقدّمك، وأضف ملاحظاتك واقتباساتك هنا.', 'Start a work or update your progress, then add your notes and quotes here.')));
      timeline.appendChild(empty);
    } else {
      var date = '';
      visible.forEach(function (event) {
        var currentDate = dateLabel(event.at);
        if (currentDate !== date) { date = currentDate; timeline.appendChild(node('h3', 'lf-diary-date', date)); }
        var item = node('article', 'lf-diary-entry' + (event.type === 'quote' ? ' is-quote' : ''));
        item.appendChild(coverFor(event.id));
        var copy = node('div', 'lf-diary-entry-copy');
        var meta = node('div', 'lf-diary-entry-meta'); meta.appendChild(icon(kind(event).symbol, 15)); meta.appendChild(node('span', '', kind(event).label));
        copy.appendChild(meta);
        var title = button('lf-diary-work', text('فتح ', 'Open ') + workInfo(event.id).title, null, function () { openWork(event.id); });
        title.textContent = workInfo(event.id).title; title.setAttribute('data-no-translate', 'true'); copy.appendChild(title);
        if (positionLabel(event)) copy.appendChild(node('span', 'lf-diary-chapter', positionLabel(event)));
        if (event.type === 'session') copy.appendChild(node('span', 'lf-diary-session-duration', core.durationLabel(event.durationMs, language())));
        var personal = event.type === 'note' || event.type === 'quote';
        if (personal && event.spoiler) copy.appendChild(node('span', 'lf-diary-spoiler-tag', text('يتضمن حرقًا', 'Contains spoilers')));
        var contentTarget = event.type === 'quote' ? node('div', 'lf-diary-quote-content') : copy;
        var hidden = personal && event.spoiler && !core.canReveal(event, readingState) && !state.revealed.has(revealKey(event));
        if (event.type === 'quote' && event.quote && !hidden) { var passage = node('blockquote', 'lf-diary-quote', event.quote); passage.dir = 'auto'; passage.setAttribute('data-no-translate', 'true'); contentTarget.appendChild(passage); }
        if (event.note && !hidden) { var reflection = node('p', event.type === 'quote' ? 'lf-diary-reflection' : 'lf-diary-note', event.note); reflection.dir = 'auto'; reflection.setAttribute('data-no-translate', 'true'); contentTarget.appendChild(reflection); }
        if (hidden) {
          var reveal = button('lf-diary-reveal', text('عرض محتوى يتضمن حرقًا', 'Reveal spoiler content'), 'eye', function () { state.revealed.add(revealKey(event)); render(); var hideControl = page.querySelector('button[data-diary-spoiler="hide"]'); if (hideControl) hideControl.focus(); });
          reveal.setAttribute('data-diary-spoiler', 'reveal');
          reveal.appendChild(node('span', '', text('عرض المحتوى رغم الحرق', 'Reveal spoilers'))); contentTarget.appendChild(reveal);
        } else if (event.spoiler && state.revealed.has(revealKey(event)) && !core.canReveal(event, readingState)) {
          var hide = button('lf-diary-reveal', text('إخفاء المحتوى', 'Hide content'), 'eye-off', function () { state.revealed.delete(revealKey(event)); render(); var revealControl = page.querySelector('button[data-diary-spoiler="reveal"]'); if (revealControl) revealControl.focus(); });
          hide.setAttribute('data-diary-spoiler', 'hide');
          hide.appendChild(node('span', '', text('إخفاء النص', 'Hide text'))); contentTarget.appendChild(hide);
        }
        if (personal) {
          var actions = node('div', 'lf-diary-note-actions');
          var edit = button('', text('تعديل ', 'Edit ') + (event.type === 'quote' ? text('الاقتباس', 'quote') : text('الملاحظة', 'note')), null, function () { editNote(event); }); edit.textContent = text('تعديل', 'Edit'); actions.appendChild(edit);
          var remove = button('', text('حذف ', 'Delete ') + (event.type === 'quote' ? text('الاقتباس', 'quote') : text('الملاحظة', 'note')), null, function () { deleteNote(event); }); remove.textContent = text('حذف', 'Delete'); actions.appendChild(remove);
          contentTarget.appendChild(actions);
        }
        if (event.type === 'session') {
          var sessionActions = node('div', 'lf-diary-note-actions');
          var removeSession = button('', text('حذف جلسة القراءة', 'Delete reading session'), null, function () { deleteSessionEntry(event); });
          removeSession.textContent = text('حذف الجلسة', 'Delete session'); sessionActions.appendChild(removeSession); copy.appendChild(sessionActions);
        }
        if (event.type === 'quote' && !event.spoiler) {
          var discuss = button('lf-diary-community-action', text('مناقشة الاقتباس في المجتمع', 'Discuss quote in community'), 'messages-square', function () { discussQuote(event); });
          discuss.appendChild(node('span', '', text('ناقش الاقتباس في المجتمع', 'Discuss in community'))); contentTarget.appendChild(discuss);
        }
        item.appendChild(copy);
        item.appendChild(button('lf-diary-share', text('مشاركة هذه المحطة', 'Share this milestone'), 'share-2', function () { shareEntry(event); }));
        if (event.type === 'quote') item.appendChild(contentTarget);
        timeline.appendChild(item);
      });
    }
    body.appendChild(timeline); page.appendChild(body);
    page.appendChild(node('span', 'lf-diary-status'));
    page.lastChild.setAttribute('role', 'status'); page.lastChild.setAttribute('aria-live', 'polite');
    body.scrollTop = previousScroll;
    refreshIcons(page);
  }
  function open(options) {
    var screen = doc.getElementById('screen');
    if (!screen || screen.querySelector('.lf-diary-page')) return;
    sync();
    var runningSession = activeSession();
    var workId = options && typeof options.workId === 'string' ? options.workId : '';
    if (options && options.session && runningSession) workId = runningSession.id;
    state.workFilter = workId;
    state.selectedWork = workId;
    state.filter = workId ? (options && options.compose === 'quote' ? 'quotes' : 'notes') : 'all'; state.composing = !!(workId && options.compose); state.composeKind = options && options.compose === 'quote' ? 'quote' : 'note';
    state.sessionView = !state.composing && !!(runningSession || options && options.session);
    state.initialAnchor = options && ['chapter', 'page', 'volume'].includes(options.anchorType) && Number.isSafeInteger(Number(options.anchorValue)) && Number(options.anchorValue) > 0 ? { type: options.anchorType, value: Number(options.anchorValue) } : null;
    state.editing = null; state.revealed.clear();
    var page = node('section', 'lf-diary-page');
    if (doc.querySelector('.lf-app.is-dark')) page.classList.add('is-dark');
    page.setAttribute('role', 'dialog'); page.setAttribute('aria-modal', 'true'); page.setAttribute('aria-label', text('سجل القراءة', 'Reading diary'));
    screen.appendChild(page);
    render();
    page.addEventListener('keydown', function (event) {
      var shareOverlay = page.querySelector('.lf-diary-share-overlay');
      if (event.key === 'Escape') { if (shareOverlay) shareOverlay.remove(); else close(); return; }
      if (event.key !== 'Tab') return;
      var focusable = Array.prototype.slice.call((shareOverlay || page).querySelectorAll('button:not([disabled]),select:not([disabled]),textarea:not([hidden]),input:not([hidden])')).filter(function (control) { return control.offsetParent !== null; });
      if (!focusable.length) return;
      if (event.shiftKey && doc.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
      else if (!event.shiftKey && doc.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0].focus(); }
    });
    var back = page.querySelector('.lf-diary-header button');
    if (back) back.focus();
  }
  function enhanceProfile() {
    var recent = doc.querySelector('.lf-profile-page > .lf-profile-recent');
    if (!recent) return;
    var page = recent.parentNode;
    var anchor = page.querySelector(':scope > .lf-profile-community-summary') ||
      page.querySelector(':scope > .lf-profile-rated-characters') || recent;
    var currentSession = activeSession();
    var nextSubtitle = currentSession ? currentSession.runningSince ? text('جلسة قراءة جارية', 'Reading session in progress') : text('جلسة متوقفة مؤقتًا', 'Session paused') : text('جلساتك وملاحظاتك واقتباساتك', 'Your sessions, notes and quotes');
    if (global.LorefyI18n) nextSubtitle = global.LorefyI18n.translate(nextSubtitle, doc.documentElement.lang);
    var existing = doc.querySelector('.lf-profile-page > .lf-diary-entrypoint');
    var entry = existing;
    if (entry) {
      var subtitle = entry.querySelector('small');
      if (subtitle && subtitle.textContent !== nextSubtitle) subtitle.textContent = nextSubtitle;
    } else {
      entry = button('lf-diary-entrypoint', text('فتح سجل القراءة', 'Open reading diary'), null, open);
      var symbol = node('span', 'lf-diary-entrypoint-icon'); symbol.appendChild(icon('book-heart', 21)); entry.appendChild(symbol);
      var copy = node('span', 'lf-diary-entrypoint-copy'); copy.appendChild(node('strong', '', text('سجل القراءة', 'Reading diary')));
      copy.appendChild(node('small', '', nextSubtitle)); entry.appendChild(copy);
      entry.appendChild(icon(language() === 'en' ? 'chevron-right' : 'chevron-left', 18));
      refreshIcons(entry);
    }
    if (anchor.nextSibling !== entry) page.insertBefore(entry, anchor.nextSibling);
  }
  function enhanceDetail() {
    var actions = doc.querySelector('.lf-detail-page .lf-detail-actions');
    if (!actions || doc.querySelector('.lf-detail-page .lf-diary-detail-entrypoint')) return;
    var workId = new URLSearchParams(global.location.search).get('novel') || '';
    if (!workId) return;
    var entry = button('lf-diary-detail-entrypoint', text('فتح ملاحظات واقتباسات هذا العمل', 'Open notes and quotes for this work'), null, function () { open({ workId: workId, compose: true }); });
    entry.appendChild(icon('notebook-pen', 19));
    var copy = node('span'); copy.appendChild(node('strong', '', text('ملاحظات واقتباسات', 'Notes and quotes')));
    copy.appendChild(node('small', '', text('عند فصل أو صفحة محددة', 'At a specific chapter or page'))); entry.appendChild(copy);
    entry.appendChild(icon(language() === 'en' ? 'chevron-right' : 'chevron-left', 17));
    actions.parentNode.insertBefore(entry, actions.nextSibling);
    refreshIcons(entry);
    var sessionEntry = button('lf-diary-detail-session', text('بدء جلسة لهذا العمل', 'Start a session for this work'), 'timer', function () { open({ workId: workId, session: true }); });
    sessionEntry.appendChild(node('span', '', text('ابدأ جلسة قراءة', 'Start reading session')));
    entry.parentNode.insertBefore(sessionEntry, entry.nextSibling);
    refreshIcons(sessionEntry);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    global.setTimeout(function () { scheduled = false; sync(); enhanceProfile(); enhanceDetail(); }, 120);
  }
  function start() {
    var screen = doc.getElementById('screen');
    if (!screen) return;
    new MutationObserver(schedule).observe(screen, { childList: true, subtree: true });
    global.addEventListener('storage', schedule);
    global.addEventListener('lorefy:routechange', schedule);
    global.setInterval(function () { if (!doc.hidden) sync(); }, 2500);
    schedule();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
  global.LorefyReadingDiary = { open: open, sync: sync };
})(window);

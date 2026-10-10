(function (global) {
  'use strict';
  var doc = global.document;
  var core = global.LorefyChapterDetailCore;
  var metadata = global.LorefyChapterMetadata;
  if (!doc || !core) return;

  var KEY = 'lorefy.user.chapterReviews.v1';
  var PREVIEW_KEY = 'lorefy.demo.chapterDiscussions.v1';
  var scheduled = false;
  var selected = 1;
  var expanded = 0;
  var activeWork = '';
  var readingUndo = null;
  var catalogCache = { source: null, length: 0, id: '', title: '', work: null, idExists: false };

  function el(tag, className, text) {
    var item = doc.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function icon(name, size) {
    var item = el('i'); item.setAttribute('data-lucide', name);
    item.setAttribute('width', String(size || 18)); item.setAttribute('height', String(size || 18));
    item.setAttribute('aria-hidden', 'true'); return item;
  }
  function button(label, className, name, action) {
    var item = el('button', className); item.type = 'button'; item.setAttribute('aria-label', label);
    if (name) item.appendChild(icon(name)); item.addEventListener('click', action); return item;
  }
  function refreshIcons(root) {
    try { if (global.lucide && global.lucide.createIcons) global.lucide.createIcons({ nodes: [root] }); } catch (error) {}
  }
  function read() {
    try {
      var value = JSON.parse(global.localStorage.getItem(KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (error) { return {}; }
  }
  function write(value) {
    try { global.localStorage.setItem(KEY, JSON.stringify(value)); return true; }
    catch (error) { return false; }
  }
  function readPreview() {
    if (!global.LorefyBackend || global.LorefyBackend.mode !== 'demo') return {};
    try { var value = JSON.parse(global.localStorage.getItem(PREVIEW_KEY) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
    catch (_) { return {}; }
  }
  function writePreview(value) {
    if (!global.LorefyBackend || global.LorefyBackend.mode !== 'demo') return false;
    try { global.localStorage.setItem(PREVIEW_KEY, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function previewRows(workId, chapter, offset) {
    var saved = (readPreview()[workId] || {})[String(chapter)];
    if (!saved || offset) return [];
    return [{ id:'preview-' + workId + '-' + chapter, user_id:'preview', rating:saved.rating, body:saved.comment, spoiler:saved.spoiler, updated_at:new Date(saved.updatedAt).toISOString(), is_preview:true }];
  }
  function catalogWork(id, title) {
    var catalog = global.LorefyMangaData;
    if (!Array.isArray(catalog)) return null;
    if (catalogCache.source === catalog && catalogCache.length === catalog.length && catalogCache.id === id && catalogCache.title === title) return catalogCache.work;
    var byId = catalog.find(function (work) { return work && String(work.id) === id; });
    var sameTitle = function (work) { return work && [work.title, work.ar, work.en, work.titleEnglish].some(function (value) { return String(value || '').trim() === title; }); };
    var match = sameTitle(byId) ? byId : catalog.find(sameTitle) || null;
    catalogCache = { source: catalog, length: catalog.length, id: id, title: title, work: match, idExists: !!byId };
    return match;
  }
  function context() {
    var content = doc.querySelector('.lf-detail-page .lf-detail-content');
    var title = content && content.querySelector('h1');
    if (!content || !title) return null;
    var label = title.textContent.trim();
    var queryId = new URLSearchParams(global.location.search).get('novel') || '';
    var work = catalogWork(queryId, label);
    var id = work ? String(work.id) : queryId;
    if (queryId && !work && catalogCache.idExists) return null;
    if (!id) return null;
    var metadataText = Array.prototype.slice.call(content.children, 0, 6).map(function (item) { return item.textContent; }).join(' ');
    var verifiedSource = metadata && metadata.sourceFor(id);
    var record = global.LorefyChapterData && global.LorefyChapterData[id];
    var savedCount = core.total(work, metadataText) || core.total(record, '') || verifiedSource && verifiedSource.count || 0;
    var catalog = metadata && metadata.catalogFor(id);
    var count = Math.max(savedCount, catalog && catalog.total || 0);
    var type = content.children[0] && content.children[0].textContent || '';
    if (!count && !/مانجا|مانهوا|كوميكس|ويب نوفل|لايت نوفل|manga|manhwa|comic|web novel|light novel/i.test(type)) return null;
    var heroImage = content.closest('.lf-detail-page').querySelector('.lf-detail-hero > img');
    return { content: content, id: id, title: label, total: count,
      finished: core.isFinished(work,verifiedSource),
      cover: heroImage && heroImage.getAttribute('src') || '', chapterDetails: {},
      numbers: catalog && catalog.total >= savedCount ? catalog.numbers : null,
      catalogState: catalog ? 'ready' : 'idle' };
  }
  function reviewFor(id, chapter) { return (read()[id] || {})[String(chapter)] || null; }
  function announce(section, text) { var status = section.querySelector('.lf-chapter-status'); if (status) status.textContent = text; }

  function english() { return doc.documentElement.lang === 'en'; }
  function text(ar, en) { return english() ? en : ar; }
  function readingState() {
    function value(key) {
      var parsed = JSON.parse(global.localStorage.getItem(key) || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid reading state');
      return parsed;
    }
    return {library:value('lorefy.user.library.v2'),progress:value('lorefy.user.progress.v2')};
  }
  function notifyReading() {
    ['lorefy.user.library.v2','lorefy.user.progress.v2'].forEach(function (key) {
      global.dispatchEvent(new global.CustomEvent('lorefy:stored-state', {detail:{key:key}}));
    });
  }
  function saveReading(section, info, chapter) {
    try {
      var before = readingState();
      var updated = core.updateReading(before, info.id, chapter, info.total, info.finished);
      if (!updated) throw new Error('Invalid chapter');
      core.persistReading(global.localStorage,updated);
      readingUndo = {id:info.id,before:before,after:updated};
      notifyReading(); render(section, info);
      announce(section, text('تم حفظ القراءة حتى الفصل ', 'Reading saved through chapter ') + chapter);
    } catch (error) {
      announce(section, text('تعذر حفظ القراءة. لم نغيّر تقدمك؛ حاول مجددًا.', 'Could not save reading progress. Try again.'));
    }
  }
  function undoReading(section, info) {
    try {
      if (!readingUndo || readingUndo.id !== info.id) return;
      var state = readingState(), previous = readingUndo.before;
      if (JSON.stringify(state.progress[info.id]) !== JSON.stringify(readingUndo.after.progress[info.id]) || state.library[info.id] !== readingUndo.after.library[info.id]) {
        throw new Error('Reading changed since action');
      }
      ['library','progress'].forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(previous[key],info.id)) state[key][info.id] = previous[key][info.id];
        else delete state[key][info.id];
      });
      core.persistReading(global.localStorage,state);
      readingUndo = null; notifyReading(); render(section,info);
      announce(section,text('تم التراجع عن تسجيل القراءة','Reading progress undone'));
    } catch (error) { announce(section,text('تعذر التراجع. افتح تقدم القراءة للتحقق.', 'Could not undo. Check your reading progress.')); }
  }
  function chapterDiscussion(info, chapter) {
    var host = el('section', 'lf-chapter-discussion');
    host.setAttribute('aria-label', text('نقاش الفصل', 'Chapter discussion'));
    host.appendChild(el('h3', '', text('نقاش الفصل', 'Chapter discussion')));
    var list = el('div', 'lf-chapter-discussion-list'); host.appendChild(list);
    var offset = 0, loading = false, reloadPending = false, loadedIds = new Set();
    var more = button(text('عرض المزيد', 'Load more'), 'lf-chapter-discussion-more', null, function () { load(true); });
    more.textContent = text('عرض المزيد', 'Load more'); more.hidden = true; host.appendChild(more);
    async function load(append) {
      if (loading) return;
      loading = true; more.disabled = true;
      if (!append) { offset = 0; loadedIds.clear(); list.textContent = ''; }
      var status = el('p', 'lf-chapter-discussion-status', text('جارٍ تحميل التقييمات…', 'Loading reviews…')); list.appendChild(status);
      try {
        var backend = global.LorefyBackend;
        var rows = backend && backend.mode === 'live' ? await backend.listChapterReviews(info.id, chapter, offset) : backend && backend.mode === 'demo' ? previewRows(info.id, chapter, offset) : [];
        if (!host.isConnected) return;
        status.remove();
        if (!rows.length && !offset) list.appendChild(el('p', '', text('لا توجد تقييمات بعد. كن أول من يقيّم الفصل.', 'No reviews yet. Be the first to rate this chapter.')));
        rows.forEach(function (review) {
          if (loadedIds.has(review.id)) return;
          loadedIds.add(review.id);
          var row = el('article', 'lf-chapter-reader-review');
          var author = review.profile || {};
          var head = el('header');
          if (/^https?:\/\//i.test(author.avatar || '')) {
            var avatar = el('img'); avatar.src = author.avatar; avatar.alt = ''; avatar.loading = 'lazy'; avatar.onerror = function () { this.remove(); }; head.appendChild(avatar);
          }
          var name = review.is_preview ? el('strong', 'lf-chapter-reader-name', text('معاينة محلية · أنت', 'Local preview · You')) : button(text('فتح حساب القارئ', 'Open reader profile'), 'lf-chapter-reader-name', null, function () {
            global.dispatchEvent(new global.CustomEvent('lorefy:open-reader-profile', { detail:author }));
          }); if (!review.is_preview) { name.textContent = author.name || author.username || text('قارئ', 'Reader'); name.setAttribute('aria-label', text('فتح حساب ', 'Open profile of ') + name.textContent); } head.appendChild(name);
          if (review.rating) { var rating = el('span', 'lf-chapter-reader-rating'); rating.appendChild(icon('feather', 16)); rating.appendChild(el('span', '', review.rating + '/5')); head.appendChild(rating); }
          row.appendChild(head);
          var date = new Date(review.updated_at);
          if (!isNaN(date.getTime())) { var time = el('time', '', date.toLocaleDateString(english() ? 'en' : 'ar')); time.dateTime = date.toISOString(); row.appendChild(time); }
          if (review.body) {
            var comment = el('p', 'lf-chapter-reader-comment', review.body); comment.dir = 'auto';
            if (review.spoiler) { var reveal = el('details', 'lf-chapter-reader-spoiler'); reveal.appendChild(el('summary', '', text('تعليق يحتوي على حرق · إظهار', 'Spoiler comment · Reveal'))); reveal.appendChild(comment); row.appendChild(reveal); }
            else row.appendChild(comment);
          }
          var actions = el('details', 'lf-chapter-reader-actions');
          if (review.is_preview) { list.appendChild(row); return; }
          var menu = el('summary'); menu.setAttribute('aria-label', text('خيارات التقييم', 'Review options')); menu.appendChild(icon('ellipsis', 18)); actions.appendChild(menu);
          var own = backend && backend.user && String(backend.user.id) === String(review.user_id);
          if (own) {
            var remove = button(text('حذف التقييم المنشور', 'Delete published review'), '', 'trash-2', async function () {
              if (!global.confirm(text('حذف تقييمك المنشور لهذا الفصل؟ تبقى ملاحظتك الخاصة محفوظة.', 'Delete your published review? Your private note will remain.'))) return;
              remove.disabled = true;
              try { await backend.deleteChapterReview(review.id); row.remove(); }
              catch (_) { remove.disabled = false; menu.textContent = text('تعذر الحذف؛ حاول مجددًا', 'Unable to delete; try again'); }
            }); remove.appendChild(el('span', '', text('حذف التقييم المنشور', 'Delete published review'))); actions.appendChild(remove);
          } else {
            var reportForm = el('form', 'lf-chapter-report');
            var reason = el('select'); reason.setAttribute('aria-label', text('سبب البلاغ', 'Report reason'));
            [['spam','محتوى مزعج','Spam'],['abuse','إساءة','Abuse'],['harassment','تحرش','Harassment'],['spoiler','حرق غير معلّم','Unmarked spoiler'],['copyright','حقوق نشر','Copyright']].forEach(function (item) { var option = el('option', '', text(item[1],item[2])); option.value = item[0]; reason.appendChild(option); });
            var report = el('button', '', text('إرسال بلاغ', 'Submit report')); report.type = 'submit'; reportForm.appendChild(reason); reportForm.appendChild(report);
            reportForm.addEventListener('submit', async function (event) {
              event.preventDefault(); if (report.disabled) return; report.disabled = true;
              try { await backend.submitReport({targetType:'profile',targetId:review.user_id,reason:reason.value,note:'Chapter review '+review.id+' | '+info.id+' | chapter '+chapter}); report.textContent = text('تم إرسال البلاغ', 'Report submitted'); }
              catch (_) { report.disabled = false; report.textContent = text('تعذر الإرسال · حاول مجددًا', 'Failed · Retry'); }
            }); actions.appendChild(reportForm);
            var block = button(text('حظر القارئ', 'Block reader'), '', 'user-x', async function () {
              block.disabled = true;
              try { await backend.setProfileBlock(review.user_id, true); await load(false); }
              catch (_) { block.disabled = false; block.textContent = text('تعذر الحظر · حاول مجددًا', 'Failed · Retry'); }
            }); block.appendChild(el('span', '', text('حظر القارئ', 'Block reader'))); actions.appendChild(block);
          }
          row.appendChild(actions);
          list.appendChild(row);
        });
        offset += rows.length; more.hidden = rows.length < 20; refreshIcons(list);
      } catch (_) {
        if (!host.isConnected) return;
        status.textContent = text('تعذر تحميل تقييمات الفصل.', 'Unable to load chapter reviews.');
        var retry = button(text('إعادة المحاولة', 'Retry'), '', null, function () { status.remove(); load(append); });
        retry.textContent = text('إعادة المحاولة', 'Retry'); status.appendChild(retry); more.hidden = true;
      } finally { loading = false; more.disabled = false; if (reloadPending && host.isConnected) { reloadPending = false; load(false); } }
    }
    // Wait until the host is mounted; discarded chapter views never receive results.
    global.setTimeout(function () { if (host.isConnected) load(false); }, 0);
    host.reload = function () { if (loading) { reloadPending = true; return; } return load(false); };
    return host;
  }

  function editor(section, info, chapter) {
    var previous = (readPreview()[info.id] || {})[String(chapter)] || reviewFor(info.id, chapter) || {};
    var score = Number(previous.rating) || 0;
    var form = el('form', 'lf-chapter-editor');
    var heading = el('div', 'lf-chapter-editor-heading');
    var detail = info.chapterDetails[chapter];
    heading.appendChild(el('strong', '', detail && detail.title || 'الفصل ' + chapter));
    heading.appendChild(el('span', '', 'تقييمك وتعليقك')); form.appendChild(heading);
    var stars = el('div', 'lf-chapter-stars lf-rating-scale'); stars.setAttribute('role', 'group'); stars.setAttribute('aria-label', text('تقييم الفصل من 5', 'Chapter rating out of 5'));
    var scoreText = el('span', 'lf-chapter-score-text');
    var slider = el('input'); slider.type = 'range'; slider.min = 0; slider.max = 5; slider.step = 0.25; slider.value = score;
    slider.setAttribute('aria-label', text('تقييم الفصل من 5', 'Chapter rating out of 5'));
    function paintRating() {
      var caption = score ? score.toFixed(2) + text(' من 5', ' out of 5') : text('اختر تقييمك', 'Choose a rating');
      scoreText.textContent = caption; slider.setAttribute('aria-valuetext', caption);
      slider.setAttribute('style', '--rating-progress:' + (score / 5 * 100) + '%');
    }
    slider.addEventListener('input', function () { score = Number(slider.value); paintRating(); });
    stars.appendChild(slider);
    var ticks = el('div', 'lf-rating-scale-labels'); ticks.setAttribute('aria-hidden', 'true');
    [0,1,2,3,4,5].forEach(function (n) { ticks.appendChild(el('span', '', String(n))); }); stars.appendChild(ticks);
    paintRating();
    var ratingLine = el('div', 'lf-chapter-rating-line'); ratingLine.appendChild(stars); ratingLine.appendChild(scoreText); form.appendChild(ratingLine);
    var noteLabel = el('label', 'lf-chapter-note-label', 'تعليقك');
    var textarea = el('textarea', 'lf-chapter-note'); textarea.maxLength = 1000;
    textarea.setAttribute('aria-label', text('تعليقك على الفصل', 'Your chapter comment'));
    textarea.placeholder = 'رأيك في هذا الفصل'; textarea.value = previous.comment || '';
    noteLabel.appendChild(textarea); form.appendChild(noteLabel);
    var options = el('div', 'lf-chapter-editor-options');
    var spoilerLabel = el('label', 'lf-chapter-spoiler');
    var spoiler = el('input'); spoiler.type = 'checkbox'; spoiler.checked = !!previous.spoiler;
    spoilerLabel.appendChild(spoiler); spoilerLabel.appendChild(el('span', '', 'يحتوي على حرق'));
    options.appendChild(spoilerLabel); options.appendChild(el('small', '', text('التقييم المنشور يظهر في هذا الفصل فقط', 'Published reviews appear only in this chapter'))); form.appendChild(options);
    var quote = button('حفظ اقتباس من الفصل ' + chapter, 'lf-chapter-quote-action', 'quote', function () {
      if (global.LorefyReadingDiary) global.LorefyReadingDiary.open({ workId: info.id, compose: 'quote', anchorType: 'chapter', anchorValue: chapter });
    });
    quote.appendChild(el('span', '', 'احتفظ باقتباس من هذا الفصل')); form.appendChild(quote);
    var actions = el('div', 'lf-chapter-editor-actions');
    var privateSave = button(text('حفظ خاص', 'Save privately'), 'lf-chapter-private-save', 'lock-keyhole', function () {
      var updated = core.save(read(), info.id, chapter, score, textarea.value, spoiler.checked, Date.now(), info.total);
      if (!updated || !write(updated)) { feedback(text('تعذر الحفظ؛ اختر تقييمًا أو اكتب تعليقًا.', 'Choose a rating or write a comment to save.'), true); return; }
      feedback(text('حُفظت ملاحظتك الخاصة ولم تُنشر.', 'Saved privately. Not published.'));
    });
    privateSave.appendChild(el('span', '', text('حفظ خاص', 'Save privately'))); actions.appendChild(privateSave);
    var cancel = button('إغلاق تقييم الفصل', '', null, function () { expanded = 0; render(section, info); });
    cancel.textContent = 'إلغاء'; actions.appendChild(cancel);
    var demo = global.LorefyBackend && global.LorefyBackend.mode === 'demo';
    var saveLabel = text('إضافة للفصل', 'Add to chapter');
    var save = el('button', 'lf-chapter-save', saveLabel); save.type = 'submit'; actions.appendChild(save);
    form.appendChild(actions);
    var resultStatus = el('p', 'lf-chapter-publish-status'); resultStatus.setAttribute('role', 'status'); resultStatus.setAttribute('aria-live', 'polite'); form.appendChild(resultStatus);
    if (demo) resultStatus.textContent = text('معاينة محلية: الإضافة تظهر هنا فقط ولا تصل للمستخدمين.', 'Local preview: additions appear here only, not to other users.');
    function feedback(message, error) { resultStatus.textContent = message; resultStatus.setAttribute('data-kind', error ? 'error' : 'success'); }
    var publishing = false;
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (publishing) return;
      var updated = core.save(read(), info.id, chapter, score, textarea.value, spoiler.checked, Date.now(), info.total);
      if (!updated) { feedback(text('اختر تقييمًا أو اكتب تعليقًا أولًا.', 'Choose a rating or write a comment first.'), true); return; }
      var backend = global.LorefyBackend;
      if (!backend || (backend.mode !== 'live' && backend.mode !== 'demo')) { feedback(text('سجّل الدخول لإضافة تعليق للفصل. يمكنك الحفظ الخاص.', 'Sign in to add a chapter comment. You can save privately.'), true); return; }
      publishing = true;
      save.textContent = text('جارٍ الإضافة...', 'Adding...');
      form.setAttribute('aria-busy', 'true');
      Array.from(form.elements).forEach(function (control) { control.disabled = true; });
      try {
        if (backend.mode === 'demo') {
          var preview = core.save(readPreview(), info.id, chapter, score, textarea.value, spoiler.checked, Date.now(), info.total);
          if (!preview || !writePreview(preview)) throw new Error('preview_save_failed');
        } else {
          await backend.publishChapterReview(info.id, chapter, score, textarea.value, spoiler.checked);
          write(updated);
        }
        if (!form.isConnected) return;
        var discussion = form.parentElement.querySelector('.lf-chapter-discussion');
        if (discussion) await discussion.reload();
        feedback(backend.mode === 'demo' ? text('أُضيف للنقاش محليًا في المعاينة فقط.', 'Added locally to the chapter preview only.') : text('أُضيف تعليقك إلى نقاش الفصل فقط.', 'Added to this chapter discussion only.'));
      } catch (_) { feedback(text('تعذرت الإضافة. تعليقك لم يُفقد؛ حاول مجددًا.', 'Unable to add. Your comment is still here; try again.'), true); }
      finally { publishing = false; save.textContent = saveLabel; form.setAttribute('aria-busy', 'false'); Array.from(form.elements).forEach(function (control) { control.disabled = false; }); }
    });
    return form;
  }

  function render(section, info) {
    section.textContent = '';
    var reviews = Object.assign({}, read()[info.id] || {}, readPreview()[info.id] || {});
    var header = el('div', 'lf-chapter-heading');
    var title = el('div', 'lf-chapter-heading-copy');
    title.appendChild(el('h2', '', 'الفصول'));
    title.appendChild(el('span', 'lf-chapter-total', info.total ? info.total + ' فصل' : info.catalogState === 'loading' ? 'جاري تحميل الفصول' : 'العدد غير متوفر'));
    header.appendChild(title);
    var recent = core.latestReviewChapter(reviews, info.total);
    if (recent) {
      var resume = button('العودة إلى آخر فصل قيّمته، الفصل ' + recent, 'lf-chapter-resume', 'bookmark', function () {
        selected = recent; expanded = recent; render(section, info);
        var active = section.querySelector('.lf-chapter-row[aria-expanded="true"]');
        if (active) active.scrollIntoView({ block: 'center' });
      });
      resume.appendChild(el('span', '', 'آخر تقييم · الفصل ' + recent)); header.appendChild(resume);
    }
    section.appendChild(header);
    if (info.total) {
      var state;
      try { state = readingState(); } catch (_) { state = {library:{},progress:{}}; }
      var next = core.nextUnread(state.progress[info.id],info.total,state.library[info.id]==='تم القراءة');
      var readCount = next ? next - 1 : info.total;
      var reading = el('div','lf-chapter-reading');
      var readingCopy = el('div','lf-chapter-reading-copy');
      readingCopy.appendChild(el('strong','',text('تقدم القراءة','Reading progress')));
      readingCopy.appendChild(el('span','',readCount + ' / ' + info.total));
      var meter = el('progress'); meter.max=info.total; meter.value=readCount;
      meter.setAttribute('aria-label',text('الفصول المقروءة','Chapters read')); readingCopy.appendChild(meter); reading.appendChild(readingCopy);
      var readingActions = el('div','lf-chapter-reading-actions');
      if (next) {
        var continueButton = button(text('الفصل التالي','Next chapter'),'','arrow-left',function () {
          selected=next; expanded=next; render(section,info);
          var target=section.querySelector('.lf-chapter-item.is-expanded'); if(target) target.scrollIntoView({block:'start'});
        });
        continueButton.appendChild(el('span','',text('الفصل التالي','Next chapter') + ' · ' + next)); readingActions.appendChild(continueButton);
        var allButton=button(text('قرأت كل الفصول المتاحة','Mark all available chapters read'),'','check-check',function () { saveReading(section,info,info.total); });
        allButton.appendChild(el('span','',text('قرأت كل المتاح','Mark all read'))); readingActions.appendChild(allButton);
      }
      if(readingUndo && readingUndo.id===info.id) {
        var undoButton=button(text('تراجع عن تسجيل القراءة','Undo reading progress'),'','undo-2',function(){undoReading(section,info);});
        undoButton.appendChild(el('span','',text('تراجع','Undo'))); readingActions.appendChild(undoButton);
      }
      reading.appendChild(readingActions); section.appendChild(reading);
    }
    var controls = el('div', 'lf-chapter-controls');
    var jump = el('form', 'lf-chapter-jump'); jump.id = 'lf-chapter-jump';
    var input = el('input'); input.type = 'number'; input.min = '1'; input.step = '1';
    if (info.total) {
      var rangeWrap = el('label', 'lf-chapter-range-wrap');
      rangeWrap.appendChild(el('span', '', 'عرض الفصول'));
      var ranges = el('select', 'lf-chapter-range'); ranges.setAttribute('aria-label', text('نطاق الفصول', 'Chapter range'));
      for (var start = 1; start <= info.total; start += 10) {
        var end = Math.min(start + 9, info.total);
        var option = el('option', '', start === end ? String(start) : start + '–' + end); option.value = String(start);
        ranges.appendChild(option);
      }
      ranges.value = String(core.range(info.total, selected).start);
      ranges.addEventListener('change', function () { selected = Number(ranges.value); expanded = 0; render(section, info); });
      rangeWrap.appendChild(ranges); controls.appendChild(rangeWrap);
      var jumpToggle = button('الانتقال إلى رقم فصل', 'lf-chapter-jump-toggle', 'hash', function () {
        jump.hidden = !jump.hidden;
        jumpToggle.setAttribute('aria-expanded', String(!jump.hidden));
        if (!jump.hidden) input.focus();
      });
      jumpToggle.title = 'الانتقال إلى رقم فصل';
      jumpToggle.setAttribute('aria-controls', jump.id);
      jumpToggle.setAttribute('aria-expanded', 'false'); controls.appendChild(jumpToggle);
      jump.hidden = true;
    }
    if (info.total) input.max = String(info.total);
    input.placeholder = 'رقم الفصل'; input.setAttribute('aria-label', 'الانتقال إلى فصل');
    jump.appendChild(input);
    var go = el('button', '', 'انتقال'); go.type = 'submit'; jump.appendChild(go);
    jump.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!core.validChapter(input.value, info.total)) { announce(section, 'أدخل رقم فصل صحيحًا'); return; }
      selected = Number(input.value); expanded = selected; render(section, info);
      var active = section.querySelector('.lf-chapter-editor'); if (active) active.scrollIntoView({ block: 'nearest' });
    });
    controls.appendChild(jump); section.appendChild(controls);
    var list = el('div', 'lf-chapter-list');
    var chapters = core.visibleChapters(info.total, selected, info.numbers, reviews);
    if (!info.total && expanded && chapters.indexOf(expanded) < 0) chapters.push(expanded);
    chapters.sort(function (a, b) { return a - b; });
    if (!chapters.length) {
      var empty = info.catalogState === 'loading' ? 'جاري تحميل قائمة الفصول…' : info.catalogState === 'error' ? 'تعذر تحميل الفصول. حاول مجددًا.' : 'لا تتوفر قائمة فصول موثّقة لهذا العمل بعد.';
      list.appendChild(el('p', 'lf-chapter-unavailable', empty));
    }
    chapters.forEach(function (chapter) {
      (function (number) {
        var item = el('div', 'lf-chapter-item' + (expanded === number ? ' is-expanded' : ''));
        var row = button('الفصل ' + number + (expanded === number ? '، إغلاق التقييم' : '، فتح التقييم والتعليق'), 'lf-chapter-row', null, function () {
          expanded = expanded === number ? 0 : number; selected = number; render(section, info);
          if (expanded) { var field = section.querySelector('.lf-chapter-editor .lf-chapter-star'); if (field) field.focus(); }
        });
        row.dataset.chapter = String(number);
        row.setAttribute('aria-expanded', expanded === number ? 'true' : 'false');
        var art = el('span', 'lf-chapter-art');
        var chapterImage = el('img'); chapterImage.loading = 'lazy'; chapterImage.decoding = 'async';
        chapterImage.alt = text('غلاف العمل', 'Work cover');
        chapterImage.onerror = function () {
          if (this.dataset.chapterImage && info.cover && this.getAttribute('src') !== info.cover) {
            this.dataset.chapterImage = ''; this.src = info.cover; this.alt = text('غلاف العمل', 'Work cover');
          } else this.style.display = 'none';
        };
        if (info.cover) chapterImage.src = info.cover;
        art.appendChild(chapterImage);
        row.appendChild(art);
        var copy = el('span', 'lf-chapter-copy');
        copy.appendChild(el('span', 'lf-chapter-number', 'الفصل ' + number));
        var headline = el('span', 'lf-chapter-title', metadata && metadata.sourceFor(info.id) ? 'جاري جلب عنوان الفصل' : 'عنوان الفصل غير متوفر');
        headline.dir = 'auto'; copy.appendChild(headline);
        copy.appendChild(el('span', 'lf-chapter-meta', ''));
        copy.appendChild(el('span', 'lf-chapter-date', '')); row.appendChild(copy);
        var review = reviews[String(number)] || null;
        var summary = el('span', 'lf-chapter-summary');
        if (review && review.rating) { summary.appendChild(icon('feather', 15)); summary.appendChild(el('span', '', 'تقييمك ' + review.rating + '/5')); }
        if (review && review.comment) { summary.appendChild(icon('message-circle', 15)); }
        if (!review || !review.rating) { summary.appendChild(icon('feather', 15)); summary.appendChild(el('span', '', review && review.comment ? 'علّقت' : 'قيّم الآن')); }
        copy.appendChild(summary);
        var trailing = el('span', 'lf-chapter-trailing');
        trailing.appendChild(icon(expanded === number ? 'chevron-down' : 'chevron-left', 16));
        row.appendChild(trailing);
        item.appendChild(row);
        if (info.total) {
          var mark=button(text('قرأت حتى الفصل ','Read through chapter ') + number,'lf-chapter-read-mark','check',function(){saveReading(section,info,number);});
          mark.setAttribute('aria-pressed',String(number<=readCount));
          mark.appendChild(el('span','',number<=readCount ? text('مقروء','Read') : text('قرأت حتى هنا','Read through here')));
          item.appendChild(mark);
        }
        if (expanded === number) { item.appendChild(editor(section, info, number)); item.appendChild(chapterDiscussion(info, number)); }
        list.appendChild(item);
      })(chapter);
    });
    section.appendChild(list);
    if (info.catalogState === 'error') {
      var retry = button('إعادة تحميل الفصول', 'lf-chapter-retry', 'rotate-cw', function () { resolveCatalog(section, info, true); });
      retry.appendChild(el('span', '', 'إعادة المحاولة')); section.appendChild(retry);
    }
    enrichRows(section, info, chapters);
    var footer = el('div', 'lf-chapter-footer');
    var diary = button('عرض سجل القراءة لهذا العمل', '', 'notebook-pen', function () {
      if (global.LorefyReadingDiary) global.LorefyReadingDiary.open({ workId: info.id });
    });
    diary.appendChild(el('span', '', 'سجل القراءة')); footer.appendChild(diary);
    var source = metadata && metadata.sourceFor(info.id);
    if (source) {
      var credit = el('a', 'lf-chapter-credit', 'عناوين وأغلفة الفصول: ' + source.label);
      credit.href = 'https://' + source.domain + '.fandom.com/wiki/Category:Chapters';
      credit.target = '_blank'; credit.rel = 'noopener noreferrer'; footer.appendChild(credit);
    }
    section.appendChild(footer);
    var status = el('span', 'lf-chapter-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); section.appendChild(status);
    refreshIcons(section);
  }

  function resolveCatalog(section, info, retry) {
    if (!metadata || !metadata.canLoadCatalog(info.id) || info.catalogState === 'loading') return;
    info.catalogState = 'loading'; section.setAttribute('aria-busy', 'true');
    if (!info.total || retry) render(section, info);
    metadata.loadCatalog(info.id, global.fetch.bind(global), retry).then(function (catalog) {
      if (!section.isConnected || activeWork !== info.id) return;
      var priorTotal = info.total;
      info.total = Math.max(info.total, catalog.total);
      info.numbers = catalog.total >= priorTotal ? catalog.numbers : null;
      info.catalogState = 'ready'; section.dataset.total = String(info.total);
      section.setAttribute('aria-busy', 'false');
      // Keep the application-wide progress counter in sync with the verified list.
      if (catalog.total) {
        global.LorefyChapterData = global.LorefyChapterData || {};
        global.LorefyChapterData[info.id] = Object.assign({}, global.LorefyChapterData[info.id] || {}, {
          chapters: info.total, latestChapter: info.total, sourceUrl: catalog.sourceUrl
        });
      }
      if (!section.querySelector('.lf-chapter-editor')) render(section, info);
    }).catch(function () {
      if (!section.isConnected || activeWork !== info.id) return;
      info.catalogState = 'error'; section.setAttribute('aria-busy', 'false');
      if (!section.querySelector('.lf-chapter-editor')) render(section, info);
    });
  }

  function enrichRows(section, info, chapters) {
    if (!metadata || !metadata.sourceFor(info.id) || !chapters.length) return;
    var rangeKey = chapters.join(','); section.dataset.range = rangeKey;
    metadata.load(info.id, chapters, global.fetch.bind(global)).then(function (details) {
      if (!section.isConnected || section.dataset.range !== rangeKey) return;
      Object.assign(info.chapterDetails, details);
      chapters.forEach(function (number) {
        var row = section.querySelector('.lf-chapter-row[data-chapter="' + number + '"]');
        var detail = details[number];
        if (!row) return;
        var title = row.querySelector('.lf-chapter-title');
        title.textContent = detail && detail.title || 'عنوان الفصل غير متوفر';
        var extra = [];
        if (detail && detail.volume) extra.push((english() ? 'Volume ' : 'المجلد ') + detail.volume);
        if (detail && detail.pages) extra.push(detail.pages + (english() ? ' pages' : ' صفحة'));
        row.querySelector('.lf-chapter-meta').textContent = extra.join(' · ');
        row.querySelector('.lf-chapter-date').textContent = detail && detail.date ? metadata.displayDate(detail.date, english() ? 'en' : 'ar') : '';
        var image = row.querySelector('.lf-chapter-art img');
        if (detail && detail.image && !(global.LorefyRightsSafeMedia && global.LorefyRightsSafeMedia.enabled())) {
          var mediated = global.LorefyDataProxy && global.LorefyDataProxy.mediaUrl(detail.image);
          if (!mediated || mediated === detail.image) return;
          image.dataset.chapterImage = '1'; image.src = mediated; image.alt = 'غلاف الفصل ' + number;
          row.querySelector('.lf-chapter-art').classList.add('has-chapter-image');
        }
        var editorTitle = row.parentNode.querySelector('.lf-chapter-editor-heading strong');
        if (editorTitle && detail && detail.title) editorTitle.textContent = detail.title;
      });
    }).catch(function () {
      if (!section.isConnected || section.dataset.range !== rangeKey) return;
      section.querySelectorAll('.lf-chapter-title').forEach(function (title) { title.textContent = 'عنوان الفصل غير متوفر'; });
    });
  }

  function enhanceActions(actions) {
    if (!actions) return;
    function addReview(toolbar, reviewTarget) {
      var review = button('كتابة مراجعة للعمل', 'lf-chapter-quick-review', 'pen-line', function () {
        var target=doc.querySelector('.lf-detail-actions [data-lorefy-action="write-review"], .lf-detail-actions .lf-review-action-button');
        if(target) target.click();
      });
      review.appendChild(el('span', '', 'مراجعة العمل'));
      toolbar.insertBefore(review, toolbar.querySelector('.lf-chapter-more'));
      refreshIcons(review);
    }
    var toolbar = actions.parentNode.querySelector('.lf-chapter-quick-actions');
    var reviewTarget = actions.querySelector('[data-lorefy-action="write-review"], .lf-review-action-button');
    if (toolbar) {
      if (reviewTarget && !toolbar.querySelector('.lf-chapter-quick-review')) addReview(toolbar, reviewTarget);
      var target = actions.querySelector('button:first-child');
      var label = toolbar.querySelector('.lf-chapter-quick-add span');
      if(target && label && label.textContent!==target.textContent.trim()) label.textContent=target.textContent.trim();
      return;
    }
    actions.classList.add('lf-chapter-actions-ready');
    toolbar = el('div', 'lf-chapter-quick-actions');
    var addTarget = actions.querySelector('button:first-child');
    if (addTarget) {
      var add = button('إضافة العمل للقائمة', 'lf-chapter-quick-add', 'plus', function () {
        var target=doc.querySelector('.lf-detail-actions button:first-child'); if(target) target.click();
      });
      add.appendChild(el('span', '', addTarget.textContent.trim() || 'إضافة للقائمة')); toolbar.appendChild(add);
    }
    if (reviewTarget) addReview(toolbar, reviewTarget);
    function dismissMenu(event) {
      if (event && toolbar.contains(event.target)) return;
      var openMenu = toolbar.querySelector('.lf-chapter-more-menu');
      if (openMenu) openMenu.remove();
      doc.removeEventListener('pointerdown', dismissMenu);
    }
    var more = button('المزيد من خيارات العمل', 'lf-chapter-more', 'ellipsis', function () {
      var menu = toolbar.querySelector('.lf-chapter-more-menu');
      if (menu) { dismissMenu(); return; }
      menu = el('div', 'lf-chapter-more-menu'); menu.setAttribute('role', 'menu');
      [['تقييم الشخصيات', '.lf-character-action-button:not(.lf-topchars-action-button)', 'users'],
        ['تغيير الغلاف', 'button[title="تغيير الغلاف"]', 'image'],
        ['ترتيب الشخصيات', '.lf-topchars-action-button', 'list-ordered']].forEach(function (choice) {
        var target = actions.querySelector(choice[1]); if (!target) return;
        var item = button(choice[0], '', choice[2], function () { dismissMenu(); more.focus(); target.click(); });
        item.setAttribute('role', 'menuitem'); item.appendChild(el('span', '', choice[0])); menu.appendChild(item);
      });
      toolbar.appendChild(menu); refreshIcons(menu); doc.addEventListener('pointerdown', dismissMenu);
      var first = menu.querySelector('button'); if (first) first.focus();
    });
    toolbar.appendChild(more);
    var synopsis = actions.parentNode.querySelector('.lf-detail-scores');
    var relations = actions.parentNode.querySelector('.lf-work-relations');
    actions.parentNode.insertBefore(toolbar, relations || synopsis && synopsis.nextElementSibling || actions);
    refreshIcons(toolbar);
    toolbar.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (toolbar.querySelector('.lf-chapter-more-menu')) { dismissMenu(); more.focus(); }
    });
  }

  function enhance() {
    var info = context();
    if (!info) return;
    var actions = info.content.querySelector('.lf-detail-actions'); if (!actions) return;
    enhanceActions(actions);
    var section = info.content.querySelector('.lf-chapter-section');
    if (section && section.dataset.workId === info.id && Number(section.dataset.total) === info.total) return;
    if (activeWork !== info.id) { activeWork = info.id; selected = 1; expanded = 0; }
    if (section) section.remove();
    section = el('section', 'lf-chapter-section'); section.dataset.workId = info.id;
    section.dataset.total = String(info.total); section.setAttribute('aria-label', text('فصول ', 'Chapters ') + info.title);
    actions.parentNode.insertBefore(section, actions);
    render(section, info);
    if (!info.total || metadata && metadata.sourceFor(info.id) && !metadata.catalogFor(info.id)) resolveCatalog(section, info);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    global.setTimeout(function () { scheduled = false; enhance(); }, 150);
  }
  function start() {
    var screen = doc.getElementById('screen'); if (!screen) return;
    new MutationObserver(schedule).observe(screen, { childList: true, subtree: true });
    global.addEventListener('lorefy:routechange', schedule);
    global.addEventListener('storage', schedule);
    schedule();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(window);

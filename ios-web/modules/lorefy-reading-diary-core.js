(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyReadingDiaryCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function progressAt(value, type) {
    var aliases = {chapter:'ch',volume:'vol'};
    var raw = value && typeof value === 'object' ? (value[type] !== undefined ? value[type] : value[aliases[type]]) : type === 'chapter' ? value : 0;
    var number = Number(raw);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }
  function chapter(value) {
    return progressAt(value, 'chapter');
  }

  function transitions(before, after, at) {
    var oldLibrary = before && before.library || {};
    var newLibrary = after && after.library || {};
    var oldProgress = before && before.progress || {};
    var newProgress = after && after.progress || {};
    var events = [];
    Object.keys(newLibrary).forEach(function (id) {
      var previous = oldLibrary[id];
      var current = newLibrary[id];
      var currentChapter = chapter(newProgress[id]);
      if (current === 'تم القراءة' && previous !== current) {
        events.push({ id: id, type: 'completed', chapter: currentChapter, at: at });
      } else if (current === 'أقرأ حالياً' && previous !== current) {
        events.push({ id: id, type: 'started', chapter: currentChapter, at: at });
      } else if ((current === 'أقرأ حالياً' || current === 'تم القراءة') && currentChapter > chapter(oldProgress[id])) {
        events.push({ id: id, type: 'progress', chapter: currentChapter, at: at });
      }
    });
    return events;
  }

  function anchor(event) {
    var type = ['chapter', 'page', 'volume'].includes(event && event.anchorType) ? event.anchorType : 'chapter';
    var value = Math.max(0, Math.floor(Number(event && (event.anchorValue !== undefined ? event.anchorValue : event.chapter)) || 0));
    return { type: type, value: value };
  }

  function canReveal(event, state) {
    if (!event || !event.spoiler) return true;
    state = state || {};
    if ((state.library || {})[event.id] === 'تم القراءة') return true;
    var position = anchor(event);
    if (!position.value) return false;
    var progress = (state.progress || {})[event.id] || {};
    return progressAt(progress, position.type) >= position.value;
  }

  function quoteEntry(draft) {
    draft = draft || {};
    var quote = String(draft.quote || '').trim();
    var position = Number(draft.anchorValue);
    if (!draft.id || !quote || quote.length > 280 || !['chapter', 'page', 'volume'].includes(draft.anchorType) || !Number.isSafeInteger(position) || position < 1 || position > 1000000) return null;
    return {
      id: draft.id, type: 'quote', quote: quote, note: String(draft.note || '').trim().slice(0, 600),
      anchorType: draft.anchorType, anchorValue: position, chapter: draft.anchorType === 'chapter' ? position : 0,
      spoiler: !!draft.spoiler, at: draft.at, entryId: draft.entryId
    };
  }

  function communityQuote(event, work) {
    if (!event || event.type !== 'quote' || event.spoiler) return null;
    var passage = String(event.quote || '').trim();
    var title = String(work && work.title || '').trim();
    var position = anchor(event);
    if (!event.id || !passage || passage.length > 280 || !title || !position.value) return null;
    return {
      kind: 'quote', workId: String(event.id), title: title.slice(0, 160), image: String(work && work.cover || '').slice(0, 2048),
      quote: passage, anchorType: position.type, anchorValue: position.value
    };
  }

  var MAX_SESSION_MS = 8 * 60 * 60 * 1000;

  function startSession(id, at) {
    if (!String(id || '').trim() || !Number.isSafeInteger(at) || at < 1) return null;
    return { id: String(id), startedAt: at, runningSince: at, elapsedMs: 0 };
  }

  function sessionElapsed(session, at) {
    if (!session || !session.id || !Number.isSafeInteger(at)) return 0;
    var stored = Number(session.elapsedMs);
    if (!Number.isFinite(stored) || stored < 0) return 0;
    var running = Number.isSafeInteger(session.runningSince) && session.runningSince > 0
      ? Math.max(0, at - session.runningSince) : 0;
    return Math.min(MAX_SESSION_MS, stored + running);
  }

  function pauseSession(session, at) {
    if (!session || !Number.isSafeInteger(session.runningSince) || session.runningSince < 1) return null;
    return Object.assign({}, session, { runningSince: null, elapsedMs: sessionElapsed(session, at) });
  }

  function resumeSession(session, at) {
    if (!session || !session.id || session.runningSince || !Number.isSafeInteger(at) || at < 1 || sessionElapsed(session, at) >= MAX_SESSION_MS) return null;
    return Object.assign({}, session, { runningSince: at });
  }

  function finishSession(session, at, entryId) {
    var elapsed = sessionElapsed(session, at);
    if (!session || !session.id || !Number.isSafeInteger(at) || elapsed < 1000 || !entryId) return null;
    return { id: session.id, type: 'session', durationMs: elapsed, at: at, entryId: entryId };
  }

  function sumSessionMs(events, id) {
    return (Array.isArray(events) ? events : []).reduce(function (total, event) {
      if (!event || event.type !== 'session' || (id && event.id !== id)) return total;
      var duration = Number(event.durationMs);
      return total + (Number.isFinite(duration) && duration > 0 ? Math.min(MAX_SESSION_MS, duration) : 0);
    }, 0);
  }

  function durationLabel(ms, language) {
    var minutes = Math.floor(Math.max(0, Number(ms) || 0) / 60000);
    if (language === 'en') {
      if (!minutes) return 'Less than a minute';
      var wholeHours = Math.floor(minutes / 60), remainder = minutes % 60;
      var minuteLabel = remainder + (remainder === 1 ? ' minute' : ' minutes');
      if (!wholeHours) return minuteLabel;
      var hoursLabel = wholeHours + (wholeHours === 1 ? ' hour' : ' hours');
      return remainder ? hoursLabel + ' and ' + minuteLabel : hoursLabel;
    }
    if (!minutes) return 'أقل من دقيقة';
    var hours = Math.floor(minutes / 60);
    var rest = minutes % 60;
    if (!hours) return minutes === 1 ? 'دقيقة' : minutes === 2 ? 'دقيقتان' : minutes + (minutes > 10 ? ' دقيقة' : ' دقائق');
    var hourLabel = hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتان' : hours + ' ساعات';
    return rest ? hourLabel + ' و' + (rest === 1 ? 'دقيقة' : rest === 2 ? 'دقيقتان' : rest + (rest > 10 ? ' دقيقة' : ' دقائق')) : hourLabel;
  }

  function clockTime(ms) {
    var seconds = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
    return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60]
      .map(function (value) { return String(value).padStart(2, '0'); }).join(':');
  }

  function shareText(event, title, includeSpoiler, language) {
    var english = language === 'en';
    var labels = english ? { chapter: 'Chapter', page: 'Page', volume: 'Volume' } : { chapter: 'الفصل', page: 'الصفحة', volume: 'المجلد' };
    var position = anchor(event);
    var type = event && event.type;
    var caption = english ? ({quote:'Reading quote', note:'Reading note', session:'Reading session'}[type] || 'Reading progress') :
      ({quote:'اقتباس قراءة', note:'ملاحظة قراءة', session:'جلسة قراءة'}[type] || 'تقدّم القراءة');
    var heading = caption + ' · ' + String(title || (english ? 'A work in my library' : 'عمل في مكتبتي'));
    if (position.value) heading += ' · ' + labels[position.type] + ' ' + position.value;
    if (event && event.type === 'session') heading += ' · ' + durationLabel(event.durationMs, language);
    var visible = event && (!event.spoiler || includeSpoiler);
    var body = event && event.type === 'quote' && visible ? '\n«' + event.quote + '»' : '';
    if (event && event.note && visible) body += '\n' + event.note;
    if (event && event.spoiler && !includeSpoiler) body = english ? '\nHidden because it contains spoilers.' : '\nالمحتوى مخفي لأنه يتضمن حرقًا.';
    return heading + body + '\nLorefy';
  }

  function merge(existing, incoming) {
    var seen = new Set();
    return (Array.isArray(incoming) ? incoming : []).concat(Array.isArray(existing) ? existing : [])
      .filter(function (event) {
        if (!event || !event.id || !Number.isFinite(Number(event.at))) return false;
        var key = event.entryId || [event.id, event.type, event.chapter || 0, event.at].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(function (a, b) { return Number(b.at) - Number(a.at); })
      .slice(0, 300);
  }

  return { progressAt:progressAt, transitions: transitions, merge: merge, anchor: anchor, canReveal: canReveal, quoteEntry: quoteEntry, communityQuote: communityQuote, shareText: shareText,
    startSession: startSession, sessionElapsed: sessionElapsed, pauseSession: pauseSession, resumeSession: resumeSession,
    finishSession: finishSession, sumSessionMs: sumSessionMs, durationLabel: durationLabel, clockTime: clockTime };
});

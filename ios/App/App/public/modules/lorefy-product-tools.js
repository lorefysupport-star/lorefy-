(function (global) {
  "use strict";

  var doc = global.document;
  var factory = global.LorefyProductCore;
  if (!doc || !factory) return;
  var core = factory.createProductCore(global.localStorage);
  var pendingEnhance = false;

  var ICONS = {
    data: "database",
    correction: "badge-alert",
    safety: "shield-check",
    chevron: "chevron-left",
    close: "x",
    more: "ellipsis",
    download: "download",
    file: "file-json-2",
    table: "table-2"
  };

  var REPORT_LABELS = {
    spam: "محتوى مزعج أو دعائي",
    abuse: "إساءة أو خطاب كراهية",
    harassment: "تحرش أو استهداف شخصي",
    spoiler: "حرق غير معلّم",
    misinformation: "معلومة مضللة",
    copyright: "حقوق نشر"
  };
  var ISSUE_LABELS = {
    cover: "الغلاف غير صحيح",
    characters: "الشخصيات ناقصة أو خاطئة",
    metadata: "بيانات العمل غير دقيقة",
    duplicate: "العمل مكرر أو النسخة مرتبطة خطأ",
    translation: "الترجمة أو الاسم غير دقيق"
  };
  var VISIBILITY_LABELS = {
    private: "خاصة",
    unlisted: "برابط فقط",
    public: "عامة"
  };

  function uiText(ar, en) { return doc.documentElement.lang === "en" ? en : ar; }

  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value != null) node.setAttribute(key, value);
    });
    (Array.isArray(children) ? children : children ? [children] : []).forEach(function (child) {
      node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
    });
    return node;
  }

  function icon(name, size) {
    if (name === ICONS.chevron && doc.documentElement.lang === "en") name = "chevron-right";
    return el("i", { "data-lucide": name, width: String(size || 17), height: String(size || 17), "aria-hidden": "true" });
  }

  function refreshIcons(root) {
    try { if (global.lucide && global.lucide.createIcons) global.lucide.createIcons({ nodes: [root] }); } catch (error) {}
  }

  function safeRead(key, fallback) {
    try { return JSON.parse(global.localStorage.getItem(key) || "null") || fallback; } catch (error) { return fallback; }
  }

  function host() {
    return doc.getElementById("screen") || doc.body;
  }

  function toast(message) {
    var old = host().querySelector(".lf-product-toast");
    if (old) old.remove();
    var node = el("div", { class: "lf-product-toast", role: "status", text: message });
    host().appendChild(node);
    global.setTimeout(function () { node.remove(); }, 2600);
  }

  function closeSheet(overlay) {
    if (!overlay || overlay.__closed) return;
    overlay.__closed = true;
    if (overlay.__releaseDialog) overlay.__releaseDialog();
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (overlay && overlay.__returnFocus && overlay.__returnFocus.isConnected) overlay.__returnFocus.focus({ preventScroll: true });
  }

  function openSheet(title, subtitle, build, className) {
    var existing = host().querySelector(".lf-product-overlay");
    var opener = doc.activeElement;
    if (existing) {
      if (existing.contains(opener)) opener = existing.__returnFocus;
      closeSheet(existing);
    }
    var overlay = el("div", { class: "lf-product-overlay", role: "presentation" });
    overlay.__returnFocus = opener;
    var parentDialog = opener && opener.closest && opener.closest('[role="dialog"]');
    var sheet = el("section", { class: "lf-product-sheet" + (className ? " lf-product-studio " + className : ""), role: "dialog", "aria-modal": "true", "aria-label": title, dir: uiText("rtl", "ltr") });
    var close = el("button", { class: "lf-product-icon-button", type: "button", "aria-label": doc.documentElement.lang === 'en' ? 'Close' : 'إغلاق', onclick: function () { closeSheet(overlay); } }, icon(ICONS.close, 18));
    var heading = el("div", {}, [el("h2", { text: title }), subtitle ? el("p", { text: subtitle }) : null].filter(Boolean));
    var head = el("header", { class: "lf-product-sheet-head" }, [close, heading, el("span")]);
    var body = el("div", { class: "lf-product-sheet-body" });
    sheet.appendChild(el("div", { class: "lf-product-grabber" }));
    sheet.appendChild(head);
    sheet.appendChild(body);
    overlay.appendChild(sheet);
    overlay.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeSheet(overlay); return; }
      if (event.key !== "Tab") return;
      var controls = Array.from(sheet.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]'))
        .filter(function (control) { return !control.disabled && control.tabIndex >= 0 && control.getClientRects().length && !control.hidden; });
      var first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    overlay.addEventListener("click", function (event) { if (event.target === overlay) closeSheet(overlay); });
    build(body, function () { closeSheet(overlay); });
    host().appendChild(overlay);
    var isolated = [], current = overlay;
    // Only restore nodes this layer changed; an outer modal owns its existing isolation.
    while (current && current !== doc.body && current.parentElement) {
      Array.from(current.parentElement.children).forEach(function (sibling) {
        if (sibling !== current && !sibling.inert) { isolated.push(sibling); sibling.inert = true; }
      });
      current = current.parentElement;
    }
    var lifecycle = new MutationObserver(function () {
      if (!overlay.isConnected || (parentDialog && !parentDialog.isConnected)) closeSheet(overlay);
    });
    lifecycle.observe(doc.body, { childList: true, subtree: true });
    overlay.__releaseDialog = function () {
      lifecycle.disconnect();
      isolated.forEach(function (node) { node.inert = false; });
    };
    refreshIcons(overlay);
    var focusable = overlay.querySelector("button,select,input,textarea,a");
    if (focusable) focusable.focus({ preventScroll: true });
    return overlay;
  }

  function section(title, description) {
    return el("section", { class: "lf-product-section" }, [
      el("h3", { text: title }),
      description ? el("p", { text: description }) : null
    ].filter(Boolean));
  }

  function button(label, className, handler, iconName) {
    var children = [];
    if (iconName) children.push(icon(iconName, 16));
    children.push(el("span", { text: label }));
    return el("button", { type: "button", class: className, onclick: handler }, children);
  }

  async function downloadFile(name, text, type) {
    var cap = global.Capacitor;
    var native = cap && (cap.isNativePlatform ? cap.isNativePlatform() : cap.getPlatform && cap.getPlatform() !== "web");
    if (native) {
      var filesystem = cap.Plugins && cap.Plugins.Filesystem;
      var share = cap.Plugins && cap.Plugins.Share;
      if (!filesystem || !filesystem.writeFile || !share || !share.share) throw new Error("native_export_unavailable");
      var saved = await filesystem.writeFile({ path: "Lorefy-exports/" + Date.now() + "-" + name, data: text, encoding: "utf8", directory: "CACHE", recursive: true });
      if (!saved || !saved.uri) throw new Error("native_export_file_missing");
      await share.share({ title: name, files: [saved.uri], dialogTitle: doc.documentElement.lang === "en" ? "Save or share your file" : "حفظ الملف أو مشاركته" });
      return;
    }
    var blob = new global.Blob([text], { type: type || "application/octet-stream" });
    var url = global.URL.createObjectURL(blob);
    var link = el("a", { href: url, download: name });
    doc.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(function () { global.URL.revokeObjectURL(url); }, 1000);
  }

  async function runExport(event, prepare, message) {
    var control = event && event.currentTarget;
    if (control && doc.activeElement === control) {
      var sheet = control.closest('.lf-product-sheet');
      var close = sheet && sheet.querySelector('.lf-product-icon-button');
      if (close) close.focus({ preventScroll: true });
    }
    if (control) { control.disabled = true; control.setAttribute("aria-busy", "true"); }
    try { await prepare(); toast(message); }
    catch (error) {
      if (!/cancel/i.test(String(error && error.message || error))) toast(doc.documentElement.lang === "en" ? "Unable to export. Please try again." : "تعذر تصدير الملف. حاول مجددًا.");
    }
    finally { if (control) { control.disabled = false; control.removeAttribute("aria-busy"); } }
  }

  function csvCell(value) {
    var text = String(value == null ? "" : value);
    var formulaPrefix = /^\s*[=+@-]/.test(text);
    if (formulaPrefix) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function exportLibraryCsv() {
    var library = safeRead("lorefy.user.library.v2", {});
    var progress = safeRead("lorefy.user.progress.v2", {});
    var works = Array.isArray(global.LorefyMangaData) ? global.LorefyMangaData : [];
    var byId = new Map(works.map(function (work) { return [String(work.id), work]; }));
    var rows = [["id", "title", "type", "status", "chapter", "volume", "page", "note"]];
    Object.keys(library).forEach(function (id) {
      var work = byId.get(String(id)) || {};
      var itemProgress = progress[id] || {};
      rows.push([id, work.title || work.ar || "", work.type || "", library[id], itemProgress.chapter != null ? itemProgress.chapter : itemProgress.ch || 0, itemProgress.volume != null ? itemProgress.volume : itemProgress.vol || 0, itemProgress.page || 0, itemProgress.note || ""]);
    });
    var csv = "\ufeff" + rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n");
    return downloadFile("lorefy-library.csv", csv, "text/csv;charset=utf-8");
  }

  function allLists() {
    var workLists = safeRead("lorefy.customLists.v1", []);
    var characterLists = safeRead("lorefy.charTopLists.v1", []);
    var sections = global.LorefyProfileSections;
    var profileLists = sections ? sections.foldersFor({}, true, global.localStorage).map(function (list) {
      return { id: list.id, name: list.name, kind: list.kind === 'characters' ? uiText('شخصيات', 'Characters') : uiText('أعمال', 'Works'), profileList: true, isPublic: list.isPublic };
    }) : [];
    return profileLists.concat(workLists.map(function (list) { return { id: list.id, name: list.name || uiText("قائمة أعمال", "Work list"), kind: uiText("أعمال", "Works") }; })
      .concat(characterLists.map(function (list) { return { id: list.id, name: list.title || uiText("قائمة شخصيات", "Character list"), kind: uiText("شخصيات", "Characters") }; })));
  }

  function accountStamp() {
    var backend = global.LorefyBackend;
    return JSON.stringify([global.localStorage.getItem('lorefy.activeUser.v1'), safeRead('lorefy.session.v1', {}).userId,
      safeRead('lorefy.identity.v1', {}).id, backend && backend.user && backend.user.id]);
  }

  function renderVisibilityRows(container) {
    var lists = allLists();
    var stamp = accountStamp(), sections = global.LorefyProfileSections;
    var owner = sections && sections.account(global.localStorage);
    if (!lists.length) {
      container.appendChild(el("div", { class: "lf-product-empty", text: uiText("لا توجد قوائم مخصصة بعد. ستظهر هنا خيارات رؤية قوائمك.", "No custom lists yet. Your list visibility options will appear here.") }));
      return;
    }
    lists.forEach(function (list) {
      var select = el("select", { "aria-label": uiText("خصوصية ", "Visibility for ") + list.name });
      var selected = list.profileList ? (list.isPublic ? 'public' : 'private') : core.privacy.getListVisibility(list.id);
      (list.profileList ? ["private", "public"] : ["private", "unlisted", "public"]).forEach(function (value) {
        var option = el("option", { value: value, text: uiText(VISIBILITY_LABELS[value], { private: "Private", unlisted: "Link only", public: "Public" }[value]) });
        if (selected === value) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", async function () {
        if (select.disabled) return;
        if (stamp !== accountStamp()) { select.disabled = true; return; }
        select.disabled = true;
        try {
          var synced = true;
          if (list.profileList) {
            sections.setFolderVisibility(global.localStorage, owner, list.id, select.value === 'public');
            selected = select.value;
            var backend = global.LorefyBackend;
            if (backend && backend.mode === 'live') {
              try { synced = await backend.push() !== false; } catch (_) { synced = false; }
            }
          } else {
            core.privacy.setListVisibility(list.id, select.value);
            selected = select.value;
          }
          if (stamp !== accountStamp() || !container.isConnected) return;
          toast(synced ? (doc.documentElement.lang === 'en' ? 'List visibility updated' : 'تم تحديث خصوصية القائمة') : sections.labels(doc.documentElement.lang).syncPending);
        } catch (_) {
          if (stamp !== accountStamp() || !container.isConnected) return;
          select.value = selected;
          toast(doc.documentElement.lang === 'en' ? 'Could not update list visibility. Try again.' : 'تعذر تحديث خصوصية القائمة. حاول مجددًا.');
        } finally {
          if (stamp === accountStamp()) select.disabled = false;
        }
      });
      container.appendChild(el("div", { class: "lf-product-list-row" }, [
        el("div", { class: "lf-product-list-copy" }, [el("strong", { text: list.name, dir: "auto", "data-no-translate": "" }), el("small", { text: list.kind })]),
        el("label", { class: "lf-product-visibility-field" }, [el("span", { text: uiText("الرؤية", "Visibility") }), select])
      ]));
    });
  }

  function openDataCenter() {
    openSheet(uiText("الخصوصية والبيانات", "Privacy and data"), uiText("بياناتك وقوائمك", "Your data and lists"), function (body) {
      var exports = section(uiText("نسخة من بياناتك", "Your data copy"), uiText("صدّر مكتبتك وتقييماتك وقوائمك. لا يتضمن الملف بيانات الجلسة أو حالة Premium.", "Export your library, ratings and lists. Session data and Premium status are not included."));
      var exportButtons = el("div", { class: "lf-product-inline-actions" });
      exportButtons.appendChild(button(uiText("تصدير JSON", "Export JSON"), "lf-product-secondary", function (event) {
        var data = core.exportPortable(new Date());
        return runExport(event, function () { return downloadFile("lorefy-data.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8"); }, uiText("تم تجهيز نسخة بياناتك", "Your data copy is ready"));
      }, ICONS.file));
      exportButtons.appendChild(button(uiText("المكتبة CSV", "Library CSV"), "lf-product-secondary", function (event) { return runExport(event, exportLibraryCsv, uiText("تم تجهيز ملف المكتبة", "Your library file is ready")); }, ICONS.table));
      exports.appendChild(exportButtons);
      if (global.LorefyMonitoring && global.LorefyMonitoring.getDiagnostics) {
        exports.appendChild(button(uiText("تصدير تقرير التشخيص", "Export diagnostics"), "lf-product-secondary", function (event) {
          return runExport(event, function () { return downloadFile("lorefy-diagnostics.json", JSON.stringify(global.LorefyMonitoring.getDiagnostics(), null, 2), "application/json;charset=utf-8"); }, uiText("تم تجهيز تقرير التشخيص بدون بيانات الحساب", "Diagnostics prepared without account data"));
        }, "activity"));
      }
      body.appendChild(exports);

      var privacy = section(uiText("خصوصية القوائم", "List visibility"), uiText("العامة تظهر للآخرين، والخاصة لك فقط. بعض القوائم تدعم العرض برابط فقط.", "Public lists are visible to others; private lists are only for you. Some lists also support link-only access."));
      renderVisibilityRows(privacy);
      body.appendChild(privacy);

      var legal = section(uiText("الثقة والدعم", "Trust and support"), uiText("سياسات الاستخدام والتواصل مع الدعم.", "Policies and ways to contact support."));
      legal.appendChild(el("div", { class: "lf-product-links" }, [
        el("a", { href: "privacy-policy.html", text: uiText("سياسة الخصوصية", "Privacy policy") }),
        el("a", { href: "terms.html", text: uiText("شروط الاستخدام", "Terms of use") }),
        el("a", { href: "support.html", text: uiText("الدعم وجودة البيانات", "Support and data quality") })
      ]));
      body.appendChild(legal);
    }, "lf-data-studio");
  }

  function issueLabel(issue) {
    return uiText(ISSUE_LABELS[issue] || "تصحيح بيانات", { cover: "Incorrect cover", characters: "Missing or incorrect characters", metadata: "Incorrect work details", duplicate: "Duplicate or wrong edition", translation: "Incorrect name or translation" }[issue] || "Catalog correction");
  }

  function correctionDate(value) {
    var date = new Date(value);
    return isNaN(date.getTime()) ? uiText("التاريخ غير متاح", "Date unavailable") : date.toLocaleDateString(uiText("ar-SA", "en-GB"));
  }

  function correctionRow(item) {
    return el("div", { class: "lf-product-list-row" }, [
      el("div", { class: "lf-product-list-copy" }, [
        el("strong", { text: issueLabel(item.issue) }),
        el("small", { text: item.workId, dir: "auto", "data-no-translate": "" }),
        el("small", { text: correctionDate(item.createdAt) })
      ]),
      el("span", { class: "lf-product-status", text: uiText("محفوظ على الجهاز", "Saved on device") })
    ]);
  }

  function openCorrectionsCenter() {
    openSheet(uiText("مركز التصحيحات", "Correction center"), uiText("تصحيحات بيانات الأعمال", "Work detail corrections"), function (body) {
      var items = core.corrections.list();
      var info = section(uiText("تصحيحاتك", "Your corrections"), uiText("هذه التصحيحات محفوظة على هذا الجهاز؛ لم تُرسل إلى الخادم ولا تغيّر بيانات الكتالوج.", "These corrections are saved on this device. They have not been sent to the server and do not change the catalog."));
      if (!items.length) info.appendChild(el("div", { class: "lf-product-empty", text: uiText("لا توجد تصحيحات محفوظة. يمكنك إضافة تصحيح من صفحة العمل.", "No saved corrections. You can add one from a work page.") }));
      items.slice(0, 30).forEach(function (item) { info.appendChild(correctionRow(item)); });
      body.appendChild(info);
      if(global.LorefyCatalogRequests)body.appendChild(button(uiText('طلبات الأعمال المفقودة','Missing work drafts'),'lf-product-secondary',openMissingRequests,'library-big'));
    }, "lf-trust-studio lf-corrections-studio");
  }

  function requestOwner() {
    return global.LorefyBackend&&global.LorefyBackend.user&&global.LorefyBackend.user.id||global.localStorage.getItem('lorefy.activeUser.v1')||safeRead('lorefy.session.v1',{}).userId||safeRead('lorefy.identity.v1',{}).id||
      (new URLSearchParams(global.location.search).get('preview')==='demo'?'local-demo':null);
  }
  function openMissingRequests(query) {
    var api=global.LorefyCatalogRequests;if(!api)return;
    var en=doc.documentElement.lang==='en',owner=requestOwner(),stamp=accountStamp(),queue=api.create(global.localStorage,owner);
    openSheet(en?'Missing works':'الأعمال المفقودة',en?'Saved on this device. Not sent or published.':'محفوظة على هذا الجهاز؛ لم تُرسل أو تُنشر.',function(body){
      var form=el('form',{class:'lf-catalog-request-form',novalidate:''}),title=el('input',{required:'',maxlength:'180',value:typeof query==='string'?query:'',autocomplete:'off'}),
        type=el('select',{}),url=el('input',{required:'',type:'url',inputmode:'url',autocomplete:'off',dir:'ltr'}),note=el('textarea',{maxlength:'1000',rows:'3'}),status=el('p',{class:'lf-request-feedback',role:'status',tabindex:'-1',hidden:''});
      var typeLabels=['رواية','كتاب','كوميكس','مانجا','مانهوا','مانها','لايت نوفل','ويب نوفل'];
      api.types.forEach(function(value,index){type.appendChild(el('option',{value:value,text:en?value:typeLabels[index]}));});
      var fields=[['title',en?'Work title':'اسم العمل',title],['type',en?'Type':'النوع',type],['reference',en?'Reference link':'رابط مرجعي',url],['note',en?'Note (optional)':'ملاحظة (اختياري)',note]];
      fields.forEach(function(field){
        field[2].setAttribute('aria-label',field[1]);
        field[3]=el('span',{id:'lf-request-'+field[0]+'-error',class:'lf-request-error',role:'alert',hidden:''});
        field[2].addEventListener('input',function(){field[2].removeAttribute('aria-invalid');field[2].removeAttribute('aria-describedby');field[3].hidden=true;status.hidden=true;});
        form.appendChild(el('label',{},[el('span',{text:field[1]}),field[2],field[3]]));
      });
      function fail(error){
        var code=error&&error.message,field=fields.find(function(item){return item[0]===code;});
        if(field){
          field[3].textContent=code==='reference'?(en?'Enter a public web reference link.':'أدخل رابط ويب مرجعيًا عامًا.'):code==='title'?(en?'Enter a title with at least two characters.':'اكتب اسمًا من حرفين على الأقل.'):(en?'Choose a work type.':'اختر نوع العمل.');
          field[3].hidden=false;field[2].setAttribute('aria-invalid','true');field[2].setAttribute('aria-describedby',field[3].getAttribute('id'));field[2].focus();
        }else{
          status.setAttribute('role','alert');status.textContent=code==='limit'?(en?'Up to 100 drafts can be saved. Remove a draft before adding another.':'يمكن حفظ100 طلب. احذف طلبًا قبل إضافة طلب جديد.'):(en?'Could not save. Check device storage and try again.':'تعذر الحفظ. تحقق من مساحة الجهاز وحاول مجددًا.');status.hidden=false;status.focus();
        }
      }
      var save=button(en?'Save draft':'حفظ الطلب محليًا','lf-product-primary',function(){},'plus');save.type='submit';save.disabled=!owner;form.appendChild(save);form.appendChild(status);
      form.addEventListener('submit',function(event){event.preventDefault();if(!form.isConnected||stamp!==accountStamp()||owner!==requestOwner()){save.disabled=true;return;}
        fields.forEach(function(field){field[2].removeAttribute('aria-invalid');field[2].removeAttribute('aria-describedby');field[3].hidden=true;});status.hidden=true;
        try{queue.save({title:title.value,type:type.value,url:url.value,note:note.value});status.setAttribute('role','status');status.textContent=en?'Draft saved on this device.':'تم حفظ الطلب على هذا الجهاز.';status.hidden=false;render();}
        catch(error){fail(error);}
      });
      body.appendChild(form);var rows=el('section',{class:'lf-catalog-request-drafts'});body.appendChild(rows);
      function render(){
        rows.replaceChildren();rows.appendChild(el('h3',{text:en?'Saved drafts':'الطلبات المحفوظة'}));var drafts=queue.list();
        if(!drafts.length)rows.appendChild(el('div',{class:'lf-product-empty',text:en?'No saved drafts.':'لا توجد طلبات محفوظة.'}));
        drafts.forEach(function(item){
          var remove=button('','lf-product-icon-button lf-catalog-draft-remove',function(){
            if(!rows.isConnected||stamp!==accountStamp()||owner!==requestOwner())return;
            try{queue.remove(item.id);title.focus();render();}catch(_){status.setAttribute('role','alert');status.textContent=en?'Could not remove the draft. Try again.':'تعذر حذف الطلب. حاول مجددًا.';status.hidden=false;status.focus();}
          },'trash-2');
          remove.setAttribute('aria-label',(en?'Delete draft: ':'حذف الطلب: ')+item.title);remove.setAttribute('title',en?'Delete draft':'حذف الطلب');
          rows.appendChild(el('div',{class:'lf-product-list-row'},[
            el('div',{class:'lf-product-list-copy'},[el('strong',{text:item.title,dir:'auto','data-no-translate':''}),el('small',{text:(en?item.type:typeLabels[api.types.indexOf(item.type)]||item.type)+' · '+(en?'Local draft':'طلب محلي')})]),remove]));
        });refreshIcons(rows);
      }
      render();if(!owner){status.textContent=en?'Sign in to save a draft.':'سجّل الدخول لحفظ طلب.';status.hidden=false;}
      body.appendChild(button(en?'Export drafts':'تصدير الطلبات','lf-product-secondary',function(event){if(stamp!==accountStamp()||owner!==requestOwner())return;runExport(event,function(){return downloadFile('lorefy-missing-works.json',JSON.stringify(queue.list(),null,2),'application/json');},en?'Export ready':'الملف جاهز');},'download'));
    },'lf-trust-studio lf-request-studio');
  }

  function safetyUserRow(userId, kind) {
    var stamp = accountStamp();
    var actionText = kind === "blocked" ? uiText("إلغاء الحظر", "Unblock") : uiText("إلغاء الكتم", "Unmute");
    var feedback = el("p", { class: "lf-safety-feedback", role: "status", tabindex: "-1", hidden: "" });
    var remove = async function (event) {
      var control = event.currentTarget;
      if (control.disabled || !control.isConnected) return;
      if (stamp !== accountStamp()) { control.disabled = true; return; }
      var sheet = control.closest('.lf-product-sheet');
      if (doc.activeElement === control && sheet) sheet.querySelector('.lf-product-icon-button').focus({ preventScroll: true });
      control.disabled = true;
      control.setAttribute("aria-busy", "true");
      control.querySelector("span").textContent = uiText("جارٍ التحديث...", "Updating...");
      feedback.setAttribute("role", "status"); feedback.textContent = uiText("جارٍ التحديث...", "Updating..."); feedback.hidden = false;
      try {
        if (kind === "blocked") await core.safety.unblockUser(userId); else core.safety.unmuteUser(userId);
        if (stamp !== accountStamp() || !control.isConnected) return;
        openSafetyCenter();
        toast(doc.documentElement.lang === 'en' ? (kind === 'blocked' ? 'User unblocked' : 'User unmuted') : (kind === "blocked" ? "تم إلغاء الحظر" : "تم إلغاء الكتم"));
      } catch (_) {
        if (stamp === accountStamp() && control.isConnected) {
          feedback.setAttribute("role", "alert"); feedback.textContent = uiText("تعذر تأكيد التحديث. حاول مجددًا.", "Could not confirm the update. Try again."); feedback.hidden = false; feedback.focus();
        }
      } finally {
        if (stamp === accountStamp() && control.isConnected) {
          control.disabled = false; control.removeAttribute("aria-busy"); control.querySelector("span").textContent = actionText;
        }
      }
    };
    var action = button(actionText, "lf-product-secondary lf-safety-remove", remove);
    action.setAttribute("aria-label", (kind === "blocked" ? uiText("إلغاء حظر @", "Unblock @") : uiText("إلغاء كتم @", "Unmute @")) + userId);
    return el("div", { class: "lf-product-list-row" }, [
      el("div", { class: "lf-product-list-copy" }, [el("strong", { text: "@" + userId, dir: "ltr", "data-no-translate": "" }), el("small", { text: kind === "blocked" ? uiText("محظور", "Blocked") : uiText("مكتوم", "Muted") })]),
      action, feedback
    ]);
  }

  function reportLabel(reason) {
    return uiText(REPORT_LABELS[reason] || "بلاغ", { spam: "Spam or promotion", abuse: "Abuse or hate speech", harassment: "Harassment", spoiler: "Unmarked spoiler", misinformation: "Misleading information", copyright: "Copyright" }[reason] || "Report");
  }

  function reportStatus(status) {
    return uiText({ pending: "محفوظ على الجهاز", open: "قيد المراجعة", resolved: "تمت المعالجة", closed: "مغلق" }[status] || "الحالة غير متاحة",
      { pending: "Saved on device", open: "Awaiting review", resolved: "Resolved", closed: "Closed" }[status] || "Status unavailable");
  }

  function openSafetyCenter() {
    openSheet(uiText("السلامة والمحتوى", "Safety and content"), uiText("البلاغات والحسابات المخفية", "Reports and hidden accounts"), function (body) {
      var reports = core.safety.getReports();
      var reportSection = section(uiText("سجل البلاغات", "Report activity"), uiText("سجل البلاغات المحفوظ على هذا الجهاز. البلاغ لا يخفي المحتوى تلقائيًا.", "Report activity saved on this device. A report does not automatically hide content."));
      if (!reports.length) reportSection.appendChild(el("div", { class: "lf-product-empty", text: uiText("لا توجد بلاغات محفوظة.", "No saved reports.") }));
      reports.slice(0, 20).forEach(function (report) {
        reportSection.appendChild(el("div", { class: "lf-product-list-row" }, [
          el("div", { class: "lf-product-list-copy" }, [el("strong", { text: reportLabel(report.reason) }), el("small", { text: report.targetId, dir: "auto", "data-no-translate": "" })]),
          el("span", { class: "lf-product-status", text: reportStatus(report.status) })
        ]));
      });
      body.appendChild(reportSection);

      var blocked = section(uiText("الحسابات المحظورة", "Blocked accounts"), uiText("حسابات أخفيت محتواها من المجتمع بالحظر.", "Accounts whose community content you have blocked."));
      var blockedUsers = core.safety.getBlockedUsers();
      if (!blockedUsers.length) blocked.appendChild(el("div", { class: "lf-product-empty", text: uiText("لا توجد حسابات محظورة.", "No blocked accounts.") }));
      blockedUsers.forEach(function (user) { blocked.appendChild(safetyUserRow(user, "blocked")); });
      body.appendChild(blocked);

      var muted = section(uiText("الحسابات المكتومة", "Muted accounts"), uiText("محتواها مخفي من خلاصتك دون إشعارها.", "Their content is hidden from your feed without notifying them."));
      var mutedUsers = core.safety.getMutedUsers();
      if (!mutedUsers.length) muted.appendChild(el("div", { class: "lf-product-empty", text: uiText("لا توجد حسابات مكتومة.", "No muted accounts.") }));
      mutedUsers.forEach(function (user) { muted.appendChild(safetyUserRow(user, "muted")); });
      body.appendChild(muted);
    }, "lf-trust-studio lf-safety-studio");
  }

  function currentWork() {
    var params = new URLSearchParams(global.location.search || "");
    var id = params.get("novel") || params.get("work") || "";
    var works = Array.isArray(global.LorefyMangaData) ? global.LorefyMangaData : [];
    return works.find(function (work) { return String(work.id) === String(id); }) || { id: id, title: id };
  }

  function openCorrectionForm(work) {
    work = work || currentWork();
    var stamp = accountStamp();
    openSheet(uiText("تصحيح بيانات العمل", "Correct work details"), work.title || work.ar || work.id, function (body, close) {
      var form = el("form", { class: "lf-correction-form", novalidate: "" });
      form.appendChild(section(uiText("ما الذي يحتاج إلى تصحيح؟", "What needs correcting?"), uiText("احفظ وصفًا ومصدرًا أو قيمة بديلة. يُحفظ التصحيح على هذا الجهاز فقط.", "Save a description and an optional source or replacement value. The correction stays on this device.")));
      var issue = el("select", { id: "lf-correction-issue" });
      Object.keys(ISSUE_LABELS).forEach(function (value) { issue.appendChild(el("option", { value: value, text: issueLabel(value) })); });
      var note = el("textarea", { id: "lf-correction-note", maxlength: "1000", rows: "4" });
      var proposed = el("input", { id: "lf-correction-proposed", type: "text", dir: "auto", maxlength: "1000" });
      var status = el("p", { class: "lf-correction-feedback", id: "lf-correction-feedback", role: "alert", tabindex: "-1", hidden: "" });
      form.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { for: "lf-correction-issue", text: uiText("نوع المشكلة", "Issue type") }), issue]));
      form.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { for: "lf-correction-note", text: uiText("التفاصيل", "Details") }), note]));
      form.appendChild(status);
      form.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { for: "lf-correction-proposed", text: uiText("المصدر أو البديل (اختياري)", "Source or replacement (optional)") }), proposed]));
      var save = button(uiText("حفظ التصحيح", "Save correction"), "lf-product-primary", function () {});
      save.type = "submit";
      form.appendChild(save);
      note.addEventListener("input", function () {
        note.removeAttribute("aria-invalid"); note.removeAttribute("aria-describedby"); status.hidden = true;
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (save.disabled || !form.isConnected || stamp !== accountStamp()) return;
        if (!String(note.value || "").trim()) {
          status.textContent = uiText("اكتب وصفًا للمشكلة قبل الحفظ.", "Describe the issue before saving."); status.hidden = false;
          note.setAttribute("aria-invalid", "true"); note.setAttribute("aria-describedby", "lf-correction-feedback"); note.focus(); return;
        }
        try {
          core.corrections.submit({ workId: work.id, issue: issue.value, note: note.value, proposedValue: proposed.value });
          close(); toast(uiText("حُفظ التصحيح على هذا الجهاز", "Correction saved on this device"));
        } catch (_) {
          status.textContent = uiText("تعذر الحفظ. تحقق من مساحة الجهاز وحاول مجددًا.", "Could not save. Check device storage and try again."); status.hidden = false; status.focus();
        }
      });
      body.appendChild(form);
    }, "lf-trust-studio lf-corrections-studio");
  }

  function hashText(text) {
    var hash = 2166136261;
    for (var index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function reviewContext(card) {
    var text = String(card.textContent || "").replace(/\s+/g, " ").trim();
    var handle = (text.match(/@([\w.-]+)/) || [])[1] || "reader-" + hashText(text.slice(0, 120));
    var liveReviewId = String(card.dataset.reviewId || "").trim();
    var liveUserId = String(card.dataset.userId || "").trim();
    return {
      userId: liveUserId || handle,
      targetId: liveReviewId || "review-" + hashText(text),
      targetType: "review",
      live: Boolean(liveReviewId || liveUserId),
      own: Boolean(liveUserId && (liveUserId === 'me' || liveUserId === String(global.LorefyBackend && global.LorefyBackend.user && global.LorefyBackend.user.id || ''))),
      card: card
    };
  }

  function hideCardsFor(userId) {
    doc.querySelectorAll(".lf-review-card,.lf-review-detail").forEach(function (card) {
      if (reviewContext(card).userId === userId) card.style.display = "none";
    });
    global.dispatchEvent(new global.CustomEvent('lorefy:reader-safety-changed'));
  }

  function openReviewSafety(context) {
    if (!context || context.own) return;
    var stamp = accountStamp(), backend = global.LorefyBackend;
    var generation = backend && backend._pullGeneration, mode = backend && backend.mode, client = backend && backend.client, pending = false, overlay;
    var remote = !!(backend && mode === 'live' && typeof backend.submitReport === 'function');
    function current() {
      return overlay && overlay.isConnected && !overlay.__closed && stamp === accountStamp() && global.LorefyBackend === backend &&
        (!backend || backend.mode === mode && backend._pullGeneration === generation && backend.client === client) && (!context.card || context.card.isConnected);
    }
    overlay = openSheet(uiText("خيارات المراجعة", "Review options"), uiText("الإبلاغ والتحكم بالمحتوى", "Reporting and content controls"), function (body, close) {
      var report = section(remote ? uiText("إرسال بلاغ", "Report this review") : uiText("بلاغ على هذا الجهاز", "Report on this device"),
        remote ? uiText("اختر السبب وأضف التفاصيل إن أردت. البلاغ لا يخفي المحتوى تلقائيًا.", "Choose a reason and optional details. Reporting does not automatically hide content.") :
          uiText("سيُحفظ البلاغ على هذا الجهاز فقط؛ لن يُرسل إلى الخادم في هذا الوضع.", "The report will be saved on this device only. It will not be sent to the server in this mode."));
      var form = el("form", { class: "lf-report-form" });
      var reason = el("select", { id: "lf-report-reason" });
      Object.keys(REPORT_LABELS).forEach(function (value) { reason.appendChild(el("option", { value: value, text: reportLabel(value) })); });
      var note = el("textarea", { id: "lf-report-note", maxlength: "800", rows: "4" });
      form.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { for: "lf-report-reason", text: uiText("سبب البلاغ", "Report reason") }), reason]));
      form.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { for: "lf-report-note", text: uiText("تفاصيل إضافية (اختياري)", "Additional details (optional)") }), note]));
      var send = button(remote ? uiText("إرسال البلاغ", "Send report") : uiText("حفظ البلاغ على الجهاز", "Save report on device"), "lf-product-primary", function () {});
      send.type = "submit"; form.appendChild(send); report.appendChild(form); body.appendChild(report);
      var feedback = el("p", { class: "lf-report-feedback", id: "lf-report-feedback", role: "status", tabindex: "-1", hidden: "" });
      body.appendChild(feedback);
      form.setAttribute("aria-describedby", "lf-report-feedback");
      var controls = section(uiText("التحكم بما تراه", "Content controls"), uiText("الكتم والحظر إجراءان منفصلان عن البلاغ، ويخفيان محتوى القارئ من خلاصتك.", "Mute and block are separate from reporting. Both hide this reader's content from your feed."));
      var actions = el("div", { class: "lf-product-inline-actions" });
      var mute = button(uiText("كتم القارئ", "Mute reader"), "lf-product-secondary lf-report-mute", function () { return run("mute", function () { return core.safety.muteUser(context.userId); }); });
      var block = button(uiText("حظر القارئ", "Block reader"), "lf-product-danger lf-report-block", function () { return run("block", function () { return core.safety.blockUser(context.userId); }); });
      actions.appendChild(mute); actions.appendChild(block); controls.appendChild(actions); body.appendChild(controls);
      var inputs = [reason, note, send, mute, block];
      async function run(kind, operation) {
        if (pending || !current()) return;
        pending = true;
        overlay.querySelector('.lf-product-icon-button').focus({ preventScroll: true });
        inputs.forEach(function (control) { control.disabled = true; });
        form.setAttribute("aria-busy", "true");
        feedback.setAttribute("role", "status"); feedback.textContent = uiText("جارٍ تنفيذ الإجراء...", "Working..."); feedback.hidden = false;
        try {
          var result = await operation();
          if (!current()) return;
          if (kind !== "report") hideCardsFor(context.userId);
          close();
          toast(kind === "report" ? (remote && result && result.id && result.status !== "pending" ? uiText("تم إرسال البلاغ للمراجعة", "Report sent for review") : uiText("حُفظ البلاغ على هذا الجهاز", "Report saved on this device")) :
            kind === "mute" ? uiText("تم كتم القارئ", "Reader muted") : uiText("تم حظر القارئ", "Reader blocked"));
        } catch (_) {
          if (!current()) return;
          feedback.setAttribute("role", "alert"); feedback.textContent = uiText("تعذر تأكيد الإجراء. احتفظنا بالتفاصيل؛ حاول مجددًا.", "Could not confirm the action. Your details are kept; try again."); feedback.hidden = false; feedback.focus();
        } finally {
          if (current()) {
            pending = false; inputs.forEach(function (control) { control.disabled = false; }); form.removeAttribute("aria-busy");
          }
        }
      }
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        return run("report", function () { return core.safety.report({ targetId: context.targetId, targetType: context.targetType, reason: reason.value, note: note.value }); });
      });
    }, "lf-trust-studio lf-report-studio");
  }

  function profileAction(iconName, title, subtitle, handler) {
    return el("button", { class: "lf-product-action", type: "button", onclick: handler }, [
      el("span", { class: "lf-product-action-icon" }, icon(iconName, 17)),
      el("span", { class: "lf-product-action-copy" }, [el("strong", { text: title }), el("small", { text: subtitle })]),
      el("span", { class: "lf-product-chevron", "aria-hidden": "true", text: doc.documentElement.lang === "en" ? "›" : "‹" })
    ]);
  }

  function enhanceSettings() {
    doc.querySelectorAll(".lf-product-hub").forEach(function (oldHub) { oldHub.remove(); });
    var sheets = Array.prototype.slice.call(doc.querySelectorAll(".nc-sheet"));
    var settings = sheets.find(function (sheet) { return /الإعدادات|Settings/i.test(String(sheet.textContent || "")); });
    if (!settings || settings.querySelector(".lf-product-settings")) return;
    var content = settings.querySelector(":scope > div:last-child") || settings;
    var hub = el("section", { class: "lf-product-settings", "aria-label": "الخصوصية والسلامة" });
    hub.appendChild(el("header", { class: "lf-product-hub-head" }, [
      el("h2", { class: "lf-product-hub-title", text: "الخصوصية والسلامة" }),
      el("p", { class: "lf-product-hub-subtitle", text: "تحكم ببياناتك وتصحيحاتك والمحتوى الذي يظهر لك." })
    ]));
    hub.appendChild(profileAction(ICONS.data, "البيانات وخصوصية القوائم", "تصدير بياناتك وتحديد من يرى قوائمك", openDataCenter));
    hub.appendChild(profileAction(ICONS.correction, "مركز التصحيحات", "تابع أخطاء الأغلفة والشخصيات والبيانات", openCorrectionsCenter));
    hub.appendChild(profileAction(ICONS.safety, "السلامة والمحتوى", "البلاغات والحسابات المحظورة والمكتومة", openSafetyCenter));
    content.appendChild(hub);
    refreshIcons(hub);
  }

  function applyRecommendation(work, value, toolbar) {
    core.recommendations.setFeedback(work.id, value);
    work.rec = value === "more_like_this";
    toolbar.querySelectorAll("[data-feedback]").forEach(function (item) {
      item.classList.toggle("is-active", item.dataset.feedback === value);
    });
    try { if (typeof global.__lorefyRefresh === "function") global.__lorefyRefresh(); } catch (error) {}
    toast(value === "more_like_this" ? "سنقرب اقتراحات مشابهة" : "لن نعطي هذا العمل أولوية في اقتراحاتك");
  }

  function enhanceAuthor(work, toolbar) {
    var author = work.auth || work.au || work.author;
    if (author && !toolbar.querySelector('.lf-product-author-link') && factory.authorWorks([work],author).length) {
      toolbar.appendChild(button(String(author),'lf-product-author-link',function () { openAuthor(author); },'library-big'));
      refreshIcons(toolbar);
    }
  }
  function enhanceDetail() {
    var detail = doc.querySelector(".lf-detail-page");
    var content = detail && detail.querySelector(".lf-detail-content");
    if (!content) return;
    var work = currentWork();
    if (!work || !work.id) return;
    var existing = content.querySelector('.lf-product-detail-tools');
    if (existing) { enhanceAuthor(work,existing); return; }
    var toolbar = el("section", { class: "lf-product-detail-tools", "aria-label": "بيانات العمل والاقتراحات" });
    toolbar.appendChild(el("h3", { class: "lf-product-detail-tools-title", text: "بيانات العمل والاقتراحات" }));
    var segment = el("div", { class: "lf-product-segment" });
    var correction = button("تصحيح البيانات", "", function () { openCorrectionForm(work); });
    var more = button("المزيد مثل هذا", "", function () { applyRecommendation(work, "more_like_this", toolbar); });
    var less = button("غير مهتم", "", function () { applyRecommendation(work, "not_interested", toolbar); });
    more.dataset.feedback = "more_like_this";
    less.dataset.feedback = "not_interested";
    var feedback = core.recommendations.getFeedback()[String(work.id)];
    if (feedback && feedback.value === "more_like_this") more.classList.add("is-active");
    if (feedback && feedback.value === "not_interested") less.classList.add("is-active");
    segment.appendChild(correction); segment.appendChild(more); segment.appendChild(less);
    toolbar.appendChild(segment);
    var credits=(work.catalogAttributions||[]).concat(work.sourceUrl?[{source:work.source||work._apiSource,url:work.sourceUrl,license:work.sourceLicense}]:[]),seenCredits=new Set();
    credits.forEach(function(credit){if(!credit||seenCredits.has(credit.url)||!/^https:\/\/(?:www\.)?(?:comics\.org|bookbrainz\.org|wikidata\.org|openlibrary\.org|books\.google\.[a-z.]+)\//i.test(credit.url))return;
      seenCredits.add(credit.url);toolbar.appendChild(el('a',{href:credit.url,target:'_blank',rel:'noopener noreferrer',class:'lf-catalog-attribution',text:String(credit.source||'Source')+(credit.license?' · '+credit.license:'')}));
    });
    enhanceAuthor(work,toolbar);
    content.appendChild(toolbar);
  }

  var authorRefresh = null;
  function openAuthor(author) {
    var en = doc.documentElement.lang === 'en';
    openSheet(String(author),en ? 'Works in the catalog' : 'الأعمال المتاحة في المكتبة',function (body) {
      var works = factory.authorWorks(global.LorefyMangaData || [],author,global.LorefyCatalogIdentity,global.LorefyCatalogAliases);
      var count = el('p',{class:'lf-author-count',text:works.length + (en ? ' works' : ' عمل')}); body.appendChild(count);
      var grid = el('div',{class:'lf-author-grid'}); body.appendChild(grid);
      var shown = 0;
      var more = button(en ? 'Load more' : 'عرض المزيد','lf-product-author-more',append,'chevron-down');
      body.appendChild(more);
      function append() {
        works.slice(shown,shown+24).forEach(function (item) {
          var query = new URLSearchParams(global.location.search);
          query.set('route','detail'); query.set('novel',String(item.id)); query.delete('search');
          var title = item.title || item.en || item.ar || String(item.id);
          var link = el('a',{class:'lf-author-work',href:global.location.pathname + '?' + query.toString(),'aria-label':title});
          var cover = global.LorefyCoverAPI && global.LorefyCoverAPI.primary ? global.LorefyCoverAPI.primary(item) : item.cover;
          if (cover) link.appendChild(el('img',{src:cover,alt:'',loading:'lazy',decoding:'async',onerror:function (event) { event.target.hidden=true; }}));
          link.appendChild(el('strong',{text:title,dir:'auto','data-no-translate':''}));
          link.appendChild(el('small',{text:[item.type,item.yr || item.year].filter(Boolean).join(' · ')}));
          grid.appendChild(link);
        });
        shown += 24; more.hidden = shown >= works.length; refreshIcons(body);
      }
      append();
      authorRefresh = function () {
        if (!body.isConnected) { authorRefresh = null; return; }
        var updated = factory.authorWorks(global.LorefyMangaData || [],author,global.LorefyCatalogIdentity,global.LorefyCatalogAliases);
        if (updated.length === works.length && updated.every(function (work,index) { return work.id === works[index].id; })) return;
        works = updated; shown = 0; grid.replaceChildren();
        count.textContent = works.length + (en ? ' works' : ' عمل'); append();
      };
      var status = el('p',{class:'lf-author-status',role:'status',text:en ? 'Finding this author’s works…' : 'جارٍ البحث عن أعمال الكاتب…'}); body.appendChild(status);
      var loader=global.LorefyCatalogLoader;
      var request=loader && loader.loadAuthor ? loader.loadAuthor(author,function(){ return body.isConnected; }) : Promise.resolve();
      request.then(function(){
        if (!body.isConnected) return;
        if (authorRefresh) authorRefresh();
        status.textContent=works.length ? '' : en ? 'No attributed works available yet.' : 'لا توجد أعمال موثقة لهذا المؤلف بعد.';
      }).catch(function(){ if (body.isConnected) status.textContent=en ? 'Some works could not be loaded. Reopen to retry.' : 'تعذر تحميل بعض الأعمال. أعد فتح الكاتب للمحاولة.'; });
    });
  }

  function enhanceReviews() {
    var hidden = new Set(core.safety.getBlockedUsers().concat(core.safety.getMutedUsers()).map(String));
    doc.querySelectorAll(".lf-review-card,.lf-review-detail").forEach(function (card) {
      var context = reviewContext(card);
      if (context.own) return;
      if (hidden.has(context.userId)) { card.style.display = "none"; return; }
      if (card.querySelector(":scope > .lf-product-review-menu")) return;
      var menu = el("button", { class: "lf-product-review-menu", type: "button", "aria-label": uiText("خيارات المراجعة", "Review options"), onclick: function (event) {
        event.preventDefault(); event.stopPropagation(); openReviewSafety(context);
      } }, icon(ICONS.more, 18));
      card.insertBefore(menu, card.firstChild);
      refreshIcons(menu);
    });
  }

  function applyStoredRecommendations() {
    var feedback = core.recommendations.getFeedback();
    (global.LorefyMangaData || []).forEach(function (work) {
      var item = feedback[String(work.id)];
      if (item) work.rec = item.value === "more_like_this";
    });
  }

  function enhance() {
    pendingEnhance = false;
    enhanceSettings();
    enhanceDetail();
    enhanceReviews();
  }

  function scheduleEnhance() {
    if (pendingEnhance) return;
    pendingEnhance = true;
    global.requestAnimationFrame(enhance);
  }

  applyStoredRecommendations();
  var observer = new MutationObserver(scheduleEnhance);
  (doc.readyState === "loading" ? doc.addEventListener.bind(doc, "DOMContentLoaded") : function (fn) { fn(); })(function () {
    observer.observe(host(), { childList: true, subtree: true });
    scheduleEnhance();
  });
  global.addEventListener("lorefy:routechange", scheduleEnhance);
  global.addEventListener("lorefy:catalog-progress", function () { applyStoredRecommendations(); scheduleEnhance(); if(authorRefresh) authorRefresh(); });
  global.addEventListener("lorefy:catalog-ingested", function () { scheduleEnhance(); if(authorRefresh) authorRefresh(); });

  global.LorefyProductTools = {
    core: core,
    openAuthor: openAuthor,
    openDataCenter: openDataCenter,
    openCorrectionsCenter: openCorrectionsCenter,
    openMissingRequests: openMissingRequests,
    openSafetyCenter: openSafetyCenter,
    openCorrectionForm: openCorrectionForm,
    enhance: enhance
  };
})(window);

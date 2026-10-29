(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LorefyLibraryView = api;
})(typeof window !== 'undefined' ? window : this, function (root) {
  'use strict';

  var KEY = 'lorefy.library.view.v1';
  var activeMode = null;

  function normalizeMode(value) {
    return value === 'spines' || value === 'shelf' || value === 'showcase' ? value : 'grid';
  }

  function options(language) {
    var english = language === 'en';
    return [
      { mode:'grid', icon:'layout-grid', label:english ? 'Covers' : 'أغلفة' },
      { mode:'spines', icon:'library-big', label:english ? 'Bookshelf' : 'رف الكتب' },
      { mode:'showcase', icon:'gallery-horizontal-end', label:english ? 'Showcase' : 'عرض بارز' },
      { mode:'shelf', icon:'list', label:english ? 'List' : 'قائمة' }
    ];
  }

  function spineHeight(title) {
    var hash = 0;
    for (var i = 0; i < String(title || '').length; i++) hash = (hash * 31 + String(title).charCodeAt(i)) >>> 0;
    return 172 + hash % 4 * 8;
  }

  function profileSpineHeight(title) {
    return [176, 208, 188, 220][(spineHeight(title) - 172) / 8];
  }

  function favoriteLimit(mode) {
    return mode === 'showcase' ? 3 : mode === 'spines' ? 7 : 4;
  }

  function setMode(value, storage) {
    var mode = normalizeMode(value);
    try { (storage || root.localStorage).setItem(KEY, mode); } catch (error) { return false; }
    activeMode = mode;
    if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('lorefy:library-view-change', { detail:{mode:mode} }));
    return true;
  }

  function applyMode(grid, buttons, mode) {
    mode = normalizeMode(mode);
    grid.classList.toggle('is-shelf-view', mode === 'shelf');
    grid.classList.toggle('is-spine-view', mode === 'spines');
    grid.classList.toggle('is-showcase-view', mode === 'showcase');
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.view === mode));
    });
  }

  function savedMode(storage) {
    try { return normalizeMode(storage.getItem(KEY)); } catch (error) { return 'grid'; }
  }

  function progressLabel(isComplete, label) {
    return isComplete && label === 'لم تحفظ مكان توقفك بعد' ? 'مكتمل' : label;
  }

  function showcasePlacement(index) {
    index=Math.max(0,Math.floor(Number(index)||0));
    return {row:Math.floor(index/3)+1,position:['center','left','right'][index%3]};
  }

  // Add presentation metadata without reordering React-owned cards or their actions.
  function syncShowcaseCards(doc, container, cards, active) {
    cards=Array.from(cards);
    container.classList.toggle('is-showcase-view',!!active);
    container.classList.toggle('is-showcase-empty',!!active&&cards.length>0&&!cards.some(function(card){return !!(card.querySelector('[data-lorefy-book-cover]')||card.querySelector('img'));}));
    if(!active)return;
    var visible=0;
    cards.forEach(function(card,index) {
      var image=card.querySelector('img'),managed=card.querySelector('[data-lorefy-book-cover]'),present=managed||image;
      card.classList.toggle('lf-showcase-empty',!present);
      card.classList.toggle('lf-showcase-book',!!present);
      if(!present)return;
      var titleNode=card.querySelector('.lf-library-copy strong')||card.querySelector('.lf-reader-library-copy strong');
      var title=card.getAttribute('data-work-title')||(titleNode&&titleNode.textContent)||(image&&image.alt)||card.title||'';
      // The managed image may be absent or nested in lf-cover-surface; size the book, not that inner surface.
      var placement=showcasePlacement(visible++),cover=managed||(image.parentElement===card?image:image.parentElement);
      cover.classList.toggle('lf-showcase-cover',true);
      card.setAttribute('data-showcase-position',placement.position);
      card.style.setProperty('--showcase-row',String(placement.row));
      var caption=card.querySelector('.lf-showcase-caption');
      if(!caption) {
        caption=doc.createElement('span');caption.className='lf-showcase-caption';
        caption.setAttribute('data-no-translate','1');
        var rank=doc.createElement('span');rank.className='lf-showcase-rank';rank.setAttribute('aria-hidden','true');
        var label=doc.createElement('span');label.className='lf-showcase-title';label.setAttribute('dir','auto');
        caption.appendChild(rank);caption.appendChild(label);card.appendChild(caption);
      }
      if(caption.children[0].textContent!==String(index+1))caption.children[0].textContent=String(index+1);
      if(caption.children[1].textContent!==title)caption.children[1].textContent=title;
      if(caption.children[1].title!==title)caption.children[1].title=title;
    });
  }

  function syncProfileFavorites(doc, mode) {
    doc.querySelectorAll('.lf-profile-page > .lf-profile-favorites:not(.lf-profile-top-characters-grid)').forEach(function (favorites) {
      Array.from(favorites.children).forEach(function(slot,index) {
        slot.classList.toggle('lf-favorite-overflow',index>=favoriteLimit(mode));
      });
      var hasBooks=!!(favorites.querySelector('[data-lorefy-book-cover]')||favorites.querySelector('img'));
      favorites.classList.toggle('is-spine-view', normalizeMode(mode) === 'spines' && hasBooks);
      syncShowcaseCards(doc,favorites,Array.from(favorites.children),normalizeMode(mode)==='showcase'&&hasBooks);
      Array.from(favorites.children).forEach(function (slot) {
        var image = slot.querySelector('img');
        var managed = slot.querySelector('[data-lorefy-book-cover]');
        slot.classList.toggle('is-empty-spine', !managed && !image);
        if (!managed && !image) return;
        var title = slot.getAttribute('data-work-title') || (image && image.alt) || '';
        var cover = managed || image.parentElement;
        cover.classList.toggle('lf-profile-spine-cover', true);
        var label = cover.querySelector('.lf-profile-spine-title');
        if (!label) {
          label = doc.createElement('span');
          label.className = 'lf-profile-spine-title';
          label.setAttribute('aria-hidden', 'true');
          label.setAttribute('data-no-translate', '1');
          label.setAttribute('dir', 'auto');
          cover.appendChild(label);
        }
        if (label.textContent !== title) {
          label.textContent = title;
          slot.style.setProperty('--spine-height', profileSpineHeight(title) + 'px');
          slot.title = title;
        }
      });
    });
  }

  function mount(doc, storage) {
    syncProfileFavorites(doc, activeMode || savedMode(storage));
    doc.querySelectorAll('.lf-reader-shelf-rail.is-showcase-view, .lf-reader-library-grid.is-showcase-view').forEach(function(container) {
      syncShowcaseCards(doc,container,Array.from(container.children),true);
    });
    var page = doc.querySelector('.lf-library-page');
    if (!page) return;
    var header = page.querySelector('.lf-library-header');
    var grid = page.querySelector('.lf-library-grid');
    if (!header || !grid) return;
    grid.querySelectorAll('.lf-library-card').forEach(function (card) {
      var title = card.querySelector('.lf-library-copy strong');
      var cover = card.querySelector('.lf-library-cover');
      if (title && cover) {
        var spine = cover.querySelector('.lf-library-spine-title');
        if (!spine) {
          spine = doc.createElement('span');
          spine.className = 'lf-library-spine-title';
          spine.setAttribute('aria-hidden', 'true');
          spine.setAttribute('dir', 'auto');
          cover.appendChild(spine);
        }
        if (spine.textContent !== title.textContent) {
          spine.textContent = title.textContent;
          card.style.setProperty('--spine-height', spineHeight(title.textContent) + 'px');
          card.title = title.textContent;
        }
      }
      var label = card.querySelector('.lf-library-copy span');
      if (!label) return;
      var next = progressLabel(!!card.querySelector('.lf-library-done'), label.textContent);
      if (next !== label.textContent) label.textContent = next;
    });

    var switcher = header.querySelector('.lf-library-view-switch');
    if (!switcher) {
      switcher = doc.createElement('div');
      switcher.className = 'lf-library-view-switch';
      switcher.setAttribute('role', 'group');
      switcher.setAttribute('data-no-translate', '1');
      options(doc.documentElement.lang).forEach(function (option) {
        var button = doc.createElement('button');
        button.type = 'button';
        button.dataset.view = option.mode;
        var icon = doc.createElement('i');
        icon.setAttribute('data-lucide', option.icon);
        icon.setAttribute('aria-hidden', 'true');
        button.appendChild(icon);
        var label = doc.createElement('span');
        label.textContent = option.label;
        button.appendChild(label);
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          if (setMode(option.mode, storage)) mount(doc, storage);
        });
        switcher.appendChild(button);
      });
      header.insertBefore(switcher, header.querySelector('.lf-library-search') || header.querySelector('.lf-library-tabs'));
      try { if (root.lucide && root.lucide.createIcons) root.lucide.createIcons({ nodes: [switcher] }); } catch (error) {}
    }
    var english = doc.documentElement.lang === 'en';
    switcher.setAttribute('aria-label', english ? 'Library layout' : 'طريقة عرض المكتبة');
    options(doc.documentElement.lang).forEach(function (option) {
      var button = switcher.querySelector('[data-view="' + option.mode + '"]');
      if (!button) return;
      var label = (english ? 'View: ' : 'عرض: ') + option.label;
      button.setAttribute('aria-label', label); button.title = label;
      var text = button.querySelector('span');
      if (text && text.textContent !== option.label) text.textContent = option.label;
    });
    applyMode(grid, Array.from(switcher.querySelectorAll('button')), activeMode || savedMode(storage));
    syncShowcaseCards(doc,grid,Array.from(grid.querySelectorAll('.lf-library-card')),normalizeMode(activeMode||savedMode(storage))==='showcase');
  }

  if (root.document) {
    var doc = root.document;
    var start = function () {
      var scheduled = false;
      mount(doc, root.localStorage);
      root.addEventListener('lorefy:library-view-change', function () { mount(doc, root.localStorage); });
      root.addEventListener('storage', function (event) {
        if (event.key !== KEY) return;
        activeMode = null; mount(doc, root.localStorage);
      });
      var observer = new root.MutationObserver(function (records) {
        var changed = records.some(function (record) {
          if (record.type === 'childList') return true;
          if (record.type === 'attributes') return record.attributeName === 'data-work-title';
          var parent = record.target && record.target.parentElement;
          return record.type === 'characterData' && parent && parent.closest('.lf-library-copy strong, .lf-reader-library-copy strong');
        });
        if (!changed) return;
        if (scheduled) return;
        scheduled = true;
        root.requestAnimationFrame(function () {
          scheduled = false;
          mount(doc, root.localStorage);
        });
      });
      observer.observe(doc.getElementById('root') || doc.body, { childList: true, subtree: true,
        attributes: true, attributeFilter: ['data-work-title'], characterData: true });
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }

  return Object.freeze({ normalizeMode: normalizeMode, applyMode: applyMode, progressLabel: progressLabel, mount: mount, savedMode:savedMode, setMode:setMode, options:options, spineHeight:spineHeight, profileSpineHeight:profileSpineHeight, favoriteLimit:favoriteLimit, syncProfileFavorites:syncProfileFavorites, showcasePlacement:showcasePlacement, syncShowcaseCards:syncShowcaseCards });
});

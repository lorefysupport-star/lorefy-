/* The visitor profile owns its remote snapshot; it never reads the viewer's saved library. */
(function (root) {
  'use strict';
  const React = root.React, h = React.createElement;
  const icon = (name, size = 20) => root.NenIcons[name] ? h(root.NenIcons[name], { size, 'aria-hidden':true }) : null;
  const safeImage = value => /^(https?:|data:image\/)/i.test(String(value || '')) ? value : '';
  const socialUrl = (kind, value) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    const bases = { instagram:'https://instagram.com/', tiktok:'https://tiktok.com/@', twitter:'https://x.com/', youtube:'https://youtube.com/@', telegram:'https://t.me/' };
    return bases[kind] ? bases[kind] + encodeURIComponent(String(value).replace(/^@/, '')) : '';
  };
  const reviewRow = row => {
    const author = row.profile || {}, reactions = row.reactions || {}, mine = reactions.mine || {};
    return { id:row.id, userId:row.user_id, user:author.name || author.username, un:author.username,
      av:author.avatar, mid:row.work_id, r:row.rating == null ? null : Number(row.rating) || 0, txt:row.body || '',
      rec:row.recommend === true, recVal:row.recommend === true ? 'yes' : row.recommend === false ? 'no' : null,
      imgs:row.images || [], ts:Date.parse(row.created_at), likes:Number(reactions.heart) || 0,
      likeCount:Number(reactions.like) || 0, myHeart:mine.heart === true, myLike:mine.like === true,
      dislikeCount:Number(reactions.dislike) || 0, myDislike:mine.dislike === true,
      comments:(row.comments || []).length, spoiler:!!row.spoiler, is_public:row.is_public };
  };

  root.LorefyPublicProfile = function PublicProfile(props) {
    const initial = props.profile || {};
    const [snapshot, setSnapshot] = React.useState(initial);
    const [reviews, setReviews] = React.useState(props.reviews || []);
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [connections, setConnections] = React.useState(null);
    const [libraryOpen, setLibraryOpen] = React.useState(false);
    const [attempt, setAttempt] = React.useState(0);
    const [request, setRequest] = React.useState({ id:null, attempt:0, status:'loading' });
    const profile = snapshot.id === initial.id ? snapshot : initial;
    const backend = root.LorefyBackend;
    const preview = root.LorefyPreviewReaders && root.LorefyPreviewReaders.isActive();
    const remote = !!backend && (backend.mode === 'live' || !!preview);
    const currentRequest = request.id === initial.id && request.attempt === attempt;
    const loading = remote && (!currentRequest || request.status === 'loading');
    const ready = !remote || currentRequest && request.status === 'ready';
    const loadingLabel = root.document?.documentElement?.lang === 'en' ? 'Loading...' : 'جارٍ التحميل...';
    React.useEffect(() => {
      if (!root.document) return;
      const page = root.document.querySelector('.lf-reader-full');
      if (!page) return;
      page.__lorefyProfileSnapshot = profile;
      root.dispatchEvent(new root.CustomEvent('lorefy:profile-snapshot', {detail:{profile}}));
    }, [profile]);

    React.useEffect(() => {
      let active = true;
      setSnapshot(initial); setReviews(props.reviews || []); setConnections(null); setLibraryOpen(false); setError('');
      if (!remote) return;
      setRequest({ id:initial.id, attempt, status:'loading' });
      backend.getPublicProfile(initial.id).then(value => {
        if (!active) return;
        if (!value || value.id !== initial.id) {
          setSnapshot({ id:initial.id }); setError('هذا الحساب غير متاح.');
          setRequest({ id:initial.id, attempt, status:'failed' }); return;
        }
        setSnapshot(value);
        setRequest({ id:initial.id, attempt, status:'ready' });
      }).catch(() => {
        if (!active) return;
        setError('تعذر تحميل الحساب. حاول مجدداً.');
        setRequest({ id:initial.id, attempt, status:'failed' });
      });
      const collection = preview ? Promise.resolve((props.reviews || []).filter(row => row.userId === initial.id)) : null;
      if (preview) collection.then(rows => { if (active) setReviews(rows); });
      else backend.listReviewCollection({ userId:initial.id }).then(rows => {
        if (!active) return;
        setReviews(rows.map(reviewRow));
      }).catch(() => { if (active) setError('تعذر تحميل بعض معلومات الحساب. حاول مجدداً.'); });
      return () => { active = false; };
    }, [initial.id, attempt, remote]);

    React.useEffect(() => {
      if (!remote || !root.LorefyPageRefresh) return;
      let mounted = true;
      const owner = backend.user && backend.user.id;
      const stop = root.LorefyPageRefresh.register('profile-visitor', async context => {
        const current = () => mounted && ready && context.active() && backend === root.LorefyBackend
          && owner === (backend.user && backend.user.id);
        if (!current()) return false;
        const [value, rows] = await Promise.all([backend.getPublicProfile(initial.id),
          preview ? Promise.resolve(props.reviews || []) : backend.listReviewCollection({userId:initial.id})]);
        if (!current()) return false;
        if (!value || value.id !== initial.id) throw new Error('Profile unavailable');
        setSnapshot(value); setReviews(preview ? rows : rows.map(reviewRow)); setError('');
        return true;
      });
      return () => { mounted = false; stop(); };
    }, [initial.id, remote, ready]);

    const username = profile.username || profile.un || '';
    const avatar = safeImage(profile.avatar || profile.av);
    const banner = safeImage(profile.banner);
    const appearance = root.LorefyPublicAppearance ? root.LorefyPublicAppearance.normalize(profile) : {library_view:'grid',banner_position:50};
    const ownerStyle = root.LorefyPublicAppearance ? root.LorefyPublicAppearance.style(profile) : {};
    const spine = appearance.library_view === 'spines';
    const showcase = appearance.library_view === 'showcase';
    React.useEffect(() => {
      if (!root.document) return;
      const page=root.document.querySelector('.lf-reader-full');
      if(page)page.scrollTop=0;
    },[profile.id]);
    React.useEffect(() => {
      if (!root.document) return;
      // The shared navigation is outside the profile DOM; theme it only while visiting.
      const nav=root.document.querySelector('.lf-bottom-nav');
      if(!nav)return;
      const previous={};
      Object.entries(ownerStyle).forEach(([key,value])=>{previous[key]=nav.style.getPropertyValue(key);nav.style.setProperty(key,value);});
      return ()=>Object.entries(previous).forEach(([key,value])=>value?nav.style.setProperty(key,value):nav.style.removeProperty(key));
    },[profile.id,profile.theme]);
    const ownReviews = reviews.filter(review => review.userId === profile.id);
    const favoriteLimit = root.LorefyLibraryView?.favoriteLimit(appearance.library_view) ?? (showcase ? 3 : spine ? 7 : 4);
    const works = (profile.favorite_work_ids || []).slice(0, favoriteLimit).map(props.workById).filter(Boolean);
    const characters = (profile.favorite_character_ids || []).filter(Boolean).slice(0, 4);
    const library = Object.keys(profile.library_entries || {}).map(props.workById).filter(Boolean);
    const topWorks = (profile.top_work_ids || []).slice(0,10).map(props.workById).filter(Boolean);
    const counts = {};
    library.concat(works).forEach(work => { if (work.type) counts[work.type] = (counts[work.type] || 0) + 1; });
    const favoriteType = root.LorefyPublicAppearance ? root.LorefyPublicAppearance.favoriteType(profile,props.workById) || '—' : Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '—';
    const favoriteTypeLabel = {Manga:'مانجا',Manhwa:'مانهوا',Manhua:'مانهوا صيني',Comics:'كوميكس',Book:'كتاب',Novel:'رواية','Light Novel':'لايت نوفل','Web Novel':'ويب نوفل'}[favoriteType] || favoriteType;

    async function follow() {
      if (busy || !ready) return;
      setBusy(true); setError('');
      const id = profile.id, following = !profile.is_following;
      try {
        if (backend && backend.toggleProfileFollow) await backend.toggleProfileFollow(id, following);
        setSnapshot(current => current.id === id ? { ...current, is_following:following,
          follower_count:Math.max(0, (Number(current.follower_count) || 0) + (following ? 1 : -1)) } : current);
        if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('lorefy:profile-follow-changed', { detail:{ profileId:id, following } }));
      } catch (_) { setError('تعذر حفظ المتابعة. حاول مجدداً.'); }
      finally { setBusy(false); }
    }
    async function openConnections(kind) {
      if (!ready) return;
      const id = profile.id;
      setConnections({ id, kind, loading:true, rows:[] });
      try {
        const rows = await backend[kind === 'followers' ? 'listProfileFollowers' : 'listProfileFollowing'](id, 200, 0);
        setConnections(current => current && current.id === id && current.kind === kind ? { id, kind, rows, loading:false } : current);
      } catch (_) {
        setConnections(current => current && current.id === id ? { ...current, loading:false, error:true } : current);
      }
    }
    const image = (src, name) => src ? h('img', { src, alt:name || '', loading:'lazy', decoding:'async', onError:props.onImageError }) : h('span', { className:'lf-reader-image-placeholder' }, String(name || '').slice(0, 1));
    const ownerCover = work => {
      const custom = (profile.custom_work_covers || {})[work.id];
      const source = custom || (root.LorefyCoverAPI && root.LorefyCoverAPI.primary ? root.LorefyCoverAPI.primary(work) : work.cover || work.sourceCoverUrl || work.sourceCover || work.coverImage || work.image || work.img || '');
      return safeImage(root.LorefyCoverAPI && root.LorefyCoverAPI.displayUrl ? root.LorefyCoverAPI.displayUrl(source) : source);
    };
    const spineHeight = work => root.LorefyLibraryView ? root.LorefyLibraryView.spineHeight(work.title) : 188;
    const profileSpineHeight = work => root.LorefyLibraryView && root.LorefyLibraryView.profileSpineHeight ? root.LorefyLibraryView.profileSpineHeight(work.title) : 188;
    const spineCover = work => h('span', {className:'lf-library-cover'}, image(ownerCover(work),work.title), h('span',{className:'lf-library-spine-title','data-no-translate':true,dir:'auto'},work.title));
    const workCard = (work, extra, asSpine=spine) => {
      const card=h('button', { key:work.id, type:'button', className:'lf-reader-cover is-work', style:asSpine ? {'--spine-height':profileSpineHeight(work)+'px'} : undefined, onClick:() => props.onWork(work), 'aria-label':(root.document.documentElement.lang==='en'?'Open ':'فتح ') + work.title, ...(extra || {}) }, asSpine ? spineCover(work) : image(ownerCover(work), work.title), root.LorefyProfileLayout?.forProfile(profile)==='reader' && h('span',{className:'lf-reader-layout-cover-title','data-no-translate':'1',dir:'auto',title:work.title},work.title));
      return root.LorefyLibraryMedia ? root.LorefyLibraryMedia.card(card,{lang:root.document.documentElement.lang,src:ownerCover(work),workId:work.id,title:work.title,fit:asSpine?'cover':'contain'}) : card;
    };
    const characterWork = ref => {
      const character = ref && (ref.character || ref) || {};
      const workId = ref && (ref.workId || ref.work_id) || character.workId || character.work_id || character.mediaId || character.media_id;
      return workId ? props.workById(workId) : null;
    };
    const characterCard = (ref, index) => {
      const character = ref.character || ref;
      const name = character.name || character.latin || 'شخصية';
      const linkedWork = characterWork(ref);
      const portraitMap = profile.custom_character_images || {};
      const keys = [character.id, character.key, ref.characterKey, String(character.latin || character.name || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '')];
      const characterKey = keys.find(key => key != null && portraitMap[String(key)]);
      const portrait = portraitMap[String(characterKey)] || character.image || character.img || character.cover;
      return h('button', {
        key:index,
        type:'button',
        className:'lf-reader-cover is-character',
        'data-character-card':true,
        disabled:!linkedWork,
        onClick:linkedWork ? () => props.onWork(linkedWork) : undefined,
        'aria-label':linkedWork ? 'فتح عمل ' + name : name
      }, h('span', { className:'lf-reader-character-image' }, image(safeImage(portrait), name)), h('strong', null, name));
    };
    function shelf(kind, items) {
      return h('section', { className:'lf-reader-shelf', 'data-profile-shelf':kind, 'aria-label':kind === 'works' ? 'الأعمال المفضلة' : 'الشخصيات المفضلة' },
        h('header', { className:'lf-reader-shelf-head' }, h('h2', null, kind === 'works' ? 'الأعمال المفضلة' : 'الشخصيات المفضلة')),
        h('div', { className:'lf-reader-shelf-rail' + (kind==='works' && spine ? ' is-spine-view' : kind==='works' && showcase ? ' is-showcase-view' : '') }, ...items, ...Array.from({ length:Math.max(0, (kind==='works' ? favoriteLimit : 4) - items.length) }, (_, i) => h('div', {
          key:'empty-' + i, className:'lf-reader-cover is-empty', 'data-empty-slot':true, 'aria-label':'خانة فارغة'
        })))
      );
    }
    function libraryCard(work, preview) {
      const status = (profile.library_entries || {})[work.id] || '';
      const card=h('button', {
        key:work.id,
        type:'button',
        className:'lf-reader-library-card' + (spine ? ' lf-library-card' : ''),
        style:spine ? {'--spine-height':spineHeight(work)+'px'} : undefined,
        'data-library-preview':preview || undefined,
        onClick:() => { setLibraryOpen(false); props.onWork(work); },
        'aria-label':(root.document.documentElement.lang==='en'?'Open ':'فتح ') + work.title
      }, spine ? spineCover(work) : h('span', { className:'lf-reader-library-cover' }, image(ownerCover(work), work.title)), h('span', { className:'lf-reader-library-copy' + (spine ? ' lf-library-copy' : '') }, h('strong', {dir:'auto',title:work.title,'data-no-translate':'1'}, work.title), status && h('small', null, root.LorefyI18n.readingStatusLabel(status, root.document.documentElement.lang))));
      return root.LorefyLibraryMedia ? root.LorefyLibraryMedia.card(card,{lang:root.document.documentElement.lang,src:ownerCover(work),workId:work.id,title:work.title,fit:spine?'cover':'contain'}) : card;
    }
    const compose=root.LorefyReaderLayout?.composePublic || (page=>page);
    return compose(h('div', { className:'lf-public-profile-page lf-profile-page lf-reader-full', 'data-profile-renderer':'full', 'aria-busy':loading,
      style:ownerStyle, 'data-owner-theme':appearance.theme, 'data-owner-library-view':appearance.library_view,
      'data-profile-decoration':JSON.stringify(root.LorefyProfileShop ? root.LorefyProfileShop.normalizeDecoration(profile.profile_decoration) : {}),
      'data-profile-layout':root.LorefyProfileLayout ? root.LorefyProfileLayout.forProfile(profile) : (profile.profile_layout === 'immersive' ? 'immersive' : 'normal'), 'data-lf-public-profile-id':profile.id },
      h('div', { className:'lf-reader-banner',style:{'--owner-banner-position':appearance.banner_position+'%'} }, image(banner, ''),
        h('button', { type:'button', className:'lf-reader-back', onClick:props.onBack, 'aria-label':root.document?.documentElement?.lang === 'en' ? 'Back' : 'رجوع' }, icon(root.document?.documentElement?.lang === 'en' ? 'ChevronLeft' : 'ChevronRight'))),
      h('div', { className:'lf-reader-surface' },
        h('div', { className:'lf-reader-identity' },
          h('div', { className:'lf-reader-avatar' }, image(avatar, profile.name || username)),
          h('h1', null, profile.name || username), h('p', { className:'lf-reader-handle', dir:'ltr' }, '@' + username),
          profile.bio && h('p', { className:'lf-reader-bio', dir:'auto' }, profile.bio),
          h('div', { className:'lf-reader-social-summary', 'aria-label':'إحصاءات التواصل' },
            h('button', { type:'button', className:'lf-reader-connection', 'data-connection':'following', disabled:!ready, onClick:() => openConnections('following'), 'aria-label':'عرض الحسابات التي يتابعها' }, h('strong', null, ready ? Number(profile.following_count) || 0 : '—'), h('span', null, 'يتابع')),
            h('span', { className:'lf-reader-social-divider', 'aria-hidden':true }),
            h('button', { type:'button', className:'lf-reader-connection', 'data-connection':'followers', disabled:!ready, onClick:() => openConnections('followers'), 'aria-label':'عرض المتابعين' }, h('strong', null, ready ? Number(profile.follower_count) || 0 : '—'), h('span', null, 'متابع'))),
          h('div', { className:'lf-reader-primary-actions' },
            h('button', { type:'button', className:'lf-reader-follow' + (ready && profile.is_following ? ' is-following' : ''), 'data-follow-action':true, onClick:follow, disabled:busy || !ready, 'aria-pressed':ready ? !!profile.is_following : undefined }, icon(ready && profile.is_following ? 'UserCheck' : 'UserPlus', 17), h('span', null, loading ? loadingLabel : !ready ? '—' : profile.is_following ? 'متابَع' : 'متابعة')),
            h('div', { className:'lf-reader-socials', 'aria-label':'روابط التواصل' },
              ...Object.entries(profile.social_links || {}).map(([kind, value]) => {
                const href = socialUrl(kind, value);
                return href ? h('a', { key:kind, href, target:'_blank', rel:'noopener noreferrer', 'aria-label':kind, title:kind },
                  props.socialGlyph ? h(props.socialGlyph, { k:kind, size:19 }) : icon('Globe')) : null;
              }))),
          loading && h('p', { role:'status', className:'lf-reader-loading' }, loadingLabel),
          error && h('div', { role:'alert', className:'lf-reader-error' }, error, h('button', { type:'button', onClick:() => setAttempt(attempt + 1) }, 'إعادة المحاولة')),
          h('div', { className:'lf-reader-metrics' }, ...[
            ['MessageCircle', Number(profile.review_count) || ownReviews.length, 'مراجعة'],
            ['MessagesSquare', Number(profile.post_count) || 0, 'منشور'],
            ['BookMarked', Number(profile.completed_count) || 0, 'مكتملة'],
            ['BookOpen', Number(profile.total_chapters) || 0, 'فصل'],
            ['Clock', Number(profile.read_hours) || 0, 'ساعات تقديرية'],
            ['Heart', favoriteTypeLabel, 'النوع المفضل']
          ].map(([symbol, value, label]) => {
            const isPosts = symbol === 'MessagesSquare';
            return h(isPosts ? 'button' : 'div', {
              key:symbol,
              type:isPosts ? 'button' : undefined,
              disabled:isPosts ? !ready : undefined,
              'data-profile-stat':symbol,
              'data-favorite-type':symbol === 'Heart' ? true : undefined,
              'aria-label':isPosts ? 'عرض منشورات القارئ' : undefined,
              onClick:isPosts ? () => {
                if (props.onPosts) props.onPosts(profile);
                else if (root.LorefyProfileSections) root.dispatchEvent(new root.CustomEvent('lorefy:open-profile-section', {detail:{tab:'posts'}}));
                else root.dispatchEvent(new root.CustomEvent('lorefy:open-reader-posts', { detail:profile }));
              } : undefined
            }, icon(symbol), h('strong', null, ready ? value : '—'), h('span', null, label));
          }))),
        shelf('works', works.map(work => workCard(work))),
        shelf('characters', characters.map(characterCard)),
        topWorks.length > 0 && h('section', { className:'lf-reader-shelf lf-reader-top-works', 'aria-label':'أفضل 10 أعمال' },
          h('header', { className:'lf-reader-shelf-head' }, h('h2', null, 'أفضل 10 أعمال')),
          h('div', { className:'lf-reader-library-grid' }, ...topWorks.map((work,index) => h('div', { key:work.id, className:'lf-reader-ranked-work' },
            workCard(work,undefined,false), h('span', { className:'lf-reader-work-rank' }, index+1))))),
        library.length > 0 && h('section', { className:'lf-reader-shelf lf-reader-library-preview', 'aria-label':'المكتبة' },
          h('header', { className:'lf-reader-shelf-head' }, h('h2', null, 'المكتبة'), h('button', { type:'button', className:'lf-reader-view-all', 'data-library-view-all':true, onClick:() => setLibraryOpen(true) }, 'عرض الكل', h('span', null, library.length), icon(root.document?.documentElement?.lang === 'en' ? 'ChevronRight' : 'ChevronLeft', 15))),
          h('div', { className:'lf-reader-library-grid' + (spine ? ' lf-library-grid is-spine-view' : showcase ? ' is-showcase-view' : appearance.library_view==='shelf' ? ' is-owner-list' : '') }, ...library.slice(0, 4).map(work => libraryCard(work, true)))),
        h('section', { className:'lf-public-profile-reviews' }, h('h2', null, 'المراجعات'), ownReviews.length ? ownReviews.map(props.renderReview) : ready && h('p', { className:'lf-reader-empty' }, 'لا مراجعات بعد'))),
      libraryOpen && h('div', { className:'lf-reader-modal', role:'dialog', 'aria-modal':true, 'aria-label':'مكتبة القارئ', onClick:() => setLibraryOpen(false) },
        h('section', { className:'lf-reader-library-dialog', onClick:event => event.stopPropagation() },
          h('header', null, h('div', null, h('h2', null, 'المكتبة'), h('p', null, library.length + ' عمل')), h('button', { type:'button', onClick:() => setLibraryOpen(false), 'aria-label':'إغلاق' }, icon('X'))),
          h('div', { className:'lf-reader-library-grid is-full' + (spine ? ' lf-library-grid is-spine-view' : showcase ? ' is-showcase-view' : appearance.library_view==='shelf' ? ' is-owner-list' : '') }, ...library.map(work => libraryCard(work, false))))),
      connections && connections.id === profile.id && h('div', { className:'lf-reader-modal', role:'dialog', 'aria-modal':true, 'aria-label':connections.kind === 'followers' ? 'المتابعون' : 'يتابع' },
        h('section', null, h('header', null, h('h2', null, connections.kind === 'followers' ? 'المتابعون' : 'يتابع'), h('button', { type:'button', onClick:() => setConnections(null), 'aria-label':'إغلاق' }, icon('X'))),
          connections.loading ? h('p', null, 'جارٍ التحميل...') : connections.error ? h('button', { type:'button', onClick:() => openConnections(connections.kind) }, 'إعادة المحاولة') : connections.rows.length ? connections.rows.map(reader => h('button', {
            key:reader.id, type:'button', className:'lf-reader-connection-row', onClick:() => { setConnections(null); root.dispatchEvent(new root.CustomEvent('lorefy:open-reader-profile', { detail:reader })); }
          }, image(safeImage(reader.avatar), reader.name), h('span', null, reader.name || reader.username), h('small', { dir:'ltr' }, '@' + reader.username))) : h('p', null, 'لا توجد حسابات بعد')))
    ),{lang:root.document?.documentElement?.lang,onBack:props.onBack});
  };
})(window);

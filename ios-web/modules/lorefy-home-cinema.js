(function(root){
  'use strict';
  function artwork(work,cover,rightsSafe){
    if(!work)return '';
    if(!rightsSafe&&String(work.id)==='mal-manga-2-berserk')return 'assets/home/berserk-home-v1.webp';
    var banner=work.banner||work.sourceBannerUrl;
    return typeof banner==='string'&&/^https:\/\//i.test(banner)?banner:cover||'';
  }
  function meter(work,percent){
    if(!work||![work.ch,work.chapters,work.vol,work.volumes,work.pages].some(value=>Number(value)>0)||!Number.isFinite(percent))return null;
    return Math.max(0,Math.min(100,Math.round(percent)));
  }
  function bindReadingChrome(scene){
    var page=scene&&scene.closest('.lf-home-cinema');
    if(!page)return function(){};
    var empty=scene.classList.contains('is-empty'),previous;
    function update(){
      var next=empty?'plain':page.scrollTop>48?'scrolled':'immersive';
      if(next!==previous){page.setAttribute('data-home-chrome',next);previous=next;}
    }
    update();
    if(!empty)page.addEventListener('scroll',update,{passive:true});
    return function(){
      if(!empty)page.removeEventListener('scroll',update);
      page.removeAttribute('data-home-chrome');
    };
  }
  function Heading(props){
    var h=root.React.createElement;
    return h('div',{className:'lf-cinema-heading'},h('strong',{className:'lf-social-brand','data-no-translate':'1'},'Lorefy'),h('h1',null,props.language==='en'?'Home':'الرئيسية'));
  }
  function ReviewRating(props){
    var h=root.React.createElement,Star=(root.NenIcons||{}).Star,en=props.language==='en';
    var dislike=props.value===0&&props.recommendation==='no';
    var value=Number(props.value),valid=Number.isFinite(value)&&(value>0||dislike)&&value<=5;
    var text=valid?String(value):'—',label=dislike?(en?'Dislike · 0 out of 5':'عدم إعجاب · صفر من 5'):valid?text+(en?' out of 5':' من 5'):(en?'Not rated':'لم يقيّم');
    if(props.recommendation==='no')label+=en?', does not recommend':'، لا يوصي بها';
    else if(props.recommendation==='yes')label+=en?', recommends':'، يوصي بها';
    return h('span',{className:'lf-cinema-rating',role:'img','aria-label':label,title:label,'data-rating':valid?String(value):'',dir:'ltr'},
      h('b',{'aria-hidden':true},text),dislike&&(root.NenIcons||{}).ThumbsDown?h(root.NenIcons.ThumbsDown,{size:16,'aria-hidden':true}):Star&&h(Star,{size:16,'aria-hidden':true}));
  }
  function Resume(props){
    var R=root.React,h=R.createElement,en=props.language==='en',state=R.useState(null),selected=state[0],select=state[1];
    var works=(props.works||[]).slice(0,4),work=works.find(w=>String(w.id)===selected)||works[0],icons=root.NenIcons||{};
    var scene=R.useRef(null);
    R.useLayoutEffect(function(){return bindReadingChrome(scene.current);},[work?String(work.id):null]);
    if(!work)return h('section',{className:'lf-cinema-resume is-empty',ref:scene},h('h2',null,en?'No reading in progress':'لا توجد قراءة جارية'),h('button',{type:'button',className:'lf-cinema-resume-action',onClick:props.onExplore},icons.Compass&&h(icons.Compass,{size:20,'aria-hidden':true}),en?'Explore works':'استكشف الأعمال'));
    var ongoing=/ongoing|publishing|مستمرة|مستمر/i.test(String(work.st||''));
    var progress=props.progressFor(work),library=root.LorefyLibraryCinema,percent=ongoing?null:library&&library.percentage?library.percentage(work,progress):library&&!library.hasTotal(work,progress)?null:meter(work,props.percent(work,progress)),cover=props.cover(work);
    var summary=props.summary(work,progress);
    if(library&&!ongoing)summary=library.checkpoint(work,progress,props.language,summary);
    var safe=!!(root.LOREFY_RUNTIME&&root.LOREFY_RUNTIME.rightsSafeMedia||root.LOREFY_RELEASE&&root.LOREFY_RELEASE.rightsSafeMedia);
    var art=artwork(work,cover,safe),fallback=props.fallback(work);
    var backdrop=root.LorefyCoverMedia?h(root.LorefyCoverMedia,{workId:'home-background:'+work.id,src:art,fallback:fallback,language:props.language,loading:'eager',fetchPriority:'high',render:function(surface,retry){
      return h(R.Fragment,null,h('div',{className:'lf-cinema-backdrop'+(art===cover?' is-cover':''),'aria-hidden':true},surface),retry&&R.cloneElement(retry,{className:'lf-cover-retry lf-cinema-background-retry','aria-label':en?'Retry background':'إعادة تحميل الخلفية',title:en?'Retry background':'إعادة تحميل الخلفية'}));
    }}):h('img',{className:'lf-cinema-backdrop'+(art===cover?' is-cover':''),src:art,alt:'',decoding:'async',fetchPriority:'high',onError:props.onError,'data-fallback':fallback});
    var poster=h('button',{type:'button',className:'lf-cinema-resume-cover','aria-label':(en?'Open ':'فتح ')+work.title,onClick:()=>props.onOpen(work)},h('img',{src:cover,alt:'',decoding:'async',onError:props.onError,'data-fallback':fallback}));
    if(root.LorefyLibraryMedia)poster=root.LorefyLibraryMedia.card(poster,{lang:props.language,workId:work.id,title:work.title,loading:'eager'});
    function thumbnail(w){
      var attributes={key:w.id,type:'button','aria-label':(en?'Switch to ':'التبديل إلى ')+w.title,title:w.title,'aria-pressed':String(w.id)===String(work.id),onClick:()=>select(String(w.id))},src=props.cover(w);
      return root.LorefyCoverMedia?h(root.LorefyCoverMedia,{key:w.id,workId:w.id,src:src,fallback:props.fallback(w),loading:'lazy',language:props.language,render:function(surface){return h('button',attributes,surface);}}):h('button',attributes,h('img',{src:src,alt:'',loading:'lazy',onError:props.onError,'data-fallback':props.fallback(w)}));
    }
    return h('section',{className:'lf-cinema-resume',ref:scene,'data-work-id':String(work.id)},
      backdrop,
      h('div',{className:'lf-cinema-resume-content',dir:'ltr'},
        h('div',{className:'lf-cinema-resume-copy',dir:en?'ltr':'rtl'},
          h('div',{className:'lf-cinema-resume-heading'},h('h2',null,en?'Continue reading':'تابع القراءة'),h('button',{type:'button',className:'lf-cinema-library-link',onClick:props.onLibrary},en?'Library':'مكتبتي')),
          h('h3',{'data-no-translate':'1',dir:'auto',title:work.title},work.title),
          h('p',{'data-no-translate':'1',dir:en?'ltr':'rtl'},h('bdi',{className:'lf-cinema-checkpoint',dir:'ltr'},summary)),
          percent!==null&&h('div',{className:'lf-cinema-progress-row'},h('div',{className:'lf-cinema-progress',role:'progressbar','aria-label':en?'Reading progress':'تقدّم القراءة','aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':percent},h('i',{style:{width:percent+'%'}})),h('span',{className:'lf-cinema-progress-label','aria-hidden':true},percent+'%')),
          h('button',{type:'button',className:'lf-cinema-resume-action',onClick:()=>props.onOpen(work)},icons.BookOpen&&h(icons.BookOpen,{size:22,'aria-hidden':true}),en?'Continue':'متابعة')),
        poster),
      works.length>1&&h('div',{className:'lf-cinema-reading-switch',role:'group','aria-label':en?'Reading works':'الأعمال الجارية',dir:en?'ltr':'rtl'},
        h('span',{className:'lf-cinema-reading-label'},en?'Reading now':'قراءاتك'),h('div',{className:'lf-cinema-reading-options'},works.map(thumbnail))));
  }
  var api={artwork:artwork,meter:meter,bindReadingChrome:bindReadingChrome,Heading:Heading,ReviewRating:ReviewRating,Resume:Resume};
  root.LorefyHomeCinema=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

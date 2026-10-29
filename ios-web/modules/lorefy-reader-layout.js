(function(root,factory) {
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LorefyReaderLayout=api;
})(typeof window!=='undefined'?window:globalThis,function(root) {
  'use strict';
  const children=node=>root.React.Children.toArray(node&&node.props&&node.props.children);
  const has=(node,name)=>!!node&&String(node.props&&node.props.className||'').split(' ').includes(name);
  const pick=(nodes,name)=>nodes.find(node=>has(node,name));
  const text=(lang,ar,en)=>lang==='en'?en:ar;
  const glyph=(name,size=20)=>root.NenIcons&&root.NenIcons[name]?root.React.createElement('span',{
    className:'lf-reader-layout-glyph','aria-hidden':true
  },root.React.createElement(root.NenIcons[name],{size,strokeWidth:1.75})):null;
  const enabled=page=>page&&page.props&&page.props['data-profile-layout']==='reader';
  function Toolbar(props) {
    const h=root.React.createElement;
    return h('header',{className:'lf-reader-layout-toolbar'},
      h('h1',null,text(props.lang,'حسابي','Profile')),
      h('div',{className:'lf-reader-layout-tools'},
        props.onSettings&&h('button',{type:'button',onClick:props.onSettings,title:text(props.lang,'الإعدادات','Settings'),'aria-label':text(props.lang,'الإعدادات','Settings')},glyph('Settings',22)),
        props.onEdit&&h('button',{type:'button',onClick:props.onEdit,title:text(props.lang,'تعديل الملف','Edit profile'),'aria-label':text(props.lang,'تعديل الملف','Edit profile')},glyph('Pencil',22)),
        props.onBack&&h('button',{type:'button',onClick:props.onBack,title:text(props.lang,'رجوع','Back'),'aria-label':text(props.lang,'رجوع','Back')},glyph(props.lang==='en'?'ChevronLeft':'ChevronRight',22))));
  }
  function ReadingLately(props) {
    const h=root.React.createElement;
    const rows=(props.reading||[]).slice(0,3);
    return h('section',{className:'lf-reader-layout-reading','aria-label':text(props.lang,'أقرأ الآن','Currently reading')},
      h('header',null,h('h2',null,text(props.lang,'أقرأ الآن','Currently reading')),
        props.onLibrary&&h('button',{type:'button',onClick:props.onLibrary},text(props.lang,'عرض الكل','See all'),glyph(props.lang==='en'?'ChevronRight':'ChevronLeft',16))),
      rows.length?rows.map(row=>{
        const value=Math.max(0,Number(row.chapter)||0),total=Math.max(0,Number(row.total)||0);
        const card=h('button',{key:row.work.id,type:'button',className:'lf-reader-layout-reading-row','data-reading-work':row.work.id,'aria-label':text(props.lang,'فتح ','Open ')+row.work.title,onClick:()=>props.onWork&&props.onWork(row.work)},
          h('img',{src:row.cover,alt:'',loading:'lazy',decoding:'async',onError:props.onImageError}),
          h('span',{className:'lf-reader-layout-reading-copy'},h('strong',{'data-no-translate':'1',dir:'auto',title:row.work.title},row.work.title),
            h('span',{className:'lf-reader-layout-reading-meta'},h('span',null,text(props.lang,'الفصل','Chapter')),
              h('bdi',{dir:'ltr'},value,total?' / '+total:'')),
            total>0&&h('progress',{value:Math.min(value,total),max:total,'aria-label':text(props.lang,'تقدم القراءة','Reading progress'),
              'aria-valuetext':text(props.lang,Math.min(value,total)+' من '+total+' فصلًا',Math.min(value,total)+' of '+total+' chapters')})));
        return root.LorefyLibraryMedia?root.LorefyLibraryMedia.card(card,{lang:props.lang,artClass:'lf-reader-layout-reading-art'}):card;
      }):h('p',{className:'lf-reader-layout-empty'},glyph('BookOpen',18),text(props.lang,'لا توجد أعمال قيد القراءة.','No reading in progress.')));
  }
  function Statistics(props) {
    const h=root.React.createElement;
    return h('section',{className:'lf-reader-layout-statistics','aria-label':text(props.lang,'إحصاءات القراءة','Reading statistics')},
      h('h2',null,text(props.lang,'إحصاءات القراءة','Reading statistics')),props.metrics);
  }
  function titleFavorites(node) {
    const R=root.React;
    return R.cloneElement(node,{},...children(node).map((item,index)=>{
      const title=item&&item.props&&item.props['data-work-title'];
      if(!title)return item;
      return R.cloneElement(item,{key:item.key||index},...children(item),R.createElement('span',{className:'lf-reader-layout-cover-title','data-no-translate':'1',dir:'auto',title},title));
    }));
  }
  // Compose React elements before mounting; never move React-owned DOM nodes.
  function composeOwner(page,props) {
    if(!enabled(page))return root.LorefyLibraryMedia?root.LorefyLibraryMedia.owner(page,props):page;
    const R=root.React,h=R.createElement,nodes=children(page);
    const banner=pick(nodes,'lf-profile-banner'),identity=pick(nodes,'lf-profile-identity'),favorites=pick(nodes,'lf-profile-favorites');
    if(!banner||!identity)return page;
    const parts=children(identity),metrics=pick(parts,'lf-profile-metrics');
    const oldBanner=children(banner);
    const controls=oldBanner.flatMap(node=>{
      if(!node||node.type==='img'||has(node,'lf-profile-avatar'))return [];
      if(node.type==='div') {
        const buttons=children(node).filter(child=>child.type==='button');
        return buttons.length>1?[R.cloneElement(node,{},...buttons.slice(1))]:[];
      }
      return node.type==='button'?[node]:[];
    });
    const primary=R.cloneElement(identity,{},...parts.filter(node=>node!==metrics));
    const art=R.cloneElement(banner,{},...oldBanner.filter(node=>node&&(node.type==='img'||has(node,'lf-profile-avatar'))));
    const composed=R.cloneElement(page,{key:'reader-profile-layout'},h(Toolbar,{key:'reader-toolbar',...props}),art,primary,
      favorites&&titleFavorites(favorites),h(ReadingLately,{key:'reading-lately',...props}),h(Statistics,{key:'reading-statistics',metrics,lang:props.lang}),
      h('div',{className:'lf-reader-layout-utilities',key:'profile-tools'},...controls),
      ...nodes.filter(node=>node!==banner&&node!==identity&&node!==favorites));
    return root.LorefyLibraryMedia?root.LorefyLibraryMedia.owner(composed,props):composed;
  }
  function composePublic(page,props) {
    if(!enabled(page))return page;
    const R=root.React,h=R.createElement,nodes=children(page),banner=pick(nodes,'lf-reader-banner'),surface=pick(nodes,'lf-reader-surface');
    if(!surface)return page;
    const items=children(surface),identity=pick(items,'lf-reader-identity'),parts=children(identity),metrics=pick(parts,'lf-reader-metrics');
    const shelves=items.filter(node=>node!==identity),first=shelves.shift();
    return R.cloneElement(page,{key:'reader-public-layout'},h(Toolbar,{key:'reader-toolbar',lang:props.lang,onBack:props.onBack}),banner,
      R.cloneElement(surface,{},R.cloneElement(identity,{},...parts.filter(node=>node!==metrics)),
        first,h(Statistics,{key:'reading-statistics',metrics,lang:props.lang}),...shelves),
      ...nodes.filter(node=>node!==banner&&node!==surface));
  }
  return {composeOwner,composePublic,ReadingLately,Toolbar,Statistics};
});

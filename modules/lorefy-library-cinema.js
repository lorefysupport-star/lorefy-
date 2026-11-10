(function(root){
  'use strict';
  function positive(value,keys){
    for(var i=0;i<keys.length;i++){var n=Number(value&&value[keys[i]]);if(Number.isFinite(n)&&n>0)return n;}
    return 0;
  }
  var units=[{saved:['chapter','ch'],total:['ch','chapters','chapterCount'],en:'chapters',ar:'فصل'},
    {saved:['page'],total:['pages','pageCount'],en:'pages',ar:'صفحة'},
    {saved:['volume','vol'],total:['vol','volumes','volumeCount'],en:'volumes',ar:'مجلد'}];
  function savedUnit(work,progress){
    for(var i=0;i<units.length;i++){
      var current=positive(progress,units[i].saved);
      if(current)return {unit:units[i],current:current,total:positive(work,units[i].total)};
    }
    return null;
  }
  function hasTotal(work,progress){
    if(progress){var saved=savedUnit(work,progress);if(saved)return saved.total>0;}
    return units.some(function(unit){return positive(work,unit.total)>0;});
  }
  function checkpoint(work,progress,language,fallback){
    var saved=savedUnit(work,progress);
    return saved&&saved.total?saved.current+' / '+saved.total+' '+saved.unit[language==='en'?'en':'ar']:fallback;
  }
  function percentage(work,progress){
    var saved=savedUnit(work,progress);
    if(!saved)return hasTotal(work,progress)?0:null;
    return saved.total?Math.max(0,Math.min(100,Math.round(saved.current/saved.total*100))):null;
  }
  function Heading(props){
    var h=root.React.createElement;
    return h('div',{className:'lf-library-cinema-heading'},h('strong',{'data-no-translate':'1'},'Lorefy'),h('h1',null,props.language==='en'?'My Library':'مكتبتي'));
  }
  function Search(props){
    var h=root.React.createElement,icons=root.NenIcons||{},en=props.language==='en';
    return h('div',{className:'lf-library-search'},icons.Search&&h(icons.Search,{size:21,'aria-hidden':true}),
      h('input',{type:'search',value:props.value,onChange:function(event){props.onChange(event.target.value);},placeholder:en?'Search your library':'ابحث في مكتبتك','aria-label':en?'Search library':'البحث في المكتبة'}),
      props.value&&h('button',{type:'button','aria-label':en?'Clear search':'مسح البحث',title:en?'Clear search':'مسح البحث',onClick:function(){props.onChange('');}},icons.X&&h(icons.X,{size:18,'aria-hidden':true})));
  }
  function Summary(props){
    var count=Math.max(0,Math.floor(Number(props.count)||0)),en=props.language==='en';
    return root.React.createElement('span',{className:'lf-library-result-count','aria-live':'polite'},count+' '+(en?(count===1?'work':'works'):(count===1?'عمل':'أعمال')));
  }
  var BATCH=42,views=new Map();
  function remember(owner,value){
    views.delete(owner);views.set(owner,value);
    if(views.size>8)views.delete(views.keys().next().value);
  }
  function snapshot(library,getWork){
    var rows=[],counts=Object.create(null),entries=Object.entries(library||{});
    entries.forEach(function(entry){var work=getWork(entry[0]);if(!work)return;rows.push({id:entry[0],m:work,st:entry[1]});counts[entry[1]]=(counts[entry[1]]||0)+1;});
    return {rows:rows,counts:counts,pending:entries.length-rows.length};
  }
  function selectRows(rows,props){
    var query=String(props.query||'').trim();
    var results=rows.filter(function(row){return (props.status==='all'||row.st===props.status)&&(!query||props.matches(row.m,query));});
    if(props.order==='title')results.sort(function(a,b){return a.m.title.localeCompare(b.m.title);});
    if(props.order==='progress')results=results.map(function(row,index){return {row:row,index:index,value:Number(props.percentage(row.m,props.getProgress(row.m)))||0};}).sort(function(a,b){return b.value-a.value||a.index-b.index;}).map(function(entry){return entry.row;});
    return results;
  }
  function Collection(props){
    var React=root.React,owner=String(props.owner||'local'),saved=views.get(owner);
    var revisionState=React.useState(0),revision=revisionState[0],setRevision=revisionState[1];
    var queryState=React.useState(function(){return {owner:owner,external:props.query,value:saved&&saved.externalQuery===props.query?saved.query:props.query};}),queryValue=queryState[0],setQuery=queryState[1];
    var query=queryValue.owner===owner&&queryValue.external===props.query?queryValue.value:props.query;
    var context=JSON.stringify([owner,props.status,query,props.order]);
    var initial=saved&&saved.context===context?saved:{context:context,limit:BATCH,scroll:0};
    var paging=React.useState(function(){return initial;}),page=paging[0],setPage=paging[1];
    var limit=page.context===context?page.limit:initial.limit,node=React.useRef(null),active=React.useRef(null);
    active.current=context;
    React.useEffect(function(){
      active.current=context;
      function changed(){setRevision(function(n){return n+1;});}
      root.addEventListener('lorefy:catalog-ingested',changed);root.addEventListener('lorefy:chapter-metadata',changed);
      return function(){root.removeEventListener('lorefy:catalog-ingested',changed);root.removeEventListener('lorefy:chapter-metadata',changed);active.current=null;};
    },[owner]);
    var data=React.useMemo(function(){return snapshot(props.library,props.getWork);},[owner,props.library,revision]);
    var results=React.useMemo(function(){return selectRows(data.rows,Object.assign({},props,{query:query}));},[data,props.status,query,props.order,props.progress]);
    React.useLayoutEffect(function(){if(node.current)node.current.scrollTop=initial.scroll;},[context]);
    React.useEffect(function(){
      var previous=views.get(owner);remember(owner,{context:context,query:query,externalQuery:props.query,limit:limit,scroll:previous&&previous.context===context?previous.scroll:0});
    },[owner,context,limit]);
    return props.render({rows:data.rows,counts:data.counts,pending:data.pending,results:results,visible:results.slice(0,limit),empty:!results.length&&!data.pending,hasMore:results.length>limit,query:query,
      onQuery:function(value){if(active.current!==context)return;setQuery({owner:owner,external:props.query,value:String(value)});},
      onMore:function(){if(active.current!==context)return;setPage(function(previous){return {context:context,limit:Math.min(results.length,(previous.context===context?previous.limit:limit)+BATCH)};});},
      pageProps:{ref:node,onScroll:function(event){if(active.current!==context)return;remember(owner,{context:context,query:query,externalQuery:props.query,limit:limit,scroll:event.currentTarget.scrollTop});}}});
  }
  function Empty(props){
    var h=root.React.createElement,en=props.language==='en',search=!!String(props.query||'').trim(),icons=root.NenIcons||{},Icon=search?icons.Search:icons.BookOpen;
    return h('div',{className:'lf-empty-state lf-library-empty',role:'status'},
      Icon&&h(Icon,{size:32,'aria-hidden':true}),
      h('strong',null,search?(en?'No matching works':'لا توجد أعمال مطابقة'):(props.filtered?(props.status&&root.LorefyI18n?root.LorefyI18n.readingStatusEmpty(props.status,props.language):(en?'No works in this collection':'لا توجد أعمال بهذه الحالة')):(en?'Your library starts here':'مكتبتك تبدأ هنا'))),
      h('p',null,search?(en?'Try a different title or author.':'جرّب عنوانًا أو مؤلفًا آخر.'):(en?'Keep the stories you want to return to.':'احتفظ بالأعمال التي تود العودة إليها.')),
      h('button',{type:'button',onClick:search?props.onClear:props.filtered&&props.onReset?props.onReset:props.onExplore},en?(search?'Clear search':props.filtered&&props.onReset?'Show all works':'Explore works'):(search?'مسح البحث':props.filtered&&props.onReset?'عرض كل الأعمال':'استكشف الأعمال')));
  }
  var api={hasTotal:hasTotal,checkpoint:checkpoint,percentage:percentage,Heading:Heading,Search:Search,Summary:Summary,Empty:Empty,Collection:Collection};
  root.LorefyLibraryCinema=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

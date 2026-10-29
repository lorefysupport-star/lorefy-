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
  function Empty(props){
    var h=root.React.createElement,en=props.language==='en',search=!!String(props.query||'').trim(),icons=root.NenIcons||{},Icon=search?icons.Search:icons.BookOpen;
    return h('div',{className:'lf-empty-state lf-library-empty',role:'status'},
      Icon&&h(Icon,{size:32,'aria-hidden':true}),
      h('strong',null,search?(en?'No matching works':'لا توجد أعمال مطابقة'):(props.filtered?(props.status&&root.LorefyI18n?root.LorefyI18n.readingStatusEmpty(props.status,props.language):(en?'No works in this collection':'لا توجد أعمال بهذه الحالة')):(en?'Your library starts here':'مكتبتك تبدأ هنا'))),
      h('p',null,search?(en?'Try a different title or author.':'جرّب عنوانًا أو مؤلفًا آخر.'):(en?'Keep the stories you want to return to.':'احتفظ بالأعمال التي تود العودة إليها.')),
      h('button',{type:'button',onClick:search?props.onClear:props.onExplore},en?(search?'Clear search':'Explore works'):(search?'مسح البحث':'استكشف الأعمال')));
  }
  var api={hasTotal:hasTotal,checkpoint:checkpoint,Heading:Heading,Search:Search,Summary:Summary,Empty:Empty};
  root.LorefyLibraryCinema=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

(function(root){
  'use strict';
  // toArray rewrites React keys and clones elements, breaking identity-based replacement.
  var children=function(node){var list=[];root.React.Children.forEach(node&&node.props&&node.props.children,function(child){if(child!=null&&child!==false)list.push(child);});return list;};
  var has=function(node,name){return !!node&&String(node.props&&node.props.className||'').split(' ').includes(name);};
  function path(node,predicate){
    if(!node||typeof node!=='object')return null;
    if(predicate(node))return[node];
    var list=children(node);
    for(var i=0;i<list.length;i++){var found=path(list[i],predicate);if(found)return[node].concat(found);}
    return null;
  }
  function replace(node,target,next){
    if(node===target)return next;
    if(!node||typeof node!=='object')return node;
    var list=children(node),changed=false,updated=list.map(function(child){var value=replace(child,target,next);if(value!==child)changed=true;return value;});
    return changed?root.React.cloneElement(node,{},...updated):node;
  }
  function card(node,options){
    if(!root.LorefyCoverMedia||!node)return node;
    var opts=options||{},R=root.React,h=R.createElement;
    var marked=path(node,function(n){return has(n,'lf-library-cover')||has(n,'lf-reader-library-cover');});
    var imagePath=path(node,function(n){return n.type==='img';}),image=imagePath&&imagePath[imagePath.length-1];
    var placeholder=path(node,function(n){return has(n,'lf-reader-image-placeholder');});
    var cover=marked?marked[marked.length-1]:imagePath?(imagePath[imagePath.length-2]===node?image:imagePath[imagePath.length-2]):placeholder&&placeholder[placeholder.length-1];
    if(!cover)return node;
    var props=node.props||{},source=Object.prototype.hasOwnProperty.call(opts,'src')?opts.src:image&&image.props.src||'';
    var open=props.onClick||cover.props.onClick,title=opts.title||props['data-work-title']||image&&image.props.alt||'';
    function render(surface,retry){
      var art;
      if(cover.type==='img'||has(cover,'lf-reader-image-placeholder')){
        art=h('span',{className:opts.artClass||'lf-reader-cover-art','data-lorefy-book-cover':''},surface);
      }else art=R.cloneElement(cover,{'data-lorefy-book-cover':'',onClick:undefined},...children(cover).map(function(child){return child===(image||(placeholder&&placeholder[placeholder.length-1]))?surface:child;}));
      var updated=replace(node,cover,art),attributes=Object.assign({},props,{className:(props.className||'')+' lf-managed-cover-card','data-work-title':title||props['data-work-title']});
      delete attributes.children;delete attributes.onClick;delete attributes.type;delete attributes['aria-label'];delete attributes.onKeyDown;
      var content=children(updated).map(function(child){return child&&child.type==='button'?R.cloneElement(child,{type:'button',className:(child.props.className||'')+' lf-profile-cover-edit','aria-label':(opts.lang==='en'?'Change cover: ':'تغيير الغلاف: ')+title}):child;});
      return h('div',attributes,...content,open&&h('button',{type:'button',className:'lf-cover-open',onClick:open,'aria-label':props['aria-label']||(opts.lang==='en'?'Open ':'فتح ')+title}),retry);
    }
    return h(root.LorefyCoverMedia,{key:node.key,workId:opts.workId||props['data-work-id']||props['data-reading-work']||node.key||title,src:source,
      fallback:opts.fallback||image&&image.props['data-fallback'],fit:opts.fit||'cover',loading:opts.loading||'lazy',language:opts.lang,render:render,'data-work-title':props['data-work-title']});
  }
  function owner(page,props){
    if(!root.LorefyCoverMedia)return page;
    var R=root.React;
    return R.cloneElement(page,{},...children(page).map(function(node){
      if(!has(node,'lf-profile-favorites')||has(node,'lf-profile-top-characters-grid'))return node;
      return R.cloneElement(node,{},...children(node).map(function(slot){return slot&&slot.props&&slot.props['data-work-title']?card(slot,{lang:props.lang}):slot;}));
    }));
  }
  root.LorefyLibraryMedia={card:card,owner:owner};
})(typeof window!=='undefined'?window:this);

(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LorefyCatalogRequests=factory();
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  var TYPES=['Novel','Book','Comics','Manga','Manhwa','Manhua','Light Novel','Web Novel'];
  function reference(value){
    var url;try{url=new URL(String(value||'').trim());}catch(_){throw Error('reference');}
    var host=url.hostname.toLowerCase(),ip=host.split('.').map(Number);
    if(!/^https?:$/.test(url.protocol)||url.username||url.password||url.port||host.indexOf(':')>=0||!host.includes('.')||/\.(local|localhost|internal|test|invalid)$/.test(host)||
      (ip.length===4&&ip.every(Number.isFinite)&&(ip[0]===0||ip[0]===10||ip[0]===127||ip[0]>=224||ip[0]===169&&ip[1]===254||ip[0]===172&&ip[1]>=16&&ip[1]<=31||ip[0]===192&&ip[1]===168)))throw Error('reference');
    url.hash='';if(url.href.length>1500)throw Error('reference');return url.href;
  }
  function create(storage,owner){
    var key='lorefy.catalog.requests.v1:'+encodeURIComponent(String(owner||''));
    function list(){if(!owner)return [];try{var rows=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(rows)?rows.filter(function(r){return r&&r.status==='local-draft';}).slice(0,100):[];}catch(_){return [];}}
    return {list:list,save:function(input){
      if(!owner)throw Error('account');
      var title=String(input.title||'').trim().slice(0,180),type=input.type;
      if(title.length<2)throw Error('title');if(!TYPES.includes(type))throw Error('type');
      var url=reference(input.url),rows=list(),existing=rows.find(function(r){return r.url===url&&r.type===type;});
      if(existing)return existing;if(rows.length>=100)throw Error('limit');
      var row={id:'request-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),title:title,type:type,url:url,
        note:String(input.note||'').trim().slice(0,1000),createdAt:new Date().toISOString(),status:'local-draft'};
      rows.unshift(row);storage.setItem(key,JSON.stringify(rows));return row;
    },remove:function(id){if(!owner)throw Error('account');storage.setItem(key,JSON.stringify(list().filter(function(r){return r.id!==id;})));}};
  }
  return {create:create,reference:reference,types:TYPES};
});

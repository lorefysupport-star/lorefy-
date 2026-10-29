(function(root,factory) {
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LorefyProfileHeader=api;
})(typeof window!=='undefined'?window:globalThis,function(root) {
  'use strict';
  const avatarSpace=(width,inset=0)=>Number.isFinite(width)?Math.max(112,Math.ceil(width+14+Math.max(0,Number.isFinite(inset)?inset:0))):112;
  function previewGeometry(width,height,textStart) {
    if(![width,height,textStart].every(Number.isFinite)||width<=0||height<=0)return null;
    const percent=value=>Math.round(Math.max(0,Math.min(height,value))/height*1000000)/10000+'%';
    return {ratio:width+' / '+height,textStart:percent(textStart),fadeStart:percent(textStart-72),fadeEnd:percent(height-20)};
  }
  function syncPreview(doc,page) {
    const preview=doc.querySelector?.('.lf-customize-banner'),image=parts(page).image;
    if(!preview||!image)return;
    const rect=image.getBoundingClientRect(),geometry=previewGeometry(rect.width,rect.height,parseFloat(page.style.getPropertyValue('--profile-header-text-start')));
    if(!geometry)return;
    Object.entries(geometry).forEach(([key,value])=>{
      const property='--profile-preview-'+key;
      if(preview.style.getPropertyValue(property)!==value)preview.style.setProperty(property,value);
    });
  }
  function cropRatio(doc) {
    const image=doc.querySelector?.('.lf-profile-page:not(.lf-public-profile-page) .lf-profile-banner > img');
    const rect=image?.getBoundingClientRect();
    return rect?.width>0&&rect?.height>0?rect.width/rect.height:1200/450;
  }
  function extent(input) {
    if(!input||!['imageTop','bannerBottom','nameTop','identityBottom'].every(key=>Number.isFinite(input[key])))return null;
    const height=Math.ceil(Math.max(input.bannerBottom,input.identityBottom+20)-input.imageTop);
    if(height<=0)return null;
    return {height,textStart:Math.max(0,Math.min(height-20,Math.round(input.nameTop-input.imageTop)))};
  }
  function parts(page) {
    const banner=page.querySelector('.lf-profile-banner,.lf-reader-banner');
    const image=banner&&banner.querySelector(':scope > img');
    const identity=page.querySelector('.lf-profile-identity,.lf-reader-identity');
    const name=identity&&identity.querySelector('.lf-profile-name,h1');
    const handle=identity&&identity.querySelector('.lf-profile-handle,.lf-reader-handle');
    const avatar=page.querySelector('.lf-decoration-avatar-frame')||page.querySelector('.lf-profile-avatar,.lf-reader-avatar');
    return {banner,image,identity,name,handle,avatar};
  }
  function update(page) {
    const p=parts(page);
    if(!p.banner||!p.image||!p.name||!p.handle)return null;
    const banner=p.banner.getBoundingClientRect(),image=p.image.getBoundingClientRect();
    if(!banner.width||!p.name.getBoundingClientRect().height)return null;
    const result=extent({imageTop:image.top,bannerBottom:banner.bottom,nameTop:p.name.getBoundingClientRect().top,
      identityBottom:Math.max(p.handle.getBoundingClientRect().bottom,p.avatar?p.avatar.getBoundingClientRect().bottom:p.handle.getBoundingClientRect().bottom)});
    if(!result)return null;
    const values={'--profile-header-art-height':result.height+'px','--profile-header-text-start':result.textStart+'px',
      '--profile-header-art-offset':Math.round((image.top-banner.top)*100)/100+'px'};
    if(page.getAttribute('data-profile-layout')==='reader'){
      const frame=p.avatar?.getBoundingClientRect(),identity=p.identity?.getBoundingClientRect(),style=root.getComputedStyle?.(p.identity);
      const inset=frame&&identity&&style?(style.direction==='rtl'?identity.right-parseFloat(style.paddingRight||0)-frame.right:frame.left-identity.left-parseFloat(style.paddingLeft||0)):0;
      values['--profile-header-avatar-space']=avatarSpace(frame?.width,inset)+'px';
      values['--profile-header-identity-inset']=Math.max(12,Math.ceil((p.avatar?.getBoundingClientRect().bottom||banner.bottom)-banner.bottom+16))+'px';
    }
    Object.entries(values).forEach(([key,value])=>{if(page.style.getPropertyValue(key)!==value)page.style.setProperty(key,value);});
    if(page.getAttribute('data-profile-header-ready')!=='true')page.setAttribute('data-profile-header-ready','true');
    return result;
  }
  function watch(doc,env=root) {
    const mounted=new Map();let pending=0,stopped=false;
    const schedule=()=>{if(!stopped&&!pending)pending=env.requestAnimationFrame(refresh);};
    function refresh() {
      pending=0;if(stopped)return;
      for(const [page,entry]of mounted)if(!page.isConnected){entry.resize?.disconnect();entry.attributes.disconnect();mounted.delete(page);}
      doc.querySelectorAll('.lf-profile-page[data-profile-layout]').forEach(page=>{
        const p=parts(page),nodes=Object.values(p).filter(Boolean),old=mounted.get(page);
        if(!old||nodes.length!==old.nodes.length||nodes.some((node,index)=>node!==old.nodes[index])) {
          old?.resize?.disconnect();old?.attributes.disconnect();
          const resize=env.ResizeObserver?new env.ResizeObserver(schedule):null;
          nodes.forEach(node=>resize?.observe(node));
          const attributes=new env.MutationObserver(schedule);
          attributes.observe(page,{attributes:true,attributeFilter:['style','class','data-profile-layout']});
          if(p.banner)attributes.observe(p.banner,{attributes:true,attributeFilter:['style']});
          if(p.image)attributes.observe(p.image,{attributes:true,attributeFilter:['style','src']});
          mounted.set(page,{nodes,resize,attributes});
        }
        update(page);
        if(!page.classList?.contains('lf-public-profile-page'))syncPreview(doc,page);
      });
    }
    // Measure only on layout/content changes, never on animation or scroll ticks.
    const changes=new env.MutationObserver(schedule);
    changes.observe(doc.getElementById('root')||doc.body,{childList:true,subtree:true});
    env.addEventListener('resize',schedule);
    doc.fonts?.ready.then(schedule);
    refresh();
    return ()=>{stopped=true;changes.disconnect();if(pending)env.cancelAnimationFrame(pending);env.removeEventListener('resize',schedule);
      for(const entry of mounted.values()){entry.resize?.disconnect();entry.attributes.disconnect();}mounted.clear();};
  }
  if(root.document) {
    const start=()=>watch(root.document);
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  }
  return {extent,update,watch,avatarSpace,previewGeometry,syncPreview,cropRatio};
});

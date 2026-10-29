import {readFileSync,writeFileSync} from 'node:fs';
const file='uploads/files/lorefy-app.js';let source=readFileSync(file,'utf8');
if(!source.includes('React.createElement(window.LorefyWorkHeroMedia,')){
 const before='React.createElement("img",{loading:"lazy",decoding:"async","data-fallback":legalCoverOf(m),src:I(m),alt:"",style:{width:"100%",height:"100%",objectFit:"cover"},onError:R})';
 const anchor=source.indexOf('className:"lf-detail-hero"'),start=source.indexOf(before,anchor);
 if(anchor<0||start<anchor||start>anchor+150||source.indexOf('className:"lf-detail-hero"',anchor+1)>=0)throw new Error('Work hero image ownership changed');
 source=source.slice(0,start)+'React.createElement(window.LorefyWorkHeroMedia,{src:I(m),fallback:legalCoverOf(m),workId:m.id,language:W})'+source.slice(start+before.length);writeFileSync(file,source);
}
if(!source.includes('work:m,cover:I(m),fallback:legalCoverOf(m),language:currentUILang()')){
 const before='work:m,cover:I(m),language:currentUILang()',start=source.indexOf(before);
 if(start<0||source.indexOf(before,start+1)>=0)throw new Error('Review cover boundary changed');
 source=source.replace(before,'work:m,cover:I(m),fallback:legalCoverOf(m),language:currentUILang()');writeFileSync(file,source);
}

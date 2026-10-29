/* Bounded bibliographic adapters. Metadata only; no chapters, covers or ratings are invented. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LorefyOpenCatalog=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const T={book:'كتاب',novel:'رواية',web:'ويب نوفل',light:'لايت نوفل',comics:'كوميكس'};
  const uuid=/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
  const text=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,2000);
  const list=v=>Array.isArray(v)?v:[];
  const label=e=>text(e?.labels?.en?.value||e?.labels?.ar?.value);
  const typeKey=v=>({book:T.book,novel:T.novel,'web novel':T.web,'light novel':T.light,comic:T.comics,comics:T.comics})[String(v||'').toLowerCase()]||v;
  const accepts=(requested,actual)=>!requested||/^(all|الكل)$/i.test(requested)||typeKey(requested)===actual;
  function kind(value){
    const s=text(value).toLowerCase();
    if(/comic|graphic novel/.test(s))return T.comics;
    if(/light novel/.test(s))return T.light;
    if(/web.?novel|web fiction|رواية ويب/.test(s))return T.web;
    if(/novel|fiction/.test(s)&&!/non.?fiction/.test(s))return T.novel;
    return T.book;
  }
  function work(fields,source,id,url,license){return Object.assign({
    ar:fields.title,altTitles:[],auth:'',yr:0,r:0,rSrc:'',ch:0,vol:0,pages:0,st:'غير معروفة',
    cover:'',sourceCoverUrl:'',coverMode:'external',synopsis:'',genres:[],sc:{},pop:0,
    baseRatings:0,baseReviews:0,weeklyReads:0,listAdds:0,prog:{ch:0},mySt:null,related:[],
    _apiDynamic:true,metadataOnly:true,_apiSource:source,_apiSourceId:String(id),_apiFetchedAt:new Date().toISOString(),
    pl:source,source:source,sourceUrl:url,sourceLicense:license
  },fields);}
  function mapBookBrainz(row,detail,requested){
    if(!row||!uuid.test(row.bbid)||!['Work','Edition','EditionGroup'].includes(row.entityType))return null;
    detail=detail||{};const title=text(detail.defaultAlias?.name||row.defaultAlias?.name);if(!title)return null;
    const type=kind(detail.workType||detail.editionGroupType||'');if(!accepts(requested,type))return null;
    const entity={Work:'work',Edition:'edition',EditionGroup:'edition-group'}[row.entityType];
    const year=text(detail.releaseEventDate||detail.beginDate).match(/(?:\+00)?((?:18|19|20)\d{2})/);
    return work({id:'bb-'+entity+'-'+row.bbid,title,type,bookBrainzId:row.bbid,catalogLevel:entity,
      auth:list(detail.authorCredits?.names||row.authors).map(a=>text(a.name||a.defaultAlias?.name)).filter(Boolean).join(', '),
      yr:year?Number(year[1]):0,pages:Math.max(0,Number(detail.pages)||0),
      altTitles:list(detail.aliases).map(a=>text(a.name)).filter(Boolean),availableLanguages:list(detail.languages)
    },'BookBrainz',row.bbid,'https://bookbrainz.org/'+entity+'/'+row.bbid,'CC0');
  }
  function values(e,property){return list(e.claims?.[property]).filter(c=>c.rank!=='deprecated').map(c=>c.mainsnak?.datavalue?.value).filter(v=>v!=null);}
  function mapWikidata(entity,entities,requested){
    if(!entity||!/^Q\d+$/.test(entity.id))return null;
    const classes=values(entity,'P31').map(v=>v.id),description=text(entity.descriptions?.en?.value||entity.descriptions?.ar?.value);
    const literary=classes.some(id=>['Q571','Q7725634','Q8261','Q49084','Q277759','Q1667921','Q1004','Q14406742','Q8274'].includes(id));
    if(!literary)return null;
    let type=kind(description);
    if(classes.some(id=>['Q1004','Q14406742'].includes(id)))type=T.comics;
    else if(type===T.book&&classes.includes('Q8261'))type=T.novel;
    if(!accepts(requested,type))return null;
    const title=label(entity);if(!title)return null;
    const aliases=[...Object.values(entity.labels||{}).map(p=>text(p.value)),...Object.values(entity.aliases||{}).flatMap(a=>list(a).map(p=>text(p.value)))];
    const date=values(entity,'P577').map(v=>String(v.time||'').match(/^\+((?:18|19|20)\d{2})-/)).find(Boolean);
    const authors=values(entity,'P50').map(v=>label((entities||{})[v.id])).filter(Boolean);
    return work({id:'wd-'+entity.id,title,ar:text(entity.labels?.ar?.value)||title,type,wikidataId:entity.id,
      catalogLevel:classes.some(id=>['Q277759','Q1667921','Q14406742'].includes(id))?'series':'work',
      altTitles:[...new Set(aliases.filter(a=>a&&a!==title))].slice(0,24),auth:authors.join(', '),yr:date?Number(date[1]):0,
      // Description is an attributed identifying label, not a generated plot summary.
      sourceDescription:description
    },'Wikidata',entity.id,'https://www.wikidata.org/wiki/'+entity.id,'CC0');
  }
  function mapGcd(row,requested){
    const id=String(row?.api_url||'').match(/^https:\/\/www\.comics\.org\/api\/series\/(\d+)\/?$/);
    const title=text(row?.name);if(!id||!title||!accepts(requested,T.comics))return null;
    const collection=/collected|collection|anthology/i.test(String(row.publishing_format||''));
    const year=Number(row.year_began)||0;
    return work({id:'gcd-series-'+id[1],title:title+(year?' ('+year+')':''),ar:title,altTitles:[title],
      type:T.comics,gcdSeriesId:id[1],catalogLevel:collection?'collection':'series',yr:year,
      editionCount:collection?list(row.active_issues).length:0,issueCount:collection?0:list(row.active_issues).length,
      sourcePublisherUrl:/^https:\/\/www\.comics\.org\/api\/publisher\/\d+\/$/.test(row.publisher||'')?row.publisher:''
    },'Grand Comics Database',id[1],'https://www.comics.org/series/'+id[1]+'/','CC-BY-SA-4.0');
  }
  function create(options){
    const fetchJson=options.fetchJson,urlFor=options.urlFor;
    const get=(provider,url)=>fetchJson(urlFor(provider,url));
    async function bookBrainz(query,type,page=1,perPage=6){
      if(!query)return [];
      const size=Math.max(1,Math.min(6,perPage)),p=new URLSearchParams({q:query,size:String(size),from:String((page-1)*size)});
      const json=await get('bookbrainz','https://api.bookbrainz.org/1/search?'+p);
      const rows=list(json.searchResult).filter(r=>uuid.test(r.bbid)&&['Work','Edition','EditionGroup'].includes(r.entityType)).slice(0,4),out=[];
      // A strict sequential bound avoids bursts against the community API.
      for(const row of rows){
        const entity={Work:'work',Edition:'edition',EditionGroup:'edition-group'}[row.entityType];
        const detail=await get('bookbrainz','https://api.bookbrainz.org/1/'+entity+'/'+row.bbid);
        const mapped=mapBookBrainz(row,detail,type);if(mapped)out.push(mapped);
      }
      return out;
    }
    async function wikidata(query,type,page=1){
      if(!query||page>1)return [];
      const language=/[\u0600-\u06ff]/.test(query)?'ar':'en';
      const base='https://www.wikidata.org/w/api.php?',p=new URLSearchParams({action:'wbsearchentities',format:'json',search:query,language,uselang:language,type:'item',limit:'6'});
      const search=await get('wikidata',base+p),ids=list(search.search).map(r=>r.id).filter(id=>/^Q\d+$/.test(id)).slice(0,6);if(!ids.length)return [];
      const entityParams=ids=>new URLSearchParams({action:'wbgetentities',format:'json',ids:ids.join('|'),props:'labels|aliases|claims|descriptions',languages:'en|ar',languagefallback:'1'});
      const result=await get('wikidata',base+entityParams(ids)),entities=result.entities||{};
      const authorIds=[...new Set(Object.values(entities).flatMap(e=>values(e,'P50').map(v=>v.id)).filter(id=>/^Q\d+$/.test(id)))].slice(0,10);
      const authors=authorIds.length?(await get('wikidata',base+new URLSearchParams({action:'wbgetentities',format:'json',ids:authorIds.join('|'),props:'labels',languages:'en|ar'}))).entities||{}:{};
      return ids.map(id=>mapWikidata(entities[id],authors,type)).filter(Boolean);
    }
    async function gcd(query,type,page=1){
      if(!query||(!/^(all|الكل)$/i.test(type)&&typeKey(type)!==T.comics))return [];
      const url='https://www.comics.org/api/series/name/'+encodeURIComponent(query) + '/?page='+Math.max(1,page);
      const json=await get('gcd',url);return list(json.results).slice(0,20).map(r=>mapGcd(r,type)).filter(Boolean);
    }
    return Object.freeze({bookBrainz,wikidata,gcd});
  }
  return Object.freeze({create,mapBookBrainz,mapWikidata,mapGcd});
});

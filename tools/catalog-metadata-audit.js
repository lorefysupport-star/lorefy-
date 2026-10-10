'use strict';
const data=require('../modules/lorefy-catalog-data');
const plan=require('../modules/lorefy-catalog-plan');
function auditMetadata(works) {
  const report={scanned:0,recordsWithMetadataGaps:0,missingAuthor:0,missingCoverReference:0,
    missingSynopsis:0,missingYear:0,missingGenres:0,ambiguousComicTitles:0,unrated:0,byType:{},samples:[]};
  const year=new Date().getUTCFullYear();
  const counters=['missingAuthor','missingCoverReference','missingSynopsis','missingYear','missingGenres','ambiguousComicTitles','unrated'];
  for(const work of works || []) {
    if(!work || typeof work !== 'object') continue;
    const type=plan.normalizeRouteType(work.type);
    const group=report.byType[type] ||= Object.fromEntries(['scanned','recordsWithMetadataGaps',...counters].map(key=>[key,0]));
    const author=String(work.auth || work.author || '').trim();
    const flags={
      missingAuthor:!author || /^(?:unknown|anonymous|various|مجهول|لا يوجد)$/i.test(author),
      missingCoverReference:![work.sourceCoverUrl,work.coverImage,work.sourceCover,work.cover].some(value=>String(value || '').trim()),
      missingSynopsis:data.sourceSynopsis(work,'en') === 'No source synopsis available.',
      missingYear:!(Number(work.yr || work.year)>0 && Number(work.yr || work.year)<=year),
      missingGenres:![].concat(work.genres || work.gen || []).some(value=>String(value || '').trim()),
      ambiguousComicTitles:type==='Comics' && /^(?:batman|superman|spider[- ]?man|x[- ]?men|avengers|wonder woman)$/i.test(String(work.title || '').trim()),
      unrated:!(Number(work.r)>0 && Number(work.r)<=5)
    };
    report.scanned++;group.scanned++;
    const gaps=Object.keys(flags).filter(key=>flags[key] && key !== 'unrated');
    if(gaps.length) {
      report.recordsWithMetadataGaps++;group.recordsWithMetadataGaps++;
      if(report.samples.length<200) report.samples.push({id:work.id,title:work.title,type,gaps,source:work.provenance?.url || work.pl || work._apiSource || ''});
    }
    for(const key of counters) if(flags[key]) {report[key]++;group[key]++;}
  }
  report.limitations=['Cover references are counted, not remotely validated.',
    'Unrated works are not automatically defective; source ratings must never be invented.',
    'Ambiguous comic titles require provider identity checks, not title-only merging.',
    'This is a metadata audit, not a full-text content or human-authorship certification.'];
  return report;
}
module.exports={auditMetadata};

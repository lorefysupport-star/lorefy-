'use strict';
const policy = require('../modules/lorefy-catalog-policy');
const {TYPE_LABELS} = require('./catalog-expansion-core');

function classify(record) {
  const labels=(record.subjects || []).map(x=>String(x).toLowerCase());
  const has=pattern=>labels.some(x=>pattern.test(x));
  if(has(/history and criticism|criticism and interpretation|study and teaching|bibliography/)) return 'Book';
  if(has(/\bmanhwa\b|korean (?:comics|webtoons)/)) return 'Manhwa';
  if(has(/\bmanhua\b|chinese comics/)) return 'Manhua';
  if(has(/light novels?/)) return 'Light Novel';
  if(has(/web novels?|web fiction|online fiction/)) return 'Web Novel';
  if(has(/\bmanga\b|japanese comics/)) return 'Manga';
  if(has(/graphic novels?|comic books|comic strips|bandes dessin/)) return 'Comics';
  if(has(/short stories|poetry|drama|literary criticism/)) return null;
  if(has(/\bfiction\b|\bnovels\b/)) return 'Novel';
  if(has(/history|philosophy|science|biography|mathematics|religion|education|medicine|economics|psychology|travel|politics|technology/)) return 'Book';
  return null;
}
function parseDumpLine(line, kind='work') {
  const columns=line.split('\t');
  if(columns.length!==5 || columns[0]!==`/type/${kind}`) return null;
  try { return JSON.parse(columns[4]); } catch { return null; }
}
function publicationYear(value) {
  const match=String(value || '').match(/\b(1\d{3}|20\d{2})\b/);
  return match ? Number(match[1]) : 0;
}
function candidate(record) {
  if(!record || !/^\/works\/OL\d+W$/.test(record.key || '') || !record.title) return false;
  const year=publicationYear(record.first_publish_date);
  const type=classify(record);
  const publicationEvidence=type==='Comics' ? !year || year<=new Date().getUTCFullYear() : year>0 && year<=2021;
  return publicationEvidence && (record.covers || []).some(x=>Number(x)>0) && (record.authors || []).length>0 && Boolean(type)
    && !policy.isExcludedWork(record) && !policy.isExplicitWork({genres:record.subjects}) && !policy.isAiGeneratedWork({tags:record.subjects});
}
function mapWork(record, authors) {
  if(!candidate(record)) return null;
  const authorKeys=(record.authors || []).map(x=>x.author && x.author.key).filter(Boolean);
  const names=authorKeys.map(key=>authors.get(key)?.name).filter(Boolean);
  if(names.length!==authorKeys.length || !names.length) return null;
  const type=classify(record);
  const sourceId=record.key.split('/').pop();
  const cover=record.covers.find(x=>Number(x)>0);
  const description=typeof record.description==='string' ? record.description : record.description?.value || '';
  const subtitle=String(record.subtitle || '').trim();
  const title=subtitle && !record.title.toLowerCase().includes(subtitle.toLowerCase()) ? `${record.title}: ${subtitle}` : record.title;
  return {id:`ol-${sourceId}`,title,ar:title,altTitles:title===record.title?[]:[record.title],auth:names.join(', '),authorKeys,
    authorAliases:authorKeys.flatMap(key=>authors.get(key)?.alternate_names || []),
    type:TYPE_LABELS[type],yr:publicationYear(record.first_publish_date),sourceCoverUrl:`https://covers.openlibrary.org/b/id/${cover}-L.jpg`,
    cover:'',coverMode:'external',r:0,rSrc:'',baseRatings:0,baseReviews:0,pop:0,
    st:'\u0645\u0633\u062a\u0648\u0631\u062f\u0629',ch:0,vol:0,pages:0,sc:{},prog:{ch:0},mySt:null,
    synopsis:description,genres:record.subjects || [],pl:'Open Library',_apiSource:'Open Library',_apiSourceId:sourceId,
    provenance:{url:`https://openlibrary.org${record.key}`,method:'monthly-work-dump',publicationCutoff:type==='Comics'?null:2021,
      aiScreening:type==='Comics'?'declared-tags-only':'declared-tags-and-pre-2022-cutoff-not-authorship-certification'}};
}
module.exports={classify,parseDumpLine,publicationYear,candidate,mapWork};

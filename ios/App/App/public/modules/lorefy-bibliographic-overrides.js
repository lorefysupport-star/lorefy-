(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LorefyBibliographicOverrides = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  // Publisher metadata, not book text. Collection form is checked against each
  // detail page: the publisher's broad "novels" navigation is not a format.
  var entries = [
    ['الحرافيش','39429258'],['بين القصرين','29179502'],['قصر الشوق','85847308'],
    ['السكرية','18636847'],['اللص والكلاب','85802403'],['ثرثرة فوق النيل','96941592'],
    ['أولاد حارتنا','94868139'],['المرايا','69730604'],['زقاق المدق','62575295'],
    ['عبث الأقدار','24863903'],['القاهرة الجديدة','74604738'],
    ['السمان والخريف','48575359','Fiction',1962,'رواية عن فقدان النفوذ والاغتراب والتحولات الاجتماعية عقب ثورة يوليو.','رواية'],
    ['الطريق','57385184'],['الشحاذ','41828359'],
    ['الحب تحت المطر','73160631','Fiction',1975,'رواية تتتبع شخصيات وعلاقات متشابكة في مصر بعد هزيمة يونيو.','رواية'],
    ['الكرنك','64160824'],
    ['عصر الحب','63729426','Fiction',1980,'رواية عن الحب والصداقة والكراهية والمصائر الإنسانية في الحارة المصرية.','رواية'],
    ['أفراح القبة','63827462'],
    ['ليالي ألف ليلة','30519685'],['الباقي من الزمن ساعة','37390524'],
    ['العائش في الحقيقة','85292717'],['يوم قتل الزعيم','94694257'],
    ['حديث الصباح والمساء','86838270'],
    ['قشتمر','60480728','Fiction',1988,'رواية عن خمسة أصدقاء وتغيرات المجتمع المصري عبر سنوات طويلة.','رواية'],
    ['ميرامار','85804642'],
    ['رادوبيس','68591480'],['كفاح طيبة','82409531'],['حضرة المحترم','48639403'],
    ['خان الخليلي','92030593'],['السراب','90474947'],['بداية ونهاية','81514680'],
    ['حكايات حارتنا','27250583','Literature',1975,'ثمان وسبعون حكاية تستعيد الحارة وسكانها بعين الطفولة وذاكرة الكاتب.'],
    ['قلب الليل','15704927'],['رحلة ابن فطومة','69792830'],
    ['همس الجنون','71628490','Short Stories',0,'مجموعة من ثماني وعشرين قصة تتناول وجوه الجنون والحب والجوع وتناقضات المجتمع.'],
    ['حكاية بلا بداية ولا نهاية','47518047','Short Stories',1971,'خمس قصص مترابطة في رؤيتها للحياة واستمرار الصراع بين السلطة والمعرفة.'],
    ['شهر العسل','73904814','Short Stories',1971,'قصص رمزية ساخرة توظف أحداثًا غرائبية لاستكشاف الصراعات الإنسانية والاجتماعية.'],
    ['الجريمة','47303707','Short Stories',1973,'مجموعة قصصية ومسرحية تتناول الفساد وتبعات الهزيمة والتحولات السياسية والاجتماعية.'],
    ['الشيطان يعظ','58035080','Short Stories',0,'قصص رمزية تستكشف آثار الانفتاح الاقتصادي والظلم والتغيرات الاجتماعية.'],
    ['رأيت فيما يرى النائم','86840536','Short Stories',1982,'قصص وأحلام تستكشف الخير والشر وقبول الذات ومراحل الحياة.'],
    ['صباح الورد','17908281','Short Stories',0,'ثلاث قصص تستعيد ذكريات الحارة والعباسية والأماكن التي شكلت عالم الكاتب.'],
    ['أصداء السيرة الذاتية','82695209','Biography',0,'نصوص قصيرة وتأملات تستعيد خبرات الكاتب وذكرياته ورؤيته للحياة.'],
    ['أحلام فترة النقاهة','69246081','Literature',0,'نصوص سردية مكثفة تمزج الأحلام والذاكرة والتأملات الإنسانية والفلسفية.'],
    ['القرار الأخير','37158095','Short Stories',1996,'قصص عن الطفولة والحنين والتحولات الاجتماعية وآثار الانفتاح الاقتصادي.'],
    ['فتوة العطوف','18686373','Short Stories',2001,'تسع قصص قصيرة تستكشف المصائر الإنسانية من خلال نهايات حاسمة.'],
    ['الفجر الكاذب','42814840','Short Stories',1989,'ثلاثون قصة قصيرة عن القلق واليأس والموت والحياة والزمن.'],
    ['دنيا الله','14831357','Short Stories',1963,'أربع عشرة قصة تتأمل الحياة والموت والأسئلة الوجودية والعلاقات الإنسانية.'],
    ['الحب فوق هضبة الهرم','19069697','Short Stories',1979,'قصص ترصد أثر التحولات الاقتصادية على الحب والزواج والطبقة الوسطى.'],
    ['بيت سيئ السمعة','79157526','Short Stories',0,'حكايات رمزية تتأمل تناقضات الحياة والسلطة والمجتمع.'],
    ['خمارة القط الأسود','85362902','Short Stories',0,'قصص رمزية عن اليأس واللامبالاة والضمير الإنساني في مجتمع مضطرب.'],
    ['تحت المظلة','84616493','Short Stories',0,'مجموعة قصصية ومسرحية تستكشف الفوضى واللامبالاة وآثار هزيمة يونيو.'],
    ['أمام العرش: حوار مع رجال مصر من مينا حتى أنور السادات','42413649','Literature',0,'حوار تخييلي يحاكم حكام مصر ويستعرض تجارب الحكم عبر العصور.'],
    ['التنظيم السري','53135869','Short Stories',0,'قصص رمزية عن الحرية والعدالة وصراعات التيارات الفكرية والسياسية.'],
    ['صدى النسيان','82513953','Short Stories',0,'قصص تستكشف تفاصيل الحارة المصرية والذاكرة والتسلط والتناقضات الإنسانية.'],
    ['أحلام فترة النقاهة: الأحلام الأخيرة','15085197','Literature',0,'نصوص وأحلام نشرت بعد رحيل الكاتب وتكمل تأملاته في الحياة والنفس الإنسانية.']
  ].map(function (row) {
    return {title:row[0],auth:'نجيب محفوظ',publisherId:row[1],genre:row[2] || '',
      type:row[5] || (row[2] ? 'كتاب' : ''),yr:row[3] || 0,synopsis:row[4] || '',
      publisherUrl:'https://www.safahat.org/books/' + row[1] + '/',
      coverUrl:'https://downloads.hindawi.org/covers/svg/270x360/' + row[1] + '.svg?v=5'};
  });
  function normalize(value) {
    return String(value || '').normalize('NFKD').replace(/[\u064b-\u065f\u0670\u0640]/g,'')
      .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim().toLowerCase();
  }
  var libraryVerified = [{title:'أرض البرتقال الحزين',auth:'غسان كنفاني',type:'كتاب',genre:'Short Stories',
    bibliographyUrl:'https://library.alistiqlal.edu.ps/book-22595-25.html'}];
  var publisherVerifiedOther = [['أديب','63728685','رواية','Fiction'],
    ['دعاء الكروان','13052715','رواية','Fiction'],['الحب الضائع','48395842','كتاب','Short Stories']].map(function (row) {
    return {title:row[0],auth:'طه حسين',type:row[2],genre:row[3],
      publisherUrl:'https://www.safahat.org/books/'+row[1]+'/',
      coverUrl:'https://downloads.hindawi.org/covers/svg/270x360/'+row[1]+'.svg?v=5'};
  });
  var byTitle = new Map(entries.concat(libraryVerified,publisherVerifiedOther).map(function (entry) { return [normalize(entry.title),entry]; }));
  function find(work) {
    if (!work || !/^(?:رواية|كتاب|Novel|Book)$/.test(String(work.type || ''))) return null;
    var author = normalize(work.auth || work.author).split(' ').sort().join(' ');
    var title = String(work.title || '').replace(/[،,]\s*كتاب\s+إلكتروني\s*$/,'');
    var entry = byTitle.get(normalize(title));
    if (!entry || author !== normalize(entry.auth).split(' ').sort().join(' ')) return null;
    return entry;
  }
  function apply(work) {
    var entry = find(work);
    if (!entry) return false;
    var changed = false;
    if (work.title !== entry.title) {
      work.altTitles = [...new Set([...(work.altTitles || []),work.title])];
      work.title = entry.title;
      work.ar = entry.title;
      changed = true;
    }
    if (entry.type && work.type !== entry.type) {
      work.type = entry.type;
      work.catalogCorrection = 'publisher-verified-literary-form';
      changed = true;
    }
    if (entry.genre && !(work.genres || []).includes(entry.genre)) {
      work.genres = [...new Set([...(work.genres || []).filter(function(g){return entry.type !== 'كتاب' || g !== 'Fiction';}),entry.genre,'Arabic'])];
      changed = true;
    }
    // Only fill absent publisher data; never replace a user's personal artwork.
    if (!work.sourceCoverUrl && entry.coverUrl) { work.sourceCoverUrl = entry.coverUrl; changed = true; }
    if (!work.synopsis && entry.synopsis) {
      work.synopsis = entry.synopsis;
      work.synopsisAr = entry.synopsis;
      work.synopsisAttribution = entry.publisherUrl;
      changed = true;
    }
    work.provenance = {...work.provenance,bibliographyVerifiedAt:'2026-10-08'};
    if (entry.publisherUrl) work.provenance.publisherUrl = entry.publisherUrl;
    if (entry.bibliographyUrl) work.provenance.bibliographyUrl = entry.bibliographyUrl;
    if (changed) {
      work._indexed = false;
      delete work._tasteGenreKeys;
      delete work._queryIndex;
    }
    return changed;
  }
  return {entries:entries,find:find,apply:apply};
});

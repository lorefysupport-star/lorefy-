---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"17a43d2","verified_on":"2026-10-18","related":["[[bugs/LF-054-Catalog-Search-Deadline]]"]}
---
# مهلة Worker وفهرس البحث البديل

اختبار9حالات قبل الإصلاح (من نسخة17a43d2):7فشل و2نجاح. بعد الإصلاح
128/128 مرتبطة، تشمل retry/search/safety/aliases/worker identity/parity.
الحدود20ثانية لكل مرحلة، لا مهلة إجمالية لكل شاشة البحث أو raw shard.

الحالات: Worker صامت، نجاحه وإلغاء المؤقت، رسائل/خطأ Worker قديم بعد
استبداله، fetch معلق وإلغاء signal، جسم JSON معلق، مهلة المرحلتين ثم
retry ناجح، نجاح/رفض fallback يحرر المؤقت، timeout قديم بعد بحث ناجح،
وتفريغ عدة طلبات للـWorker المتعطل. الأجزاء والتقدم والطبعات لم تتغير.

Chrome مستقل بثلاث حقن أعطال: Worker صامت إلى fallback ناجح؛ Worker
وفهرس معلقان إلى خطأ ثم retry؛ دون Worker وفهرس معلق إلى خطأ ثم retry.
قُصّرت المهلة إلى80ms داخل fixture فقط؛ لا ادعاء قياس سرعة شبكة/جهاز
حقيقي. ثبتت searching=false وabort/terminate المناسبتان ونجاح retry.

ثلاثة أصول فقط متطابقة SHA-256 في الأشجار الثلاث: loader/index/sw،
cachev504؛ workerVersion لملفي Worker القائمين محفوظ كما هو لأنهما
لم يتغيرا. لا مولد كتالوج أو بناء native أو استخدام خدمة/حساب حي.

الدليل خارج Git: D:/LorefyDevelopment/QA/remaining-repairs-20261017/
search-deadline-canonical-before-tests.txt، search-deadline-after-tests.txt،
search-deadline-focused-tests.txt، search-deadline-browser.json و
search-deadline-parity.json.

[[bugs/LF-054-Catalog-Search-Deadline]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

- LF-054: **1903/1903** كاملة، صفر فشل، exit 0؛ search-deadline-full-tests.txt (183712ms). [[sessions/2026-10-18-Catalog-Search-Deadline]]

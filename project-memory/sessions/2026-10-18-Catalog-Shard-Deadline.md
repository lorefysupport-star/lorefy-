---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"2839708","verified_on":"2026-10-18","related":["[[bugs/LF-055-Catalog-Shard-Deadline]]"]}
---
# تحميل أجزاء الكتالوج لا يحتجز الطابور بلا نهاية

8 اختبارات regression:3نجاح و5فشل قبل المصدر؛ بعد136/136 مرتبطة.
تشمل الجزء الصامت، retry مع load/error قديمين، تنظيف مؤقت النجاح/الفشل،
مشاركةpromise للجزء نفسه، استقلال جزأين، searchError/hasMore وretry،
وتقدم طابور loadType بعد صمت أول جزء.

fixture الطابور الأول استعمل loadFormat، الذي يطلب جزءاً أولياً واحداً
فقط؛ صحح إلى loadType لطلب الجزأين. أعدت الاختبار المصحح على مصدر
HEAD2839708 المحفوظ خارج Git:5فشل و3نجاح كما قبل. لا إسقاط لفحص الطابور.

Chrome معزول: حُجب HTTPpart15 (Allergic) بلا جواب، وقُصرت مهلة
الجزء إلى80ms في fixture فقط. انتهى التحميل إلى خطأ قابل للمحاولة؛
عنصرscript الفاشل أزيل وloading خالية. أُلغي الحجب ونجح retry بتحميل15،
searchError=false وsearching=false ومحاولتان. لا قياس لشبكة/جهاز حقيقي.
المهلة20ثانية لكل جزء؛ دفعة متعددة الأجزاء ليست لها مهلة إجمالية هنا.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/
shard-deadline-corrected-before-tests.txt وshard-deadline-after-tests.txt،
shard-deadline-focused-tests.txt وshard-deadline-browser.json.
ثلاثة أصول loader/index/sw متطابقة SHA-256: shard-deadline-parity.json،
cachev505. لا تحديث كتالوج/بناء native/خدمة/حساب حي.

[[bugs/LF-055-Catalog-Shard-Deadline]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

- LF-055: **1911/1911** كاملة، صفر فشل، exit0؛ shard-deadline-full-tests.txt. [[sessions/2026-10-18-Catalog-Shard-Deadline]]

---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"d3dafa7","verified_on":"2026-10-18","related":["[[bugs/LF-056-Search-Field-Lifecycle]]"]}
---
# ثبات الكتابة في البحث واتجاه النص والمسح

المتصفح قبل:ENبقيdirection=rtl وزر المسح بلا اسم، بحجم44×44 قائم.
اختبارات الحقل6:5فشل و1نجاح. اختبارcapture:3ضوابط ناجحة وحالتان
فاشلتان قبل. لم يكف تغيير dir: الكتابة تُفقد بسبب إعادة إنشاء SearchBox
وتحديث الأب من document capture قبل React onChange. تجربة تشخيصية
قصيرة أخرت handler فقط وأثبتت بقاء Berserk؛ حالات المرور النهائية
تستعمل المصدر المعدل نفسه دون حقن تشخيصي.

التنفيذ يحافظ على wrapper مستقر في الاستعمالين القديمين، ويجدول البحث
بعد استهلاك event، ويرفض الحقل المفصول. المتصفح النهائي:4مرات(AR/EN
واجهة × عربي/لاتيني نص) حافظت على value/focus بعد __lorefyRefresh
والتزمت URL بquery، واتجاه صحيح. مسح في اللغتين يعيد التركيز ويلغي
النص.144/144 مرتبطة، مع إبقاء debounce200ms وإلغائه عند المسح.

محاولة الوصول لمحرر المفضلة القديم اصطدمت بالمحرر الحالي الذي فتحه
تبويب المفضلة بالفعل؛ كانت مهلة أداة، لا دليل فشل للتطبيق. استُعيد
الفحص بسياق مستقل ومهلات4.5ثوان: .lf-top-works-editor-search الحالية
تحفظBerserk والتركيز وخط16، لكنها تظلRTL للنص اللاتيني. هذا حقل
مستقل لم يُعدّل هنا؛ يحتاج متابعة واضحة، وليس حالة نجاح لاتجاهه.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/
search-field-canonical-before-tests.txt، search-field-capture-before-tests.txt،
search-field-focused-tests.txt، search-field-browser-before.json،
search-field-refresh-before.json، search-field-browser.json،
search-field-current-favorites-browser.json وsearch-field-parity.json.
أربعة أصول app/loader/index/sw متطابقةSHA-256 في الأشجار الثلاث،
cachev506. لا حساب حقيقي أو بناء native أو اعتماد VoiceOver بالجهاز.

[[bugs/LF-056-Search-Field-Lifecycle]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

الفحص الكامل الأول1916/1919:3فشل من fixture لغة البحث الذي يستخرج
fragment دون تعريف LorefyStableInline. أضيف المحول الفعلي من صدر
المصدر إلى سياقfixture، مع بقاء assertions اللغة والأفعال كما هي.
20/20 لحالات اللغة والحقل وcapture بعد التصحيح؛ يعاد الكامل في
search-field-full-tests-final.txt.

- LF-056: **1919/1919** كاملة نهائية، صفر فشل، exit0؛ search-field-full-tests-final.txt (177119ms). [[sessions/2026-10-18-Search-Field-Lifecycle]]

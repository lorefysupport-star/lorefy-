---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"41510ed","verified_on":"2026-10-18","related":["[[bugs/LF-058-Search-Typo-Suggestions]]"]}
---
# اقتراحات تصحيح البحث العربي والإنجليزي

مرجع مستقل للنسخة41510ed خارج المستودع أثبت0نتائج/0اقتراح لـOne Peice.
أعيدت30حالة الاختبار النهائية على المرجع:27فشل و3ضوابط ناجحة.
في المحاولة الأولى كان برسيرك في fixture متوقعاً كتصحيح، لكنه alias دقيق
قائم؛ استبدل بحذف حرف من ساعي البريد وأضيف alias كضابط. لم يتغير matcher.

بعد الإصلاح131/131 مركزة،1949/1949 كاملة (169470ms،exit0).
6حالات Chrome390×844: استبدال One Peice وHnuter، وتصحيح موسم الهجرة
الى الشماا بالعربية (بطاقتان بهويتين مستقلتين)، وinline وformat في
Explore، ثم نص غير متعلق بلا اقتراحات متبقية. اختيار التصحيح يحافظ
على النص الصحيح؛ main وinline يعيدان التركيز، وزر الاقتراح يتجاوز44px.
لا حفظ أو تغيير بيانات حساب حقيقي؛ الجلسات demo مع منع الخوادم الخارجية.

قياس محلي للفهرس121920: أول exact+suggestion نحو14871ms مع بناء
الفهارس القائم، وثلاثة استعلامات دافئة2181–2308ms في Node. ليس
قياس جهاز أو اعتماد سرعة؛ التعافي من أخطاء متعددة/الكتابة القصيرة
وفهرسة المؤلفين التقريبية غير مطبقة.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/
search-suggestions-{corrected-before-tests,focused-tests,full-tests}.txt،
search-suggestions-browser-{before,after}.json،search-suggestions-ar.png،
search-suggestions-catalog-timing.json وsearch-suggestions-parity.json.
ثمانية أصول متطابقةSHA-256 في المصدر وios-web وnative public،cachev508.
raw catalog version والبيانات لم يتغيرا؛ لا build أو خدمة أو migration.

[[bugs/LF-058-Search-Typo-Suggestions]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

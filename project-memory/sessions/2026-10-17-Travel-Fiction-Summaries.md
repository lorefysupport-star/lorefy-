---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"446b544","verified_on":"2026-10-17","related":["[[bugs/LF-049-Travel-Fiction-Summaries]]"]}
---
# عينة متابعة: رحلات ورواية ومذكرات مصورة

ثلاثة أعمال من مؤلفين مختلفين في العينة الثابتة. الغياب ثبت بعد hydrate؛
editorial-next2-hydrated-before.json. 6 حالات (3 فشلاً قبل)، و73/73 مرتبطة
تشمل الأوصاف السابقة ومصدرها وتوافق worker/shards والفهرس وعزل الاختبارات.

المصادر المقروءة في 17 أكتوبر:
- [البحر وسردينيا، هنداوي](https://www.safahat.org/books/59728170/)
- [كتاب الأوهام، هنداوي](https://www.safahat.org/books/49140393/)
- [El Deafo، ABRAMS](https://www.abramsbooks.com/product/el-deafo_9781419712173/)

Chrome المحلي المعزول أظهر الوصف ورابطه لكل عمل بالعربية والإنجليزية:
6/6 صفحات، من دون حسابات إنتاج أو اختبار تحميل أغلفة.
الأدلة D:/LorefyDevelopment/QA/remaining-repairs-20261017/editorial-next2-before.txt
وeditorial-next2-focused.txt وeditorial-next2-browser.json.

تحديث مشتق محدد: runtime part04 لسجل El Deafo فقط (3 حقول). الفحص القبلي
أعاد حساب بصمة الـ163 جزءاً ووافق الـmanifest قبل التعديل. لا تغير هويات
أو قيم خارج الحقول، ولا كتابة للأجزاء الـ162 الأخرى. الحجم تحرك بفارق
بايتات الجزء فقط، والفهرس تغير sourceHash فقط؛ count بقي 121920.
editorial-next2-catalog-preflight.json وeditorial-next2-artifact-diff.json.

cache v499. ثمانية أصول محددة متطابقة SHA-256 عبر النسخ الثلاث؛ لا مولد
كتالوج عام أو prepare أو native build. **1766/1766** كاملة، صفر فشل، exit 0 (58320ms).
الدليل editorial-next2-full-tests.txt. الملفات المراقبة ثابتة البصمة وmtime
قبل/بعد؛ editorial-next2-files-before/after.json.
المصادر لا تغلق بقية العينة والطبعات والحقوق أو فحص الجوال والخادم.

[[bugs/LF-049-Travel-Fiction-Summaries]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

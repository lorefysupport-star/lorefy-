---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"e350551","verified_on":"2026-10-18","related":["[[bugs/LF-059-All-Format-Search]]"]}
---
# بحث جميع الأنواع في استكشف

baseline المتصفح علىe350551: The Lord of the Rings غير موجود ضمن
الأعمال المحملة؛ state.loaded=[5] وsearchType=الكل و0نتائج دون خطأ.
الفهرس نفسه يعيد جزأين معAll ولا شيء معالكل. بعد الإصلاح حمل الجزأين
1و14 وعرض نتيجتين مستقلتين: The Lord of the Rings وNovels (Hobbit /
Lord of the Rings). لا استنتاج أنهما طبعتان من الرقم أو العنوان.

11 اختباراً جديداً(7فشل/4ضوابط قبل)،179/179 مركزة،1960/1960 كاملة
(69675ms،exit0). يغطي البحث الأنواعالثمانية وقيود النوعالعربي/الإنجليزي،
تصحيح عنوان رواية، قمع الاقتراح عند نتيجة دقيقة غيرمانجا، وعدم توسيع
bootstrap التصفح.4حالات Chrome390×844: exact وتصحيحفيAR/EN؛
لا حساب مستخدم حقيقي أو خدمة خارجية.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/
search-all-format-before.json،search-all-formats-{before-tests,focused-tests,
full-tests}.txt،search-all-formats-browser-{before,after}.json و
search-all-formats-parity.json.6أصول متطابقةSHA-256 في3أشجار،cachev509.
لا تعديل بيانات الفهرس أو runtime أو build أو خدمة أو migration.

[[bugs/LF-059-All-Format-Search]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

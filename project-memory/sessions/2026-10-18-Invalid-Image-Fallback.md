---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"ef04d86","verified_on":"2026-10-18","related":["[[bugs/LF-063-Invalid-Image-Fallback]]"]}
---
# فشل الصورة البديلة بعد فشل الأصل

مرجع ef04d86 محفوظ خارج المستودع. 11حالة جديدة:10تفشل و1ضبط
على المرجع،مع17ضابطًا سابقًا(28إجمالًا). بعد الإصلاح تمر كلها،
وتغطي cover/avatar،مهلة البديل ونجاحه وإزالته،التبديل إلى remote/blob،
lazy وmetadata وsrcset،وعدم توليد اختيار لمحدد الأغلفة.

5حالات Chrome390×844 في ديمو محلي وشبكات خارجية محظورة:
بديلPNG تالف للغلاف وللصورة الشخصية (قبل الإصلاحnaturalWidth=0؛
بعده SVG له أبعاد فعلية)،بديلSVG سليم محفوظ،picker بخطأ واحد دون
صورة مولدة،ومالك يختار صورة جديدة أثناء خطأ البديل فتظل صورته.
صورتاbefore وصورتاafter محفوظة محليًا. SVG المستخدم اختبار مصطنع.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/
invalid-fallback-{before-tests,focused-tests,full-tests}.txt،
invalid-fallback-browser-{before,after}.json،invalid-fallback-scope.json
وinvalid-fallback-parity.json. 188/188 اختبارًا مرتبطًا،2048/2048 كاملة،صفر فشل،exit0،220302.6715ms.
scope يثبت بقاء index خارجinstallImageResilience مطابقًا للمرجع؛
SHA-256 يثبت index.html وsw.js في الأشجار الثلاثة؛cachev513.
لا تغييرappJS/الكتالوج أو خدمة أو بناء جديد؛الصور والأذونات والرفع
الفعلي على الجهاز والخدمة تحتاج فحصًا مستقلًا.

[[bugs/LF-063-Invalid-Image-Fallback]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

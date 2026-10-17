---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"ace871c","verified_on":"2026-10-17","related":["[[bugs/LF-047-Source-Summary-Batch]]"]}
---
# أوصاف ثلاثة أعمال أخرى في القوائم المتنوعة

عينة 71 بطاقة من الجولة السابقة لم تُعد تصنيفاً كاملاً لكل الكتالوج.
الدفعة الحالية كتاب الفيزياء الفلكية ورواية فارس بلا وجود وكوميكس Nimona،
بمؤلفين ومصادر مختلفة. اختبار 6 حالات: 3 فشلت قبل، و61/61 مرتبطة أولياً.
الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/editorial-next-before.txt
وeditorial-next-focused.txt؛ hydrated-before.json وeditorial-next-browser.json
في المجلد نفسه يثبتان الغياب أولاً ثم ظهور العربية في DOM الفعلي للأعمال الثلاثة.

الملخصات AR/EN صياغة تحريرية قصيرة من مصادر قُرئت 17 أكتوبر:
- [الفيزياء الفلكية، هنداوي](https://www.safahat.org/books/58169180/)
- [فارس بلا وجود، هنداوي](https://www.safahat.org/books/70959593/)
- [Nimona، جهة National Book Awards](https://www.nationalbook.org/books/nimona/)

صفحة HarperCollins متاحة لكن الوصف لم يظهر في قارئ الويب؛ لم يُنسب إليها
نص لم يُقرأ. رابط المصدر الفعلي محفوظ في synopsisAttribution، ورابط الناشر
القائم في editorialSource بقي كما هو. لا قيم تقييم/شعبية مختلقة ولا تعيين
سنة الأصل لسجل ترجمة مجهول الطبعة.

cache v497؛ picks/loader/worker/index/sw الخمسة متطابقة SHA-256 في النسخ
الثلاث؛ data version للأجزاء باقٍ وworkerVersion مستقل. الفحص الكامل موضح أدناه. لا native build أو حكم على كل الوصف والحقوق.

[[bugs/LF-047-Source-Summary-Batch]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

## دقة اسم الإسناد

المرجع قد يكون ناشراً أو جهة جائزة، لذلك صار النص «نبذة تحريرية · المصدر»
وEditorial summary · Source مع بقاء URL وrel الآمنين. حالتان AR/EN فشلتا
قبل التصحيح؛ source-attribution-before.txt. لا ترجمة لنص المصدر أو اسم العمل.
الأوصاف الإنجليزية الثلاثة ظهرت في التطبيق أيضاً (editorial-next-browser-en.json).
تهيئة الاختبار تستخدم JSON للغة وفق عقد التخزين، لا القيمة الخام.
الفحص الكامل قبل تصحيح التسمية **1757/1757** (241781ms)، محفوظ في
editorial-next-pre-label-full-tests.txt. التصحيح النهائي يعيد الكامل.
cache النهائي v498 وإجمالي الأصول المتغيرة ستة بما فيها main app.

## ملفات runtime التي أعاد الاختبار توليدها

آخر كامل **1758/1759**؛ الفشل الوحيد مقارنة نسخة Xcode للفهرس. اختبار
prepares a native runtime config كان يشغّل tools/prepare-ios-web.mjs على
المشروع، ما أعاد توليد runtime/index ونسخ ios-web. فُحصت الفروق قبل أي
مزامنة: part02 له 1321 سجلاً كما كان؛ تغيّر Nimona فقط في synopsisAr/En
والإسناد. الإجمالي 121920 كما كان، وsearch index تغيّر sourceHash فقط،
والـmanifest تغيّرت بصمته وحجم runtime فقط. لا تغيير هويات أو صفوف أخرى.

نُسخت الملفات الثلاثة المحددة إلى النسختين وتطابقت SHA-256؛ الدليل
editorial-next-catalog-artifacts.json. اختبار parity نفسه الآن **1/1**
بـtest-name-pattern دون تشغيل prepare، و30/30 إضافية لعقود الوصف والفهرس
والكاش. المجموعة الأوسع **111/111**. لا نعيد تسمية الكامل الفاشل كناجح؛
عزل الاختبار عن المشروع هو المتابعة التالية قبل تكرار full.
الدليل editorial-next-asset-parity.txt وeditorial-next-final-focused.txt
وeditorial-next-full-tests.txt. صار التغيير تسعة أصول محددة، لا تركيب native.

## Integrated confirmation after test isolation

LF-048 eliminated the preparation side effect; current-source full **1760/1760**
passed (58428ms) with nine monitored files unchanged in content and mtime.
[[sessions/2026-10-17-Test-Preparation-Isolation]]. This includes the reviewed source summaries,
AR/EN source label and all nine selectively synchronized artifacts.

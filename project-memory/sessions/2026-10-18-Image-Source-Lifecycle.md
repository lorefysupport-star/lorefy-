---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"1b56a19","verified_on":"2026-10-18","related":["[[bugs/LF-060-Image-Source-Lifecycle]]"]}
---
# إعادة المحاولة ومؤقتات الصور العامة

17 regression نهائية على مرجع1b56a19:14فشل/3ضوابط. بعد المصدر
117/117 مركزة،1977/1977 كاملة (172444ms،exit0). fixture الأداء القديم
أضيف له clearTimeout وremoveEventListener لأن المتصفح الحقيقي يوفّرهما؛
بقيت شروط منع layout المتزامن وdocument rescan واختيار الغلاف كما هي.

Chrome390×844 حقيقي مع demo ومنع الخدمات الخارجية، وروابطHTTP
محلية مصطنعة يحجزها/يفشلها الاختبار. قبل: مؤقتA عند5.5s استبدلB
الذي بدأ4s؛ بعد بقيB حتى موعده الخاص. retry بعد خطأين بقيremote
مكسوراً قبل وأصبحSVG صالحاً بعد فيAR/EN. picker أخطاؤه2قبل و1بعد
ولا صورة مولدة؛4حالات نهائية ناجحة على المصدر النهائي.

محاولة البداية استعملت مساراً نسبياً خارج نطاق الحارس، ثم صحح إلى
HTTP قبل إثبات العيب. انتظار عداد خطأين في تجربةEN كان fixture غير
صالح للفشل السريع؛ اعتمدت الحالة النهائية للصورة الصالحة بدلاً منه.
أبقيت مهلة الفشل العادي لإتاحة callback المالك الأصلي؛ فحص كامل أول
أوقف عمدًا بعد تعديل هذا المسار، ولم يحسب نجاحاً. الفحص النهائي أعلاه
بدأ من المصدر النهائي. لا صورة مستخدم أو هاتف أو مصادقة خدمة في الدليل.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/
image-lifecycle-final-before-tests.txt،image-lifecycle-focused-tests-final.txt،
image-lifecycle-full-tests-final.txt،image-lifecycle-browser-{race,retry,
picker,final}.json وimage-lifecycle-parity.json. index/sw متطابقان
SHA-256 في الأشجارالثلاث،cachev510. بقية الأصول والكتالوج لم تتغير.
الصورة البديلة الفاسدة نفسها، أذوناتPhotos، upload حي، وحقوق الأغلفة
ليست معتمدة بهذه الدفعة؛ لا build أو نشر خدمة.

[[bugs/LF-060-Image-Source-Lifecycle]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

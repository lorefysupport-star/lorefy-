---
{
  "kind": "bug", "id": "LF-003", "status": "needs-device", "priority": "P2",
  "area": "appearance", "date": "2026-10-15", "reviewed_on": "2026-10-15",
  "source_commit": "1950599", "source_verified": true,
  "device_verified": false, "service_verified": false,
  "requires_device": true, "requires_service": false,
  "verified_on": null,
  "next_action": "عند السماح بنسخة لاحقة: فحص كل إطار على الجوال لصاحب الحساب والزائر"
}
---
# LF-003: تحقق الإطارات على جهاز مطابق

## الحقيقة والحد

الدليل التاريخي في [[12-Device-Repairs#LF-003: حدود تحقق الإطار]].
اختبارات الهندسة نجحت؛ معاينة CSS وحدها لم تستبدل renderers القديمة.
`source_verified` يخص ذلك النطاق فقط، لا جودة كل حزمة على جهاز جديد.
مراجعة اليوم مراجعة للتقرير والعقود، لا إعادة فحص بصري للجوال.

## شرط الإغلاق

نسخة جهاز مطابقة للمصدر، لقطات owner/visitor لكل مجموعة، أزرار قابلة للمس،
عدم قص الأعلى والأسفل، واختبار الوضعين والأحجام مع سجل نسخة ودليل.
حاليًا لا بيلد جديد؛ يمكن توسيع fixtures دون الادعاء باجتياز الجهاز.

## المصادر

[[decisions/Profile-Frame-Geometry]]، [[systems/Appearance-Bundles]]،
[الاختبار](../../tests/profile-decoration.test.js)،
[الهندسة](../../styles/lorefy-frame-motion.css).

مراجعة المصدر 2026-10-15 بعد ae66e5b: نجح 56 اختبارًا في frame-motion و
profile-decoration وprofile-layout وbeta-decorations. لا تغيير رسومي جديد
بلا إعادة إنتاج خلل، ولا إغلاق QA الجهاز بهذه النتيجة. التوجيه لا يزال دون build.

[[15-Work-Control]] | [[10-Open-Questions]]

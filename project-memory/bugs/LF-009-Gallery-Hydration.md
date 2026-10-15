---
{
  "kind": "bug", "id": "LF-009", "status": "open", "priority": "P2",
  "area": "characters", "date": "2026-10-15", "reviewed_on": "2026-10-15",
  "source_commit": "1950599", "source_verified": false,
  "device_verified": false, "service_verified": false,
  "requires_device": false, "requires_service": false,
  "verified_on": null,
  "next_action": "اختبار معرض مفتوح قبل تحميل cast وفشل الشبكة ثم إعادة المحاولة"
}
---
# LF-009: تحديث المعرض المفتوح بعد تحميل التفاصيل

## ليست إعادة فتح إصلاح العدد

[[12-Device-Repairs#LF-009: ثبات إحصاءات تقييم الشخصيات]] يوثق إصلاح
العدد والمتوسط من التقييم المحفوظ في `628c701`. هذا البند يخص المعرض
المفتوح: يلتقط `openProfileRatedCharacters()` البيانات مرة واحدة؛ تحديث
البروفايل بعد hydration لا يثبت تحديث تلك النافذة. مسار فشل `loadCast`
وإعادة المحاولة يحتاج اختبارًا مستقلًا. لم يُنفذ إصلاحه في جولة البحث.

## شرط الإغلاق

اختبارات للنافذة المفتوحة قبل/أثناء/بعد hydration، cast فارغ حقيقي،
فشل ثم retry، وتغيير الحساب أثناء الطلب. لا تعديل للتقييم المحفوظ.
سجّل red/green ومصدر الدليل قبل تغيير الحالة.

## المصادر

[growth](../../modules/lorefy-growth-features.js)،
[اختبار العدد، لا المعرض](../../tests/character-rating-summary.test.js)،
[[systems/Profiles-Lists]].

[[15-Work-Control]] | [[10-Open-Questions]]

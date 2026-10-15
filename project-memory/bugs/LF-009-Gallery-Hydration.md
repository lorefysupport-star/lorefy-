---
{
  "kind": "bug", "id": "LF-009", "status": "closed", "priority": "P2",
  "area": "characters", "date": "2026-10-15", "reviewed_on": "2026-10-15",
  "source_commit": "cc1f29a", "source_verified": true,
  "device_verified": false, "service_verified": false,
  "requires_device": false, "requires_service": false,
  "verified_on": "2026-10-15",
  "resolution_evidence": "[[sessions/2026-10-15-Gallery-Hydration-Repair]]",
  "next_action": "مغلق في المصدر؛ فحص النسخة المثبتة لاحقًا عند السماح بتحديثها"
}
---
# LF-009: تحديث المعرض المفتوح بعد تحميل التفاصيل

## ليست إعادة فتح إصلاح العدد

[[12-Device-Repairs#LF-009: ثبات إحصاءات تقييم الشخصيات]] يوثق إصلاح
العدد والمتوسط من التقييم المحفوظ في `628c701`. هذا البند يخص المعرض
المفتوح: يلتقط `openProfileRatedCharacters()` البيانات مرة واحدة؛ تحديث
البروفايل بعد hydration لا يثبت تحديث تلك النافذة. مسار فشل `loadCast`
وإعادة المحاولة كان يحتاج اختبارًا مستقلًا. لم يُنفذ إصلاحه في جولة البحث،
ثم عولج في [[sessions/2026-10-15-Gallery-Hydration-Repair]] على أساس cc1f29a
مع تغييرات الجولة. الإغلاق لنطاق المصدر والمتصفح المعزول، لا تثبيت iPhone.

## شرط الإغلاق

اختبارات للنافذة المفتوحة قبل/أثناء/بعد hydration، cast فارغ حقيقي،
فشل ثم retry، وتغيير الحساب أثناء الطلب. لا تعديل للتقييم المحفوظ.
سجّل red/green ومصدر الدليل قبل تغيير الحالة.

## النتيجة الجديدة

9 حالات regression، منها 7 حالات فشلت قبل الإصلاح؛ تحميل متأخر، بحث وتجميع
محفوظان، نتيجة فارغة صحيحة، فشل قابل للمحاولة دون طلبات متكررة، إغلاق
النافذة وتبديل الحساب، تحديث التقييم، وتوحيد الطلبات مع أخطاء provider متزامنة.
نجح 54 اختبارًا موجهًا و1213 في المجموعة الكاملة. المعاينة العربية 320px
والإنجليزية 390px تستخدم المصدر نفسه مع provider وهمي، ولا تكتب في حساب.

## المصادر

[growth](../../modules/lorefy-growth-features.js)،
[اختبار العدد، لا المعرض](../../tests/character-rating-summary.test.js)،
[[systems/Profiles-Lists]].

[[15-Work-Control]] | [[10-Open-Questions]]

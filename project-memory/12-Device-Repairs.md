---
kind: repair-board
status: in-progress
date: 2026-10-15
aliases: ["تقرير الجوال", "إصلاحات الجهاز", "device audit", "runtime repairs"]
---
# إصلاحات الفحص على الجهاز

## ابدأ هنا

التقرير المستورد في [[inbox/2026-10-15-Device-Audit]]. هذه لوحة العمل المرتبطة
بالكود. Obsidian يحفظ الدليل والقرار؛ الأوامر والاختبارات تنفذ العمل. لا تُغلق
مشكلة بمجرد كتابة ملاحظة، ولا تعتبر نجاح المصدر إثباتًا لتحديث الآيفون.

## دورة الإصلاح

1. اقرأ [[09-Data-Contracts]] وملاحظة النظام والمسار المتأثر.
2. أثبت السبب، واكتب اختبارًا يفشل للحالة المرصودة قبل تعديل سلوك التطبيق.
3. طبّق أصغر إصلاح، وشغّل الاختبارات المرتبطة، وافحص تغيرات المصدر.
4. حدّث حالة المشكلة بالدليل والقيود. حضّر native assets عند تعديل runtime.
5. ارفع كل إصلاح مختبر في commit مستقل إلى GitHub، حسب طلب المستخدم بتاريخ اليوم.
6. تحقق على الهاتف عندما تتاح النسخة المعدلة؛ المعاينة المؤقتة لا تعني تثبيت IPA.

## قائمة العمل

| المعرف | الأولوية | الحالة | ملكية المصدر | بداية التحقق |
| --- | --- | --- | --- | --- |
| LF-001 | P1 | قيد التشخيص | `backend/lorefy-native-runtime.js`، التطبيق الرئيسي | `tests/notification-delivery-runtime.test.js` |
| LF-002 | P2 | مفتوحة | `modules/lorefy-chapter-detail.js`، `modules/lorefy-reading-metrics.js` | `tests/reading-checkpoint-history.test.js` |
| LF-003 | P2 | مفتوحة | `styles/lorefy-profile-shop.css`، إطار الصفحة والهيدر | `tests/frame-motion.test.js`، QA على الجهاز |
| LF-004 | P2 | مفتوحة | `modules/lorefy-public-profile.js` | `tests/public-profile-view.test.js` |
| LF-005 | P3 | مفتوحة | `uploads/files/lorefy-app.js`، صفحة الجرس | DOM/accessible name |
| LF-006 | P3 | مفتوحة | قوائم المتابعة والتوطين | `tests/followers-localization.test.js` |

## ضوابط الأدلة

- التقرير يخص التطبيق المثبت الذي فُحص؛ تطابقه بايتًا مع الـIPA المرفق غير مثبت.
- صور الحساب والسجلات الشخصية تبقى خارج الخزنة وGit. نستخدم ملخصًا منزوع الهوية.
- لا نعيد تشغيل migrations أو نغيّر الأسرار لعلاج خلل واجهة دون سبب مثبت.
- البث على الكمبيوتر يعرض WebView من الآيفون؛ لا يثبت تشغيل الكاميرا أو شاشة النظام.
- لا تخلط بين حالة عمل مكتمل وتقدم محفوظ وصفر لم يصل من الخادم بعد.

[[00-Home]] | [[08-Feature-Router]] | [[05-Verification]] |
[[systems/Community-Notifications]] | [[systems/Reading-Library]] |
[[systems/Profiles-Lists]] | [[systems/Appearance-Bundles]]

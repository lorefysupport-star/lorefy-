---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["حساب", "دخول", "مزامنة", "ضياع", "auth", "offline", "logout"]
---
# الحسابات والمزامنة

## المسؤولية والمصدر

[lorefy-backend.js](../../backend/lorefy-backend.js) يملك مفاتيح المزامنة وسجل
التغييرات والمالك والطلبات السحابية. [lorefy-auth.js](../../auth/lorefy-auth.js)
واجهة الدخول/onboarding. [secure-storage](../../backend/lorefy-secure-storage.js)
وغلاف [iOS OAuth](../../backend/lorefy-ios-oauth.js) يعالجان الحدود الأصلية.
لا تحفظ مفاتيح جلسة أو قيم إعدادات حسابات في هذه الملاحظة.

## العقد

- `activeUser` يحدد صاحب الحالة المحلية؛ حالة غير مملوكة لا تُتبنى عند دخول حساب جديد.
- سجل pending يلتقط التعديلات؛ لا يُمسح تعديل أحدث لمجرد انتهاء push قديم.
- pull يُنسب للحساب والجيل؛ لا يطبّق استجابة وصلت بعد تبديل حساب أو إيقاف المزامنة.
- اقرأ أحدث حالة محلية بعد انتظار الشبكة كي لا تمحو تقييمًا أو تعيد حذفًا.
- sign-out وتنظيف namespace يمنعان ظهور البيانات الخاصة للحساب التالي.
- حذف الحساب لا يُعلن نجاحه إذا رفض الخادم أو احتاج recent auth.

## الفحص

[[sessions/2026-10-15-Privacy-Safety-Repairs]] أضاف انتظار تأكيد إلغاء الحظر،
وعدم اعتماد رد قديم بعد تبديل المالك أو جيل المزامنة. إعدادات القوائم والحظر
المفتوحة تحت حساب قديم لا ترسل تعديلات باسم الحساب التالي. الفحص معزول وليس
اختبارًا لإلغاء حظر قارئ فعلي.

[account-sync-isolation](../../tests/account-sync-isolation.test.js)،
[account-local-data](../../tests/account-local-data.test.js)،
[state-recovery-runtime](../../tests/state-recovery-runtime.test.js)،
[account-deletion-recovery](../../tests/account-deletion-recovery.test.js)،
[native-auth-flow](../../tests/native-auth-flow.test.js).

[تقرير الاسترجاع](../../docs/STATE_RECOVERY_FIX_2026-10-03.md) يشرح أسباب مثبتة
تاريخيًا؛ لا يثبت أن كل شكوى إنتاج أُغلقت. اختبار حسابين وجهاز حقيقي مستقل.
مجلد [migrations](../../supabase/migrations/) مصدر للعقود وليس حالة نشر مباشرة.

[[09-Data-Contracts]] | [[systems/Profiles-Lists]] |
[[systems/Community-Notifications]] | [[10-Open-Questions]]

[[sessions/2026-10-17-Backend-Review-Owner]] يمنع نشر/رفع المراجعة من استكمال طلب تحت حساب جديد، ويرفض توكن Storage المخالف. لا يثبت إلغاء طلب سبق إرساله أو صلاحيات الخادم.

[[sessions/2026-10-17-Profile-Mutation-Owner]] تربط حفظ الملف والخصوصية وإكمال التسجيل بنطاق الحساب الافتتاحي؛ لا كتابة identity/preferences بعد رد حساب قديم.

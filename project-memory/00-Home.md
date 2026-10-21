---
kind: index
status: maintained
aliases: ["ذاكرة Lorefy", "ذاكرة المشروع"]
---
# ذاكرة Lorefy

هذه ذاكرة المشروع المحلية: قرارات موثّقة، أسباب الأخطاء، طرق التحقق، ومراجع للكود. ليست مجرد سجل محادثة، ولا تُعتبر الملاحظات القديمة إثباتًا أن التطبيق يعمل الآن.

## ابدأ هنا

- [[18-Progress-Handoff|تسليم 17 أكتوبر: ما أُنجز وما بقي وحالة GitHub]]

- [[15-Work-Control|لوحة العمل والمراجعة والجلسات]]
- [[16-Obsidian-Workflow|استغلال Obsidian عمليًا ونتائج البحث الرسمي]]
- [[13-Project-Story|اقرأ رواية التطبيق كاملة]]
- [[14-Feature-Coverage|كل الميزات ومصادرها وحدود فحصها]]
- [[12-Device-Repairs|المشاكل والإصلاحات وأدلتها]]
- [[01-Project|المشروع وحدوده]]
- [[02-Architecture|خريطة الكود]]
- [[03-Working-Agreement|طريقة العمل والتفضيلات]]
- [[04-Current-State|بصمة المصدر الحالية]]
- [[05-Verification|الاختبارات والأدلة]]
- [[06-Known-Risks|المشكلات وحدود التحقق]]
- [[07-Source-Atlas|فهرس المصدر المتجدد]]
- [[08-Feature-Router|أين أبدأ لكل ميزة؟]]
- [[09-Data-Contracts|عقود البيانات وتدفق الحفظ]]
- [[10-Open-Questions|قائمة الأمور التي تحتاج تحققًا]]
- [[11-Organization-Plan|تنظيم المشروع دون حذف أو كسر]]

## خريطة الأنظمة

- [[systems/App-Boot|تشغيل التطبيق وترتيب التحميل]]
- [[systems/Accounts-Sync|الحسابات والمزامنة]]
- [[systems/Catalog-Search|الكتالوج والبحث]]
- [[systems/Reading-Library|المكتبة والتقدم والساعات]]
- [[systems/Profiles-Lists|البروفايلات والمفضلة واللستات]]
- [[systems/Community-Notifications|المجتمع والتنبيهات]]
- [[systems/Explore-Works|الاستكشاف وتفاصيل الأعمال والشخصيات]]
- [[systems/Appearance-Bundles|الثيمات والإطارات والحزم]]
- [[systems/Native-Release|غلاف iOS والتحزيم والإصدارات]]
- [[systems/Language-Media|اللغة والصور والمشاركة]]

[الخريطة البصرية في Obsidian](generated/Project-Brain.canvas) تربط هذه الملاحظات. هي خريطة مسؤوليات وعقود، وليست رسمًا يستنتج جميع استدعاءات الكود تلقائيًا.

## القرارات ووصفات الإصلاح

- [[decisions/Profile-Frame-Geometry|قاعدة البنرات والإطارات]]
- [[decisions/Saved-Reading-Metrics|ثبات الفصول والساعات]]
- [[decisions/Temporary-Free-Bundles|الحزم المجانية مؤقتًا]]
- [[decisions/Local-Project-Memory|لماذا ذاكرة محلية]]
- [[decisions/Project-Brain-Maintenance|كيف تتجدد المعرفة ولا تصبح قديمة]]
- [[playbooks/Profile-Frames|فحص البروفايلات والإطارات]]
- [[playbooks/Reading-Metrics|فحص عدادات القراءة]]
- [[playbooks/Memory-Maintenance|صيانة الذاكرة]]

## سجل العمل والقوالب

- [[sessions/2026-10-15-Push-Transport-Repair|عزل فشل APNs وحدود التحقق الحي]]
- [[sessions/2026-10-15-Gallery-Hydration-Repair|استكمال تحديث المعرض وإعادة المحاولة]]
- [[sessions/2026-10-15-Obsidian-Research|البحث الرسمي والتحسينات المطبقة]]
- [[sessions/2026-10-15-Source-Reorganization|آخر جلب وتنظيم وحالة التحقق الحالية]]
- [[sessions/2026-10-15-GitHub-Sync|دمج إصلاحات التشغيل والقراءة]]
- [[sessions/2026-10-15-Privacy-Safety-Repairs|خصوصية القوائم وإلغاء الحظر]]
- [[sessions/2026-10-15-Reading-Ownership|الصفر الصريح وملكية التراجع]]
- [[sessions/2026-10-15-Live-Reading-Spoilers|التقدم المباشر وحماية الحرق]]
- [[sessions/2026-10-15-Diary-Drafts|بقاء المسودات وملكيتها]]
- [[sessions/2026-10-15-Diary-Feedback|نتيجة الحفظ والنسخ دون نجاح كاذب]]
- [[sessions/2026-10-13-Obsidian-Setup|إعداد Obsidian]]
- [[sessions/2026-10-14-GitHub-Obsidian-Verification|تحديث GitHub وتفعيل الذاكرة والتحقق النهائي]]
- [[sessions/2026-10-14-Project-Brain|توسيع خريطة المشروع والتحقق]]
- [[sessions/2026-10-14-APNs-Server-Setup|إعداد أسرار APNs وحدود فحص التسليم]]
- [[templates/Decision|قالب قرار]]
- [[templates/Bug|قالب مشكلة]]
- [[templates/Session|قالب جلسة عمل]]
- [[templates/Feature|قالب معرفة ميزة]]
- [[inbox/Inbox|ملاحظات تحتاج مراجعة]]

## كيف يستخدمها الوكيل

قبل العمل: `npm run memory:context -- كلمات المهمة`.
للبحث: `npm run memory:search -- إطارات`.
لفحص الروابط وتقادُم البصمة: `npm run memory:check`.
لتحديث البصمة فقط: `npm run memory:refresh`.
لفحص التنظيم والبصمة والروابط والتكرار: `npm run memory:audit`.

يمكن للوكيل قراءتها حتى لو كان Obsidian مغلقًا. الفائدة تأتي من الرجوع إليها وتحديثها بالأدلة؛ لا نعد بتحسن تلقائي أو ذاكرة تستوعب كل شيء دون صيانة.

لا تضع هنا كلمات مرور، مفاتيح API، بيانات حسابات خاصة، أو صور مستخدمين. لا توجد إضافات ذكاء اصطناعي أو مزامنة سحابية مفعّلة لهذا الإعداد.

[عقد عمل الوكيل](../AGENTS.md) | [المصدر](../README.md)
[خريطة مجلدات التطبيق](../PROJECT_MAP.md)

- [[sessions/2026-10-19-DeviceHub-Sync|Local Device Hub source sync, 19 October 2026]]

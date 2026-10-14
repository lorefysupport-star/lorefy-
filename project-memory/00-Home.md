---
kind: index
status: maintained
aliases: ["ذاكرة Lorefy", "ذاكرة المشروع"]
---
# ذاكرة Lorefy

هذه ذاكرة المشروع المحلية: قرارات موثّقة، أسباب الأخطاء، طرق التحقق، ومراجع للكود. ليست مجرد سجل محادثة، ولا تُعتبر الملاحظات القديمة إثباتًا أن التطبيق يعمل الآن.

## ابدأ هنا

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

- [[sessions/2026-10-13-Obsidian-Setup|إعداد Obsidian]]
- [[sessions/2026-10-14-GitHub-Obsidian-Verification|تحديث GitHub وتفعيل الذاكرة والتحقق النهائي]]
- [[sessions/2026-10-14-Project-Brain|توسيع خريطة المشروع والتحقق]]
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

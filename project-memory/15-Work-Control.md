---
kind: dashboard
status: maintained
date: 2026-10-15
aliases: ["لوحة التطوير", "العمل المتبقي", "control center"]
---
# لوحة تطوير Lorefy

[[18-Progress-Handoff|ملخص التسليم: المنجز والمتبقي وحدود فحص المصدر والجوال والخدمات]]

[[17-Extended-Review-Plan|خطة تطوير التقرير الموسع وربطها بالمصدر الحالي]]

[[13-Project-Story|الرواية]] | [[14-Feature-Coverage|تغطية التطبيق]] |
[[12-Device-Repairs|أدلة الإصلاح]] | [[16-Obsidian-Workflow|طريقة تشغيل الذاكرة]]

## الخطوات المتبقية

![[dashboards/Work.base]]

هذه بنود متابعة محددة، وليست جردًا جديدًا لكل مشكلات التطبيق. العرض يخفي
المغلق منها؛ الملفات المرتبطة أدناه تبقى كسجل أدلة.
السجل التاريخي يبقى في [[12-Device-Repairs]]، ولا ننسخه إلى كل بند.

- [[bugs/LF-003-Frame-Device-QA]]
- [[bugs/LF-009-Gallery-Hydration]]
- [[bugs/LF-010-Character-Editor-Owner]]
- [[bugs/LF-011-Character-Editor-Hydration]]
- [[bugs/LF-012-Character-Editor-Locale]]
- [[bugs/APNS-001-Background-Delivery]]
- [[bugs/APNS-002-Transport-Isolation]]

## جودة المعرفة

![[dashboards/Knowledge.base]]

المراجعة مستحقة بعد 14 يومًا، أو عند عدم وجود `reviewed_on`. هذه سياسة
Lorefy المحلية للتذكير وليست معيار Obsidian أو دليل أن المحتوى خاطئ.
تاريخ تعديل الملف أو تحديث بصمته لا يُعتبر مراجعة لمعناه.
تغيير المصدر المرتبط يستدعي المراجعة فورًا، دون انتظار الموعد.

## تسلسل الجلسات

![[dashboards/Sessions.base]]

الحقل الفارغ يعني غير مسجّل؛ لا ننسخ تاريخ اليوم إلى إيصال قديم.

## وصول مباشر عند غياب عرض Bases

[[10-Open-Questions]] و[[08-Feature-Router]] يعملان بملفات Markdown فقط.

```query
path:bugs [status:open OR needs-device OR needs-service]
```

[[00-Home]] | [[playbooks/Memory-Maintenance]]

- [[bugs/LF-013-Friend-Rating-Rows]]: أُصلح تنسيق التقييم بالمصدر والمتصفح؛ لا تحديث جهاز.

- [[bugs/LF-014-Diary-Position-Defaults]]: افتراضي الصفحة يحترم التقدم المحفوظ والاختيار اليدوي.

- [[bugs/LF-015-Import-UI]]: تباين أزرار الاستيراد وأسماء الحقول؛ إثبات المصدر والمتصفح منفصل عن الجهاز.

- [[bugs/LF-016-Review-Reply-Direction]]: اتجاه حقل الرد يتبع اللغة؛ تاريخ المراجعة مسار مستقل لم يُصلح بهذه الدفعة.

- [[bugs/LF-017-Review-Timestamp]]: التاريخ والوقت يتبعان لغة الواجهة؛ القيم المخزنة ونصوص القارئ لا تتغير.

- [[bugs/LF-018-Reading-Estimate-Labels]]: الساعات موصوفة كتقدير من التقدم المحفوظ، دون تغيير الأرقام.
- [[bugs/LF-019-Statistics-Locale]]: اكتملت ترجمة الإحصاءات وأرقامها واتجاهها بالمصدر والمتصفح.
- [[bugs/LF-020-Statistics-Activity-Dates]]: رُبطت أيام الرسم بتواريخ السجل، مع حفظ الصفر وتمييز غياب البيانات بالمصدر.

- [[bugs/LF-028-Review-Only-Library]]: التهيئة من مراجعة وحدها ممنوعة؛ الحذف مستقل بالمصدر.

- [[bugs/LF-029-Backend-Review-Owner]]: سياق نشر المراجعة وStorage معزول؛ بقية حفظ الملف/الوسائط وفحوص RLS الحقيقية مستقلة.

- [[bugs/LF-030-Profile-Mutation-Owner]]: حفظ الملف والخصوصية والتسجيل معزول بالمصدر؛ اختبارات الخدمة والزائر مستقلة.

- [[bugs/LF-031-Session-Read-Owner]]: قراءة auth ومشاركة الفحص معزولتان حسب السياق؛ اختبارات الدخول الحقيقي مستقلة.

- [[bugs/LF-032-Editorial-Detail-Synopsis]]: استُكملت أوصاف ثلاثة أعمال AR/EN من الناشر؛ العينة لا تغلق جودة بقية الكتالوج. [[sessions/2026-10-17-Editorial-Detail-Synopsis]]

- [[bugs/LF-033-Storage-Operation-Owner]]: نطاق حساب داخل عمليات رفع/توقيع/حذف Storage؛ لا اعتماد RLS أو جهاز. [[sessions/2026-10-17-Storage-Operation-Owner]]

- [[bugs/LF-034-Review-Mutation-Session]]: منع طلب حذف/رد/تفاعل مراجعة قديم من استكمال سلسلة حساب آخر أو إرجاع نجاح متأخر. [[sessions/2026-10-17-Review-Mutation-Session]]

- [[bugs/LF-035-Profile-Relationship-Session]]: عزل متابعة/إلغاء متابعة وحظر/إلغاء حظر الملف حسب حساب الطلب. [[sessions/2026-10-17-Profile-Relationship-Session]]؛ الرؤية الحية منفصلة.

- [[bugs/LF-036-Community-Mutation-Session]]: تثبيت جلسة نشر/رد/تعديل/تفاعل المجتمع ورفض نتيجة بلاغ قديمة؛ [[sessions/2026-10-17-Community-Mutation-Session]]. لا اعتماد الرؤية بالخادم.

- [[bugs/LF-037-Chapter-Review-Session]]: عزل نشر/حذف تقييم الفصل مع بقاء الدرجات والحرق وفلتر المالك؛ [[sessions/2026-10-17-Chapter-Review-Session]].

- [[bugs/LF-038-Notification-Backend-Session]]: عزل تسجيل الجهاز والصندوق والمقروء وقنوات التنبيهات حسب سياق الطلب؛ [[sessions/2026-10-17-Notification-Backend-Session]]. وصول APNs والخادم والجهاز منفصل.

- [[bugs/LF-039-Account-Deletion-Session]]: عزل تأكيد حذف الحساب والطلب المعلّق ونتيجته؛ [[sessions/2026-10-17-Account-Deletion-Session]]. teardown وSDK والخدمة منفصلة.

- [[bugs/LF-040-Session-Teardown-Owner]]: منع تنظيف مفاتيح/monitoring/emit بعمل جلسة قديمة، مع إغلاق قناة التنبيه وflag حسب السياق؛ [[sessions/2026-10-17-Session-Teardown-Owner]]. تكامل تخزين SDK منفصل.

- [[bugs/LF-041-Profile-Read-Session]]: عزل قراءة الملفات والبحث والمتابَعين حسب جلسة المشاهد مع بقاء زيارة الآخرين؛ [[sessions/2026-10-17-Profile-Read-Session]]. الرؤية الحية والجهاز منفصلان.

- [[bugs/LF-042-Feed-Read-Session]]: قراءات المراجعات والمنشورات والأصدقاء والفصول ومرفقاتها تُرفض بعد تغير السياق؛ [[sessions/2026-10-17-Feed-Read-Session]]. الرؤية الحية والجهاز منفصلان.

- [[bugs/LF-043-Search-Alias-Refresh]]: تحديث محتوى الأسماء البديلة في الفهرس compact مع بقاء هوية الطبعة؛ [[sessions/2026-10-17-Search-Alias-Refresh]]. تصحيح الأخطاء الإملائية وفشل المزوّد ما زالا مستقلين.

- [[bugs/LF-044-Import-Request-Session]]: معاينة الاستيراد وتأكيده تخص حساب الفتح والمحاولة الأحدث؛ [[sessions/2026-10-17-Import-Request-Session]]. فشل الحفظ المحلي والخادم والجهاز مستقلون.

- [[bugs/LF-045-Import-Save-Failure]]: فشل الكتابة لا يعلن نجاح الاستيراد، مع تراجع متحقق وإعادة محاولة أو توضيح الحفظ الجزئي؛ [[sessions/2026-10-17-Import-Save-Failure]]. المزامنة والجهاز منفصلان.

- [[bugs/LF-046-Import-CSV-Records]]: قراءة CSV/TSV كسجلات كاملة، دون تحويل أسطر المراجعة لأعمال، ورفض الاقتباس الناقص؛ [[sessions/2026-10-17-Import-CSV-Records]]. فحص Cloud/الجهاز مستقل.

- [[bugs/LF-047-Source-Summary-Batch]]: أوصاف AR/EN موثقة لكتاب الفيزياء الفلكية ورواية فارس بلا وجود وكوميكس Nimona؛ [[sessions/2026-10-17-Source-Summary-Batch]]. بقيّة العينة والأغلفة والطبعات والحقوق منفصلة.

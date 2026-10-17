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

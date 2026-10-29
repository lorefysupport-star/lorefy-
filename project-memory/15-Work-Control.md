---
kind: dashboard
status: maintained
date: 2026-10-15
aliases: ["لوحة التطوير", "العمل المتبقي", "control center"]
---
# لوحة تطوير Lorefy

30 أكتوبر: أذن المستخدم برفع كل إصلاح مثبت مباشرة إلى GitHub. تحسين الصور
محفوظ في `b322afd`. [[sessions/2026-10-30-Inbox-Reconnect]] يعالج التحديث بعد
الانقطاع، المقروء من جهاز آخر، وتكرار جلب الصندوق محليًا؛3014 اختبارًا و84
فحص واجهة. اختبار الجهازين والإنتاج وحدود الخطط تبقى منفصلة؛ لا بيلد جديد.

## الاستفادة من Supabase Pro

[[sessions/2026-10-30-Supabase-Pro-Adoption]]: فحص الاشتراك والاستهلاك والنسخ
الاحتياطية تم بالقراءة فقط. أصلحنا محليًا تكرار توقيع الصور الخاصة بكاش معزول
قصير العمر. [خطة الخدمات](../docs/SUPABASE_PRO_ADOPTION_2026-10-30.md) تفصل
المتبقي والتكلفة والقبول؛ لا تشغيل Cron/Queues أو تحويل كل الصور أو تغيير
الإنتاج/الفوترة تلقائيًا. ترتيب قبول الواجهات أدناه باقٍ كما هو.

## التنفيذ الحالي للواجهات

[[19-UI-Execution-Control|الحالة الحالية للـ18 ملاحظة والـ27 قسمًا وترتيب التنفيذ]]
هي مرجع العمل بعد تصحيح تكرار الدفعات في29 أكتوبر. الدفعات13–22 كلها تحتF07،
ومتابعة الصور مؤجلة كبند واحد. نفذF08 محليًا في
[[sessions/2026-10-29-Search-Edition-Groups]]، دون دمج IDs أو بيانات المستخدم.
نفذ قبولF12 محليًا في [[sessions/2026-10-29-Library-Shelf-Acceptance]]:
إصلاح ضغط كعب Reader وحجب فتح العمل، مع حفظ الخشب والأعداد والبيانات.
نفذF13 في [[sessions/2026-10-29-Cover-Edition-Choice]] مع108 فحوص متصفح
محلية و2973 اختبار مصدر. أذن المستخدم بحفظ المصدر في GitHub، لا بيلد أو Apple.
التاليF15: قبول صندوق التنبيهات، ثمF16. لا بدء تطوير جديد أثناء نقطة الحفظ.

- [[bugs/LF-066-Rating-First-Completion]]: بتوجيه 18 أكتوبر، نجاح نشر تقييم العمل غير المسجل يضيفه للمكتملة ويحسب التقدم مرة واحدة، مع حماية الموجود والإزالة. [[sessions/2026-10-18-Rating-First-Completion]]؛ 2107 اختبارًا ناجحًا، دون بناء أو اعتماد خدمة/جهاز.

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

- [[bugs/LF-048-Test-Preparation-Isolation]]: اختبار إعدادات native ينفذ projection المحدود دون تجهيز المشروع أو توليد الكتالوج؛ [[sessions/2026-10-17-Test-Preparation-Isolation]]. فحص parity الفعلي باقٍ.

- [[bugs/LF-049-Travel-Fiction-Summaries]]: ثلاثة أوصاف AR/EN أخرى للرحلات والرواية والمذكرات المصورة؛ [[sessions/2026-10-17-Travel-Fiction-Summaries]]. جزء runtime المتأثر فقط حُدث مع بقاء الهوية والعدد والحقوق كحدود منفصلة.

- [[bugs/LF-050-Book-Sample-Summaries]]: أوصاف موثقة للكتب الـ18 المتبقية؛ جميع كتب العينة الـ24 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Book-Sample-Summaries]]. أدوار المساهمين والطبعات والحقوق منفصلة.

- [[bugs/LF-051-Novel-Sample-Summaries]]: أوصاف موثقة للروايات الـ18 المتبقية؛ جميع روايات العينة الـ23 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Novel-Sample-Summaries]]. حفظ هوية العمل والطبعة والتقدم، مع بقاء الحقوق والمراجعة الببليوغرافية منفصلتين.

- [[bugs/LF-052-Comic-Sample-Summaries]]: استُكملت أوصاف الكوميكس الـ21 المتبقية؛ جميع كوميكس العينة الـ24 لها AR/EN، مع 42 صفحة/لغة وفصل وصف المجلد الثاني عن العدد الثاني؛ [[sessions/2026-10-17-Comic-Sample-Summaries]]. مصدر Peanuts فهرس Open Library، لا تحقق ناشر؛ حقوق الصور والطبعات مستقلة.

- [[bugs/LF-053-Catalog-Search-Retry]]: فشل الفهرس أو جزء نتائج لا يتحول إلى «لا توجد نتائج»؛ زر retry يعيد نفس البحث والنوع، والأجزاء الناجحة تبقى محملة؛ [[sessions/2026-10-18-Catalog-Search-Retry]]. لا تصحيح إملائي أو اختبار مزود/جهاز حي ضمن هذه الدفعة.

- [[bugs/LF-054-Catalog-Search-Deadline]]: مهلة محدودة لـWorker وفهرس البحث البديل، مع إلغاء الطلب وإهمال رسائل Worker القديم؛ [[sessions/2026-10-18-Catalog-Search-Deadline]]. تعليق raw shard وتصحيح الإملاء والمزوّد والجهاز بوابات مستقلة.

- [[bugs/LF-055-Catalog-Shard-Deadline]]: جزء كتالوج صامت يحرر طابور التحميل بعد مهلة؛ retries معزولة عن callbacks القديمة، مع إبقاء تحميل الأجزاء الناجحة؛ [[sessions/2026-10-18-Catalog-Shard-Deadline]]. ليست مهلة إجمالية لكل الكتالوج أو اعتماد أداء الجهاز.

- [[bugs/LF-056-Search-Field-Lifecycle]]: كتابة البحث لا تُفقد عند تحديث النتائج، مع اتجاه النص التلقائي وزر مسح مسمّى يعيد التركيز؛ [[sessions/2026-10-18-Search-Field-Lifecycle]]. محرر المفضلة الحالي حقل مستقل؛ استكمل [[bugs/LF-057-Editor-Search-Direction]] اتجاهه.

- [[bugs/LF-057-Editor-Search-Direction]]: اتجاه بحث مفضلة الأعمال والشخصيات يتبع النص في الواجهتين؛ 8 حالات متصفح و110 اختبارات مرتبطة؛ [[sessions/2026-10-18-Editor-Search-Direction]]. لا تغيير للترتيب أو الحفظ.

- [[bugs/LF-058-Search-Typo-Suggestions]]: اقتراحات عناوين AR/EN لتعديل حرف واحد، يختارها القارئ دون دمج الطبعات؛30حالة جديدة و131مرتبطة و1949كاملة و6حالات Chrome؛ [[sessions/2026-10-18-Search-Typo-Suggestions]]. «الكل» العربي يحتاج إصلاحاً منفصلاً؛ لا اعتماد جهاز أو مزود حي.

- [[bugs/LF-059-All-Format-Search]]: فلتر All/الكل يبحث في الأنواع الثمانية بدلاً من سقوط العربية إلى Manga؛11حالة جديدة،179مرتبطة،1960كاملة و4حالات Chrome؛ [[sessions/2026-10-18-All-Format-Search]]. بداية التصفح وقيود النوع المحدد محفوظة.

- [[bugs/LF-060-Image-Source-Lifecycle]]: حماية الصور تتجدد مع الرابط وإعادة المحاولة، وتلغي callbacks القديمة والمؤقت عند نجاح/إزالة الصورة؛17حالة جديدة،117مرتبطة،1977كاملة و4حالات Chrome؛ [[sessions/2026-10-18-Image-Source-Lifecycle]]. رفع الصور والأذونات الحية مستقلان.

- [[bugs/LF-061-Review-Image-Failure]]: فشل قراءة/فتح/تجهيز صورة المراجعة يظهر AR/EN دون فقد المسودة أو الصور السابقة، مع منع callbacks المتأخرة؛23حالة جديدة،163مرتبطة،2000كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Review-Image-Failure]]. صور البروفايل والأذونات والرفع الحي مستقلة.

- [[bugs/LF-062-Profile-Image-Editor]]: صور البروفايل والحفظ مرتبطان بمالك ونسخة المحرر وأحدث اختيار؛ فشل التجهيز ظاهر ولا تسقط النتائج القديمة على مسودة/حساب جديد؛37حالة جديدة،304مرتبطة،2037كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Profile-Image-Editor]]. لا إلغاء أو اعتماد لكتابة خدمة حية.

- [[bugs/LF-063-Invalid-Image-Fallback]]: البديل المخصص التالف ينتقل مرة إلى SVG محلي مناسب للغلاف أو الصورة الشخصية؛ مهلة مستقلة وعزل callbacks وإلغاء عند الاستبدال/الإزالة، مع بقاء منتقي الأغلفة خطأً دون صورة مولّدة؛11حالة جديدة،188مرتبطة،2048كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Invalid-Image-Fallback]]. الرفع وأذونات الجهاز والخدمة مستقلان.

- [[bugs/LF-064-Image-Preparation-Deadline]]: مهلة إجمالية 30 ثانية لتجهيز صور البروفايل ومرفقات المراجعة،مع رسالة AR/EN وحماية الصورة والنص السابقين ومنع النتائج المتأخرة؛ 28 حالة جديدة،343 مرتبطة،2076 كاملة و7 حالات Chrome منها مؤقت حقيقي؛ [[sessions/2026-10-18-Image-Preparation-Deadline]]. Photos والرفع والجهاز والخدمة مستقلة.

- [[bugs/LF-065-Runtime-Cleanup]]: ملخص كتالوج2,991 بايت وتحميل فهرس المعرّفات عند الحاجة،مع إزالة كود اختصار متقاعد وتنسيقاته وتوثيق المسؤوليات؛موارد بداية الرئيسية أقل29.06% في Chrome المعزول؛15 اختبارًا جديدًا،180مرتبطة و2091كاملة؛ [[sessions/2026-10-18-Runtime-Cleanup]]. حجم التثبيت وFPS والجهاز والخدمة مستقلان.

- [[sessions/2026-10-29-Jikan-Retirement]]: Jikan retirement repaired in source and compatibility Edge route; installed-app delivery and progressive search latency remain open. No native release or production-data writes.

2026-10-29 owner priority: [[sessions/2026-10-29-Search-Performance]] supersedes the earlier checkpoint-only pause for the authorized performance/GitHub repair.2990 tests and local AR/EN browser checks pass; first-result and CPU improvements are measured. Native delivery/device timing remain open and need separate release authorization.

- [[sessions/2026-10-29-Supabase-Pro-Optimization]]: deployed targeted Pro database optimization, verified query plans and cleared four missing-FK/two identity-initplan findings. Follow up Jikan 502, Apple authorization 503 configuration, Google Books 429 and Auth pool strategy if compute changes; existing security patch stays local.

Same-day integration: the server optimization's initial Jikan failure/inference
is superseded by [[sessions/2026-10-29-Jikan-Retirement]], and its separate search
latency follow-up has source/browser evidence in [[sessions/2026-10-29-Search-Performance]].
Apple server configuration, physical-device acceptance and installed-client
release delivery remain open. Applied SQL history is preserved, not replayed.

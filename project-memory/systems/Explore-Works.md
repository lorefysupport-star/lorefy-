---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["استكشاف", "تفاصيل", "أعمال", "شخصيات", "مشابه", "explore", "relations", "characters"]
---
# الاستكشاف وتفاصيل الأعمال والشخصيات

[[sessions/2026-10-20-Carousel-Publisher]] يضيف زرإيقاف/تشغيل ظاهرًا معحفظ
تقليل الحركة والتنقل اليدوي. يحل ملاحظةHallmark السابقة فيالمصدر والمتصفح؛
لا اعتمادشامل للوصول أوالجهاز. صورةالغلاف والهويةالبصرية محفوظتان.

[[sessions/2026-10-20-Remaining-Skills]] يقيس تصميم الاستكشاف دون تغييره؛
رصد الغلاف التلقائي بلازرإيقاف واضح،مع توقفه بعد التالي أوتقليل الحركة.
المتابعة مستقلة عن إصلاح خطأ محرر الشخصيات؛لاادعاءوصولشامل.

أحدث عرض للعمل: [[sessions/2026-10-19-Work-Experience]]؛ هوية أوضح، تبويب
مراجعات مباشر، حالة قراءة وخيارات غلاف وشخصيات متناسقة دون مخزن بيانات جديد.
[[bugs/LF-068-Review-Rating-Restore]] يحمي الرقم اليدوي عند فتح المراجعة.

[explore studio](../../modules/lorefy-explore-studio.js) ينظم رفوف الاكتشاف
واستمرار القراءة والأنواع. يعتمد على الحالة المشتركة، تفضيلات القارئ، الهوية
وسياسات الأهلية، لا كتالوج وهمي جديد. `readingSnapshot` يختار صفحات للأعمال
النصية عند توافرها، والفصول وفق البيانات؛ نسبة unknown تبقى unknown.

## العلاقات والتفاصيل

[work relations](../../modules/lorefy-work-relations.js) يستخدم AniList/MAL IDs
الصريحة، ويحتفظ بنوع العلاقة Prequel/Sequel/Source وغيرها. عنوان مشابه أو
أرقام عشوائية لا تثبت العلاقة. الكاش وtimeouts لا يجب أن يحوّلا فشل الشبكة
إلى قائمة فارغة دائمة. المؤلف يُختار حسب دور Story/Writer المدقق.

[product core](../../modules/lorefy-product-core.js)،
[chapter metadata](../../modules/lorefy-chapter-metadata.js) والتطبيق الرئيسي
تتشارك التفاصيل والتوصيات. [[systems/Catalog-Search]] يحدد هوية العمل،
و[[systems/Reading-Library]] تقدم القارئ. العرض الكبير لا يغيّر بياناته.

## الشخصيات

[[sessions/2026-10-20-Skills-Application]] يتحقق من شكل كاش الشخصيات عند
قراءته؛ المدخل المعطوب لا يوقف إعادة الجلب، وتبقى مدخلات الأعمال الصحيحة.

[[bugs/LF-084-Character-Search-Coalescing]] shares pending name-provider rows by
normalized query only. Each caller keeps its own work matching and active guard;
failure/timeout releases the query without admitting expired results to cache.

[[bugs/LF-083-Character-Discovery-Retry]] evicts rejected discovery promises so
the next explicit attempt can recover; concurrent callers and successful sources
remain shared. Domain matching and live-provider approval are unchanged.

[[bugs/LF-082-Character-Provider-Body]] bounds eighteen remaining provider JSON
reads separately from header deadlines, retaining pagination, fallbacks and
partial-cast flags. It neither aborts transport nor caps total traversal time.

[[bugs/LF-081-Character-Catalog-Taxonomy]] reuses shared work-type predicates for
bundled assets in Arabic/English and skips excluded ordinary-book downloads.

[[bugs/LF-080-Character-Catalog-Loading]] bounds bundled-script loading, releases
failed attempts for retry and isolates late callbacks before provider fallback.

[[bugs/LF-079-Character-Search-Response]] rejects invalid list/record structures
before caching; same-query retry can recover, while valid empty results still
cache normally. It is not a full-provider or bibliographic data-quality approval.

[[bugs/LF-078-Character-Search-Deadline]] bounds both headers and JSON for name
search in one ten-second budget; late data cannot populate either cache. Other
provider paths and physical-device performance remain separate acceptance.

[[bugs/LF-077-Character-Editor-Extra-Work]] removes a full catalog scan for hidden
work results and the redundant queued render after Clear. This is operation-count
acceptance, not a physical-device latency certification.

[[bugs/LF-076-Character-Search-Identity]] documents reproduced name-search leakage
across ordinary books, ambiguous titles and conflicting provider identities.
[[sessions/2026-10-19-Character-Search-Identity]] separates source acceptance from
historical Discord records and future device/provider verification.

[character system](../../modules/lorefy-character-system.js) والـcatalogs المؤجلة
يخدمان اختيار الشخصيات وتقييمها وقوائمها ومشاركتها. لا تخلط بحث شخصية ببحث
عنوان عمل، ولا تخترع صورًا أو تقييمات عند غياب المصدر.

الفحص: [explore studio](../../tests/explore-studio.test.js)،
[editorial explore](../../tests/editorial-explore.test.js)،
[work relations](../../tests/work-relations.test.js)،
[character atlas](../../tests/character-atlas.test.js)،
[character search](../../tests/character-name-search.test.js)،
[work list presentation](../../tests/work-list-presentation.test.js).

[[systems/Catalog-Search]] | [[systems/Reading-Library]] |
[[systems/Language-Media]] | [[08-Feature-Router]]

- [[bugs/LF-032-Editorial-Detail-Synopsis]]: استُكملت أوصاف ثلاثة أعمال AR/EN من الناشر؛ العينة لا تغلق جودة بقية الكتالوج. [[sessions/2026-10-17-Editorial-Detail-Synopsis]]

- [[bugs/LF-047-Source-Summary-Batch]]: أوصاف AR/EN موثقة لكتاب الفيزياء الفلكية ورواية فارس بلا وجود وكوميكس Nimona؛ [[sessions/2026-10-17-Source-Summary-Batch]]. بقيّة العينة والأغلفة والطبعات والحقوق منفصلة.

- [[bugs/LF-049-Travel-Fiction-Summaries]]: ثلاثة أوصاف AR/EN أخرى للرحلات والرواية والمذكرات المصورة؛ [[sessions/2026-10-17-Travel-Fiction-Summaries]]. جزء runtime المتأثر فقط حُدث مع بقاء الهوية والعدد والحقوق كحدود منفصلة.

- [[bugs/LF-050-Book-Sample-Summaries]]: أوصاف موثقة للكتب الـ18 المتبقية؛ جميع كتب العينة الـ24 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Book-Sample-Summaries]]. أدوار المساهمين والطبعات والحقوق منفصلة.

- [[bugs/LF-051-Novel-Sample-Summaries]]: أوصاف موثقة للروايات الـ18 المتبقية؛ جميع روايات العينة الـ23 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Novel-Sample-Summaries]]. حفظ هوية العمل والطبعة والتقدم، مع بقاء الحقوق والمراجعة الببليوغرافية منفصلتين.

- [[bugs/LF-052-Comic-Sample-Summaries]]: استُكملت أوصاف الكوميكس الـ21 المتبقية؛ جميع كوميكس العينة الـ24 لها AR/EN، مع 42 صفحة/لغة وفصل وصف المجلد الثاني عن العدد الثاني؛ [[sessions/2026-10-17-Comic-Sample-Summaries]]. مصدر Peanuts فهرس Open Library، لا تحقق ناشر؛ حقوق الصور والطبعات مستقلة.

- [[bugs/LF-053-Catalog-Search-Retry]]: فشل الفهرس أو جزء نتائج لا يتحول إلى «لا توجد نتائج»؛ زر retry يعيد نفس البحث والنوع، والأجزاء الناجحة تبقى محملة؛ [[sessions/2026-10-18-Catalog-Search-Retry]]. لا تصحيح إملائي أو اختبار مزود/جهاز حي ضمن هذه الدفعة.


- [[sessions/2026-10-21-UIUX-Story]]: تطبيق UI/UX Pro Max على نبذة العمل: نص16px، مصدر نصي/كائن، توسعة عند تجاوز3أسطر مع ARIA و44px. نجحت2345اختبارات كاملة و12حالة متصفح AR/EN وdark/light وتكبير200%؛ بيانات المستخدم مطابقة. الجهاز وVoiceOver مستقلان.


- [[sessions/2026-10-21-Story-Source-Hidden-Humanizer]]: قرار المالك الحالي يحذف عرض مصدر النبذة من كل الأعمال، مع إبقاء النص والبيانات الفنية والتوسعة. Humanizer على رسالة المراجعات الفارغة فقط. يلغي عرض الرابط المضاف في جلسة UIUX-Story.


- [[sessions/2026-10-21-Impeccable-Reader-Filters]]: Impeccable polish لمجموعة القراء/المراجعات: اسم AR/EN وaria-pressed وخيار نشط واضح مع focus. 2345اختبارًا و32حالة تفاعل على8صفحات؛ النبذات والبيانات المحفوظة مطابقة، والمصدر غير ظاهر. لا اعتماد للجهاز.


- [[sessions/2026-10-21-Ponytail-Empty-Facts]]: تطبيق Ponytail بقاعدة CSS واحدة لإخفاء شريط بيانات العمل الفارغ وإظهاره تلقائيًا عند وصول metadata؛33اختبارًا مرتبطًا و8حالات متصفح. النبذات والبيانات الشخصية وقراءة metadata محفوظة.


- [[sessions/2026-10-21-Hallmark-Chapter-Hierarchy]]: Hallmark لتسلسل عنوان الفصل: رقم أوضح عند غياب الاسم، تحميل هادئ، والعنوان الحقيقي محفوظ، مع الاحتفاظ بالمخزن المعروف عند فشل الطلب.2348اختبارًا و16حالة متصفح وحالتاQA معزولتان؛ لا تغيير للنبذات أو المصدر أو الحفظ.

[[sessions/2026-10-21-Local-UI-Review]]: six local UI changes for owner testing; direct drag/pinch photo framing supersedes sliders. Explicitly uncommitted.

[[sessions/2026-10-21-Explore-Refinement]] supersedes the initial local review section paging/filter layout: centered type labels, on-demand independent section pages and compact filters. Uncommitted.

[[sessions/2026-10-21-Trim-Explore]]: owner-selected smaller Explore row set; short reads retained, overlapping themed rows removed. Local review.

Type-page search now connects its selected format to the existing debounced online lookup and tracks pending/error states. Golden Son by Pierce Brown verified through Novel search and work detail; 53 focused checks. [[sessions/2026-10-21-Format-Search-Online]].


2026-10-21: [[sessions/2026-10-21-Search-Audit]] repairs main All-format online lookup and isolates People/Lists from catalog listeners; 234 focused checks, browser result evidence, and five matching installed simulator assets. Live directory/provider coverage remains separate. No commit or push.

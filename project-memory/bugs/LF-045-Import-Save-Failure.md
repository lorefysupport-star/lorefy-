---
{"kind":"bug","id":"LF-045","status":"closed","priority":"P1","area":"import-local-save","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"8001097","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Import-Save-Failure]]","next_action":"Verify cloud durability separately; continue CSV/TSV record parsing"}
---
# LF-045: لا نجاح استيراد عند فشل الكتابة المحلية

imApply كان يتجاهل false من write ثم يصدر ثلاثة stored-state ويعرض نجاحاً،
ولو حُفظ مفتاح واحد فقط. [المصدر](../../modules/lorefy-growth-features.js)
يأخذ القيم الخام السابقة للمفاتيح الثلاثة، ويتحقق من كل كتابة. عند الفشل
يحاول استرجاعها والتحقق منها، ويحذف المفتاح الذي كان غائباً. لا أحداث نجاح
ولا ملخص في مسار الفشل. المعاينة والاختيارات تبقى لإعادة المحاولة إذا نجح
التراجع؛ إن تعذر تماماً يوضح الحفظ الجزئي ويمنع إعادة محاولة مضللة من المعاينة.

ليس هذا transaction ذرياً بين مفاتيح localStorage ولا إثباتاً للخادم.
تعذر الاسترجاع له LOREFY_IMPORT_PARTIAL_SAVE مستقل، وتراجع ناجح له
LOREFY_IMPORT_SAVE_FAILED. لا حذف أو تصفير تلقائي للمكتبة.

7 حالات وحدة (6 فشلت قبل) وحالتا واجهة إضافيتان؛ 86/86 مرتبطة قبل cache.
[[sessions/2026-10-17-Import-Save-Failure]] | [[systems/Reading-Library]] | [[systems/Accounts-Sync]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

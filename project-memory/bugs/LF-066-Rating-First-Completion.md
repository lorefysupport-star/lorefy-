---
{"kind":"bug","id":"LF-066","status":"closed","priority":"P1","area":"reading","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"49a38df","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Rating-First-Completion]]","next_action":"Verify future installed source and controlled live-account durability separately; no build or production change"}
---
# LF-066: تقييم العمل غير المسجل لا يضيفه للمكتملة

بلاغ المالك أُعيد في الديمو: تقييم Berserk ‏4 محفوظ، والعمل غير موجود
بالمكتبة وتقدمه 0/384؛ الإحصاءات بقيت 1 مكتملة و420 فصلًا و84 ساعة تقديرية.
السبب سياسة فصل النشر عن الإكمال في LF-024/028، وليس فقد التقييم.

بتوجيه 18 أكتوبر، نجاح نشر تقييم عمل غير مسجل يضيفه للمكتملة ويلتقط
إجمالياته مرة واحدة. أي إدخال مكتبة أو checkpoint صريح، حتى الصفر، أو
علامة إزالة يمنع الاستبدال. الأهلية تفحص عند البدء وبعد الطلب من snapshot
يتحدث في كل render؛ فشل النشر وتغير الحساب أو الاختيار أثناء الانتظار لا
يضيفان إكمالًا. الزر يعلن الإضافة للمكتملة بالعربية والإنجليزية.

لا backfill من مراجعات قديمة عند التحميل، ولا مسح تقدم عند حذف التقييم.
إعادة النشر ونمو الكتالوج لا يضاعفان العدادات. المصدر والمتصفح مثبتان؛ لا
تركيب جهاز أو اعتماد خدمة. الساعات تقديرية وليست وقت جلسة مقاسًا.

[[15-Work-Control]] | [[12-Device-Repairs]] | [[systems/Reading-Library]] |
[[bugs/LF-028-Review-Only-Library]] | [[bugs/LF-024-Review-Progress-Independence]]

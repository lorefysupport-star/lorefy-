const SUPPORT_EMAIL = "lorefysupport@gmail.com";
const baseUrl = "https://qsroxmltioxqozmykens.supabase.co/functions/v1/lorefy-public";

const page = (title: string, body: string) => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title} - Lorefy</title>
<style>:root{color-scheme:light dark;--bg:#f5f5f7;--surface:#fff;--text:#1d1d1f;--muted:#666;--line:#ddd;--accent:#7227d8}@media(prefers-color-scheme:dark){:root{--bg:#09080d;--surface:#15131a;--text:#f5f5f7;--muted:#aaa4b3;--line:#312e38;--accent:#bd83ff}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,sans-serif}.shell{width:min(100%,760px);min-height:100vh;margin:auto;padding:38px 24px 70px;background:var(--surface)}header{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid var(--line)}header strong{font-size:18px;letter-spacing:2px}.mark{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#251036;color:#c694ff;font-size:24px}h1{font-size:clamp(30px,8vw,44px);margin:34px 0 8px}h2{font-size:19px;margin:0 0 9px}p,li{color:var(--muted);font-size:15px;line-height:1.9}section{padding:23px 0;border-top:1px solid var(--line)}a{color:var(--accent);font-weight:700}.nav{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}.nav a{display:inline-block;padding:10px 14px;border:1px solid var(--line);border-radius:10px;text-decoration:none}</style></head>
<body><main class="shell"><header><strong>LOREFY</strong><span class="mark">✦</span></header>${body}<nav class="nav"><a href="${baseUrl}/privacy">الخصوصية</a><a href="${baseUrl}/support">الدعم</a><a href="${baseUrl}/terms">الشروط</a><a href="${baseUrl}/community-guidelines">المجتمع</a></nav></main></body></html>`;

const pages: Record<string, string> = {
  "/": page("Lorefy", `<h1>مكتبتك. قصصك. عالمك.</h1><p>نظّم قراءاتك، قيّم الأعمال والشخصيات، وأنشئ قوائمك وشارك مراجعاتك في Lorefy.</p><section><h2>الدعم</h2><p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p></section>`),
  "/privacy": page("سياسة الخصوصية", `<h1>سياسة الخصوصية</h1><p>آخر تحديث: 13 أغسطس 2026</p><section><h2>البيانات</h2><p>ينشئ Lorefy حسابك باستخدام Google أو Apple. نعالج معرّف الحساب والبريد والاسم والصورة التي يوفرها مزود الدخول، إضافة إلى المكتبة وتقدم القراءة والتقييمات والمراجعات والقوائم والتفضيلات والصور التي ترفعها.</p></section><section><h2>الاستخدام والمشاركة</h2><p>نستخدم البيانات لتسجيل الدخول والمزامنة والبحث والمجتمع ومنع الإساءة. تعالج Supabase الحساب والمزامنة والتخزين، ويعالج Google أو Apple تسجيل الدخول. لا نبيع بياناتك ولا نستخدمها للتتبع عبر تطبيقات أخرى.</p></section><section><h2>المحتوى العام</h2><p>قد تظهر المراجعات والتعليقات والصور التي تنشرها للمستخدمين الآخرين. يمكنك حذف محتواك والإبلاغ والحظر والكتم.</p></section><section><h2>الحفظ والحذف</h2><p>نحتفظ بالبيانات ما دام الحساب قائماً. يمكنك حذف الحساب من داخل التطبيق؛ يحذف المسار حسابك وملفاتك الخاصة وبيانات المزامنة ويلغي تفويض Apple عندما ينطبق.</p></section><section><h2>التواصل</h2><p>لطلب الوصول أو التصحيح أو الحذف: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p></section>`),
  "/support": page("الدعم", `<h1>دعم Lorefy</h1><section><h2>تواصل معنا</h2><p>أرسل وصف المشكلة وإصدار التطبيق ونوع الجهاز إلى <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>. لا ترسل كلمة المرور أو رمز التحقق.</p></section><section><h2>الحساب والحذف</h2><p>استخدم Google أو Apple نفسه الذي بدأت به. لحذف الحساب افتح الإعدادات ← الخصوصية والبيانات ← حذف الحساب.</p></section><section><h2>محتوى مسيء</h2><p>استخدم الإبلاغ من قائمة المراجعة أو التعليق، ثم اكتم المستخدم أو احظره عند الحاجة. نعالج المخاطر المباشرة بأولوية.</p></section>`),
  "/terms": page("شروط الاستخدام", `<h1>شروط الاستخدام</h1><p>آخر تحديث: 13 أغسطس 2026</p><section><h2>الخدمة والحساب</h2><p>Lorefy لتنظيم القراءات والتقييمات والقوائم والمراجعات. يجب استخدام حساب Google أو Apple صالح وأنت مسؤول عن نشاط حسابك.</p></section><section><h2>المحتوى والحقوق</h2><p>تظل حقوق الأعمال والأغلفة والصور لأصحابها. لا تنشر مادة لا تملك حق استخدامها، وقد نحذف المحتوى المخالف عند تلقي بلاغ صحيح.</p></section><section><h2>السلوك</h2><p>يمنع التحرش والتهديد والكراهية والمحتوى الجنسي الصريح وانتحال الهوية والرسائل المزعجة وانتهاك الخصوصية أو الملكية الفكرية.</p></section><section><h2>التواصل</h2><p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p></section>`),
  "/community-guidelines": page("إرشادات المجتمع", `<h1>إرشادات المجتمع</h1><section><h2>الممنوع</h2><p>التحرش والتهديد والكراهية والتنمر والمحتوى الجنسي الصريح واستغلال القاصرين وانتحال الهوية وكشف المعلومات الشخصية والرسائل المزعجة وانتهاك الحقوق.</p></section><section><h2>الحرق</h2><p>استخدم علامة الحرق قبل ذكر الأحداث المهمة.</p></section><section><h2>الإبلاغ والحظر</h2><p>يمكن الإبلاغ عن أي مراجعة أو تعليق. استخدم الكتم لإخفاء المحتوى أو الحظر لإخفائه ومنع التفاعل. يراجع فريق Lorefy البلاغات ويتخذ الإجراء المناسب.</p></section><section><h2>التواصل</h2><p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p></section>`)
};

Deno.serve((request) => {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405 });
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const lastSegment = segments.at(-1) || "";
  const functionPath = lastSegment === "lorefy-public" ? "/" : `/${lastSegment}`;
  const content = pages[functionPath];
  if (!content) return new Response("Not Found", { status: 404 });
  return new Response(request.method === "HEAD" ? null : content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    }
  });
});

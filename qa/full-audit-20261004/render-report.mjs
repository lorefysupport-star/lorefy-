import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(folder, '../../docs/FULL_APP_AUDIT_2026-10-04.md');
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = value => escape(value).replace(/`([^`]+)`/g, '<code dir="ltr">$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const lines = fs.readFileSync(source, 'utf8').split(/\r?\n/);
let html = '';
let list = '';
let table = false;
let tableHeader = false;
let headings = [];
function closeBlocks() {
  if (list) { html += `</${list}>`; list = ''; }
  if (table) { html += '</tbody></table></div>'; table = false; }
}
for (const line of lines) {
  if (!line.trim()) { closeBlocks(); continue; }
  const heading = line.match(/^(#{1,3}) (.*)$/);
  if (heading) {
    closeBlocks();
    const id = `section-${headings.length}`;
    headings.push({ id, level: heading[1].length, title: heading[2] });
    html += `<h${heading[1].length} id="${id}">${inline(heading[2])}</h${heading[1].length}>`;
    continue;
  }
  if (/^\|/.test(line)) {
    if (!table) { closeBlocks(); html += '<div class="table-scroll"><table>'; table = true; tableHeader = true; }
    if (/^\|[\s:|-]+\|$/.test(line)) { html += '<tbody>'; continue; }
    const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
    const tag = tableHeader ? 'th' : 'td';
    html += `<tr>${cells.map(cell => `<${tag}>${inline(cell)}</${tag}>`).join('')}</tr>`;
    tableHeader = false;
    continue;
  }
  const bullet = line.match(/^(- |\d+\. )(.*)$/);
  if (bullet) {
    const wanted = bullet[1] === '- ' ? 'ul' : 'ol';
    if (list !== wanted) { closeBlocks(); list = wanted; html += `<${list}>`; }
    html += `<li>${inline(bullet[2])}</li>`;
    continue;
  }
  closeBlocks();
  html += `<p>${inline(line)}</p>`;
}
closeBlocks();
const evidence = [
  ['32-privacy-dark-stable', 'تباين نافذة الخصوصية في الداكن'],
  ['41-author-taxonomy', 'صفحة الكاتب وتصنيف مجلدات المانجا'],
  ['42-character-empty-en', 'تقييم الشخصيات: الداكن والترجمة'],
  ['45-favorite-character-picker', 'اختيار المفضلة وزر الحفظ'],
  ['10-search-martin', 'نتائج المؤلف وتقييمات الصفر'],
  ['13-discover', 'استكشف وحجم الأقسام'],
  ['15-profile-dropped-empty', 'الحالة الفارغة في المتروك'],
  ['20-lists', 'قوائمي في الثيم الوردي'],
  ['23-year-summary', 'الملخص السنوي'],
  ['24-import-sources', 'واجهة الاستيراد'],
  ['40-chapter-local-comment', 'تعليق محلي داخل مناقشة الفصل'],
  ['43-character-export', 'ملف PNG مولد: الصور موجودة، العنوان مقصوص'],
  ['46-profile-tablet-light', 'الحساب على مقاس الآيباد'],
  ['47-home-tablet-light', 'المجتمع على مقاس الآيباد'],
  ['48-discover-desktop-light', 'استكشف على الكمبيوتر'],
  ['49-search-desktop-light', 'البحث على الكمبيوتر']
];
const gallery = evidence.map(([name, label]) => `<figure><a href="${name}.png" target="_blank"><img loading="lazy" src="${name}.png" alt="${escape(label)}"></a><figcaption>${escape(label)}<small dir="ltr">${name}.png</small></figcaption></figure>`).join('');
const toc = headings.filter(h => h.level === 2).map(h => `<a href="#${h.id}">${escape(h.title)}</a>`).join('');
const page = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lorefy | فحص التطبيق 4 أكتوبر 2026</title><style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fff;color:#202124;font:16px/1.95 Tahoma,Arial,sans-serif}header{border-bottom:1px solid #dfe3e6;padding:28px max(24px,calc((100vw - 1180px)/2));background:#f6f7f8}header strong{font-size:26px}header p{margin:4px 0;color:#50575c}.status{color:#a12222;font-weight:700}main{max-width:1180px;margin:auto;padding:24px;display:grid;grid-template-columns:210px minmax(0,1fr);gap:40px}aside nav{position:sticky;top:20px;display:flex;flex-direction:column;gap:8px;font-size:13px}a{color:#1365a4;text-decoration:none}a:hover{text-decoration:underline}article{min-width:0}h1{font-size:25px;line-height:1.5;margin-top:0}h2{font-size:23px;border-bottom:2px solid #252b30;padding-bottom:8px;margin-top:40px;scroll-margin-top:20px}h3{font-size:19px;margin-top:32px;scroll-margin-top:20px}p{margin:12px 0}li{margin:8px 0}code{font:13px/1.7 Consolas,monospace;background:#f1f3f5;padding:2px 4px;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.8}th,td{border-bottom:1px solid #dfe3e6;padding:10px;vertical-align:top;text-align:right}th{background:#f1f3f5}.table-scroll{overflow:auto}.evidence{max-width:1180px;margin:auto;padding:24px;border-top:2px solid #252b30}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}figure{margin:0;min-width:0}figure img{width:100%;height:340px;object-fit:contain;object-position:top;background:#eff1f3;border:1px solid #ddd}figcaption{font-size:13px;line-height:1.7;padding-top:8px}small{display:block;color:#676d72;overflow-wrap:anywhere}.files{display:flex;gap:20px;flex-wrap:wrap}.files a{border-bottom:1px solid;padding:4px 0}footer{padding:24px;border-top:1px solid #ddd;text-align:center;color:#555;font-size:13px}@media(max-width:850px){main{display:block}aside{margin-bottom:24px}aside nav{position:static;flex-direction:row;flex-wrap:wrap;gap:10px}aside a{border-bottom:1px solid #ddd}.gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){body{font-size:14px}main{padding:18px}h1{font-size:22px}h2{font-size:20px}h3{font-size:17px}.gallery{grid-template-columns:1fr}header strong{font-size:22px}}@media print{aside{display:none}main{display:block;max-width:none}.gallery{grid-template-columns:repeat(3,1fr)}h2,h3{break-after:avoid}figure{break-inside:avoid}a{color:#222}header{padding:15px}}
</style></head><body><header><strong>Lorefy · تقرير فحص التطبيق</strong><p>4 أكتوبر 2026 · نسخة محلية · أدلة واختبارات وتغطية</p><p class="status">الجاهزية غير معتمدة: إصلاحات عاجلة واختبارات هاتف مطلوبة</p><div class="files"><a href="../../docs/FULL_APP_AUDIT_2026-10-04.md">ملف التقرير Markdown</a><a href="tests.log">سجل الاختبارات</a><a href="network-input-leak.json">دليل طلبات النماذج</a><a href="#evidence">الأدلة البصرية</a></div></header><main><aside><nav>${toc}<a href="#evidence">صور الأدلة</a></nav></aside><article>${html}</article></main><section class="evidence" id="evidence"><h2>أدلة الجولة الحالية</h2><p>الصور الأصلية قابلة للفتح. ملف مشاركة الشخصيات مولد مباشرة من API محلي؛ لا يثبت التسليم إلى تطبيق خارجي.</p><div class="gallery">${gallery}</div></section><footer>فحص فقط. لا رفع بيلد أو تعديل كود التطبيق في هذه الجولة. المسارات غير المتحققة مذكورة صراحة.</footer></body></html>`;
fs.writeFileSync(path.join(folder, 'report.html'), page, 'utf8');
console.log(JSON.stringify({ report: path.join(folder, 'report.html'), sections: headings.length, evidence: evidence.length }));

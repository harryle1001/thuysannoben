'use strict';
// Quick on-page SEO audit of the running site: node scripts/seo-audit.js [base-url]
// Checks every URL in the sitemap for status, one H1, title and description length,
// canonical, valid JSON-LD and images without alt text.
const BASE = process.argv[2] || 'http://localhost:3000';

(async () => {
  const sitemap = await (await fetch(BASE + '/sitemap.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  const problems = [];
  const types = {};
  for (const u of urls) {
    const res = await fetch(BASE + u);
    const html = await res.text();
    const bad = (msg) => problems.push(`${u}: ${msg}`);
    if (res.status !== 200) { bad(`status ${res.status}`); continue; }
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) bad(`${h1} thẻ H1`);
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    if (title.length < 20 || title.length > 75) bad(`tiêu đề dài ${title.length} ký tự: ${title}`);
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    if (desc.length < 70 || desc.length > 320) bad(`mô tả dài ${desc.length} ký tự`);
    if (!/<link rel="canonical"/.test(html)) bad('thiếu canonical');
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        const t = JSON.parse(m[1])['@type'];
        [].concat(t).forEach((x) => (types[x] = (types[x] || 0) + 1));
      } catch (e) {
        bad('JSON-LD lỗi: ' + e.message);
      }
    }
    const noAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/g) || []).length;
    if (noAlt) bad(`${noAlt} ảnh thiếu alt`);
  }
  console.log(`Đã kiểm tra ${urls.length} trang.`);
  console.log('Dữ liệu cấu trúc:', JSON.stringify(types));
  console.log(problems.length ? `${problems.length} vấn đề:\n` + problems.join('\n') : 'Không có vấn đề.');
  process.exit(problems.length ? 1 : 0);
})();

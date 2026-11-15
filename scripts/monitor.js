'use strict';
// Uptime check for the live site: 10 key URLs (status, response time, an expected word in the page)
// plus a dry-run contact form post (header X-Noben-Dry-Run: 1, the server validates but saves nothing).
// Usage: node scripts/monitor.js [--base https://thuysannoben.com] [--report report.md]
// Exit code 1 when any check fails. Used hourly by .github/workflows/monitor.yml.
const fs = require('fs');

const arg = (name, def) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : def; };
const BASE = String(arg('--base', process.env.MONITOR_BASE || 'https://thuysannoben.com')).replace(/\/$/, '');
const REPORT = arg('--report', '');
const SLOW_MS = Number(process.env.MONITOR_SLOW_MS || 8000);

const CHECKS = [
  ['/', /Noben/i],
  ['/san-pham', /Noben/i],
  ['/san-pham/kalimix', /kalimix/i],
  ['/lien-he', /<form[^>]+lien-he/i],
  ['/tuyen-dai-ly', /đại lý/i],
  ['/lp/mua-mua', /Noben/i],
  ['/sitemap.xml', /<urlset/],
  ['/robots.txt', /Sitemap:/],
  ['/healthz', /"dataWritable":true/],
  ['/en', /Noben/i],
];

async function timed(url, opts = {}) {
  const t0 = Date.now();
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'noben-monitor/1.0', ...(opts.headers || {}) }, ...opts });
  const text = await res.text();
  return { res, text, ms: Date.now() - t0 };
}

async function run() {
  const rows = [];
  for (const [p, want] of CHECKS) {
    try {
      const { res, text, ms } = await timed(BASE + p);
      const problems = [];
      if (res.status !== 200) problems.push(`mã ${res.status}`);
      if (!want.test(text)) problems.push('thiếu nội dung mong đợi');
      if (ms > SLOW_MS) problems.push(`chậm ${ms} ms`);
      rows.push({ name: p, ok: !problems.length, status: res.status, ms, note: problems.join(', ') });
    } catch (err) {
      rows.push({ name: p, ok: false, status: 0, ms: 0, note: err.name === 'TimeoutError' ? 'quá 20 giây' : err.message });
    }
  }
  // Dry-run form: same validation as a real visitor, nothing stored.
  try {
    const body = new URLSearchParams({ name: 'Kiểm tra tự động', phone: '0900000000', province: 'Test', need: 'Khác', message: 'monitor dry-run', page: '/lien-he' });
    const { res, text, ms } = await timed(BASE + '/lien-he', { method: 'POST', body, headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'X-Noben-Dry-Run': '1', Origin: BASE } });
    let j = {};
    try { j = JSON.parse(text); } catch { /* not json */ }
    const ok = res.status === 200 && j.ok === true && j.dryRun === true;
    rows.push({ name: 'POST /lien-he (dry-run)', ok, status: res.status, ms, note: ok ? '' : j.ok && !j.dryRun ? 'server chưa nhận diện dry-run' : 'form không nhận' });
  } catch (err) {
    rows.push({ name: 'POST /lien-he (dry-run)', ok: false, status: 0, ms: 0, note: err.message });
  }

  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${String(r.status).padEnd(3)} ${String(r.ms).padStart(5)} ms  ${r.name}${r.note ? '  ← ' + r.note : ''}`);
  console.log(failed.length ? `\n${failed.length} kiểm tra lỗi` : '\nWebsite hoạt động bình thường');
  if (REPORT) {
    const md = [
      `Kiểm tra lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (giờ Việt Nam), trang ${BASE}`,
      '',
      '| Kết quả | URL | Mã | Thời gian | Ghi chú |',
      '|---|---|---|---|---|',
      ...rows.map((r) => `| ${r.ok ? '✅' : '❌'} | \`${r.name}\` | ${r.status || '-'} | ${r.ms} ms | ${r.note || ''} |`),
    ].join('\n');
    fs.writeFileSync(REPORT, md + '\n');
  }
  process.exit(failed.length ? 1 : 0);
}

run();

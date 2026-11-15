'use strict';
// Starts the server on a spare port and checks that every important URL answers as expected.
// Run with: npm run check
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Unit tests first (TOTP, data folder, backups, webhook).
execFileSync(process.execPath, [path.join(__dirname, 'test-security.js')], { stdio: 'inherit' });
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'noben-smoke-'));

const PORT = 3999;
const base = `http://127.0.0.1:${PORT}`;
const checks = [
  ['/', 200],
  ['/san-pham', 200],
  ['/lp/ao-bat-mat-do-cao', 200],
  ['/lp/mua-mua', 200],
  ['/lp/gia-cong-oem', 200],
  ['/san-pham?van-de=gan-ruot&q=phan', 200],
  ['/san-pham/nhom/khoang-chat', 200],
  ['/san-pham/kalimix', 200],
  ['/san-pham/prazi-s', 301, '/san-pham/nhom/tri-benh'],
  ['/ky-thuat-nuoi', 200],
  ['/tin-tuc', 200],
  ['/bai-viet/benh-dom-den-tren-tom-the', 200],
  ['/ve-chung-toi', 200],
  ['/chung-nhan', 200],
  ['/gia-cong', 200],
  ['/lien-he', 200],
  ['/tinh-lieu', 200],
  ['/tinh-lieu?sp=aqua-bac', 200],
  ['/lich-cham-soc', 200],
  ['/danh-gia', 200],
  ['/danh-gia?sp=kalimix', 200],
  ['/quan-tri/danh-gia', 303, '/quan-tri/dang-nhap?next=/quan-tri/danh-gia'],
  ['/anh-danh-gia/000000000000-1.webp', 404],
  ['/chinh-sach/chinh-sach-doi-tra', 200],
  ['/sitemap.xml', 200],
  ['/en/solutions', 200],
  ['/en/solutions/phan-trang-gan-tuy', 200],
  ['/en/knowledge', 200],
  ['/en/knowledge/topic/shrimp-diseases', 200],
  ['/en/knowledge/benh-vi-bao-tu-trung-ehp-tren-tom', 200],
  ['/en/knowledge/khong-co', 404],
  ['/robots.txt', 200],
  ['/products/kalimix', 301, '/san-pham/kalimix'],
  ['/products/prazi-s', 301, '/san-pham/nhom/tri-benh'],
  ['/product-categories/nhom-khoang-chat', 301, '/san-pham/nhom/khoang-chat'],
  ['/benh-dom-den-tren-tom-the', 301, '/bai-viet/benh-dom-den-tren-tom-the'],
  ['/tong-quan-ve-cong-ty', 301, '/ve-chung-toi'],
  ['/trang-khong-ton-tai', 404],
  ['/quan-tri/dang-nhap', 200],
  ['/quan-tri/lien-he', 303, '/quan-tri/dang-nhap?next=/quan-tri/lien-he'],
  ['/quan-tri/2fa', 303, '/quan-tri/dang-nhap?next=/quan-tri/2fa'],
  ['/quan-tri/xac-thuc', 303, '/quan-tri/dang-nhap'],
  ['/healthz', 200],
];

const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
  env: { ...process.env, PORT: String(PORT), DATA_DIR, INDEXNOW_AUTO: '0' },
  stdio: ['ignore', 'pipe', 'inherit'],
});

let started = false;
server.stdout.on('data', async (chunk) => {
  if (started || !/đang chạy/.test(String(chunk))) return;
  started = true;
  let failed = 0;
  for (const [url, status, location] of checks) {
    try {
      const res = await fetch(base + url, { redirect: 'manual' });
      const loc = res.headers.get('location') || '';
      const ok = res.status === status && (!location || loc.endsWith(location));
      if (!ok) failed++;
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${res.status} ${url}${loc ? ' -> ' + loc : ''}`);
    } catch (err) {
      failed++;
      console.log(`FAIL ${url}: ${err.message}`);
    }
  }
  // Health check JSON, dry-run form (nothing saved) and a real form post (saved).
  const extra = async (name, fn) => {
    try { const ok = await fn(); if (!ok) failed++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}`); } catch (err) { failed++; console.log(`FAIL ${name}: ${err.message}`); }
  };
  const form = (dry) => fetch(base + '/lien-he', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', ...(dry ? { 'X-Noben-Dry-Run': '1' } : {}) }, body: new URLSearchParams({ name: 'Kiểm thử', phone: '0900000000', need: 'Khác' }) }).then((r) => r.json());
  const leadCount = () => { try { return fs.readFileSync(path.join(DATA_DIR, 'leads.jsonl'), 'utf8').split('\n').filter(Boolean).length; } catch { return 0; } };
  await extra('/healthz báo ghi được dữ liệu', async () => (await (await fetch(base + '/healthz')).json()).dataWritable === true);
  await extra('form dry-run không lưu', async () => (await form(true)).dryRun === true && leadCount() === 0);
  await extra('form thật lưu vào DATA_DIR', async () => (await form(false)).ok === true && leadCount() === 1);
  server.kill();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  console.log(failed ? `\n${failed} kiểm tra thất bại` : '\nTất cả kiểm tra đều đạt');
  process.exit(failed ? 1 : 0);
});

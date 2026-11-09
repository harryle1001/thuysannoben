'use strict';
// Starts the server on a spare port and checks that every important URL answers as expected.
// Run with: npm run check
const { spawn } = require('child_process');
const path = require('path');

const PORT = 3999;
const base = `http://127.0.0.1:${PORT}`;
const checks = [
  ['/', 200],
  ['/san-pham', 200],
  ['/san-pham?van-de=gan-ruot&q=phan', 200],
  ['/san-pham/nhom/khoang-chat', 200],
  ['/san-pham/prazi-s', 200],
  ['/ky-thuat-nuoi', 200],
  ['/tin-tuc', 200],
  ['/bai-viet/benh-dom-den-tren-tom-the', 200],
  ['/ve-chung-toi', 200],
  ['/chung-nhan', 200],
  ['/gia-cong', 200],
  ['/lien-he', 200],
  ['/chinh-sach/chinh-sach-doi-tra', 200],
  ['/sitemap.xml', 200],
  ['/robots.txt', 200],
  ['/products/prazi-s', 301, '/san-pham/prazi-s'],
  ['/product-categories/nhom-khoang-chat', 301, '/san-pham/nhom/khoang-chat'],
  ['/benh-dom-den-tren-tom-the', 301, '/bai-viet/benh-dom-den-tren-tom-the'],
  ['/tong-quan-ve-cong-ty', 301, '/ve-chung-toi'],
  ['/trang-khong-ton-tai', 404],
];

const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'inherit'],
});

server.stdout.once('data', async () => {
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
  server.kill();
  console.log(failed ? `\n${failed} kiểm tra thất bại` : '\nTất cả kiểm tra đều đạt');
  process.exit(failed ? 1 : 0);
});

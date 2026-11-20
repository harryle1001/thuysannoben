#!/usr/bin/env node
'use strict';
// Kiểm thử bộ sinh nhãn: đủ nhãn cho mọi sản phẩm hiển thị, SVG hợp lệ và đủ lớp, không chữ tràn ở MỌI khổ.
//   node scripts/test-labels.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const HIDDEN = require(path.join(ROOT, 'src', 'hidden.js'));
const LAYERS = ['nen', 'dai-thuong-hieu', 'logo', 'ten-san-pham', 'cong-dung', 'huong-dan', 'thanh-phan', 'phap-ly', 'ma-vach', 'vung-an-toan'];
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); if (!ok) failed++; };

const visible = require(path.join(ROOT, 'content', 'products.json')).filter((p) => !HIDDEN.has(p.slug)).map((p) => p.slug);
const labels = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand', 'labels.json'), 'utf8')).san_pham;
check(labels.length === visible.length && visible.every((s) => labels.some((l) => l.slug === s)), `brand/labels.json có đủ ${visible.length} sản phẩm hiển thị (${labels.length})`);
check(labels.every((l) => l.phap_ly && ['so_dang_ky', 'nsx', 'hsd', 'khoi_luong_tinh', 'ma_vach'].every((k) => k in l.phap_ly)), 'mỗi nhãn có đủ trường pháp lý');
check(labels.every((l) => !l.so_dang_ky_doc_tu_anh || /kiểm tra lại/.test(l.so_dang_ky_doc_tu_anh.ghi_chu || '')), 'số đăng ký đọc từ ảnh luôn kèm ghi chú cần kiểm tra lại');

const dir = path.join(ROOT, 'brand', 'nhan');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.svg')) : [];
check(visible.every((s) => files.includes(`${s}.svg`)), `brand/nhan có SVG cho cả ${visible.length} sản phẩm (${files.length} file)`);
let bad = [];
for (const f of files) {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  const missing = LAYERS.filter((id) => !s.includes(`<g id="${id}"`));
  if (!/^<\?xml[^>]*>\s*<svg [^>]*width="[\d.]+mm" height="[\d.]+mm"/.test(s) || !/<\/svg>\s*$/.test(s) || missing.length || !/<text[\s>]/.test(s)) bad.push(`${f}${missing.length ? ' thiếu ' + missing.join(',') : ''}`);
  if (/<path[^>]*d="[^"]{2000,}"[^>]*fill="#13213a"/.test(s)) bad.push(`${f}: chữ nội dung bị chuyển nét`);
}
check(!bad.length, `SVG đúng khung (mm, đủ ${LAYERS.length} lớp, chữ là <text>)${bad.length ? ': ' + bad.slice(0, 5).join('; ') : ''}`);

// Dàn trang lại toàn bộ ở mọi khổ (túi, chai, xô) trong Chromium: XML hợp lệ, getBBox không tràn, không chồng chữ.
try {
  const out = execFileSync(process.execPath, [path.join(__dirname, 'build-labels.js'), '--kiem-tra'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const last = out.trim().split('\n').pop();
  check(/ 0 nhãn có lỗi/.test(last), `dàn trang mọi khổ: ${last}`);
} catch (e) {
  const msg = String(e.stdout || e.message).trim().split('\n').filter((l) => /^LỖI|nhãn có lỗi|Cần Playwright/.test(l)).slice(0, 8).join('\n');
  check(false, `dàn trang mọi khổ có lỗi:\n${msg}`);
}

console.log(failed ? `\n${failed} kiểm tra nhãn thất bại` : '\nKiểm thử nhãn đều đạt');
process.exit(failed ? 1 : 0);

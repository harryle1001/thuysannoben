#!/usr/bin/env node
'use strict';
// Kiểm thử bản tiếng Anh của sản phẩm: mọi dòng tagline/uses/dose/composition của sản phẩm đang hiển thị
// phải có bản dịch trong content/en/strings.json (khóa là chuỗi tiếng Việt đã chuẩn hóa, xem src/en.js),
// để trang /en không hiện chữ tiếng Việt sau khi sửa nội dung sản phẩm.
//   node scripts/test-en-strings.js
const path = require('path');
const root = path.join(__dirname, '..');
const c = require(path.join(root, 'src', 'content'));
const en = require(path.join(root, 'src', 'en'));
const strings = require(path.join(root, 'content', 'en', 'strings.json'));

const norm = (x) =>
  String(x || '')
    .replace(/<sup>3<\/sup>/g, '³')
    .replace(/<sup>2<\/sup>/g, '²')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const FIELDS = ['tagline', 'uses', 'dose', 'composition'];
let failed = 0;

for (const p of c.products) {
  for (const f of FIELDS) {
    for (const s of [].concat(p[f] || [])) {
      const k = norm(s);
      if (k && !strings[k] && VI.test(k)) {
        failed++;
        console.log(`FAIL thiếu bản dịch ${p.slug}.${f}: ${k}`);
      }
    }
  }
}
for (const p of en.products) {
  for (const f of FIELDS) {
    for (const s of [].concat(p[f] || [])) {
      if (VI.test(s)) {
        failed++;
        console.log(`FAIL còn chữ tiếng Việt trên trang /en ${p.slug}.${f}: ${s}`);
      }
    }
  }
}
console.log(failed ? `\n${failed} chuỗi sản phẩm thiếu bản dịch tiếng Anh` : `OK   ${c.products.length} sản phẩm hiển thị: mọi dòng tagline, công dụng, liều dùng, thành phần đều có bản dịch tiếng Anh`);
process.exit(failed ? 1 : 0);

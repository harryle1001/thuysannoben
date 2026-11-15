'use strict';
// Tests the label dose parser (public/js/dose.js) on fixed cases and on every product.
// Run with: node scripts/test-dose.js
const assert = require('assert');
const D = require('../public/js/dose.js');
const products = require('../content/products.json');

const pond = { volume: 3000, area: 2500, feed: 20 };
const cases = [
  ['Dùng 1 lít/3.000m<sup>3</sup> nước', 'volume', '1 lít'],
  ['Dùng 227g/5.000m<sup>3</sup> nước, định kỳ 3 ngày/lần.', 'volume', '136 g'],
  ['Dùng 3kg/2.000m<sup>3</sup> nước', 'volume', '4,5 kg'],
  ['Dùng 10 - 15 lít/1.000m3 nước', 'volume', '30 lít – 45 lít'],
  ['Dùng 1 lít/ 3.000 - 5.000m3 nước', 'volume', '600 ml – 1 lít'],
  ['Dùng 1kg/300 - 500m3 nước', 'volume', '6 kg – 10 kg'],
  ['Dùng 454g NB ALGAE/ 3.000m3 nước', 'volume', '454 g'],
  ['Gây màu: Dùng 1 gói NB - BROWN 250g/ 1.500m3 nước', 'volume', '500 g'],
  ['Dùng 20 kg/ 2.000m2 nước', 'area', '25 kg'],
  ['Trộn 5g/kg thức ăn, trộn 2 - 3 lần/ngày', 'feed', '100 g'],
  ['Trộn 5 - 10ml/kg thức ăn', 'feed', '100 ml – 200 ml'],
  ['Bổ sung vào thức ăn hàng ngày: Trộn 3g/kg thưc ăn', 'feed', '60 g'],
];
for (const [line, type, want] of cases) {
  const r = D.parseLine(line);
  assert.ok(r.doses.length, `không đọc được: ${line}`);
  assert.strictEqual(r.doses[0].type, type, line);
  assert.strictEqual(D.compute(r.doses[0], pond), want, line);
}
// Two doses in one line (feed + water).
assert.strictEqual(D.parseLine('Trộn 20g/kg thức ăn và kết hợp tạt xuống ao với liều 1kg/2.000m3 nước').doses.length, 2);
// Not a dose: must stay unparsed.
assert.strictEqual(D.parseLine('Trộn g/kg thưc ăn, cho ăn 2- 3 lần/ngày').doses.length, 0);
assert.strictEqual(D.parseLine('Mở máy quạt nước khi sử dụng.').candidate, false);
// Brewed solution litres are flagged.
const brew = D.parseProduct(['Lấy 1 gói + 2kg đường + 50 lít nước ngâm ủ sục khí rồi đem ra sử dụng với liều lượng như sau', 'Dùng 10 lít/1.000m3 nước']);
assert.strictEqual(brew[1].brew, true);
console.log(`OK  ${cases.length + 4} trường hợp mẫu`);

let cand = 0, parsed = 0, withDose = 0;
const misses = [];
for (const p of products) {
  const lines = D.parseProduct(p.dose);
  if (lines.some((l) => l.doses.length)) withDose++;
  for (const l of lines) {
    if (!l.candidate) continue;
    cand++;
    if (l.doses.length) parsed++;
    else misses.push(`${p.slug}: ${l.text}`);
  }
}
console.log(`Sản phẩm có liều tính được: ${withDose}/${products.length}`);
console.log(`Dòng liều phân tích được: ${parsed}/${cand} (${((parsed / cand) * 100).toFixed(1)}%)`);
if (misses.length) console.log('Dòng không phân tích được (hiện nguyên văn):\n  ' + misses.join('\n  '));
if (parsed / cand < 0.9) { console.log('FAIL tỉ lệ dưới 90%'); process.exit(1); }

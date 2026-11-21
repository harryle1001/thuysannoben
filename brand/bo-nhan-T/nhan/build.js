#!/usr/bin/env node
'use strict';
// Bộ nhãn Thủy Sản Tím: nhãn quấn chai/gói, khổ tỷ lệ vàng 161,8 × 100 mm (φ : 1), 3 mặt.
//   node nhan/build.js                 sinh tất cả sản phẩm trong nhan/san-pham.json
//   node nhan/build.js --chi vh-glubenco-pro,us-lacto --concept a   (a, b, c; mặc định cả 3)
// Xuất ra nhan/out/: <slug>-concept-<a|b|c>.pdf (vector, tràn lề 3 mm + dấu xén, đưa nhà in),
//                    <slug>.png (ảnh xem trước 600 dpi, trong đường xén), <slug>.html (mở/sửa trực tiếp).
// Chữ tự co để vừa khung; nhãn nào phải xuống dưới cỡ tối thiểu sẽ báo lỗi.
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(DIR, 'out');
const args = process.argv.slice(2);
const opt = (f) => { const i = args.indexOf(f); return i > -1 ? args[i + 1] : null; };

const PHI = 1.61803;
// Khổ (mm): rộng = φ × cao. Ba mặt: hai mặt bên mỗi mặt 38,2%/2 · φ… cụ thể 50 | 61,8 | 50.
// LABEL_H: chiều cao nhãn (mm). 100 cho chai 1 lít. Chai 500 ml: LABEL_H=80, mặt trước 49,4 × 80 (đúng φ : 1),
// hai mặt bên giữ rộng 50 mm như nhãn 1 lít để chữ hướng dẫn không nhỏ quá: khổ 149,4 × 80 mm.
const H = +process.env.LABEL_H || 100, BLEED = 3, MARK = 6;
const FRONT = +(H * 0.618).toFixed(1), SIDE = +process.env.SIDE_W || 50, W = +(FRONT + 2 * SIDE).toFixed(1); // 61,8 mm = 38,2% tổng
const MIN_BODY = 1.6; // mm ≈ 4,5 pt

// Thang chữ φ (mm), gốc 2,1 mm ≈ 6 pt.
const T = { xs: 1.62, s: 1.85, b: 2.1, h: 3.4, l: 5.5, xl: 8.9, xxl: 14.4 };

// In trực tiếp lên bao bì: CHỈ 2 MÀU ĐẶC — tím TIM và trắng. Không chuyển màu, không tram mờ, nét ≥ 0,2 mm.
const P = '#0c2a63'; // tím (màu giữa của logo TIM) — nhà in pha theo mã này
const WH = '#ffffff';
const G = '#b39a66'; // nhũ vàng champagne (concept D, mực nhũ / ép kim)
const { emblemSvg } = require('./emblem.js');
// Pha màu với trắng (t = 0..1) — tạo tông nhạt của màu sản phẩm.
function tint(hex, t) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
// Cung sóng φ (concept E): các phần tư hình tròn đồng tâm ở góc (cx, cy), bán kính chia φ, nhiều lớp màu.
function arcs(pc, cx, cy, Rmax, nhom) {
  const cols = [tint(pc, 0.82), tint(pc, 0.55), G, pc, P, WH];
  let s = '';
  // nhận biết nhóm: xử lý môi trường = cung tròn (sóng nước) · thức ăn bổ sung = hình thoi (hạt thức ăn)
  cols.forEach((col, k) => {
    const r = Rmax / Math.pow(PHI, k * 0.72);
    s += nhom === 'thuc-an'
      ? `<path d="M${cx - r * 1.2} ${cy} L${cx} ${cy - r * 1.2} L${cx + r * 1.2} ${cy} L${cx} ${cy + r * 1.2}Z" fill="${col}"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(3)}" fill="${col}"/>`;
  });
  return s;
}
const LINE = 0.25; // mm, nét mảnh nhất
const NHOM = { 'moi-truong': 'Xử lý môi trường nuôi', 'thuc-an': 'Thức ăn bổ sung' };
const CONCEPTS = {
  a: 'Concept A · Ấn tím: mặt trước tím đặc, chữ trắng; hai mặt bên trắng, chữ tím',
  b: 'Concept B · Trắng dược phẩm: nền trắng, tên chữ đậm không chân, hàng biểu tượng, dải tím 23,6% đáy mặt trước',
  e: 'Concept E · Trắng φ: nền trắng chủ đạo, logo góc trái trên, màu riêng từng sản phẩm, cung sóng φ nhiều màu',
  d: 'Concept D · Hoàng gia: tím + nhũ vàng + trắng, biểu tượng vòng Tôm–Cá',
  p1: 'Mẫu 1 · Tạp chí: canh trái, tên chữ có chân cỡ lớn xếp hai dòng, khoảng trắng rộng',
  p2: 'Mẫu 2 · Đêm xanh: mặt trước xanh navy đặc, khung chỉ champagne, chữ trắng',
  p3: 'Mẫu 3 · Khung tranh: khung navy quanh mặt trước, logo và khối lượng cắt ngang khung',
  p4: 'Mẫu 4 · Cột vàng: cột navy hẹp bên trái mang logo và ký hiệu, phần trắng mang tên',
  p5: 'Mẫu 5 · Số thứ tự: chữ số lớn màu champagne, tên đặt trên đường chỉ vàng ở 61,8 %',
  u: 'Mẫu U · Cột loại: cột màu 38,2 % bên trái mang biểu tượng, tên loại, cách dùng; phần trắng 61,8 % mang tên sản phẩm',
  v: 'Mẫu V · Huy chương: khung chỉ màu quanh mặt trước, huy hiệu tròn màu loại ở điểm vàng, tên căn giữa',
  x: 'Mẫu X · Đế màu: phần trắng 61,8 % trên mang logo và tên, đế màu 38,2 % dưới mang loại, cách dùng, khối lượng',
  t: 'Mẫu T · Nhận diện loại: khối màu theo loại sản phẩm ở đoạn φ, biểu tượng loại cỡ lớn, nhãn cách dùng nổi bật; nhìn xa vẫn biết là loại gì',
  s: 'Mẫu S · Chuẩn dược: trắng + navy, chữ không chân, gáy màu hẹp theo nhóm ở mép trái mặt trước, bảng thông số có kẻ chỉ; không vàng, không chữ có chân',
  w: 'Mẫu W · Mặt nước: nền trắng, mực nước màu theo nhóm ở đoạn vàng 61,8 %, tên sản phẩm nửa nổi nửa chìm đổi màu qua mặt nước',
  n: 'Concept N · Noben: nền trắng, bố cục cân giữa, băng xanh mang tên ở đoạn vàng 38,2–61,8 %, nét chỉ champagne',
  c: 'Concept C · Vòng φ: nền tím toàn bộ, vòng tròn trắng lớn, tên chữ đậm không chân, thẻ trắng ở mặt bên',
};

const data = JSON.parse(fs.readFileSync(process.env.DATA ? path.resolve(process.env.DATA) : path.join(DIR, 'san-pham-son-ha.json'), 'utf8'));
const logoSvg = fs.readFileSync(path.join(DIR, 'logo-tim.svg'), 'utf8');
const NB_LOGO = fs.readFileSync(path.join(DIR, '..', '..', '..', 'public', 'images', 'brand', 'logo-noben.svg'), 'utf8').replace(/^[\s\S]*?<svg /, '<svg ');
const NB_PC = '#14479a'; // xanh logo Noben: màu nhấn chung cho cả bộ
const ringPath = /<path d="([^"]+)" fill="#ffffff" fill-rule/.exec(logoSvg)[1];
const letterPath = /<path d="([^"]+)" fill="#ffffff"\/>/.exec(logoSvg)[1];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Dấu gạch nối trong tên: phông Cormorant vẽ gạch nghiêng, thay bằng nét ngang vẽ riêng.
const escName = (s) => esc(s).replace(/\s*-\s*/g, '<i class="hy"></i>');
const SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
const SUB = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
// Chữ số mũ/chỉ số → <sup>/<sub> (phông Việt không có ký tự ⁹, ₄).
function rich(s) {
  return esc(s)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `<sup>${[...m].map((c) => SUP[c]).join('')}</sup>`)
    .replace(/[₀-₉]+/g, (m) => `<sub>${[...m].map((c) => SUB[c]).join('')}</sub>`)
    .replace(/\[ĐIỀN[^\]]*\]/g, (m) => `<mark>${m}</mark>`);
}

function fontFaces() {
  const F = path.join(DIR, 'fonts');
  const VI = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB';
  const LA = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const face = (fam, file, w, st, range) => `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(F, file)).toString('base64')}) format('woff2');font-weight:${w};font-style:${st};unicode-range:${range}}`;
  const out = [];
  for (const sub of [['latin', LA], ['vietnamese', VI]]) {
    for (const w of [500, 600, 700]) out.push(face('Cormorant', `cormorant-garamond-${sub[0]}-${w}-normal.woff2`, w, 'normal', sub[1]));
    out.push(face('Cormorant', `cormorant-garamond-${sub[0]}-500-italic.woff2`, 500, 'italic', sub[1]));
    for (const w of [400, 500, 600, 700]) out.push(face('BVP', `be-vietnam-pro-${sub[0]}-${w}-normal.woff2`, w, 'normal', sub[1]));
  }
  return out.join('\n');
}


function css(c) {
  const dark = c === 'c';
  return `${fontFaces()}
:root{--phi:1.61803;--P:${P};--W:${WH};--G:${G};--ln:${LINE}mm}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff}
sup{font-size:.62em;vertical-align:.5em;line-height:0}sub{font-size:.62em;vertical-align:-.2em;line-height:0}
mark{background:#ffe08a;color:#5a3b00;padding:0 .3mm}
.sheet{position:relative;width:${W + 2 * (BLEED + MARK)}mm;height:${H + 2 * (BLEED + MARK)}mm;background:#fff}
.bleed{position:absolute;left:${MARK}mm;top:${MARK}mm;width:${W + 2 * BLEED}mm;height:${H + 2 * BLEED}mm;overflow:hidden;background:${dark ? P : WH}}
.trim{position:absolute;left:${BLEED}mm;top:${BLEED}mm;width:${W}mm;height:${H}mm;display:grid;grid-template-columns:${SIDE}mm ${FRONT}mm ${SIDE}mm}
.bg{position:absolute;inset:0}
.marks{position:absolute;inset:0;pointer-events:none}
/* ---- mặt bên ---- */
.side{position:relative;height:${H}mm;padding:var(--pt) var(--px) var(--pb);color:var(--P);font-family:BVP,sans-serif;font-size:var(--fs);line-height:1.45;display:flex;flex-direction:column}
.side .fill{flex:1;min-height:0}
.sec{margin-bottom:calc(var(--fs) * 1.618)}
.hd{display:flex;align-items:center;gap:1.6mm;font-weight:700;font-size:calc(var(--fs) * .92);letter-spacing:.22em;text-transform:uppercase;margin-bottom:calc(var(--fs) * .75)}
.hd::after{content:'';flex:1;height:var(--ln);background:var(--P)}
.hd i{width:1.5mm;height:1.5mm;transform:rotate(45deg);background:var(--P);flex:none}
ul{list-style:none}
li{position:relative;padding-left:2.4mm;margin-bottom:calc(var(--fs) * .38)}
li::before{content:'';position:absolute;left:.3mm;top:calc(var(--fs) * .52);width:1mm;height:1mm;transform:rotate(45deg);background:var(--P)}
li b{font-weight:700}
.cp{display:flex;align-items:baseline;gap:1mm;padding:calc(var(--fs) * .32) 0;border-bottom:var(--ln) solid var(--P)}
.cp:first-of-type{border-top:var(--ln) solid var(--P)}
.cp span{flex:1}.cp b{font-weight:700;white-space:nowrap}
.cp.note{border:0;padding-top:calc(var(--fs) * .2)}
.chips{display:flex;gap:1.2mm;flex-wrap:wrap;margin-top:calc(var(--fs) * .7)}
.chips span{border:var(--ln) solid var(--P);border-radius:5mm;padding:.35mm 2mm;font-size:calc(var(--fs) * .82);font-weight:600;letter-spacing:.06em}
.small{font-size:calc(var(--fs) * .9)}
.legal{border-top:var(--ln) solid var(--P);padding-top:calc(var(--fs) * .8);font-size:calc(var(--fs) * .9)}
.legal p{margin-bottom:calc(var(--fs) * .3)}
.legal strong{font-weight:700}
.boxes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1mm;margin:calc(var(--fs) * .55) 0}
.boxes div{border:var(--ln) solid var(--P);border-radius:.8mm;padding:.6mm 1mm;height:6.2mm;font-size:calc(var(--fs) * .8);font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.foot{display:flex;gap:2mm;align-items:flex-end}
.foot .who{flex:1}
.bc{width:21mm;height:13mm;flex:none;border:var(--ln) dashed var(--P);border-radius:.8mm;display:grid;place-items:center;text-align:center;font-size:calc(var(--fs) * .8);letter-spacing:.08em}
.only{margin-top:calc(var(--fs) * .55);font-weight:700;letter-spacing:.14em;font-size:calc(var(--fs) * .82);text-transform:uppercase}
/* ---- mặt trước ---- */
.front{position:relative;height:${H}mm;text-align:center;display:flex;flex-direction:column;align-items:center;color:var(--fc)}
.brand{font-family:BVP;font-weight:700;font-size:${T.s}mm;letter-spacing:.42em;padding-left:.42em}
.motto{font-family:Cormorant;font-style:italic;font-weight:600;font-size:${T.b * 1.15}mm;letter-spacing:.03em}
.rule{display:flex;align-items:center;gap:1.6mm;width:${FRONT * 0.5}mm}
.rule::before,.rule::after{content:'';flex:1;height:var(--ln);background:currentColor}
.rule i{width:1.5mm;height:1.5mm;transform:rotate(45deg);border:var(--ln) solid currentColor}
.cat{font-family:BVP;font-weight:700;font-size:${T.s}mm;letter-spacing:.32em;text-transform:uppercase;padding-left:.32em}
.name{font-feature-settings:'lnum' 1;font-family:Cormorant;font-weight:700;line-height:.92;white-space:nowrap;letter-spacing:.01em}
.name span{display:block}
.name .hy{display:inline-block;width:.3em;height:.062em;margin:0 .09em;background:currentColor;vertical-align:.25em}
.tag{font-family:Cormorant;font-style:italic;font-weight:600;font-size:${T.h}mm;line-height:1.25}
.pill{border:var(--ln) solid currentColor;border-radius:6mm;padding:1mm 3.4mm;font-family:BVP;font-weight:500;font-size:${T.s}mm;letter-spacing:.06em}
.pill b{font-weight:700}
.vol{display:flex;align-items:baseline;gap:2.4mm;font-family:BVP;font-weight:600;font-size:${T.xs}mm;letter-spacing:.24em;text-transform:uppercase}
.vol strong{font-feature-settings:'lnum' 1;font-family:Cormorant;font-weight:700;font-size:${T.l}mm;letter-spacing:.02em;text-transform:none}
.icons{display:flex;justify-content:center;gap:${T.h}mm}
.icons div{display:flex;flex-direction:column;align-items:center;gap:.7mm;font-family:BVP;font-weight:700;font-size:${T.xs}mm;letter-spacing:.16em;text-transform:uppercase;padding-left:.16em}
.icons svg{width:${T.l + 0.6}mm;height:${T.l + 0.6}mm}
.meta{font-family:BVP;font-weight:600;font-size:${T.xs}mm;letter-spacing:.2em}
.iso{font-family:BVP;font-weight:600;font-size:${T.xs * 0.9}mm;letter-spacing:.2em;color:var(--G);border:var(--ln) solid var(--G);padding:.5mm 1.1mm .45mm 1.3mm}
.no{font-feature-settings:'lnum' 1;font-family:Cormorant;font-style:italic;font-weight:600;font-size:${T.b * 1.1}mm;letter-spacing:.06em}
${CONCEPT_CSS[c]}`;
}

const A = (k) => H / PHI ** k; // bậc φ của chiều cao nhãn: A(1)=61,8 · A(2)=38,2 · A(3)=23,6 · A(4)=14,59 · A(5)=9,02 · A(6)=5,57 · A(7)=3,44 · A(8)=2,13 · A(9)=1,31
// Mép nước: một chu kỳ sin trên bề rộng mặt trước, biên độ amp (mm), mức y0 (mm) → điểm polygon theo % của khối cao H + tràn lề
const wave = (y0, amp, ph) => { const N = 72, pts = []; for (let i = 0; i <= N; i++) pts.push(`${(i / N * 100).toFixed(2)}% ${((y0 + amp * Math.sin(2 * Math.PI * (i / N + ph))) / (H + BLEED) * 100).toFixed(3)}%`); return pts.join(',') + ',100% 100%,0 100%'; };
const SIDE_N = `.side{--pt:${T.l + 1.2}mm;--px:${T.h + 1.2}mm;--pb:${T.l + 0.4}mm;counter-reset:sec}
.side:last-of-type{counter-reset:sec 2}
.hd{color:var(--P);letter-spacing:.2em;gap:1.8mm;counter-increment:sec}
.hd i{all:unset;font-family:Cormorant;font-style:italic;font-weight:600;font-size:calc(var(--fs) * 1.5);letter-spacing:0;color:var(--G);line-height:1}
.hd i::before{content:'0' counter(sec)}
.hd::after{background:var(--G);height:var(--ln)}
li{padding-left:2.6mm}li::before{width:1.3mm;height:var(--ln);transform:none;top:calc(var(--fs) * .78);left:0;background:var(--P)}
.cp{border-color:var(--pcl)!important}.chips{display:none}
.legal{border-color:var(--G)}.boxes div{border-color:var(--P);border-radius:0}.bc{border-color:var(--pcl);border-radius:0}
.only{color:var(--pc)}`;
const CH = '#d9c9a3'; // champagne nhạt (trên nền xanh)
const CONCEPT_CSS = {
  // A — mặt trước tím đặc, chữ trắng; mặt bên trắng
  a: `.side{--pt:${T.l + 1.3}mm;--px:${T.h + 0.8}mm;--pb:${T.l + 0.6}mm}
.front{--fc:var(--W);padding:${T.h + 4}mm ${T.h + 3}mm ${T.h + 3.4}mm}
.front .top{position:absolute;top:${T.h + 1}mm;left:${T.h + 1.6}mm;right:${T.h + 1.6}mm;display:flex;justify-content:space-between;align-items:baseline}
.brand{margin:${T.b}mm 0 .5mm}.rule{margin:${T.h * 0.8}mm 0}
.cat{margin-top:auto}.name{margin:${T.b}mm 0}
.hero{margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:${T.b * 1.1}mm;margin-bottom:${T.b * 1.6}mm}
.hero .icons{margin-bottom:${T.b * 0.4}mm}
.front .meta.bot{position:absolute;bottom:${T.h + 2.6}mm;left:0;right:0}`,
  // B — nền trắng toàn bộ, chữ tím; đáy mặt trước có dải tím 23,6% (= 1/φ³)
  b: `.side{--pt:${T.l}mm;--px:${T.h + 0.8}mm;--pb:${T.l}mm}
.front{--fc:var(--P);padding:${T.h + 4.4}mm ${T.h + 3}mm 0}
.front .top{position:absolute;top:${T.h + 1.2}mm;left:${T.h + 2}mm;right:${T.h + 2}mm;display:flex;justify-content:space-between;align-items:baseline}
.brand{margin:${T.b}mm 0 .5mm}.rule{margin:${T.h * 0.7}mm 0}
.cat{margin-top:auto}.name{margin:${T.b}mm 0}
.name{font-family:BVP;font-weight:700;letter-spacing:-.01em;line-height:1}
.tag{font-family:BVP;font-style:normal;font-weight:500;font-size:${T.b * 1.3}mm}
.front>.icons{margin:${T.h}mm 0 auto}
.band{width:calc(100% + ${2 * (T.h + 3)}mm);height:${H * 0.236}mm;margin-top:${T.h}mm;background:var(--P);color:var(--W);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${T.b * 0.8}mm}
.band .pill{border-color:var(--W)}
.band .meta{font-size:${T.xs * 0.95}mm}`,
  // E — trắng chủ đạo, logo góc trái trên, màu riêng từng sản phẩm (--pc), bố cục theo đường vàng 38,2%
  e: `.side{--pt:${T.l + 1.6}mm;--px:${T.h + 0.8}mm;--pb:${T.l}mm}
.hd{color:var(--P)}.hd i,li::before{background:var(--pc)}.hd::after{background:var(--pcl)}
.cp{border-color:var(--pcl)!important}.chips span{border-color:var(--pc);color:var(--pc)}
.legal{border-color:var(--pcl)}.boxes div,.bc{border-color:var(--pcl)}
.front{--fc:var(--P);text-align:left;align-items:stretch;padding:0}
.lock{position:absolute;left:4.6mm;top:5.2mm;display:flex;align-items:center;gap:2.2mm}
.lock .w{display:flex;flex-direction:column;gap:.5mm}
.lock .brand{font-size:${T.s}mm;letter-spacing:.3em;padding-left:0;color:var(--P)}
.lock .motto{font-size:${T.b}mm;color:var(--G)}
.typ{position:absolute;right:4.6mm;top:4.9mm;display:flex;flex-direction:column;align-items:center;gap:.9mm}
.typ i{width:10.2mm;height:10.2mm;border-radius:50%;background:var(--pc);color:var(--W);display:grid;place-items:center}
.typ svg{width:6.3mm;height:6.3mm}
.typ b{font-family:BVP;font-weight:700;font-size:${T.xs}mm;letter-spacing:.14em;color:var(--pc)}
.grp{font-family:BVP;font-weight:600;font-size:${T.xs}mm;letter-spacing:.24em;text-transform:uppercase;color:var(--P);margin-bottom:1.3mm}
.mid{position:absolute;left:4.6mm;right:4.6mm;top:${H * 0.382 - 6.5}mm}
.cat{padding-left:0;color:var(--pc);letter-spacing:.26em}
.cat::after{content:'';display:block;width:${FRONT * 0.236}mm;height:.5mm;background:var(--pc);margin-top:1.6mm}
.name{font-family:BVP;font-weight:700;letter-spacing:-.015em;line-height:1;margin:${T.b * 1.2}mm 0 ${T.b * 0.9}mm;color:var(--P)}
.tag{color:var(--pc);font-size:${T.h * 1.02}mm}
.pill{display:inline-block;margin-top:${T.b * 1.4}mm;background:var(--pc);border-color:var(--pc);color:var(--W)}
.icons{position:absolute;left:4.6mm;bottom:${T.xl + 11.6}mm;justify-content:flex-start;gap:${T.b * 1.25}mm;color:var(--pc)}
.icons div{letter-spacing:.1em;font-size:${T.xs * 0.92}mm}
.icons span{color:var(--P)}
.vol{position:absolute;left:4.6mm;bottom:11.4mm;color:var(--P)}
.vol strong{color:var(--P)}
.front .meta.bot{position:absolute;left:4.6mm;bottom:7.6mm;color:var(--P);opacity:1;font-size:${T.xs * 0.95}mm}
.made{position:absolute;left:4.6mm;bottom:4mm;font-family:BVP;font-weight:700;font-size:${T.xs * 0.95}mm;letter-spacing:.2em;color:var(--pc)}`,
  // ===== 5 mẫu tham khảo (p1–p5): cùng hệ lưới φ, cùng hai mặt bên, khác mặt trước =====
  p1: `${SIDE_N}
.front{--fc:var(--P);padding:0;text-align:left;align-items:stretch}
.lock{position:absolute;left:${A(5)}mm;top:${A(5)}mm}
.iso{position:absolute;right:${A(6)}mm;top:${A(6)}mm}
.cat{position:absolute;left:${A(5)}mm;top:${A(2) - A(6)}mm;padding:0;font-size:${T.xs}mm;letter-spacing:.34em;color:var(--G)}
.rl{position:absolute;left:${A(5)}mm;top:${A(2)}mm;width:${A(4)}mm;height:.5mm;background:var(--G)}
.nm{position:absolute;left:${A(5) - 0.6}mm;right:${A(6)}mm;top:${A(2)}mm;height:${A(3)}mm;display:flex;align-items:center}
.name{font-family:Cormorant;font-weight:600;line-height:.9;letter-spacing:.01em;color:var(--P)}
.tag{position:absolute;left:${A(5)}mm;right:${A(6)}mm;top:${A(1)}mm;height:${A(4)}mm;display:flex;align-items:center;color:var(--pc);font-size:${T.h * 0.86}mm;line-height:1.236}
.icons{position:absolute;left:${A(5)}mm;top:${H - A(3) + A(8)}mm;justify-content:flex-start;gap:${A(8)}mm;color:var(--P)}
.icons div{width:auto;min-width:${A(5)}mm;font-size:${T.xs * 0.8}mm;letter-spacing:.06em;padding:0;gap:1mm}
.icons i{width:${A(6) * 1.236}mm;height:${A(6) * 1.236}mm;border:var(--ln) solid var(--P);display:grid;place-items:center}
.icons span{color:var(--P)}.icons svg{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm}
.vol{position:absolute;left:${A(5)}mm;bottom:${A(7) + 0.4}mm;color:var(--P)}.vol strong{color:var(--P)}`,
  p2: `${SIDE_N}
.front{--fc:var(--W);padding:0}
.lock{position:absolute;left:0;right:0;top:${A(5)}mm;display:flex;flex-direction:column;align-items:center;gap:${A(8)}mm}
.lock .brand{font-size:${T.b}mm;letter-spacing:.5em;padding-left:.5em;color:${CH}}
.iso{position:absolute;right:${A(6) + 1}mm;top:${A(6) + 1}mm;color:${CH}!important;border-color:${CH}!important}
.nm{position:absolute;left:0;right:0;top:${A(2)}mm;height:${A(3)}mm;display:flex;flex-direction:column;align-items:center;justify-content:center}
.nm .cat{font-size:${T.xs}mm;letter-spacing:.34em;padding-left:.34em;color:${CH};margin-bottom:${A(7)}mm}
.name{font-family:Cormorant;font-weight:600;letter-spacing:.05em;line-height:1;color:var(--W)}
.nm::after{content:'';width:${A(4)}mm;height:var(--ln);background:${CH};margin-top:${A(7)}mm}
.tag{position:absolute;left:${A(5)}mm;right:${A(5)}mm;top:${A(1)}mm;height:${A(4)}mm;display:flex;align-items:center;justify-content:center;color:${CH};font-size:${T.h * 0.86}mm;line-height:1.236}
.icons{position:absolute;left:0;right:0;top:${H - A(3)}mm;gap:${A(8)}mm;color:var(--W)}
.icons div{width:${FRONT / 6}mm;font-size:${T.xs * 0.8}mm;letter-spacing:.06em;padding:0;gap:1mm}
.icons i{width:${A(6) * 1.236}mm;height:${A(6) * 1.236}mm;border:var(--ln) solid ${CH};display:grid;place-items:center}
.icons span{color:var(--W)}.icons svg{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm}
.vol{position:absolute;left:0;right:0;bottom:${A(7) + A(9)}mm;justify-content:center;color:${CH}}.vol strong{color:var(--W)}`,
  p3: `${SIDE_N}
.front{--fc:var(--P);padding:0}
.lock{position:absolute;left:50%;top:${A(4) + A(8) / 2 - A(4) / 2}mm;transform:translateX(-50%);background:var(--W);padding:0 ${A(8)}mm;line-height:0}
.iso{position:absolute;right:${A(6)}mm;top:${A(6) - 0.4}mm}
.nm{position:absolute;left:${A(5) + A(7)}mm;right:${A(5) + A(7)}mm;top:${A(2)}mm;height:${A(3)}mm;display:flex;flex-direction:column;align-items:center;justify-content:center}
.nm .cat{font-size:${T.xs}mm;letter-spacing:.34em;padding-left:.34em;color:var(--G);margin-bottom:${A(8)}mm}
.name{font-family:Cormorant;font-weight:700;letter-spacing:.04em;line-height:.95;color:var(--P);text-align:center}
.nm::before,.nm::after{content:'';width:${A(3)}mm;height:var(--ln);background:var(--G)}
.nm::before{margin-bottom:${A(8)}mm}.nm::after{margin-top:${A(8)}mm}
.tag{position:absolute;left:${A(5) + A(7)}mm;right:${A(5) + A(7)}mm;top:${A(1) + A(8)}mm;height:${A(4) - A(8)}mm;display:flex;align-items:center;justify-content:center;color:var(--pc);font-size:${T.h * 0.76}mm;line-height:1.2}
.icons{position:absolute;left:0;right:0;top:${H - A(3) + A(8)}mm;gap:${A(8)}mm;color:var(--W)}
.icons div{width:${FRONT / 6.6}mm;font-size:${T.xs * 0.78}mm;letter-spacing:.06em;padding:0;gap:.9mm}
.icons i{width:${A(6) * 1.1}mm;height:${A(6) * 1.1}mm;background:var(--P);display:grid;place-items:center}
.icons span{color:var(--P)}.icons svg{width:${A(7) * 1.1}mm;height:${A(7) * 1.1}mm}
.vol{position:absolute;left:50%;transform:translateX(-50%);bottom:${A(6) + A(8) / 2 - 3.2}mm;background:var(--W);padding:0 ${A(7)}mm;white-space:nowrap;color:var(--P)}.vol strong{color:var(--P)}`,
  p4: `${SIDE_N}
.front{--fc:var(--P);padding:0;text-align:left;align-items:stretch}
.lock{position:absolute;left:${(A(4) - A(5) * 1.236) / 2}mm;top:${A(6)}mm;line-height:0}
.iso{position:absolute;right:${A(6)}mm;top:${A(6)}mm}
.cat{position:absolute;left:${A(4) + A(6)}mm;top:${A(2) - A(6)}mm;padding:0;font-size:${T.xs}mm;letter-spacing:.34em;color:var(--G)}
.nm{position:absolute;left:${A(4) + A(6) - 0.5}mm;right:${A(6)}mm;top:${A(2)}mm;height:${A(3)}mm;display:flex;align-items:center}
.name{font-family:Cormorant;font-weight:700;line-height:.92;letter-spacing:.02em;color:var(--P)}
.tag{position:absolute;left:${A(4) + A(6)}mm;right:${A(6)}mm;top:${A(1)}mm;height:${A(4)}mm;display:flex;align-items:center;color:var(--pc);font-size:${T.h * 0.82}mm;line-height:1.236;border-top:var(--ln) solid var(--G)}
.icons{position:absolute;left:0;width:${A(4)}mm;top:${A(2)}mm;bottom:${A(6)}mm;flex-direction:column;justify-content:space-between;align-items:center;gap:0;color:var(--W)}
.icons div{width:auto;font-size:${T.xs * 0.66}mm;letter-spacing:.04em;padding:0;gap:.8mm}
.icons i{width:${A(6) * 1.236}mm;height:${A(6) * 1.236}mm;border:var(--ln) solid ${CH};display:grid;place-items:center}
.icons span{color:${CH}}.icons svg{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm}
.vol{position:absolute;left:${A(4) + A(6)}mm;bottom:${A(6)}mm;flex-direction:column;align-items:flex-start;gap:1mm;color:var(--G)}.vol strong{color:var(--P);font-size:${T.xl}mm;line-height:1}`,
  p5: `${SIDE_N}
.front{--fc:var(--P);padding:0;text-align:left;align-items:stretch}
.lock{position:absolute;left:${A(6)}mm;top:${A(6)}mm;line-height:0}
.iso{position:absolute;right:${A(6)}mm;top:${A(6)}mm}
.num{position:absolute;right:${A(6) - 0.4}mm;top:${A(5) + A(7) + 0.6}mm;font-family:Cormorant;font-weight:500;font-feature-settings:'lnum' 1;font-size:${A(4) * 1.236}mm;line-height:.8;color:var(--G);letter-spacing:-.02em}
.num small{display:none;text-align:right;font-family:BVP;font-weight:600;font-size:${T.xs * 0.86}mm;letter-spacing:.3em;margin-top:${A(8)}mm;color:var(--P)}
.nm{position:absolute;left:${A(6) - 0.5}mm;right:${A(6)}mm;bottom:${H - A(1) + A(8)}mm;display:flex;flex-direction:column;align-items:flex-start}
.nm .cat{padding:0;font-size:${T.xs}mm;letter-spacing:.34em;color:var(--pc);margin:0 0 ${A(8)}mm .5mm}
.name{font-family:Cormorant;font-weight:700;line-height:.92;letter-spacing:.02em;color:var(--P)}
.tag{position:absolute;left:${A(6)}mm;right:${A(6)}mm;top:${A(1)}mm;height:${A(4)}mm;display:flex;align-items:center;color:var(--pc);font-size:${T.h * 0.86}mm;line-height:1.236}
.icons{position:absolute;left:${A(6)}mm;right:${A(6)}mm;top:${H - A(3) + A(8)}mm;justify-content:space-between;gap:0;color:var(--G)}
.icons div{width:auto;font-size:${T.xs * 0.8}mm;letter-spacing:.06em;padding:0;gap:1mm}
.icons i{width:${A(6) * 1.236}mm;height:${A(6) * 1.236}mm;border-radius:50%;border:var(--ln) solid var(--G);display:grid;place-items:center;color:var(--P)}
.icons span{color:var(--P)}.icons svg{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm}
.vol{position:absolute;left:${A(6)}mm;right:${A(6)}mm;bottom:${A(7) + 0.4}mm;justify-content:space-between;color:var(--P)}.vol strong{color:var(--P)}`,
  // U — Cột loại
  u: `${SIDE_N}
.hd i{display:none}.hd{letter-spacing:.04em;gap:0}.hd::after{background:var(--pc);height:.5mm}
li::before{background:var(--pc)}.legal{border-color:var(--P)}.only{color:var(--pc)}
.front{--fc:var(--P);padding:0;font-family:BVP}
.front .name{font-family:BVP;font-weight:700;line-height:1;letter-spacing:-.03em;color:var(--P);white-space:normal;text-align:left;width:auto}
.front .name span{display:block}.front .name u{text-decoration:none;white-space:nowrap}
.front .name .hy{height:.09em;width:.26em;vertical-align:.3em;margin:0 .05em}
.front .pill{display:block;position:static;transform:none;border:0;border-radius:0;padding:0;font-weight:600;font-size:${T.b}mm;line-height:1.3;letter-spacing:0;color:var(--pc);text-align:left;white-space:normal}
.front .tag{font-family:BVP;font-style:normal;font-weight:400;font-size:${T.b}mm;line-height:1.45;color:var(--P);text-align:left}
.cert{display:flex;gap:${A(8)}mm;align-items:center;height:${A(5)}mm;color:var(--P)}
.iso9 b{font-weight:600;font-size:${T.xs}mm;letter-spacing:.04em}
.cr{height:100%;width:${A(5)}mm;border:.3mm solid var(--P);border-radius:${A(9)}mm;display:grid;grid-template-columns:${A(9) * 1.2}mm 1fr;grid-template-rows:1fr ${A(9) * 1.2}mm;overflow:hidden;background:#fff}
.crv{grid-row:1;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:${T.xs * 0.62}mm;letter-spacing:.06em;display:flex;align-items:center;justify-content:center;border-left:.2mm solid var(--P)}
.cr i{grid-row:1;display:grid;place-items:center;padding:.5mm}.cr i svg{width:100%;height:100%}
.crc{grid-column:1/3;border-top:.2mm solid var(--P);font-weight:700;font-size:${T.xs * 0.5}mm;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.tic svg{width:100%;height:100%}
.fr{display:flex;gap:${A(8)}mm;align-items:center;font-weight:600;font-size:${T.xs}mm;color:#5d6b84}
.fr div{display:flex;align-items:center;gap:${A(9)}mm}.fr i{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm;color:var(--P)}.fr i svg{width:100%;height:100%}
.how{display:inline-flex;align-items:center;gap:${A(8)}mm;border:.45mm solid currentColor;border-radius:${A(8)}mm;padding:${A(9)}mm ${A(8)}mm;font-weight:700;font-size:${T.b * 1.15}mm;letter-spacing:.02em;text-transform:uppercase}
.how svg{width:${A(6)}mm;height:${A(6)}mm}
.front .vol{position:static;display:flex;align-items:baseline;gap:${A(8)}mm;font-weight:500;font-size:${T.xs}mm;letter-spacing:0;text-transform:none;color:#5d6b84}
.front .vol strong{font-family:BVP;font-weight:700;font-size:${A(7) * 1.36}mm;letter-spacing:-.02em;color:var(--P);line-height:1}
.front .meta.bot{display:none}
.col{position:absolute;left:0;top:0;bottom:0;width:${FRONT / PHI ** 2}mm;background:var(--pc);color:#fff;display:flex;flex-direction:column;align-items:center;padding:${A(6)}mm ${A(8)}mm ${A(6)}mm}
.col .lg{background:#fff;border-radius:50%;width:${A(4) + A(8)}mm;height:${A(4) + A(8)}mm;display:grid;place-items:center;flex:none}
.col .tic{width:${A(4)}mm;height:${A(4)}mm;flex:none;border:.45mm solid rgba(255,255,255,.55);border-radius:50%;padding:${A(8)}mm;margin-top:${A(6)}mm}
.col .ty{flex:1;display:flex;align-items:center;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:${A(7) * 0.82}mm;letter-spacing:.03em;text-transform:uppercase;margin:${A(8)}mm 0;white-space:nowrap;min-height:0}
.col .how{flex:none;flex-direction:column;gap:${A(9)}mm;padding:${A(8)}mm ${A(9)}mm;font-size:${T.xs}mm;color:#fff}
.col .how.an{background:#fff;color:var(--pc);border-color:#fff}
.wr{position:absolute;left:${FRONT / PHI ** 2}mm;right:0;top:0;bottom:0;padding:${A(6)}mm ${A(7)}mm ${A(6)}mm}
.wr .cert{position:absolute;right:${A(7)}mm;top:${A(6)}mm}
.wr .nmw{position:absolute;left:${A(7)}mm;right:${A(7)}mm;top:${A(2)}mm}
.wr .name{font-size:${A(6) * 1.15}mm!important;min-height:${2 * A(6) * 1.15}mm;display:flex;flex-direction:column;justify-content:flex-end}
.wr .rule{height:.35mm;background:var(--P);margin:${A(7)}mm 0 ${A(8)}mm}
.wr .tag{margin-top:${A(9)}mm}
.wr .fr{position:absolute;left:${A(7)}mm;right:${A(7)}mm;bottom:${A(4) + A(8)}mm;flex-wrap:wrap}
.wr .vol{position:absolute;left:${A(7)}mm;right:${A(7)}mm;bottom:${A(6)}mm;justify-content:space-between;border-top:.35mm solid var(--P);padding-top:${A(8)}mm}
.front .cert{flex-direction:column;align-items:stretch;justify-content:center;gap:${A(9)}mm;height:auto;width:auto;color:var(--P)}
.front .cert>div{height:auto;border:0;border-radius:0;padding:0}
.front .iso9{display:block;text-align:right;line-height:1}.front .iso9 b{font-weight:700;font-size:${T.b}mm;letter-spacing:.02em}
.front .cr2{display:flex;align-items:center;justify-content:flex-end;gap:${A(9)}mm;padding-top:${A(9)}mm!important;border-top:.25mm solid var(--P)!important}
.front .cr2 i{width:${A(6)}mm;height:${A(6)}mm;flex:none}.front .cr2 i svg{width:100%;height:100%}
.front .cr2 div{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
.front .cr2 b{font-weight:700;font-size:${T.xs * 0.86}mm;letter-spacing:.12em}.front .cr2 span{font-weight:600;font-size:${T.xs * 0.72}mm;letter-spacing:.02em;white-space:nowrap}
.front .blk b .g,.front .base .ty .g{display:block;white-space:nowrap}
.front .col .ty .g,.front .vty .g{white-space:nowrap}
.front .pill,.front .tag{text-wrap:balance}
.front .pill sup,.front .tag sup{white-space:nowrap}`,
  // V — Huy chương
  v: `${SIDE_N}
.hd i{display:none}.hd{letter-spacing:.04em;gap:0}.hd::after{background:var(--pc);height:.5mm}
li::before{background:var(--pc)}.legal{border-color:var(--P)}.only{color:var(--pc)}
.front{--fc:var(--P);padding:0;font-family:BVP}
.front .name{font-family:BVP;font-weight:700;line-height:1;letter-spacing:-.03em;color:var(--P);white-space:normal;text-align:left;width:auto}
.front .name span{display:block}.front .name u{text-decoration:none;white-space:nowrap}
.front .name .hy{height:.09em;width:.26em;vertical-align:.3em;margin:0 .05em}
.front .pill{display:block;position:static;transform:none;border:0;border-radius:0;padding:0;font-weight:600;font-size:${T.b}mm;line-height:1.3;letter-spacing:0;color:var(--pc);text-align:left;white-space:normal}
.front .tag{font-family:BVP;font-style:normal;font-weight:400;font-size:${T.b}mm;line-height:1.45;color:var(--P);text-align:left}
.cert{display:flex;gap:${A(8)}mm;align-items:center;height:${A(5)}mm;color:var(--P)}
.iso9 b{font-weight:600;font-size:${T.xs}mm;letter-spacing:.04em}
.cr{height:100%;width:${A(5)}mm;border:.3mm solid var(--P);border-radius:${A(9)}mm;display:grid;grid-template-columns:${A(9) * 1.2}mm 1fr;grid-template-rows:1fr ${A(9) * 1.2}mm;overflow:hidden;background:#fff}
.crv{grid-row:1;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:${T.xs * 0.62}mm;letter-spacing:.06em;display:flex;align-items:center;justify-content:center;border-left:.2mm solid var(--P)}
.cr i{grid-row:1;display:grid;place-items:center;padding:.5mm}.cr i svg{width:100%;height:100%}
.crc{grid-column:1/3;border-top:.2mm solid var(--P);font-weight:700;font-size:${T.xs * 0.5}mm;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.tic svg{width:100%;height:100%}
.fr{display:flex;gap:${A(8)}mm;align-items:center;font-weight:600;font-size:${T.xs}mm;color:#5d6b84}
.fr div{display:flex;align-items:center;gap:${A(9)}mm}.fr i{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm;color:var(--P)}.fr i svg{width:100%;height:100%}
.how{display:inline-flex;align-items:center;gap:${A(8)}mm;border:.45mm solid currentColor;border-radius:${A(8)}mm;padding:${A(9)}mm ${A(8)}mm;font-weight:700;font-size:${T.b * 1.15}mm;letter-spacing:.02em;text-transform:uppercase}
.how svg{width:${A(6)}mm;height:${A(6)}mm}
.front .vol{position:static;display:flex;align-items:baseline;gap:${A(8)}mm;font-weight:500;font-size:${T.xs}mm;letter-spacing:0;text-transform:none;color:#5d6b84}
.front .vol strong{font-family:BVP;font-weight:700;font-size:${A(7) * 1.36}mm;letter-spacing:-.02em;color:var(--P);line-height:1}
.front .meta.bot{display:none}
.frm{position:absolute;inset:${A(7)}mm;border:.45mm solid var(--pc)}
.frm::after{content:'';position:absolute;inset:${A(9)}mm;border:.2mm solid var(--pc);opacity:.5}
.vtop{position:absolute;left:${A(6)}mm;right:${A(6)}mm;top:${A(6)}mm;display:flex;justify-content:space-between;align-items:center}
.med{position:absolute;left:50%;top:${A(4) + A(6)}mm;transform:translateX(-50%);width:${A(3)}mm;height:${A(3)}mm;border-radius:50%;background:var(--pc);color:#fff;display:grid;place-items:center;box-shadow:0 0 0 ${A(9)}mm #fff,0 0 0 ${A(9) + 0.35}mm var(--pc)}
.med .tic{width:${A(4) * 0.9}mm;height:${A(4) * 0.9}mm}
.vty{position:absolute;left:0;right:0;top:${A(4) + A(6) + A(3) + A(6)}mm;text-align:center;font-weight:700;font-size:${T.b * 1.15}mm;letter-spacing:.22em;text-transform:uppercase;color:var(--pc)}
.vnm{position:absolute;left:${A(6)}mm;right:${A(6)}mm;top:${A(1) - A(6)}mm;text-align:center}
.vnm .name{font-size:${A(6) * 1.15}mm!important;text-align:center;align-items:center;display:flex;flex-direction:column}
.vnm .pill,.vnm .tag{text-align:center}.vnm .pill{margin-top:${A(7)}mm}.vnm .tag{margin-top:${A(9)}mm}
.vbot{position:absolute;left:${A(6)}mm;right:${A(6)}mm;bottom:${A(6)}mm;display:flex;justify-content:space-between;align-items:center;color:var(--pc)}
.vbot .how.an{background:var(--pc);color:#fff;border-color:var(--pc)}
.front .cert{flex-direction:column;align-items:stretch;justify-content:center;gap:${A(9)}mm;height:auto;width:auto;color:var(--P)}
.front .cert>div{height:auto;border:0;border-radius:0;padding:0}
.front .iso9{display:block;text-align:right;line-height:1}.front .iso9 b{font-weight:700;font-size:${T.b}mm;letter-spacing:.02em}
.front .cr2{display:flex;align-items:center;justify-content:flex-end;gap:${A(9)}mm;padding-top:${A(9)}mm!important;border-top:.25mm solid var(--P)!important}
.front .cr2 i{width:${A(6)}mm;height:${A(6)}mm;flex:none}.front .cr2 i svg{width:100%;height:100%}
.front .cr2 div{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
.front .cr2 b{font-weight:700;font-size:${T.xs * 0.86}mm;letter-spacing:.12em}.front .cr2 span{font-weight:600;font-size:${T.xs * 0.72}mm;letter-spacing:.02em;white-space:nowrap}
.front .blk b .g,.front .base .ty .g{display:block;white-space:nowrap}
.front .col .ty .g,.front .vty .g{white-space:nowrap}
.front .pill,.front .tag{text-wrap:balance}
.front .pill sup,.front .tag sup{white-space:nowrap}`,
  // X — Đế màu
  x: `${SIDE_N}
.hd i{display:none}.hd{letter-spacing:.04em;gap:0}.hd::after{background:var(--pc);height:.5mm}
li::before{background:var(--pc)}.legal{border-color:var(--P)}.only{color:var(--pc)}
.front{--fc:var(--P);padding:0;font-family:BVP}
.front .name{font-family:BVP;font-weight:700;line-height:1;letter-spacing:-.03em;color:var(--P);white-space:normal;text-align:left;width:auto}
.front .name span{display:block}.front .name u{text-decoration:none;white-space:nowrap}
.front .name .hy{height:.09em;width:.26em;vertical-align:.3em;margin:0 .05em}
.front .pill{display:block;position:static;transform:none;border:0;border-radius:0;padding:0;font-weight:600;font-size:${T.b}mm;line-height:1.3;letter-spacing:0;color:var(--pc);text-align:left;white-space:normal}
.front .tag{font-family:BVP;font-style:normal;font-weight:400;font-size:${T.b}mm;line-height:1.45;color:var(--P);text-align:left}
.cert{display:flex;gap:${A(8)}mm;align-items:center;height:${A(5)}mm;color:var(--P)}
.iso9 b{font-weight:600;font-size:${T.xs}mm;letter-spacing:.04em}
.cr{height:100%;width:${A(5)}mm;border:.3mm solid var(--P);border-radius:${A(9)}mm;display:grid;grid-template-columns:${A(9) * 1.2}mm 1fr;grid-template-rows:1fr ${A(9) * 1.2}mm;overflow:hidden;background:#fff}
.crv{grid-row:1;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:${T.xs * 0.62}mm;letter-spacing:.06em;display:flex;align-items:center;justify-content:center;border-left:.2mm solid var(--P)}
.cr i{grid-row:1;display:grid;place-items:center;padding:.5mm}.cr i svg{width:100%;height:100%}
.crc{grid-column:1/3;border-top:.2mm solid var(--P);font-weight:700;font-size:${T.xs * 0.5}mm;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.tic svg{width:100%;height:100%}
.fr{display:flex;gap:${A(8)}mm;align-items:center;font-weight:600;font-size:${T.xs}mm;color:#5d6b84}
.fr div{display:flex;align-items:center;gap:${A(9)}mm}.fr i{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm;color:var(--P)}.fr i svg{width:100%;height:100%}
.how{display:inline-flex;align-items:center;gap:${A(8)}mm;border:.45mm solid currentColor;border-radius:${A(8)}mm;padding:${A(9)}mm ${A(8)}mm;font-weight:700;font-size:${T.b * 1.15}mm;letter-spacing:.02em;text-transform:uppercase}
.how svg{width:${A(6)}mm;height:${A(6)}mm}
.front .vol{position:static;display:flex;align-items:baseline;gap:${A(8)}mm;font-weight:500;font-size:${T.xs}mm;letter-spacing:0;text-transform:none;color:#5d6b84}
.front .vol strong{font-family:BVP;font-weight:700;font-size:${A(7) * 1.36}mm;letter-spacing:-.02em;color:var(--P);line-height:1}
.front .meta.bot{display:none}
.xtop{position:absolute;left:${A(7)}mm;right:${A(7)}mm;top:${A(7)}mm;display:flex;justify-content:space-between;align-items:center}
.xnm{position:absolute;left:${A(7)}mm;right:${A(7)}mm;top:${A(3) + A(5)}mm}
.xnm .name{font-size:${A(6) * 1.36}mm!important;min-height:${2 * A(6) * 1.36}mm;display:flex;flex-direction:column;justify-content:flex-end}
.xnm .rule{height:.35mm;background:var(--P);margin:${A(7)}mm 0 ${A(8)}mm}.xnm .tag{margin-top:${A(9)}mm}
.xnm .fr{margin-top:${A(6)}mm}
.base{position:absolute;left:0;right:0;bottom:0;height:${A(2)}mm;background:var(--pc);color:#fff;padding:${A(7)}mm}
.base .row{display:flex;align-items:center;gap:${A(7)}mm}
.base .tic{width:${A(4)}mm;height:${A(4)}mm;flex:none;border:.45mm solid rgba(255,255,255,.55);border-radius:50%;padding:${A(8)}mm}
.base .ty{font-weight:700;font-size:${A(7) * 1.236}mm;line-height:1.08;text-transform:uppercase;text-align:left}
.base .bt{position:absolute;left:${A(7)}mm;right:${A(7)}mm;bottom:${A(7)}mm;display:flex;justify-content:space-between;align-items:center;border-top:.3mm solid rgba(255,255,255,.4);padding-top:${A(8)}mm}
.base .how{color:#fff}.base .how.an{background:#fff;color:var(--pc);border-color:#fff}
.base .vol{color:rgba(255,255,255,.8)}.base .vol strong{color:#fff}
.front .cert{flex-direction:column;align-items:stretch;justify-content:center;gap:${A(9)}mm;height:auto;width:auto;color:var(--P)}
.front .cert>div{height:auto;border:0;border-radius:0;padding:0}
.front .iso9{display:block;text-align:right;line-height:1}.front .iso9 b{font-weight:700;font-size:${T.b}mm;letter-spacing:.02em}
.front .cr2{display:flex;align-items:center;justify-content:flex-end;gap:${A(9)}mm;padding-top:${A(9)}mm!important;border-top:.25mm solid var(--P)!important}
.front .cr2 i{width:${A(6)}mm;height:${A(6)}mm;flex:none}.front .cr2 i svg{width:100%;height:100%}
.front .cr2 div{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
.front .cr2 b{font-weight:700;font-size:${T.xs * 0.86}mm;letter-spacing:.12em}.front .cr2 span{font-weight:600;font-size:${T.xs * 0.72}mm;letter-spacing:.02em;white-space:nowrap}
.front .blk b .g,.front .base .ty .g{display:block;white-space:nowrap}
.front .col .ty .g,.front .vty .g{white-space:nowrap}
.front .pill,.front .tag{text-wrap:balance}
.front .pill sup,.front .tag sup{white-space:nowrap}`,
  // T — Nhận diện loại: dải trắng logo A(4) · khối màu loại A(3) · tên + hoạt chất · công dụng · đối tượng · cách dùng + khối lượng
  t: `${SIDE_N}
.hd i{display:none}.hd{letter-spacing:.04em;gap:0}.hd::after{background:var(--pc);height:var(--ln)}
li::before{background:var(--pc)}.legal{border-color:var(--P)}.only{color:var(--pc)}
.front{--fc:var(--P);padding:0;font-family:BVP}
.lock{position:absolute;left:${A(7)}mm;top:${(A(4) - A(5) * 1.236) / 2}mm;height:${A(5) * 1.236}mm;display:flex;align-items:center}
.iso{position:absolute;right:${A(7)}mm;top:0;height:${A(4)}mm;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;font-weight:600;font-size:${T.xs}mm;letter-spacing:.04em;color:var(--P);line-height:1.5;border:0;padding:0}
.iso span{font-weight:500;color:#5d6b84}
.cert{position:absolute;right:${A(7)}mm;top:${(A(4) - A(5)) / 2}mm;height:${A(5)}mm;display:flex;gap:${A(9)}mm;color:var(--P)}
.cert>div{height:100%}.cert .cr{border:.3mm solid var(--P);border-radius:${A(9)}mm}
.iso9{display:flex;flex-direction:column;justify-content:center;align-items:flex-end;padding:0 ${A(9)}mm 0 0;line-height:1.5;font-size:${T.xs}mm;letter-spacing:.04em}
.iso9 b{font-weight:600;color:var(--P)}.iso9 span{font-weight:500;color:#5d6b84}
.cr{position:relative;width:${A(5)}mm;display:grid;grid-template-columns:${A(9) * 1.2}mm 1fr;grid-template-rows:1fr ${A(9) * 1.2}mm;overflow:hidden}
.crv{grid-row:1;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:${T.xs * 0.62}mm;letter-spacing:.06em;display:flex;align-items:center;justify-content:center;border-left:.2mm solid var(--P)}
.cr i{grid-row:1;display:grid;place-items:center;padding:.5mm}.cr i svg{width:100%;height:100%}
.crc{grid-column:1/3;border-top:.2mm solid var(--P);font-weight:700;font-size:${T.xs * 0.5}mm;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.blk{position:absolute;left:0;right:0;top:${A(4)}mm;height:${A(3)}mm;background:var(--pc);color:#fff;display:flex;align-items:center;gap:${A(7)}mm;padding:0 ${A(7)}mm}
.blk i{flex:none;width:${A(4)}mm;height:${A(4)}mm;border:.45mm solid rgba(255,255,255,.55);border-radius:50%;display:grid;place-items:center}
.blk i svg{width:${A(5)}mm;height:${A(5)}mm}
.blk b{display:block;font-weight:700;font-size:${A(7) * 1.236}mm;line-height:1.08;letter-spacing:-.01em;text-transform:uppercase;text-align:left}
.blk em{display:block;font-style:normal;font-weight:500;font-size:${T.b}mm;opacity:.85;margin-top:${A(9)}mm}
.mid{position:absolute;left:${A(7)}mm;right:${A(7)}mm;top:${A(4) + A(3) + A(7)}mm}
.name{font-family:BVP;font-weight:700;font-size:${A(6) * 1.36}mm!important;line-height:1;letter-spacing:-.03em;color:var(--P);white-space:normal;min-height:${2 * A(6) * 1.36}mm;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;text-align:left;width:auto}
.name span{display:block}.name u{text-decoration:none;white-space:nowrap}
.name .hy{height:.09em;width:.26em;vertical-align:.3em;margin:0 .05em}
.pill{display:block;position:static;transform:none;border:0;border-radius:0;padding:${A(8)}mm 0 0;margin-top:${A(8)}mm;border-top:.35mm solid var(--P);font-weight:600;font-size:${T.b}mm;line-height:1.3;letter-spacing:0;color:var(--pc);text-align:left;white-space:normal}
.pill b{font-weight:700}
.tag{font-family:BVP;font-style:normal;font-weight:400;font-size:${T.b}mm;line-height:1.45;color:var(--P);margin-top:${A(9)}mm;text-align:left}
.front .for{position:absolute;left:${A(7)}mm;right:${A(7)}mm;bottom:${A(4) + A(8)}mm;display:flex;gap:${A(8)}mm;align-items:center;font-weight:600;font-size:${T.xs}mm;color:#5d6b84}
.front .for i{width:${A(6)}mm;height:${A(6)}mm;display:grid;place-items:center;color:var(--P)}.front .for i svg{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm}
.front .for div{display:flex;align-items:center;gap:${A(9)}mm}
.front .ftr{position:absolute;left:0;right:0;bottom:0;height:${A(4)}mm;border-top:.35mm solid var(--P);display:flex;align-items:center;justify-content:space-between;padding:0 ${A(7)}mm}
.how{display:flex;align-items:center;white-space:nowrap;flex:none;gap:${A(8)}mm;border:.45mm solid var(--pc);color:var(--pc);border-radius:${A(8)}mm;padding:${A(9)}mm ${A(8)}mm;font-weight:700;font-size:${A(7) * 0.7}mm;letter-spacing:.02em;text-transform:uppercase}
.how.an{background:var(--pc);color:#fff}
.how svg{width:${A(6)}mm;height:${A(6)}mm}
.vol{position:static;display:flex;align-items:baseline;white-space:nowrap;gap:${A(8)}mm;font-weight:500;font-size:${T.xs}mm;letter-spacing:0;text-transform:none;color:#5d6b84}
.vol strong{font-family:BVP;font-weight:700;font-size:${A(7) * 1.36}mm;letter-spacing:-.02em;color:var(--P);line-height:1}
.front .meta.bot{display:none}
.front .cert{flex-direction:column;align-items:stretch;justify-content:center;gap:${A(9)}mm;height:auto;width:auto;color:var(--P)}
.front .cert>div{height:auto;border:0;border-radius:0;padding:0}
.front .iso9{display:block;text-align:right;line-height:1}.front .iso9 b{font-weight:700;font-size:${T.b}mm;letter-spacing:.02em}
.front .cr2{display:flex;align-items:center;justify-content:flex-end;gap:${A(9)}mm;padding-top:${A(9)}mm!important;border-top:.25mm solid var(--P)!important}
.front .cr2 i{width:${A(6)}mm;height:${A(6)}mm;flex:none}.front .cr2 i svg{width:100%;height:100%}
.front .cr2 div{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
.front .cr2 b{font-weight:700;font-size:${T.xs * 0.86}mm;letter-spacing:.12em}.front .cr2 span{font-weight:600;font-size:${T.xs * 0.72}mm;letter-spacing:.02em;white-space:nowrap}
.front .cert{top:${A(4) / 2}mm;transform:translateY(-50%);height:auto}
.front .blk b .g,.front .base .ty .g{display:block;white-space:nowrap}
.front .col .ty .g,.front .vty .g{white-space:nowrap}
.front .pill,.front .tag{text-wrap:balance}
.front .pill sup,.front .tag sup{white-space:nowrap}
.dose{border-top:var(--ln) solid var(--P)}
.front~.side .sec{margin-bottom:calc(var(--fs) * 1)}.front~.side li{margin-bottom:calc(var(--fs) * .2);line-height:1.3}
.dr{padding:calc(var(--fs) * .25) 0;border-bottom:var(--ln) solid var(--pcl);line-height:1.35}
.dr b{font-weight:700}.dr.one{grid-template-columns:1fr}
ol.steps{list-style:none;counter-reset:st}
ol.steps li{counter-increment:st;padding-left:calc(var(--fs) * 1.618)}
ol.steps li::before{content:counter(st);position:absolute;left:0;top:.1em;width:calc(var(--fs) * 1.236);height:calc(var(--fs) * 1.236);border-radius:50%;background:var(--pc);color:#fff;font-size:calc(var(--fs) * .8);font-weight:700;display:grid;place-items:center;transform:none}`,
  // S — Chuẩn dược: một họ chữ không chân, lưới canh trái, gáy màu A(6) theo nhóm; tên là điểm nhấn duy nhất
  s: `${SIDE_N}
.hd i{display:none}.hd{letter-spacing:.04em;gap:0}.hd::after{background:var(--P)}
.legal{border-color:var(--P)}.only{color:var(--P)}
.front{--fc:var(--P);padding:0;font-family:BVP}
.spine{position:absolute;left:0;top:0;width:${A(6)}mm;height:100%;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;transform:rotate(180deg);color:var(--W);font-weight:700;font-size:${T.xs * PHI}mm;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
.lock{position:absolute;left:${A(6) + A(7)}mm;top:${A(7)}mm}
.iso{position:absolute;right:${A(7)}mm;top:${A(7)}mm;font-weight:500;font-size:${T.xs}mm;letter-spacing:.04em;color:#5d6b84;text-align:right;line-height:1.618;border:0;padding:0}
.iso b{display:block;font-weight:600;color:var(--P)}
.mid{position:absolute;left:${A(6) + A(7)}mm;right:${A(7)}mm;top:${A(2) + A(7) * 1.236 - 2 * A(6) * 1.36}mm}
/* một cỡ tên cố định cho cả bộ (vừa tên dài nhất trên một dòng), cùng một vị trí */
.name{font-family:BVP;font-weight:700;font-size:${A(6) * 1.36}mm!important;line-height:1;letter-spacing:-.03em;color:var(--P);text-align:left;width:auto;white-space:normal;min-height:${2 * A(6) * 1.36}mm;display:flex;flex-direction:column;justify-content:flex-end}
.name span{display:block}.name u{text-decoration:none;white-space:nowrap}
.name .hy{height:.09em;width:.26em;vertical-align:.3em;margin:0 .05em}
.pill{display:block;border:0;border-radius:0;padding:0;margin-top:${A(7)}mm;padding-top:${A(7)}mm;border-top:var(--ln) solid var(--P);min-height:${A(7) + 2 * T.b * 1.3}mm;font-weight:600;font-size:${T.b}mm;line-height:1.3;letter-spacing:0;color:var(--pc);text-align:left;white-space:normal;position:static;transform:none}
.pill b{font-weight:700}
.tag{font-family:BVP;font-style:normal;font-weight:400;font-size:${T.b}mm;line-height:1.45;color:var(--P);margin-top:${A(8)}mm;text-align:left}
.icons{position:absolute;left:${A(6) + A(7)}mm;right:${A(7)}mm;bottom:${A(7) + A(5)}mm;padding:${A(8)}mm 0;border-top:var(--ln) solid var(--P);border-bottom:var(--ln) solid var(--P);gap:0;justify-content:space-between;color:var(--P)}
.icons div{width:auto;align-items:flex-start;font-weight:500;font-size:${T.xs}mm;letter-spacing:0;text-transform:none;padding:0;gap:.9mm}
.icons i{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm;display:grid;place-items:center;color:var(--P)}
.icons span{color:#5d6b84}.icons svg{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm}
.vol{position:absolute;left:${A(6) + A(7)}mm;right:${A(7)}mm;bottom:${A(7)}mm;justify-content:space-between;align-items:baseline;font-weight:500;font-size:${T.xs}mm;letter-spacing:0;text-transform:none;color:#5d6b84}
.vol strong{font-family:BVP;font-weight:700;font-size:${A(7) * 1.236}mm;letter-spacing:-.02em;color:var(--P);line-height:1}
.front .meta.bot{display:none}`,
  // W — Mặt nước: phần trắng 61,8 % phía trên, "nước" màu nhóm 38,2 % phía dưới, mép nước lượn sóng nhẹ; tên sản phẩm cắt đôi màu tại mặt nước
  w: `${SIDE_N}
.front{--fc:var(--P);padding:0}
.lock{position:absolute;left:${A(6)}mm;top:${A(6)}mm}
.iso{position:absolute;right:${A(6)}mm;top:${A(6)}mm;font-family:BVP;font-weight:600;font-size:${T.xs * 0.9}mm;letter-spacing:.2em;color:var(--G);border:var(--ln) solid var(--G);padding:.5mm 1.1mm .45mm 1.3mm}
.wt{position:absolute;left:0;right:0;top:0;height:${H + BLEED}mm}
.wt.back{background:var(--pcl);clip-path:polygon(${wave(A(1) - A(8), A(9), 0.618)})}
.wt.fore{background:var(--pc);clip-path:polygon(${wave(A(1), A(9), 0)})}
.nm{position:absolute;left:${A(6)}mm;right:${A(6)}mm;top:${A(1)}mm}
.name .cat{position:absolute;left:0;bottom:100%;margin-bottom:${A(6)}mm;font-family:BVP;font-weight:700;font-size:${T.xs}mm;line-height:1;letter-spacing:.34em;color:var(--pc);white-space:nowrap;display:flex;align-items:center;gap:${A(8)}mm}
.name .cat::before{content:'';width:${A(6)}mm;height:var(--ln);background:var(--G)}
/* hộp dòng .72em ≈ chiều cao chữ hoa; dòng 1 nổi trên mặt nước, dòng 2 chìm dưới mặt nước, khe giữa hai dòng ôm mép sóng */
.name{position:relative;display:flex;flex-direction:column;gap:${2 * (A(9) + 0.3)}mm;font-family:Cormorant;font-weight:700;line-height:.72;letter-spacing:.02em;color:var(--P);text-align:left;width:max-content;white-space:nowrap;transform:translateY(calc(-.72em - ${A(9) + 0.3}mm))}
.wt .name{color:var(--W)}.wt .cat{visibility:hidden}
.tag{position:absolute;left:${A(6)}mm;right:${A(6)}mm;top:${A(1) + A(4)}mm;height:${A(5)}mm;display:flex;align-items:center;justify-content:flex-start;text-align:left;color:var(--W);font-size:${T.h * 0.86}mm;line-height:1.236}
.icons{position:absolute;left:${A(6)}mm;right:${A(6)}mm;bottom:${A(6)}mm;gap:0;justify-content:space-between;color:var(--pc)}
.icons div{width:auto;min-width:${A(6) * 1.236}mm;font-size:${T.xs * 0.84}mm;letter-spacing:.08em;gap:1mm}
.icons i{width:${A(6) * 1.236}mm;height:${A(6) * 1.236}mm;border-radius:1.1mm;background:var(--W);display:grid;place-items:center;color:var(--pc)}
.icons span{color:var(--W)}.icons svg{width:${A(7) * 1.236}mm;height:${A(7) * 1.236}mm}
.vol{position:absolute;right:${A(6)}mm;top:${A(6) + A(7) + A(8)}mm;flex-direction:column;align-items:flex-end;gap:${A(9)}mm;color:var(--pc);font-size:${T.xs * 0.9}mm}
.vol strong{color:var(--P);line-height:.9}
.front .meta.bot{display:none}`,
  // N — Noben: cân giữa; băng xanh đặc mang tên sản phẩm nằm đúng đoạn vàng; tiêu đề mục đánh số; không huy hiệu tròn, không cung sóng
  n: `${SIDE_N}
/* φ grid on the front panel (H = 100): H/φ = 61.8, H/φ² = 38.2, H/φ³ = 23.6, H/φ⁴ = 14.59, H/φ⁵ = 9.02, H/φ⁶ = 5.57, H/φ⁷ = 3.44 */
.front{--fc:var(--P);padding:0}
.lock{position:absolute;left:0;right:0;top:${H / PHI ** 5}mm;display:flex;flex-direction:column;align-items:center;gap:${H / PHI ** 8}mm}
.lock .brand{font-size:${T.b}mm;letter-spacing:.5em;padding-left:.5em;color:var(--P)}
.iso{position:absolute;right:${H / PHI ** 6}mm;top:${H / PHI ** 6}mm;font-family:BVP;font-weight:600;font-size:${T.xs * 0.9}mm;letter-spacing:.2em;color:var(--G);border:var(--ln) solid var(--G);padding:.5mm 1.1mm .45mm 1.3mm}
.band{position:absolute;left:0;right:0;top:${H / PHI ** 2}mm;height:${H / PHI ** 3}mm;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--W)}
.band .cat{font-size:${T.xs}mm;letter-spacing:.34em;padding-left:.34em;color:#d9c9a3;margin-bottom:${H / PHI ** 7}mm}
.band .name{font-family:Cormorant;font-weight:700;letter-spacing:.04em;line-height:1;color:var(--W)}
.tag{position:absolute;left:${H / PHI ** 6}mm;right:${H / PHI ** 6}mm;top:${H / PHI}mm;height:${H / PHI ** 4}mm;display:flex;align-items:center;justify-content:center;color:var(--pc);font-size:${T.h * 0.86}mm;line-height:1.236}
.pill{position:absolute;left:50%;transform:translateX(-50%);top:${H / PHI + H / PHI ** 4 - 4.4}mm;white-space:nowrap;border:0;border-top:var(--ln) solid var(--G);border-bottom:var(--ln) solid var(--G);border-radius:0;padding:.8mm 1.2mm;font-size:${T.xs * 1.05}mm;color:var(--P);letter-spacing:.08em}
.icons{position:absolute;left:0;right:0;top:${H - H / PHI ** 3 + H / PHI ** 8}mm;gap:${H / PHI ** 8}mm;color:var(--W)}
.icons div{width:${FRONT / 6}mm;font-size:${T.xs * 0.84}mm;letter-spacing:.08em;padding-left:.08em;gap:1mm}
.icons i{width:${H / PHI ** 6 * 1.236}mm;height:${H / PHI ** 6 * 1.236}mm;border-radius:1.1mm;background:var(--P);display:grid;place-items:center}
.icons span{color:var(--P)}.icons svg{width:${H / PHI ** 7 * 1.236}mm;height:${H / PHI ** 7 * 1.236}mm}
.vol{position:absolute;left:0;right:0;bottom:${H / PHI ** 7 + 0.4}mm;justify-content:center;color:var(--P)}
.vol strong{color:var(--P)}
.front .meta.bot{display:none}`,
  // D — tím + nhũ vàng: mặt trước tím, biểu tượng Tôm–Cá vàng; mặt bên trắng, điểm nhấn vàng
  d: `.side{--pt:${T.l + 1.3}mm;--px:${T.h + 0.8}mm;--pb:${T.l + 0.6}mm}
.hd i,li::before{background:var(--G)}.hd::after{background:var(--G)}
.chips span{border-color:var(--G)}
.front{--fc:var(--W);padding:${T.h + 3.6}mm ${T.h + 3}mm ${T.h + 3.4}mm}
.front .top{position:absolute;top:${T.h + 1}mm;left:${T.h + 1.6}mm;right:${T.h + 1.6}mm;display:flex;justify-content:space-between;align-items:baseline;color:var(--G)}
.brand{margin:${T.b * 0.9}mm 0 .4mm;color:var(--G)}.motto{color:var(--W)}
.rule{margin:${T.h * 0.7}mm 0;color:var(--G)}
.cat{margin-top:auto;color:var(--G)}.name{margin:${T.b}mm 0}
.hero{margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:${T.b * 1.05}mm;margin-bottom:${T.b * 1.6}mm}
.icons{color:var(--G);margin-top:${T.b}mm}.icons span{color:var(--W)}
.pill{border-color:var(--G)}.pill b{color:var(--G)}
.vol strong{color:var(--G)}
.front .meta.bot{position:absolute;bottom:${T.h + 2.6}mm;left:0;right:0;color:var(--G)}`,
  // C — nền tím toàn bộ; vòng tròn trắng mặt trước; thẻ trắng bo góc ở mặt bên
  c: `.side{--pt:${T.l + 2.6}mm;--px:${T.h + 3.4}mm;--pb:${T.l + 2.6}mm}
.side::before{content:'';position:absolute;inset:${T.h + 0.6}mm ${T.h - 0.6}mm;background:var(--W);border-radius:2.6mm}
.side>*{position:relative}
.front{--fc:var(--W);padding:${T.h + 1.6}mm ${T.b}mm ${T.h}mm}
.brand{margin:${T.b * 0.7}mm 0 0}
.disc{position:relative;width:${FRONT * 0.854}mm;height:${FRONT * 0.854}mm;margin:${T.b * 1.2}mm 0 ${T.b * 1.1}mm;border-radius:50%;background:var(--W);color:var(--P);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 ${T.h}mm}
.disc::after{content:'';position:absolute;inset:1.6mm;border:var(--ln) solid var(--P);border-radius:50%}
.disc .name{margin:${T.b * 0.8}mm 0;font-family:BVP;font-weight:700;letter-spacing:-.01em;line-height:1}
.disc .tag{font-family:BVP;font-style:normal;font-weight:500;font-size:${T.b * 1.2}mm;max-width:${FRONT * 0.854 - 12}mm}
.disc .no{margin-bottom:${T.b * 0.6}mm}
.hero{display:flex;flex-direction:column;align-items:center;gap:${T.b * 0.9}mm}
.front .meta.bot{margin-top:auto}`,
};

// Biểu tượng nét (24×24), học từ hàng icon công dụng trên nhãn Keeton/QB Labs. Màu theo chữ.
const ICON = {
  tom: '<path d="M17 5.5c-5.5 0-9.5 3.4-9.5 8.3 0 3.3 2.4 5.7 5.7 5.7"/><path d="M13.2 19.5l-3.4 2.6M13.2 19.5l.6 3"/><path d="M10.4 9.5l2.4 2.6M8.6 12.6l3.2 1.4M8.6 16l3.2-.4"/><path d="M17 5.5c2.2-.9 4.4-.6 5.8.6M17 5.5c.6-1.9 2.6-3.4 5.2-3.4"/><circle cx="16.4" cy="8.2" r=".9" fill="currentColor" stroke="none"/>',
  ca: '<path d="M2.8 12c3.4-5.6 10.6-6.2 15.4 0-4.8 6.2-12 5.6-15.4 0z"/><path d="M18.2 12l3.8-3.8v7.6z"/><path d="M9.6 7.6c.8 1.4 1.2 2.9 1.2 4.4s-.4 3-1.2 4.4"/><circle cx="6.6" cy="11" r=".9" fill="currentColor" stroke="none"/>',
  nuoc: '<path d="M12 2.8c4.2 5 6.3 8.3 6.3 11.2a6.3 6.3 0 0 1-12.6 0c0-2.9 2.1-6.2 6.3-11.2z"/><path d="M8.6 15.2c1.1 1.1 2.2 1.1 3.4 0s2.3-1.1 3.4 0"/>',
  an: '<path d="M3.5 12.5h17a8.5 6.5 0 0 1-17 0z"/><circle cx="8.6" cy="8.8" r="1.3"/><circle cx="12.2" cy="6.4" r="1.3"/><circle cx="15.6" cy="9" r="1.3"/>',
};
// Biểu tượng loại sản phẩm, dạng, cách dùng (nét 24×24) — hệ thống nhận biết trên nhãn.
Object.assign(ICON, {
  'vi-sinh': '<rect x="5" y="8.5" width="14" height="7" rx="3.5"/><path d="M5 12H2.6M19 12h2.4M9 8.5V6M15 8.5V6M9 15.5V18M15 15.5V18"/>',
  'sat-trung': '<path d="M12 2.8l7.5 2.8v5.6c0 4.6-3.1 8.2-7.5 10-4.4-1.8-7.5-5.4-7.5-10V5.6z"/><path d="M8.6 12l2.4 2.4 4.4-4.8"/>',
  'khi-doc': '<circle cx="8" cy="15.2" r="3.4"/><circle cx="15.6" cy="9.4" r="2.5"/><circle cx="16.6" cy="17.2" r="1.6"/><circle cx="8.4" cy="6.4" r="1.4"/>',
  khoang: '<path d="M12 2.8l7.6 4.4v9.6L12 21.2l-7.6-4.4V7.2z"/><path d="M12 7.4l4 4.6-4 4.6-4-4.6z"/>',
  'xu-ly-tao': '<path d="M12 21V9.5"/><path d="M12 15c-4.2 0-6.4-2.6-6.4-6.4 4.2 0 6.4 2.6 6.4 6.4z"/><path d="M12 11.4c0-3.8 2.2-6.4 6.4-6.4 0 3.8-2.2 6.4-6.4 6.4z"/>',
  'loi-khuan': '<path d="M6 3.5v3.6a3.2 3.2 0 0 0 3.2 3.2h5.6a3.2 3.2 0 0 1 0 6.4H9.2A3.2 3.2 0 0 0 6 19.9v.6"/><circle cx="17.6" cy="5.4" r="1.5"/>',
  'dinh-duong': '<circle cx="6" cy="16.4" r="2.6"/><circle cx="12" cy="6.8" r="2.6"/><circle cx="18" cy="16.4" r="2.6"/><path d="M7.4 14.2l3.2-5.2M13.4 9l3.2 5.2M8.6 16.4h6.8"/>',
  gan: '<path d="M3.4 10c0-2.8 3-4.4 8.6-4.4s8.6 1.4 8.6 4c0 3.6-3.8 5-6.8 6.2-2.8 1.1-3.8 2.8-5.8 2.8-2.6 0-4.6-4.2-4.6-8.6z"/><path d="M12 5.6v6.2"/>',
  bot: '<path d="M3.2 18.4h17.6"/><path d="M5.6 18.4c1.6-5.4 3.8-8.4 6.4-8.4s4.8 3 6.4 8.4"/><circle cx="12" cy="6.2" r=".7" fill="currentColor"/><circle cx="8.4" cy="8.4" r=".7" fill="currentColor"/><circle cx="15.6" cy="8.4" r=".7" fill="currentColor"/>',
  'tat-ao': '<path d="M2.8 9c1.6-1.8 3.2-1.8 4.6 0s3 1.8 4.6 0 3.2-1.8 4.6 0 3 1.8 4.6 0"/><path d="M2.8 15c1.6-1.8 3.2-1.8 4.6 0s3 1.8 4.6 0 3.2-1.8 4.6 0 3 1.8 4.6 0"/>',
});
const LOAI = {
  'vi-sinh': 'Vi sinh xử lý nước', 'sat-trung': 'Sát trùng nước', 'khi-doc': 'Hấp thu khí độc', khoang: 'Khoáng chất',
  'xu-ly-tao': 'Xử lý tảo', 'loi-khuan': 'Lợi khuẩn tiêu hóa', 'dinh-duong': 'Đạm · acid amin', gan: 'Bổ gan',
  'kim-loai': 'Khử kim loại nặng', vitamin: 'Vitamin tổng hợp', men: 'Men tiêu hóa', acid: 'Acid hữu cơ',
};
// Tên loại chia theo cụm nghĩa: mỗi cụm một dòng, không bao giờ ngắt giữa cụm
const LOAI_CUM = {
  'vi-sinh': ['Vi sinh', 'xử lý nước'], 'sat-trung': ['Sát trùng', 'nước'], 'khi-doc': ['Hấp thu', 'khí độc'], khoang: ['Khoáng chất'],
  'xu-ly-tao': ['Xử lý tảo'], 'loi-khuan': ['Lợi khuẩn', 'tiêu hóa'], 'dinh-duong': ['Đạm', 'acid amin'], gan: ['Bổ gan'],
  'kim-loai': ['Khử kim loại', 'nặng, phèn'], vitamin: ['Vitamin', 'tổng hợp'], men: ['Men', 'tiêu hóa'], acid: ['Acid', 'hữu cơ'],
};
const loaiCum = (k) => (LOAI_CUM[k] || [LOAI[k] || '']).map((t) => `<span class="g">${esc(t)}</span>`).join(' ');
const svgIcon = (k, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" ${extra}>${ICON[k]}</svg>`;
// Phân loại: mã = nhóm (MT: xử lý môi trường · TA: thức ăn bổ sung) + số thứ tự; loại; dạng; cách dùng.
// Dấu chứng nhận trên mặt trước (mẫu T). CR: dấu hợp quy, vẽ lại theo nhãn cũ để xem thử; file in phải dùng file gốc của VinaCert.
const VINACERT_CODE = 'VICB 7178.10-A3'; // đọc từ ảnh nhãn cũ, cần đối chiếu giấy chứng nhận hợp quy
const CR_MARK = `<svg viewBox="0 0 100 100"><path d="M47 13A37 37 0 1 0 47 87" fill="none" stroke="currentColor" stroke-width="12"/><path d="M55 13A37 37 0 0 1 86 56" fill="none" stroke="currentColor" stroke-width="12"/><path d="M53 48L94 92H72L53 70Z" fill="currentColor"/></svg>`;
const certBox = () => `<div class="cert"><div class="iso9"><b>ISO 9001:2015</b></div><div class="cr2"><i>${CR_MARK}</i><div><b>VINACERT</b><span>${VINACERT_CODE}</span></div></div></div>`;
// Biểu tượng loại sản phẩm (mẫu T): nét trắng, khung 24
const TI = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const TYPE_ICON = {
  'khi-doc': TI('<path d="M3 18c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0"/><circle cx="8" cy="11" r="1.6"/><circle cx="13" cy="7.5" r="2.2"/><circle cx="17" cy="12" r="1.2"/>'),
  'sat-trung': TI('<path d="M12 3l7 3v5.5c0 4.4-3 7.9-7 9.5-4-1.6-7-5.1-7-9.5V6l7-3z"/><path d="M12 8.5v6.5M8.8 11.75h6.4"/>'),
  'vi-sinh': TI('<rect x="3.5" y="8" width="9" height="4.4" rx="2.2" transform="rotate(-30 8 10.2)"/><rect x="11.5" y="12" width="9" height="4.4" rx="2.2" transform="rotate(20 16 14.2)"/><circle cx="7" cy="17.5" r="1.4"/><circle cx="17" cy="6.5" r="1.4"/>'),
  khoang: TI('<path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9L12 3z"/><path d="M4.5 7.5L12 12l7.5-4.5M12 12v9"/>'),
  'xu-ly-tao': TI('<path d="M12 21V11"/><path d="M12 13c-4 0-6-2.5-6-6 3.5 0 6 2 6 6z"/><path d="M12 11c0-3.8 2.2-6.5 6.5-7 0 4-2.5 7-6.5 7z"/><path d="M5 21h14"/>'),
  'loi-khuan': TI('<rect x="4" y="8.5" width="16" height="7" rx="3.5"/><path d="M12 8.5v7"/><circle cx="8" cy="12" r=".9"/><circle cx="16" cy="12" r=".9"/>'),
  'dinh-duong': TI('<circle cx="5.5" cy="12" r="2.3"/><circle cx="12" cy="7" r="2.3"/><circle cx="18.5" cy="12" r="2.3"/><circle cx="12" cy="17" r="2.3"/><path d="M7.4 10.6l2.8-2.2M13.8 8.4l2.8 2.2M16.6 13.4l-2.8 2.2M10.2 15.6l-2.8-2.2"/>'),
  gan: TI('<path d="M4 9.5C4 6.5 7 5 11 5.5s9 1 9 4.5c0 4-4.5 8.5-8.5 8.5C8 18.5 4 13.5 4 9.5z"/><path d="M11 5.5c.5 3 2 5.5 5 7"/>'),
  'kim-loai': TI('<path d="M6 4v7a6 6 0 0012 0V4"/><path d="M6 4h3.5v7a2.5 2.5 0 005 0V4H18"/><path d="M6 7.5h3.5M14.5 7.5H18"/>'),
  vitamin: TI('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path d="M12 6.5v11M6.5 12h11M8.1 8.1l7.8 7.8M15.9 8.1l-7.8 7.8"/>'),
  men: TI('<path d="M4 9a5 5 0 019.5-2.2L10 12l3.5 5.2A5 5 0 014 15z"/><circle cx="17.5" cy="12" r="2.6"/>'),
  acid: TI('<path d="M12 3.5c3.2 4 5 6.9 5 9.3a5 5 0 01-10 0c0-2.4 1.8-5.3 5-9.3z"/><path d="M9.6 14.2h4.8M12 11.8v4.8"/>'),
  tat: TI('<path d="M12 3.5c2.4 3 3.6 5 3.6 6.8a3.6 3.6 0 01-7.2 0c0-1.8 1.2-3.8 3.6-6.8z"/><path d="M3 18.5c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0"/>'),
  an: TI('<path d="M4 12h16a8 8 0 01-16 0z"/><circle cx="9" cy="8.5" r="1.2"/><circle cx="13" cy="7" r="1.2"/><circle cx="15.5" cy="9.5" r="1.2"/>'),
};
function phanLoai(p) {
  return {
    ma: `${p.nhom === 'thuc-an' ? 'TA' : 'MT'}-${String(p.stt).padStart(2, '0')}`,
    loai: LOAI[p.loai] || '', loaiKey: p.loai,
    dang: p.dang === 'chai' ? 'Dung dịch' : 'Dạng bột', dangKey: p.dang === 'chai' ? 'nuoc' : 'bot',
    cach: p.cach_dung === 'tron-an' ? 'Trộn ăn' : 'Tạt ao', cachKey: p.cach_dung === 'tron-an' ? 'an' : 'tat-ao',
  };
}
function icons(p) {
  const f = phanLoai(p);
  return `<div class="icons">${[['tom', 'Tôm'], ['ca', 'Cá'], [f.dangKey, f.dang], [f.cachKey, f.cach]].map(([k, t]) => `<div>${svgIcon(k)}<span>${t}</span></div>`).join('')}</div>`;
}

// Bộ biểu tượng riêng của Noben (concept N): hình đặc một màu trong ô vuông bo góc, vẽ mới, không dùng bộ nét của mẫu khác.
const ICON_N = {
  tom: '<path d="M17.200 6.600c-5.600-.900-9.700 2.300-9.700 7 0 2.600 1.500 4.600 3.800 5.300" fill="none" stroke="currentColor" stroke-width="3.300" stroke-linecap="round"/><path d="M12.300 17.300l-5 4.300-.200-5.200z"/><path d="M15.800 4.300l6 1.700-5.300 2.600z"/><path d="M19.600 5.300c1.300-1.700 2.700-2.400 4-2.300M20 6.300c1.500-.400 2.700-.100 3.600.700M12 10.500l1.900 1.700M11 13.300l2.400.700M11.600 16l2.200-.500" fill="none" stroke="currentColor" stroke-width="1.100" stroke-linecap="round"/><circle cx="16.400" cy="6.800" r=".8" fill="var(--P)"/>',
  ca: '<path fill-rule="evenodd" d="M2.600 12c2.700-4.600 7.500-6.300 11.500-4.800 1.600.6 3 1.700 4.200 3.200L21.800 7.200v9.600l-3.500-3.200c-1.200 1.500-2.600 2.600-4.200 3.200-4 1.500-8.800-.2-11.500-4.800zM8 10.700a1 1 0 1 0-2 0 1 1 0 0 0 2 0z"/>',
  nuoc: '<path fill-rule="evenodd" d="M9.300 2.800h5.400v1.700h-.9v4.200l4.700 8.500c.9 1.600-.3 3.600-2.100 3.600H7.600c-1.800 0-3-2-2.100-3.600l4.700-8.500V4.500h-.9zM11.700 4.500v4.700l-2 3.600h4.600l-2-3.600V4.500z"/>',
  bot: '<path d="M7.200 3h9.600l-1.300 2.700c2.500 1.700 3.900 4.800 3.900 8.600 0 3.600-1.900 5.700-4.800 5.700H9.400c-2.900 0-4.800-2.100-4.800-5.700 0-3.800 1.400-6.900 3.900-8.600z"/>',
  'tat-ao': '<path d="M6 2.600c1.300 1.700 2 2.900 2 3.900a2 2 0 0 1-4 0c0-1 .7-2.200 2-3.900zM12 5.200c1.300 1.700 2 2.900 2 3.900a2 2 0 0 1-4 0c0-1 .7-2.200 2-3.900zM18 2.600c1.300 1.700 2 2.900 2 3.900a2 2 0 0 1-4 0c0-1 .7-2.200 2-3.900zM2.400 16.400c1.600-1.700 3.200-1.700 4.800 0s3.200 1.700 4.800 0 3.200-1.700 4.800 0 3.200 1.700 4.800 0V21.400H2.400z"/>',
  an: '<path d="M2.800 12.600h18.400a9.200 7.400 0 0 1-18.400 0z"/><circle cx="8" cy="8.600" r="1.900"/><circle cx="12.300" cy="5.600" r="1.900"/><circle cx="16.400" cy="8.800" r="1.900"/>',
};
const iconN = (k) => `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">${ICON_N[k] || ICON_N.nuoc}</svg>`;
function iconsN(f) {
  return `<div class="icons">${[['tom', 'Tôm'], ['ca', 'Cá'], [f.dangKey, f.dang], [f.cachKey, f.cach]].map(([k, t]) => `<div><i>${iconN(k)}</i><span>${t}</span></div>`).join('')}</div>`;
}

// Logo TIM (đúng logo trên web), một màu đặc để in.
function brandMark({ fill = P } = {}, sizeAttr = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" ${sizeAttr}><path d="${ringPath}" fill="${fill}" fill-rule="evenodd"/><path d="${letterPath}" fill="${fill}"/></svg>`;
}

function logo(sizeMm, ring, letters, fill) {
  return `<svg width="${sizeMm}mm" height="${sizeMm}mm" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${fill ? `<circle cx="100" cy="100" r="92" fill="${fill}"/>` : ''}<path d="${ringPath}" fill="${ring}" fill-rule="evenodd"/><path d="${letterPath}" fill="${letters}"/></svg>`;
}

// Hướng dẫn sử dụng: giữ nguyên chữ trong hồ sơ TCCS, chỉ sắp xếp lại thành 3 phần
// Liều dùng (trường hợp | liều), Cách dùng (các bước), Lưu ý (ngưng thuốc, bảo quản, cảnh báo).
function hdHtml(lines) {
  const NOTE = /^(lưu ý|cảnh báo|ngưng|thời hạn|lắc|tránh|không|có thể|đậy)/i;
  const DOSE = /\d[\d.,\s–-]*\s*(ml|g|kg|lít|lit)\b[^/]*\//i;
  const dose = [], how = [], note = [];
  for (const raw of lines) {
    const t = raw.trim();
    const m = /^([^:]{3,60}):\s*(\S.*)$/.exec(t);
    if (NOTE.test(t)) note.push(t);
    else if (m && DOSE.test(m[2])) dose.push([m[1], m[2]]);
    else if (DOSE.test(t)) dose.push(['', t]);
    else how.push(t);
  }
  const sec = (title, body) => `<div class="sec"><div class="hd"><i></i>${title}</div>${body}</div>`;
  let out = '';
  if (dose.length) out += sec('Liều dùng', `<div class="dose">${dose.map(([k, v]) => k ? `<div class="dr"><b>${rich(k)}:</b> ${rich(v)}</div>` : `<div class="dr">${rich(v)}</div>`).join('')}</div>`);
  if (how.length) out += sec('Cách dùng', `<ol class="steps">${how.map((c) => `<li>${rich(c)}</li>`).join('')}</ol>`);
  const notes = note.length ? sec('Lưu ý', `<ul>${note.map((c) => `<li>${rich(c).replace(/^(Lưu ý|Cảnh báo):\s*/i, '')}</li>`).join('')}</ul>`) : '';
  // ít dòng liều/cách dùng thì phần Lưu ý nằm luôn bên phải, nhiều thì chuyển sang mặt trái cho cân
  return dose.length + how.length <= 4 ? { main: out + notes, notes: '' } : { main: out, notes };
}
function cpRow(t) {
  const m = /^(.*?):\s*(.+)$/.exec(t);
  if (!m) return `<div class="cp note">${rich(t)}</div>`;
  return `<div class="cp"><span>${rich(m[1])}</span><b>${rich(m[2])}</b></div>`;
}

// Nét trang trí (SVG, màu đặc) cho từng concept: khung, góc, nếp gấp.
function background(c, pc = '#0a8fb5', nhom = 'moi-truong') {
  const ARCS = arcs(pc, BLEED + SIDE + FRONT, BLEED + H - 1.2, FRONT / Math.pow(PHI, 1.5), nhom);
  const B = BLEED, tot = W + 2 * B, hh = H + 2 * B, fx = B + SIDE, fw = FRONT;
  const ln = LINE;
  const corner = (x, y, sx, sy, col) => `<path d="M${x} ${y + sy * 5.5} L${x} ${y} L${x + sx * 5.5} ${y}" fill="none" stroke="${col}" stroke-width="${ln * 1.4}"/><rect x="${x + sx * 1.4 - 0.65}" y="${y + sy * 1.4 - 0.65}" width="1.3" height="1.3" transform="rotate(45 ${x + sx * 1.4} ${y + sy * 1.4})" fill="${col}"/>`;
  const frame = (inset, col) => {
    const L = fx + inset, R = fx + fw - inset, Tp = B + inset, Bt = B + H - inset;
    return `<rect x="${L}" y="${Tp}" width="${R - L}" height="${Bt - Tp}" fill="none" stroke="${col}" stroke-width="${ln}"/>${corner(L - 1.3, Tp - 1.3, 1, 1, col)}${corner(R + 1.3, Tp - 1.3, -1, 1, col)}${corner(L - 1.3, Bt + 1.3, 1, -1, col)}${corner(R + 1.3, Bt + 1.3, -1, -1, col)}`;
  };
  let s = '';
  if (c === 'a' || c === 'd') {
    const acc = c === 'd' ? G : WH;
    s += `<rect x="0" y="0" width="${tot}" height="${B + 2.6}" fill="${P}"/><rect x="0" y="${B + H - 2.6}" width="${tot}" height="${2.6 + B}" fill="${P}"/>`;
    s += `<rect x="0" y="${B + 3.4}" width="${tot}" height="${ln}" fill="${P}"/><rect x="0" y="${B + H - 3.4 - ln}" width="${tot}" height="${ln}" fill="${P}"/>`;
    s += `<rect x="${fx}" y="0" width="${fw}" height="${hh}" fill="${P}"/>${frame(3.6, acc)}`;
    if (c === 'd') s += `<rect x="0" y="${B + 2.6}" width="${tot}" height="${ln * 1.4}" fill="${G}"/><rect x="0" y="${B + H - 2.6 - ln * 1.4}" width="${tot}" height="${ln * 1.4}" fill="${G}"/>`;
  } else if (c === 'e') {
    // dải 3 màu mép trên chia φ (61,8 / 23,6 / 14,6) và vạch mảnh mép dưới; cung sóng φ góc phải dưới mặt trước
    const a1 = tot * 0.618, a2 = tot * 0.236;
    s += `<rect x="0" y="0" width="${a1}" height="${B + 2.2}" fill="var(--pc)"/><rect x="${a1}" y="0" width="${a2}" height="${B + 2.2}" fill="${P}"/><rect x="${a1 + a2}" y="0" width="${tot - a1 - a2}" height="${B + 2.2}" fill="${G}"/>`;
    s += `<rect x="0" y="${B + H - 1.2}" width="${tot}" height="${B + 1.2}" fill="${P}"/>`;
    s += `<clipPath id="fe"><rect x="${fx}" y="${B + 2.2}" width="${fw}" height="${H - 3.4}"/></clipPath><g clip-path="url(#fe)">${ARCS}</g>`;
    s += `<rect x="${fx - ln / 2}" y="${B + 6}" width="${ln * 0.8}" height="${H - 12}" fill="var(--pcl)"/><rect x="${fx + fw - ln / 2}" y="${B + 6}" width="${ln * 0.8}" height="${H - 12}" fill="var(--pcl)"/>`;
  } else if (/^p[1-5]$/.test(c)) {
    // mép trên và dưới chung cho cả 5 mẫu: vạch navy + chỉ champagne; nếp gấp mảnh
    const edge = `<rect x="0" y="0" width="${tot}" height="${B + 1.6}" fill="${P}"/><rect x="0" y="${B + 2.3}" width="${tot}" height="${ln}" fill="${G}"/><rect x="0" y="${B + H - 1.6}" width="${tot}" height="${B + 1.6}" fill="${P}"/><rect x="0" y="${B + H - 2.3 - ln}" width="${tot}" height="${ln}" fill="${G}"/>`;
    const fold = `<rect x="${fx - ln / 2}" y="${B + 6}" width="${ln * 0.8}" height="${H - 12}" fill="var(--pcl)"/><rect x="${fx + fw - ln / 2}" y="${B + 6}" width="${ln * 0.8}" height="${H - 12}" fill="var(--pcl)"/>`;
    if (c === 'p1') {
      s += edge + fold + `<rect x="${fx + A(5)}" y="${B + A(2) - A(9)}" width="${A(4)}" height="0.5" fill="${G}"/>`;
    } else if (c === 'p2') {
      s += `<rect x="${fx}" y="0" width="${fw}" height="${hh}" fill="${P}"/>`;
      s += `<rect x="0" y="0" width="${fx}" height="${B + 1.6}" fill="${P}"/><rect x="${fx + fw}" y="0" width="${tot - fx - fw}" height="${B + 1.6}" fill="${P}"/><rect x="0" y="${B + H - 1.6}" width="${fx}" height="${B + 1.6}" fill="${P}"/><rect x="${fx + fw}" y="${B + H - 1.6}" width="${tot - fx - fw}" height="${B + 1.6}" fill="${P}"/>`;
      s += `<rect x="0" y="${B + 2.3}" width="${fx}" height="${ln}" fill="${G}"/><rect x="${fx + fw}" y="${B + 2.3}" width="${tot - fx - fw}" height="${ln}" fill="${G}"/><rect x="0" y="${B + H - 2.3 - ln}" width="${fx}" height="${ln}" fill="${G}"/><rect x="${fx + fw}" y="${B + H - 2.3 - ln}" width="${tot - fx - fw}" height="${ln}" fill="${G}"/>`;
      s += `<rect x="${fx + A(7)}" y="${B + A(7)}" width="${fw - 2 * A(7)}" height="${H - 2 * A(7)}" fill="none" stroke="${CH}" stroke-width="${ln}"/>`;
    } else if (c === 'p3') {
      const fxx = fx + A(6), fyy = B + A(4), fww = fw - 2 * A(6), fhh = H - A(4) - A(6);
      s += edge + fold + `<rect x="${fxx + A(8) / 2}" y="${fyy + A(8) / 2}" width="${fww - A(8)}" height="${fhh - A(8)}" fill="none" stroke="${P}" stroke-width="${A(8)}"/>`;
      s += `<rect x="${fxx + A(8) + A(9)}" y="${fyy + A(8) + A(9)}" width="${fww - 2 * (A(8) + A(9))}" height="${fhh - 2 * (A(8) + A(9))}" fill="none" stroke="${G}" stroke-width="${ln}"/>`;
    } else if (c === 'p4') {
      s += edge + `<rect x="${fx}" y="0" width="${A(4)}" height="${hh}" fill="${P}"/><rect x="${fx + A(4) + A(9)}" y="${B + 2.3}" width="${ln}" height="${H - 4.6}" fill="${G}"/>`;
      s += `<rect x="${fx + fw - ln / 2}" y="${B + 6}" width="${ln * 0.8}" height="${H - 12}" fill="var(--pcl)"/>`;
    } else {
      s += edge + fold + `<rect x="0" y="${B + A(1)}" width="${tot}" height="${ln * 1.4}" fill="${G}"/>`;
    }
  } else if (c === 's') {
    // gáy màu theo nhóm ở mép trái mặt trước, cao hết nhãn (kể cả tràn lề); nếp gấp phải là một chỉ mảnh
    s += `<rect x="${fx}" y="0" width="${A(6)}" height="${H + 2 * B}" fill="${pc}"/>`;
    s += `<rect x="${fx + fw - ln / 2}" y="${B + A(6)}" width="${ln * 0.8}" height="${H - 2 * A(6)}" fill="var(--pcl)"/>`;
  } else if (c === 'w') {
    // hai mặt bên: mực nước thấp A(7) ở chân nhãn (nối vòng quanh chai), nếp gấp mảnh; không vạch ở mép trên
    const yb = B + H - A(7), N = 96; let d = `M0 ${B + H + B}L0 ${yb}`;
    for (let i = 0; i <= N; i++) { const xx = i / N * tot; d += `L${xx.toFixed(2)} ${(yb + 0.55 * Math.sin(2 * Math.PI * (xx - fx) / fw)).toFixed(3)}`; }
    s += `<path d="${d}L${tot} ${B + H + B}Z" fill="${pc}"/>`;
    s += `<rect x="${fx - ln / 2}" y="${B + 6}" width="${ln * 0.8}" height="${H - 12 - A(7)}" fill="var(--pcl)"/><rect x="${fx + fw - ln / 2}" y="${B + 6}" width="${ln * 0.8}" height="${A(1) - 12}" fill="var(--pcl)"/>`;
  } else if (c === 'n') {
    // mép trên: vạch xanh + chỉ champagne; mép dưới: vạch xanh. Băng xanh đặc ở mặt trước, hai chỉ champagne ôm băng. Nếp gấp mảnh.
    const by = B + H / PHI ** 2, bh = H / PHI ** 3;
    s += `<rect x="0" y="0" width="${tot}" height="${B + 1.6}" fill="${P}"/><rect x="0" y="${B + 2.3}" width="${tot}" height="${ln}" fill="${G}"/>`;
    s += `<rect x="0" y="${B + H - 1.6}" width="${tot}" height="${B + 1.6}" fill="${P}"/><rect x="0" y="${B + H - 2.3 - ln}" width="${tot}" height="${ln}" fill="${G}"/>`;
    s += `<rect x="${fx}" y="${by}" width="${fw}" height="${bh}" fill="${P}"/>`;
    s += `<rect x="${fx}" y="${by - H / PHI ** 9}" width="${fw}" height="${ln}" fill="${G}"/><rect x="${fx}" y="${by + bh + H / PHI ** 9 - ln}" width="${fw}" height="${ln}" fill="${G}"/>`;
    s += `<rect x="${fx - ln / 2}" y="${B + 6}" width="${ln * 0.8}" height="${H - 12}" fill="var(--pcl)"/><rect x="${fx + fw - ln / 2}" y="${B + 6}" width="${ln * 0.8}" height="${H - 12}" fill="var(--pcl)"/>`;
  } else if (c === 'b') {
    s += `<rect x="0" y="${B + 2.2}"" width="${tot}" height="${ln * 2}" fill="${P}"/><rect x="0" y="${B + 3.2}" width="${tot}" height="${ln}" fill="${P}"/>`;
    s += `<rect x="0" y="${B + H - 2.2 - ln * 2}" width="${tot}" height="${ln * 2}" fill="${P}"/><rect x="0" y="${B + H - 3.2 - ln}" width="${tot}" height="${ln}" fill="${P}"/>`;
    s += `<rect x="${fx - ln / 2}" y="${B + 6}" width="${ln}" height="${H - 12}" fill="${P}"/><rect x="${fx + fw - ln / 2}" y="${B + 6}" width="${ln}" height="${H - 12}" fill="${P}"/>`;
    s += `<rect x="${fx}" y="${B + H * (1 - 0.236)}" width="${fw}" height="${H * 0.236 + B}" fill="${P}"/>`;
    s += `<g>${frame(3.6, P).replace(/height="([\d.]+)" fill="none"/, `height="${(H * (1 - 0.236) - 3.6 - 1.6).toFixed(2)}" fill="none"`)}</g>`;
  } else {
    // C: nền tím đã tô ở .bleed; vạch gấp trắng mảnh giữa các mặt
    s += `<rect x="${fx - ln / 2}" y="${B + 8}" width="${ln}" height="${H - 16}" fill="${WH}"/><rect x="${fx + fw - ln / 2}" y="${B + 8}" width="${ln}" height="${H - 16}" fill="${WH}"/>`;
  }
  return `<svg class="bg" viewBox="0 0 ${tot} ${hh}" width="${tot}mm" height="${hh}mm" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

function parts(p) {
  const pp = data.phan_phoi, sx = data.san_xuat;
  const total = String(data.san_pham.length).padStart(2, '0');
  const no = `N° ${String(p.stt).padStart(2, '0')} / ${total}`;
  const hero = (p.thanh_phan[0] || '').split(':');
  const heroHtml = hero.length > 1 ? `${rich(hero[0].replace(/\s*\(min\)/i, ''))} <b>${rich(hero[1].trim())}</b>` : rich(hero[0]);
  const nameParts = p.ten.length > 11 && p.ten.includes(' ') ? splitName(p.ten) : [p.ten];
  const vol = p.the_tich && !/In trên/.test(p.the_tich) ? p.the_tich : (p.quy_cach || '').replace(/^(Chai|Gói)\s*/i, '').split(/[,·]/)[0].trim();
  const volLabel = p.dang === 'chai' ? 'Thể tích thực' : 'Khối lượng tịnh';
  const pl = phanLoai(p);
  const hd = hdHtml(p.huong_dan);
  const left = `
    <div class="sec"><div class="hd"><i></i>Công dụng</div><ul>${p.cong_dung.map((c) => `<li>${rich(c)}</li>`).join('')}</ul></div>
    <div class="sec"><div class="hd"><i></i>Thành phần <span style="letter-spacing:.06em;text-transform:none;font-weight:500">${p.dang === 'chai' ? '(trong 1 lít)' : '(trong 1 kg)'}</span></div>${p.thanh_phan.map(cpRow).join('')}
      <div class="chips">${[pl.ma, pl.loai, pl.dang, pl.cach].map((c) => `<span>${esc(c)}</span>`).join('')}</div></div>
    ${hd.notes}
    <div class="fill"></div>
    <div class="foot"><div class="who small"><b>Bảo quản:</b> ${rich(p.bao_quan)}</div><div class="bc">MÃ VẠCH<br>EAN-13</div></div>`;
  const right = `
    ${hd.main}
    <div class="fill"></div>
    <div class="legal">
      <p><strong>Mã số:</strong> ${esc(p.ma_so)} &nbsp;·&nbsp; <strong>TCCS:</strong> ${esc(p.tccs)}</p>
      <p><strong>HSD:</strong> ${rich(p.hsd && !/In trên/.test(p.hsd) ? p.hsd : 'xem trên bao bì')} &nbsp;·&nbsp; <strong>Quy cách:</strong> ${rich(p.quy_cach || '')}</p>
      <div class="boxes"><div>Số lô</div><div>NSX</div><div>HSD</div></div>
      <p><strong>Sản xuất tại Việt Nam bởi:</strong> ${esc(sx.ten)} · ${esc(sx.dia_chi)}</p>
      <p><strong>Hotline/Zalo:</strong> ${esc(sx.dien_thoai)} · ${esc(pp.web)}</p>
      <div class="only">Chỉ dùng trong nuôi trồng thủy sản · Để xa tầm tay trẻ em</div>
    </div>`;
  return {
    no, left, right, cat: esc(NHOM[p.nhom] || NHOM['moi-truong']),
    name: `<h1 class="name" data-name data-max="0">${nameParts.map((s) => `<span>${escName(s)}</span>`).join('')}</h1>`,
    tag: `<div class="tag">${rich(p.phu_de)}</div>`,
    pill: `<div class="pill">${heroHtml}</div>`,
    vol: `<div class="vol">${volLabel} <strong>${rich(vol || '[ĐIỀN]')}</strong></div>`,
    ms: esc(p.ma_so), tccs: esc(p.tccs), icons: icons(p), ten: p.ten, pl,
  };
}

function front(c, x) {
  x.name = x.name.replace(/data-max="[^"]*"/, `data-max="${c === 'c' ? FRONT * 0.854 - 11 : FRONT - 10}"`);
  const brand = `<div class="brand">THỦY SẢN TÍM</div><div class="motto">Tinh hoa sinh học · Vững vàng mùa vụ</div>`;
  if (c === 'a') return `<section class="front">
    <div class="top"><span class="meta">MS ${x.ms}</span><span class="no">${x.no}</span></div>
    ${logo(16.2, WH, WH)}${brand}<div class="rule"><i></i></div>
    <div class="cat">${x.cat}</div>${x.name}${x.tag}
    <div class="hero">${x.icons}${x.pill}${x.vol}</div>
    <div class="meta bot">TCCS ${x.tccs}</div></section>`;
  if (c === 'e') return `<section class="front">
    <div class="lock">${NB_LOGO.replace('<svg ', '<svg width="13mm" height="13mm" ')}<div class="w"><div class="brand">NOBEN</div><div class="motto">Thuốc thủy sản · Từ 2002</div></div></div>
    <div class="typ"><i>${svgIcon(x.pl.loaiKey)}</i><b>${x.pl.ma}</b></div>
    <div class="mid"><div class="grp">${x.cat}</div><div class="cat">${esc(x.pl.loai)}</div>${x.name}${x.tag}${x.pill}</div>
    ${x.icons}${x.vol}<div class="meta bot">MS ${x.ms} · ${x.no}</div><div class="made">SẢN XUẤT TẠI VIỆT NAM</div></section>`;
  if (/^p[1-5]$/.test(c)) {
    const NMAX = { p1: FRONT - A(5) - A(6), p2: FRONT - 2 * A(5), p3: FRONT - 2 * (A(5) + A(7)) - 2, p4: FRONT - A(4) - 2 * A(6), p5: FRONT - 2 * A(6) };
    const two = (c === 'p1' || c === 'p4' || c === 'p5') && x.ten.includes(' ') ? splitName(x.ten) : [x.ten];
    const nm = `<h1 class="name" data-name data-max="${NMAX[c]}">${(c === 'p2' ? [x.ten] : (x.ten.includes(' ') ? splitName(x.ten) : [x.ten])).map((t) => `<span>${escName(t)}</span>`).join('')}</h1>`;
    const lg = (mm) => NB_LOGO.replace('<svg ', `<svg width="${mm}mm" height="${mm}mm" `);
    const iso = '<div class="iso">ISO 9001:2015</div>';
    const cat = `<div class="cat">${esc(x.pl.loai)}</div>`;
    const ic = iconsN(x.pl);
    if (c === 'p1') return `<section class="front"><div class="lock">${lg(A(4))}</div>${iso}${cat}<div class="nm">${nm}</div>${x.tag}${ic}${x.vol}</section>`;
    if (c === 'p2') return `<section class="front"><div class="lock">${lg(A(4))}<div class="brand">NOBEN</div></div>${iso}<div class="nm">${cat}${nm}</div>${x.tag}${ic}${x.vol}</section>`;
    if (c === 'p3') return `<section class="front">${iso}<div class="lock">${lg(A(4))}</div><div class="nm">${cat}${nm}</div>${x.tag}${ic}${x.vol}</section>`;
    if (c === 'p4') return `<section class="front"><div class="lock">${lg(A(5) * 1.236)}</div>${iso}${cat}<div class="nm">${nm}</div>${x.tag}${ic}${x.vol}</section>`;
    return `<section class="front"><div class="lock">${lg(A(4))}</div>${iso}<div class="num">${x.pl.ma.split('-')[1]}<small>${x.pl.ma.split('-')[0]}</small></div><div class="nm">${cat}${nm}</div>${x.tag}${ic}${x.vol}</section>`;
  }
  if (c === 'u' || c === 'v' || c === 'x') {
    const ten = x.ten.replace(/\s*-\s*/g, '-');
    const nm = `<h1 class="name" data-name data-max="${FRONT}"><span>${ten.split(' ').map((w) => `<u>${escName(w)}</u>`).join(' ')}</span></h1>`;
    const an = x.pl.cachKey === 'an';
    const how = `<div class="how${an ? ' an' : ''}">${an ? TYPE_ICON.an : TYPE_ICON.tat}<span>${esc(x.pl.cach)}</span></div>`;
    const tic = `<div class="tic">${TYPE_ICON[x.pl.loaiKey] || ''}</div>`;
    const fi = (k, t) => `<div><i>${iconN(k)}</i>${t}</div>`;
    const fr = `<div class="fr">Dùng cho ${fi('tom', 'Tôm')}${fi('ca', 'Cá')}${fi(x.pl.dangKey, x.pl.dang)}</div>`;
    const vol = x.vol.replace(/>([^<]*)<strong>/, (m0, t) => `>${t.trim().charAt(0).toUpperCase()}${t.trim().slice(1).toLowerCase()} <strong>`);
    const lg = (k) => NB_LOGO.replace('<svg ', `<svg width="${k}mm" height="${k}mm" `);
    if (c === 'u') return `<section class="front">
    <div class="col"><div class="lg">${lg(A(4) * 0.8)}</div>${tic}<div class="ty">${esc(x.pl.loai)}</div>${how}</div>
    <div class="wr">${certBox()}
      <div class="nmw">${nm}<div class="rule"></div>${x.pill}${x.tag}</div>${fr}${vol}</div></section>`;
    if (c === 'v') return `<section class="front"><div class="frm"></div>
    <div class="vtop">${lg(A(5) * 1.236)}${certBox()}</div>
    <div class="med">${tic}</div><div class="vty">${esc(x.pl.loai)}</div>
    <div class="vnm">${nm}${x.pill}${x.tag}</div>
    <div class="vbot">${how}${vol}</div></section>`;
    return `<section class="front">
    <div class="xtop">${lg(A(5) * 1.236)}${certBox()}</div>
    <div class="xnm">${nm}<div class="rule"></div>${x.pill}${x.tag}${fr}</div>
    <div class="base"><div class="row">${tic}<div class="ty">${loaiCum(x.pl.loaiKey)}</div></div><div class="bt">${how}${vol}</div></div></section>`;
  }
  if (c === 't') {
    const ten = x.ten.replace(/\s*-\s*/g, '-');
    const LOAI_T = { 'vi-sinh': ['Vi sinh', 'Xử lý nước, đáy ao'], 'sat-trung': ['Sát trùng', 'Diệt khuẩn nguồn nước'], 'khi-doc': ['Khí độc', 'Hấp thu NH3, H2S'], khoang: ['Khoáng', 'Lột xác, cứng vỏ'], 'xu-ly-tao': ['Xử lý tảo', 'Ổn định màu nước'], 'loi-khuan': ['Lợi khuẩn', 'Đường ruột, tiêu hóa'], 'dinh-duong': ['Dinh dưỡng', 'Đạm, acid amin'], gan: ['Bổ gan', 'Gan tụy khỏe'] };
    const big = x.pl.loai; // cùng tên loại đã dùng trên gáy màu, không thêm câu công dụng ngoài hồ sơ TCCS
    const an = x.pl.cachKey === 'an';
    const fi = (k, t) => `<div><i>${iconN(k)}</i>${t}</div>`;
    return `<section class="front">
    <div class="lock">${NB_LOGO.replace('<svg ', `<svg width="${A(5) * 1.236}mm" height="${A(5) * 1.236}mm" `)}</div>
    ${certBox()}
    <div class="blk"><i>${TYPE_ICON[x.pl.loaiKey] || ''}</i><div><b>${loaiCum(x.pl.loaiKey)}</b></div></div>
    <div class="mid"><h1 class="name" data-name data-max="${FRONT - 2 * A(7)}"><span>${ten.split(' ').map((w) => `<u>${escName(w)}</u>`).join(' ')}</span></h1>${x.pill}${x.tag}</div>
    <div class="for">Dùng cho ${fi('tom', 'Tôm')}${fi('ca', 'Cá')}${fi(x.pl.dangKey, x.pl.dang)}</div>
    <div class="ftr"><div class="how${an ? ' an' : ''}">${an ? TYPE_ICON.an : TYPE_ICON.tat}${esc(x.pl.cach)}</div>${x.vol.replace(/>([^<]*)<strong>/, (m0, t) => `>${t.trim().charAt(0).toUpperCase()}${t.trim().slice(1).toLowerCase()} <strong>`)}</div></section>`;
  }
  if (c === 's') {
    const ten = x.ten.replace(/\s*-\s*/g, '-');
    const parts2 = [ten];
    return `<section class="front">
    <div class="spine">${esc(x.pl.loai)}</div>
    <div class="lock">${NB_LOGO.replace('<svg ', `<svg width="${A(4)}mm" height="${A(4)}mm" `)}</div>
    <div class="iso"><b>ISO 9001:2015</b>${esc(x.pl.ma)}</div>
    <div class="mid"><h1 class="name" data-name data-max="${FRONT - 3 * A(6)}">${parts2.map((t) => `<span>${t.split(' ').map((w) => `<u>${escName(w)}</u>`).join(' ')}</span>`).join('')}</h1>${x.pill}${x.tag}</div>
    ${iconsN(x.pl)}${x.vol.replace(/>([^<]*)<strong>/, (m0, t) => `>${t.trim().charAt(0).toUpperCase()}${t.trim().slice(1).toLowerCase()} <strong>`)}</section>`;
  }
  if (c === 'w') {
    const parts2 = x.ten.includes(' ') ? splitName(x.ten) : [x.ten];
    const nm = (attr) => `<div class="nm"><h1 class="name" ${attr}>${parts2.map((t) => `<span>${escName(t)}</span>`).join('')}<div class="cat">${esc(x.pl.loai)}</div></h1></div>`;
    return `<section class="front">
    <div class="lock">${NB_LOGO.replace('<svg ', `<svg width="${A(4)}mm" height="${A(4)}mm" `)}</div>
    <div class="iso">ISO 9001:2015</div>
    <div class="wt back"></div>
    ${nm(`data-name data-max="${FRONT - 2 * A(6)}"`)}
    <div class="wt fore">${nm('data-name-copy')}</div>
    ${x.tag}${iconsN(x.pl)}${x.vol}</section>`;
  }
  if (c === 'n') return `<section class="front">
    <div class="lock">${NB_LOGO.replace('<svg ', '<svg width="14.4mm" height="14.4mm" ')}<div class="brand">NOBEN</div></div>
    <div class="iso">ISO 9001:2015</div>
    <div class="band"><div class="cat">${esc(x.pl.loai)}</div>${x.name}</div>
    ${x.tag}${iconsN(x.pl)}${x.vol}</section>`;
  if (c === 'd') return `<section class="front">
    <div class="top"><span class="meta">MS ${x.ms}</span><span class="no">${x.no}</span></div>
    ${emblemSvg({ fill: G, bg: P }, 'width="21mm" height="21mm"')}${brand}<div class="rule"><i></i></div>
    <div class="cat">${x.cat}</div>${x.name}${x.tag}
    <div class="hero">${x.icons}${x.pill}${x.vol}</div>
    <div class="meta bot">TCCS ${x.tccs}</div></section>`;
  if (c === 'b') return `<section class="front">
    <div class="top"><span class="meta">MS ${x.ms}</span><span class="no">${x.no}</span></div>
    ${logo(14.6, P, P)}${brand}<div class="rule"><i></i></div>
    <div class="cat">${x.cat}</div>${x.name}${x.tag}${x.icons}
    <div class="band">${x.pill}${x.vol}<div class="meta">TCCS ${x.tccs}</div></div></section>`;
  return `<section class="front">
    ${logo(11.8, WH, WH)}<div class="brand">THỦY SẢN TÍM</div>
    <div class="disc"><div class="no">${x.no}</div><div class="cat">${x.cat}</div>${x.name}${x.tag}</div>
    <div class="hero">${x.icons}${x.vol}</div>
    <div class="meta bot">MS ${x.ms} · TCCS ${x.tccs}</div></section>`;
}

// Mẫu M (có màu): nền là mẫu N, thêm MỘT màu theo công dụng của sản phẩm. Navy và champagne giữ nguyên làm màu thương hiệu.
const MAU_LOAI = {
  // Bảng màu 2: tông trầm, ít bão hòa, đi cùng navy + champagne
  'vi-sinh': '#1f6f78',   // xanh cổ vịt: vi sinh xử lý nước
  'sat-trung': '#7d2e3c', // đỏ rượu vang: sát trùng
  'khi-doc': '#4a7c59',   // xanh rêu: hấp thu khí độc
  khoang: '#4a6fa5',      // xanh đá: khoáng
  'xu-ly-tao': '#7a7f3a', // ô liu: xử lý tảo
  'loi-khuan': '#b07d2b', // vàng đất: lợi khuẩn
  'dinh-duong': '#a8553a',// đất nung: đạm, acid amin
  gan: '#5e3b6e',         // tím cà: bổ gan
  'kim-loai': '#5c6670',  // than chì: khử kim loại nặng, phèn
  vitamin: '#a8466a',     // hồng mận: vitamin
  men: '#b07d2b', acid: '#b07d2b', // cùng màu nhóm đường ruột với lợi khuẩn, khác biểu tượng và tên
};
function html(p, c) {
  const x = parts(p);
  const m = c === 'm', cc = m ? 'n' : c;
  const pc = (m || ['w', 's', 't', 'u', 'v', 'x'].includes(c)) ? (MAU_LOAI[p.loai] || NB_PC) : NB_PC;
  const B = BLEED, fx = B + SIDE;
  // lớp màu của mẫu M: vạch màu mép trên, nẹp màu ở chân băng tên, nền màu rất nhạt dưới băng (đoạn 61,8 → 100 %)
  const extra = m ? `<div style="position:absolute;left:0;top:0;width:${W + 2 * B}mm;height:${B + 1.6}mm;background:${pc}"></div>
<div style="position:absolute;left:${fx}mm;top:${B + A(1) - A(8)}mm;width:${FRONT}mm;height:${A(8)}mm;background:${pc}"></div>` : '';
  const extraCss = m ? `.band .cat{color:${tint(pc, 0.62)}}.hd i{color:${pc}}li::before{background:${pc}}.icons i{background:${pc}}.only{color:${pc}}.band{padding-bottom:${A(8)}mm}` : '';
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Nhãn ${esc(p.ten)} – ${CONCEPTS[c] || 'Mẫu M · Noben có màu theo công dụng'}</title>
<style>${css(cc)}${extraCss}</style></head><body>
<div class="sheet"><div class="bleed" style="--pc:${pc};--pcl:${tint(pc, 0.72)}">${background(cc, pc, p.nhom)}${extra}
<div class="trim">
  <section class="side" data-fit>${x.left}</section>
  ${front(cc, x)}
  <section class="side" data-fit>${x.right}</section>
</div></div>
${cropMarks(cc)}
</div></body></html>`;
}

function splitName(n) {
  const w = n.split(' ');
  let best = [n], bd = 1e9;
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(' '), b = w.slice(i).join(' ');
    const d = Math.abs(a.length - b.length);
    if (d < bd) { bd = d; best = [a, b]; }
  }
  return best;
}

function cropMarks(c) {
  const tw = W + 2 * (BLEED + MARK), th = H + 2 * (BLEED + MARK);
  const x0 = MARK + BLEED, y0 = MARK + BLEED, x1 = x0 + W, y1 = y0 + H, L = MARK - 1;
  const ln = (a, b, c, d) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#000" stroke-width=".1"/>`;
  const m = [];
  for (const x of [x0, x1]) { m.push(ln(x, 0, x, L), ln(x, th - L, x, th)); }
  for (const y of [y0, y1]) { m.push(ln(0, y, L, y), ln(tw - L, y, tw, y)); }
  for (const x of [x0 + SIDE, x0 + SIDE + FRONT]) { m.push(ln(x, 0, x, L * 0.6), ln(x, th - L * 0.6, x, th)); }
  return `<svg class="marks" viewBox="0 0 ${tw} ${th}" width="${tw}mm" height="${th}mm">${m.join('')}
<text x="${x0}" y="${th - 1.6}" font-family="BVP" font-size="1.6" fill="#555">Noben · nhãn quấn ${W} × ${H} mm (φ : 1) · tràn lề ${BLEED} mm · gấp: ${SIDE} | ${FRONT} | ${SIDE} mm · ${CONCEPTS[c]} · xanh ${P} + xanh logo ${NB_PC} + champagne ${G} + trắng</text></svg>`;
}

// Co chữ cho vừa: mặt bên giảm --fs, tên sản phẩm co theo chiều rộng.
async function fit(page) {
  return page.evaluate(({ T, MIN, FRONT }) => {
    const mm = 96 / 25.4, rep = [];
    for (const s of document.querySelectorAll('[data-fit]')) {
      let fs = T.b;
      s.style.setProperty('--fs', fs + 'mm');
      const over = () => {
        const lim = s.getBoundingClientRect().bottom - parseFloat(getComputedStyle(s).paddingBottom) + 0.5;
        return [...s.querySelectorAll('*')].some((e) => e.getBoundingClientRect().bottom > lim) || s.scrollHeight > s.clientHeight + 0.5;
      };
      while (over() && fs > MIN) { fs = +(fs - 0.05).toFixed(2); s.style.setProperty('--fs', fs + 'mm'); }
      rep.push({ fs, over: over() });
    }
    const n = document.querySelector('[data-name]');
    let size = T.xxl;
    n.style.fontSize = size + 'mm';
    const max = (+n.dataset.max || FRONT - 13) * mm;
    while ([...n.children].some((c) => c.getBoundingClientRect().width > max) && size > 5) { size -= 0.1; n.style.fontSize = size + 'mm'; }
    // tên nằm trong băng: thu nhỏ tới khi cả nhãn loại + tên lọt trong băng, chừa lề trên dưới
    const band = document.querySelector('.band');
    if (band) {
      const inner = () => [...band.children].reduce((h, e) => h + e.getBoundingClientRect().height + parseFloat(getComputedStyle(e).marginBottom || 0), 0);
      const room = () => band.clientHeight - parseFloat(getComputedStyle(band).paddingBottom || 0) - 5.2 * mm;
      while (inner() > room() && size > 4) { size -= 0.1; n.style.fontSize = size + 'mm'; }
    }
    // mẫu S: cỡ tên cố định; chỉ khi một từ dài hơn cột chữ thì thu vừa đủ
    const us = [...n.querySelectorAll('u')];
    if (us.length) {
      let fsz = parseFloat(getComputedStyle(n).fontSize);
      while (us.some((u) => u.getBoundingClientRect().width > n.clientWidth) && fsz > 12) { fsz -= 0.2; n.style.setProperty('font-size', fsz + 'px', 'important'); }
      size = fsz / mm;
    }
    document.querySelectorAll('[data-name-copy]').forEach((e) => { e.style.fontSize = size + 'mm'; });
    const f = document.querySelector('.front');
    const fb = f.getBoundingClientRect().bottom;
    const overFront = [...f.querySelectorAll('.name,.tag,.hero,.band,.disc')].some((e) => e.getBoundingClientRect().bottom > fb);
    return { sides: rep, name: +size.toFixed(1), overFront };
  }, { T, MIN: MIN_BODY, FRONT });
}

async function main() {
  const only = opt('--chi') ? new Set(opt('--chi').split(',')) : null;
  const concepts = (opt('--concept') || 'a,b,c,d,e').split(',');
  const list = data.san_pham.filter((p) => !only || only.has(p.slug));
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: (+process.env.DPI || 600) / 96 });
  let bad = 0;
  for (const p of list) for (const c of concepts) {
    const base = `${p.slug}-concept-${c}`;
    await page.setContent(html(p, c), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const r = await fit(page);
    fs.writeFileSync(path.join(OUT, `${base}.html`), await page.evaluate(() => '<!doctype html>' + document.documentElement.outerHTML));
    const tw = W + 2 * (BLEED + MARK), th = H + 2 * (BLEED + MARK);
    await page.pdf({ path: path.join(OUT, `${base}.pdf`), width: `${tw}mm`, height: `${th}mm`, printBackground: true, pageRanges: '1' });
    await page.screenshot({ path: path.join(OUT, `${base}.png`), clip: await page.locator('.trim').boundingBox() });
    const err = r.sides.some((s) => s.over) || r.overFront;
    if (err) bad++;
    console.log(`${err ? 'LỖI TRÀN' : 'ok'}  ${base}  chữ mặt bên ${r.sides.map((s) => (s.fs / 0.3528).toFixed(1) + 'pt').join(' / ')} · tên ${r.name} mm`);
  }
  await browser.close();
  console.log(`${list.length * concepts.length} nhãn, ${bad} lỗi → ${path.relative(process.cwd(), OUT)}/`);
  process.exitCode = bad ? 1 : 0;
}

module.exports = { brandMark, phanLoai, svgIcon, LOAI, tint, arcs, fontFaces, rich, esc, data, parts, icons, T, P, G, WH, PHI, NHOM, splitName, cpRow };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });

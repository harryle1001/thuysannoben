'use strict';
// Biểu tượng "Vòng tuần hoàn Tôm – Cá" của Thủy Sản Tím.
// Tôm và cá bơi nối đuôi nhau trên một vòng tròn (bán kính R), dựng hoàn toàn bằng toán học
// nên nét mượt ở mọi cỡ in. Một màu đặc (fill) + màu nền (bg) để đục mắt/mang: in trực tiếp được.
const PHI = 1.61803;
const C = 100, R = 58; // tâm và bán kính đường trục, viewBox 0 0 200 200
const rad = (d) => (d * Math.PI) / 180;
const pt = (a, r) => [C + r * Math.cos(rad(a)), C + r * Math.sin(rad(a))];
const f = (n) => n.toFixed(2);
const P = ([x, y]) => `${f(x)} ${f(y)}`;
const lerp = (a, b, t) => a + (b - a) * t;

// Dải cong giữa hai bán kính, từ góc a0 tới a1, độ rộng w(t). Hai đầu bo lồi/lõm (đốt vỏ tôm).
function band(a0, a1, w, capOut = 0.6, capIn = -0.35) {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * 1.5));
  const outer = [], inner = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = lerp(a0, a1, t), h = w(t) / 2;
    outer.push(pt(a, R + h)); inner.push(pt(a, R - h));
  }
  const end = (pa, pb, a, bulge) => { // nắp cong: điểm điều khiển lệch theo tiếp tuyến
    const [x, y] = pt(a + Math.sign(a1 - a0) * bulge * 1.6, R);
    return ` Q${f(x)} ${f(y)} ${P(pb)}`;
  };
  let d = `M${P(outer[0])}`;
  for (let i = 1; i <= n; i++) d += ` L${P(outer[i])}`;
  d += end(outer[n], inner[n], a1, capOut);
  for (let i = n - 1; i >= 0; i--) d += ` L${P(inner[i])}`;
  d += end(inner[0], outer[0], a0, capIn) + 'Z';
  return d;
}

function shrimp(bg) {
  const out = [], cuts = [];
  const A_HEAD = -40, A_CARA = 6, A_TAIL = 160;
  const wAt = (a) => lerp(20, 7.4, Math.pow(Math.max(0, (a - A_HEAD) / (A_TAIL - A_HEAD)), 0.85));
  // giáp đầu: lưng cong vồng, mũi thon thành chủy nhọn
  {
    const n = 48, outer = [], inner = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = lerp(A_HEAD, A_CARA + 1, t);
      const nose = Math.pow(1 - t, 3.2);
      const hump = Math.sin(Math.PI * t) * 1.6;
      outer.push(pt(a, R + (wAt(a) / 2) * (1 - 0.6 * nose) + hump));
      inner.push(pt(a, R - (wAt(a) / 2) * (1 - 0.35 * nose)));
    }
    const tip = pt(A_HEAD - 14, R + 4.6);
    let d = `M${P(tip)} Q${P(pt(A_HEAD - 5, R + 7.6))} ${P(outer[0])}`;
    for (let i = 1; i <= n; i++) d += ` L${P(outer[i])}`;
    d += ` L${P(inner[n])}`;
    for (let i = n - 1; i >= 0; i--) d += ` L${P(inner[i])}`;
    d += ` Q${P(pt(A_HEAD - 6, R - 1.6))} ${P(tip)}Z`;
    out.push(`<path d="${d}"/>`);
  }
  // thân bụng liền một khối, thuôn dần
  out.push(`<path d="${band(A_CARA, A_TAIL, (t) => wAt(lerp(A_CARA, A_TAIL, t)), 0.4, 0)}"/>`);
  // vạch đốt: 6 đốt ngắn dần theo φ^(1/3), vạch cong lồi về phía đuôi, đục bằng màu nền
  const segs = 6, k = Math.pow(PHI, -1 / 3);
  let total = 0; for (let i = 0; i < segs; i++) total += Math.pow(k, i);
  let a = A_CARA;
  const cut = (ac, w, sw) => {
    const o = pt(ac - 1.2, R + w / 2 + 1), m = pt(ac + 2.6, R), i2 = pt(ac - 1.2, R - w / 2 - 1);
    cuts.push(`<path d="M${P(o)} Q${P(m)} ${P(i2)}" fill="none" stroke="${bg}" stroke-width="${sw}" stroke-linecap="butt"/>`);
  };
  cut(A_CARA, wAt(A_CARA), 1.25);
  for (let i = 0; i < segs; i++) {
    const len = ((A_TAIL - A_CARA) * Math.pow(k, i)) / total;
    const a0 = a, a1 = a + len, am = (a0 + a1) / 2;
    if (i < segs - 1) cut(a1, wAt(a1), 0.95);
    // chân bơi mảnh, cong về phía đầu
    if (i < 5) {
      const base = R - wAt(am) / 2 + 0.9, L = 6.4 - i * 0.55;
      out.push(`<path d="M${P(pt(am + 1.6, base))} Q${P(pt(am + 0.4, base - L * 0.55))} ${P(pt(am - 3.2, base - L))} Q${P(pt(am - 0.8, base - L * 0.4))} ${P(pt(am - 1.2, base))}Z"/>`);
    }
    a = a1;
  }
  // đuôi: telson giữa + 2 lá đuôi xòe
  const aT = A_TAIL - 0.5;
  out.push(`<path d="M${P(pt(aT, R + 3.2))} Q${P(pt(aT + 10, R + 2.6))} ${P(pt(aT + 19, R))} Q${P(pt(aT + 10, R - 2.6))} ${P(pt(aT, R - 3.2))}Z"/>`);
  for (const sg of [1, -1]) {
    const tipA = pt(aT + 17, R + sg * 10.5);
    out.push(`<path d="M${P(pt(aT, R + sg * 1.4))} Q${P(pt(aT + 4, R + sg * 9.5))} ${P(tipA)} Q${P(pt(aT + 13, R + sg * 3.6))} ${P(pt(aT + 2.5, R + sg * 0.6))}Z"/>`);
  }
  // râu: hai đường dài vuốt ngược theo vòng ngoài, song song thân tôm
  const ant = (pts, sw) => `<path d="M${pts.map(P).join(' L')}" fill="none" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const curve = (a0, a1, r0, r1, lift) => {
    const ps = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60; ps.push(pt(lerp(a0, a1, t), lerp(r0, r1, Math.pow(t, 0.5)) + lift * Math.sin(Math.PI * t))); }
    return ps;
  };
  out.push(ant(curve(A_HEAD - 6, 96, R + 6, R + 21.5, 1.5), 1.05));
  out.push(ant(curve(A_HEAD - 4, 62, R + 7, R + 16.5, 0.8), 0.8));
  // râu ngắn phía trước
  out.push(`<path d="M${P(pt(A_HEAD - 8, R + 3))} Q${P(pt(A_HEAD - 15, R + 6.5))} ${P(pt(A_HEAD - 19, R + 11))}" fill="none" stroke-width=".8" stroke-linecap="round"/>`);
  return { out, cuts, eye: pt(A_HEAD + 8, R + 3.6) };
}

function fish(bg) {
  const out = [];
  const A_HEAD = -168, A_TAIL = -98; // cá bơi cùng chiều với tôm (ngược chiều kim đồng hồ)
  const w = (t) => { // thân thoi: mũi tròn, phình ở 0,32, thon về cuống đuôi
    const x = Math.min(1, Math.max(0, t));
    return 17 * Math.pow(Math.sin(Math.PI * Math.pow(x, 0.58)), 0.78) + 2.2 * x;
  };
  out.push(`<path d="${band(A_HEAD, A_TAIL, w, 0.9, 0.5)}"/>`);
  // vây đuôi chẻ
  const aP = A_TAIL - 1;
  for (const s of [1, -1]) {
    const tip = pt(A_TAIL + 15, R + s * 11);
    out.push(`<path d="M${P(pt(aP, R + s * 0.6))} Q${P(pt(A_TAIL + 6, R + s * 3))} ${P(tip)} Q${P(pt(A_TAIL + 9, R + s * 2.2))} ${P(pt(A_TAIL + 10.5, R))} L${P(pt(aP, R))}Z"/>`);
  }
  // vây lưng (phía ngoài) và vây bụng (phía trong)
  const dorsal = `M${P(pt(A_HEAD + 20, R + 9.2))} Q${P(pt(A_HEAD + 26, R + 17))} ${P(pt(A_HEAD + 44, R + 15))} Q${P(pt(A_HEAD + 39, R + 9))} ${P(pt(A_HEAD + 48, R + 7))}Z`;
  const pelvic = `M${P(pt(A_HEAD + 22, R - 9))} Q${P(pt(A_HEAD + 29, R - 14.5))} ${P(pt(A_HEAD + 38, R - 13))} Q${P(pt(A_HEAD + 33, R - 8.6))} ${P(pt(A_HEAD + 39, R - 7.2))}Z`;
  out.push(`<path d="${dorsal}"/>`, `<path d="${pelvic}"/>`);
  // mắt và mang: đục bằng màu nền
  const eye = pt(A_HEAD + 6.5, R + 2.2);
  out.push(`<circle cx="${f(eye[0])}" cy="${f(eye[1])}" r="1.9" fill="${bg}"/>`);
  const g0 = pt(A_HEAD + 13, R + 8.2), g1 = pt(A_HEAD + 13.5, R - 8.2);
  out.push(`<path d="M${P(g0)} Q${P(pt(A_HEAD + 17.5, R))} ${P(g1)}" fill="none" stroke="${bg}" stroke-width="1.1" stroke-linecap="round"/>`);
  // vảy: 3 cung mảnh
  for (let i = 0; i < 3; i++) {
    const a = A_HEAD + 25 + i * 9;
    out.push(`<path d="M${P(pt(a, R + 6.5 - i))} Q${P(pt(a + 4.5, R))} ${P(pt(a, R - 6.5 + i))}" fill="none" stroke="${bg}" stroke-width=".7" stroke-linecap="round"/>`);
  }
  return out;
}

// Trả về <g> để nhúng; ring: thêm 2 vòng tròn bao ngoài (mảnh + đậm, tỷ lệ φ).
function emblem({ fill = '#4a044e', bg = '#ffffff', ring = true } = {}) {
  const sh = shrimp(bg);
  const parts = [...sh.out, ...sh.cuts, `<circle cx="${f(sh.eye[0])}" cy="${f(sh.eye[1])}" r="1.9" fill="${bg}"/>`, ...fish(bg)];
  const rings = ring ? `<circle cx="100" cy="100" r="95" fill="none" stroke="${fill}" stroke-width="2.4"/><circle cx="100" cy="100" r="${f(95 - 2.4 * PHI * 1.6)}" fill="none" stroke="${fill}" stroke-width="${f(2.4 / PHI / PHI)}"/>` : '';
  return `<g fill="${fill}" stroke="${fill}" stroke-width="0">${rings}${parts.join('')}</g>`;
}

function emblemSvg(opts = {}, sizeAttr = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" ${sizeAttr}>${emblem(opts)}</svg>`;
}

module.exports = { emblem, emblemSvg };

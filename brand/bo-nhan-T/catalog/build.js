// Catalogue A4 cho 19 sản phẩm (mẫu T): bìa, 2 sản phẩm mỗi trang, bảng giá sỉ / lẻ, bìa sau. Nội dung sản phẩm theo TCCS.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const D = __dirname, R = path.join(D, '..'), N = path.join(R, 'nhan');
const data = JSON.parse(fs.readFileSync(process.env.DATA ? path.resolve(process.env.DATA) : path.join(N, 'san-pham-son-ha.json'), 'utf8')).san_pham;
const O = process.env.OUT_ROOT ? path.resolve(process.env.OUT_ROOT) : path.join(R, 'out');
const gia = JSON.parse(fs.readFileSync(process.env.GIA ? path.resolve(process.env.GIA) : path.join(D, 'gia.json'), 'utf8'));
const src = fs.readFileSync(path.join(N, 'build.js'), 'utf8');
const grab = (start, end) => { const i = src.indexOf(start); return src.slice(i, src.indexOf(end, i) + end.length); };
const TYPE_ICON = new Function(`${grab('const TI =', ';\n')}\n${grab('const TYPE_ICON = {', '\n};')}\nreturn TYPE_ICON;`)();
const LOAI = new Function(`${grab('const LOAI = {', '\n};')}\nreturn LOAI;`)();
const MAU = new Function(`${grab('const MAU_LOAI = {', '\n};')}\nreturn MAU_LOAI;`)();
const NB_LOGO = fs.readFileSync(path.join(R, '..', '..', 'public', 'images', 'brand', 'logo-noben.svg'), 'utf8');
const F = path.join(N, 'fonts');
const face = (w, s) => `@font-face{font-family:BVP;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(F, `be-vietnam-pro-${s}-${w}-normal.woff2`)).toString('base64')})}`;
const fonts = [400, 500, 600, 700].flatMap((w) => ['latin', 'vietnamese'].map((s) => face(w, s))).join('');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rich = (s) => esc(s).replace(/m3\b/g, 'm³').replace(/10⁹|10\^9/g, '10⁹');
const img = (f) => `data:image/${f.endsWith('.png') ? 'png' : f.endsWith('.jpg') ? 'jpeg' : 'webp'};base64,${fs.readFileSync(f).toString('base64')}`;
// ảnh sản phẩm: ảnh 3D trong out/3d (lam-lai.sh --3d); chưa có thì dùng mặt trước phẳng
const pic = (p) => {
  const f3 = path.join(O, '3d', `${p.slug}.png`);
  if (fs.existsSync(f3)) return f3;
  if (p.dang === 'goi') return path.join(O, 'tui', `${p.slug}-truoc.png`);
  return path.join(R, 'xoay-360', 'tex', `${p.slug}.jpg`);
};
const vnd = (n) => n == null ? 'Liên hệ' : n.toLocaleString('vi-VN') + ' đ';
const price = (p) => { const g = gia[p.slug]; const nhap = g ? g[0] : null; return { si: nhap, le: nhap == null ? null : Math.round((nhap * 3) / 1000) * 1000 }; };
const PHI = 1.61803;
// A4 210 × 297; lề 13 mm (≈ 21/φ); thẻ sản phẩm: ảnh 38,2 % | chữ 61,8 %
const css = `${fonts}
:root{--P:#0c2a63;--D:#5d6b84;--L:rgba(12,42,99,.14);--phi:${PHI}}
@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:BVP;color:var(--P);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;background:#fff}
.hdr{position:absolute;left:13mm;right:13mm;top:8mm;height:8mm;display:flex;justify-content:space-between;align-items:center;font-size:2.6mm;color:var(--D);border-bottom:.25mm solid var(--L)}
.hdr svg{height:6.5mm;width:auto}
.ftr{position:absolute;left:13mm;right:13mm;bottom:7mm;display:flex;justify-content:space-between;font-size:2.4mm;color:var(--D)}
.card{position:absolute;left:13mm;right:13mm;height:126mm;display:grid;grid-template-columns:38.2% 61.8%;border:.3mm solid var(--L);border-radius:2mm;overflow:hidden}
.card.a{top:21mm}.card.b{top:153mm}
.pic{background:#eef0f3;display:grid;place-items:center;position:relative}
.pic img{width:92%;height:92%;object-fit:contain}
.pic .ty{position:absolute;left:0;right:0;top:0;height:13mm;display:flex;align-items:center;gap:2.6mm;padding:0 4mm;color:#fff;font-weight:700;font-size:3mm;text-transform:uppercase;letter-spacing:.02em}
.pic .ty svg{width:6mm;height:6mm;flex:none}
.inf{padding:5mm 5.5mm 4mm;display:flex;flex-direction:column;font-size:var(--fs,2.75mm);line-height:1.42}
.inf h2{font-size:7.2mm;line-height:1;letter-spacing:-.02em;font-weight:700}
.inf .hc{font-weight:600;margin-top:1.6mm}
.inf .meta{color:var(--D);font-size:.86em;margin-top:1mm}
.inf h3{font-size:.82em;letter-spacing:.14em;text-transform:uppercase;margin:2.6mm 0 1mm;display:flex;align-items:center;gap:1.6mm}
.inf h3::after{content:'';flex:1;height:.25mm;background:var(--L)}
.inf ul{list-style:none}.inf li{position:relative;padding-left:3mm;margin-bottom:.5mm}
.inf li::before{content:'';position:absolute;left:0;top:.7em;width:1.4mm;height:.3mm;background:currentColor;opacity:.6}
.inf li b{font-weight:600}
.pr{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;border-top:.35mm solid var(--P);padding-top:2.2mm;gap:3mm}
.pr div{display:flex;flex-direction:column}.pr span{font-size:2.4mm;color:var(--D);letter-spacing:.06em;text-transform:uppercase;font-weight:600}
.pr b{font-size:5.6mm;font-weight:700;letter-spacing:-.01em;white-space:nowrap}.pr .le b{color:var(--c)}
.pr small{font-size:2.3mm;color:var(--D)}
/* bìa */
.cv{background:#fff}
.cv .lg{position:absolute;left:13mm;top:13mm}.cv .lg svg{width:21mm;height:21mm}
.cv .t1{position:absolute;left:13mm;top:${297 / PHI ** 2}mm;font-size:4.2mm;font-weight:600;color:var(--D);letter-spacing:.08em;text-transform:uppercase}
.cv .t2{position:absolute;left:13mm;right:13mm;top:${297 / PHI ** 2 + 8}mm;font-size:17mm;line-height:1;font-weight:700;letter-spacing:-.03em}
.cv .t3{position:absolute;left:13mm;top:${297 / PHI ** 2 + 47}mm;font-size:4.6mm;color:var(--D)}
.cv .band{position:absolute;left:0;right:0;bottom:0;height:${297 / PHI ** 2}mm;background:#e7e9ec;overflow:hidden}
.cv .band img{width:100%;height:100%;object-fit:cover;object-position:50% 62%}
.cv .sw{position:absolute;left:13mm;top:${297 / PHI ** 2 + 60}mm;display:flex;flex-wrap:wrap;gap:2mm 4mm;width:150mm}
.cv .sw div{display:flex;align-items:center;gap:1.6mm;font-size:3mm;font-weight:600}
.cv .sw i{width:4.2mm;height:4.2mm;border-radius:1mm;display:block}
/* bảng giá */
table{width:100%;border-collapse:collapse;font-size:3mm}
th{font-size:2.5mm;letter-spacing:.08em;text-transform:uppercase;color:var(--D);text-align:left;padding:2mm 1.6mm;border-bottom:.35mm solid var(--P)}
td{padding:1.9mm 1.6mm;border-bottom:.25mm solid var(--L)}td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}th.n{text-align:right}
td .dot{display:inline-block;width:2.6mm;height:2.6mm;border-radius:.6mm;margin-right:1.6mm;vertical-align:-.3mm}
.note{font-size:2.6mm;color:var(--D);margin-top:4mm;line-height:1.5}
`;
const hdr = (k) => `<div class="hdr">${NB_LOGO.replace('<svg ', '<svg height="24" ')}<span>Catalogue sản phẩm Noben 2026</span></div><div class="ftr"><span>CÔNG TY TNHH NOBEN · Hotline/Zalo 0934 246 420 · thuysannoben.com</span><span>${k}</span></div>`;
// catalogue chỉ in các dòng có liều cụ thể (chữ y nguyên hồ sơ TCCS); hướng dẫn đầy đủ in trên nhãn
const doseLines = (p) => p.huong_dan.filter((h) => /\d[\d.,\s–-]*\s*(ml|g|kg|lít|lit)\b/i.test(h) && !/^(lưu ý|cảnh báo|tránh xa|đậy)/i.test(h));
const card = (p, pos) => {
  const c = MAU[p.loai] || '#0c2a63', pr = price(p);
  return `<div class="card ${pos}" style="--c:${c}">
  <div class="pic"><div class="ty" style="background:${c}">${TYPE_ICON[p.loai] || ''}<span>${esc(LOAI[p.loai] || '')}</span></div><img src="${img(pic(p))}"></div>
  <div class="inf" data-fit>
    <h2>${esc(p.ten)}</h2>
    <div class="hc" style="color:${c}">${rich(p.thanh_phan[0]).replace(/\s*\(min\)/, '').replace(':', '')}</div>
    <div class="meta">${esc(p.quy_cach)} · Mã số ${esc(p.ma_so)} · TCCS ${esc(p.tccs)} · ${p.cach_dung === 'tron-an' ? 'Trộn ăn' : 'Tạt ao'}</div>
    <h3>Công dụng</h3><ul>${p.cong_dung.map((x) => `<li>${rich(x)}</li>`).join('')}</ul>
    <h3>Liều dùng</h3><ul>${doseLines(p).map((x) => `<li>${rich(x).replace(/^([^:]{3,60}):/, '<b>$1:</b>')}</li>`).join('')}</ul>
    <div class="pr"><div><span>Giá sỉ</span><b>${vnd(pr.si)}</b></div><div class="le"><span>Giá lẻ</span><b>${vnd(pr.le)}</b></div></div>
  </div></div>`;
};
let pages = [];
const loais = [...new Set(data.map((p) => p.loai))];
pages.push(`<section class="pg cv"><div class="lg">${NB_LOGO}</div>
<div class="t1">Công ty TNHH Noben · 2026</div><div class="t2">Catalogue sản phẩm<br>và bảng giá</div>
<div class="t3">${data.length} sản phẩm thuốc thủy sản · giá sỉ và giá lẻ</div>
<div class="sw">${loais.map((l) => `<div><i style="background:${MAU[l]}"></i>${esc(LOAI[l])}</div>`).join('')}</div>
<div class="band"><img src="${img(path.join(O, '3d', '00-chai.png'))}"></div></section>`);
for (let i = 0; i < data.length; i += 2) {
  pages.push(`<section class="pg">${hdr(pages.length + 1)}${card(data[i], 'a')}${data[i + 1] ? card(data[i + 1], 'b') : ''}</section>`);
}
const rows = data.map((p, i) => { const pr = price(p); return `<tr><td>${i + 1}</td><td><span class="dot" style="background:${MAU[p.loai]}"></span><b>${esc(p.ten)}</b></td><td>${esc(LOAI[p.loai])}</td><td>${esc(p.quy_cach)}</td><td class="n">${vnd(pr.si)}</td><td class="n"><b>${vnd(pr.le)}</b></td></tr>`; }).join('');
pages.push(`<section class="pg">${hdr(pages.length + 1)}<div style="position:absolute;left:13mm;right:13mm;top:24mm">
<div style="font-size:9mm;font-weight:700;letter-spacing:-.02em;margin-bottom:5mm">Bảng giá sỉ và lẻ</div>
<table><thead><tr><th>STT</th><th>Sản phẩm</th><th>Loại</th><th>Quy cách</th><th class="n">Giá sỉ</th><th class="n">Giá lẻ</th></tr></thead><tbody>${rows}</tbody></table>
<div class="note">Giá sỉ là giá net công ty giao; giá lẻ là giá bán đề xuất tại cửa hàng (bằng 3 lần giá sỉ). Nội dung sản phẩm theo hồ sơ tiêu chuẩn cơ sở (TCCS) của công ty. Chỉ dùng trong nuôi trồng thủy sản.</div></div></section>`);
pages.push(`<section class="pg cv"><div class="lg">${NB_LOGO}</div>
<div class="t2" style="top:${297 / PHI ** 2}mm;font-size:12mm">Liên hệ đặt hàng</div>
<div class="t3" style="top:${297 / PHI ** 2 + 18}mm;line-height:1.7;color:#0c2a63">CÔNG TY TNHH NOBEN<br>228/9 Nguyễn Thị Lắng, Tổ 5, Ấp Phú Lợi A, Xã Củ Chi, TP.HCM<br>Hotline/Zalo: <b>0934 246 420</b><br>thuysannoben.com</div>
<div class="band"><img src="${img(path.join(O, '3d', '00-tui.png'))}"></div></section>`);
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Catalogue Noben 2026</title><style>${css}</style></head><body>${pages.join('')}</body></html>`;
fs.writeFileSync(path.join(O, 'catalogue.html'), html);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
  const rep = await pg.evaluate(() => [...document.querySelectorAll('[data-fit]')].map((e) => { let fs = 2.75; const mm = 96 / 25.4; const over = () => e.scrollHeight > e.clientHeight + 1; while (over() && fs > 2.1) { fs -= 0.05; e.style.setProperty('--fs', fs + 'mm'); } return [e.querySelector('h2').textContent, +fs.toFixed(2), over()]; }));
  rep.filter((r) => r[1] < 2.75 || r[2]).forEach((r) => console.log('co chữ', r));
  await pg.pdf({ path: path.join(O, 'CATALOGUE-NOBEN-2026.pdf'), preferCSSPageSize: true, printBackground: true });
  await pg.setViewportSize({ width: 794, height: 1123 });
  const n = await pg.evaluate(() => document.querySelectorAll('.pg').length);
  for (let i = 0; i < n; i++) { const el = (await pg.$$('.pg'))[i]; await el.screenshot({ path: path.join(O, `catalogue-trang-${String(i + 1).padStart(2, '0')}.png`) }); }
  await b.close(); console.log('ok', n, 'trang');
})();

#!/usr/bin/env node
'use strict';
// Vẽ lại nhãn đăng ký cũ của Noben cho nét: giữ nguyên hình, màu, bố cục; chỉ sắp lại chữ (vector) theo TCCS.
//   node scripts/build-old-labels.js <slug>        → brand/nhan-cu/<slug>.png (≥ 6400 px) + <slug>.pdf (chữ vector)
// Đầu vào: brand/nhan-cu/<ten>.json (toạ độ theo ảnh gốc) và ảnh nhãn gốc trong kho CONG-TY-NOBEN.
// Nền: ảnh gốc phóng ×4 (Lanczos 4 thùy + unsharp, ImageMagick); khung chữ trắng, chữ, logo NOBEN vẽ lại bằng vector.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'brand', 'nhan-cu');
const CONG_TY = process.env.CONG_TY_NOBEN || path.join(ROOT, '..', 'CONG-TY-NOBEN');
// Hệ số phóng: đưa bề rộng nhãn về ≥ 6400 px (4K+), tối đa ×8.
const scaleFor = (w) => Math.min(8, Math.max(4, Math.ceil(6400 / w)));
const esc = (s) => String(s);

// Logo NOBEN cũ (hình thoi vàng, ô xanh, chữ trắng nghiêng) dựng lại bằng vector, hộp 100 × 100.
const LOGO = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="lv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd52b"/><stop offset="1" stop-color="#f9c412"/></linearGradient>
<linearGradient id="lx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7fd0"/><stop offset="1" stop-color="#2f6cc0"/></linearGradient></defs>
<path d="M50 0.8 L99.2 50 L50 99.2 L0.8 50 Z" fill="#ffffff"/>
<path d="M50 3 L97 50 L50 97 L3 50 Z" fill="url(#lv)" stroke="#8f8d55" stroke-width="0.9"/>
<path d="M50 6.6 L93.4 50 L50 93.4 L6.6 50 Z" fill="none" stroke="#c9a40a" stroke-width="0.5"/>
<rect x="23.5" y="27" width="53" height="47" fill="url(#lx)" stroke="#ffffff" stroke-width="1.1"/>
<circle cx="50" cy="27.4" r="4.6" fill="#ffffff"/>
<text x="50" y="58.6" text-anchor="middle" textLength="70" lengthAdjust="spacingAndGlyphs" font-family="'Liberation Sans', Arial, sans-serif" font-weight="700" font-style="italic" font-size="20" fill="#ffffff" stroke="#1d3a6e" stroke-width="1.6" paint-order="stroke" stroke-linejoin="round">NOBEN</text>
<path d="M37 78.6 Q50 81.4 63 78.6" fill="none" stroke="#ffffff" stroke-width="0.9"/><path d="M39.5 80.8 Q50 83.2 60.5 80.8" fill="none" stroke="#ffffff" stroke-width="0.7"/><path d="M42 82.8 Q50 84.6 58 82.8" fill="none" stroke="#ffffff" stroke-width="0.5"/>
</svg>`;

function item(it) {
  switch (it.kieu) {
    case 'muc': return `<p class="muc">${esc(it.chu)}</p>`;
    case 'dam': return `<p class="dam">${esc(it.chu)}</p>`;
    case 'gach': return `<p class="gach">- ${esc(it.chu)}</p>`;
    case 'trong': return '<p class="trong"></p>';
    case 'html': return `<p${it.cl ? ` class="${it.cl}"` : ''}>${it.chu}</p>`;
    default: return `<p>${it.dam ? `<b>${esc(it.dam)}</b>` : ''}${esc(it.chu || '')}</p>`;
  }
}

function html(spec, bg) {
  const [W, H] = spec.kich_thuoc_goc;
  const fam = (f) => (f === 'serif' ? "'Liberation Serif','Times New Roman',serif" : "'Liberation Sans',Arial,sans-serif");
  const boxes = (spec.khung || []).map((k, i) => {
    const st = [`left:${k.x}px`, `top:${k.y}px`, `width:${k.w}px`, `height:${k.h}px`, `border-radius:${k.r || 0}px`,
      `background:${k.nen === 'trong' ? 'transparent' : k.nen || '#fff'}`, k.dem != null ? `padding:${k.dem}px` : ''].filter(Boolean).join(';');
    const nd = [`--fs:${k.co || 18.5}px`, `color:${k.mau || '#000'}`, `-webkit-text-stroke-color:${k.mau || '#000'}`, `font-family:${fam(k.phong)}`,
      k.cot ? `column-count:${k.cot};column-gap:${k.khoang_cot || 14}px` : '', k.can ? `text-align:${k.can}` : '', k.dong_cao ? `line-height:${k.dong_cao}` : ''].filter(Boolean).join(';');
    return `<div class="khung" id="k${i}" data-co="${k.co || 18.5}" style="${st}"><div class="nd" style="${nd}">${k.noi_dung.map(item).join('')}</div></div>`;
  }).join('');
  const logos = (spec.logo || []).map((l) => `<div class="logo" style="left:${l.x}px;top:${l.y}px;width:${l.w || l.s}px;height:${l.h || l.s}px">${LOGO.replace('<svg ', '<svg preserveAspectRatio="none" ')}</div>`).join('');
  const c = spec.cong_ty;
  const cty = c ? `<div class="cty" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;${c.mau ? `color:${c.mau};-webkit-text-stroke-color:${c.mau};` : ''}${c.co ? `--k:${c.co / 13.5};` : ''}"><p class="ten">${esc(c.ten)}</p>${c.dong.map((d) => `<p>${esc(d)}</p>`).join('')}${c.xuat_xu ? `<p class="xx">${esc(c.xuat_xu)}</p>` : ''}</div>` : '';
  const vec = (spec.chu_vector || []).map((t) => `<text x="${t.x}" y="${t.y}" textLength="${t.w}" lengthAdjust="spacingAndGlyphs" font-family="${t.phong === 'serif' ? "'Liberation Serif', 'Times New Roman', serif" : "'Liberation Sans', Arial, sans-serif"}" font-weight="700" font-size="${t.co}" fill="${t.mau}"${t.bong ? ' filter="url(#bong)"' : ''}>${esc(t.chu)}</text>`).join('');
  const over = vec ? `<svg class="vec" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="bong" x="-5%" y="-40%" width="110%" height="180%"><feDropShadow dx="0" dy="0.6" stdDeviation="0.8" flood-color="#0b3d1c" flood-opacity="0.55"/></filter></defs>${vec}</svg>` : '';
  return `<!doctype html><meta charset="utf-8"><style>
@page{size:${W}px ${H}px;margin:0}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
#nhan{position:relative;width:${W}px;height:${H}px;background:url(${bg}) 0 0/100% 100% no-repeat}
.khung{position:absolute;background:#fff;box-sizing:border-box;padding:16px 14px 10px 15px;overflow:hidden}
.nd{font-family:'Liberation Sans',Arial,sans-serif;color:#000;font-size:var(--fs,18.5px);line-height:1.38;-webkit-text-stroke-width:.012em;text-rendering:geometricPrecision}
.nd .muc,.nd .dam,.nd b{color:var(--mau-muc,inherit)}
.nd p{margin:0}
.nd .muc{margin-top:.82em;text-transform:uppercase;font-size:1.03em}
.nd .dam{font-weight:700}
.nd .gach{padding-left:.55em;text-indent:-.55em;text-align:justify}
.nd .trong{height:1.41em}
.nd b{font-weight:700}
.vec{position:absolute;left:0;top:0;width:100%;height:100%}
.logo{position:absolute}.logo svg{width:100%;height:100%;display:block}
.cty{position:absolute;font-family:'Liberation Sans',Arial,sans-serif;color:#000;-webkit-text-stroke:.15px #000}
.cty p{margin:0;white-space:nowrap;transform-origin:0 0;transform:scaleX(.74);font-size:calc(13.5px * var(--k,1));line-height:1.45;width:135%}
.cty .xx{font-weight:700;font-size:calc(16px * var(--k,1));line-height:1.3;transform:scaleX(.8);width:125%;margin-top:3px;color:#c8102e;-webkit-text-stroke-color:#c8102e}
.cty .ten{font-weight:700;font-size:calc(21px * var(--k,1));line-height:1.25;transform:scaleX(.8);width:125%;margin-bottom:2px}
</style><div id="nhan">${over}${boxes}${logos}${cty}</div>`;
}

async function main() {
  const name = process.argv[2] || 'g7-phong-va-tri-benh-gan-chet-som';
  const W0 = JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), 'utf8')).kich_thuoc_goc[0];
  const SCALE = scaleFor(W0);
  const spec = JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), 'utf8'));
  let src = path.join(CONG_TY, spec.goc.replace(/^CONG-TY-NOBEN\//, ''));
  const work = path.join(DIR, '_work'); fs.mkdirSync(work, { recursive: true });
  // Tùy chọn "cat": [x0,y0,x1,y1] cắt ảnh gốc (bỏ lề, thước đo cm, mặt nhãn khác); toạ độ spec theo ảnh đã cắt.
  if (spec.cat) {
    const [cx0, cy0, cx1, cy1] = spec.cat; const catFile = path.join(work, `${name}-cat.png`);
    execFileSync('convert', [src, '-crop', `${cx1 - cx0}x${cy1 - cy0}+${cx0}+${cy0}`, '+repage', catFile]); src = catFile;
  }
  const bgFile = path.join(work, `${name}-nen-4x.jpg`);
  const xoa = [...(spec.chu_vector || []), ...(spec.khung || []), ...(spec.xoa || [])].filter((t) => t.xoa || t.vung)
    .map((t) => (t.vung ? t : { vung: t.xoa, chu: t.chu_cu || 'sang', le: t.le, nen: t.nen_xoa || (t.nen && t.nen.length < 8 ? t.nen : undefined) }));
  let goc = src;
  if (xoa.length) { goc = path.join(work, `${name}-sach.png`); execFileSync('python3', [path.join(__dirname, 'xoa-chu-nen.py'), src, goc, JSON.stringify(xoa)]); }
  execFileSync('convert', [goc, '-colorspace', 'RGB', '-filter', 'Lanczos', '-define', 'filter:lobes=4', '-resize', `${SCALE * 100}%`, '-colorspace', 'sRGB', '-unsharp', '0x2.4+0.9+0.02', '-quality', '95', bgFile]);
  if (spec.lam_net) execFileSync('python3', [path.join(__dirname, 'lam-net-hinh.py'), goc, bgFile, bgFile, JSON.stringify(spec.lam_net), String(SCALE)]);
  const bg = 'data:image/jpeg;base64,' + fs.readFileSync(bgFile).toString('base64');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const [W, H] = spec.kich_thuoc_goc;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  await page.setContent(html(spec, bg));
  await page.evaluate(() => document.fonts.ready);
  // Thu cỡ chữ từng khung cho vừa (không cắt nội dung)
  const fit = await page.evaluate(() => [...document.querySelectorAll('.khung')].map((k) => {
    const nd = k.querySelector('.nd'); let fs = +k.dataset.co;
    const over = () => nd.scrollHeight > k.clientHeight - parseFloat(getComputedStyle(k).paddingTop) - parseFloat(getComputedStyle(k).paddingBottom) + 1 || nd.scrollWidth > nd.clientWidth + 1;
    while (over() && fs > 5) { fs -= 0.25; nd.style.setProperty('--fs', fs + 'px'); }
    return fs;
  }));
  await page.screenshot({ path: path.join(DIR, `${name}.png`), type: 'png' });
  await page.pdf({ path: path.join(DIR, `${name}.pdf`), width: `${W}px`, height: `${H}px`, printBackground: true, pageRanges: '1' });
  await browser.close();
  console.log(`${name}: ${W * SCALE}×${H * SCALE} px, cỡ chữ khung: ${fit.map((f) => f + 'px').join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
